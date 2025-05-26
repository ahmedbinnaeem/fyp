const mongoose = require('mongoose');

const allowanceSchema = new mongoose.Schema({
  housing: { type: Number, default: 0 },
  transport: { type: Number, default: 0 },
  meal: { type: Number, default: 0 },
  other: { type: Number, default: 0 }
}, { _id: false });

const deductionSchema = new mongoose.Schema({
  tax: { type: Number, default: 0 },
  insurance: { type: Number, default: 0 },
  other: { type: Number, default: 0 }
}, { _id: false });

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
    type: allowanceSchema,
    required: true,
    default: () => ({})
  },
  deductions: {
    type: deductionSchema,
    required: true,
    default: () => ({})
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
    default: 'bank_transfer'
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
  return (housing || 0) + (transport || 0) + (meal || 0) + (other || 0);
});

// Virtual for calculating total deductions
payrollSchema.virtual('totalDeductions').get(function() {
  const { tax, insurance, other } = this.deductions;
  return (tax || 0) + (insurance || 0) + (other || 0);
});

const Payroll = mongoose.model('Payroll', payrollSchema);

module.exports = Payroll; 