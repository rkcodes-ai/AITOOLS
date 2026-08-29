import express from 'express';
import {
  getUserPresets,
  createPreset,
  updatePreset,
  deletePreset,
} from '../controllers/imagePresetController.js';
import { authenticateUser } from '../middleware/authentication.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', getUserPresets);
router.post('/', createPreset);
router.patch('/:id', updatePreset);
router.delete('/:id', deletePreset);

export default router;
