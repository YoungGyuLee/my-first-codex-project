const fault = process.env.RAG_EVAL_FAULT;
const baseUrl = (process.env.RAG_EVAL_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/u, '');

async function post(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json().catch(() => ({})) };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function testDirectFailure() {
  const result = await post('/api/chat', {
    message: '이번 주 개발 계획을 간단히 알려줘.',
    todos: [],
    history: [],
  });
  assert(result.status === 502, `HTTP 502를 기대했지만 ${result.status}을 받았습니다.`);
  assert(typeof result.body.error === 'string' && !result.body.reply,
    '오류 JSON 응답이 없거나 AI 답변이 생성됐습니다.');
  process.stdout.write(`${fault} fault: HTTP ${result.status}, reply 없이 JSON 오류 반환\n`);
}

async function testContinuationFailure() {
  const initial = await post('/api/chat', {
    message: 'Stage 6 평가용 임시 작업을 오늘 할 일로 추가해줘.',
    todos: [],
    history: [],
  });
  assert(initial.status === 200, `초기 도구 요청이 HTTP ${initial.status}로 실패했습니다.`);
  assert(initial.body.type === 'tool_calls' && Array.isArray(initial.body.calls) && initial.body.calls.length === 1,
    '초기 응답에서 단일 도구 호출을 받지 못했습니다.');

  const call = initial.body.calls[0];
  assert(call.name === 'create_task', `create_task 대신 ${call.name} 호출을 받았습니다.`);
  const task = {
    id: 'stage6-evaluation-ephemeral-task',
    text: call.arguments.text,
    completed: false,
    priority: call.arguments.priority,
    today: call.arguments.today,
    ...(call.arguments.date ? { date: call.arguments.date } : {}),
  };
  const continuation = await post('/api/chat/continue', {
    turnId: initial.body.turnId,
    outputs: [{
      callId: call.callId,
      result: { status: 'success', message: '평가용 임시 작업을 추가했습니다.', task },
    }],
    todos: [task],
  });
  assert(continuation.status === 502 && typeof continuation.body.error === 'string',
    `Continuation 오류에서 HTTP 502 JSON을 기대했지만 ${continuation.status}을 받았습니다.`);
  const staleContinuation = await post('/api/chat/continue', {
    turnId: initial.body.turnId,
    outputs: [{
      callId: call.callId,
      result: { status: 'success', message: '평가용 임시 작업을 추가했습니다.', task },
    }],
    todos: [task],
  });
  assert(staleContinuation.status === 410,
    `실패한 pending turn 재사용은 HTTP 410이어야 하지만 ${staleContinuation.status}을 받았습니다.`);

  const followUp = await post('/api/chat', {
    message: '프로젝트에서 사용하는 서버 기술은 무엇인가?',
    todos: [task],
    history: [],
  });
  assert(followUp.status === 200 && followUp.body.type === 'message',
    `실패 후 정상 요청이 복구되지 않았습니다 (HTTP ${followUp.status}).`);
  process.stdout.write('continue fault: HTTP 502; 재사용한 pending turn은 HTTP 410; 후속 일반 요청은 HTTP 200\n');
}

async function main() {
  assert(['search', 'openai', 'continue'].includes(fault),
    'RAG_EVAL_FAULT를 search, openai, continue 중 하나로 설정하세요.');
  if (fault === 'continue') await testContinuationFailure();
  else await testDirectFailure();
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
