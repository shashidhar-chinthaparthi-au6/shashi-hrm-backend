import express from 'express';
import {
  applyForLeave,
  getLeaveApplications,
  updateLeaveStatus,
  getLeaveBalance,
  getLeaveHistory,
  getLeaveUsageTrend,
} from '../controllers/leaveController';
import {
  createLeaveType,
  getLeaveTypes,
  updateLeaveType,
  deleteLeaveType,
} from '../controllers/leaveTypeController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Leave application routes
router.post('/applications', applyForLeave);
router.get('/applications', getLeaveApplications);
router.put('/applications/:id/status', updateLeaveStatus);

// Leave balance and history routes
router.get('/balances', getLeaveBalance);
router.get('/history', getLeaveHistory);
router.get('/trend', getLeaveUsageTrend);

// Leave type routes
router.post('/types', createLeaveType);
router.get('/types', getLeaveTypes);
router.put('/types/:id', updateLeaveType);
router.delete('/types/:id', deleteLeaveType);

export default router; 