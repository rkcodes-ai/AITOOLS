import { postRepository } from '../../repositories/postRepository.js';
import { uploadImageToCloudinary } from '../storage/cloudinaryService.js';
import { validateCreatePostInput, validateGetPostsInput } from '../../validators/postValidators.js';
import { DatabaseError, AppError } from '../../utils/errors.js';

export const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Create a new community post
 */
export const createPostService = async ({ name, prompt, model, file, userId = null }) => {
  const validatedInput = validateCreatePostInput({ name, prompt, model, file });

  if (!postRepository.isReady()) {
    throw new DatabaseError();
  }

  // 1. Upload image to Cloudinary storage
  const uploadResult = await uploadImageToCloudinary({
    filePath: validatedInput.file.tempFilePath || validatedInput.file.path,
  });

  // 2. Persist post record in MongoDB
  const newPost = await postRepository.create({
    name: validatedInput.name,
    prompt: validatedInput.prompt,
    model: validatedInput.model,
    photo: uploadResult.secureUrl,
    userId: userId || null,
  });

  return newPost;
};

/**
 * Retrieve paginated community posts
 */
export const getPostsService = async ({ page = 1, limit = 20, search = '', userId = null } = {}) => {
  const { page: pageNum, limit: limitNum, search: sanitizedSearch } = validateGetPostsInput({
    page,
    limit,
    search,
  });

  const isDbReady = postRepository.isReady();
  if (!isDbReady) {
    return {
      posts: [],
      pagination: { total: 0, page: 1, limit: limitNum, pages: 0 },
      dbConnected: false,
    };
  }

  const query = {};
  if (userId) {
    query.userId = userId;
  }

  if (sanitizedSearch) {
    const searchRegex = new RegExp(sanitizedSearch, 'i');
    query.$or = [
      { name: searchRegex },
      { prompt: searchRegex },
      { model: searchRegex },
    ];
  }

  const skip = (pageNum - 1) * limitNum;

  const [posts, total] = await Promise.all([
    postRepository.findPaginated(query, skip, limitNum),
    postRepository.count(query),
  ]);

  return {
    posts,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
    dbConnected: true,
  };
};

/**
 * Delete a post (by creator owner or admin)
 */
export const deletePostService = async (postId, user) => {
  if (!user || !user.id) {
    throw new AppError('Authentication required to delete a post.', 401, 'UNAUTHORIZED');
  }

  const post = await postRepository.findById(postId);
  if (!post) {
    throw new AppError('Post not found.', 404, 'NOT_FOUND');
  }

  const isOwner = post.userId && post.userId.toString() === user.id.toString();
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new AppError('You are not authorized to delete this post.', 403, 'FORBIDDEN');
  }

  await postRepository.deleteById(postId);
  return { message: 'Post deleted successfully.' };
};
