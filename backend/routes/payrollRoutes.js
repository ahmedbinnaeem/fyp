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
    const { status, paymentDate, paymentMethod, remarks } = req.body;

    // First find the existing payroll
    const existingPayroll = await Payroll.findById(req.params.id);
    if (!existingPayroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }

    // Update only the fields we want to change
    existingPayroll.status = status;
    if (status === 'Paid' && paymentMethod && paymentDate) {
      existingPayroll.paymentMethod = paymentMethod;
      existingPayroll.paymentDate = paymentDate;
    }
    if (remarks) {
      existingPayroll.remarks = remarks;
    }

    // Use updateOne to bypass schema validation
    await Payroll.updateOne(
      { _id: req.params.id },
      {
        $set: {
          status: existingPayroll.status,
          paymentMethod: existingPayroll.paymentMethod,
          paymentDate: existingPayroll.paymentDate,
          remarks: existingPayroll.remarks,
          updatedAt: new Date()
        }
      }
    );

    // Fetch the updated document
    const updatedPayroll = await Payroll.findById(req.params.id)
      .populate('user', 'firstName lastName email');

    res.json(updatedPayroll);
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