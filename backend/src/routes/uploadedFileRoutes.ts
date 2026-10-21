import { Router } from 'express';
import {
  getAllUploadedFiles,
  createUploadedFile,
  deleteUploadedFile,
} from '../controllers/uploadedFileController';

import { requireAuth } from '../middleware/auth';
import { validateFile } from '../middleware/validation';
const router = Router();
router.use(requireAuth);

router.get('/', getAllUploadedFiles);
router.post('/', validateFile, createUploadedFile);
router.delete('/:fileId', deleteUploadedFile);

export default router;
