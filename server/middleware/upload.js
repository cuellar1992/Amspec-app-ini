import multer from 'multer';

// Configuración de Multer para manejar uploads en memoria
const storage = multer.memoryStorage();

// Filtro para validar tipo de archivo
const fileFilter = (req, file, cb) => {
  // Tipos de imagen permitidos
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'), false);
  }
};

// Configuración de Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Límite de 5MB
  },
});

export default upload;
