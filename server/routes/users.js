import express from 'express';
import { getProfile, updateProfile, changePassword, getAllUsers, createUser, updateUser, toggleUserStatus, deleteUser, uploadAvatar, deleteAvatar } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/security.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de perfil
router.get('/me', apiLimiter, getProfile);
router.put('/me', apiLimiter, updateProfile);
router.put('/me/password', apiLimiter, changePassword);
router.put('/me/avatar', apiLimiter, upload.single('avatar'), uploadAvatar);
router.delete('/me/avatar', apiLimiter, deleteAvatar);

// Rutas de administración de usuarios
router.get('/', apiLimiter, getAllUsers);
router.post('/', apiLimiter, createUser);
router.put('/:id', apiLimiter, updateUser);
router.put('/:id/status', apiLimiter, toggleUserStatus);
router.delete('/:id', apiLimiter, deleteUser);

export default router;

