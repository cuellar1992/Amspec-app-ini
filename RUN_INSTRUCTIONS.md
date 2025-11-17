# Cómo Ejecutar el Proyecto AmSpec-App

## Requisitos Previos
- Node.js instalado
- Cuenta en MongoDB Atlas con base de datos configurada

## Pasos para Ejecutar el Proyecto

### 1. Iniciar el Backend
```bash
cd server
npm run dev
```
El backend se iniciará en: http://localhost:5000

### 2. Iniciar el Frontend (en otra terminal)
```bash
npm run dev
```
El frontend se iniciará en: http://localhost:5173

### 3. Acceder a la Aplicación
Abre tu navegador y visita: http://localhost:5173

## Ejecutar Ambos Servidores Simultáneamente
También puedes ejecutar ambos servidores con un solo comando:
```bash
npm run dev:full
```

## Estructura del Proyecto
- **Frontend**: Vue.js 3 con Vite (puerto 5173)
- **Backend**: Node.js con Express (puerto 5000)
- **Base de Datos**: MongoDB Atlas

## Archivos de Configuración
- `.env`: Configuración del frontend (URL del API)
- `server/.env`: Configuración del backend (conexión a MongoDB, puertos, secrets)

## Scripts Disponibles
- `npm run create:admin`: Crear usuario administrador inicial
- `npm run create:user`: Crear nuevos usuarios (admin/user/viewer)
- `npm run create:agents`: Crear agents predefinidos (Wave Shipping, GAC, SGM, Wilhelmsen, ISS)
- `npm run create:master`: Crear todos los datos maestros (berths, chemists, samplers, surveyors, terminals, clients, product types)
- `npm run seed`: Poblar base de datos con datos de prueba
- `npm run seed:users`: Crear usuarios de prueba

### Crear Nuevo Usuario
Para crear un nuevo usuario:
```bash
cd server
npm run create:user
```

O con parámetros:
```bash
npm run create:user -- --email usuario@ejemplo.com --password password123 --name "Nombre Usuario" --role user
```

Roles disponibles:
- `admin`: Acceso administrativo
- `user`: Usuario estándar  
- `viewer`: Solo lectura

## Notas Importantes
- Asegúrate de que ambos servidores estén corriendo para que la aplicación funcione correctamente
- El frontend necesita la conexión al backend para las operaciones CRUD
- La base de datos MongoDB Atlas debe estar accesible desde tu ubicación

## Solución de Problemas
Si el backend no se conecta a MongoDB:
1. Verifica la URL en `server/.env`
2. Asegúrate que tu IP esté whitelist en MongoDB Atlas
3. Verifica las credenciales de usuario y contraseña