import mongoose from 'mongoose'

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Client name is required'],
      unique: true,
      trim: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

// Create index for faster queries
clientSchema.index({ name: 1, isActive: 1 })

const Client = mongoose.model('Client', clientSchema)

export default Client

