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
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import axios from '../../utils/axios';

const EmployeeAttendance = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceData, setAttendanceData] = useState({
    attendances: [],
    todayStatus: {
      isClockedIn: false,
      isClockedOut: false,
      attendance: null,
    },
  });

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/attendance/my-attendance');
      setAttendanceData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleClockIn = async () => {
    try {
      setError(null);
      await axios.post('/attendance/clock-in');
      fetchAttendance();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    try {
      setError(null);
      await axios.post('/attendance/clock-out');
      fetchAttendance();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to clock out');
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatWorkingHours = (workingHours) => {
    if (!workingHours) return '-';
    
    // Handle old format (decimal number)
    if (typeof workingHours === 'number') {
      const hours = Math.floor(workingHours);
      const minutes = Math.round((workingHours - hours) * 60);
      if (hours === 0 && minutes === 0) return '-';
      if (hours === 0) return `${minutes}m`;
      if (minutes === 0) return `${hours}h`;
      return `${hours}h ${minutes}m`;
    }

    // Handle new format (object with hours and minutes)
    const { hours, minutes } = workingHours;
    if (hours === 0 && minutes === 0) return '-';
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
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
      <Typography variant="h4" sx={{ mb: 4 }}>
        My Attendance
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Today's Status
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box>
            <Typography variant="body1" color="text.secondary">
              Status:
            </Typography>
            <Chip
              label={
                attendanceData.todayStatus.isClockedIn
                  ? attendanceData.todayStatus.isClockedOut
                    ? 'Completed'
                    : 'In Progress'
                  : 'Not Started'
              }
              color={
                attendanceData.todayStatus.isClockedIn
                  ? attendanceData.todayStatus.isClockedOut
                    ? 'success'
                    : 'primary'
                  : 'default'
              }
            />
          </Box>
          {attendanceData.todayStatus.attendance && (
            <Box>
              <Typography variant="body1" color="text.secondary">
                Clock In:
              </Typography>
              <Typography>
                {formatTime(attendanceData.todayStatus.attendance.checkIn.time)}
              </Typography>
            </Box>
          )}
          {attendanceData.todayStatus.attendance?.checkOut?.time && (
            <Box>
              <Typography variant="body1" color="text.secondary">
                Clock Out:
              </Typography>
              <Typography>
                {formatTime(attendanceData.todayStatus.attendance.checkOut.time)}
              </Typography>
            </Box>
          )}
          {attendanceData.todayStatus.attendance?.workingHours && (
            <Box>
              <Typography variant="body1" color="text.secondary">
                Working Hours:
              </Typography>
              <Typography>
                {formatWorkingHours(attendanceData.todayStatus.attendance.workingHours)}
              </Typography>
            </Box>
          )}
          <Box sx={{ ml: 'auto' }}>
            {!attendanceData.todayStatus.isClockedIn ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleClockIn}
              >
                Clock In
              </Button>
            ) : !attendanceData.todayStatus.isClockedOut ? (
              <Button
                variant="contained"
                color="secondary"
                onClick={handleClockOut}
              >
                Clock Out
              </Button>
            ) : null}
          </Box>
        </Stack>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Clock In</TableCell>
              <TableCell>Clock Out</TableCell>
              <TableCell>Working Hours</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attendanceData.attendances.map((record) => (
              <TableRow key={record._id}>
                <TableCell>
                  {new Date(record.date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {record.checkIn?.time
                    ? formatTime(record.checkIn.time)
                    : 'Not Recorded'}
                </TableCell>
                <TableCell>
                  {record.checkOut?.time
                    ? formatTime(record.checkOut.time)
                    : 'Not Recorded'}
                </TableCell>
                <TableCell>
                  {formatWorkingHours(record.workingHours)}
                </TableCell>
                <TableCell>
                  <Chip
                    label={record.status}
                    color={
                      record.status === 'present'
                        ? 'success'
                        : record.status === 'late'
                        ? 'warning'
                        : 'error'
                    }
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default EmployeeAttendance; 