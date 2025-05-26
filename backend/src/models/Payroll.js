const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  basicSalary: {
    type: Number,
    required: true
  },
  allowances: {
    housing: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    meal: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  deductions: {
    tax: { type: Number, default: 0 },
    insurance: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  overtime: {
    hours: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  },
  bonus: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'paid'],
    default: 'pending'
  },
  paymentDate: Date,
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'check', 'cash'],
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    accountName: String
  },
  comments: String
}, {
  timestamps: true
});

// Index for efficient querying
payrollSchema.index({ user: 1, year: 1, month: 1 }, { unique: true });

// Virtual for calculating total allowances
payrollSchema.virtual('totalAllowances').get(function() {
  const { housing, transport, meal, other } = this.allowances;
  return housing + transport + meal + other;
});

// Virtual for calculating total deductions
payrollSchema.virtual('totalDeductions').get(function() {
  const { tax, insurance, other } = this.deductions;
  return tax + insurance + other;
});

const Payroll = mongoose.model('Payroll', payrollSchema);

module.exports = Payroll; 