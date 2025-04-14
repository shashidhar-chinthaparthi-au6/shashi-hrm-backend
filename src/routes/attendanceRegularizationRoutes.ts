import express from 'express';
import {
  applyForRegularization,
  getRegularizationRequests,
  updateRegularizationStatus,
} from '../controllers/attendanceRegularizationController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Apply for regularization (Employee)
router.post('/', authenticate, applyForRegularization);

// Get regularization requests (HR Manager)
router.get('/', authenticate, getRegularizationRequests);

// Update regularization status (HR Manager)
router.put('/:id/status', authenticate, updateRegularizationStatus);

export default router; 