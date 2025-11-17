# AmSpec - Scripts de Administración

Este directorio contiene scripts útiles para la gestión de usuarios y configuración del sistema.

## Scripts Disponibles

### 1. Set Super Admin (`setSuperAdmin.js`)

Marca o desmarca un usuario como Super Admin. Los Super Admins:
- Son **invisibles** para usuarios admin normales
- Solo pueden ser vistos/modificados por otros Super Admins
- Tienen acceso completo a todas las funcionalidades del sistema
- No pueden ser editados ni eliminados por admins regulares

#### Uso Interactivo

```bash
cd server
npm run set:superadmin
```

El script te pedirá:
1. El email del usuario
2. Si quieres habilitar o deshabilitar Super Admin

#### Uso con Parámetros

```bash
# Habilitar Super Admin
npm run set:superadmin -- --email usuario@ejemplo.com --enable true

# Deshabilitar Super Admin
npm run set:superadmin -- --email usuario@ejemplo.com --enable false
```

#### Ejemplo de Salida

```
👑 AmSpec - Set Super Admin

Please enter the following information:

User Email: admin@amspec.com
Enable Super Admin? (yes/no) [yes]: yes

============================================================
🔌 Verifying connection to MongoDB...
✅ MongoDB connection successful

👑 Enabling Super Admin privileges...
📝 Role automatically set to admin

✅ Super Admin status enabled successfully!

📋 User details:
   Email: admin@amspec.com
   Name: Super Admin
   Role: admin
   Super Admin: ✅ YES
   Active: Yes

⚠️  IMPORTANT:
   - This user is now a SUPER ADMIN
   - Super Admins are INVISIBLE to regular admins
   - Only Super Admins can see and modify other Super Admins
   - This user has FULL ACCESS to all system features
   - Keep this information CONFIDENTIAL
```

### 2. Update Password (`updatePassword.js`)

Actualiza la contraseña de un usuario existente.

```bash
npm run update:password -- --email usuario@ejemplo.com --password nuevaContraseña
```

### 3. Create Initial Admin (`createInitialAdmin.js`)

Crea el primer usuario administrador del sistema.

```bash
npm run create:admin
```

### 4. Create User (`createUser.js`)

Crea un nuevo usuario en el sistema.

```bash
npm run create:user
```

### 5. Create Agents (`createAgents.js`)

Crea los agentes iniciales del sistema.

```bash
npm run create:agents
```

### 6. Create Master Data (`createMasterData.js`)

Crea datos maestros del sistema.

```bash
npm run create:master
```

## Seguridad

### Protección de Super Admins

El sistema implementa las siguientes protecciones para Super Admins:

1. **En GET /api/users** (`getAllUsers`)
   - Los admins regulares NO ven a los Super Admins en la lista
   - Solo Super Admins pueden ver otros Super Admins
   - El campo `isSuperAdmin` nunca se expone en las respuestas

2. **En PUT /api/users/:id** (`updateUser`)
   - Los admins regulares NO pueden modificar Super Admins
   - Solo Super Admins pueden modificar otros Super Admins
   - Retorna error 403 si un admin regular intenta modificar un Super Admin

3. **En DELETE /api/users/:id** (`deleteUser`)
   - Los admins regulares NO pueden eliminar Super Admins
   - Solo Super Admins pueden eliminar otros Super Admins
   - Retorna error 403 si un admin regular intenta eliminar un Super Admin

### Modelo de Datos

El campo `isSuperAdmin` en el modelo User:
```javascript
isSuperAdmin: {
  type: Boolean,
  default: false,
  select: false, // No incluir por defecto en queries
}
```

## Notas Importantes

- ⚠️ Los Super Admins deben usarse con precaución
- 🔒 Mantén las credenciales de Super Admin en un lugar seguro
- 📝 Documenta qué usuarios son Super Admins
- 🔐 Solo otorga privilegios de Super Admin a personal de confianza
- 🚫 No compartas el email de Super Admins con usuarios regulares

## Troubleshooting

### Error: "MongoDB connection failed"
- Verifica que MongoDB esté corriendo
- Revisa la variable `MONGODB_URI` en el archivo `.env`

### Error: "User not found"
- Verifica que el email esté escrito correctamente
- Asegúrate de que el usuario exista en la base de datos

### Error: "Cannot modify this user"
- Este error aparece cuando un admin regular intenta modificar un Super Admin
- Solo Super Admins pueden modificar otros Super Admins
