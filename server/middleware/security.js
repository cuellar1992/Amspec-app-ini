import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Configuración de Helmet para seguridad HTTP
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      // Permitir scripts inline con hash específico o 'unsafe-inline' en producción
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.FRONTEND_URL, process.env.BACKEND_URL].filter(Boolean),
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Rate limiter para login (más estricto)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por IP en 15 minutos
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // No contar requests exitosos
});

// Rate limiter general para API
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300, // 300 requests por IP en 15 minutos (aumentado para operaciones legítimas)
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para registro
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 registros por IP en 1 hora
  message: {
    success: false,
    message: 'Too many registration attempts. Please try again in 1 hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para refresh token
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 refreshes por IP en 15 minutos
  message: {
    success: false,
    message: 'Too many refresh attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

