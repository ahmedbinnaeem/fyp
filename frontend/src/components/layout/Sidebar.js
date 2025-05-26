import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as ProjectsIcon,
  EventNote as LeavesIcon,
  AccessTime as AttendanceIcon,
  AttachMoney as PayrollIcon,
  Settings as SettingsIcon,
  Person as ProfileIcon,
} from '@mui/icons-material';

const Sidebar = ({ open, onClose, width = 240 }) => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const adminMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Employees', icon: <PeopleIcon />, path: '/employees' },
    { text: 'Projects', icon: <ProjectsIcon />, path: '/projects' },
    { text: 'Leaves', icon: <LeavesIcon />, path: '/leaves' },
    { text: 'Attendance', icon: <AttendanceIcon />, path: '/attendance' },
    { text: 'Payroll', icon: <PayrollIcon />, path: '/payroll' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const employeeMenuItems = [
    { text: 'Attendance', icon: <AttendanceIcon />, path: '/attendance' },
    { text: 'Projects', icon: <ProjectsIcon />, path: '/projects' },
    { text: 'Leaves', icon: <LeavesIcon />, path: '/leaves' },
  ];

  const menuItems = user?.role === 'admin' ? adminMenuItems : employeeMenuItems;

  return (
    <Drawer
      variant="permanent"
      open={open}
      onClose={onClose}
      sx={{
        width: width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: width,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ overflow: 'auto' }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" component="div">
            HRMS
          </Typography>
        </Box>
      <Divider />
      <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'white' : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
          {/* Profile menu item always visible at the bottom */}
          <Divider sx={{ my: 2 }} />
          <ListItem
            button
            component={Link}
            to="/profile"
            selected={location.pathname === '/profile'}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: location.pathname === '/profile' ? 'white' : 'inherit',
              }}
            >
              <ProfileIcon />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </ListItem>
      </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar; 