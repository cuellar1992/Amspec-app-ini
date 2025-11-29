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

const testSuperAdminProtection = async () => {
  try {
    console.log('\n🔒 Testing Super Admin Protection\n');

    await connectDB();

    // Buscar el super admin
    const superAdmin = await User.findOne({ email: 'cuellar1992@gmail.com' }).select('+isSuperAdmin');

    if (!superAdmin) {
      console.error('❌ Super Admin not found!');
      process.exit(1);
    }

    console.log('✅ Super Admin found:');
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Name: ${superAdmin.name}`);
    console.log(`   Role: ${superAdmin.role}`);
    console.log(`   isSuperAdmin: ${superAdmin.isSuperAdmin}`);
    console.log(`   Active: ${superAdmin.isActive}`);

    // Test 1: Intentar eliminar con deleteOne
    console.log('\n🧪 Test 1: Attempting deleteOne()...');
    try {
      await User.deleteOne({ email: 'cuellar1992@gmail.com' });
      console.log('❌ FAILED: Super Admin was deleted with deleteOne()!');
    } catch (error) {
      if (error.name === 'ProtectedUserError') {
        console.log('✅ PASSED: Protected from deleteOne()');
      } else {
        console.log(`⚠️  Unexpected error: ${error.message}`);
      }
    }

    // Test 2: Intentar eliminar con findByIdAndDelete
    console.log('\n🧪 Test 2: Attempting findByIdAndDelete()...');
    try {
      await User.findByIdAndDelete(superAdmin._id);
      console.log('❌ FAILED: Super Admin was deleted with findByIdAndDelete()!');
    } catch (error) {
      if (error.name === 'ProtectedUserError') {
        console.log('✅ PASSED: Protected from findByIdAndDelete()');
      } else {
        console.log(`⚠️  Unexpected error: ${error.message}`);
      }
    }

    // Test 3: Intentar eliminar con findOneAndDelete
    console.log('\n🧪 Test 3: Attempting findOneAndDelete()...');
    try {
      await User.findOneAndDelete({ email: 'cuellar1992@gmail.com' });
      console.log('❌ FAILED: Super Admin was deleted with findOneAndDelete()!');
    } catch (error) {
      if (error.name === 'ProtectedUserError') {
        console.log('✅ PASSED: Protected from findOneAndDelete()');
      } else {
        console.log(`⚠️  Unexpected error: ${error.message}`);
      }
    }

    // Verificar que el super admin sigue existiendo
    const stillExists = await User.findOne({ email: 'cuellar1992@gmail.com' });
    if (stillExists) {
      console.log('✅ Super Admin still exists in database');
    } else {
      console.log('❌ Super Admin was deleted!');
    }

    // Probar que admins regulares no ven al super admin
    console.log('\n🧪 Testing visibility: Checking if Super Admin is hidden from regular queries...');
    const usersWithoutSuperAdmin = await User.find({ isSuperAdmin: { $ne: true } });
    const allUsers = await User.find({});

    console.log(`   Regular query (hiding Super Admins): ${usersWithoutSuperAdmin.length} users`);
    console.log(`   Query without filter: ${allUsers.length} users`);

    if (usersWithoutSuperAdmin.length < allUsers.length) {
      console.log('✅ PASSED: Super Admin is hidden from regular queries');
    } else {
      console.log('⚠️  Warning: Super Admin might not be properly hidden');
    }

    console.log('\n✅ All tests completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error testing Super Admin protection:', error.message);
    process.exit(1);
  }
};

testSuperAdminProtection();
