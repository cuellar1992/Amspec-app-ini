# 🚀 Guía de Despliegue en Digital Ocean App Platform

Esta guía te llevará paso a paso para desplegar AmSpec-App v2 en Digital Ocean App Platform.

---

## 📋 Prerequisitos

Antes de comenzar, asegúrate de tener:

- ✅ Cuenta en Digital Ocean
- ✅ Repositorio en GitHub (`cuellar1992/AmSpec-App`)
- ✅ Cuenta en MongoDB Atlas con base de datos configurada
- ✅ Acceso a la rama `main` del repositorio

---

## 🔧 Paso 1: Preparar MongoDB Atlas

### 1.1 Configurar IP Whitelist

1. Ve a [MongoDB Atlas](https://cloud.mongodb.com/)
2. Selecciona tu cluster
3. Ve a **Network Access** → **IP Access List**
4. Agrega `0.0.0.0/0` (permite acceso desde cualquier IP) **O** agrega las IPs de Digital Ocean cuando las conozcas
5. Guarda los cambios

### 1.2 Obtener Connection String

1. En MongoDB Atlas, ve a **Database** → **Connect**
2. Selecciona **Connect your application**
3. Copia la cadena de conexión:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<database>?retryWrites=true&w=majority
   ```
4. Reemplaza `<username>`, `<password>` y `<database>` con tus valores reales

### 1.3 Crear Usuario de Base de Datos (si no existe)

1. Ve a **Database Access** en MongoDB Atlas
2. Crea un usuario con permisos de lectura/escritura
3. Guarda las credenciales de forma segura

---

## 🔐 Paso 2: Generar Secretos JWT

Antes de desplegar, necesitas generar secretos seguros para JWT:

```bash
# Generar JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generar JWT_REFRESH_SECRET (ejecuta de nuevo para obtener otro)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Guarda estos valores de forma segura**, los necesitarás en el siguiente paso.

---

## 🌐 Paso 3: Crear App en Digital Ocean

### 3.1 Iniciar Creación de App

1. Inicia sesión en [Digital Ocean](https://cloud.digitalocean.com/)
2. Ve a **Apps** en el menú lateral
3. Haz clic en **Create App**
4. Selecciona **GitHub** como fuente
5. Autoriza Digital Ocean a acceder a tu cuenta de GitHub (si es la primera vez)
6. Selecciona el repositorio: `cuellar1992/AmSpec-App`
7. Selecciona la rama: `main`

### 3.2 Configurar App Spec

Digital Ocean detectará automáticamente el archivo `.do/app.yaml`. Verás:

- **Frontend (Static Site)**: `amspec-frontend`
- **Backend (Service)**: `amspec-backend`

**Verifica que la configuración sea correcta:**

- **Frontend:**
  - Source Directory: `/` (raíz)
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Node Version: `18`

- **Backend:**
  - Source Directory: `/server`
  - Run Command: `npm start`
  - Node Version: `18`
  - Instance Size: `basic-xxs` (puedes cambiarlo después si necesitas más recursos)

### 3.3 Configurar Variables de Entorno

En la sección **Environment Variables**, configura las siguientes variables:

#### Para el Backend (`amspec-backend`):

1. **MONGODB_URI**
   - Tipo: `Secret` (recomendado) o `Plain`
   - Valor: Tu cadena de conexión completa de MongoDB Atlas
   - Ejemplo: `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/amspec-db?retryWrites=true&w=majority`

2. **JWT_SECRET**
   - Tipo: `Secret` (OBLIGATORIO)
   - Valor: El secreto que generaste en el Paso 2
   - Ejemplo: `a1b2c3d4e5f6...` (64 caracteres hexadecimales)

3. **JWT_REFRESH_SECRET**
   - Tipo: `Secret` (OBLIGATORIO)
   - Valor: El segundo secreto que generaste en el Paso 2
   - Ejemplo: `f6e5d4c3b2a1...` (64 caracteres hexadecimales)

4. **NODE_ENV**
   - Tipo: `Plain`
   - Valor: `production`
   - (Ya está configurado en app.yaml, pero verifica)

5. **PORT**
   - Tipo: `Plain`
   - Valor: `8080` (Digital Ocean App Platform usa 8080 por defecto)
   - (Ya está configurado en app.yaml, pero verifica)

6. **FRONTEND_URL**
   - Tipo: `Plain`
   - Valor: Se configurará automáticamente como `${amspec-frontend.PUBLIC_URL}`
   - **NO necesitas configurarlo manualmente**, Digital Ocean lo hará automáticamente

#### Para el Frontend (`amspec-frontend`):

1. **VITE_API_URL**
   - Tipo: `Plain`
   - Valor: Se configurará automáticamente como `${amspec-backend.PUBLIC_URL}/api`
   - **NO necesitas configurarlo manualmente**, Digital Ocean lo hará automáticamente

2. **NODE_VERSION**
   - Tipo: `Plain`
   - Valor: `18`
   - (Ya está configurado en app.yaml)

### 3.4 Revisar y Crear

1. Revisa toda la configuración
2. Selecciona el plan de precios (puedes empezar con el plan básico)
3. Haz clic en **Create Resources**

---

## ⏳ Paso 4: Esperar el Despliegue

Digital Ocean comenzará a desplegar tu aplicación. Este proceso puede tomar 5-15 minutos.

### 4.1 Proceso de Despliegue

Verás dos despliegues simultáneos:

1. **Frontend (Static Site)**
   - Instalará dependencias: `npm install`
   - Ejecutará build: `npm run build`
   - Desplegará archivos estáticos

2. **Backend (Service)**
   - Instalará dependencias: `npm install` (en `/server`)
   - Iniciará el servidor: `npm start`
   - Se conectará a MongoDB

### 4.2 Monitorear Logs

Durante el despliegue, puedes ver los logs en tiempo real:

1. Haz clic en el componente (frontend o backend)
2. Ve a la pestaña **Runtime Logs**
3. Verifica que no haya errores

**Logs esperados del Backend:**
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
📊 Database: amspec-db
⏰ Cron job scheduled to run every hour
🚀 Server running on port 5000
```

**Si ves errores:**
- Revisa las variables de entorno
- Verifica la conexión a MongoDB
- Revisa los logs completos para más detalles

---

## ✅ Paso 5: Verificar el Despliegue

### 5.1 Verificar Health Check

Una vez desplegado, verifica que el backend esté funcionando:

```bash
# Reemplaza con tu URL real
curl https://amspec-backend-xxxxx.ondigitalocean.app/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 123.45,
  "environment": "production"
}
```

### 5.2 Verificar Frontend

1. Ve a la URL del frontend (se mostrará en el dashboard)
2. Deberías ver la aplicación cargando
3. Abre la consola del navegador (F12) y verifica que no haya errores

### 5.3 Probar Autenticación

1. Intenta iniciar sesión con un usuario de prueba
2. Verifica que las peticiones al API funcionen
3. Revisa los logs del backend para confirmar que las peticiones lleguen

---

## 🔄 Paso 6: Configurar Deploy Automático (Opcional)

El archivo `.do/app.yaml` ya tiene configurado `deploy_on_push: true`, lo que significa que:

- ✅ Cada push a la rama `main` desplegará automáticamente
- ✅ No necesitas hacer nada adicional

**Para desactivar el deploy automático:**
1. Ve a la configuración de la App
2. Desactiva **Auto Deploy**
3. O modifica `.do/app.yaml` y cambia `deploy_on_push: false`

---

## 🛠️ Paso 7: Configuraciones Adicionales

### 7.1 Dominio Personalizado (Opcional)

1. Ve a **Settings** → **Domains**
2. Agrega tu dominio personalizado
3. Configura los registros DNS según las instrucciones de Digital Ocean

### 7.2 SSL/HTTPS

- ✅ Digital Ocean configura SSL automáticamente
- ✅ No necesitas hacer nada adicional
- ✅ Todas las conexiones serán HTTPS

### 7.3 Monitoreo y Alertas

1. Ve a **Settings** → **Alerts**
2. Configura alertas para:
   - Errores de aplicación
   - Alto uso de recursos
   - Despliegues fallidos

### 7.4 Escalar Recursos

Si necesitas más recursos:

1. Ve a **Settings** → **Components**
2. Selecciona el componente (backend)
3. Cambia el **Instance Size**:
   - `basic-xxs` - $5/mes (actual)
   - `basic-xs` - $12/mes
   - `basic-s` - $24/mes
   - etc.

---

## 🐛 Solución de Problemas

### Problema: Backend no inicia

**Síntomas:**
- El backend muestra errores en los logs
- Health check falla

**Soluciones:**
1. Verifica que todas las variables de entorno estén configuradas
2. Verifica la conexión a MongoDB (IP whitelist)
3. Revisa los logs completos del backend
4. Verifica que `JWT_SECRET` y `JWT_REFRESH_SECRET` estén configurados

### Problema: Frontend no se conecta al Backend

**Síntomas:**
- Frontend carga pero muestra errores de API
- CORS errors en la consola

**Soluciones:**
1. Verifica que `VITE_API_URL` esté configurado correctamente
2. Verifica que `FRONTEND_URL` en el backend sea la URL correcta del frontend
3. Revisa la configuración de CORS en `server/server.js`

### Problema: MongoDB Connection Error

**Síntomas:**
- Error: "MongoServerError: connection timed out"
- Error: "MongoServerError: IP not whitelisted"

**Soluciones:**
1. Verifica que la IP de Digital Ocean esté en el whitelist de MongoDB Atlas
2. Agrega `0.0.0.0/0` temporalmente para probar (luego restringe)
3. Verifica que las credenciales en `MONGODB_URI` sean correctas
4. Verifica que el usuario de MongoDB tenga permisos adecuados

### Problema: Build del Frontend Falla

**Síntomas:**
- Error durante `npm run build`
- Frontend no se despliega

**Soluciones:**
1. Prueba el build localmente: `npm run build`
2. Verifica que no haya errores de TypeScript
3. Revisa los logs completos del build
4. Verifica que todas las dependencias estén en `package.json`

---

## 📊 URLs y Endpoints

Después del despliegue, tendrás:

### Frontend
- URL: `https://amspec-frontend-xxxxx.ondigitalocean.app`
- Tipo: Static Site

### Backend
- URL: `https://amspec-backend-xxxxx.ondigitalocean.app`
- Health Check: `https://amspec-backend-xxxxx.ondigitalocean.app/health`
- API Base: `https://amspec-backend-xxxxx.ondigitalocean.app/api`

### Endpoints Disponibles
- `GET /` - Información de la API
- `GET /health` - Health check
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/ship-nominations` - Ship Nominations (requiere auth)
- ... (ver `server/server.js` para lista completa)

---

## 🔐 Seguridad Post-Despliegue

### Checklist de Seguridad

- [ ] Cambiar contraseñas por defecto de usuarios de prueba
- [ ] Verificar que los secretos JWT sean únicos y seguros
- [ ] Configurar IP whitelist en MongoDB Atlas (restringir a IPs de Digital Ocean)
- [ ] Revisar logs regularmente para detectar actividad sospechosa
- [ ] Configurar alertas de seguridad
- [ ] Hacer backup regular de la base de datos

### Mejores Prácticas

1. **No commitees secretos**: Nunca subas `.env` al repositorio
2. **Usa Secrets en Digital Ocean**: Marca variables sensibles como "Secret"
3. **Rota secretos regularmente**: Cambia JWT secrets periódicamente
4. **Monitorea logs**: Revisa logs regularmente para detectar problemas
5. **Haz backups**: Configura backups automáticos de MongoDB

---

## 📝 Comandos Útiles

### Ver Logs en Tiempo Real

```bash
# Desde Digital Ocean Dashboard
# Ve a Runtime Logs del componente
```

### Reiniciar un Componente

1. Ve a **Components**
2. Selecciona el componente
3. Haz clic en **Restart**

### Ver Variables de Entorno

1. Ve a **Settings** → **App-Level Environment Variables**
2. O ve a cada componente y revisa sus variables

### Rollback a Versión Anterior

1. Ve a **Deployments**
2. Selecciona una versión anterior
3. Haz clic en **Rollback**

---

## 🎉 ¡Listo!

Tu aplicación debería estar desplegada y funcionando en Digital Ocean App Platform.

**Próximos pasos:**
1. Probar todas las funcionalidades
2. Configurar dominio personalizado (si lo deseas)
3. Configurar monitoreo y alertas
4. Hacer backup de la base de datos

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Digital Ocean Dashboard
2. Consulta la [documentación de Digital Ocean](https://docs.digitalocean.com/products/app-platform/)
3. Revisa `PRODUCTION_READINESS_REVIEW.md` para problemas conocidos

