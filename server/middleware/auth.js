import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware para verificar JWT
export const authenticate = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación',
      });
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuario
    const user = await User.findById(decoded.userId).select('-password -twoFactorSecret');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Cuenta desactivada',
      });
    }

    // Agregar usuario al request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
        code: 'TOKEN_EXPIRED',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error en autenticación',
      error: error.message,
    });
  }
};

// Middleware para verificar roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para esta acción',
      });
    }

    next();
  };
};

// Middleware para verificar 2FA (si está habilitado)
export const require2FA = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    if (req.user.twoFactorEnabled) {
      // Verificar que el token tenga el flag de 2FA verificado
      const authHeader = req.headers.authorization;
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded.twoFactorVerified) {
        return res.status(403).json({
          success: false,
          message: 'Se requiere verificación de dos factores',
          code: '2FA_REQUIRED',
        });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error verificando 2FA',
      error: error.message,
    });
  }
};

