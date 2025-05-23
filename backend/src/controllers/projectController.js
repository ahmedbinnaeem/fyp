const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private/TeamLead/Admin
const createProject = async (req, res) => {
  try {
    const project = await Project.create({
      ...req.body,
      teamLead: req.user._id,
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    let query = {};
    
    // If not admin, only show projects where user is team lead or team member
    if (req.user.role !== 'admin') {
      query = {
        $or: [
          { teamLead: req.user._id },
          { 'team.user': req.user._id }
        ]
      };
    }

    const projects = await Project.find(query)
      .populate('teamLead', 'firstName lastName email')
      .populate('team.user', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('teamLead', 'firstName lastName email')
      .populate('team.user', 'firstName lastName email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has permission to view this project
    if (
      req.user.role !== 'admin' &&
      project.teamLead._id.toString() !== req.user._id.toString() &&
      !project.team.some(member => member.user._id.toString() === req.user._id.toString())
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private/TeamLead/Admin
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is authorized to update the project
    if (
      req.user.role !== 'admin' &&
      project.teamLead.toString() !== req.user._id.toString()
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    Object.assign(project, req.body);
    const updatedProject = await project.save();

    res.json(updatedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await project.remove();
    res.json({ message: 'Project removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Add team member to project
// @route   POST /api/projects/:id/team
// @access  Private/TeamLead/Admin
const addTeamMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is authorized to add team members
    if (
      req.user.role !== 'admin' &&
      project.teamLead.toString() !== req.user._id.toString()
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Check if user is already in team
    if (project.team.some(member => member.user.toString() === userId)) {
      return res.status(400).json({ message: 'User is already in the team' });
    }

    // Add new team member
    project.team.push({
      user: userId,
      role,
      assignedAt: new Date(),
    });

    const updatedProject = await project.save();
    res.json(updatedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addTeamMember,
};