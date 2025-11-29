import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // No incluir password por defecto en queries
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String, // Base64 string o URL
      default: null,
    },
    address: {
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
      },
      postalCode: {
        type: String,
        trim: true,
      },
    },
    role: {
      type: String,
      enum: ['admin', 'user', 'viewer'],
      default: 'user',
    },
    // Super Admin - Usuario oculto con permisos totales
    isSuperAdmin: {
      type: Boolean,
      default: false,
      select: false, // No incluir por defecto en queries
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // 2FA fields
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },
    // Refresh tokens (para revocación)
    refreshTokens: [
      {
        token: String,
        createdAt: {
          type: Date,
          default: Date.now,
          expires: 7 * 24 * 60 * 60, // 7 días
        },
      },
    ],
    // Password reset
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpiry: {
      type: Date,
      select: false,
    },
    // Último login
    lastLogin: {
      type: Date,
    },
    // Require password change on first login
    requirePasswordChange: {
      type: Boolean,
      default: false,
    },
    // Intentos de login fallidos
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    // Passkey/WebAuthn challenge (temporary storage)
    currentChallenge: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Método para verificar si la cuenta está bloqueada
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password antes de guardar
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    throw new Error('Password no disponible');
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para incrementar intentos fallidos
userSchema.methods.incLoginAttempts = async function () {
  // Si ya pasó el tiempo de bloqueo y hay intentos previos, resetear
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $set: { failedLoginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { failedLoginAttempts: 1 } };

  // Bloquear cuenta después de 5 intentos fallidos por 2 horas
  if (this.failedLoginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 horas
  }

  return await this.updateOne(updates);
};

// Método para resetear intentos fallidos
userSchema.methods.resetLoginAttempts = async function () {
  return await this.updateOne({
    $set: { failedLoginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

// Método para limpiar refresh tokens antiguos
userSchema.methods.addRefreshToken = async function (token) {
  // Mantener solo los últimos 5 tokens
  if (this.refreshTokens.length >= 5) {
    this.refreshTokens.shift();
  }
  this.refreshTokens.push({ token });
  return await this.save();
};

// Método para revocar refresh token
userSchema.methods.revokeRefreshToken = async function (token) {
  return await this.updateOne({
    $pull: { refreshTokens: { token } },
  });
};

// Método para revocar todos los refresh tokens
userSchema.methods.revokeAllRefreshTokens = async function () {
  return await this.updateOne({
    $set: { refreshTokens: [] },
  });
};

// Middleware para prevenir eliminación accidental de Super Admins
userSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  // Verificar si este usuario es un Super Admin
  const isSuperAdmin = this.isSuperAdmin;

  // Log de auditoría
  console.log(`[AUDIT] Attempting to delete user: ${this.email} (isSuperAdmin: ${isSuperAdmin})`);

  if (isSuperAdmin) {
    console.log(`[AUDIT] BLOCKED: Cannot delete Super Admin user: ${this.email}`);
    const error = new Error('Cannot delete Super Admin user. Super Admins are protected from deletion.');
    error.name = 'ProtectedUserError';
    return next(error);
  }

  console.log(`[AUDIT] User deleted: ${this.email}`);
  next();
});

// Middleware para prevenir eliminación de Super Admins en queries
userSchema.pre('deleteOne', { document: false, query: true }, async function (next) {
  try {
    const query = this.getQuery();
    const user = await this.model.findOne(query).select('+isSuperAdmin');

    if (user) {
      console.log(`[AUDIT] Attempting to delete user (query): ${user.email} (isSuperAdmin: ${user.isSuperAdmin})`);

      if (user.isSuperAdmin) {
        console.log(`[AUDIT] BLOCKED: Cannot delete Super Admin user: ${user.email}`);
        const error = new Error('Cannot delete Super Admin user. Super Admins are protected from deletion.');
        error.name = 'ProtectedUserError';
        return next(error);
      }

      console.log(`[AUDIT] User deleted (query): ${user.email}`);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Middleware para prevenir eliminación múltiple que incluya Super Admins
userSchema.pre('deleteMany', async function (next) {
  try {
    const query = this.getQuery();
    const superAdmins = await this.model.find(query).select('+isSuperAdmin');

    const hasSuperAdmin = superAdmins.some(user => user.isSuperAdmin);

    if (hasSuperAdmin) {
      const error = new Error('Cannot delete Super Admin users. Super Admins are protected from deletion.');
      error.name = 'ProtectedUserError';
      return next(error);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Middleware para prevenir findByIdAndDelete de Super Admins
userSchema.pre('findOneAndDelete', async function (next) {
  try {
    const query = this.getQuery();
    const user = await this.model.findOne(query).select('+isSuperAdmin');

    if (user) {
      console.log(`[AUDIT] Attempting to delete user (findOneAndDelete): ${user.email} (isSuperAdmin: ${user.isSuperAdmin})`);

      if (user.isSuperAdmin) {
        console.log(`[AUDIT] BLOCKED: Cannot delete Super Admin user: ${user.email}`);
        const error = new Error('Cannot delete Super Admin user. Super Admins are protected from deletion.');
        error.name = 'ProtectedUserError';
        return next(error);
      }

      console.log(`[AUDIT] User deleted (findOneAndDelete): ${user.email}`);
    }

    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

export default User;
