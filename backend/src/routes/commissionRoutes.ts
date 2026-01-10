import { Router } from 'express';
import {
  getAllCommissions,
  createCommission,
  getCommissionById,
  updateCommission,
  deleteCommission,
  uploadCommissions,
} from '../controllers/commissionController';

const router = Router();


router.get('/', getAllCommissions);
router.post('/', createCommission);
router.post('/upload', uploadCommissions);
router.get('/:id', getCommissionById);
router.put('/:id', updateCommission);
router.delete('/:id', deleteCommission);

export default router;
