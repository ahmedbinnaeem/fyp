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
  CircularProgress,
  Grid,
  Card,
  CardContent,
  IconButton,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useSelector } from 'react-redux';
import api from '../utils/axios';

const Attendance = () => {
  const { user } = useSelector((state) => state.auth);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    status: 'Present',
  });

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(
        user.role === 'admin'
          ? `/attendance?date=${selectedDate.toISOString()}`
          : '/attendance/my-attendance'
      );
      setAttendance(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, user.role]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleCheckIn = async () => {
    try {
      await api.post('/attendance/check-in');
      fetchAttendance();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    try {
      await api.post('/attendance/check-out');
      fetchAttendance();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check out');
    }
  };

  const handleOpenDialog = (record = null) => {
    if (record) {
      setFormData({
        checkIn: record.checkIn ? record.checkIn.substring(11, 16) : '',
        checkOut: record.checkOut ? record.checkOut.substring(11, 16) : '',
        status: record.status,
      });
      setSelectedRecord(record);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRecord(null);
    setFormData({
      checkIn: '',
      checkOut: '',
      status: 'Present',
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
      await api.put(`/attendance/${selectedRecord._id}`, formData);
      handleCloseDialog();
      fetchAttendance();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update attendance');
    }
  };

  const getTodayAttendance = () => {
    return attendance.find(
      (record) =>
        new Date(record.date).toDateString() === new Date().toDateString()
    );
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

  const todayAttendance = getTodayAttendance();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Attendance Management
      </Typography>

      {!user.role === 'admin' && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Today's Attendance
                </Typography>
                <Box display="flex" gap={2} mt={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleCheckIn}
                    disabled={todayAttendance?.checkIn}
                  >
                    Check In
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleCheckOut}
                    disabled={!todayAttendance?.checkIn || todayAttendance?.checkOut}
                  >
                    Check Out
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <TextField
          type="date"
          label="Select Date"
          value={selectedDate.toISOString().split('T')[0]}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Check In</TableCell>
              <TableCell>Check Out</TableCell>
              <TableCell>Working Hours</TableCell>
              <TableCell>Status</TableCell>
              {user.role === 'admin' && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {attendance.map((record) => (
              <TableRow key={record._id}>
                <TableCell>
                  {record.employee.firstName} {record.employee.lastName}
                </TableCell>
                <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                <TableCell>
                  {record.checkIn
                    ? new Date(record.checkIn).toLocaleTimeString()
                    : '-'}
                </TableCell>
                <TableCell>
                  {record.checkOut
                    ? new Date(record.checkOut).toLocaleTimeString()
                    : '-'}
                </TableCell>
                <TableCell>{record.workingHours || '-'}</TableCell>
                <TableCell>{record.status}</TableCell>
                {user.role === 'admin' && (
                  <TableCell align="right">
                    <IconButton
                      onClick={() => handleOpenDialog(record)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Attendance Record</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <TextField
              name="checkIn"
              label="Check In Time"
              type="time"
              value={formData.checkIn}
              onChange={handleInputChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              name="checkOut"
              label="Check Out Time"
              type="time"
              value={formData.checkOut}
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
              <MenuItem value="Present">Present</MenuItem>
              <MenuItem value="Absent">Absent</MenuItem>
              <MenuItem value="Half Day">Half Day</MenuItem>
              <MenuItem value="Late">Late</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Attendance; 