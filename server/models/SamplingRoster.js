import mongoose from 'mongoose';

const samplingRosterSchema = new mongoose.Schema(
  {
    // Ship Nomination reference
    amspecRef: {
      type: String,
      required: [true, 'AmSpec reference is required'],
      trim: true,
    },
    // Form fields
    vessel: {
      type: String,
      required: [true, 'Vessel name is required'],
      trim: true,
    },
    berth: {
      type: String,
      required: [true, 'Berth is required'],
      trim: true,
    },
    pob: {
      type: Date,
      required: [true, 'POB is required'],
    },
    etb: {
      type: Date,
      required: [true, 'ETB is required'],
    },
    startDischarge: {
      type: Date,
      required: [true, 'Start Discharge is required'],
    },
    dischargeTimeHours: {
      type: Number,
      required: [true, 'Discharge Time Hours is required'],
      min: [0, 'Discharge Time Hours must be positive'],
    },
    cargo: {
      type: String,
      required: [true, 'Cargo is required'],
      trim: true,
    },
    surveyor: {
      type: String,
      required: [true, 'Surveyor is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
    },
    preDischargeTest: {
      type: String,
      trim: true,
    },
    postDischargeTest: {
      type: String,
      trim: true,
    },
    // Office Sampling data
    officeSampling: [
      {
        who: { type: String, trim: true },
        startOffice: { type: Date, required: true },
        finishSampling: { type: Date, required: true },
        hours: { type: Number, default: 0 }, // Calculated hours
      },
    ],
    // Line Sampling data
    lineSampling: [
      {
        who: { type: String, trim: true },
        startLineSampling: { type: Date, required: true },
        finishLineSampling: { type: Date, required: true },
        hours: { type: Number, default: 0 }, // Calculated hours
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Function to calculate status based on startDischarge and ETC (startDischarge + dischargeTimeHours)
const calculateStatus = (startDischarge, dischargeTimeHours) => {
  const now = new Date();

  if (!startDischarge || !dischargeTimeHours) {
    return 'pending';
  }

  const start = new Date(startDischarge);
  // Calculate ETC by adding dischargeTimeHours to startDischarge
  const etc = new Date(start.getTime() + dischargeTimeHours * 60 * 60 * 1000);

  // If ETC has passed, mark as completed
  if (etc < now) {
    return 'completed';
  }

  // If startDischarge has passed but ETC hasn't, mark as in-progress
  if (start <= now) {
    return 'in-progress';
  }

  // Default to pending
  return 'pending';
};

// Indexes for faster lookups
samplingRosterSchema.index({ amspecRef: 1 }); // Primary lookup field
samplingRosterSchema.index({ createdAt: -1 });
samplingRosterSchema.index({ status: 1 });
samplingRosterSchema.index({ etb: -1 }); // For sorting by ETB
samplingRosterSchema.index({ status: 1, etb: -1 }); // Filter by status and sort by ETB

// Pre-save hook to calculate hours and status
samplingRosterSchema.pre('save', function(next) {
  // Calculate hours for office sampling records
  if (this.officeSampling && Array.isArray(this.officeSampling)) {
    this.officeSampling.forEach((record) => {
      if (record.startOffice && record.finishSampling) {
        const ms = new Date(record.finishSampling).getTime() - new Date(record.startOffice).getTime();
        record.hours = ms > 0 ? +(ms / 36e5).toFixed(2) : 0;
      }
    });
  }

  // Calculate hours for line sampling records
  if (this.lineSampling && Array.isArray(this.lineSampling)) {
    this.lineSampling.forEach((record) => {
      if (record.startLineSampling && record.finishLineSampling) {
        const ms = new Date(record.finishLineSampling).getTime() - new Date(record.startLineSampling).getTime();
        record.hours = ms > 0 ? +(ms / 36e5).toFixed(2) : 0;
      }
    });
  }

  // Calculate status if startDischarge or dischargeTimeHours has changed
  if (this.isModified('startDischarge') || this.isModified('dischargeTimeHours') || this.isNew) {
    this.status = calculateStatus(this.startDischarge, this.dischargeTimeHours);
  }

  next();
});

// Method to update status for existing records
samplingRosterSchema.methods.updateStatus = function() {
  this.status = calculateStatus(this.startDischarge, this.dischargeTimeHours);
  return this.save();
};

// Static method to update all sampling roster statuses
samplingRosterSchema.statics.updateAllStatuses = async function() {
  const rosters = await this.find({});
  const updates = rosters.map(async (roster) => {
    const newStatus = calculateStatus(roster.startDischarge, roster.dischargeTimeHours);
    if (roster.status !== newStatus) {
      roster.status = newStatus;
      return roster.save();
    }
    return roster;
  });

  await Promise.all(updates);
  return rosters;
};

const SamplingRoster = mongoose.model('SamplingRoster', samplingRosterSchema);

export default SamplingRoster;

