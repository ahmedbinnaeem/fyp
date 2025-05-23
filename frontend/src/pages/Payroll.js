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
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import api from '../utils/axios';

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const Payroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employee: '',
    basicSalary: '',
    allowances: '',
    deductions: '',
    month: '',
    year: '',
  });

  const fetchPayrolls = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/payroll?month=${selectedMonth.getMonth() + 1}&year=${selectedMonth.getFullYear()}`
      );
      setPayrolls(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch payrolls');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/users');
      setEmployees(response.data);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  useEffect(() => {
    fetchPayrolls();
    fetchEmployees();
  }, [fetchPayrolls]);

  const handleOpenDialog = (payroll = null) => {
    if (payroll) {
      setFormData({
        employee: payroll.employee._id,
        basicSalary: payroll.basicSalary,
        allowances: payroll.allowances,
        deductions: payroll.deductions,
        month: payroll.month,
        year: payroll.year,
      });
      setSelectedPayroll(payroll);
    } else {
      setFormData({
        employee: '',
        basicSalary: '',
        allowances: '',
        deductions: '',
        month: selectedMonth.getMonth() + 1,
        year: selectedMonth.getFullYear(),
      });
      setSelectedPayroll(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPayroll(null);
    setFormData({
      employee: '',
      basicSalary: '',
      allowances: '',
      deductions: '',
      month: '',
      year: '',
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
      if (selectedPayroll) {
        await api.put(`/payroll/${selectedPayroll._id}`, formData);
      } else {
        await api.post('/payroll', formData);
      }
      handleCloseDialog();
      fetchPayrolls();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save payroll');
    }
  };

  const handleGeneratePayroll = async () => {
    try {
      await api.post('/payroll/generate', {
        month: selectedMonth.getMonth() + 1,
        year: selectedMonth.getFullYear(),
      });
      fetchPayrolls();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate payroll');
    }
  };

  const handleDownloadPayslip = async (id) => {
    try {
      const response = await api.get(`/payroll/${id}/payslip`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'payslip.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download payslip');
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

  const totalPayroll = payrolls.reduce(
    (sum, payroll) =>
      sum + (payroll.basicSalary + payroll.allowances - payroll.deductions),
    0
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Payroll Management
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Payroll
              </Typography>
              <Typography variant="h4">${totalPayroll.toLocaleString()}</Typography>
              <Typography variant="subtitle2" color="textSecondary">
                For {months[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <TextField
          type="month"
          label="Select Month"
          value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
          onChange={(e) => {
            const [year, month] = e.target.value.split('-');
            setSelectedMonth(new Date(year, parseInt(month) - 1));
          }}
          InputLabelProps={{ shrink: true }}
        />
        <Box>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGeneratePayroll}
            sx={{ mr: 2 }}
          >
            Generate Payroll
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => handleOpenDialog()}
          >
            Add Manual Entry
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Basic Salary</TableCell>
              <TableCell>Allowances</TableCell>
              <TableCell>Deductions</TableCell>
              <TableCell>Net Salary</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payrolls.map((payroll) => (
              <TableRow key={payroll._id}>
                <TableCell>
                  {payroll.employee.firstName} {payroll.employee.lastName}
                </TableCell>
                <TableCell>${payroll.basicSalary.toLocaleString()}</TableCell>
                <TableCell>${payroll.allowances.toLocaleString()}</TableCell>
                <TableCell>${payroll.deductions.toLocaleString()}</TableCell>
                <TableCell>
                  $
                  {(
                    payroll.basicSalary +
                    payroll.allowances -
                    payroll.deductions
                  ).toLocaleString()}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => handleOpenDialog(payroll)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDownloadPayslip(payroll._id)}
                    color="secondary"
                  >
                    <DownloadIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedPayroll ? 'Edit Payroll Entry' : 'Add Payroll Entry'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <TextField
              name="employee"
              label="Employee"
              select
              value={formData.employee}
              onChange={handleInputChange}
              fullWidth
            >
              {employees.map((employee) => (
                <MenuItem key={employee._id} value={employee._id}>
                  {employee.firstName} {employee.lastName}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              name="basicSalary"
              label="Basic Salary"
              type="number"
              value={formData.basicSalary}
              onChange={handleInputChange}
              fullWidth
              InputProps={{
                startAdornment: '$',
              }}
            />
            <TextField
              name="allowances"
              label="Allowances"
              type="number"
              value={formData.allowances}
              onChange={handleInputChange}
              fullWidth
              InputProps={{
                startAdornment: '$',
              }}
            />
            <TextField
              name="deductions"
              label="Deductions"
              type="number"
              value={formData.deductions}
              onChange={handleInputChange}
              fullWidth
              InputProps={{
                startAdornment: '$',
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedPayroll ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Payroll; 