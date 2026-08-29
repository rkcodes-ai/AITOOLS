import express from 'express';
import { getPosts, createPost, deletePost } from '../controllers/postController.js';
import { authenticateUser, optionalAuthenticateUser } from '../middleware/authentication.js';

const router = express.Router();

// GET /api/v1/post - Retrieve posts with pagination and search (public)
router.get('/post', getPosts);

// POST /api/v1/post - Create a new community post (attributes to user if authenticated)
router.post('/post', optionalAuthenticateUser, createPost);

// DELETE /api/v1/post/:id - Delete a post (requires creator ownership or admin role)
router.delete('/post/:id', authenticateUser, deletePost);

export default router;