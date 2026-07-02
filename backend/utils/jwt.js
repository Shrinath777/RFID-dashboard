import jwt from 'jsonwebtoken';

// Gets the secret from .env file
const JWT_SECRET = process.env.JWT_SECRET;

export const generateToken = (userData) => {
  return jwt.sign(userData, JWT_SECRET, { expiresIn: '24h' });
};

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET); // ← Uses your secret
};