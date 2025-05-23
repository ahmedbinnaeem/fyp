import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { useSelector } from 'react-redux';

const StatCard = ({ title, value, icon, color }) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            backgroundColor: `${color}20`,
            borderRadius: '50%',
            p: 1,
            mr: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {React.cloneElement(icon, { sx: { color } })}
        </Box>
        <Typography color="textSecondary" variant="body2">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div">
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const ProjectCard = ({ name, progress, team }) => (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        {name}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box sx={{ flexGrow: 1, mr: 1 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 8, borderRadius: 5 }}
          />
        </Box>
        <Typography variant="body2" color="textSecondary">
          {progress}%
        </Typography>
      </Box>
      <Typography variant="body2" color="textSecondary">
        Team: {team.join(', ')}
      </Typography>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);

  // Mock data - replace with actual API calls
  const stats = {
    totalEmployees: 45,
    activeProjects: 8,
    pendingLeaves: 5,
    monthlyPayroll: '$75,000',
  };

  const recentProjects = [
    {
      name: 'Website Redesign',
      progress: 75,
      team: ['John Doe', 'Jane Smith', 'Mike Johnson'],
    },
    {
      name: 'Mobile App Development',
      progress: 45,
      team: ['Sarah Wilson', 'Tom Brown'],
    },
    {
      name: 'Database Migration',
      progress: 90,
      team: ['Alex Turner', 'Emily Davis'],
    },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Welcome back, {user?.firstName}!
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Employees"
            value={stats.totalEmployees}
            icon={<PeopleIcon />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Projects"
            value={stats.activeProjects}
            icon={<AssignmentIcon />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Leaves"
            value={stats.pendingLeaves}
            icon={<EventNoteIcon />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Payroll"
            value={stats.monthlyPayroll}
            icon={<AttachMoneyIcon />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Projects
            </Typography>
            {recentProjects.map((project) => (
              <ProjectCard key={project.name} {...project} />
            ))}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recent Activities
            </Typography>
            {/* Add activity feed component here */}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 