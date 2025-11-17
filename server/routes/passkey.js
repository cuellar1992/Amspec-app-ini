import express from 'express';
import {
  generateRegisterOptions,
  verifyRegistration,
  generateLoginOptions,
  verifyAuthentication,
  listPasskeys,
  deletePasskey,
} from '../controllers/passkeyController.js';
import { authenticate } from '../middleware/auth.js';
import { apiLimiter, loginLimiter } from '../middleware/security.js';

const router = express.Router();

// Public routes (for login)
router.post('/login-options', loginLimiter, generateLoginOptions);
router.post('/login-verify', loginLimiter, verifyAuthentication);

// Protected routes (for registration and management)
router.post('/register-options', authenticate, apiLimiter, generateRegisterOptions);
router.post('/register-verify', authenticate, apiLimiter, verifyRegistration);
router.get('/list', authenticate, apiLimiter, listPasskeys);
router.delete('/:id', authenticate, apiLimiter, deletePasskey);

export default router;
