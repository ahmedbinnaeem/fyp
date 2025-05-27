const mongoose = require('mongoose');

const allowanceSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: String
}, { _id: false });

const deductionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: String
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
  overtimeHours: {
    type: Number,
    default: 0
  },
  overtimeRate: {
    type: Number,
    default: 1.5
  },
  overtimeAmount: {
    type: Number,
    default: 0
  },
  deductions: {
    type: [deductionSchema],
    default: []
  },
  allowances: {
    type: [allowanceSchema],
    default: []
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  grossSalary: {
    type: Number,
    default: function() {
      return this.basicSalary || 0;
    }
  },
  netSalary: {
    type: Number,
    default: function() {
      return this.basicSalary || 0;
    }
  },
  status: {
    type: String,
    enum: ['Draft', 'Pending', 'Processing', 'Paid', 'Rejected'],
    default: 'Draft'
  },
  paymentDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['Bank Transfer', 'Cash', 'Check']
  },
  remarks: String
}, {
  timestamps: true
});

// Create a compound index for user, month, and year to ensure unique monthly records
payrollSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

// Calculate overtime amount and gross/net salary before saving
payrollSchema.pre('save', function(next) {
  // Calculate overtime amount
  this.overtimeAmount = this.overtimeHours * (this.basicSalary / 160) * this.overtimeRate;

  // Calculate total allowances
  const totalAllowances = this.allowances.reduce((sum, allowance) => sum + allowance.amount, 0) || 0;

  // Calculate total deductions
  const totalDeductions = this.deductions.reduce((sum, deduction) => sum + deduction.amount, 0) || 0;

  // Calculate gross salary
  this.grossSalary = this.basicSalary + this.overtimeAmount + totalAllowances;

  // Calculate net salary
  this.netSalary = this.grossSalary - totalDeductions - this.taxAmount;

  next();
});

const Payroll = mongoose.model('Payroll', payrollSchema);

module.exports = Payroll; 