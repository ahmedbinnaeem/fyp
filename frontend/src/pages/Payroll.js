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
  Divider,
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
    allowances: {
      housing: '',
      transport: '',
      meal: '',
      other: ''
    },
    deductions: {
      tax: '',
      insurance: '',
      other: ''
    },
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
        allowances: {
          housing: payroll.allowances.housing || '',
          transport: payroll.allowances.transport || '',
          meal: payroll.allowances.meal || '',
          other: payroll.allowances.other || ''
        },
        deductions: {
          tax: payroll.deductions.tax || '',
          insurance: payroll.deductions.insurance || '',
          other: payroll.deductions.other || ''
        },
        month: payroll.month,
        year: payroll.year,
      });
      setSelectedPayroll(payroll);
    } else {
      setFormData({
        employee: '',
        basicSalary: '',
        allowances: {
          housing: '',
          transport: '',
          meal: '',
          other: ''
        },
        deductions: {
          tax: '',
          insurance: '',
          other: ''
        },
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
      allowances: {
        housing: '',
        transport: '',
        meal: '',
        other: ''
      },
      deductions: {
        tax: '',
        insurance: '',
        other: ''
      },
      month: '',
      year: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [category, field] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [category]: {
          ...prev[category],
          [field]: value
        }
      }));
    } else {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        allowances: Object.entries(formData.allowances).reduce((acc, [key, value]) => {
          acc[key] = Number(value) || 0;
          return acc;
        }, {}),
        deductions: Object.entries(formData.deductions).reduce((acc, [key, value]) => {
          acc[key] = Number(value) || 0;
          return acc;
        }, {})
      };

      if (selectedPayroll) {
        await api.put(`/payroll/${selectedPayroll._id}`, payload);
      } else {
        await api.post('/payroll', payload);
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

  const calculateTotalAllowances = (allowances) => {
    return Object.values(allowances).reduce((sum, value) => sum + (Number(value) || 0), 0);
  };

  const calculateTotalDeductions = (deductions) => {
    return Object.values(deductions).reduce((sum, value) => sum + (Number(value) || 0), 0);
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
      sum + (payroll.basicSalary + calculateTotalAllowances(payroll.allowances) - calculateTotalDeductions(payroll.deductions)),
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
              <TableCell>Total Allowances</TableCell>
              <TableCell>Total Deductions</TableCell>
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
                <TableCell>${calculateTotalAllowances(payroll.allowances).toLocaleString()}</TableCell>
                <TableCell>${calculateTotalDeductions(payroll.deductions).toLocaleString()}</TableCell>
                <TableCell>
                  $
                  {(
                    payroll.basicSalary +
                    calculateTotalAllowances(payroll.allowances) -
                    calculateTotalDeductions(payroll.deductions)
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
            <Typography variant="subtitle1" color="primary" sx={{ mt: 2 }}>
              Allowances
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  name="allowances.housing"
                  label="Housing Allowance"
                  type="number"
                  value={formData.allowances.housing}
                  onChange={handleInputChange}
                  fullWidth
                  InputProps={{
                    startAdornment: '$',
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="allowances.transport"
                  label="Transport Allowance"
                  type="number"
                  value={formData.allowances.transport}
                  onChange={handleInputChange}
                  fullWidth
                  InputProps={{
                    startAdornment: '$',
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="allowances.meal"
                  label="Meal Allowance"
                  type="number"
                  value={formData.allowances.meal}
                  onChange={handleInputChange}
                  fullWidth
                  InputProps={{
                    startAdornment: '$',
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="allowances.other"
                  label="Other Allowances"
                  type="number"
                  value={formData.allowances.other}
                  onChange={handleInputChange}
                  fullWidth
                  InputProps={{
                    startAdornment: '$',
                  }}
                />
              </Grid>
            </Grid>
            <Typography variant="subtitle1" color="primary" sx={{ mt: 2 }}>
              Deductions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  name="deductions.tax"
                  label="Tax"
                  type="number"
                  value={formData.deductions.tax}
                  onChange={handleInputChange}
                  fullWidth
                  InputProps={{
                    startAdornment: '$',
                  }}
                />
              </Grid>
              <Grid item xs={6}>
            <TextField
                  name="deductions.insurance"
                  label="Insurance"
              type="number"
                  value={formData.deductions.insurance}
              onChange={handleInputChange}
              fullWidth
              InputProps={{
                startAdornment: '$',
              }}
            />
              </Grid>
              <Grid item xs={12}>
            <TextField
                  name="deductions.other"
                  label="Other Deductions"
              type="number"
                  value={formData.deductions.other}
              onChange={handleInputChange}
              fullWidth
              InputProps={{
                startAdornment: '$',
              }}
            />
              </Grid>
            </Grid>
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