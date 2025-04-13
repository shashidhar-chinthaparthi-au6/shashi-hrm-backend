import { Response } from 'express';
import { AuthService } from '../services/auth.service';
import { handleError } from '../utils/errors';
import { IUser } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AuthController {
  static async register(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json({
        message: 'Registration successful',
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  static async login(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      
      const userData = {
        id: result.user._id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        department: result.user.department,
      };

      res.json({
        message: 'Login successful',
        user: userData,
        token: result.token,
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  static async getCurrentUser(req: AuthenticatedRequest, res: Response) {
    try {
      console.log("===================>",req.user);
      const user = await AuthService.getCurrentUser(req.user?._id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      handleError(res, error);
    }
  }
} 