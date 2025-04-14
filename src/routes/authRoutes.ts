import express from 'express';
import { login, register, logout, refreshToken } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register', register);

// Protected routes
router.post('/logout', authenticate, logout);
router.post('/refresh-token', refreshToken);

export default router; 