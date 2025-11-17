import mongoose from 'mongoose';

const berthSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Berth name is required'],
      unique: true,
      trim: true,
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

const Berth = mongoose.model('Berth', berthSchema);

export default Berth;
