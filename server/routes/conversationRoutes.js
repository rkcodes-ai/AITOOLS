import express from 'express';
import {
  getConversations,
  getConversationDetails,
  deleteConversation,
} from '../controllers/conversationController.js';
import { authenticateUser } from '../middleware/authentication.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', getConversations);
router.get('/:id', getConversationDetails);
router.delete('/:id', deleteConversation);

export default router;
