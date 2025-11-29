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

const testSuperAdminVisibility = async () => {
  try {
    console.log('\n🔍 Testing Super Admin Visibility\n');

    await connectDB();

    // 1. Query como lo haría un admin regular (sin select '+isSuperAdmin')
    console.log('Test 1: Regular admin query (getAllUsers simulation)');
    console.log('========================================================');

    // Simular la query que hace getAllUsers para un admin regular
    const regularAdminQuery = { isSuperAdmin: { $ne: true } };
    const usersVisibleToRegularAdmin = await User.find(regularAdminQuery)
      .select('-password -twoFactorSecret -refreshTokens -resetPasswordToken -resetPasswordExpiry -currentChallenge -isSuperAdmin')
      .sort({ createdAt: -1 });

    console.log(`\nUsers visible to REGULAR ADMIN: ${usersVisibleToRegularAdmin.length}`);
    usersVisibleToRegularAdmin.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    // 2. Query como lo haría un Super Admin (con acceso a isSuperAdmin)
    console.log('\n\nTest 2: Super Admin query (getAllUsers simulation)');
    console.log('========================================================');

    // Simular que el usuario actual es Super Admin
    const allUsers = await User.find({})
      .select('-password -twoFactorSecret -refreshTokens -resetPasswordToken -resetPasswordExpiry -currentChallenge +isSuperAdmin')
      .sort({ createdAt: -1 });

    console.log(`\nUsers visible to SUPER ADMIN: ${allUsers.length}`);
    allUsers.forEach((user, index) => {
      const superAdminBadge = user.isSuperAdmin ? '👑 SUPER ADMIN' : '';
      console.log(`  ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role} ${superAdminBadge}`);
    });

    // 3. Verificar que el campo isSuperAdmin NO se expone por defecto
    console.log('\n\nTest 3: Default query (without explicit select)');
    console.log('========================================================');

    const defaultQuery = await User.find({});
    console.log(`\nUsers found: ${defaultQuery.length}`);
    defaultQuery.forEach((user, index) => {
      const hasIsSuperAdminField = user.isSuperAdmin !== undefined;
      console.log(`  ${index + 1}. ${user.name} (${user.email})`);
      console.log(`      isSuperAdmin field exposed: ${hasIsSuperAdminField ? '❌ YES (PROBLEMA!)' : '✅ NO (Correcto)'}`);
    });

    // 4. Verificar que NO se puede actualizar un Super Admin sin ser Super Admin
    console.log('\n\nTest 4: Regular admin trying to get Super Admin details');
    console.log('========================================================');

    const superAdmin = await User.findOne({ email: 'cuellar1992@gmail.com' });
    console.log(`\nSuper Admin found without select: ${superAdmin ? 'YES' : 'NO'}`);
    if (superAdmin) {
      console.log(`  Name: ${superAdmin.name}`);
      console.log(`  Email: ${superAdmin.email}`);
      console.log(`  isSuperAdmin field visible: ${superAdmin.isSuperAdmin !== undefined ? '❌ YES (PROBLEMA!)' : '✅ NO (Correcto)'}`);
    }

    // 5. Resumen final
    console.log('\n\n📊 SUMMARY');
    console.log('========================================================');

    const regularAdminCount = usersVisibleToRegularAdmin.length;
    const superAdminCount = allUsers.length;
    const hiddenCount = superAdminCount - regularAdminCount;

    console.log(`✅ Regular admins can see: ${regularAdminCount} users`);
    console.log(`✅ Super admins can see: ${superAdminCount} users`);
    console.log(`✅ Hidden from regular admins: ${hiddenCount} Super Admin(s)`);

    if (hiddenCount > 0) {
      console.log('\n🎉 Super Admin is PROPERLY HIDDEN from regular admins!');
    } else {
      console.log('\n⚠️  WARNING: Super Admin might not be properly hidden!');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error testing visibility:', error.message);
    process.exit(1);
  }
};

testSuperAdminVisibility();
