import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    const existing = await User.findOne({ email: email?.toLowerCase() });
    if (existing) {
      throw new AppError('Email already registered', 422, 'EMAIL_EXISTS');
    }

    const user = await User.create({
      email: email?.toLowerCase(),
      password,
      name: name?.trim(),
    });

    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        preferences: user.preferences,
      },
      accessToken: token,
      expiresIn: '7d',
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email?.toLowerCase() }).select('+password');
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.password) {
      throw new AppError('Please login with Google', 401, 'USE_GOOGLE');
    }

    const match = await user.comparePassword(password);
    if (!match) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const token = generateToken(user._id);
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        preferences: user.preferences,
      },
      accessToken: token,
      expiresIn: '7d',
    });
  } catch (err) {
    next(err);
  }
};

export const googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      throw new AppError('Google credential required', 400, 'MISSING_CREDENTIAL');
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (user) {
      if (!user.googleId) user.googleId = googleId;
      if (!user.avatar && picture) user.avatar = picture;
      user.name = user.name || name;
      await user.save();
    } else {
      user = await User.create({
        email: email?.toLowerCase(),
        name: name || email?.split('@')[0],
        avatar: picture,
        googleId,
      });
    }

    const token = generateToken(user._id);
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        preferences: user.preferences,
      },
      accessToken: token,
      expiresIn: '7d',
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
