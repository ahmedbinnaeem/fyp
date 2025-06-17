const express = require('express');
const router = express.Router();
const Payroll = require('../models/Payroll');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Get all payrolls (admin only)
router.get('/', [auth, admin], async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = {};
    
    if (month && year) {
      query.month = parseInt(month);
      query.year = parseInt(year);
    }

    const payrolls = await Payroll.find(query)
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 });
    res.json(payrolls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get my payroll (for employees)
router.get('/my-payroll', auth, async (req, res) => {
  try {
    const payrolls = await Payroll.find({ user: req.user._id });
    res.json(payrolls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update payroll status (admin only)
router.put('/:id', [auth, admin], async (req, res) => {
  try {
    const { status, paymentDate, paymentMethod, remarks, allowances, deductions, basicSalary } = req.body;

    // First find the existing payroll
    const existingPayroll = await Payroll.findById(req.params.id);
    if (!existingPayroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }

    // Format allowances as array of objects if provided
    if (allowances) {
      const formattedAllowances = [
        {
          type: 'Housing',
          amount: Number(allowances?.housing || 0),
          description: 'Housing allowance'
        },
        {
          type: 'Transport',
          amount: Number(allowances?.transport || 0),
          description: 'Transport allowance'
        },
        {
          type: 'Meal',
          amount: Number(allowances?.meal || 0),
          description: 'Meal allowance'
        },
        {
          type: 'Other',
          amount: Number(allowances?.other || 0),
          description: 'Other allowances'
        }
      ].filter(allowance => allowance.amount > 0);

      existingPayroll.allowances = formattedAllowances;
    }

    // Format deductions as array of objects if provided
    if (deductions) {
      const formattedDeductions = [
        {
          type: 'Tax',
          amount: Number(deductions?.tax || 0),
          description: 'Income tax'
        },
        {
          type: 'Insurance',
          amount: Number(deductions?.insurance || 0),
          description: 'Health insurance'
        },
        {
          type: 'Other',
          amount: Number(deductions?.other || 0),
          description: 'Other deductions'
        }
      ].filter(deduction => deduction.amount > 0);

      existingPayroll.deductions = formattedDeductions;
    }

    // Update other fields
    if (status) existingPayroll.status = status;
    if (basicSalary) existingPayroll.basicSalary = Number(basicSalary);
    if (status === 'Paid' && paymentMethod && paymentDate) {
      existingPayroll.paymentMethod = paymentMethod;
      existingPayroll.paymentDate = paymentDate;
    }
    if (remarks) existingPayroll.remarks = remarks;

    // Save the updated payroll
    const updatedPayroll = await existingPayroll.save();

    // Fetch the updated document with populated user
    const populatedPayroll = await Payroll.findById(updatedPayroll._id)
      .populate('user', 'firstName lastName email');

    res.json(populatedPayroll);
  } catch (err) {
    console.error('Error updating payroll:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get specific payroll
router.get('/:id', auth, async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }

    // Check if user is admin or the payroll belongs to the user
    if (!req.user.isAdmin && payroll.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(payroll);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 