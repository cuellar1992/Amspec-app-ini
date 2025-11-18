import mongoose from 'mongoose';

const molekulisLoadingSchema = new mongoose.Schema(
  {
    when: { type: Date, required: true }, // date-only context for the day
    who: { type: String, required: true, trim: true }, // sampler selected
    startAt: { type: Date, required: true }, // window start (same day)
    endAt: { type: Date, required: true }, // window end (same day)
    hours: { type: Number, default: 0 }, // computed (end-start) in hours
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
    },
    loads: [
      {
        time: { type: String, required: true }, // 'HH:mm'
        product: { type: String, required: true, enum: ['Hyvolt I', 'Hyvol III'] },
      },
    ],
  },
  { timestamps: true }
);

// Function to calculate status based on startAt and endAt dates
const calculateStatus = (startAt, endAt) => {
  const now = new Date();

  // If endAt has passed, mark as completed
  if (endAt && new Date(endAt) < now) {
    return 'completed';
  }

  // If startAt has passed but endAt hasn't, mark as in-progress
  if (startAt && new Date(startAt) <= now) {
    return 'in-progress';
  }

  // Default to pending
  return 'pending';
};

// Pre-save to compute hours and status
molekulisLoadingSchema.pre('save', function(next) {
  // Calculate hours
  if (this.startAt && this.endAt) {
    const ms = new Date(this.endAt).getTime() - new Date(this.startAt).getTime();
    this.hours = ms > 0 ? +(ms / 36e5).toFixed(2) : 0;
  }

  // Calculate status if startAt or endAt has changed
  if (this.isModified('startAt') || this.isModified('endAt') || this.isNew) {
    this.status = calculateStatus(this.startAt, this.endAt);
  }

  next();
});

// Method to update status for existing records
molekulisLoadingSchema.methods.updateStatus = function() {
  this.status = calculateStatus(this.startAt, this.endAt);
  return this.save();
};

// Static method to update all molekulis loading statuses
molekulisLoadingSchema.statics.updateAllStatuses = async function() {
  const loadings = await this.find({});
  const updates = loadings.map(async (loading) => {
    const newStatus = calculateStatus(loading.startAt, loading.endAt);
    if (loading.status !== newStatus) {
      loading.status = newStatus;
      return loading.save();
    }
    return loading;
  });

  await Promise.all(updates);
  return loadings;
};

// Indexes for faster queries
molekulisLoadingSchema.index({ createdAt: -1 });
molekulisLoadingSchema.index({ when: -1 });
molekulisLoadingSchema.index({ status: 1 });
molekulisLoadingSchema.index({ startAt: 1 }); // For conflict checking and sorting
molekulisLoadingSchema.index({ status: 1, when: -1 }); // Filter by status and sort by when

const MolekulisLoading = mongoose.model('MolekulisLoading', molekulisLoadingSchema);

export default MolekulisLoading;


