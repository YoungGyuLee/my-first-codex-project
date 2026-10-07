const fs = require('fs/promises');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATASET_PATH = path.join(ROOT, 'rag-evaluation.json');
const RESULTS_PATH = path.join(ROOT, 'rag-evaluation-results.md');
const BASE_URL = (process.env.RAG_EVAL_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/u, '');

function percentage(numerator, denominator) {
  return denominator ? `${(numerator / denominator * 100).toFixed(1)}%` : 'N/A';
}

function escapeCell(value) {
  return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function resultLabel(result) {
  const titlePath = result.titlePath?.length ? result.titlePath.join(' > ') : '문서 본문';
  return `${result.filename} — ${titlePath} (${result.similarity.toFixed(3)})`;
}

async function main() {
  const cases = JSON.parse(await fs.readFile(DATASET_PATH, 'utf8'));
  if (!Array.isArray(cases) || cases.length === 0) throw new Error('평가 질문 데이터가 비어 있습니다.');

  const evaluations = [];
  for (const testCase of cases) {
    const response = await fetch(`${BASE_URL}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: testCase.question }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`${testCase.id}: /api/search HTTP ${response.status}: ${payload.error || '알 수 없는 오류'}`);
    }

    const results = Array.isArray(payload.results) ? payload.results : [];
    const expectedDocuments = testCase.expectedDocuments;
    const expectedNoResult = expectedDocuments.length === 0;
    evaluations.push({
      testCase,
      topK: payload.topK,
      threshold: payload.threshold,
      reason: payload.reason || '검색 결과 있음',
      results,
      top1Hit: !expectedNoResult && expectedDocuments.includes(results[0]?.filename),
      topKHit: !expectedNoResult && results.some((result) => expectedDocuments.includes(result.filename)),
      noResultCorrect: expectedNoResult ? results.length === 0 : null,
      falsePositive: expectedNoResult && results.length > 0,
    });
    process.stdout.write(`${testCase.id} ${evaluations.at(-1).reason} (${results.length}건)\n`);
  }

  const grounded = evaluations.filter((item) => item.testCase.expectedDocuments.length > 0);
  const noResults = evaluations.filter((item) => item.testCase.expectedDocuments.length === 0);
  const hit1 = grounded.filter((item) => item.top1Hit).length;
  const hitK = grounded.filter((item) => item.topKHit).length;
  const noResultCorrect = noResults.filter((item) => item.noResultCorrect).length;
  const falsePositives = noResults.filter((item) => item.falsePositive);
  const topK = evaluations[0]?.topK ?? 4;
  const threshold = evaluations[0]?.threshold ?? 0.30;
  const runDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());

  const lines = [
    '# RAG 검색 기준선 평가 결과',
    '',
    `- 실행 날짜: ${runDate} (Asia/Seoul)`,
    `- 평가 API: POST ${BASE_URL}/api/search`,
    '- 검색 경로: 서비스에서 사용하는 `/api/search` → `vectorSearch.searchDocuments()`',
    '- Embedding 모델: `text-embedding-3-small`',
    `- Top-K: ${topK}`,
    `- Similarity threshold: ${threshold.toFixed(2)}`,
    `- 전체 질문: ${evaluations.length}`,
    `- Document-grounded 질문: ${grounded.length}`,
    `- No-result 질문: ${noResults.length}`,
    `- Hit@1: ${hit1}/${grounded.length} (${percentage(hit1, grounded.length)})`,
    `- Hit@${topK}: ${hitK}/${grounded.length} (${percentage(hitK, grounded.length)})`,
    `- No-result accuracy: ${noResultCorrect}/${noResults.length} (${percentage(noResultCorrect, noResults.length)})`,
    `- False-positive 후보: ${falsePositives.length}`,
    '',
    '## 질문별 검색 결과',
    '',
    '| ID | 유형 | 질문 | 기대 문서 | 기대 heading/키워드 | 반환 문서·heading·similarity (rank 순) | Hit@1 | Hit@K | No-result 판정 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];

  for (const item of evaluations) {
    const expected = item.testCase.expectedDocuments.length ? item.testCase.expectedDocuments.join(', ') : '없음';
    const expectedDetails = [...item.testCase.expectedTitlePaths, ...item.testCase.keywords.map((word) => `키워드: ${word}`)].join('<br>') || '없음';
    const actual = item.results.length ? item.results.map(resultLabel).join('<br>') : '결과 없음';
    lines.push([
      item.testCase.id,
      item.testCase.type,
      escapeCell(item.testCase.question),
      escapeCell(expected),
      escapeCell(expectedDetails),
      escapeCell(actual),
      item.testCase.expectedDocuments.length ? (item.top1Hit ? '성공' : '실패') : '해당 없음',
      item.testCase.expectedDocuments.length ? (item.topKHit ? '성공' : '실패') : '해당 없음',
      item.testCase.expectedDocuments.length ? '해당 없음' : (item.noResultCorrect ? '정상 no-result' : 'false positive'),
    ].map((value) => escapeCell(value)).join(' | ').replace(/^/u, '| ').concat(' |'));
  }

  lines.push('', '## False-positive 관찰', '');
  if (falsePositives.length) {
    for (const item of falsePositives) {
      lines.push(`- **${item.testCase.id} — ${item.testCase.question}**: ${item.results.map(resultLabel).join('; ')}`);
    }
  } else {
    lines.push('- No-result 질문에서 threshold 이상으로 반환된 문서가 없습니다.');
  }

  lines.push('', '## 실패 사례와 개선 후보', '');
  const misses = grounded.filter((item) => !item.topKHit);
  const top1Misses = grounded.filter((item) => !item.top1Hit);
  if (misses.length) {
    for (const item of misses) {
      lines.push(`- **${item.testCase.id} — ${item.testCase.question}**: 기대 문서 ${item.testCase.expectedDocuments.join(', ')}; 실제 결과 ${item.results.length ? item.results.map(resultLabel).join('; ') : '없음'}. 검색 ranking 또는 chunk 내용을 검토할 후보입니다.`);
    }
  } else {
    lines.push('- Hit@K 실패는 없습니다.');
  }
  if (top1Misses.length) {
    lines.push('', '### 기대 문서가 1위가 아닌 질문', '');
    for (const item of top1Misses) {
      const first = item.results[0] ? resultLabel(item.results[0]) : '결과 없음';
      const expectedRank = item.results.findIndex((result) => item.testCase.expectedDocuments.includes(result.filename)) + 1;
      lines.push(`- **${item.testCase.id} — ${item.testCase.question}**: 기대 문서 ${item.testCase.expectedDocuments.join(', ')}; 1위는 ${first}; 기대 문서 첫 순위 ${expectedRank || '검색되지 않음'}.`);
    }
  }

  lines.push(
    '',
    '## 해석과 제한',
    '',
    '- Hit@1/Hit@K는 기대 문서가 검색 순위에 포함됐는지만 측정합니다. 답변 내용의 사실성은 측정하지 않습니다.',
    '- No-result 평가의 성공은 결과가 0건인 경우입니다. 검색 결과가 하나라도 있으면 false-positive 후보로 기록합니다.',
    '- 이번 기준선 실행에서는 topK, threshold, chunking, embedding 모델을 변경하지 않았습니다.',
    '- 재현하려면 먼저 서버를 실행한 뒤 `node scripts/evaluate-rag.js`를 실행하세요. 기본 URL은 `http://127.0.0.1:3000`이며 `RAG_EVAL_BASE_URL`로 바꿀 수 있습니다.',
    '',
  );

  const previousReport = await fs.readFile(RESULTS_PATH, 'utf8').catch(() => '');
  const preservedReliabilityNotes = previousReport.match(/\n## 오류 및 회귀 검증\n[\s\S]*$/u)?.[0] || '';
  await fs.writeFile(RESULTS_PATH, `${lines.join('\n')}${preservedReliabilityNotes}\n`, 'utf8');
  process.stdout.write(`\n평가 결과 저장: ${path.relative(ROOT, RESULTS_PATH)}\n`);
  process.stdout.write(`Hit@1 ${hit1}/${grounded.length}; Hit@${topK} ${hitK}/${grounded.length}; no-result ${noResultCorrect}/${noResults.length}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
