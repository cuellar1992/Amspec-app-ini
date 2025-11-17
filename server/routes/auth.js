import express from 'express';
import {
  register,
  login,
  verify2FA,
  refresh,
  logout,
  getMe,
  enable2FA,
  confirm2FA,
  disable2FA,
  firstPasswordChange,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import {
  loginLimiter,
  registerLimiter,
  refreshLimiter,
  apiLimiter,
} from '../middleware/security.js';

const router = express.Router();

// Rutas públicas
router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/verify-2fa', loginLimiter, verify2FA);
router.post('/first-password-change', loginLimiter, firstPasswordChange);
router.post('/refresh', refreshLimiter, refresh);

// Rutas protegidas
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, apiLimiter, getMe);
router.post('/enable-2fa', authenticate, apiLimiter, enable2FA);
router.post('/confirm-2fa', authenticate, apiLimiter, confirm2FA);
router.post('/disable-2fa', authenticate, apiLimiter, disable2FA);

export default router;
