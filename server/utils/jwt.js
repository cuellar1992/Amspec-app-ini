import jwt from 'jsonwebtoken';

// Generar access token (15 minutos)
export const generateAccessToken = (userId, twoFactorVerified = false) => {
  return jwt.sign(
    {
      userId,
      twoFactorVerified,
      type: 'access',
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '15m',
    }
  );
};

// Generar refresh token (7 días)
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    {
      userId,
      type: 'refresh',
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: '7d',
    }
  );
};

// Verificar refresh token
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw error;
  }
};

// Generar tokens de 2FA (temporal, 5 minutos)
export const generate2FAToken = (userId) => {
  return jwt.sign(
    {
      userId,
      type: '2fa',
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '5m',
    }
  );
};

