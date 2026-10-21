import { Router } from 'express';
import {
  getAllCommissions,
  createCommission,
  getCommissionById,
  updateCommission,
  deleteCommission,
  uploadCommissions,
  backfillExistingMonthNumbers,
  updateIMEINotes,
  getIMEINotes,
} from '../controllers/commissionController';

import { requireAuth } from '../middleware/auth';
import { validateCommission, validateId, validateIMEI, validateUpload } from '../middleware/validation';
const router = Router();
router.use(requireAuth);


router.get('/', getAllCommissions);
router.post('/', validateCommission(), createCommission);
router.post('/upload', validateUpload, uploadCommissions);
router.post('/backfill-months', (_req, res, next) => {
  if (process.env.RUN_MAINTENANCE_JOBS !== 'true') return res.status(403).json({ error: 'Maintenance is disabled' });
  return next();
}, backfillExistingMonthNumbers);
router.get('/:id', validateId, getCommissionById);
router.put('/:id', validateId, validateCommission(true), updateCommission);
router.delete('/:id', validateId, deleteCommission);

// IMEI notes routes
router.put('/imei/:imei/notes', validateIMEI, validateCommission(true, true), updateIMEINotes);
router.get('/imei/:imei/notes', validateIMEI, getIMEINotes);

export default router;
