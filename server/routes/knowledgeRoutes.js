import express from 'express';
import {
  searchKnowledge,
  createCollection,
  getCollections,
  getCollectionDetails,
  updateCollection,
  deleteCollection,
} from '../controllers/knowledgeController.js';
import { authenticateUser } from '../middleware/authentication.js';
import { knowledgeSearchLimiter } from '../middleware/security.js';

const router = express.Router();

// All knowledge endpoints require authentication
router.use(authenticateUser);

// Knowledge Search Endpoint
router.post('/search', knowledgeSearchLimiter, searchKnowledge);

// Knowledge Collections CRUD
router.post('/collections', createCollection);
router.get('/collections', getCollections);
router.get('/collections/:id', getCollectionDetails);
router.patch('/collections/:id', updateCollection);
router.delete('/collections/:id', deleteCollection);

export default router;
