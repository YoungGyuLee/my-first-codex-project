# 오늘의 할 일

한국어 Todo 앱과 AI 채팅을 제공하는 작은 Express 앱입니다. Todo 데이터는 기존처럼 브라우저의 `localStorage`에 저장됩니다.

## 실행

1. Node.js 18 이상을 설치한 뒤 프로젝트 폴더에서 의존성을 설치합니다.

   ```bash
   npm install
   ```

2. `.env.example`을 `.env`로 복사하고 `OPENAI_API_KEY`에 본인의 API 키를 설정합니다. 실제 키는 저장소에 커밋하지 마세요.

3. 서버를 실행합니다.

   ```bash
   npm start
   ```

4. 브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다. 채팅 요청은 서버의 `/api/chat`을 통해 OpenAI Responses API로 전달됩니다.
