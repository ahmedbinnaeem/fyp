import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  MenuItem,
  FormGroup,
  Divider,
} from '@mui/material';
import api from '../utils/axios';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [settings, setSettings] = useState({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
    workingDays: [],
    workingHours: {
      start: '',
      end: '',
    },
    leaveSettings: {
      annualLeaveQuota: '',
      sickLeaveQuota: '',
      carryForwardLimit: '',
    },
    payrollSettings: {
      payrollCycle: 'monthly',
      payDay: '',
      taxRate: '',
      overtimeRate: '',
    },
    emailNotifications: {
      leaveRequests: true,
      payrollGeneration: true,
      attendanceAlerts: true,
    },
  });

  const workingDaysOptions = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  const payrollCycleOptions = ['weekly', 'biweekly', 'monthly'];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings');
      setSettings(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
    setSuccess(null);
  };

  const handleNestedInputChange = (section, field) => (e) => {
    const { value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    setError(null);
    setSuccess(null);
  };

  const handleNotificationToggle = (field) => (e) => {
    setSettings((prev) => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        [field]: e.target.checked,
      },
    }));
  };

  const handleWorkingDaysChange = (day) => (e) => {
    const { checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      workingDays: checked
        ? [...prev.workingDays, day]
        : prev.workingDays.filter((d) => d !== day),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await api.put('/settings', settings);
      setSuccess('Settings updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !settings.companyName) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        System Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Company Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Company Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      name="companyName"
                      label="Company Name"
                      value={settings.companyName}
                      onChange={handleInputChange}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="companyEmail"
                      label="Company Email"
                      value={settings.companyEmail}
                      onChange={handleInputChange}
                      fullWidth
                      type="email"
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="companyPhone"
                      label="Company Phone"
                      value={settings.companyPhone}
                      onChange={handleInputChange}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="companyAddress"
                      label="Company Address"
                      value={settings.companyAddress}
                      onChange={handleInputChange}
                      fullWidth
                      multiline
                      rows={3}
                      required
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Working Hours & Days */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Working Hours & Days
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Start Time"
                      type="time"
                      value={settings.workingHours.start}
                      onChange={handleNestedInputChange('workingHours', 'start')}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ step: 300 }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="End Time"
                      type="time"
                      value={settings.workingHours.end}
                      onChange={handleNestedInputChange('workingHours', 'end')}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ step: 300 }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Working Days
                    </Typography>
                    <FormGroup row>
                      {workingDaysOptions.map((day) => (
                        <FormControlLabel
                          key={day}
                          control={
                            <Switch
                              checked={settings.workingDays.includes(day)}
                              onChange={handleWorkingDaysChange(day)}
                              color="primary"
                            />
                          }
                          label={day}
                        />
                      ))}
                    </FormGroup>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Leave Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Leave Settings
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Annual Leave Quota"
                      type="number"
                      value={settings.leaveSettings.annualLeaveQuota}
                      onChange={handleNestedInputChange('leaveSettings', 'annualLeaveQuota')}
                      fullWidth
                      required
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Sick Leave Quota"
                      type="number"
                      value={settings.leaveSettings.sickLeaveQuota}
                      onChange={handleNestedInputChange('leaveSettings', 'sickLeaveQuota')}
                      fullWidth
                      required
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Carry Forward Limit"
                      type="number"
                      value={settings.leaveSettings.carryForwardLimit}
                      onChange={handleNestedInputChange('leaveSettings', 'carryForwardLimit')}
                      fullWidth
                      required
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Payroll Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payroll Settings
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      select
                      label="Payroll Cycle"
                      value={settings.payrollSettings.payrollCycle}
                      onChange={handleNestedInputChange('payrollSettings', 'payrollCycle')}
                      fullWidth
                      required
                    >
                      {payrollCycleOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Pay Day"
                      type="number"
                      value={settings.payrollSettings.payDay}
                      onChange={handleNestedInputChange('payrollSettings', 'payDay')}
                      fullWidth
                      required
                      InputProps={{ inputProps: { min: 1, max: 31 } }}
                      helperText="Day of month for salary payment"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Tax Rate (%)"
                      type="number"
                      value={settings.payrollSettings.taxRate}
                      onChange={handleNestedInputChange('payrollSettings', 'taxRate')}
                      fullWidth
                      required
                      InputProps={{ inputProps: { min: 0, max: 100 } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Overtime Rate"
                      type="number"
                      value={settings.payrollSettings.overtimeRate}
                      onChange={handleNestedInputChange('payrollSettings', 'overtimeRate')}
                      fullWidth
                      required
                      InputProps={{ inputProps: { min: 1, step: 0.1 } }}
                      helperText="Multiplier for overtime hours (e.g., 1.5 for time and a half)"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Email Notifications */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Email Notifications
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.emailNotifications.leaveRequests}
                            onChange={handleNotificationToggle('leaveRequests')}
                            color="primary"
                          />
                        }
                        label="Leave Requests"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.emailNotifications.payrollGeneration}
                            onChange={handleNotificationToggle('payrollGeneration')}
                            color="primary"
                          />
                        }
                        label="Payroll Generation"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.emailNotifications.attendanceAlerts}
                            onChange={handleNotificationToggle('attendanceAlerts')}
                            color="primary"
                          />
                        }
                        label="Attendance Alerts"
                      />
                    </FormGroup>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box mt={3} display="flex" justifyContent="flex-end">
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ minWidth: 200 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Settings'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Settings; 