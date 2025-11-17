import User from '../models/User.js';
import sharp from 'sharp';

// @desc    Obtener perfil del usuario actual
// @route   GET /api/users/me
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -twoFactorSecret -refreshTokens');

    res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Actualizar perfil del usuario
// @route   PUT /api/users/me
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, bio, address } = req.body;
    const userId = req.user._id;

    // Verificar si el email ya está en uso por otro usuario
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está en uso por otro usuario',
        });
      }
    }

    // Preparar campos a actualizar
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (email !== undefined) updateFields.email = email;
    if (phone !== undefined) updateFields.phone = phone;
    if (bio !== undefined) updateFields.bio = bio;
    if (address !== undefined) updateFields.address = address;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password -twoFactorSecret -refreshTokens');

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Cambiar contraseña
// @route   PUT /api/users/me/password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual y nueva contraseña son requeridas',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 8 caracteres',
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    // Verificar contraseña actual
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta',
      });
    }

    // Actualizar contraseña
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Obtener todos los usuarios
// @route   GET /api/users
// @access  Private (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    // Verificar si el usuario actual es Super Admin
    const currentUser = await User.findById(req.user._id).select('+isSuperAdmin');
    const isSuperAdmin = currentUser?.isSuperAdmin || false;

    // Si es Super Admin, puede ver todos los usuarios (incluyéndose a sí mismo)
    // Si no es Super Admin, filtrar los Super Admins (están ocultos)
    const query = isSuperAdmin ? {} : { isSuperAdmin: { $ne: true } };

    const users = await User.find(query)
      .select('-password -twoFactorSecret -refreshTokens -resetPasswordToken -resetPasswordExpiry -currentChallenge -isSuperAdmin')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        users,
      },
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Crear nuevo usuario
// @route   POST /api/users
// @access  Private (Admin only)
export const createUser = async (req, res) => {
  try {
    const { username, password, name, role, requirePasswordChange } = req.body;

    // Validaciones
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    // Verificar si el username ya existe (usando email como username)
    const existingUser = await User.findOne({ email: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists',
      });
    }

    // Crear nuevo usuario
    // Si no se proporciona rol o está vacío, asignar 'admin' por defecto
    const userRole = role && role.trim() !== '' ? role : 'admin';

    const newUser = new User({
      email: username.toLowerCase(),
      password,
      name: name || username,
      role: userRole,
      isActive: true,
      // Si no se especifica requirePasswordChange, por defecto es true
      requirePasswordChange: requirePasswordChange !== undefined ? requirePasswordChange : true,
    });

    await newUser.save();

    // Retornar usuario sin datos sensibles
    const userResponse = await User.findById(newUser._id)
      .select('-password -twoFactorSecret -refreshTokens -resetPasswordToken -resetPasswordExpiry -currentChallenge');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    
    // Manejar errores de validación de mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    // Manejar errores de duplicado
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
export const updateUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const userId = req.params.id;

    // Check if user exists
    const user = await User.findById(userId).select('+isSuperAdmin');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verificar si el usuario actual es Super Admin
    const currentUser = await User.findById(req.user._id).select('+isSuperAdmin');
    const isCurrentUserSuperAdmin = currentUser?.isSuperAdmin || false;

    // Proteger Super Admins - solo pueden ser modificados por ellos mismos
    if (user.isSuperAdmin && !isCurrentUserSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify this user',
      });
    }

    // Verify if email is being changed and if it's already in use
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another user',
        });
      }
    }

    // Update fields
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email.toLowerCase();
    if (role !== undefined) user.role = role;
    if (password !== undefined && password.trim() !== '') {
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters',
        });
      }
      user.password = password; // Will be hashed by pre-save hook
    }

    await user.save();

    // Return updated user without sensitive data
    const userResponse = await User.findById(user._id)
      .select('-password -twoFactorSecret -refreshTokens -resetPasswordToken -resetPasswordExpiry -currentChallenge');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Toggle user status (activate/deactivate)
// @route   PUT /api/users/:id/status
// @access  Private (Admin only)
export const toggleUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value',
      });
    }

    // Verificar si es Super Admin antes de modificar
    const userCheck = await User.findById(userId).select('+isSuperAdmin');
    if (!userCheck) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verificar si el usuario actual es Super Admin
    const currentUser = await User.findById(req.user._id).select('+isSuperAdmin');
    const isCurrentUserSuperAdmin = currentUser?.isSuperAdmin || false;

    // Proteger Super Admins - solo pueden ser desactivados por ellos mismos
    if (userCheck.isSuperAdmin && !isCurrentUserSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify this user',
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password -twoFactorSecret -refreshTokens -resetPasswordToken -resetPasswordExpiry -currentChallenge');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).select('+isSuperAdmin');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verificar si el usuario actual es Super Admin
    const currentUser = await User.findById(req.user._id).select('+isSuperAdmin');
    const isCurrentUserSuperAdmin = currentUser?.isSuperAdmin || false;

    // Proteger Super Admins - no pueden ser eliminados por otros usuarios
    if (user.isSuperAdmin && !isCurrentUserSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete this user',
      });
    }

    // Prevent deletion of the user's own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Upload or update avatar
// @route   PUT /api/users/me/avatar
// @access  Private
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
      });
    }

    // Procesar imagen con Sharp: redimensionar, optimizar y convertir a WebP
    const processedImage = await sharp(req.file.buffer)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 85 })
      .toBuffer();

    // Convertir a base64 para almacenar en MongoDB
    const base64Image = `data:image/webp;base64,${processedImage.toString('base64')}`;

    // Actualizar usuario con el nuevo avatar
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { avatar: base64Image } },
      { new: true, runValidators: true }
    ).select('-password -twoFactorSecret -refreshTokens');

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading avatar',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Delete avatar
// @route   DELETE /api/users/me/avatar
// @access  Private
export const deleteAvatar = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { avatar: null } },
      { new: true, runValidators: true }
    ).select('-password -twoFactorSecret -refreshTokens');

    res.json({
      success: true,
      message: 'Avatar deleted successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting avatar',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
