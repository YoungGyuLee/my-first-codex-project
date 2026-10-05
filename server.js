require('dotenv').config();

const express = require('express');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_MODEL = 'gpt-4.1-mini';
const MAX_MESSAGE_LENGTH = 4000;

app.use(express.json({ limit: '16kb' }));
app.use(express.static(__dirname));

app.post('/api/chat', async (req, res) => {
  const { message } = req.body || {};
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: '메시지를 입력해 주세요.' });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(413).json({ error: `메시지는 ${MAX_MESSAGE_LENGTH}자 이내로 입력해 주세요.` });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: '서버에 OpenAI API 키가 설정되지 않았어요.' });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: OPENAI_MODEL,
      instructions: '당신은 친절하고 도움이 되는 한국어 AI 도우미입니다. 사용자의 언어에 맞춰 자연스럽고 명확하게 답변하세요.',
      input: message.trim(),
    });
    return res.json({ reply: response.output_text || '답변을 만들지 못했어요. 다시 질문해 주세요.' });
  } catch (error) {
    console.error('OpenAI Responses API error:', error.status || error.message);
    return res.status(502).json({ error: 'AI 답변을 가져오는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.' });
  }
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: '요청 본문이 올바른 JSON이 아니에요.' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: '요청 본문이 너무 커요.' });
  }
  return next(error);
});

app.listen(PORT, () => {
  console.log(`Todo app is running at http://localhost:${PORT}`);
});
