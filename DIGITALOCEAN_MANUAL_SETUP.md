# 🔧 Configuración Manual en Digital Ocean App Platform

Si Digital Ocean solo detecta un servicio, necesitas configurar manualmente ambos componentes (Frontend y Backend).

---

## 📋 Situación Actual

Digital Ocean detectó: **"Node.js build detected"** - Solo un servicio

**Necesitas:** 2 componentes
- ✅ Frontend (Static Site)
- ✅ Backend (Service)

---

## 🚀 Solución: Configurar Manualmente

### Paso 1: Configurar el Backend (Service)

1. En la pantalla de configuración de Digital Ocean, verás el componente detectado
2. **Edita este componente** o **agrega un nuevo componente**:
   - **Tipo**: Selecciona **"Service"** (no Static Site)
   - **Nombre**: `amspec-backend`
   - **Source Directory**: `/server` (importante: debe ser `/server`)
   - **Build Command**: Deja vacío (no necesita build)
   - **Run Command**: `npm start`
   - **Environment**: `Node.js`
   - **Node Version**: `18`
   - **Instance Size**: `Basic ($5/mes)` o el que prefieras

### Paso 2: Agregar el Frontend (Static Site)

1. Haz clic en **"Add Component"** o **"Add Resource"**
2. Selecciona **"Static Site"**
3. Configura:
   - **Nombre**: `amspec-frontend`
   - **Source Directory**: `/` (raíz del proyecto)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Index Document**: `index.html`
   - **Error Document**: `index.html`
   - **Node Version**: `18`

### Paso 3: Configurar Variables de Entorno

#### Variables para el Backend (`amspec-backend`):

Ve a **Environment Variables** del componente backend y agrega:

1. **MONGODB_URI**
   - Tipo: `Secret` (recomendado)
   - Valor: Tu cadena de conexión de MongoDB Atlas
   - Ejemplo: `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/amspec-db?retryWrites=true&w=majority`

2. **JWT_SECRET**
   - Tipo: `Secret` (OBLIGATORIO)
   - Valor: Genera uno con: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

3. **JWT_REFRESH_SECRET**
   - Tipo: `Secret` (OBLIGATORIO)
   - Valor: Genera otro secreto diferente

4. **NODE_ENV**
   - Tipo: `Plain`
   - Valor: `production`

5. **PORT**
   - Tipo: `Plain`
   - Valor: `8080` (Digital Ocean App Platform usa 8080 por defecto)

6. **FRONTEND_URL**
   - Tipo: `Plain`
   - Valor: **NO lo configures todavía** - Se configurará después del primer despliegue
   - O usa: `${amspec-frontend.PUBLIC_URL}` (si Digital Ocean lo permite)

#### Variables para el Frontend (`amspec-frontend`):

1. **VITE_API_URL**
   - Tipo: `Plain`
   - Valor: **NO lo configures todavía** - Se configurará después del primer despliegue
   - O usa: `${amspec-backend.PUBLIC_URL}/api` (si Digital Ocean lo permite)

2. **NODE_VERSION**
   - Tipo: `Plain`
   - Valor: `18`

### Paso 4: Configurar Referencias entre Componentes

Después del primer despliegue, necesitarás actualizar las variables que referencian otros componentes:

1. **FRONTEND_URL** (en backend):
   - Ve a la configuración del backend
   - Actualiza `FRONTEND_URL` con la URL del frontend
   - Ejemplo: `https://amspec-frontend-xxxxx.ondigitalocean.app`

2. **VITE_API_URL** (en frontend):
   - Ve a la configuración del frontend
   - Actualiza `VITE_API_URL` con la URL del backend + `/api`
   - Ejemplo: `https://amspec-backend-xxxxx.ondigitalocean.app/api`

---

## 🔄 Alternativa: Usar App Spec (app.yaml)

Si prefieres usar el archivo `.do/app.yaml`:

1. **Asegúrate de que el archivo esté en la raíz del repositorio**
2. En Digital Ocean, cuando estés en la pantalla de configuración:
   - Busca la opción **"Edit App Spec"** o **"Import from App Spec"**
   - O haz clic en **"Edit"** y luego **"Edit App Spec"**
   - Pega el contenido de tu `.do/app.yaml`
   - Guarda los cambios

### Contenido del App Spec:

```yaml
name: amspec-app-v2

static_sites:
  - name: amspec-frontend
    source_dir: /
    github:
      repo: cuellar1992/AmSpec-App
      branch: main
      deploy_on_push: true
    build_command: npm run build
    output_dir: dist
    index_document: index.html
    error_document: index.html
    envs:
      - key: NODE_VERSION
        value: "18"
      - key: VITE_API_URL
        value: ${amspec-backend.PUBLIC_URL}/api

services:
  - name: amspec-backend
    source_dir: /server
    github:
      repo: cuellar1992/AmSpec-App
      branch: main
      deploy_on_push: true
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: NODE_VERSION
        value: "18"
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "5000"
      - key: MONGODB_URI
        value: ${MONGODB_URI}
      - key: JWT_SECRET
        value: ${JWT_SECRET}
      - key: JWT_REFRESH_SECRET
        value: ${JWT_REFRESH_SECRET}
      - key: FRONTEND_URL
        value: ${amspec-frontend.PUBLIC_URL}
```

**Nota**: Las variables `${MONGODB_URI}`, `${JWT_SECRET}`, `${JWT_REFRESH_SECRET}` deben estar configuradas como **App-Level Variables** (no component-level).

---

## ✅ Verificación Post-Configuración

Después de configurar ambos componentes:

1. **Revisa la configuración:**
   - Deberías ver 2 componentes en la lista
   - Frontend: Static Site
   - Backend: Service

2. **Configura las variables de entorno:**
   - Backend: MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET
   - Frontend: VITE_API_URL (después del primer despliegue)

3. **Haz clic en "Create Resources" o "Save"**

4. **Espera el despliegue:**
   - El backend se desplegará primero
   - El frontend se construirá y desplegará después

---

## 🐛 Si Solo Ves un Componente

Si después de seguir estos pasos solo ves un componente:

1. **Cancela el despliegue actual** (si ya comenzó)
2. **Elimina el componente** que se creó automáticamente
3. **Crea ambos componentes manualmente** desde cero
4. O **usa el App Spec** (método recomendado)

---

## 📝 Checklist Rápido

- [ ] Backend configurado como "Service"
- [ ] Source Directory del backend: `/server`
- [ ] Run Command del backend: `npm start`
- [ ] Frontend configurado como "Static Site"
- [ ] Source Directory del frontend: `/`
- [ ] Build Command del frontend: `npm run build`
- [ ] Output Directory del frontend: `dist`
- [ ] Variables de entorno del backend configuradas
- [ ] Variables de entorno del frontend configuradas (después del primer despliegue)

---

## 💡 Consejo

**Recomendación**: Usa el método del **App Spec** (`.do/app.yaml`) porque:
- ✅ Es más fácil de mantener
- ✅ Las referencias entre componentes se resuelven automáticamente
- ✅ Es más fácil de versionar y compartir

Si Digital Ocean no detecta automáticamente el archivo, puedes:
1. Copiar el contenido del App Spec manualmente
2. O asegurarte de que el archivo esté en la rama `main` y hacer un nuevo push

