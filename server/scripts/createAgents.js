import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/database.js';
import Agent from '../models/Agent.js';

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverEnvPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: serverEnvPath });

// Agents predefinidos
const defaultAgents = [
  'Wave Shipping',
  'GAC',
  'SGM',
  'Wilhelmsen',
  'ISS'
];

const createAgents = async () => {
  try {
    console.log('\n🔧 AmSpec - Crear Agents\n');
    
    console.log('Conectando a la base de datos...');
    await connectDB();

    console.log('📋 Agents a crear:');
    defaultAgents.forEach((agent, index) => {
      console.log(`   ${index + 1}. ${agent}`);
    });

    let createdCount = 0;
    let skippedCount = 0;

    for (const agentName of defaultAgents) {
      try {
        // Verificar si ya existe el agent
        const existingAgent = await Agent.findOne({ name: agentName });
        
        if (existingAgent) {
          console.log(`⚠️  ${agentName} - Ya existe, omitiendo...`);
          skippedCount++;
          continue;
        }

        // Crear nuevo agent
        const newAgent = await Agent.create({
          name: agentName,
          isActive: true
        });

        console.log(`✅ ${agentName} - Creado exitosamente (ID: ${newAgent._id})`);
        createdCount++;
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⚠️  ${agentName} - Duplicado, omitiendo...`);
          skippedCount++;
        } else {
          console.error(`❌ Error creando ${agentName}:`, error.message);
        }
      }
    }

    console.log('\n📊 Resumen:');
    console.log(`   ✅ Agents creados: ${createdCount}`);
    console.log(`   ⚠️  Agents omitidos: ${skippedCount}`);
    console.log(`   📋 Total procesados: ${defaultAgents.length}`);

    if (createdCount > 0) {
      console.log('\n🎉 ¡Agents creados exitosamente!');
      console.log('\n📝 Para ver todos los agents:');
      console.log('   1. Inicia sesión en la aplicación como administrador');
      console.log('   2. Navega a la sección de Agents');
      console.log('   3. Podrás ver y gestionar todos los agents');
    }

    console.log('\n✅ Proceso completado.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error general:', error.message);
    
    console.log('\n💡 Posibles soluciones:');
    console.log('   1. Verifica que MongoDB esté ejecutándose');
    console.log('   2. Revisa la cadena de conexión en .env');
    console.log('   3. Asegúrate de tener permisos para escribir en la base de datos\n');
    
    process.exit(1);
  }
};

createAgents();