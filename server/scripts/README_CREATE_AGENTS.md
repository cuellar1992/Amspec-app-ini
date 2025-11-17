# Script para Crear Agents

## Descripción
Este script crea los agents predefinidos en el sistema AmSpec. Los agents son empresas o entidades que realizan operaciones en el sistema.

## Agents Predefinidos
El script creará los siguientes agents:
1. **Wave Shipping**
2. **GAC**
3. **SGM**
4. **Wilhelmsen**
5. **ISS**

## Características
- ✅ Creación automática de agents predefinidos
- ✅ Verificación de duplicados
- ✅ Manejo de errores
- ✅ Reporte de resultados
- ✅ Todos los agents se crean como activos por defecto

## Uso

### Ejecutar el Script
Desde el directorio `server/`, ejecuta:

```bash
npm run create:agents
```

## Resultado Exitoso
```
🔧 AmSpec - Crear Agents

Conectando a la base de datos...
📋 Agents a crear:
   1. Wave Shipping
   2. GAC
   3. SGM
   4. Wilhelmsen
   5. ISS

✅ Wave Shipping - Creado exitosamente (ID: 64a1b2c3d4e5f6789012345)
✅ GAC - Creado exitosamente (ID: 64a1b2c3d4e5f6789012346)
✅ SGM - Creado exitosamente (ID: 64a1b2c3d4e5f6789012347)
✅ Wilhelmsen - Creado exitosamente (ID: 64a1b2c3d4e5f6789012348)
✅ ISS - Creado exitosamente (ID: 64a1b2c3d4e5f6789012349)

📊 Resumen:
   ✅ Agents creados: 5
   ⚠️  Agents omitidos: 0
   📋 Total procesados: 5

🎉 ¡Agents creados exitosamente!

📝 Para ver todos los agents:
   1. Inicia sesión en la aplicación como administrador
   2. Navega a la sección de Agents
   3. Podrás ver y gestionar todos los agents

✅ Proceso completado.
```

## Comportamiento con Duplicados
Si un agent ya existe en la base de datos, el script lo omitirá y continuará con los demás:

```
⚠️  Wave Shipping - Ya existe, omitiendo...
✅ GAC - Creado exitosamente (ID: 64a1b2c3d4e5f6789012346)
⚠️  SGM - Duplicado, omitiendo...
✅ Wilhelmsen - Creado exitosamente (ID: 64a1b2c3d4e5f6789012348)
✅ ISS - Creado exitosamente (ID: 64a1b2c3d4e5f6789012349)

📊 Resumen:
   ✅ Agents creados: 3
   ⚠️  Agents omitidos: 2
   📋 Total procesados: 5
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
- Si necesitas agregar nuevos agents, puedes modificar el array `defaultAgents` en el script
- Todos los agents se crean como activos (`isActive: true`)
- Los nombres de los agents son únicos en la base de datos
- El script es idempotente: puede ejecutarse múltiples veces sin crear duplicados

## Modificar Agents Predefinidos
Para agregar o modificar la lista de agents predefinidos, edita el archivo `createAgents.js` y modifica el array `defaultAgents`:

```javascript
const defaultAgents = [
  'Wave Shipping',
  'GAC',
  'SGM',
  'Wilhelmsen',
  'ISS',
  'Nuevo Agent 1',
  'Nuevo Agent 2'
];
```

## Archivos Relacionados
- `scripts/createAgents.js` - Script principal
- `models/Agent.js` - Modelo de Agent
- `config/database.js` - Configuración de base de datos
- `package.json` - Scripts disponibles