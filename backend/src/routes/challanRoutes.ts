import { Router } from 'express';
import {
  getChallans,
  getChallanById,
  createChallan,
  updateChallanStatus,
  downloadChallanPDF
} from '../controllers/challanController';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getChallans);
router.get('/:id', getChallanById);
router.get('/:id/pdf', downloadChallanPDF);

router.post('/', authorizeRoles('Admin', 'Sales'), createChallan);
router.patch('/:id/status', authorizeRoles('Admin', 'Sales', 'Warehouse', 'Accounts'), updateChallanStatus);

export default router;
