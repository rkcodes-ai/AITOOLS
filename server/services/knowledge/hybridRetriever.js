import { documentRepository } from '../../repositories/documentRepository.js';
import { documentChunkRepository } from '../../repositories/documentChunkRepository.js';
import { knowledgeCollectionRepository } from '../../repositories/knowledgeCollectionRepository.js';
import { providerRegistry } from '../../providers/registry/providerRegistry.js';
import { modelRegistry } from '../../providers/registry/modelRegistry.js';
import { cosineSimilarity } from '../documents/vectorStore.js';
import { rankingService } from './rankingService.js';
import { queryProcessor } from './queryProcessor.js';
import { AppError } from '../../utils/errors.js';

export const hybridRetriever = {
  /**
   * Retrieve and rank chunks across user-scoped documents using hybrid search
   */
  async retrieve({
    userId,
    query,
    collectionId = null,
    documentIds = [],
    topK = 5,
    minSimilarity = 0.15,
    semanticWeight = 0.70,
    keywordWeight = 0.30,
  }) {
    if (!userId) {
      throw new AppError('Authentication is required for knowledge retrieval.', 401, 'UNAUTHORIZED');
    }

    // 1. Process & normalize query
    const processedQuery = queryProcessor.process(query);

    // 2. Resolve Scope: Verified Document IDs and Collection Context
    let collectionName = null;
    let targetDocIds = [];

    if (collectionId) {
      const collection = await knowledgeCollectionRepository.findByIdForUser(collectionId, userId);
      if (!collection) {
        throw new AppError('Knowledge collection not found or access denied.', 404, 'COLLECTION_NOT_FOUND');
      }
      collectionName = collection.name;
      const rawDocIds = collection.documentIds || [];
      targetDocIds = rawDocIds.map((d) => (d._id ? d._id.toString() : d.toString()));

      if (targetDocIds.length === 0) {
        return {
          results: [],
          scope: { collectionId, collectionName, documentCount: 0 },
          queryInfo: processedQuery,
        };
      }
    } else if (documentIds && documentIds.length > 0) {
      // Validate individual document ownership
      for (const docId of documentIds) {
        const doc = await documentRepository.findByIdForUser(docId, userId);
        if (doc && doc.status === 'ready') {
          targetDocIds.push(doc._id.toString());
        }
      }
      if (targetDocIds.length === 0) {
        return {
          results: [],
          scope: { documentCount: 0 },
          queryInfo: processedQuery,
        };
      }
    } else {
      // All user's ready documents
      const userDocs = await documentRepository.findManyForUser(userId, { limit: 100, status: 'ready' });
      targetDocIds = (userDocs.documents || []).map((d) => d._id.toString());
    }

    if (targetDocIds.length === 0) {
      return {
        results: [],
        scope: { documentCount: 0 },
        queryInfo: processedQuery,
      };
    }

    // Build document metadata map
    const verifiedDocs = await Promise.all(
      targetDocIds.map((id) => documentRepository.findByIdForUser(id, userId))
    );
    const docMap = new Map();
    for (const d of verifiedDocs) {
      if (d) {
        docMap.set(d._id.toString(), {
          name: d.name,
          originalFilename: d.originalFilename,
          mimeType: d.mimeType,
          pageCount: d.pageCount,
        });
      }
    }

    // 3. Fetch candidate chunks strictly scoped to userId and targetDocIds
    const candidateChunks = await documentChunkRepository.findChunksForUserAndDocuments(
      userId,
      targetDocIds
    );

    if (!candidateChunks || candidateChunks.length === 0) {
      return {
        results: [],
        scope: { collectionId, collectionName, documentCount: targetDocIds.length },
        queryInfo: processedQuery,
      };
    }

    // 4. Generate Semantic Query Embedding if Provider is configured
    let queryVector = null;
    const embeddingProvider = providerRegistry.getEmbeddingProvider('huggingface');
    const defaultEmbeddingModel = modelRegistry.getDefaultEmbeddingModel();

    if (embeddingProvider.isConfigured()) {
      try {
        const embedRes = await embeddingProvider.embedText({
          text: processedQuery.normalizedQuery,
          model: defaultEmbeddingModel.id,
        });
        queryVector = embedRes.vector;
      } catch (err) {
        console.warn(`[HybridRetriever] Query embedding failed: ${err.message}. Falling back to lexical keyword search.`);
      }
    }

    // 5. Score Chunks (Semantic + Keyword)
    const scoredResults = [];

    for (const chunk of candidateChunks) {
      // 5.1 Semantic similarity score
      let semanticScore = 0;
      if (queryVector && chunk.embedding && Array.isArray(chunk.embedding) && chunk.embedding.length > 0) {
        const sim = cosineSimilarity(queryVector, chunk.embedding);
        // Normalize cosine similarity (-1..1) to (0..1)
        semanticScore = Math.max(0, parseFloat(sim.toFixed(4)));
      }

      // 5.2 Keyword / Lexical score
      const keywordScore = rankingService.computeKeywordScore(chunk.text, {
        normalizedQuery: processedQuery.normalizedQuery,
        keywords: processedQuery.keywords,
      });

      // 5.3 Effective hybrid score calculation
      const finalScore = queryVector
        ? rankingService.computeHybridScore({
            semanticScore,
            keywordScore,
            semanticWeight,
            keywordWeight,
          })
        : keywordScore; // Graceful 100% lexical score when embedding is unavailable

      // Match details for explanation
      const lowerChunk = chunk.text.toLowerCase();
      const hasExactPhrase = processedQuery.normalizedQuery
        ? lowerChunk.includes(processedQuery.normalizedQuery.toLowerCase())
        : false;
      const matchedKeywordsCount = processedQuery.keywords.filter((kw) =>
        lowerChunk.includes(kw)
      ).length;

      if (finalScore >= minSimilarity || hasExactPhrase || matchedKeywordsCount > 0) {
        const docInfo = docMap.get(chunk.documentId.toString()) || {
          name: 'Document',
          originalFilename: '',
          mimeType: 'text/plain',
        };

        const explanation = rankingService.generateExplanation({
          semanticScore,
          keywordScore,
          finalScore,
          matchedKeywordsCount,
          hasExactPhrase,
          collectionName,
        });

        scoredResults.push({
          documentId: chunk.documentId,
          documentName: docInfo.name,
          originalFilename: docInfo.originalFilename,
          mimeType: docInfo.mimeType,
          chunkId: chunk._id,
          chunkIndex: chunk.chunkIndex,
          pageStart: chunk.pageStart || 1,
          pageEnd: chunk.pageEnd || 1,
          snippet: chunk.text.slice(0, 300) + (chunk.text.length > 300 ? '...' : ''),
          fullText: chunk.text,
          semanticScore,
          keywordScore,
          finalScore,
          explanation,
        });
      }
    }

    // 6. Sort descending by finalScore and apply topK limit
    scoredResults.sort((a, b) => b.finalScore - a.finalScore);
    const boundedTopK = Math.max(1, Math.min(topK, 20));
    const topResults = scoredResults.slice(0, boundedTopK).map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    return {
      results: topResults,
      totalMatched: scoredResults.length,
      scope: {
        collectionId,
        collectionName,
        documentCount: targetDocIds.length,
      },
      queryInfo: {
        normalizedQuery: processedQuery.normalizedQuery,
        keywords: processedQuery.keywords,
        semanticSearchActive: Boolean(queryVector),
      },
    };
  },
};
