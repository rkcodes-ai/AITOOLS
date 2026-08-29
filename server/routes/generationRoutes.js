import express from 'express';
import {
  getUserGenerations,
  getGenerationById,
  deleteGeneration,
  getWorkspaceStats,
} from '../controllers/generationController.js';
import { authenticateUser } from '../middleware/authentication.js';

const router = express.Router();

// All workspace generation routes require authentication
router.use(authenticateUser);

// 1. Workspace Aggregated Statistics
router.get('/stats', getWorkspaceStats);

// 2. Paginated, Filterable, Searchable Generation History
router.get('/', getUserGenerations);

// 3. Single Generation Record Detail (Owner/Admin only)
router.get('/:id', getGenerationById);

// 4. Generation Record Deletion (Owner/Admin only)
router.delete('/:id', deleteGeneration);

export default router;
