import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { registerSchema, loginSchema, changePasswordSchema } from '../validators/authValidators.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { env } from '../config/env.js';
import { seedDefaultDataForUser } from '../services/defaultDataService.js';

const generateToken = (user) =>
  jwt.sign({ id: user._id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

export const register = async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return sendError(res, 'Validation failed', 400, errors);
    }

    const { name, email, password, preferredCurrency } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return sendError(res, 'User already exists', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      preferredCurrency,
    });

    await seedDefaultDataForUser(user._id);

    const token = generateToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const safeUser = { ...user.toObject(), passwordHash: undefined };
    return sendSuccess(res, 'Registration successful', { user: safeUser, token }, 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return sendError(res, 'Validation failed', 400, errors);
    }

    const { email, password } = parsed.data;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const token = generateToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const safeUser = { ...user.toObject(), passwordHash: undefined };
    return sendSuccess(res, 'Login successful', { user: safeUser, token });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  res.clearCookie('token');
  return sendSuccess(res, 'Logged out successfully');
};

export const getCurrentUser = async (req, res) => {
  const safeUser = { ...req.user.toObject(), passwordHash: undefined };
  return sendSuccess(res, 'User loaded', { user: safeUser });
};

export const changePassword = async (req, res, next) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return sendError(res, 'Validation failed', 400, errors);
    }

    const { currentPassword, newPassword } = parsed.data;
    const user = await User.findById(req.user._id);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return sendError(res, 'Current password is incorrect', 400);
    }

    if (currentPassword === newPassword) {
      return sendError(res, 'New password must be different from the current password', 400);
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    return sendSuccess(res, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};
