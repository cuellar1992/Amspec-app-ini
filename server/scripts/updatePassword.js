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

// Función para obtener argumentos de línea de comandos
const getArgs = () => {
  const args = process.argv.slice(2);
  const params = {};

  for (let i = 0; i < args.length; i += 2) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const value = args[i + 1];
      params[key] = value;
    }
  }

  return params;
};

// Función para solicitar datos por consola
const askQuestion = (question) => {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim());
    });
  });
};

const updatePassword = async () => {
  try {
    console.log('\n🔧 AmSpec - Update User Password\n');

    // Obtener parámetros de línea de comandos o solicitarlos
    const args = getArgs();

    let email = args.email;
    let password = args.password;

    // Si no se proporcionaron argumentos, solicitarlos interactivamente
    if (!email || !password) {
      console.log('Please enter the following information:\n');

      if (!email) email = await askQuestion('User Email: ');
      if (!password) password = await askQuestion('New Password (minimum 8 characters): ');
    }

    // Validaciones básicas
    if (!email || !password) {
      console.error('\n❌ Error: Email and password are required\n');
      process.exit(1);
    }

    if (password.length < 8) {
      console.error('\n❌ Error: Password must be at least 8 characters\n');
      process.exit(1);
    }

    console.log('\n============================================================');
    console.log('🔌 Verifying connection to MongoDB...');
    await connectDB();

    // Buscar el usuario
    const user = await User.findOne({ email });

    if (!user) {
      console.error(`\n❌ Error: User with email ${email} not found\n`);
      process.exit(1);
    }

    // Actualizar la contraseña
    console.log('🔐 Updating password...');
    user.password = password;
    user.requirePasswordChange = false; // Resetear flag de cambio de contraseña
    user.failedLoginAttempts = 0; // Resetear intentos fallidos
    user.lockUntil = undefined; // Desbloquear cuenta si estaba bloqueada

    await user.save();

    console.log('\n✅ Password updated successfully!');
    console.log('\n📋 User details:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);
    console.log(`   Require password change: ${user.requirePasswordChange ? 'Yes' : 'No'}`);

    console.log('\n🔐 IMPORTANT:');
    console.log('   - Save these credentials in a secure location');
    console.log('   - Share the password with the user securely');
    console.log('   - The user can change their password after login\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error updating password:', error.message);

    console.log('\n💡 Possible solutions:');
    console.log('   1. Verify that MongoDB is running');
    console.log('   2. Check the connection string in .env');
    console.log('   3. Make sure the user exists in the database');
    console.log('   4. Verify that all required fields are complete\n');

    process.exit(1);
  }
};

// Manejar la entrada estándar para modo interactivo
process.stdin.resume();
process.stdin.setEncoding('utf8');

updatePassword();
