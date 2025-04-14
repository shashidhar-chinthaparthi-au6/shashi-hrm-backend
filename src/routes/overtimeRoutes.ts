import express from 'express';
import {
  applyForOvertime,
  getOvertimeRequests,
  updateOvertimeStatus,
} from '../controllers/overtimeController';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Overtime routes
router.post('/', applyForOvertime);
router.get('/', getOvertimeRequests);
router.put('/:id/status', updateOvertimeStatus);

export default router; 