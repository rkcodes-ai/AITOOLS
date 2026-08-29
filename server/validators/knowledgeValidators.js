import { ValidationError } from '../utils/errors.js';

export const validateSearchQueryInput = (body = {}) => {
  const {
    query,
    collectionId = null,
    documentIds = [],
    topK = 5,
    minSimilarity = 0.15,
    semanticWeight = 0.70,
    keywordWeight = 0.30,
    bypassCache = false,
  } = body;

  if (!query || typeof query !== 'string' || !query.trim()) {
    throw new ValidationError('A valid search query string is required.', 'EMPTY_SEARCH_QUERY');
  }

  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 2) {
    throw new ValidationError('Search query must be at least 2 characters long.', 'QUERY_TOO_SHORT');
  }

  if (trimmedQuery.length > 1000) {
    throw new ValidationError('Search query cannot exceed 1,000 characters.', 'QUERY_TOO_LONG');
  }

  const parsedTopK = parseInt(topK, 10);
  if (isNaN(parsedTopK) || parsedTopK < 1 || parsedTopK > 20) {
    throw new ValidationError('topK parameter must be an integer between 1 and 20.', 'INVALID_TOP_K');
  }

  const parsedMinSim = parseFloat(minSimilarity);
  if (isNaN(parsedMinSim) || parsedMinSim < 0 || parsedMinSim > 1) {
    throw new ValidationError('minSimilarity must be a number between 0.0 and 1.0.', 'INVALID_MIN_SIMILARITY');
  }

  return {
    query: trimmedQuery,
    collectionId: collectionId && typeof collectionId === 'string' ? collectionId.trim() : null,
    documentIds: Array.isArray(documentIds) ? documentIds.map(String) : [],
    topK: parsedTopK,
    minSimilarity: parsedMinSim,
    semanticWeight: typeof semanticWeight === 'number' ? Math.max(0, Math.min(1, semanticWeight)) : 0.70,
    keywordWeight: typeof keywordWeight === 'number' ? Math.max(0, Math.min(1, keywordWeight)) : 0.30,
    bypassCache: Boolean(bypassCache),
  };
};

export const validateCollectionCreateInput = (body = {}) => {
  const { name, description = '', documentIds = [] } = body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new ValidationError('Collection name is required and cannot be empty.', 'MISSING_COLLECTION_NAME');
  }

  const trimmedName = name.trim();
  if (trimmedName.length > 100) {
    throw new ValidationError('Collection name cannot exceed 100 characters.', 'NAME_TOO_LONG');
  }

  const trimmedDesc = typeof description === 'string' ? description.trim() : '';
  if (trimmedDesc.length > 500) {
    throw new ValidationError('Collection description cannot exceed 500 characters.', 'DESCRIPTION_TOO_LONG');
  }

  return {
    name: trimmedName,
    description: trimmedDesc,
    documentIds: Array.isArray(documentIds) ? documentIds.map(String) : [],
  };
};

export const validateCollectionUpdateInput = (body = {}) => {
  const { name, description, documentIds, status } = body;
  const updates = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      throw new ValidationError('Collection name cannot be empty.', 'INVALID_COLLECTION_NAME');
    }
    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      throw new ValidationError('Collection name cannot exceed 100 characters.', 'NAME_TOO_LONG');
    }
    updates.name = trimmedName;
  }

  if (description !== undefined) {
    if (typeof description !== 'string') {
      throw new ValidationError('Collection description must be a string.', 'INVALID_DESCRIPTION');
    }
    const trimmedDesc = description.trim();
    if (trimmedDesc.length > 500) {
      throw new ValidationError('Collection description cannot exceed 500 characters.', 'DESCRIPTION_TOO_LONG');
    }
    updates.description = trimmedDesc;
  }

  if (documentIds !== undefined) {
    if (!Array.isArray(documentIds)) {
      throw new ValidationError('documentIds must be an array of document IDs.', 'INVALID_DOCUMENT_IDS');
    }
    updates.documentIds = documentIds.map(String);
  }

  if (status !== undefined) {
    if (!['active', 'archived'].includes(status)) {
      throw new ValidationError('Status must be either "active" or "archived".', 'INVALID_STATUS');
    }
    updates.status = status;
  }

  return updates;
};

export const sanitizeCollectionListParams = (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20));
  const search = typeof query.search === 'string' ? query.search.trim().slice(0, 100) : '';
  const status = query.status === 'archived' ? 'archived' : 'active';

  return { page, limit, search, status };
};
