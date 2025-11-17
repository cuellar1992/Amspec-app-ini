import mongoose from 'mongoose';

const connectDB = async (retries = 5, delay = 5000) => {
  try {
    // Validar que MONGODB_URI esté definida
    if (!process.env.MONGODB_URI) {
      console.error('❌ Error: MONGODB_URI no está definida en las variables de entorno');
      console.error('📝 Por favor, crea un archivo .env en el directorio server/ con:');
      console.error('   MONGODB_URI=mongodb://localhost:27017/amspec');
      console.error('   O tu cadena de conexión de MongoDB Atlas');
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Opciones de conexión para producción
      maxPoolSize: 10, // Mantener hasta 10 conexiones en el pool
      serverSelectionTimeoutMS: 10000, // Timeout de 10 segundos para seleccionar servidor
      socketTimeoutMS: 45000, // Timeout de 45 segundos para operaciones
      connectTimeoutMS: 10000, // Timeout de 10 segundos para conexión inicial
      retryWrites: true,
      w: 'majority',
      bufferCommands: false, // Deshabilitar buffering para contenedores
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log('============================================================\n');

    // Manejar eventos de conexión
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    
    // En contenedores, reintentar la conexión
    if (retries > 0) {
      console.log(`🔄 Retrying connection in ${delay/1000} seconds... (${retries} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectDB(retries - 1, delay);
    } else {
      console.error('❌ Failed to connect to MongoDB after multiple attempts');
      if (process.env.NODE_ENV === 'production') {
        // En producción, no salir inmediatamente, dar tiempo al contenedor de BD
        console.log('⏳ Waiting 30 seconds before exiting...');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
      process.exit(1);
    }
  }
};

export default connectDB;
