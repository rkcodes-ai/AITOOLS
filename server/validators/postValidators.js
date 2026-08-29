import { ValidationError } from '../utils/errors.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const validateCreatePostInput = ({ name, prompt, model, file }) => {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new ValidationError('Creator name is required.', 'EMPTY_NAME');
  }
  if (name.trim().length > 100) {
    throw new ValidationError('Creator name cannot exceed 100 characters.', 'NAME_TOO_LONG');
  }

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new ValidationError('Prompt is required.', 'EMPTY_PROMPT');
  }
  if (prompt.trim().length > 1000) {
    throw new ValidationError('Prompt cannot exceed 1000 characters.', 'PROMPT_TOO_LONG');
  }

  if (!model || typeof model !== 'string' || model.trim().length === 0) {
    throw new ValidationError('Model identifier is required.', 'EMPTY_MODEL');
  }

  if (!file) {
    throw new ValidationError('Image file (photoFile) is required.', 'MISSING_FILE');
  }

  if (file.mimetype && !ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
    throw new ValidationError(
      `Invalid file format '${file.mimetype}'. Allowed types: JPEG, PNG, WEBP.`,
      'INVALID_MIME_TYPE'
    );
  }

  if (file.size && file.size > MAX_FILE_SIZE_BYTES) {
    throw new ValidationError(
      `File size exceeds the 10MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB.`,
      'FILE_TOO_LARGE'
    );
  }

  return {
    name: name.trim(),
    prompt: prompt.trim(),
    model: model.trim(),
    file,
  };
};

export const validateGetPostsInput = ({ page, limit, search }) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const sanitizedSearch = search && typeof search === 'string'
    ? escapeRegex(search.trim().slice(0, 100))
    : '';

  return {
    page: pageNum,
    limit: limitNum,
    search: sanitizedSearch,
  };
};
