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

const createUser = async () => {
  try {
    console.log('\n🔧 AmSpec - Crear Nuevo Usuario\n');
    
    // Obtener parámetros de línea de comandos o solicitarlos
    const args = getArgs();
    
    let email = args.email;
    let password = args.password;
    let name = args.name;
    let role = args.role || 'user';
    let phone = args.phone || '';
    let bio = args.bio || '';
    
    // Si no se proporcionaron argumentos, solicitarlos interactivamente
    if (!email || !password || !name) {
      console.log('Por favor, ingresa los datos del usuario:\n');
      
      if (!email) email = await askQuestion('Email: ');
      if (!password) password = await askQuestion('Password (mínimo 8 caracteres): ');
      if (!name) name = await askQuestion('Nombre completo: ');
      
      const roleInput = await askQuestion('Rol (admin/user/viewer) [default: user]: ');
      if (roleInput) role = roleInput;
      
      const phoneInput = await askQuestion('Teléfono (opcional): ');
      if (phoneInput) phone = phoneInput;
      
      const bioInput = await askQuestion('Biografía (opcional): ');
      if (bioInput) bio = bioInput;
    }
    
    // Validaciones básicas
    if (!email || !password || !name) {
      console.error('\n❌ Error: Email, password y nombre son obligatorios\n');
      process.exit(1);
    }
    
    if (password.length < 8) {
      console.error('\n❌ Error: El password debe tener al menos 8 caracteres\n');
      process.exit(1);
    }
    
    if (!['admin', 'user', 'viewer'].includes(role)) {
      console.error('\n❌ Error: El rol debe ser uno de: admin, user, viewer\n');
      process.exit(1);
    }
    
    console.log('\n============================================================');
    console.log('🔌 Verifying connection to MongoDB...');
    await connectDB();

    // Verificar si ya existe el usuario
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      console.error(`\n❌ Error: Ya existe un usuario con el email ${email}\n`);
      process.exit(1);
    }

    // Crear nuevo usuario
    console.log('👤 Creando usuario...');
    const userData = {
      email,
      password,
      name,
      role,
      phone: phone || undefined,
      bio: bio || undefined,
      isSuperAdmin: role === 'admin' ? false : undefined, // Solo el script de admin crea super admins
      requirePasswordChange: role === 'admin' ? true : false // Los admins deben cambiar password al primer login
    };

    const newUser = await User.create(userData);

    console.log('\n✅ ¡Usuario creado exitosamente!');
    console.log('\n📋 Datos del usuario:');
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Nombre: ${newUser.name}`);
    console.log(`   Rol: ${newUser.role}`);
    console.log(`   Teléfono: ${newUser.phone || 'No especificado'}`);
    console.log(`   Biografía: ${newUser.bio || 'No especificada'}`);
    console.log(`   ID: ${newUser._id}`);
    console.log(`   Activo: ${newUser.isActive ? 'Sí' : 'No'}`);
    console.log(`   Requiere cambio de password: ${newUser.requirePasswordChange ? 'Sí' : 'No'}`);
    
    if (role === 'admin') {
      console.log('\n⚠️  Nota: Este administrador deberá cambiar su contraseña en el primer inicio de sesión.');
    }
    
    console.log('\n🔐 IMPORTANTE:');
    console.log('   - Guarda estas credenciales en un lugar seguro');
    console.log('   - Comparte el password con el usuario de forma segura');
    console.log('   - El usuario puede cambiar su password después del login\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creando usuario:', error.message);
    
    if (error.code === 11000) {
      console.error('🔍 Error de duplicado: Ya existe un usuario con ese email');
    }
    
    console.log('\n💡 Posibles soluciones:');
    console.log('   1. Verifica que MongoDB esté ejecutándose');
    console.log('   2. Revisa la cadena de conexión en .env');
    console.log('   3. Asegúrate de que no existe ya un usuario con ese email');
    console.log('   4. Verifica que todos los campos obligatorios estén completos\n');
    
    process.exit(1);
  }
};

// Manejar la entrada estándar para modo interactivo
process.stdin.resume();
process.stdin.setEncoding('utf8');

createUser();