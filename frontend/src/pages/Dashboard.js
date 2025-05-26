import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  EventNote as EventNoteIcon,
  AccessTime as AccessTimeIcon,
  AttachMoney as AttachMoneyIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import api from '../utils/axios';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/dashboard/stats');
        if (!response.data) {
          throw new Error('No data received from server');
        }
        setDashboardData(response.data);
      } catch (err) {
        console.error('Dashboard error:', err);
        setError(err.response?.data?.message || 'Failed to fetch dashboard data');
        setDashboardData(null);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (!user) {
    return (
      <Box m={2}>
        <Alert severity="error">Please log in to view the dashboard</Alert>
      </Box>
    );
  }

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

  if (!dashboardData) {
    return (
      <Box m={2}>
        <Alert severity="warning">No dashboard data available</Alert>
        </Box>
    );
  }

  return user.role === 'admin' ? (
    <AdminDashboard data={dashboardData} />
  ) : (
    <EmployeeDashboard data={dashboardData} />
  );
};

const AdminDashboard = ({ data }) => {
  if (!data || !data.stats || !data.recentProjects || !data.recentActivities) {
    return (
      <Box m={2}>
        <Alert severity="warning">Incomplete dashboard data</Alert>
      </Box>
    );
  }

  const { stats, recentProjects, recentActivities } = data;

  // Ensure all required stats exist
  const defaultStats = {
    totalEmployees: 0,
    activeProjects: 0,
    pendingLeaves: 0,
    todayAttendance: 0,
    monthlyPayroll: 0,
  };

  const safeStats = { ...defaultStats, ...stats };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <StatsCard
            icon={<PeopleIcon fontSize="large" color="primary" />}
            title="Total Employees"
            value={safeStats.totalEmployees}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <StatsCard
            icon={<AssignmentIcon fontSize="large" color="primary" />}
            title="Active Projects"
            value={safeStats.activeProjects}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <StatsCard
            icon={<EventNoteIcon fontSize="large" color="warning" />}
            title="Pending Leaves"
            value={safeStats.pendingLeaves}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <StatsCard
            icon={<AccessTimeIcon fontSize="large" color="info" />}
            title="Today's Attendance"
            value={safeStats.todayAttendance}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <StatsCard
            icon={<AttachMoneyIcon fontSize="large" color="success" />}
            title="Monthly Payroll"
            value={`$${safeStats.monthlyPayroll.toLocaleString()}`}
          />
        </Grid>

        {/* Recent Projects */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Projects
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Project Name</TableCell>
                    <TableCell>Team Lead</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(recentProjects || []).map((project) => (
                    <TableRow key={project._id || 'temp-key'}>
                      <TableCell>{project.name || 'Untitled Project'}</TableCell>
                      <TableCell>
                        {project.teamLead ? 
                          `${project.teamLead.firstName} ${project.teamLead.lastName}` :
                          'Not Assigned'
                        }
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={project.status || 'Not Set'}
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activities
            </Typography>
            <List>
              {/* Leaves Activities */}
              {recentActivities?.leaves?.map((leave, index) => (
                <React.Fragment key={leave._id || `leave-${index}`}>
                  <ListItem>
                    <ListItemText
                      primary={`${leave.user.firstName} ${leave.user.lastName} - ${leave.leaveType} Leave`}
                      secondary={`Status: ${leave.status} | Duration: ${leave.duration} days (${new Date(leave.startDate).toLocaleDateString()} - ${new Date(leave.endDate).toLocaleDateString()})`}
                    />
                  </ListItem>
                  {index < (recentActivities.leaves.length - 1) && <Divider />}
                </React.Fragment>
              ))}

              {/* Attendance Activities */}
              {recentActivities?.attendance?.map((attendance, index) => (
                <React.Fragment key={attendance._id || `attendance-${index}`}>
                  {recentActivities.leaves?.length > 0 && <Divider />}
                  <ListItem>
                    <ListItemText
                      primary={`${attendance.user.firstName} ${attendance.user.lastName} - Attendance`}
                      secondary={`Status: ${attendance.status} | Check-in: ${new Date(attendance.checkIn.time).toLocaleTimeString()} | Check-out: ${attendance.checkOut ? new Date(attendance.checkOut.time).toLocaleTimeString() : 'Not checked out'}`}
                    />
                  </ListItem>
                  {index < (recentActivities.attendance.length - 1) && <Divider />}
                </React.Fragment>
              ))}

              {(!recentActivities?.leaves?.length && !recentActivities?.attendance?.length) && (
                <ListItem>
                  <ListItemText primary="No recent activities" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

const EmployeeDashboard = ({ data }) => {
  if (!data || !data.stats) {
    return (
      <Box m={2}>
        <Alert severity="warning">Incomplete dashboard data</Alert>
      </Box>
    );
  }

  const { stats, currentProjects = [], latestPayslip = null, recentActivities = { leaves: [] } } = data;

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        My Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            icon={<AssignmentIcon fontSize="large" color="primary" />}
            title="Active Projects"
            value={stats.activeProjects || 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            icon={<EventNoteIcon fontSize="large" color="warning" />}
            title="Pending Leaves"
            value={stats.pendingLeaves || 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            icon={<CheckCircleIcon fontSize="large" color="success" />}
            title="Leave Balance"
            value={stats.leaveBalance ? 
              `${stats.leaveBalance.remaining || 0}/${stats.leaveBalance.total || 0} days` : 
              '0/0 days'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            icon={<AccessTimeIcon fontSize="large" color="info" />}
            title="Monthly Attendance"
            value={stats.attendance ? 
              `${stats.attendance.present || 0}/${stats.attendance.total || 0} days` :
              '0/0 days'}
          />
      </Grid>

        {/* Current Projects */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Current Projects
            </Typography>
            {currentProjects && currentProjects.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Project Name</TableCell>
                      <TableCell>Team Lead</TableCell>
                      <TableCell>Progress</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentProjects.map((project) => (
                      <TableRow key={project._id}>
                        <TableCell>{project.name}</TableCell>
                        <TableCell>
                          {project.teamLead ? 
                            `${project.teamLead.firstName} ${project.teamLead.lastName}` :
                            'Not Assigned'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={project.progress || 0}
                                color={
                                  project.progress >= 75
                                    ? 'success'
                                    : project.progress >= 50
                                    ? 'primary'
                                    : project.progress >= 25
                                    ? 'warning'
                                    : 'error'
                                }
                              />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                              <Typography variant="body2" color="text.secondary">
                                {`${project.progress || 0}%`}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary">No active projects</Typography>
            )}
          </Paper>
        </Grid>

        {/* Latest Payslip */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Latest Payslip
            </Typography>
            {latestPayslip ? (
              <List>
                <ListItem>
                  <ListItemText
                    primary="Basic Salary"
                    secondary={`$${(latestPayslip.basicSalary || 0).toLocaleString()}`}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Total Allowances"
                    secondary={`$${Object.values(latestPayslip.allowances || {})
                      .reduce((a, b) => a + b, 0)
                      .toLocaleString()}`}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Total Deductions"
                    secondary={`$${Object.values(latestPayslip.deductions || {})
                      .reduce((a, b) => a + b, 0)
                      .toLocaleString()}`}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Net Salary"
                    secondary={`$${(latestPayslip.netSalary || 0).toLocaleString()}`}
                  />
                </ListItem>
              </List>
            ) : (
              <Typography color="text.secondary">No payslip available</Typography>
            )}
          </Paper>
        </Grid>

        {/* Attendance Summary */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Monthly Attendance Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                  <Typography variant="h6">{stats.attendance?.present || 0}</Typography>
                  <Typography color="text.secondary">Present</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <WarningIcon color="warning" sx={{ fontSize: 40 }} />
                  <Typography variant="h6">{stats.attendance?.late || 0}</Typography>
                  <Typography color="text.secondary">Late</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <CancelIcon color="error" sx={{ fontSize: 40 }} />
                  <Typography variant="h6">{stats.attendance?.absent || 0}</Typography>
                  <Typography color="text.secondary">Absent</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activities
            </Typography>
            {recentActivities.leaves && recentActivities.leaves.length > 0 ? (
              <List>
                {recentActivities.leaves.map((leave) => (
                  <React.Fragment key={leave._id}>
                    <ListItem>
                      <ListItemText
                        primary={`${leave.leaveType} Leave`}
                        secondary={`Status: ${leave.status} | Duration: ${leave.duration} days`}
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary">No recent activities</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

const StatsCard = ({ icon, title, value }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" mb={1}>
        {icon}
      </Box>
      <Typography color="textSecondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h5" component="div">
        {value}
      </Typography>
    </CardContent>
  </Card>
);

export default Dashboard; 