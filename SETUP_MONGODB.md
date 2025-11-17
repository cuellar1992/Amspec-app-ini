# Configuración de MongoDB Atlas

## Pasos para obtener tu URL de conexión:

1. Inicia sesión en [MongoDB Atlas](https://cloud.mongodb.com/)
2. Selecciona tu cluster
3. Haz clic en "Connect" 
4. Selecciona "Connect your application"
5. Copia la cadena de conexión (connection string)

## Formato de la URL:
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

## Configurar en el proyecto:
1. Abre el archivo `server/.env`
2. Reemplaza la línea `MONGODB_URI=...` con tu URL de conexión real
3. Asegúrate de reemplazar:
   - `<username>` con tu nombre de usuario de MongoDB
   - `<password>` con tu contraseña de MongoDB
   - `<cluster>` con el nombre de tu cluster
   - `<database>` con el nombre de tu base de datos (ej: amspec-db)

## Ejemplo:
```
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.abcde.mongodb.net/amspec-db?retryWrites=true&w=majority
```

Una vez configurado, el servidor debería conectarse correctamente a tu base de datos.