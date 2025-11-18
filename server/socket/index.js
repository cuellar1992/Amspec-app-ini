import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io = null;

/**
 * Initialize Socket.IO server
 * @param {Object} httpServer - HTTP server instance
 * @returns {Object} Socket.IO server instance
 */
export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://ghost-app-oo46l.ondigitalocean.app'
      ],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId} (Role: ${socket.userRole})`);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // Join role-based room
    if (socket.userRole) {
      socket.join(`role:${socket.userRole}`);
    }

    // Handle custom events
    socket.on('join:ship-nomination', (shipNominationId) => {
      socket.join(`ship-nomination:${shipNominationId}`);
      console.log(`User ${socket.userId} joined ship-nomination:${shipNominationId}`);
    });

    socket.on('leave:ship-nomination', (shipNominationId) => {
      socket.leave(`ship-nomination:${shipNominationId}`);
      console.log(`User ${socket.userId} left ship-nomination:${shipNominationId}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to AmSpec real-time server',
      userId: socket.userId
    });
  });

  console.log('🔌 Socket.IO initialized');
  return io;
};

/**
 * Get Socket.IO server instance
 * @returns {Object} Socket.IO server instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

/**
 * Emit event to all connected clients
 * @param {string} event - Event name
 * @param {Object} data - Data to send
 */
export const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

/**
 * Emit event to specific user
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {Object} data - Data to send
 */
export const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

/**
 * Emit event to specific role
 * @param {string} role - User role
 * @param {string} event - Event name
 * @param {Object} data - Data to send
 */
export const emitToRole = (role, event, data) => {
  if (io) {
    io.to(`role:${role}`).emit(event, data);
  }
};

/**
 * Emit event to specific room
 * @param {string} room - Room name
 * @param {string} event - Event name
 * @param {Object} data - Data to send
 */
export const emitToRoom = (room, event, data) => {
  if (io) {
    io.to(room).emit(event, data);
  }
};

export default { initializeSocket, getIO, emitToAll, emitToUser, emitToRole, emitToRoom };
