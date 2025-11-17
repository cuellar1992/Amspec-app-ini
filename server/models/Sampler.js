import mongoose from 'mongoose';

const samplerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Sampler name is required'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
    },
    has24HourRestriction: {
      type: Boolean,
      default: false,
    },
    restrictedDays: {
      type: [Number], // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      default: [],
      validate: {
        validator: function (days) {
          return days.every((day) => day >= 0 && day <= 6);
        },
        message: 'Days must be between 0 (Sunday) and 6 (Saturday)',
      },
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

// Helper method to check if sampler is available on a specific day
samplerSchema.methods.isAvailableOnDay = function (dayOfWeek) {
  return !this.restrictedDays.includes(dayOfWeek);
};

// Helper method to get restricted day names
samplerSchema.methods.getRestrictedDayNames = function () {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return this.restrictedDays.map((day) => dayNames[day]);
};

const Sampler = mongoose.model('Sampler', samplerSchema);

export default Sampler;
