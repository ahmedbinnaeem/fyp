import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  MenuItem,
  Chip,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useSelector } from 'react-redux';
import api from '../utils/axios';

const statusOptions = ['Not Started', 'In Progress', 'On Hold', 'Completed'];

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'Not Started',
    team: [],
    teamLead: '',
    budget: '',
    progress: 0,
  });
  const { user } = useSelector((state) => state.auth);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // If user is admin, fetch all projects, else fetch user's projects
      const endpoint = user?.role === 'admin' ? '/projects' : '/projects/my-projects';
      const response = await api.get(endpoint);
      setProjects(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  const fetchEmployees = useCallback(async () => {
    if (user?.role === 'admin') {
      try {
        const response = await api.get('/users');
        setEmployees(response.data);
      } catch (err) {
        console.error('Failed to fetch employees:', err);
      }
    }
  }, [user?.role]);

  useEffect(() => {
    fetchProjects();
    if (user?.role === 'admin') {
      fetchEmployees();
    }
  }, [user, fetchProjects, fetchEmployees]);

  const handleOpenDialog = (project = null) => {
    if (project) {
      setFormData({
        ...project,
        startDate: project.startDate.split('T')[0],
        endDate: project.endDate.split('T')[0],
      });
      setSelectedProject(project);
    } else {
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'Not Started',
        team: [],
        teamLead: '',
        budget: '',
        progress: 0,
      });
      setSelectedProject(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProject(null);
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'Not Started',
      team: [],
      teamLead: '',
      budget: '',
      progress: 0,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      if (selectedProject) {
        await api.put(`/projects/${selectedProject._id}`, formData);
      } else {
        await api.post('/projects', formData);
      }
      handleCloseDialog();
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save project');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await api.delete(`/projects/${id}`);
        fetchProjects();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete project');
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          {user?.role === 'admin' ? 'All Projects' : 'My Projects'}
        </Typography>
        {user?.role === 'admin' && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Project
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Project Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Team Members</TableCell>
              {user?.role === 'admin' && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project._id}>
                <TableCell>{project.name}</TableCell>
                <TableCell>{project.description}</TableCell>
                <TableCell>{new Date(project.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(project.endDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Chip
                    label={project.status}
                    color={
                      project.status === 'Completed'
                        ? 'success'
                        : project.status === 'In Progress'
                        ? 'primary'
                        : project.status === 'On Hold'
                        ? 'warning'
                        : 'default'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {project.team
                    .map((member) => `${member.firstName} ${member.lastName}`)
                    .join(', ')}
                </TableCell>
                {user?.role === 'admin' && (
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpenDialog(project)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(project._id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {user?.role === 'admin' && (
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {selectedProject ? 'Edit Project' : 'Add New Project'}
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={2}>
              <TextField
                name="name"
                label="Project Name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                fullWidth
              />
              <TextField
                name="startDate"
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={handleInputChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                name="endDate"
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={handleInputChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                name="status"
                label="Status"
                select
                value={formData.status}
                onChange={handleInputChange}
                fullWidth
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                name="team"
                label="Team Members"
                select
                value={formData.team}
                onChange={handleInputChange}
                fullWidth
                SelectProps={{ multiple: true }}
              >
                {employees.map((employee) => (
                  <MenuItem key={employee._id} value={employee._id}>
                    {employee.firstName} {employee.lastName}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                name="teamLead"
                label="Team Lead"
                select
                value={formData.teamLead}
                onChange={handleInputChange}
                fullWidth
                required
              >
                {employees.map((employee) => (
                  <MenuItem key={employee._id} value={employee._id}>
                    {employee.firstName} {employee.lastName}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                name="budget"
                label="Budget"
                type="number"
                value={formData.budget}
                onChange={handleInputChange}
                fullWidth
                InputProps={{
                  startAdornment: '$',
                }}
              />
              <TextField
                name="progress"
                label="Progress"
                type="number"
                value={formData.progress}
                onChange={handleInputChange}
                fullWidth
                InputProps={{
                  endAdornment: '%',
                  inputProps: {
                    min: 0,
                    max: 100,
                  },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              {selectedProject ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default Projects; 