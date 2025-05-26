const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
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
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'On Hold', 'Completed'],
      default: 'Not Started',
  },
    team: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  teamLead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  budget: {
    type: Number,
      default: 0,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Project', projectSchema); 