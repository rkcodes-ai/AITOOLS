import { hybridRetriever } from './hybridRetriever.js';
import { knowledgeSearchCache } from './knowledgeSearchCache.js';
import { knowledgeCollectionRepository } from '../../repositories/knowledgeCollectionRepository.js';
import { documentRepository } from '../../repositories/documentRepository.js';
import { ValidationError, AppError } from '../../utils/errors.js';

export const knowledgeSearchService = {
  /**
   * Execute hybrid knowledge search with user caching and ranking
   */
  async search({
    userId,
    query,
    collectionId = null,
    documentIds = [],
    topK = 5,
    minSimilarity = 0.15,
    semanticWeight = 0.70,
    keywordWeight = 0.30,
    bypassCache = false,
  }) {
    if (!userId) {
      throw new AppError('Authentication required to search knowledge base.', 401, 'UNAUTHORIZED');
    }

    if (!query || typeof query !== 'string' || !query.trim()) {
      throw new ValidationError('A non-empty search query is required.', 'EMPTY_SEARCH_QUERY');
    }

    // Build cache query key
    const docScopeKey = Array.isArray(documentIds) ? [...documentIds].sort().join(',') : '';
    const cacheKey = `${query.trim().toLowerCase()}:col_${collectionId || 'all'}:docs_${docScopeKey}:k_${topK}:sim_${minSimilarity}`;

    if (!bypassCache) {
      const cached = knowledgeSearchCache.get(userId, cacheKey);
      if (cached) {
        return {
          ...cached,
          cached: true,
        };
      }
    }

    // Execute retrieval & ranking
    const retrievalResult = await hybridRetriever.retrieve({
      userId,
      query,
      collectionId,
      documentIds,
      topK,
      minSimilarity,
      semanticWeight,
      keywordWeight,
    });

    const response = {
      results: retrievalResult.results,
      totalMatched: retrievalResult.totalMatched,
      scope: retrievalResult.scope,
      queryInfo: retrievalResult.queryInfo,
      cached: false,
    };

    // Cache the result for subsequent repeated queries
    knowledgeSearchCache.set(userId, cacheKey, response);

    return response;
  },

  // --------------------------------------------------------------------------
  // Collection Operations
  // --------------------------------------------------------------------------

  async createCollection({ userId, name, description = '', documentIds = [] }) {
    if (!userId) {
      throw new AppError('Authentication required to create a collection.', 401, 'UNAUTHORIZED');
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new ValidationError('Collection name is required and cannot be empty.', 'MISSING_COLLECTION_NAME');
    }

    if (name.trim().length > 100) {
      throw new ValidationError('Collection name cannot exceed 100 characters.', 'NAME_TOO_LONG');
    }

    // Validate that provided documentIds belong to this user
    const validatedDocIds = [];
    if (Array.isArray(documentIds) && documentIds.length > 0) {
      for (const docId of documentIds) {
        const doc = await documentRepository.findByIdForUser(docId, userId);
        if (doc) {
          validatedDocIds.push(doc._id);
        }
      }
    }

    const collection = await knowledgeCollectionRepository.create({
      userId,
      name: name.trim(),
      description: (description || '').trim().slice(0, 500),
      documentIds: validatedDocIds,
    });

    // Invalidate user search cache
    knowledgeSearchCache.invalidateUser(userId);

    return collection;
  },

  async getUserCollections(userId, queryParams = {}) {
    if (!userId) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }
    return knowledgeCollectionRepository.findManyForUser(userId, queryParams);
  },

  async getCollectionDetails(id, userId) {
    if (!userId) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }
    const collection = await knowledgeCollectionRepository.findByIdForUser(id, userId);
    if (!collection) {
      throw new AppError('Collection not found.', 404, 'COLLECTION_NOT_FOUND');
    }
    return collection;
  },

  async updateCollection(id, userId, updates = {}) {
    if (!userId) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }

    if (updates.name !== undefined) {
      if (typeof updates.name !== 'string' || !updates.name.trim()) {
        throw new ValidationError('Collection name cannot be empty.', 'INVALID_COLLECTION_NAME');
      }
      if (updates.name.trim().length > 100) {
        throw new ValidationError('Collection name cannot exceed 100 characters.', 'NAME_TOO_LONG');
      }
    }

    // If updating documentIds, verify ownership
    let validatedDocIds = updates.documentIds;
    if (Array.isArray(updates.documentIds)) {
      validatedDocIds = [];
      for (const docId of updates.documentIds) {
        const doc = await documentRepository.findByIdForUser(docId, userId);
        if (doc) {
          validatedDocIds.push(doc._id);
        }
      }
      updates.documentIds = validatedDocIds;
    }

    const updated = await knowledgeCollectionRepository.updateForUser(id, userId, updates);

    // Invalidate user search cache
    knowledgeSearchCache.invalidateUser(userId);

    return updated;
  },

  async deleteCollection(id, userId) {
    if (!userId) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }

    const deleted = await knowledgeCollectionRepository.deleteForUser(id, userId);

    // Invalidate user search cache
    knowledgeSearchCache.invalidateUser(userId);

    return { message: 'Collection deleted successfully.', id: deleted._id };
  },
};
