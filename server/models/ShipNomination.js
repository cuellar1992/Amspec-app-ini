import mongoose from 'mongoose';

const shipNominationSchema = new mongoose.Schema(
  {
    vesselName: {
      type: String,
      required: [true, 'Vessel name is required'],
      trim: true,
    },
    amspecReference: {
      type: String,
      required: [true, 'AmSpec reference is required'],
      unique: true,
      trim: true,
    },
    clientReference: {
      type: String,
      trim: true,
    },
    clients: [{
      type: String,
      trim: true,
    }],
    productTypes: [{
      type: String,
      required: [true, 'At least one product type is required'],
      trim: true,
    }],
    agent: {
      type: String,
      trim: true,
    },
    pilotOnBoard: {
      type: Date,
    },
    etb: {
      type: Date,
    },
    etc: {
      type: Date,
    },
    terminal: {
      type: String,
      trim: true,
    },
    berth: {
      type: String,
      trim: true,
    },
    surveyor: {
      type: String,
      trim: true,
    },
    sampler: {
      type: String,
      trim: true,
    },
    chemist: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'in-progress', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Function to calculate status based on ETB and ETC dates
const calculateStatus = (etb, etc) => {
  const now = new Date();
  
  // If ETC is provided and has passed, mark as completed
  if (etc && new Date(etc) < now) {
    return 'completed';
  }
  
  // If ETB is provided and has passed, mark as in-progress
  if (etb && new Date(etb) <= now) {
    return 'in-progress';
  }
  
  // Default to pending
  return 'pending';
};

// Middleware to auto-calculate status before saving
shipNominationSchema.pre('save', function(next) {
  // Only calculate status if ETB or ETC has changed
  if (this.isModified('etb') || this.isModified('etc') || this.isNew) {
    this.status = calculateStatus(this.etb, this.etc);
  }
  next();
});

// Method to update status for existing records (for bulk updates)
shipNominationSchema.methods.updateStatus = function() {
  this.status = calculateStatus(this.etb, this.etc);
  return this.save();
};

// Static method to update all nomination statuses
shipNominationSchema.statics.updateAllStatuses = async function() {
  const nominations = await this.find({});
  const updates = nominations.map(async (nomination) => {
    const newStatus = calculateStatus(nomination.etb, nomination.etc);
    if (nomination.status !== newStatus) {
      nomination.status = newStatus;
      return nomination.save();
    }
    return nomination;
  });
  
  await Promise.all(updates);
  return nominations;
};

// Index for faster queries
// Note: amspecReference already has a unique index from the schema definition
shipNominationSchema.index({ vesselName: 1 });
shipNominationSchema.index({ status: 1 });
shipNominationSchema.index({ createdAt: -1 });

const ShipNomination = mongoose.model('ShipNomination', shipNominationSchema);

export default ShipNomination;
