import express from 'express';
import {
  forgotPassword,
  resetPassword,
  verifyResetToken,
} from '../controllers/passwordController.js';
import { registerLimiter, apiLimiter } from '../middleware/security.js';

const router = express.Router();

router.post('/forgot', registerLimiter, forgotPassword);
router.post('/reset', registerLimiter, resetPassword);
router.get('/verify-reset-token/:token', apiLimiter, verifyResetToken);

export default router;

