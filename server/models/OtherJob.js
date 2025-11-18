import mongoose from 'mongoose';

const otherJobSchema = new mongoose.Schema(
  {
    when: { type: Date, required: true },
    description: { type: String, required: true, trim: true },
    who: { type: String, required: true, trim: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    hours: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
    },
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

// Middleware to auto-calculate hours and status before saving
otherJobSchema.pre('save', function(next) {
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
otherJobSchema.methods.updateStatus = function() {
  this.status = calculateStatus(this.startAt, this.endAt);
  return this.save();
};

// Static method to update all other job statuses
otherJobSchema.statics.updateAllStatuses = async function() {
  const jobs = await this.find({});
  const updates = jobs.map(async (job) => {
    const newStatus = calculateStatus(job.startAt, job.endAt);
    if (job.status !== newStatus) {
      job.status = newStatus;
      return job.save();
    }
    return job;
  });

  await Promise.all(updates);
  return jobs;
};

// Indexes for faster queries
otherJobSchema.index({ createdAt: -1 });
otherJobSchema.index({ when: -1 });
otherJobSchema.index({ status: 1 });
otherJobSchema.index({ startAt: 1 }); // For conflict checking and sorting
otherJobSchema.index({ status: 1, when: -1 }); // Filter by status and sort by when

const OtherJob = mongoose.model('OtherJob', otherJobSchema);

export default OtherJob;


