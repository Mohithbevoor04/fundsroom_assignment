import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustStock,
  getStockLogs
} from '../controllers/productController';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getProducts);
router.get('/stock-logs', getStockLogs);
router.get('/:id', getProductById);

router.post('/', authorizeRoles('Admin', 'Warehouse'), createProduct);
router.put('/:id', authorizeRoles('Admin', 'Warehouse'), updateProduct);
router.post('/:id/adjust-stock', authorizeRoles('Admin', 'Warehouse'), adjustStock);

export default router;
