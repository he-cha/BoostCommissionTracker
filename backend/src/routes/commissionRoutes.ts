import { Router } from 'express';
import {
  getAllCommissions,
  createCommission,
  getCommissionById,
  updateCommission,
  deleteCommission,
  uploadCommissions,
  updateIMEINotes,
  getIMEINotes,
} from '../controllers/commissionController';

const router = Router();


router.get('/', getAllCommissions);
router.post('/', createCommission);
router.post('/upload', uploadCommissions);
router.get('/:id', getCommissionById);
router.put('/:id', updateCommission);
router.delete('/:id', deleteCommission);

// IMEI notes routes
router.put('/imei/:imei/notes', updateIMEINotes);
router.get('/imei/:imei/notes', getIMEINotes);

export default router;
