import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';

const drawerWidth = 240;

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const menuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/employees', name: 'Employees', icon: <PeopleIcon />, adminOnly: true },
    { path: '/projects', name: 'Projects', icon: <AssignmentIcon /> },
    { path: '/leaves', name: 'Leaves', icon: <EventNoteIcon /> },
    { path: '/attendance', name: 'Attendance', icon: <AccessTimeIcon /> },
    { path: '/payroll', name: 'Payroll', icon: <AttachMoneyIcon />, adminOnly: true },
    { path: '/profile', name: 'Profile', icon: <PersonIcon /> },
    { path: '/settings', name: 'Settings', icon: <SettingsIcon />, adminOnly: true },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar />
      <Divider />
      <List>
        {menuItems.map((item) => {
          // Skip admin-only items for non-admin users
          if (item.adminOnly && user?.role !== 'admin') {
            return null;
          }

          return (
            <ListItem
              button
              key={item.path}
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
};

export default Sidebar; 