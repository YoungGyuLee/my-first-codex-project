const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const DATA_DIRECTORY = path.join(__dirname, 'data');
const DOCUMENTS_PATH = path.join(DATA_DIRECTORY, 'documents.json');
const MAX_DOCUMENT_BYTES = 1024 * 1024;
const TARGET_CHUNK_TOKENS = 500;
const OVERLAP_TOKENS = 80;

let writeQueue = Promise.resolve();

function publicDocument(document) {
  return {
    id: document.id,
    filename: document.filename,
    chunkCount: document.chunks.length,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

function normalizeFilename(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > 255) return null;
  const basename = value.trim().replace(/\\/g, '/').split('/').pop();
  if (!basename || basename === '.' || basename === '..') return null;
  const extensionIndex = basename.lastIndexOf('.');
  if (extensionIndex <= 0) return null;
  const extension = basename.slice(extensionIndex).toLowerCase();
  if (!['.md', '.txt'].includes(extension)) return null;

  const stem = basename.slice(0, extensionIndex)
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[<>:"|?*]/g, '_')
    .trim();
  if (!stem) return null;
  return `${stem}${extension}`;
}

function normalizeContent(value) {
  if (typeof value !== 'string') return { error: '문서 내용은 UTF-8 문자열이어야 해요.' };
  const encoded = Buffer.from(value, 'utf8');
  if (encoded.toString('utf8') !== value) return { error: '문서에 올바르지 않은 UTF-8 문자가 있어요.' };
  if (encoded.byteLength > MAX_DOCUMENT_BYTES) return { error: '문서 크기는 UTF-8 기준 1MB 이하여야 해요.', status: 413 };

  const content = value.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').normalize('NFC');
  if (!content.trim()) return { error: '빈 문서는 등록할 수 없어요.' };
  if (content.includes('\u0000')) return { error: '문서에 허용되지 않는 문자가 있어요.' };
  return { content };
}

function roughTokenCount(text) {
  const units = text.match(/[\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]|[\p{L}\p{N}]+|[^\s]/gu);
  return units ? units.length : 0;
}

function sentenceParts(text) {
  const parts = text.match(/[^.!?。！？\n]+(?:[.!?。！？]+|\n+|$)/gu) || [text];
  return parts.map((part) => part.trim()).filter(Boolean);
}

function splitOversizedSentence(sentence) {
  const words = sentence.match(/\S+\s*/gu) || [sentence];
  const parts = [];
  let current = '';
  for (const word of words) {
    if (roughTokenCount(word) > TARGET_CHUNK_TOKENS) {
      if (current.trim()) parts.push(current.trim());
      current = '';
      const characters = Array.from(word);
      let fragment = '';
      for (const character of characters) {
        if (roughTokenCount(fragment + character) > TARGET_CHUNK_TOKENS) {
          parts.push(fragment.trim());
          fragment = '';
        }
        fragment += character;
      }
      current = fragment;
    } else if (current && roughTokenCount(current + word) > TARGET_CHUNK_TOKENS) {
      parts.push(current.trim());
      current = word;
    } else {
      current += word;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function parseSections(content, isMarkdown) {
  const sections = [];
  let titlePath = [];
  let paragraphs = [];
  let currentLines = [];
  let inCodeFence = false;

  const flushParagraph = () => {
    const paragraph = currentLines.join('\n').trim();
    if (paragraph) paragraphs.push(paragraph);
    currentLines = [];
  };
  const flushSection = () => {
    flushParagraph();
    if (paragraphs.length) sections.push({ titlePath: [...titlePath], paragraphs });
    paragraphs = [];
  };

  for (const line of content.split('\n')) {
    const heading = isMarkdown && !inCodeFence ? line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/u) : null;
    if (heading) {
      flushSection();
      const level = heading[1].length;
      titlePath = titlePath.slice(0, level - 1);
      titlePath.push(heading[2].trim());
      continue;
    }

    if (/^\s*```/.test(line)) inCodeFence = !inCodeFence;
    if (!inCodeFence && !line.trim()) flushParagraph();
    else currentLines.push(line);
  }
  flushSection();
  return sections;
}

function chunkSection(section, documentId, filename, firstIndex) {
  const paragraphs = [];
  for (const paragraph of section.paragraphs) {
    if (roughTokenCount(paragraph) <= TARGET_CHUNK_TOKENS) {
      paragraphs.push(paragraph);
    } else {
      paragraphs.push(...sentenceParts(paragraph).flatMap(splitOversizedSentence));
    }
  }

  const chunks = [];
  let current = [];
  const saveCurrent = () => {
    const content = current.join('\n\n').trim();
    if (content) chunks.push(content);
  };

  for (const paragraph of paragraphs) {
    const candidate = [...current, paragraph];
    if (current.length && roughTokenCount(candidate.join('\n\n')) > TARGET_CHUNK_TOKENS) {
      saveCurrent();
      const overlap = [];
      for (let index = current.length - 1; index >= 0; index -= 1) {
        const next = [current[index], ...overlap];
        if (roughTokenCount(next.join('\n\n')) > OVERLAP_TOKENS) break;
        overlap.unshift(current[index]);
      }
      current = [...overlap, paragraph];
      while (current.length > 1 && roughTokenCount(current.join('\n\n')) > TARGET_CHUNK_TOKENS) {
        current.shift();
      }
    } else {
      current = candidate;
    }
  }
  saveCurrent();

  return chunks.map((text, index) => {
    const id = `chunk_${crypto.randomUUID()}`;
    return {
      id,
      documentId,
      chunkIndex: firstIndex + index,
      content: text,
      titlePath: section.titlePath,
      source: { filename, titlePath: section.titlePath },
    };
  });
}

function createChunks(content, filename, documentId) {
  const markdown = filename.toLowerCase().endsWith('.md');
  const sections = parseSections(content, markdown);
  const chunks = [];
  for (const section of sections) {
    chunks.push(...chunkSection(section, documentId, filename, chunks.length));
  }
  return chunks;
}

async function readDocuments() {
  let raw;
  try {
    raw = await fs.readFile(DOCUMENTS_PATH, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  const parsed = JSON.parse(raw);
  if (!parsed || !Array.isArray(parsed.documents)) throw new Error('문서 저장 파일의 구조가 올바르지 않아요.');
  return parsed.documents;
}

async function writeDocuments(documents) {
  await fs.mkdir(DATA_DIRECTORY, { recursive: true });
  const temporaryPath = `${DOCUMENTS_PATH}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify({ documents }, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  await fs.rename(temporaryPath, DOCUMENTS_PATH);
}

function withWriteLock(operation) {
  const result = writeQueue.then(operation);
  writeQueue = result.catch(() => {});
  return result;
}

async function listDocuments() {
  return (await readDocuments()).map(publicDocument);
}

async function addDocument(filenameInput, contentInput) {
  const filename = normalizeFilename(filenameInput);
  if (!filename) return { error: '파일명은 .txt 또는 .md 문서여야 해요.' };
  const normalized = normalizeContent(contentInput);
  if (normalized.error) return normalized;

  const content = normalized.content;
  const hash = crypto.createHash('sha256').update(content, 'utf8').digest('hex');
  return withWriteLock(async () => {
    const documents = await readDocuments();
    const duplicate = documents.find((document) => document.filename === filename && document.hash === hash);
    if (duplicate) return { document: publicDocument(duplicate), duplicate: true };

    const now = new Date().toISOString();
    const id = `doc_${crypto.randomUUID()}`;
    const document = {
      id,
      filename,
      hash,
      createdAt: now,
      updatedAt: now,
      chunks: createChunks(content, filename, id),
    };
    documents.push(document);
    await writeDocuments(documents);
    return { document: publicDocument(document), duplicate: false };
  });
}

async function deleteDocument(id) {
  return withWriteLock(async () => {
    const documents = await readDocuments();
    const index = documents.findIndex((document) => document.id === id);
    if (index === -1) return false;
    documents.splice(index, 1);
    await writeDocuments(documents);
    return true;
  });
}

module.exports = { addDocument, deleteDocument, listDocuments };
