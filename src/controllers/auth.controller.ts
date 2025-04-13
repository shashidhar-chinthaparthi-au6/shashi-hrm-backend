import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { BadRequestError } from '../utils/errors';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName, role, department } = req.body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName || !department) {
        throw new BadRequestError('All fields are required');
      }

      const user = await AuthService.register({
        email,
        password,
        firstName,
        lastName,
        role,
        department,
      });

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          department: user.department,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new BadRequestError('Email and password are required');
      }

      const { user, token } = await AuthService.login(email, password);

      res.json({
        message: 'Login successful',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          department: user.department,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) {
        throw new BadRequestError('User not found');
      }

      res.json({
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          department: user.department,
        },
      });
    } catch (error) {
      next(error);
    }
  }
} 