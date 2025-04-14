import express from 'express';
import {
  createShift,
  getShifts,
  updateShift,
  deleteShift,
} from '../controllers/shiftController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Shift routes
router.post('/', createShift);
router.get('/', getShifts);
router.put('/:id', updateShift);
router.delete('/:id', deleteShift);

export default router; 