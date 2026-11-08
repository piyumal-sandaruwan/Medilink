import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/env.js';

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password with bcrypt.
 */
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare plain text password against hashed password.
 */
export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate a signed JWT token.
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

/**
 * Verify and decode a JWT token.
 */
export const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

export default {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
};
