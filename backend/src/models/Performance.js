const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewDate: {
    type: Date,
    required: true
  },
  reviewPeriod: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Pending', 'Reviewed', 'Completed'],
    default: 'Draft'
  },
  categories: [{
    name: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comments: String
  }],
  goals: [{
    description: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed', 'Not Achieved'],
      default: 'Not Started'
    },
    targetDate: Date,
    completionDate: Date,
    comments: String
  }],
  strengths: [{
    type: String,
    required: true
  }],
  areasOfImprovement: [{
    type: String,
    required: true
  }],
  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  overallComments: {
    type: String,
    required: true
  },
  employeeComments: String,
  nextReviewDate: Date,
  attachments: [{
    name: String,
    url: String,
    uploadedAt: Date
  }],
  isAcknowledged: {
    type: Boolean,
    default: false
  },
  acknowledgedAt: Date
}, {
  timestamps: true
});

// Add indexes for better query performance
performanceSchema.index({ user: 1, reviewDate: -1 });
performanceSchema.index({ reviewer: 1, reviewDate: -1 });
performanceSchema.index({ status: 1 });

const Performance = mongoose.model('Performance', performanceSchema);

module.exports = Performance; 