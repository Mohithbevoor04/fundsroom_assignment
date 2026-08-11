import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  addFollowUpNote
} from '../controllers/customerController';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getCustomers);
router.get('/:id', getCustomerById);

router.post('/', authorizeRoles('Admin', 'Sales'), createCustomer);
router.put('/:id', authorizeRoles('Admin', 'Sales'), updateCustomer);
router.post('/:id/follow-ups', authorizeRoles('Admin', 'Sales', 'Accounts'), addFollowUpNote);

export default router;
