import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_REQUIRED', message: 'Not authorized. Please login.' },
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-in-prod');
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found.' },
      });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Token expired. Please login again.' },
      });
    }
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid token.' },
    });
  }
};

export const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'dev-secret-change-in-prod',
    { expiresIn: process.env.JWT_EXPIRES || '7d' }
  );
};
