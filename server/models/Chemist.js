import mongoose from 'mongoose';

const chemistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Chemist name is required'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Chemist = mongoose.model('Chemist', chemistSchema);

export default Chemist;
