import express from 'express';
import {
  applyForOvertime,
  getOvertimeRequests,
  updateOvertimeStatus,
} from '../controllers/overtimeController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Overtime routes
router.post('/', applyForOvertime);
router.get('/', getOvertimeRequests);
router.put('/:id/status', updateOvertimeStatus);

export default router; 