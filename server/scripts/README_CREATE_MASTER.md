# Script para Crear Datos Maestros

## Descripción
Este script crea todos los datos maestros predefinidos en el sistema AmSpec, incluyendo berths, chemists, samplers, surveyors, terminals, clients y product types.

## Datos Maestros Incluidos

### Berths (10)
- Bert
- Dyke-1
- K-3
- K-2
- K-1
- 112
- 102
- BIP
- BLB-1
- BLB-2
- M-7

### Chemists (3)
- Farshid
- Anh
- Ampol Lab

### Samplers (7)
- Cesar
- ruben
- Laura
- sakik
- Edwind
- ash
- Jay-cen

### Surveyors (2)
- ash
- Jay-Cen

### Terminals (9)
- Orica Botany
- BP ATOM
- Vopak
- Stolthaven
- Ampol Kurnell
- Quantem
- Orica Newcastle
- Park Fuels Newcastle
- Park Fuels Kembla

### Clients (15)
- Mobil
- Trafigura
- Chevron SG
- PCIA
- Chevron Downstream
- Glencore
- United
- S-Oil
- Q8
- Gunvor
- ASCC
- Ampol AU
- Ampol SG
- BP AU
- Viva Energy
- BP SG

### Product Types (7)
- 91 Ron
- 95 Ron
- 98 Ron
- Jet-A1
- Diesel
- Anhydrous Ammonia
- Base Oils

## Características
- ✅ Creación automática de todos los datos maestros
- ✅ Verificación de duplicados
- ✅ Manejo de errores individual por entidad
- ✅ Reporte detallado de resultados
- ✅ Todas las entidades se crean como activas por defecto

## Uso

### Ejecutar el Script
Desde el directorio `server/`, ejecuta:

```bash
npm run create:master
```

## Resultado Exitoso
```
🔧 AmSpec - Crear Datos Maestros

Conectando a la base de datos...

📋 Creando Berths:
   ✅ Bert - Creado exitosamente (ID: 64a1b2c3d4e5f6789012345)
   ✅ Dyke-1 - Creado exitosamente (ID: 64a1b2c3d4e5f6789012346)
   ...
   📊 Berths: 10 creados, 0 omitidos

📋 Creando Chemists:
   ✅ Farshid - Creado exitosamente (ID: 64a1b2c3d4e5f6789012350)
   ...

🎉 ¡Datos maestros creados exitosamente!

📊 Resumen General:
   ✅ Total creados: 46
   ⚠️  Total omitidos: 0
   📋 Total procesados: 46
```

## Comportamiento con Duplicados
Si una entidad ya existe en la base de datos, el script la omitirá y continuará con las demás:

```
📋 Creando Berths:
   ⚠️  Bert - Ya existe, omitiendo...
   ✅ Dyke-1 - Creado exitosamente (ID: 64a1b2c3d4e5f6789012346)
   📊 Berths: 9 creados, 1 omitidos
```

## Manejo de Errores

### Error de Conexión
```
❌ Error general: [mensaje de error]

💡 Posibles soluciones:
   1. Verifica que MongoDB esté ejecutándose
   2. Revisa la cadena de conexión en .env
   3. Asegúrate de tener permisos para escribir en la base de datos
```

## Notas Importantes
- El script solo debe ejecutarse una vez para la configuración inicial
- Es idempotente: puede ejecutarse múltiples veces sin crear duplicados
- Todas las entidades se crean como activas (`isActive: true`)
- Los nombres de las entidades son únicos en sus respectivas colecciones
- El script procesa cada tipo de entidad independientemente

## Modificar Datos Maestros
Para agregar o modificar los datos predefinidos, edita el archivo `createMasterData.js` y modifica los arrays correspondientes en el objeto `masterData`:

```javascript
const masterData = {
  berths: [
    'Bert', 'Dyke-1', 'K-3', 'K-2', 'K-1', '112', '102', 'BIP', 'BLB-1', 'BLB-2', 'M-7',
    'Nuevo Berth 1', 'Nuevo Berth 2'  // Agregar nuevos berths
  ],
  
  chemists: [
    { name: 'Farshid' },
    { name: 'Anh' },
    { name: 'Ampol Lab' },
    { name: 'Nuevo Chemist' }  // Agregar nuevo chemist
  ],
  
  // ... otras entidades
};
```

## Scripts Relacionados
- `npm run create:admin` - Crear usuario administrador inicial
- `npm run create:user` - Crear nuevos usuarios
- `npm run create:agents` - Crear agents predefinidos
- `npm run create:master` - Crear todos los datos maestros

## Archivos Relacionados
- `scripts/createMasterData.js` - Script principal
- `models/Berth.js` - Modelo de Berth
- `models/Chemist.js` - Modelo de Chemist
- `models/Sampler.js` - Modelo de Sampler
- `models/Surveyor.js` - Modelo de Surveyor
- `models/Terminal.js` - Modelo de Terminal
- `models/Client.js` - Modelo de Client
- `models/ProductType.js` - Modelo de ProductType
- `config/database.js` - Configuración de base de datos
- `package.json` - Scripts disponibles