const express = require('express');
const router = express.Router();
const {
  generatePayroll,
  getAllPayrolls,
  getMyPayroll,
  getPayrollById,
  updatePayrollStatus,
  deletePayroll,
} = require('../controllers/payrollController');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin routes
router.route('/')
  .get(protect, admin, getAllPayrolls);

router.route('/generate')
  .post(protect, admin, generatePayroll);

// Employee routes - specific routes before parameter routes
router.get('/my-payroll', protect, getMyPayroll);

// Parameter routes should come last
router.route('/:id')
  .get(protect, getPayrollById)
  .put(protect, admin, updatePayrollStatus)
  .delete(protect, admin, deletePayroll);

module.exports = router; 