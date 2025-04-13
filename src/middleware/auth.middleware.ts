import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UnauthorizedError } from '../utils/errors';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const user = await AuthService.validateToken(token);

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      throw new UnauthorizedError('Not authorized');
    }

    next();
  };
}; 