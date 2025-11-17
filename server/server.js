import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import { securityHeaders, apiLimiter } from './middleware/security.js';
import { authenticate } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import passkeyRoutes from './routes/passkey.js';
import userRoutes from './routes/users.js';
import passwordRoutes from './routes/password.js';
import shipNominationRoutes from './routes/shipNominations.js';
import molekulisLoadingRoutes from './routes/molekulisLoading.js';
import otherJobsRoutes from './routes/otherJobs.js';
import dropdownRoutes from './routes/dropdowns.js';
import samplingRosterRoutes from './routes/samplingRosters.js';
import eventRoutes from './routes/events.js';
import samplerRoutes from './routes/samplers.js';
import ShipNomination from './models/ShipNomination.js';
import OtherJob from './models/OtherJob.js';
import MolekulisLoading from './models/MolekulisLoading.js';
import SamplingRoster from './models/SamplingRoster.js';

// Get current directory (ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
// Primero intenta cargar desde el directorio server/, luego desde la raíz del proyecto
const serverEnvPath = path.join(__dirname, '.env');
const rootEnvPath = path.join(__dirname, '..', '.env');

// Cargar archivo .env del directorio server primero
dotenv.config({ path: serverEnvPath });

// Si no se encontró, intentar desde la raíz del proyecto
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: rootEnvPath });
}

// Validar variables de entorno críticas
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Error: Faltan variables de entorno requeridas:');
  missingVars.forEach((varName) => {
    console.error(`   - ${varName}`);
  });
  console.error('\n📝 Por favor, configura estas variables en tu archivo .env o en Digital Ocean');
  process.exit(1);
}

// Validar FRONTEND_URL en producción
if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  console.warn('⚠️  Advertencia: FRONTEND_URL no está configurada en producción');
  console.warn('   Esto puede causar problemas con CORS y enlaces de recuperación de contraseña');
}

// Connect to MongoDB and start server
(async () => {
  try {
    // Connect to MongoDB
    console.log('\n============================================================');
    console.log('🔌 Verifying connection to MongoDB...');
    await connectDB();

    // Cron job to update statuses every hour
    cron.schedule('0 * * * *', async () => {
      try {
        console.log('🔄 Running scheduled status update...');

        // Update Ship Nomination statuses
        await ShipNomination.updateAllStatuses();
        console.log('✅ Ship Nomination statuses updated successfully');

        // Update Sampling Roster statuses
        await SamplingRoster.updateAllStatuses();
        console.log('✅ Sampling Roster statuses updated successfully');

        // Update Molekulis Loading statuses
        await MolekulisLoading.updateAllStatuses();
        console.log('✅ Molekulis Loading statuses updated successfully');

        // Update Other Job statuses
        await OtherJob.updateAllStatuses();
        console.log('✅ Other Job statuses updated successfully');

      } catch (error) {
        console.error('❌ Error updating statuses:', error.message);
      }
    });

    console.log('⏰ Cron job scheduled to run every hour');

    // Initialize Express app
    const app = express();

    // Security middleware (debe ir primero)
    app.use(securityHeaders);

    // CORS configuration
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:8080',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8080',
    ].filter(Boolean); // Remover valores undefined/null

    app.use(
      cors({
        origin: (origin, callback) => {
          // En producción, requerir FRONTEND_URL
          if (process.env.NODE_ENV === 'production') {
            if (!process.env.FRONTEND_URL) {
              console.warn('⚠️  Advertencia: FRONTEND_URL no configurada en producción');
              return callback(new Error('FRONTEND_URL debe estar configurada en producción'));
            }
            // Permitir peticiones sin origin (navegación directa del navegador)
            // O peticiones del mismo origen (FRONTEND_URL)
            if (!origin || origin === process.env.FRONTEND_URL) {
              callback(null, true);
            } else {
              console.warn('🚫 CORS bloqueó origen:', origin);
              callback(new Error('No permitido por CORS'));
            }
          } else {
            // En desarrollo, permitir orígenes de desarrollo
            if (!origin || allowedOrigins.includes(origin)) {
              callback(null, true);
            } else {
              console.warn('🚫 CORS bloqueó origen en desarrollo:', origin);
              callback(new Error('No permitido por CORS'));
            }
          }
        },
        credentials: true,
      })
    );

    // Body parser middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // API rate limiting (aplicar a todas las rutas API)
    app.use('/api', apiLimiter);

    // Health check endpoint (para monitoreo de Digital Ocean)
    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
      });
    });

    // API info endpoint
    app.get('/api', (req, res) => {
      res.json({
        message: '🚢 AmSpec Backend API',
        version: '1.0.0',
        endpoints: {
          auth: '/api/auth',
          shipNominations: '/api/ship-nominations',
          molekulisLoading: '/api/molekulis-loading',
          agents: '/api/dropdowns/agents',
          berths: '/api/dropdowns/berths',
          chemists: '/api/dropdowns/chemists',
          samplers: '/api/dropdowns/samplers',
          surveyors: '/api/dropdowns/surveyors',
          terminals: '/api/dropdowns/terminals',
          clients: '/api/dropdowns/clients',
          productTypes: '/api/dropdowns/product-types',
          otherJobs: '/api/other-jobs',
          samplingRosters: '/api/sampling-rosters',
          samplersStats: '/api/samplers',
          events: '/api/events',
          health: '/health',
        },
      });
    });

    // Auth routes (públicas)
    app.use('/api/auth', authRoutes);

    // Passkey routes (mix of public and protected)
    app.use('/api/auth/passkey', passkeyRoutes);

    // Password recovery routes (públicas)
    app.use('/api/password', passwordRoutes);

    // User routes (protegidas)
    app.use('/api/users', userRoutes);

    // Protected routes (requieren autenticación)
    app.use('/api/ship-nominations', authenticate, shipNominationRoutes);
    app.use('/api/molekulis-loading', authenticate, molekulisLoadingRoutes);
    app.use('/api/other-jobs', authenticate, otherJobsRoutes);
    app.use('/api/dropdowns', authenticate, dropdownRoutes);
    app.use('/api/sampling-rosters', authenticate, samplingRosterRoutes);
    app.use('/api/samplers', authenticate, samplerRoutes);
    app.use('/api/events', authenticate, eventRoutes);

    // Serve static files from frontend build (producción)
    if (process.env.NODE_ENV === 'production') {
      const publicPath = path.join(__dirname, 'public');
      console.log('📁 Serving static files from:', publicPath);

      // Servir archivos estáticos
      app.use(express.static(publicPath));

      // Manejar rutas de SPA (Single Page Application)
      // Todas las rutas que no sean /api/* ni /health deben servir index.html
      app.get('*', (req, res) => {
        // Si la ruta comienza con /api o /health, no hacer nada (ya manejado arriba)
        if (req.path.startsWith('/api') || req.path === '/health') {
          return res.status(404).json({
            success: false,
            message: 'API endpoint not found',
          });
        }

        // Servir index.html para todas las demás rutas (SPA routing)
        const indexPath = path.join(publicPath, 'index.html');
        console.log('📄 Serving index.html for route:', req.path);
        res.sendFile(indexPath, (err) => {
          if (err) {
            console.error('❌ Error serving index.html:', err);
            res.status(500).send('Error loading application');
          }
        });
      });
    }

    // Error handling middleware
    app.use((err, req, res, _next) => { // eslint-disable-line @typescript-eslint/no-unused-vars
      // Log completo para desarrollo, mensaje simple para producción
      if (process.env.NODE_ENV === 'development') {
        console.error('🔍 Error details:', err.stack);
      } else {
        console.error('🚨 Error occurred:', err.message);
      }
      
      res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? {
          message: err.message,
          stack: err.stack
        } : {},
      });
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
      });
    });

    // Start server
    const PORT = process.env.PORT || 5000;
    const HOST = '0.0.0.0'; // Permite conexiones desde cualquier IP de la red

    app.listen(PORT, HOST, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📍 Local: http://localhost:${PORT}`);
      console.log(`📍 Network: http://${getLocalIP()}:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
})();

// Función auxiliar para obtener la IP local
function getLocalIP() {
  const nets = os.networkInterfaces();

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Ignorar direcciones IPv6 y localhost
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}
