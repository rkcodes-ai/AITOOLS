import { createPostService, getPostsService, deletePostService } from '../services/posts/postService.js';

export const getPosts = async (req, res, next) => {
  try {
    const { page, limit, search, userId } = req.query;
    const result = await getPostsService({ page, limit, search, userId });
    return res.status(200).json({
      success: true,
      data: result.posts,
      pagination: result.pagination,
      dbConnected: result.dbConnected,
    });
  } catch (error) {
    next(error);
  }
};

export const createPost = async (req, res, next) => {
  try {
    const { name, prompt, model } = req.body;
    const photoFile = req.files?.photoFile;
    const userId = req.user?.id || null;

    const newPost = await createPostService({
      name,
      prompt,
      model,
      file: photoFile,
      userId,
    });

    return res.status(201).json({
      success: true,
      data: newPost,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await deletePostService(id, req.user);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
