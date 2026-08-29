import { ValidationError } from '../utils/errors.js';

export const validateChatQueryInput = ({ question, documentIds, conversationId, model }) => {
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    throw new ValidationError('Question is required and cannot be empty.', 'EMPTY_QUESTION');
  }

  if (question.trim().length > 2000) {
    throw new ValidationError('Question length exceeds maximum limit of 2,000 characters.', 'QUESTION_TOO_LONG');
  }

  let sanitizedDocIds = [];
  if (Array.isArray(documentIds)) {
    sanitizedDocIds = documentIds.filter((id) => typeof id === 'string' && id.trim().length > 0);
  } else if (typeof documentIds === 'string' && documentIds.trim()) {
    sanitizedDocIds = [documentIds.trim()];
  }

  return {
    question: question.trim(),
    documentIds: sanitizedDocIds,
    conversationId: conversationId || null,
    model: model || null,
  };
};

export const sanitizeDocumentListParams = ({ page, limit, search, status }) => {
  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);

  const safePage = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const safeLimit = isNaN(parsedLimit) || parsedLimit < 1 ? 20 : Math.min(parsedLimit, 50);

  return {
    page: safePage,
    limit: safeLimit,
    search: typeof search === 'string' ? search.trim().slice(0, 100) : '',
    status: ['uploaded', 'processing', 'ready', 'failed'].includes(status) ? status : null,
  };
};
