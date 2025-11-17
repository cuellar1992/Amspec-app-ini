# Variables de Entorno Requeridas

## Backend (server/.env)

Crea un archivo `.env` en el directorio `server/` con las siguientes variables:

```env
# Base de Datos
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/amspec-db?retryWrites=true&w=majority

# Autenticación JWT (OBLIGATORIO)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-this-in-production

# Servidor
# Nota: Digital Ocean App Platform usa PORT=8080 por defecto
# En desarrollo local puedes usar PORT=5000
PORT=8080
NODE_ENV=production

# Frontend URL (OBLIGATORIO en producción)
FRONTEND_URL=https://tu-dominio.com
```

### Generar Secretos JWT Seguros

Para generar secretos seguros, ejecuta:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Frontend (.env)

Crea un archivo `.env` en la raíz del proyecto con:

```env
# API Backend
VITE_API_URL=https://tu-backend.ondigitalocean.app/api
```

## Configuración en Digital Ocean

En Digital Ocean App Platform, configura estas variables en la sección de Environment Variables:

### Para el Backend (amspec-backend):
- `MONGODB_URI` - Tu cadena de conexión de MongoDB Atlas
- `JWT_SECRET` - Secreto para tokens JWT (genera uno seguro)
- `JWT_REFRESH_SECRET` - Secreto para refresh tokens (genera uno seguro)
- `FRONTEND_URL` - URL de tu frontend (se configurará automáticamente como `${amspec-frontend.PUBLIC_URL}`)
- `NODE_ENV` - `production`
- `PORT` - `5000`

### Para el Frontend (amspec-frontend):
- `VITE_API_URL` - Se configurará automáticamente como `${amspec-backend.PUBLIC_URL}/api`

## Variables Críticas

Las siguientes variables son **OBLIGATORIAS** y el servidor no iniciará sin ellas:
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

En producción, también se recomienda configurar:
- `FRONTEND_URL` (para CORS y enlaces de recuperación de contraseña)

