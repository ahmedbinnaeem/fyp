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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useSelector } from 'react-redux';
import api from '../utils/axios';

const leaveTypes = ['Annual', 'Sick', 'Personal', 'Maternity', 'Paternity', 'Unpaid'];
const statusOptions = ['Pending', 'Approved', 'Rejected'];

const getStatusColor = (status) => {
  switch (status) {
    case 'Approved':
      return 'success';
    case 'Rejected':
      return 'error';
    default:
      return 'warning';
  }
};

const Leaves = () => {
  const { user } = useSelector((state) => state.auth);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [formData, setFormData] = useState({
    type: 'Annual',
    startDate: '',
    endDate: '',
    reason: '',
    status: 'Pending',
  });

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(user.role === 'admin' ? '/leaves' : '/leaves/my-leaves');
      setLeaves(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch leaves');
    } finally {
      setLoading(false);
    }
  }, [user.role]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleOpenDialog = (leave = null) => {
    if (leave) {
      setFormData({
        ...leave,
        startDate: leave.startDate.split('T')[0],
        endDate: leave.endDate.split('T')[0],
      });
      setSelectedLeave(leave);
    } else {
      setFormData({
        type: 'Annual',
        startDate: '',
        endDate: '',
        reason: '',
        status: 'Pending',
      });
      setSelectedLeave(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLeave(null);
    setFormData({
      type: 'Annual',
      startDate: '',
      endDate: '',
      reason: '',
      status: 'Pending',
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
      if (selectedLeave) {
        await api.put(`/leaves/${selectedLeave._id}`, formData);
      } else {
        await api.post('/leaves', formData);
      }
      handleCloseDialog();
      fetchLeaves();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save leave request');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this leave request?')) {
      try {
        await api.delete(`/leaves/${id}`);
        fetchLeaves();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete leave request');
      }
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/leaves/${id}/status`, { status });
      fetchLeaves();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update leave status');
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
        <Typography variant="h4">Leave Management</Typography>
        {!user.role === 'admin' && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Request Leave
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaves.map((leave) => (
              <TableRow key={leave._id}>
                <TableCell>
                  {leave.employee.firstName} {leave.employee.lastName}
                </TableCell>
                <TableCell>{leave.type}</TableCell>
                <TableCell>{new Date(leave.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(leave.endDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Chip
                    label={leave.status}
                    color={getStatusColor(leave.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{leave.reason}</TableCell>
                <TableCell align="right">
                  {user.role === 'admin' ? (
                    <Box>
                      <Button
                        size="small"
                        color="success"
                        onClick={() => handleStatusChange(leave._id, 'Approved')}
                        disabled={leave.status !== 'Pending'}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleStatusChange(leave._id, 'Rejected')}
                        disabled={leave.status !== 'Pending'}
                      >
                        Reject
                      </Button>
                    </Box>
                  ) : (
                    <>
                      <IconButton
                        onClick={() => handleOpenDialog(leave)}
                        color="primary"
                        disabled={leave.status !== 'Pending'}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(leave._id)}
                        color="error"
                        disabled={leave.status !== 'Pending'}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedLeave ? 'Edit Leave Request' : 'New Leave Request'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <TextField
              name="type"
              label="Leave Type"
              select
              value={formData.type}
              onChange={handleInputChange}
              fullWidth
            >
              {leaveTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
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
              name="reason"
              label="Reason"
              value={formData.reason}
              onChange={handleInputChange}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedLeave ? 'Update' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Leaves; 