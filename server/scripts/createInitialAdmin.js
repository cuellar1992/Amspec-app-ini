import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/database.js';
import User from '../models/User.js';

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverEnvPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: serverEnvPath });

// Configuración del usuario admin
const adminConfig = {
  email: 'admin@amspec.com',
  password: 'admin123456', // Password seguro por defecto
  name: 'Administrator',
  role: 'admin',
  isSuperAdmin: true
};

const createInitialAdmin = async () => {
  try {
    console.log('\n🔧 AmSpec - Crear Usuario Administrador Inicial\n');
    console.log('Conectando a la base de datos...');
    
    await connectDB();

    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: adminConfig.email },
        { role: 'admin' },
        { isSuperAdmin: true }
      ]
    });

    if (existingAdmin) {
      console.log('⚠️  Ya existe un administrador en el sistema:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Nombre: ${existingAdmin.name}`);
      console.log(`   Rol: ${existingAdmin.role}`);
      console.log(`   Super Admin: ${existingAdmin.isSuperAdmin ? 'Sí' : 'No'}`);
      console.log('\n❌ No se puede crear otro administrador inicial.');
      console.log('   Si necesitas resetear, elimina el usuario existente primero.\n');
      process.exit(1);
    }

    // Crear nuevo admin
    console.log('👤 Creando administrador inicial...');
    const newAdmin = await User.create(adminConfig);

    console.log('\n✅ ¡Administrador creado exitosamente!');
    console.log('\n📋 Credenciales del administrador:');
    console.log(`   Email: ${newAdmin.email}`);
    console.log(`   Password: ${adminConfig.password}`);
    console.log(`   Nombre: ${newAdmin.name}`);
    console.log(`   Rol: ${newAdmin.role}`);
    console.log(`   Super Admin: ${newAdmin.isSuperAdmin ? 'Sí' : 'No'}`);
    console.log(`   ID: ${newAdmin._id}`);
    console.log('\n🔐 IMPORTANTE:');
    console.log('   - Cambia el password después del primer login');
    console.log('   - Mantén estas credenciales en un lugar seguro');
    console.log('   - Este es el único super administrador del sistema\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creando administrador:', error.message);
    
    if (error.code === 11000) {
      console.error('🔍 Error de duplicado: Ya existe un usuario con ese email');
    }
    
    console.log('\n💡 Posibles soluciones:');
    console.log('   1. Verifica que MongoDB esté ejecutándose');
    console.log('   2. Revisa la cadena de conexión en .env');
    console.log('   3. Asegúrate de que no existe ya un admin\n');
    
    process.exit(1);
  }
};

createInitialAdmin();
