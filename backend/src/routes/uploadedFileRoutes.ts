import { Router } from 'express';
import {
  getAllUploadedFiles,
  createUploadedFile,
  deleteUploadedFile,
} from '../controllers/uploadedFileController';

const router = Router();

router.get('/', getAllUploadedFiles);
router.post('/', createUploadedFile);
router.delete('/:fileId', deleteUploadedFile);

export default router;
