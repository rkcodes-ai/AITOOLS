import express from 'express';
import {
  uploadDocument,
  getDocuments,
  getDocumentDetails,
  retryDocumentProcessing,
  deleteDocument,
  chatWithDocuments,
} from '../controllers/documentController.js';
import { authenticateUser } from '../middleware/authentication.js';

const router = express.Router();

// All document routes require authentication
router.use(authenticateUser);

router.post('/chat', chatWithDocuments);
router.post('/', uploadDocument);
router.get('/', getDocuments);
router.get('/:id', getDocumentDetails);
router.post('/:id/process', retryDocumentProcessing);
router.delete('/:id', deleteDocument);

export default router;
