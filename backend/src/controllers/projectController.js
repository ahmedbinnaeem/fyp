const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private/TeamLead/Admin
const createProject = async (req, res) => {
  try {
    const project = await Project.create({
      ...req.body,
      createdBy: req.user._id,
    });

    const populatedProject = await Project.findById(project._id)
      .populate('team', 'firstName lastName email department')
      .populate('teamLead', 'firstName lastName email department')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json(populatedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private/Admin
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('team', 'firstName lastName email department')
      .populate('teamLead', 'firstName lastName email department')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's projects (where they are team member or team lead)
// @route   GET /api/projects/my-projects
// @access  Private
const getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({
        $or: [
        { team: req.user._id },
        { teamLead: req.user._id }
        ]
    })
      .populate('team', 'firstName lastName email department')
      .populate('teamLead', 'firstName lastName email department')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('team', 'firstName lastName email department')
      .populate('teamLead', 'firstName lastName email department')
      .populate('createdBy', 'firstName lastName');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    )
      .populate('team', 'firstName lastName email department')
      .populate('teamLead', 'firstName lastName email department')
      .populate('createdBy', 'firstName lastName');

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

    await project.deleteOne();
    res.json({ message: 'Project removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add team member to project
// @route   POST /api/projects/:id/team
// @access  Private/TeamLead/Admin
const addTeamMember = async (req, res) => {
  try {
    const { userId } = req.body;
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
    if (project.team.includes(userId)) {
      return res.status(400).json({ message: 'User is already in the team' });
    }

    project.team.push(userId);
    const updatedProject = await project.save();
    
    const populatedProject = await updatedProject
      .populate('team', 'firstName lastName email department')
      .populate('teamLead', 'firstName lastName email department')
      .populate('createdBy', 'firstName lastName');

    res.json(populatedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createProject,
  getProjects,
  getMyProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addTeamMember,
};