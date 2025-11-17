# Script para Crear Usuarios

## Descripción
Este script permite crear nuevos usuarios en el sistema AmSpec con diferentes roles y permisos.

## Características
- ✅ Creación interactiva de usuarios
- ✅ Soporte para parámetros de línea de comandos
- ✅ Validación de datos
- ✅ Verificación de duplicados
- ✅ Soporte para diferentes roles (admin, user, viewer)
- ✅ Campos opcionales (teléfono, biografía)

## Uso

### 1. Modo Interactivo
Ejecuta el script sin parámetros y responde las preguntas:

```bash
cd server
npm run create:user
```

El script te solicitará:
- Email
- Password (mínimo 8 caracteres)
- Nombre completo
- Rol (admin/user/viewer)
- Teléfono (opcional)
- Biografía (opcional)

### 2. Modo con Parámetros
Puedes pasar los datos directamente como parámetros:

```bash
cd server
npm run create:user -- --email usuario@ejemplo.com --password micontraseña --name "Juan Pérez" --role admin --phone "+123456789" --bio "Descripción del usuario"
```

#### Parámetros Disponibles:
- `--email`: Email del usuario (obligatorio)
- `--password`: Contraseña (obligatorio, mínimo 8 caracteres)
- `--name`: Nombre completo (obligatorio)
- `--role`: Rol del usuario (admin/user/viewer, default: user)
- `--phone`: Teléfono (opcional)
- `--bio`: Biografía (opcional)

## Roles Disponibles

### admin
- Acceso completo al panel administrativo
- Puede gestionar otros usuarios
- Debe cambiar contraseña en primer login
- No es super administrador

### user
- Acceso a funciones básicas de usuario
- Puede gestionar su propio perfil
- Acceso a operaciones permitidas

### viewer
- Solo puede ver información
- Sin permisos de modificación
- Acceso de solo lectura

## Ejemplos de Uso

### Crear Administrador
```bash
npm run create:user -- --email admin@empresa.com --password Admin123456 --name "Administrador Sistema" --role admin
```

### Crear Usuario Estándar
```bash
npm run create:user -- --email usuario@empresa.com --password User123456 --name "Juan Pérez" --role user --phone "+56912345678"
```

### Crear Visualizador
```bash
npm run create:user -- --email viewer@empresa.com --password Viewer123456 --name "Carlos López" --role viewer --bio "Supervisor de calidad"
```

## Resultado Exitoso
```
✅ ¡Usuario creado exitosamente!

📋 Datos del usuario:
   Email: usuario@ejemplo.com
   Nombre: Juan Pérez
   Rol: user
   Teléfono: +56912345678
   Biografía: Descripción del usuario
   ID: 64a1b2c3d4e5f6789012345
   Activo: Sí
   Requiere cambio de password: No

🔐 IMPORTANTE:
   - Guarda estas credenciales en un lugar seguro
   - Comparte el password con el usuario de forma segura
   - El usuario puede cambiar su password después del login
```

## Manejo de Errores

### Email Duplicado
```
❌ Error: Ya existe un usuario con el email usuario@ejemplo.com
```

### Password Inválido
```
❌ Error: El password debe tener al menos 8 caracteres
```

### Rol Inválido
```
❌ Error: El rol debe ser uno de: admin, user, viewer
```

## Notas Importantes
- Los administradores creados con este script NO son super administradores
- Los administradores deben cambiar su contraseña en el primer login
- El script verifica que no existan usuarios duplicados
- Todos los campos obligatorios deben ser proporcionados
- La conexión a MongoDB es requerida

## Archivos Relacionados
- `scripts/createUser.js` - Script principal
- `models/User.js` - Modelo de usuario
- `config/database.js` - Configuración de base de datos
- `package.json` - Scripts disponibles