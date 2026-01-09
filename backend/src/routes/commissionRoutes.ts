import { Router } from 'express';
import {
  getAllCommissions,
  createCommission,
  getCommissionById,
  updateCommission,
  deleteCommission,
} from '../controllers/commissionController';

const router = Router();

router.get('/', getAllCommissions);
router.post('/', createCommission);
router.get('/:id', getCommissionById);
router.put('/:id', updateCommission);
router.delete('/:id', deleteCommission);

export default router;
