const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
      required: true,
  },
  leaveType: {
    type: String,
      enum: ['Annual', 'Sick', 'Personal', 'Maternity', 'Paternity', 'Unpaid'],
      required: true,
  },
  startDate: {
    type: Date,
      required: true,
  },
  endDate: {
    type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
  },
  reason: {
    type: String,
      required: true,
  },
  status: {
    type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
  },
    actionBy: {
    type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    actionAt: {
      type: Date,
  },
  attachments: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
  },
  {
    timestamps: true,
  }
);

// Virtual for calculating number of days
leaveSchema.virtual('numberOfDays').get(function() {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((this.endDate - this.startDate) / oneDay)) + 1;
});

const Leave = mongoose.model('Leave', leaveSchema);

module.exports = Leave; 