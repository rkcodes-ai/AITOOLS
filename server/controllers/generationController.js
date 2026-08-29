import {
  getUserGenerationsService,
  getGenerationDetailService,
  deleteGenerationService,
  getUserWorkspaceStatsService,
} from '../services/ai/generationHistoryService.js';

export const getUserGenerations = async (req, res, next) => {
  try {
    const { page, limit, type, status, search } = req.query;
    const result = await getUserGenerationsService({
      userId: req.user.id,
      page,
      limit,
      type,
      status,
      search,
    });

    return res.status(200).json({
      success: true,
      data: result.generations,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getGenerationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const generation = await getGenerationDetailService({
      id,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      data: generation,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGeneration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await deleteGenerationService({
      id,
      userId: req.user.id,
      role: req.user.role,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceStats = async (req, res, next) => {
  try {
    const stats = await getUserWorkspaceStatsService(req.user.id);
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
