import { documentChunkRepository } from '../../repositories/documentChunkRepository.js';

/**
 * Calculate cosine similarity between two numeric vectors
 */
export const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const vectorStore = {
  /**
   * Perform semantic vector search over document chunks strictly isolated by userId
   */
  async searchSimilarChunks({
    userId,
    queryVector,
    documentIds = [],
    topK = 4,
    minSimilarity = 0.25,
  }) {
    if (!userId) {
      throw new Error('Vector search requires an authenticated userId.');
    }

    if (!queryVector || !Array.isArray(queryVector) || queryVector.length === 0) {
      return [];
    }

    // 1. Fetch chunks owned by userId (and matching optional documentIds)
    const chunks = await documentChunkRepository.findChunksForUserAndDocuments(userId, documentIds);

    if (!chunks || chunks.length === 0) {
      return [];
    }

    // 2. Score chunks using cosine similarity
    const scoredChunks = [];

    for (const chunk of chunks) {
      if (chunk.embedding && Array.isArray(chunk.embedding) && chunk.embedding.length > 0) {
        const score = cosineSimilarity(queryVector, chunk.embedding);
        if (score >= minSimilarity) {
          scoredChunks.push({
            chunkId: chunk._id,
            documentId: chunk.documentId,
            text: chunk.text,
            pageStart: chunk.pageStart,
            pageEnd: chunk.pageEnd,
            score: parseFloat(score.toFixed(4)),
          });
        }
      }
    }

    // 3. Sort by relevance descending and take topK
    scoredChunks.sort((a, b) => b.score - a.score);
    return scoredChunks.slice(0, topK);
  },
};
