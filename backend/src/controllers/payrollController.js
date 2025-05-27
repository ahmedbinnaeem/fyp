const Payroll = require('../models/Payroll');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Setting = require('../models/Setting');
const asyncHandler = require('express-async-handler');

// @desc    Create manual payroll
// @route   POST /api/payroll
// @access  Private/Admin
const createPayroll = async (req, res) => {
  try {
    const {
      employee,
      month,
      year,
      basicSalary,
      allowances,
      deductions,
      netSalary
    } = req.body;

    // Check if payroll already exists for this month
    const existingPayroll = await Payroll.findOne({
      user: employee,
      month,
      year,
    });

    if (existingPayroll) {
      return res.status(400).json({ message: 'Payroll already exists for this month' });
    }

    // Create new payroll with validated data
    const payroll = await Payroll.create({
      user: employee,
      month: Number(month),
      year: Number(year),
      basicSalary: Number(basicSalary),
      allowances: {
        housing: Number(allowances.housing || 0),
        transport: Number(allowances.transport || 0),
        meal: Number(allowances.meal || 0),
        other: Number(allowances.other || 0)
      },
      deductions: {
        tax: Number(deductions.tax || 0),
        insurance: Number(deductions.insurance || 0),
        other: Number(deductions.other || 0)
      },
      netSalary: Number(netSalary)
    });

    const populatedPayroll = await Payroll.findById(payroll._id)
      .populate('user', 'firstName lastName email department');

    res.status(201).json(populatedPayroll);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Generate monthly payroll for an employee
// @route   POST /api/payroll/generate
// @access  Private/Admin
const generatePayroll = asyncHandler(async (req, res) => {
  const { userId, month, year, basicSalary, overtimeHours = 0, allowances = [], deductions = [] } = req.body;

  // Validate month and year
  const currentDate = new Date();
  if (year > currentDate.getFullYear() || (year === currentDate.getFullYear() && month > currentDate.getMonth() + 1)) {
    res.status(400);
    throw new Error('Cannot generate payroll for future dates');
  }

  // Check if payroll already exists
  const existingPayroll = await Payroll.findOne({ user: userId, month, year });
  if (existingPayroll) {
    res.status(400);
    throw new Error('Payroll already exists for this month');
  }

  // Get settings for tax rate and overtime rate
  const settings = await Setting.findOne();
  if (!settings) {
    res.status(400);
    throw new Error('System settings not configured');
  }

  // Calculate tax amount
  const taxAmount = (basicSalary * settings.payrollSettings.taxRate) / 100;

  // Create payroll record
  const payroll = await Payroll.create({
    user: userId,
    month,
    year,
    basicSalary,
    overtimeHours,
    overtimeRate: settings.payrollSettings.overtimeRate,
    allowances,
    deductions,
    taxAmount,
    status: 'Draft'
  });

  res.status(201).json(payroll);
});

// @desc    Get all payrolls (admin)
// @route   GET /api/payroll
// @access  Private/Admin
const getAllPayrolls = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  
  let query = {};
  if (month && year) {
    query = { month: Number(month), year: Number(year) };
  }

  const payrolls = await Payroll.find(query)
    .populate('user', 'firstName lastName email employeeId department')
    .sort({ createdAt: -1 });

  res.json(payrolls);
});

// @desc    Get employee's payroll history
// @route   GET /api/payroll/my-payroll
// @access  Private
const getMyPayroll = asyncHandler(async (req, res) => {
  const payrolls = await Payroll.find({ user: req.user._id })
    .sort({ year: -1, month: -1 });

  res.json(payrolls);
});

// @desc    Get single payroll detail
// @route   GET /api/payroll/:id
// @access  Private
const getPayrollById = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id)
    .populate('user', 'firstName lastName email employeeId department');

  if (!payroll) {
    res.status(404);
    throw new Error('Payroll not found');
  }

  // Check if user is admin or the payroll belongs to the requesting user
  if (!req.user.isAdmin && payroll.user._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to view this payroll');
  }

  res.json(payroll);
});

// @desc    Update payroll status
// @route   PUT /api/payroll/:id
// @access  Private/Admin
const updatePayrollStatus = asyncHandler(async (req, res) => {
  const { status, paymentDate, paymentMethod, remarks } = req.body;

  const payroll = await Payroll.findById(req.params.id);

  if (!payroll) {
    res.status(404);
    throw new Error('Payroll not found');
  }

  payroll.status = status;
  if (status === 'Paid') {
    payroll.paymentDate = paymentDate || new Date();
    payroll.paymentMethod = paymentMethod;
  }
  if (remarks) {
    payroll.remarks = remarks;
  }

  const updatedPayroll = await payroll.save();

  res.json(updatedPayroll);
});

// @desc    Delete payroll
// @route   DELETE /api/payroll/:id
// @access  Private/Admin
const deletePayroll = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id);

  if (!payroll) {
    res.status(404);
    throw new Error('Payroll not found');
  }

  if (payroll.status !== 'Draft') {
    res.status(400);
    throw new Error('Can only delete draft payrolls');
  }

  await payroll.remove();

  res.json({ message: 'Payroll removed' });
});

// @desc    Get payroll statistics
// @route   GET /api/payroll/stats
// @access  Private/Admin
const getPayrollStats = async (req, res) => {
  try {
    const stats = await Payroll.aggregate([
      {
        $group: {
          _id: { month: '$month', year: '$year' },
          totalPayout: { $sum: '$netSalary' },
          count: { $sum: 1 },
          avgSalary: { $avg: '$netSalary' },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }, // Last 12 months
    ]);

    res.json(stats);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createPayroll,
  generatePayroll,
  getAllPayrolls,
  getMyPayroll,
  getPayrollById,
  updatePayrollStatus,
  deletePayroll,
  getPayrollStats,
}; 