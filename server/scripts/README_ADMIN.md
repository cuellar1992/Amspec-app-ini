# Script de Usuario Administrador Inicial

## Descripción
Este script crea el primer usuario administrador para el sistema AmSpec. Solo debe ejecutarse una vez durante la configuración inicial del sistema.

## Características
- ✅ Verifica si ya existe un administrador
- ✅ Crea un usuario con rol de super administrador
- ✅ Configuración automática de credenciales
- ✅ Validaciones de seguridad
- ✅ Mensajes informativos claros

## Credenciales por Defecto
- **Email**: admin@amspec.com
- **Password**: admin123456
- **Nombre**: Administrator
- **Rol**: admin
- **Super Admin**: true

## Uso

### 1. Preparar la Base de Datos
Asegúrate de que MongoDB esté ejecutándose y que el archivo `.env` esté configurado:

```env
MONGODB_URI=mongodb://localhost:27017/amspec
# o tu cadena de conexión de MongoDB Atlas
```

### 2. Ejecutar el Script
Desde el directorio `server/`, ejecuta:

```bash
npm run create:admin
```

### 3. Verificar Resultado
Si es exitoso, verás:
```
✅ ¡Administrador creado exitosamente!

📋 Credenciales del administrador:
   Email: admin@amspec.com
   Password: admin123456
   Nombre: Administrator
   Rol: admin
   Super Admin: Sí
```

## Comportamiento del Script

### Si ya existe un administrador:
```
⚠️  Ya existe un administrador en el sistema:
   Email: usuario@ejemplo.com
   Nombre: Admin User
   Rol: admin
   Super Admin: No

❌ No se puede crear otro administrador inicial.
   Si necesitas resetear, elimina el usuario existente primero.
```

### Si hay un error de conexión:
```
❌ Error creando administrador: [mensaje de error]

💡 Posibles soluciones:
   1. Verifica que MongoDB esté ejecutándose
   2. Revisa la cadena de conexión en .env
   3. Asegúrate de que no existe ya un admin
```

## Seguridad

⚠️ **IMPORTANTE**: 
- Cambia el password después del primer login
- Mantén estas credenciales en un lugar seguro
- Este es el único super administrador del sistema

## Resetear Administrador

Si necesitas eliminar el administrador existente:

1. Conecta a MongoDB:
```bash
mongosh
```

2. Usa la base de datos:
```javascript
use amspec
```

3. Elimina el usuario admin:
```javascript
db.users.deleteOne({ email: "admin@amspec.com" })
```

4. O elimina todos los usuarios con rol admin:
```javascript
db.users.deleteMany({ role: "admin" })
```

5. Vuelve a ejecutar el script:
```bash
npm run create:admin
```

## Archivos Relacionados
- `scripts/createInitialAdmin.js` - Script principal
- `models/User.js` - Modelo de usuario
- `config/database.js` - Configuración de base de datos
- `package.json` - Scripts disponibles
