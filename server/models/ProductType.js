import mongoose from 'mongoose'

const productTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product type name is required'],
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
productTypeSchema.index({ name: 1, isActive: 1 })

const ProductType = mongoose.model('ProductType', productTypeSchema)

export default ProductType

