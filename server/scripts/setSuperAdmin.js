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

const setSuperAdmin = async () => {
  try {
    console.log('\n👑 AmSpec - Set Super Admin\n');

    // Obtener parámetros de línea de comandos o solicitarlos
    const args = getArgs();

    let email = args.email;
    let password = args.password;
    let name = args.name;
    let enable = args.enable !== 'false'; // Por defecto true, false si se pasa --enable false

    // Si no se proporcionó email, solicitarlo interactivamente
    if (!email) {
      console.log('Please enter the following information:\n');
      email = await askQuestion('User Email: ');
      password = await askQuestion('Password (leave empty to keep existing): ');
      name = await askQuestion('Name (leave empty to keep existing): ');
      const enableInput = await askQuestion('Enable Super Admin? (yes/no) [yes]: ');
      enable = !enableInput || enableInput.toLowerCase() === 'yes' || enableInput.toLowerCase() === 'y';
    }

    // Validaciones básicas
    if (!email) {
      console.error('\n❌ Error: Email is required\n');
      process.exit(1);
    }

    console.log('\n============================================================');
    console.log('🔌 Verifying connection to MongoDB...');
    await connectDB();

    // Buscar el usuario (incluir el campo isSuperAdmin explícitamente)
    let user = await User.findOne({ email }).select('+isSuperAdmin');

    // Si el usuario no existe, crearlo
    if (!user) {
      console.log(`\n👤 User with email ${email} not found. Creating new user...`);

      // Validar que se proporcionó contraseña para usuario nuevo
      if (!password) {
        console.error('\n❌ Error: Password is required for new users\n');
        process.exit(1);
      }

      if (password.length < 8) {
        console.error('\n❌ Error: Password must be at least 8 characters\n');
        process.exit(1);
      }

      user = new User({
        email: email.toLowerCase(),
        password,
        name: name || email.split('@')[0],
        role: 'admin',
        isSuperAdmin: enable,
        isActive: true,
      });

      await user.save();
      console.log('✅ New user created successfully');
    } else {
      // Usuario existe, actualizarlo
      console.log(`\n👤 User found. Updating Super Admin status...`);

      // Actualizar el estado de Super Admin
      user.isSuperAdmin = enable;

      // Si se está habilitando como super admin, asegurarse de que tenga rol admin
      if (enable && user.role !== 'admin') {
        user.role = 'admin';
        console.log('📝 Role automatically set to admin');
      }

      // Actualizar contraseña si se proporcionó
      if (password && password.trim() !== '') {
        if (password.length < 8) {
          console.error('\n❌ Error: Password must be at least 8 characters\n');
          process.exit(1);
        }
        user.password = password;
        console.log('🔑 Password updated');
      }

      // Actualizar nombre si se proporcionó
      if (name && name.trim() !== '') {
        user.name = name;
        console.log('📝 Name updated');
      }

      await user.save();
    }

    console.log(`\n✅ Super Admin status ${enable ? 'enabled' : 'disabled'} successfully!`);
    console.log('\n📋 User details:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Super Admin: ${user.isSuperAdmin ? '✅ YES' : '❌ NO'}`);
    console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);

    if (enable) {
      console.log('\n⚠️  IMPORTANT:');
      console.log('   - This user is now a SUPER ADMIN');
      console.log('   - Super Admins are INVISIBLE to regular admins');
      console.log('   - Only Super Admins can see and modify other Super Admins');
      console.log('   - This user has FULL ACCESS to all system features');
      console.log('   - Keep this information CONFIDENTIAL\n');
    } else {
      console.log('\n📝 Note:');
      console.log('   - This user is now a regular admin/user');
      console.log('   - They will be visible to other admins');
      console.log('   - Standard permissions apply\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error setting Super Admin status:', error.message);

    console.log('\n💡 Possible solutions:');
    console.log('   1. Verify that MongoDB is running');
    console.log('   2. Check the connection string in .env');
    console.log('   3. Make sure the user exists in the database');
    console.log('   4. Verify database permissions\n');

    process.exit(1);
  }
};

// Manejar la entrada estándar para modo interactivo
process.stdin.resume();
process.stdin.setEncoding('utf8');

setSuperAdmin();
