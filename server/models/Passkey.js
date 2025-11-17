import mongoose from 'mongoose';

const passkeySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // WebAuthn credential ID (unique identifier)
    credentialID: {
      type: Buffer,
      required: true,
      unique: true,
    },
    // Public key for verification
    credentialPublicKey: {
      type: Buffer,
      required: true,
    },
    // Counter for replay attack prevention
    counter: {
      type: Number,
      required: true,
      default: 0,
    },
    // Transports supported (usb, nfc, ble, internal)
    transports: {
      type: [String],
      default: [],
    },
    // Friendly name for the passkey (e.g., "iPhone 14 Pro", "YubiKey")
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Device type
    deviceType: {
      type: String,
      enum: ['platform', 'cross-platform', 'multiDevice', 'singleDevice', 'unknown'],
      default: 'unknown',
    },
    // Last used timestamp
    lastUsed: {
      type: Date,
      default: null,
    },
    // AAGUID (Authenticator Attestation GUID)
    aaguid: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index para búsquedas rápidas por usuario
passkeySchema.index({ user: 1, createdAt: -1 });

// Método para actualizar el último uso
passkeySchema.methods.updateLastUsed = async function () {
  this.lastUsed = new Date();
  return await this.save();
};

const Passkey = mongoose.model('Passkey', passkeySchema);

export default Passkey;
