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

const checkUsers = async () => {
  try {
    console.log('\n📋 Checking all users in database\n');

    await connectDB();

    // Obtener todos los usuarios incluyendo Super Admins
    const allUsers = await User.find({}).select('+isSuperAdmin +password');

    console.log(`Total users in database: ${allUsers.length}\n`);

    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. User Details:`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Super Admin: ${user.isSuperAdmin ? '✅ YES' : '❌ NO'}`);
      console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Updated: ${user.updatedAt}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error checking users:', error.message);
    process.exit(1);
  }
};

checkUsers();
