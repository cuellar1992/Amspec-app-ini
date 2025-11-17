import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/database.js';
import Berth from '../models/Berth.js';
import Chemist from '../models/Chemist.js';
import Sampler from '../models/Sampler.js';
import Surveyor from '../models/Surveyor.js';
import Terminal from '../models/Terminal.js';
import Client from '../models/Client.js';
import ProductType from '../models/ProductType.js';

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverEnvPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: serverEnvPath });

// Datos predefinidos
const masterData = {
  berths: [
    'Bert', 'Dyke-1', 'K-3', 'K-2', 'K-1', '112', '102', 'BIP', 'BLB-1', 'BLB-2', 'M-7'
  ],
  
  chemists: [
    { name: 'Farshid' },
    { name: 'Anh' },
    { name: 'Ampol Lab' }
  ],
  
  samplers: [
    { name: 'Cesar' },
    { name: 'ruben' },
    { name: 'Laura' },
    { name: 'sakik' },
    { name: 'Edwind' },
    { name: 'ash' },
    { name: 'Jay-cen' }
  ],
  
  surveyors: [
    { name: 'ash' },
    { name: 'Jay-Cen' }
  ],
  
  terminals: [
    { name: 'Orica Botany' },
    { name: 'BP ATOM' },
    { name: 'Vopak' },
    { name: 'Stolthaven' },
    { name: 'Ampol Kurnell' },
    { name: 'Quantem' },
    { name: 'Orica Newcastle' },
    { name: 'Park Fuels Newcastle' },
    { name: 'Park Fuels Kembla' }
  ],
  
  clients: [
    'Mobil', 'Trafigura', 'Chevron SG', 'PCIA', 'Chevron Downstream', 
    'Glencore', 'United', 'S-Oil', 'Q8', 'Gunvor', 'ASCC', 
    'Ampol AU', 'Ampol SG', 'BP AU', 'Viva Energy', 'BP SG'
  ],
  
  productTypes: [
    '91 Ron', '95 Ron', '98 Ron', 'Jet-A1', 'Diesel', 
    'Anhydrous Ammonia', 'Base Oils'
  ]
};

const createMasterData = async () => {
  try {
    console.log('\n🔧 AmSpec - Crear Datos Maestros\n');
    
    console.log('Conectando a la base de datos...');
    await connectDB();

    let totalCreated = 0;
    let totalSkipped = 0;

    // Función helper para crear entidades
    const createEntities = async (Model, entities, entityType, nameField = 'name') => {
      console.log(`\n📋 Creando ${entityType}:`);
      let created = 0;
      let skipped = 0;

      for (const entity of entities) {
        try {
          const query = typeof entity === 'string' ? entity : entity[nameField];
          const existingEntity = await Model.findOne({ [nameField]: query });
          
          if (existingEntity) {
            console.log(`   ⚠️  ${query} - Ya existe, omitiendo...`);
            skipped++;
            continue;
          }

          const data = typeof entity === 'string' ? { [nameField]: entity } : entity;
          const newEntity = await Model.create({ ...data, isActive: true });
          
          console.log(`   ✅ ${query} - Creado exitosamente (ID: ${newEntity._id})`);
          created++;
        } catch (error) {
          if (error.code === 11000) {
            console.log(`   ⚠️  ${typeof entity === 'string' ? entity : entity[nameField]} - Duplicado, omitiendo...`);
            skipped++;
          } else {
            console.error(`   ❌ Error creando ${typeof entity === 'string' ? entity : entity[nameField]}:`, error.message);
          }
        }
      }

      totalCreated += created;
      totalSkipped += skipped;
      
      console.log(`   📊 ${entityType}: ${created} creados, ${skipped} omitidos`);
      
      return { created, skipped };
    };

    // Crear todas las entidades
    await createEntities(Berth, masterData.berths, 'Berths');
    await createEntities(Chemist, masterData.chemists, 'Chemists');
    await createEntities(Sampler, masterData.samplers, 'Samplers');
    await createEntities(Surveyor, masterData.surveyors, 'Surveyors');
    await createEntities(Terminal, masterData.terminals, 'Terminals');
    await createEntities(Client, masterData.clients, 'Clients');
    await createEntities(ProductType, masterData.productTypes, 'Product Types');

    // Resumen final
    console.log('\n🎉 ¡Datos maestros creados exitosamente!');
    console.log('\n📊 Resumen General:');
    console.log(`   ✅ Total creados: ${totalCreated}`);
    console.log(`   ⚠️  Total omitidos: ${totalSkipped}`);
    console.log(`   📋 Total procesados: ${totalCreated + totalSkipped}`);

    console.log('\n📝 Para ver todos los datos:');
    console.log('   1. Inicia sesión en la aplicación como administrador');
    console.log('   2. Navega a las secciones correspondientes');
    console.log('   3. Podrás ver y gestionar todos los datos maestros');

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

createMasterData();