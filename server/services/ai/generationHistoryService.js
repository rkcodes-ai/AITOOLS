import { generationRepository } from '../../repositories/generationRepository.js';
import { AppError } from '../../utils/errors.js';

export const recordGeneration = async ({
  userId,
  type,
  provider,
  model = '',
  prompt = '',
  input = null,
  result = {},
  metadata = {},
  status = 'completed',
  errorCode = null,
}) => {
  if (!userId) return null; // Anonymous executions are not recorded

  try {
    // Sanitize and trim prompt/input for privacy & storage efficiency
    const sanitizedPrompt = typeof prompt === 'string' ? prompt.slice(0, 1000) : '';
    let sanitizedInput = input;
    if (typeof input === 'string' && input.length > 2000) {
      sanitizedInput = input.slice(0, 2000) + '... [truncated]';
    }

    return await generationRepository.create({
      userId,
      type,
      provider,
      model,
      prompt: sanitizedPrompt,
      input: sanitizedInput,
      result,
      metadata,
      status,
      errorCode,
    });
  } catch (error) {
    console.error('[GenerationService] Failed to record generation:', error.message);
    return null;
  }
};

export const getUserGenerationsService = async ({
  userId,
  page = 1,
  limit = 20,
  type = null,
  status = null,
  search = '',
}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [generations, total] = await Promise.all([
    generationRepository.findPaginatedForUser({
      userId,
      skip,
      limit: limitNum,
      type,
      status,
      search,
    }),
    generationRepository.countForUser({
      userId,
      type,
      status,
      search,
    }),
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  return {
    generations,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrevious: pageNum > 1,
    },
  };
};

export const getGenerationDetailService = async ({ id, userId }) => {
  if (!id || !userId) {
    throw new AppError('Generation ID and user identity required.', 400, 'INVALID_INPUT');
  }

  const generation = await generationRepository.findByIdForUser(id, userId);
  if (!generation) {
    throw new AppError('Generation record not found.', 404, 'NOT_FOUND');
  }

  return generation;
};

export const deleteGenerationService = async ({ id, userId, role }) => {
  if (!id || !userId) {
    throw new AppError('Generation ID and user identity required.', 400, 'INVALID_INPUT');
  }

  const isAdmin = role === 'admin';
  await generationRepository.deleteForUser(id, userId, isAdmin);

  return { message: 'Generation deleted successfully.' };
};

export const getUserWorkspaceStatsService = async (userId) => {
  if (!userId) {
    throw new AppError('User identity required.', 401, 'UNAUTHORIZED');
  }

  return generationRepository.aggregateUserStats(userId);
};
