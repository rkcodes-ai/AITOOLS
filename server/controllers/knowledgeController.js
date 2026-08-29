import { knowledgeSearchService } from '../services/knowledge/knowledgeSearchService.js';
import {
  validateSearchQueryInput,
  validateCollectionCreateInput,
  validateCollectionUpdateInput,
  sanitizeCollectionListParams,
} from '../validators/knowledgeValidators.js';

export const searchKnowledge = async (req, res, next) => {
  try {
    const validated = validateSearchQueryInput(req.body);
    const result = await knowledgeSearchService.search({
      userId: req.user.id,
      ...validated,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const createCollection = async (req, res, next) => {
  try {
    const validated = validateCollectionCreateInput(req.body);
    const collection = await knowledgeSearchService.createCollection({
      userId: req.user.id,
      ...validated,
    });

    return res.status(201).json({
      success: true,
      data: collection,
    });
  } catch (error) {
    next(error);
  }
};

export const getCollections = async (req, res, next) => {
  try {
    const params = sanitizeCollectionListParams(req.query);
    const result = await knowledgeSearchService.getUserCollections(req.user.id, params);

    return res.status(200).json({
      success: true,
      data: result.collections,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCollectionDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collection = await knowledgeSearchService.getCollectionDetails(id, req.user.id);

    return res.status(200).json({
      success: true,
      data: collection,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = validateCollectionUpdateInput(req.body);
    const updated = await knowledgeSearchService.updateCollection(id, req.user.id, updates);

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await knowledgeSearchService.deleteCollection(id, req.user.id);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
