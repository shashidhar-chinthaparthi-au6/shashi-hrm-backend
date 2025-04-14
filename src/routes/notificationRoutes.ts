import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Notification routes
router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);

export default router; 