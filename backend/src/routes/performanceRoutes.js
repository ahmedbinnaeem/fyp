const express = require('express');
const router = express.Router();
const {
  createPerformanceReview,
  getPerformanceReviews,
  getPerformanceReview,
  updatePerformanceReview,
  addEmployeeComments,
  acknowledgeReview,
  deletePerformanceReview,
  getPerformanceStats
} = require('../controllers/performanceController');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin routes
router.route('/')
  .post(protect, admin, createPerformanceReview)
  .get(protect, getPerformanceReviews);

router.route('/stats')
  .get(protect, admin, getPerformanceStats);

router.route('/:id')
  .get(protect, getPerformanceReview)
  .put(protect, admin, updatePerformanceReview)
  .delete(protect, admin, deletePerformanceReview);

router.route('/:id/comments')
  .put(protect, addEmployeeComments);

router.route('/:id/acknowledge')
  .put(protect, acknowledgeReview);

module.exports = router; 