import React, { useEffect, useState } from 'react';
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
  LinearProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
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
    budget: '',
    progress: 0,
  });

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');
      setProjects(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/users');
      setEmployees(response.data);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchEmployees();
  }, []);

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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Projects Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Project
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Team Size</TableCell>
              <TableCell>Timeline</TableCell>
              <TableCell>Budget</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project._id}>
                <TableCell>{project.name}</TableCell>
                <TableCell>{project.status}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress variant="determinate" value={project.progress} />
                    </Box>
                    <Box sx={{ minWidth: 35 }}>
                      <Typography variant="body2" color="text.secondary">{`${Math.round(
                        project.progress
                      )}%`}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{project.team.length}</TableCell>
                <TableCell>
                  {new Date(project.startDate).toLocaleDateString()} -{' '}
                  {new Date(project.endDate).toLocaleDateString()}
                </TableCell>
                <TableCell>${project.budget}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenDialog(project)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(project._id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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
    </Box>
  );
};

export default Projects; 