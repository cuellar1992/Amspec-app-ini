import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/database.js';
import User from '../models/User.js';

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverEnvPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: serverEnvPath });

const testSuperAdminLogin = async () => {
  try {
    console.log('\n🔐 Testing Super Admin Login\n');

    await connectDB();

    const email = 'cuellar1992@gmail.com';
    const password = 'admin123';

    console.log(`Testing login for: ${email}`);
    console.log(`Password: ${'*'.repeat(password.length)}\n`);

    // Buscar usuario con password (select: false por defecto)
    const user = await User.findOne({ email }).select('+password +isSuperAdmin');

    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }

    console.log('✅ User found in database');
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Super Admin: ${user.isSuperAdmin ? '✅ YES' : '❌ NO'}`);
    console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);

    // Verificar contraseña
    console.log('\n🔑 Verifying password...');
    const isPasswordValid = await user.comparePassword(password);

    if (isPasswordValid) {
      console.log('✅ Password is CORRECT!');
      console.log('\n🎉 Super Admin can login successfully with credentials:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
    } else {
      console.log('❌ Password is INCORRECT!');
      console.log('\n⚠️  There might be an issue with the password.');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error testing login:', error.message);
    process.exit(1);
  }
};

testSuperAdminLogin();
