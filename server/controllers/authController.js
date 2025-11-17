import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import {
  generateAccessToken,
  generateRefreshToken,
  generate2FAToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import { generate2FASecret, generateQRCode, verify2FAToken } from '../utils/twoFactor.js';

// @desc    Registrar nuevo usuario
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // Validaciones básicas
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Por favor completa todos los campos requeridos',
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado',
      });
    }

    // Crear usuario
    const user = await User.create({
      email,
      password,
      name,
      role: role || 'user',
    });

    // Generar tokens
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Guardar refresh token
    await user.addRefreshToken(refreshToken);

    // Actualizar último login
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Login de usuario
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password, twoFactorCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Buscar usuario incluyendo password
    const user = await User.findOne({ email }).select('+password +twoFactorSecret');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Verificar si la cuenta está bloqueada
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account locked due to multiple failed attempts. Please try again later.',
      });
    }

    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Incrementar intentos fallidos
      await user.incLoginAttempts();

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Verificar si requiere cambio de contraseña
    if (user.requirePasswordChange) {
      // Generar token temporal para cambio de contraseña
      const tempToken = generate2FAToken(user._id.toString());
      
      return res.status(200).json({
        success: true,
        requirePasswordChange: true,
        tempToken,
        message: 'Password change required',
      });
    }

    // Si el usuario tiene 2FA habilitado
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        // Generar token temporal para verificar 2FA
        const tempToken = generate2FAToken(user._id.toString());

        return res.status(200).json({
          success: true,
          message: 'Se requiere código de dos factores',
          requires2FA: true,
          tempToken,
        });
      }

      // Verificar código 2FA
      const isValid2FA = verify2FAToken(twoFactorCode, user.twoFactorSecret);

      if (!isValid2FA) {
        await user.incLoginAttempts();
        return res.status(401).json({
          success: false,
          message: 'Invalid two-factor code',
        });
      }
    }

    // Resetear intentos fallidos
    await user.resetLoginAttempts();

    // Generar tokens
    const accessToken = generateAccessToken(
      user._id.toString(),
      user.twoFactorEnabled && twoFactorCode ? true : false
    );
    const refreshToken = generateRefreshToken(user._id.toString());

    // Guardar refresh token
    await user.addRefreshToken(refreshToken);

    // Actualizar último login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Verificar código 2FA después del login
// @route   POST /api/auth/verify-2fa
// @access  Public (con tempToken)
export const verify2FA = async (req, res) => {
  try {
    const { tempToken, twoFactorCode } = req.body;

    if (!tempToken || !twoFactorCode) {
      return res.status(400).json({
        success: false,
        message: 'Token temporal y código 2FA son requeridos',
      });
    }

    // Verificar tempToken (jwt decode sin verificar firma completa)
    let decoded;
    try {
      decoded = jwt.decode(tempToken);
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Invalid temporary token',
      });
    }

    const user = await User.findById(decoded.userId).select('+twoFactorSecret');

    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: 'User not found or 2FA not enabled',
      });
    }

    // Verificar código 2FA
    const isValid2FA = verify2FAToken(twoFactorCode, user.twoFactorSecret);

    if (!isValid2FA) {
      return res.status(401).json({
        success: false,
        message: 'Código de dos factores inválido',
      });
    }

    // Generar tokens finales
    const accessToken = generateAccessToken(user._id.toString(), true);
    const refreshToken = generateRefreshToken(user._id.toString());

    await user.addRefreshToken(refreshToken);
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Two-factor authentication successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    console.error('Error verificando 2FA:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando código 2FA',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Refrescar access token
// @route   POST /api/auth/refresh
// @access  Public
export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token es requerido',
      });
    }

    // Verificar refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Buscar usuario y verificar que el token esté en la lista
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verificar que el token esté en la lista de refresh tokens válidos
    const tokenExists = user.refreshTokens.some((rt) => rt.token === refreshToken);
    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or revoked refresh token',
      });
    }

    // Generar nuevo access token
    const accessToken = generateAccessToken(user._id.toString());

    res.json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    console.error('Error refrescando token:', error);
    res.status(500).json({
      success: false,
      message: 'Error al refrescar token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken && req.user) {
      await req.user.revokeRefreshToken(refreshToken);
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Obtener usuario actual
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -twoFactorSecret');

    // Si el usuario no tiene rol o tiene rol vacío, asignar 'admin' por defecto
    if (!user.role || user.role.trim() === '') {
      user.role = 'admin';
      await user.save();
    }

    res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user information',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Habilitar 2FA
// @route   POST /api/auth/enable-2fa
// @access  Private
export const enable2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+twoFactorSecret');

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA ya está habilitado',
      });
    }

    // Generar secreto 2FA
    const { secret, otpAuthUrl } = await generate2FASecret(user.email);
    const qrCode = await generateQRCode(otpAuthUrl);

    // Guardar secreto temporalmente (no habilitar aún)
    user.twoFactorSecret = secret;
    await user.save();

    res.json({
      success: true,
      message: 'Escanea el QR code con tu app de autenticación',
      data: {
        qrCode,
        secret: secret, // Solo para desarrollo, en producción no enviar
        manualEntryKey: secret,
      },
    });
  } catch (error) {
    console.error('Error habilitando 2FA:', error);
    res.status(500).json({
      success: false,
      message: 'Error al habilitar 2FA',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Confirmar y activar 2FA
// @route   POST /api/auth/confirm-2fa
// @access  Private
export const confirm2FA = async (req, res) => {
  try {
    const { twoFactorCode } = req.body;

    if (!twoFactorCode) {
      return res.status(400).json({
        success: false,
        message: 'Código 2FA es requerido',
      });
    }

    const user = await User.findById(req.user._id).select('+twoFactorSecret');

    if (!user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: 'Primero debes generar el secreto 2FA',
      });
    }

    // Verificar código
    const isValid = verify2FAToken(twoFactorCode, user.twoFactorSecret);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid 2FA code',
      });
    }

    // Habilitar 2FA
    user.twoFactorEnabled = true;
    await user.save();

    res.json({
      success: true,
      message: '2FA enabled successfully',
    });
  } catch (error) {
    console.error('Error confirmando 2FA:', error);
    res.status(500).json({
      success: false,
      message: 'Error al confirmar 2FA',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Cambiar contraseña en primer login
// @route   POST /api/auth/first-password-change
// @access  Public (with tempToken)
export const firstPasswordChange = async (req, res) => {
  try {
    const { tempToken, currentPassword, newPassword } = req.body;

    if (!tempToken || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 8 caracteres',
      });
    }

    // Verificar tempToken
    let decoded;
    try {
      decoded = jwt.decode(tempToken);
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Invalid temporary token',
      });
    }

    const user = await User.findById(decoded.userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.requirePasswordChange) {
      return res.status(400).json({
        success: false,
        message: 'Password change not required for this user',
      });
    }

    // Verificar contraseña actual
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta',
      });
    }

    // Actualizar contraseña y remover flag
    user.password = newPassword;
    user.requirePasswordChange = false;
    await user.save();

    // Resetear intentos fallidos
    await user.resetLoginAttempts();

    // Generar tokens para login automático
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Guardar refresh token
    await user.addRefreshToken(refreshToken);

    // Actualizar último login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Deshabilitar 2FA
// @route   POST /api/auth/disable-2fa
// @access  Private
export const disable2FA = async (req, res) => {
  try {
    const { password, twoFactorCode } = req.body;

    const user = await User.findById(req.user._id).select('+password +twoFactorSecret');

    // Verificar contraseña
    if (!password || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password',
      });
    }

    // Si tiene 2FA habilitado, verificar código
    if (user.twoFactorEnabled && twoFactorCode) {
      const isValid = verify2FAToken(twoFactorCode, user.twoFactorSecret);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid 2FA code',
        });
      }
    }

    // Deshabilitar 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    res.json({
      success: true,
      message: '2FA disabled successfully',
    });
  } catch (error) {
    console.error('Error deshabilitando 2FA:', error);
    res.status(500).json({
      success: false,
      message: 'Error al deshabilitar 2FA',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
