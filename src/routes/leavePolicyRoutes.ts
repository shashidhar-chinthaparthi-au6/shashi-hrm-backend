import express from 'express';
import {
  createLeavePolicy,
  getLeavePolicies,
  updateLeavePolicy,
  deleteLeavePolicy,
} from '../controllers/leavePolicyController';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Leave policy routes
router.post('/', createLeavePolicy);
router.get('/', getLeavePolicies);
router.put('/:id', updateLeavePolicy);
router.delete('/:id', deleteLeavePolicy);

export default router; 