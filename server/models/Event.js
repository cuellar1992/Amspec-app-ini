import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    start: { type: Date, required: true },
    end: { type: Date },
    allDay: { type: Boolean, default: false },
    calendar: {
      type: String,
      enum: ['Danger', 'Success', 'Primary', 'Warning'],
      required: true
    },
  },
  { timestamps: true }
);

eventSchema.index({ createdAt: -1 });
eventSchema.index({ start: -1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;
