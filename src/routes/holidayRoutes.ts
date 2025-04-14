import express from 'express';
import {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  checkHoliday,
  getHolidayCalendar,
} from '../controllers/holidayController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Holiday management routes
router.get('/', authenticate, getHolidays);
router.post('/', authenticate, createHoliday);
router.put('/:id', authenticate, updateHoliday);
router.delete('/:id', authenticate, deleteHoliday);

// Holiday check and calendar routes
router.get('/check', authenticate, checkHoliday);
router.get('/calendar', authenticate, getHolidayCalendar);

export default router; 