const Payroll = require('../models/Payroll');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

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

// @desc    Generate payroll for all users
// @route   POST /api/payroll/generate
// @access  Private/Admin
const generatePayroll = async (req, res) => {
  try {
    const { month, year } = req.body;

    // Get all active employees
    const employees = await User.find({ isActive: true });

    const results = [];
    const errors = [];

    // Process each employee
    for (const employee of employees) {
      try {
        // Check if payroll already exists for this employee in this month
        const existingPayroll = await Payroll.findOne({
          user: employee._id,
          month,
          year,
        });

        if (existingPayroll) {
          errors.push(`Payroll already exists for ${employee.firstName} ${employee.lastName}`);
          continue;
        }

        // Get attendance records for the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const attendance = await Attendance.find({
          user: employee._id,
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        });

        // Get basic salary from employee data
        const basicSalary = employee.basicSalary;

        // If no basic salary is set, skip this employee
        if (!basicSalary) {
          errors.push(`No basic salary set for ${employee.firstName} ${employee.lastName}`);
          continue;
        }

        // Calculate working days
        const workingDays = attendance.filter(a => a.status === 'present').length;
        const totalDays = endDate.getDate();

        // Calculate allowances (example: 10% of basic salary for housing)
        const allowances = {
          housing: basicSalary * 0.1,    // 10% housing allowance
          transport: basicSalary * 0.05,  // 5% transport allowance
          meal: basicSalary * 0.03,      // 3% meal allowance
          other: 0
        };

        // Calculate deductions
        const deductions = {
          tax: basicSalary * 0.1,        // 10% tax
          insurance: basicSalary * 0.05,  // 5% insurance
          other: 0
        };

        // Calculate total allowances and deductions
        const totalAllowances = Object.values(allowances).reduce((a, b) => a + b, 0);
        const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0);

        // Calculate net salary
        const netSalary = basicSalary + totalAllowances - totalDeductions;

        // Create payroll record
        const payroll = await Payroll.create({
          user: employee._id,
          month: Number(month),
          year: Number(year),
          basicSalary,
          allowances,
          deductions,
          netSalary,
          paymentMethod: 'bank_transfer',
          status: 'pending'
        });

        const populatedPayroll = await Payroll.findById(payroll._id)
          .populate('user', 'firstName lastName email department');

        results.push(populatedPayroll);
      } catch (error) {
        errors.push(`Failed to generate payroll for ${employee.firstName} ${employee.lastName}: ${error.message}`);
      }
    }

    res.status(201).json({
      success: true,
      results,
      errors,
      message: `Generated ${results.length} payrolls with ${errors.length} errors`
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get all payrolls (admin) or user's payrolls
// @route   GET /api/payroll
// @access  Private
const getPayrolls = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { user: req.user._id };
    
    // Filter by month and year if provided
    if (req.query.month && req.query.year) {
      query.month = req.query.month;
      query.year = req.query.year;
    }

    const payrolls = await Payroll.find(query)
      .populate('user', 'firstName lastName email department')
      .sort({ year: -1, month: -1 });

    // Format response to match frontend expectations
    const formattedPayrolls = payrolls.map(payroll => ({
      _id: payroll._id,
      employee: {
        _id: payroll.user._id,
        firstName: payroll.user.firstName,
        lastName: payroll.user.lastName,
        email: payroll.user.email,
        department: payroll.user.department
      },
      basicSalary: payroll.basicSalary,
      allowances: payroll.allowances,
      deductions: payroll.deductions,
      netSalary: payroll.netSalary,
      month: payroll.month,
      year: payroll.year,
      status: payroll.status,
      createdAt: payroll.createdAt,
      updatedAt: payroll.updatedAt
    }));

    res.json(formattedPayrolls);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get payroll by ID
// @route   GET /api/payroll/:id
// @access  Private
const getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('user', 'firstName lastName email department');

    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }

    // Check if user has permission to view this payroll
    if (
      req.user.role !== 'admin' &&
      payroll.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(payroll);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update payroll
// @route   PUT /api/payroll/:id
// @access  Private/Admin
const updatePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }

    const {
      basicSalary,
      allowances,
      deductions,
      netSalary
    } = req.body;

    // Update with validated data
    payroll.basicSalary = Number(basicSalary);
    payroll.allowances = {
      housing: Number(allowances.housing || 0),
      transport: Number(allowances.transport || 0),
      meal: Number(allowances.meal || 0),
      other: Number(allowances.other || 0)
    };
    payroll.deductions = {
      tax: Number(deductions.tax || 0),
      insurance: Number(deductions.insurance || 0),
      other: Number(deductions.other || 0)
    };
    payroll.netSalary = Number(netSalary);

    const updatedPayroll = await payroll.save();
    const populatedPayroll = await Payroll.findById(updatedPayroll._id)
      .populate('user', 'firstName lastName email department');

    res.json(populatedPayroll);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete payroll
// @route   DELETE /api/payroll/:id
// @access  Private/Admin
const deletePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }

    await payroll.remove();
    res.json({ message: 'Payroll removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

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
  getPayrolls,
  getPayrollById,
  updatePayroll,
  deletePayroll,
  getPayrollStats,
}; 