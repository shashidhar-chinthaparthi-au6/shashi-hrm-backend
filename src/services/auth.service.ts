import jwt, { SignOptions } from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { BadRequestError, UnauthorizedError } from '../utils/errors';

export class AuthService {
  static async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    department: string;
    role?: 'admin' | 'manager' | 'employee';
  }): Promise<IUser> {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new BadRequestError('Email already registered');
    }

    // Create new user
    const user = new User(userData);
    await user.save();

    return user;
  }

  static async login(email: string, password: string): Promise<{ user: IUser; token: string }> {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = this.generateToken(user);

    return { user, token };
  }

  static generateToken(user: IUser): string {
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
    };

    const options: SignOptions = {
      expiresIn: '7d',
    };

    return jwt.sign(payload, process.env.JWT_SECRET!, options);
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