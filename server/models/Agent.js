import mongoose from 'mongoose';

const agentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Agent name is required'],
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

const Agent = mongoose.model('Agent', agentSchema);

export default Agent;
