function cosineSimilarity(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length === 0 || left.length !== right.length) {
    return null;
  }
  let dotProduct = 0;
  let leftMagnitudeSquared = 0;
  let rightMagnitudeSquared = 0;
  for (let index = 0; index < left.length; index += 1) {
    if (!Number.isFinite(left[index]) || !Number.isFinite(right[index])) return null;
    dotProduct += left[index] * right[index];
    leftMagnitudeSquared += left[index] ** 2;
    rightMagnitudeSquared += right[index] ** 2;
  }

  if (!Number.isFinite(dotProduct) || !Number.isFinite(leftMagnitudeSquared)
      || !Number.isFinite(rightMagnitudeSquared) || leftMagnitudeSquared === 0 || rightMagnitudeSquared === 0) {
    return null;
  }
  const similarity = dotProduct / (Math.sqrt(leftMagnitudeSquared) * Math.sqrt(rightMagnitudeSquared));
  return Number.isFinite(similarity) ? similarity : null;
}

function searchChunks(queryEmbedding, chunks, { model, topK, threshold }) {
  const ranked = [];
  for (const chunk of chunks) {
    if (chunk.embeddingModel !== model || typeof chunk.content !== 'string') continue;
    const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
    if (similarity === null || similarity < threshold) continue;
    ranked.push({
      chunkId: chunk.chunkId,
      documentId: chunk.documentId,
      filename: chunk.filename,
      chunkIndex: chunk.chunkIndex,
      titlePath: chunk.titlePath.filter((part) => typeof part === 'string'),
      content: chunk.content,
      similarity,
    });
  }
  ranked.sort((left, right) => right.similarity - left.similarity);
  const documentCounts = new Map();
  const diverseResults = [];
  for (const result of ranked) {
    const documentKey = result.documentId || result.filename;
    const count = documentCounts.get(documentKey) || 0;
    if (count >= 2) continue;
    documentCounts.set(documentKey, count + 1);
    diverseResults.push(result);
    if (diverseResults.length === topK) break;
  }
  return diverseResults;
}

async function searchDocuments(query, { getOpenAIClient, documentStore, model, topK = 4, threshold = 0.30 }) {
  const corpus = await documentStore.listSearchChunks();
  if (corpus.documentCount === 0) return { reason: 'no_documents', results: [] };

  const hasEmbeddings = corpus.chunks.some((chunk) => (
    chunk.embeddingModel === model
    && Array.isArray(chunk.embedding)
    && chunk.embedding.length > 0
    && chunk.embedding.every(Number.isFinite)
  ));
  if (!hasEmbeddings) return { reason: 'no_embeddings', results: [] };

  const response = await getOpenAIClient().embeddings.create({
    model,
    input: query,
    encoding_format: 'float',
  });
  const queryEmbedding = response?.data?.[0]?.embedding;
  if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0
      || !queryEmbedding.every(Number.isFinite)) {
    throw new Error('invalid_query_embedding');
  }

  const results = searchChunks(queryEmbedding, corpus.chunks, { model, topK, threshold });
  return { reason: results.length ? null : 'no_results', results };
}

module.exports = { cosineSimilarity, searchChunks, searchDocuments };
