import mongoose from 'mongoose';

const surveyorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Surveyor name is required'],
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

const Surveyor = mongoose.model('Surveyor', surveyorSchema);

export default Surveyor;
