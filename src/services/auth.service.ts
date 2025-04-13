import { User, IUser } from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { Role } from '../types/roles';
import { BadRequestError, UnauthorizedError } from '../utils/errors';

export class AuthService {
  static async register(userData: Partial<IUser>): Promise<{ user: IUser; token: string }> {
    try {
      const { email, password, firstName, lastName, role = Role.EMPLOYEE } = userData;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('Email already registered');
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password!, salt);

      // Create new user
      const user = new User({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
      });

      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      return { user, token };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  static async login(email: string, password: string): Promise<{ user: IUser; token: string }> {
    try {
      // Find user by email
      const user = await User.findOne({ email }).lean() as IUser;
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      return { user, token };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  static async getCurrentUser(userId: string): Promise<IUser | null> {
    try {
      const user = await User.findById(userId).select('-password').lean() as IUser | null;
      return user;
    } catch (error) {
      logger.error('Get current user error:', error);
      throw error;
    }
  }

  static async validateToken(token: string): Promise<IUser> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
        email: string;
        role: string;
      };

      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        throw new UnauthorizedError('Invalid token');
      }

      return user;
    } catch (error) {
      throw new UnauthorizedError('Invalid token');
    }
  }
} 