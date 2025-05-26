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

const leaveTypes = ['Annual', 'Sick', 'Personal', 'Maternity', 'Paternity', 'Unpaid'];
const statusOptions = ['Pending', 'Approved', 'Rejected'];

const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'approved':
      return 'success';
    case 'pending':
      return 'warning';
    case 'rejected':
      return 'error';
    default:
      return 'default';
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
    leaveType: 'Annual',
    startDate: '',
    endDate: '',
    reason: '',
    status: 'Pending',
  });

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // If user is admin, fetch all leaves, else fetch user's leaves
      const endpoint = user?.role === 'admin' ? '/leaves' : '/leaves/my-leaves';
      const response = await api.get(endpoint);
      setLeaves(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch leaves');
    } finally {
      setLoading(false);
    }
  }, [user]);

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
        leaveType: 'Annual',
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
      leaveType: 'Annual',
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
          {user?.role === 'admin' ? 'All Leave Requests' : 'My Leave Requests'}
        </Typography>
        {user?.role !== 'admin' && (
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
              {user?.role === 'admin' && <TableCell>Employee</TableCell>}
              <TableCell>Leave Type</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Duration (Days)</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaves.map((leave) => (
              <TableRow key={leave._id}>
                {user?.role === 'admin' && (
                <TableCell>
                    {leave.user.firstName} {leave.user.lastName}
                </TableCell>
                )}
                <TableCell>{leave.leaveType}</TableCell>
                <TableCell>{new Date(leave.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(leave.endDate).toLocaleDateString()}</TableCell>
                <TableCell>{leave.duration}</TableCell>
                <TableCell>{leave.reason}</TableCell>
                <TableCell>
                  <Chip
                    label={leave.status}
                    color={getStatusColor(leave.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  {user?.role === 'admin' ? (
                    leave.status === 'Pending' && (
                      <>
                      <Button
                        size="small"
                        color="success"
                        onClick={() => handleStatusChange(leave._id, 'Approved')}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleStatusChange(leave._id, 'Rejected')}
                      >
                        Reject
                      </Button>
                      </>
                    )
                  ) : (
                    leave.status === 'Pending' && (
                    <>
                      <IconButton
                        onClick={() => handleOpenDialog(leave)}
                        color="primary"
                          size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(leave._id)}
                        color="error"
                          size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                    )
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
              name="leaveType"
              label="Leave Type"
              select
              value={formData.leaveType}
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