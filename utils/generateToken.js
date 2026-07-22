import jwt from 'jsonwebtoken';

/**
 * Generates a short-lived access token containing the user ID and role
 */
export const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role: role }, 
    process.env.ACCESS_TOKEN_SECRET, 
    { expiresIn: '15m' }
  );
};

/**
 * Generates a long-lived refresh token
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId }, 
    process.env.REFRESH_TOKEN_SECRET, 
    { expiresIn: '7d' }
  );
};