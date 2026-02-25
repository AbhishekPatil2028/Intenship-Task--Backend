import express from 'express';
import {
  login,
  signup,
  refreshToken,
  logout,
  protectedRoute,
  checkToken
} from '../controllers/passportAuth.controller.mjs';
import { authenticate } from '../middleware/passportauth.middleware.mjs';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/signup', signup);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

// Protected routes
router.get('/protected', authenticate, protectedRoute);
router.get('/check-token', authenticate, checkToken);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth API is healthy',
    timestamp: new Date().toISOString(),
    system: 'Dual Token Authentication'
  });
});

export default router;