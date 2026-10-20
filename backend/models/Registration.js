
const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    studentEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    eventTitle: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

registrationSchema.index(
  { studentEmail: 1, eventId: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  'Registration',
  registrationSchema
);
    