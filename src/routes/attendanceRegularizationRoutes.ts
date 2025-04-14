import express from 'express';
import {
  applyForRegularization,
  getRegularizationRequests,
  updateRegularizationStatus,
} from '../controllers/attendanceRegularizationController';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Regularization routes
router.post('/', applyForRegularization);
router.get('/', getRegularizationRequests);
router.put('/:id/status', updateRegularizationStatus);

export default router; 