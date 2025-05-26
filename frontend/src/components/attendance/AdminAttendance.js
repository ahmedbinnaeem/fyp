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
  CircularProgress,
  Alert,
  Chip,
  TextField,
  Stack,
} from '@mui/material';
import axios from '../../utils/axios';

const AdminAttendance = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  const fetchAttendances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/attendance', {
        params: { date: dateFilter }
      });
      setAttendances(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    fetchAttendances();
  }, [fetchAttendances]);

  const formatTime = (date) => {
    if (!date) return 'Not Recorded';
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

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Attendance Management
      </Typography>

      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
        <TextField
          type="date"
          label="Filter by Date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        {error && <Alert severity="error" sx={{ flex: 1 }}>{error}</Alert>}
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Clock In</TableCell>
              <TableCell>Clock Out</TableCell>
              <TableCell>Working Hours</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attendances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No attendance records found for this date
                </TableCell>
              </TableRow>
            ) : (
              attendances.map((record) => (
                <TableRow key={record._id}>
                  <TableCell>
                    {record.user.firstName} {record.user.lastName}
                  </TableCell>
                  <TableCell>
                    {new Date(record.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {formatTime(record.checkIn?.time)}
                  </TableCell>
                  <TableCell>
                    {formatTime(record.checkOut?.time)}
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
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AdminAttendance; 