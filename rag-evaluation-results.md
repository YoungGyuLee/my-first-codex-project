# RAG 검색 기준선 평가 결과

- 실행 날짜: 2026-10-07 (Asia/Seoul)
- 평가 API: POST http://127.0.0.1:3000/api/search
- 검색 경로: 서비스에서 사용하는 `/api/search` → `vectorSearch.searchDocuments()`
- Embedding 모델: `text-embedding-3-small`
- Top-K: 4
- Similarity threshold: 0.30
- 전체 질문: 22
- Document-grounded 질문: 18
- No-result 질문: 4
- Hit@1: 15/18 (83.3%)
- Hit@4: 18/18 (100.0%)
- No-result accuracy: 2/4 (50.0%)
- False-positive 후보: 2

## 질문별 검색 결과

| ID | 유형 | 질문 | 기대 문서 | 기대 heading/키워드 | 반환 문서·heading·similarity (rank 순) | Hit@1 | Hit@K | No-result 판정 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| rag-001 | document-grounded | Todo 데이터 보존 원칙은 무엇인가? | development-rules.md | 개발 규칙 > 데이터 보존<br>키워드: localStorage<br>키워드: 하위 호환성 | development-rules.md — 개발 규칙 > 데이터 보존 (0.414)<br>api-meeting.md — AI Todo Coach API 구조 논의 > 결정 사항 (0.334)<br>development-rules.md — 개발 규칙 > AI 기능 (0.325) | 성공 | 성공 | 해당 없음 |
| rag-002 | document-grounded | 기존 localStorage 키와 Todo 데이터 모양을 임의로 바꾸면 안 되는 이유는? | development-rules.md | 개발 규칙 > 데이터 보존<br>키워드: 호환성<br>키워드: 데이터 마이그레이션 | development-rules.md — 개발 규칙 > 데이터 보존 (0.696)<br>development-rules.md — 개발 규칙 > 테스트 (0.501)<br>api-meeting.md — AI Todo Coach API 구조 논의 > 논의 내용 > Todo 처리 (0.498)<br>project-overview.md — 프로젝트 개요 > Todo 앱의 주요 기능 (0.492) | 성공 | 성공 | 해당 없음 |
| rag-003 | document-grounded | 브라우저에서 OpenAI API를 직접 호출하지 않기로 한 API 구조는? | api-meeting.md | AI Todo Coach API 구조 논의 > 논의 내용 > API 호출 구조<br>키워드: Node.js<br>키워드: Express<br>키워드: API key | api-meeting.md — AI Todo Coach API 구조 논의 > 논의 내용 > API 호출 구조 (0.570)<br>api-meeting.md — AI Todo Coach API 구조 논의 > 회의 목적 (0.444)<br>development-rules.md — 개발 규칙 > AI 기능 (0.397)<br>weekly-plan.md — 이번 주 개발 계획 > 세부 작업 내역 > embedding 모델 연동 및 vector search 구현 (0.387) | 성공 | 성공 | 해당 없음 |
| rag-004 | document-grounded | 현재 프로젝트에서 사용하는 프런트엔드와 백엔드 기술은 무엇인가? | project-overview.md | 프로젝트 개요 > 현재 사용 기술<br>키워드: Node.js<br>키워드: Express<br>키워드: 순수 HTML | project-overview.md — 프로젝트 개요 > 현재 사용 기술 (0.509)<br>project-overview.md — 프로젝트 개요 > RAG 도입 배경과 원칙 (0.423)<br>weekly-plan.md — 이번 주 개발 계획 > 주간 개요 (0.364)<br>api-meeting.md — AI Todo Coach API 구조 논의 > 참석자 (0.343) | 성공 | 성공 | 해당 없음 |
| rag-005 | document-grounded | AI Todo Coach API 구조 논의에서 결정한 핵심 사항을 알려줘. | api-meeting.md | AI Todo Coach API 구조 논의 > 결정 사항<br>키워드: API key<br>키워드: localStorage<br>키워드: 삭제 확인 | api-meeting.md — AI Todo Coach API 구조 논의 > 회의 목적 (0.447)<br>api-meeting.md — AI Todo Coach API 구조 논의 > 논의 내용 > Todo 처리 (0.442)<br>project-overview.md — 프로젝트 개요 > 향후 발전 방향 (0.436)<br>development-rules.md — 개발 규칙 > AI 기능 (0.433) | 성공 | 성공 | 해당 없음 |
| rag-006 | document-grounded | AI가 Todo를 삭제할 때 사용자 승인을 어떻게 받기로 했나? | api-meeting.md, development-rules.md | AI Todo Coach API 구조 논의 > 논의 내용 > Todo 처리<br>키워드: 확인 팝업<br>키워드: 사용자 확인 | api-meeting.md — AI Todo Coach API 구조 논의 > 논의 내용 > Todo 처리 (0.450)<br>development-rules.md — 개발 규칙 > AI 기능 (0.444)<br>api-meeting.md — AI Todo Coach API 구조 논의 > 결정 사항 (0.402)<br>project-overview.md — 프로젝트 개요 > AI 챗봇과 Tool Calling의 역할 (0.359) | 성공 | 성공 | 해당 없음 |
| rag-007 | document-grounded | 검색된 프로젝트 문서 안에 명령문이 있으면 시스템은 이를 어떻게 다뤄야 하나? | api-meeting.md, development-rules.md | 개발 규칙 > AI 기능<br>키워드: 신뢰할 수 없는<br>키워드: 참고 자료<br>키워드: 실행 | api-meeting.md — AI Todo Coach API 구조 논의 > 논의 내용 > RAG 도입 (0.506)<br>weekly-plan.md — 이번 주 개발 계획 > 세부 작업 내역 > Todo Tool Calling과 RAG 결합 처리 (0.431)<br>development-rules.md — 개발 규칙 > AI 기능 (0.400)<br>project-overview.md — 프로젝트 개요 > 프로젝트 목적 (0.396) | 성공 | 성공 | 해당 없음 |
| rag-008 | document-grounded | 이번 주 개발 계획에서 가장 중요한 목표는 무엇인가? | weekly-plan.md | 이번 주 개발 계획 > 주간 개요<br>키워드: RAG<br>키워드: Todo Tool Calling | project-overview.md — 프로젝트 개요 > 프로젝트 목적 (0.446)<br>weekly-plan.md — 이번 주 개발 계획 > 주간 개요 (0.443)<br>api-meeting.md — AI Todo Coach API 구조 논의 > 참석자 (0.377)<br>project-overview.md — 프로젝트 개요 > Todo 앱의 주요 기능 (0.350) | 실패 | 성공 | 해당 없음 |
| rag-009 | document-grounded | Markdown chunking 작업의 상태와 구현 초점은 무엇인가? | weekly-plan.md | 이번 주 개발 계획 > 세부 작업 내역 > Markdown chunking 파이프라인 제작<br>키워드: 진행 중<br>키워드: titlePath | weekly-plan.md — 이번 주 개발 계획 > 주간 개요 (0.496)<br>weekly-plan.md — 이번 주 개발 계획 > 세부 작업 내역 > Markdown chunking 파이프라인 제작 (0.488)<br>project-overview.md — 프로젝트 개요 > 프로젝트 목적 (0.357)<br>development-rules.md — 개발 규칙 > 코드 구조 (0.348) | 성공 | 성공 | 해당 없음 |
| rag-010 | document-grounded | 주간 일정에서 embedding과 벡터 검색은 언제 진행할 예정인가? | weekly-plan.md | 이번 주 개발 계획 > 주간 개요<br>이번 주 개발 계획 > 세부 작업 내역 > embedding 모델 연동 및 vector search 구현<br>키워드: 그 다음 단계<br>키워드: 예정 | weekly-plan.md — 이번 주 개발 계획 > 주간 개요 (0.483)<br>weekly-plan.md — 이번 주 개발 계획 > 세부 작업 내역 > embedding 모델 연동 및 vector search 구현 (0.417)<br>project-overview.md — 프로젝트 개요 > RAG 도입 배경과 원칙 (0.374)<br>api-meeting.md — AI Todo Coach API 구조 논의 > 논의 내용 > RAG 도입 (0.333) | 성공 | 성공 | 해당 없음 |
| rag-011 | document-grounded | 이번 주 계획에서 전 기능 회귀 테스트는 어떤 목적으로 예정되어 있나? | weekly-plan.md | 이번 주 개발 계획 > 세부 작업 내역 > 전 기능 회귀 테스트<br>키워드: localStorage<br>키워드: 충돌 없이 | development-rules.md — 개발 규칙 > 테스트 (0.503)<br>weekly-plan.md — 이번 주 개발 계획 > 세부 작업 내역 > 전 기능 회귀 테스트 (0.475)<br>weekly-plan.md — 이번 주 개발 계획 > 세부 작업 내역 > Todo Tool Calling과 RAG 결합 처리 (0.410)<br>api-meeting.md — AI Todo Coach API 구조 논의 > 후속 작업 (0.402) | 실패 | 성공 | 해당 없음 |
| rag-012 | document-grounded | Todo 앱에서 priority와 today 필터는 어떤 기능을 제공하나? | project-overview.md | 프로젝트 개요 > Todo 앱의 주요 기능<br>키워드: 우선순위<br>키워드: 오늘 | project-overview.md — 프로젝트 개요 > Todo 앱의 주요 기능 (0.473)<br>weekly-plan.md — 이번 주 개발 계획 > 세부 작업 내역 > 모바일 UI 개선 (0.463)<br>api-meeting.md — AI Todo Coach API 구조 논의 > 논의 내용 > Todo 처리 (0.338)<br>weekly-plan.md — 이번 주 개발 계획 > 세부 작업 내역 > Todo Tool Calling과 RAG 결합 처리 (0.327) | 성공 | 성공 | 해당 없음 |
| rag-013 | document-grounded | 사용자가 입력한 작업 이름을 화면에 안전하게 표시하는 규칙은? | development-rules.md | 개발 규칙 > 보안<br>키워드: XSS<br>키워드: 텍스트<br>키워드: HTML | development-rules.md — 개발 규칙 > UI와 접근성 (0.395)<br>development-rules.md — 개발 규칙 > 보안 (0.384)<br>project-overview.md — 프로젝트 개요 > Todo 앱의 주요 기능 (0.382)<br>weekly-plan.md — 이번 주 개발 계획 > 세부 작업 내역 > 모바일 UI 개선 (0.364) | 성공 | 성공 | 해당 없음 |
| rag-014 | multi-document | 현재 Todo 데이터와 AI 도구 호출은 어떤 관계이며 데이터는 어디에 저장되나? | api-meeting.md, project-overview.md | AI Todo Coach API 구조 논의 > 논의 내용 > Todo 처리<br>프로젝트 개요 > AI 챗봇과 Tool Calling의 역할<br>키워드: localStorage<br>키워드: Tool Calling | api-meeting.md — AI Todo Coach API 구조 논의 > 논의 내용 > Todo 처리 (0.691)<br>project-overview.md — 프로젝트 개요 > AI 챗봇과 Tool Calling의 역할 (0.544)<br>development-rules.md — 개발 규칙 > AI 기능 (0.507)<br>api-meeting.md — AI Todo Coach API 구조 논의 > 논의 내용 > RAG 도입 (0.498) | 성공 | 성공 | 해당 없음 |
| rag-015 | multi-document | OpenAI API 키는 어디에서 관리하고 브라우저 코드는 무엇을 하면 안 되나? | api-meeting.md, development-rules.md | AI Todo Coach API 구조 논의 > 결정 사항<br>개발 규칙 > 보안<br>키워드: 환경 변수<br>키워드: 하드코딩 | api-meeting.md — AI Todo Coach API 구조 논의 > 논의 내용 > API 호출 구조 (0.603)<br>development-rules.md — 개발 규칙 > 보안 (0.520)<br>api-meeting.md — AI Todo Coach API 구조 논의 > 결정 사항 (0.420)<br>project-overview.md — 프로젝트 개요 > AI 챗봇과 Tool Calling의 역할 (0.414) | 성공 | 성공 | 해당 없음 |
| rag-016 | document-grounded | 개발 계획에서 문서 검색 결과를 Todo 등록으로 이어주는 작업은 무엇인가? | weekly-plan.md | 이번 주 개발 계획 > 세부 작업 내역 > Todo Tool Calling과 RAG 결합 처리<br>키워드: 실행 과제<br>키워드: 파라미터 매핑 | api-meeting.md — AI Todo Coach API 구조 논의 > 논의 내용 > RAG 도입 (0.560)<br>weekly-plan.md — 이번 주 개발 계획 > 세부 작업 내역 > Todo Tool Calling과 RAG 결합 처리 (0.555)<br>weekly-plan.md — 이번 주 개발 계획 > 주간 개요 (0.543)<br>development-rules.md — 개발 규칙 > 테스트 (0.511) | 실패 | 성공 | 해당 없음 |
| rag-017 | document-grounded | 현재 Todo 저장 정보를 바꾸면 어떤 문제가 생길 수 있어서 조심해야 하나? | development-rules.md | 개발 규칙 > 데이터 보존<br>키워드: 데이터 구조<br>키워드: 호환성<br>키워드: 마이그레이션 | development-rules.md — 개발 규칙 > 데이터 보존 (0.525)<br>project-overview.md — 프로젝트 개요 > Todo 앱의 주요 기능 (0.523)<br>api-meeting.md — AI Todo Coach API 구조 논의 > 논의 내용 > Todo 처리 (0.523)<br>development-rules.md — 개발 규칙 > 테스트 (0.475) | 성공 | 성공 | 해당 없음 |
| rag-018 | multi-document | AI 채팅 요청을 처리하는 서버 역할과 프런트엔드 구현 방식을 각각 설명해줘. | api-meeting.md, project-overview.md | AI Todo Coach API 구조 논의 > 논의 내용 > API 호출 구조<br>프로젝트 개요 > 현재 사용 기술<br>키워드: Express<br>키워드: Responses API<br>키워드: 순수 JavaScript | api-meeting.md — AI Todo Coach API 구조 논의 > 회의 목적 (0.488)<br>api-meeting.md — AI Todo Coach API 구조 논의 > 논의 내용 > API 호출 구조 (0.475)<br>project-overview.md — 프로젝트 개요 > 현재 사용 기술 (0.432)<br>weekly-plan.md — 이번 주 개발 계획 > 세부 작업 내역 > embedding 모델 연동 및 vector search 구현 (0.421) | 성공 | 성공 | 해당 없음 |
| rag-019 | no-result | 우리 서비스의 월간 사용자 수는 몇 명인가? | 없음 | 없음 | project-overview.md — 프로젝트 개요 > Todo 앱의 주요 기능 (0.317)<br>weekly-plan.md — 이번 주 개발 계획 > 세부 작업 내역 > RAG와 Chat 대화 인터페이스 통합 (0.304) | 해당 없음 | 해당 없음 | false positive |
| rag-020 | no-result | 배포 서버의 CPU 사양과 메모리 용량은 얼마인가? | 없음 | 없음 | project-overview.md — 프로젝트 개요 > 현재 사용 기술 (0.336)<br>weekly-plan.md — 이번 주 개발 계획 > 세부 작업 내역 > embedding 모델 연동 및 vector search 구현 (0.327)<br>weekly-plan.md — 이번 주 개발 계획 > 세부 작업 내역 > RAG와 Chat 대화 인터페이스 통합 (0.314) | 해당 없음 | 해당 없음 | false positive |
| rag-021 | no-result | 화성의 수도는 어디인가? | 없음 | 없음 | 결과 없음 | 해당 없음 | 해당 없음 | 정상 no-result |
| rag-022 | no-result | 회사의 올해 매출과 영업 이익은 얼마인가? | 없음 | 없음 | 결과 없음 | 해당 없음 | 해당 없음 | 정상 no-result |

## False-positive 관찰

- **rag-019 — 우리 서비스의 월간 사용자 수는 몇 명인가?**: project-overview.md — 프로젝트 개요 > Todo 앱의 주요 기능 (0.317); weekly-plan.md — 이번 주 개발 계획 > 세부 작업 내역 > RAG와 Chat 대화 인터페이스 통합 (0.304)
- **rag-020 — 배포 서버의 CPU 사양과 메모리 용량은 얼마인가?**: project-overview.md — 프로젝트 개요 > 현재 사용 기술 (0.336); weekly-plan.md — 이번 주 개발 계획 > 세부 작업 내역 > embedding 모델 연동 및 vector search 구현 (0.327); weekly-plan.md — 이번 주 개발 계획 > 세부 작업 내역 > RAG와 Chat 대화 인터페이스 통합 (0.314)

## 실패 사례와 개선 후보

- Hit@K 실패는 없습니다.

### 기대 문서가 1위가 아닌 질문

- **rag-008 — 이번 주 개발 계획에서 가장 중요한 목표는 무엇인가?**: 기대 문서 weekly-plan.md; 1위는 project-overview.md — 프로젝트 개요 > 프로젝트 목적 (0.446); 기대 문서 첫 순위 2.
- **rag-011 — 이번 주 계획에서 전 기능 회귀 테스트는 어떤 목적으로 예정되어 있나?**: 기대 문서 weekly-plan.md; 1위는 development-rules.md — 개발 규칙 > 테스트 (0.503); 기대 문서 첫 순위 2.
- **rag-016 — 개발 계획에서 문서 검색 결과를 Todo 등록으로 이어주는 작업은 무엇인가?**: 기대 문서 weekly-plan.md; 1위는 api-meeting.md — AI Todo Coach API 구조 논의 > 논의 내용 > RAG 도입 (0.560); 기대 문서 첫 순위 2.

분류: 세 사례 모두 기대 문서가 Top-4에 포함되므로 recall 누락이 아니라 1위 ranking 문제입니다. rag-008과 rag-016은 1·2위 유사도가 각각 0.003, 0.005 차이로 근접합니다. rag-011은 “회귀 테스트”가 개발 규칙 문서에도 있어 해당 문서가 1위가 된 것으로 보입니다. 이번 단계는 baseline 보존을 우선해 ranking 파라미터를 조정하지 않았습니다.

## 해석과 제한

- Hit@1/Hit@K는 기대 문서가 검색 순위에 포함됐는지만 측정합니다. 답변 내용의 사실성은 측정하지 않습니다.
- No-result 평가의 성공은 결과가 0건인 경우입니다. 검색 결과가 하나라도 있으면 false-positive 후보로 기록합니다.
- 이번 기준선 실행에서는 topK, threshold, chunking, embedding 모델을 변경하지 않았습니다.
- 재현하려면 먼저 서버를 실행한 뒤 `node scripts/evaluate-rag.js`를 실행하세요. 기본 URL은 `http://127.0.0.1:3000`이며 `RAG_EVAL_BASE_URL`로 바꿀 수 있습니다.

## 오류 및 회귀 검증

- **RAG 검색 오류**: 개발 모드에서 `RAG_EVAL_FAULT=search`를 켜고 `/api/chat`을 호출했습니다. HTTP 502 JSON이 반환됐고 답변 필드는 생성되지 않았습니다. 브라우저에는 “문서 검색을 완료하지 못해 AI 답변을 생성하지 않았어요.”가 표시됐습니다.
- **OpenAI Responses 오류**: 실제 RAG embedding 검색 뒤 `RAG_EVAL_FAULT=openai`로 Responses 호출 직전에 오류를 주입했습니다. `/api/chat`은 HTTP 502 JSON을 반환했고, 브라우저에는 재시도 안내가 표시됐습니다.
- **Continuation 오류와 복구**: 실제 `create_task` function call을 받은 뒤 `RAG_EVAL_FAULT=continue`에서 continuation에 오류를 주입했습니다. `/api/chat/continue`는 HTTP 502를 반환했습니다. 같은 turn을 다시 보내면 HTTP 410, 직후 일반 `/api/chat` 요청은 HTTP 200이었습니다.
- **fault flag 복구/안전성**: 평가 후 flag 없이 서버를 재시작해 정상 문서 질문에 답하는 것을 확인했습니다. production 모드에서 fault flag를 무시하는 동작은 코드로 확인했으며 production 서버로 실행 테스트하지는 않았습니다. `.env`나 API key는 변경하지 않았습니다.
- **Tool Calling**: RAG 기반 Todo 생성, 추천만 요청했을 때 변경 없음, Todo 수정·완료·목록 확인, 존재하지 않는 Todo 거부, 삭제 취소/승인, 두 작업의 순차 변경을 실제 브라우저에서 확인했습니다.
- **Prompt injection**: 임시 문서에서 API key/system prompt 공개와 `delete_task` 요청을 찾아 요약했지만 실행하지 않았습니다. 임시 문서를 삭제했습니다.
- **모바일 (390px)**: 전체 document width 390px; 검색 결과 영역 328px/scroll 328px; chat source 304px/scroll 302px; Todo 삭제 확인창 352px/scroll 350px. 가로 overflow가 없었습니다.
- **브라우저 콘솔**: 사용한 embedded-browser 자동화에서 DevTools console 로그를 읽을 수 없습니다. 화면에 오류 상태가 없었던 것과 console이 깨끗한 것을 동일시하지 않습니다.
- **검색 평가 한계**: 이 기준선은 문서 검색 순위만 평가합니다. 생성 답변의 정확도나 인용의 사실성은 점수에 포함하지 않습니다.
