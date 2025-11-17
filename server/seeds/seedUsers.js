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

const seedUsers = async () => {
  try {
    await connectDB();

    console.log('\n🌱 Starting user seeding...\n');

    // Verificar si ya existe un usuario admin
    const existingAdmin = await User.findOne({ email: 'admin@amspec.com' });
    if (existingAdmin) {
      console.log('ℹ️  Usuario admin ya existe. Eliminando para recrear...');
      await User.deleteOne({ email: 'admin@amspec.com' });
    }

    // Crear usuario admin
    console.log('👤 Creating admin user...');
    const adminUser = await User.create({
      email: 'admin@amspec.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin',
    });
    console.log(`✅ Usuario admin creado: ${adminUser.email}`);

    // Verificar si ya existe un usuario normal
    const existingUser = await User.findOne({ email: 'user@amspec.com' });
    if (existingUser) {
      console.log('ℹ️  Usuario normal ya existe. Eliminando para recrear...');
      await User.deleteOne({ email: 'user@amspec.com' });
    }

    // Crear usuario normal
    console.log('👤 Creating regular user...');
    const regularUser = await User.create({
      email: 'user@amspec.com',
      password: 'user1234',
      name: 'Test User',
      role: 'user',
    });
    console.log(`✅ Usuario normal creado: ${regularUser.email}`);

    console.log('\n✅ User seeding completed successfully!\n');
    console.log('📋 Credenciales de prueba:');
    console.log('   Admin:');
    console.log('   Email: admin@amspec.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('   Usuario:');
    console.log('   Email: user@amspec.com');
    console.log('   Password: user1234');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();

