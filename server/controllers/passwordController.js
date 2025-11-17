import crypto from 'crypto';
import User from '../models/User.js';
import { generateAccessToken } from '../utils/jwt.js';

// @desc    Solicitar recuperación de contraseña
// @route   POST /api/password/forgot
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido',
      });
    }

    const user = await User.findOne({ email });

    // Por seguridad, siempre devolver éxito aunque el usuario no exista
    // Esto previene enumeración de usuarios
    if (!user) {
      return res.json({
        success: true,
        message: 'Si el email existe, se enviará un enlace de recuperación',
      });
    }

    // Generar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutos

    // Guardar token en el usuario
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();

    // En producción, aquí enviarías un email con el link de reset
    // Por ahora, devolvemos el token en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('🔑 Reset Token:', resetToken);
      console.log('🔗 Reset Link:', `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`);
    }

    res.json({
      success: true,
      message: 'Si el email existe, se enviará un enlace de recuperación',
      // Solo en desarrollo
      ...(process.env.NODE_ENV === 'development' && {
        resetToken,
        resetLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`,
      }),
    });
  } catch (error) {
    console.error('Error en forgot password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process recovery request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Resetear contraseña
// @route   POST /api/password/reset
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token y nueva contraseña son requeridos',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres',
      });
    }

    // Buscar usuario con token válido
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o expirado',
      });
    }

    // Actualizar contraseña
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Contraseña restablecida exitosamente',
    });
  } catch (error) {
    console.error('Error reseteando contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al restablecer contraseña',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Verificar token de reset
// @route   GET /api/password/verify-reset-token/:token
// @access  Public
export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o expirado',
      });
    }

    res.json({
      success: true,
      message: 'Token válido',
    });
  } catch (error) {
    console.error('Error verificando token:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

