const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addTeamMember,
  getMyProjects,
} = require('../controllers/projectController');
const { protect, admin, teamLead } = require('../middleware/authMiddleware');

// Place specific routes before parameter routes
router.get('/my-projects', protect, getMyProjects);

router.route('/')
  .post(protect, teamLead, createProject)
  .get(protect, getProjects);

router.route('/:id')
  .get(protect, getProjectById)
  .put(protect, teamLead, updateProject)
  .delete(protect, admin, deleteProject);

router.route('/:id/team')
  .post(protect, teamLead, addTeamMember);

module.exports = router; 