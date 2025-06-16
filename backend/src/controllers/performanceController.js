const Performance = require('../models/Performance');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Create a new performance review
// @route   POST /api/performance
// @access  Private/Admin
const createPerformanceReview = asyncHandler(async (req, res) => {
  const {
    user,
    reviewDate,
    reviewPeriod,
    categories,
    goals,
    strengths,
    areasOfImprovement,
    overallRating,
    overallComments,
    nextReviewDate
  } = req.body;

  // Validate user exists
  const employee = await User.findById(user);
  if (!employee) {
    res.status(404);
    throw new Error('Employee not found');
  }

  const performance = await Performance.create({
    user,
    reviewDate,
    reviewPeriod,
    reviewer: req.user._id,
    categories,
    goals,
    strengths,
    areasOfImprovement,
    overallRating,
    overallComments,
    nextReviewDate,
    status: 'Draft'
  });

  const populatedPerformance = await Performance.findById(performance._id)
    .populate('user', 'firstName lastName email department')
    .populate('reviewer', 'firstName lastName email');

  res.status(201).json(populatedPerformance);
});

// @desc    Get all performance reviews (admin) or own reviews (employee)
// @route   GET /api/performance
// @access  Private
const getPerformanceReviews = asyncHandler(async (req, res) => {
  const { status, startDate, endDate, user } = req.query;
  
  let query = {};
  
  // If not admin, only show own reviews
  if (req.user.role !== 'admin') {
    query.user = req.user._id;
  } else if (user) {
    // If admin and user specified, filter by user
    query.user = user;
  }

  // Add filters if provided
  if (status) query.status = status;
  if (startDate && endDate) {
    query.reviewDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const reviews = await Performance.find(query)
    .populate('user', 'firstName lastName email department')
    .populate('reviewer', 'firstName lastName email')
    .sort({ reviewDate: -1 });

  res.json(reviews);
});

// @desc    Get single performance review
// @route   GET /api/performance/:id
// @access  Private
const getPerformanceReview = asyncHandler(async (req, res) => {
  const review = await Performance.findById(req.params.id)
    .populate('user', 'firstName lastName email department')
    .populate('reviewer', 'firstName lastName email');

  if (!review) {
    res.status(404);
    throw new Error('Performance review not found');
  }

  // Check if user is admin or the review belongs to the requesting user
  if (req.user.role !== 'admin' && review.user._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to view this review');
  }

  res.json(review);
});

// @desc    Update performance review
// @route   PUT /api/performance/:id
// @access  Private/Admin
const updatePerformanceReview = asyncHandler(async (req, res) => {
  const review = await Performance.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Performance review not found');
  }

  // Only allow updates if review is in Draft or Pending status
  if (!['Draft', 'Pending'].includes(review.status)) {
    res.status(400);
    throw new Error('Cannot update a completed review');
  }

  const {
    categories,
    goals,
    strengths,
    areasOfImprovement,
    overallRating,
    overallComments,
    nextReviewDate,
    status
  } = req.body;

  // Update fields
  if (categories) review.categories = categories;
  if (goals) review.goals = goals;
  if (strengths) review.strengths = strengths;
  if (areasOfImprovement) review.areasOfImprovement = areasOfImprovement;
  if (overallRating) review.overallRating = overallRating;
  if (overallComments) review.overallComments = overallComments;
  if (nextReviewDate) review.nextReviewDate = nextReviewDate;
  if (status) review.status = status;

  const updatedReview = await review.save();

  const populatedReview = await Performance.findById(updatedReview._id)
    .populate('user', 'firstName lastName email department')
    .populate('reviewer', 'firstName lastName email');

  res.json(populatedReview);
});

// @desc    Add employee comments to review
// @route   PUT /api/performance/:id/comments
// @access  Private
const addEmployeeComments = asyncHandler(async (req, res) => {
  const { comments } = req.body;
  const review = await Performance.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Performance review not found');
  }

  // Check if user is the employee being reviewed
  if (review.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to add comments to this review');
  }

  review.employeeComments = comments;
  const updatedReview = await review.save();

  const populatedReview = await Performance.findById(updatedReview._id)
    .populate('user', 'firstName lastName email department')
    .populate('reviewer', 'firstName lastName email');

  res.json(populatedReview);
});

// @desc    Acknowledge performance review
// @route   PUT /api/performance/:id/acknowledge
// @access  Private
const acknowledgeReview = asyncHandler(async (req, res) => {
  const review = await Performance.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Performance review not found');
  }

  // Check if user is the employee being reviewed
  if (review.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to acknowledge this review');
  }

  review.isAcknowledged = true;
  review.acknowledgedAt = new Date();
  const updatedReview = await review.save();

  const populatedReview = await Performance.findById(updatedReview._id)
    .populate('user', 'firstName lastName email department')
    .populate('reviewer', 'firstName lastName email');

  res.json(populatedReview);
});

// @desc    Delete performance review
// @route   DELETE /api/performance/:id
// @access  Private/Admin
const deletePerformanceReview = asyncHandler(async (req, res) => {
  const review = await Performance.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Performance review not found');
  }

  // Only allow deletion if review is in Draft status
  if (review.status !== 'Draft') {
    res.status(400);
    throw new Error('Can only delete draft reviews');
  }

  await review.remove();

  res.json({ message: 'Performance review removed' });
});

// @desc    Get performance statistics
// @route   GET /api/performance/stats
// @access  Private/Admin
const getPerformanceStats = asyncHandler(async (req, res) => {
  const stats = await Performance.aggregate([
    {
      $match: {
        status: 'Completed'
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$reviewDate' },
          month: { $month: '$reviewDate' }
        },
        averageRating: { $avg: '$overallRating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$overallRating'
        }
      }
    },
    {
      $sort: {
        '_id.year': -1,
        '_id.month': -1
      }
    },
    {
      $limit: 12 // Last 12 months
    }
  ]);

  // Calculate rating distribution
  const ratingDistribution = stats.map(month => ({
    ...month,
    ratingDistribution: {
      1: month.ratingDistribution.filter(r => r === 1).length,
      2: month.ratingDistribution.filter(r => r === 2).length,
      3: month.ratingDistribution.filter(r => r === 3).length,
      4: month.ratingDistribution.filter(r => r === 4).length,
      5: month.ratingDistribution.filter(r => r === 5).length
    }
  }));

  res.json(ratingDistribution);
});

module.exports = {
  createPerformanceReview,
  getPerformanceReviews,
  getPerformanceReview,
  updatePerformanceReview,
  addEmployeeComments,
  acknowledgeReview,
  deletePerformanceReview,
  getPerformanceStats
}; 