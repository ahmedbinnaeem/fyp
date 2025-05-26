import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Layout, Menu, Typography, Tooltip } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  ProjectOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

const Sidebar = ({ collapsed }) => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const adminMenuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      path: '/dashboard',
    },
    {
      key: 'employees',
      icon: <TeamOutlined />,
      label: 'Employees',
      path: '/employees',
    },
    {
      key: 'projects',
      icon: <ProjectOutlined />,
      label: 'Projects',
      path: '/projects',
    },
    {
      key: 'leaves',
      icon: <CalendarOutlined />,
      label: 'Leaves',
      path: '/leaves',
    },
    {
      key: 'attendance',
      icon: <ClockCircleOutlined />,
      label: 'Attendance',
      path: '/attendance',
    },
    {
      key: 'payroll',
      icon: <DollarOutlined />,
      label: 'Payroll',
      path: '/payroll',
    },
    // {
    //   key: 'settings',
    //   icon: <SettingOutlined />,
    //   label: 'Settings',
    //   path: '/settings',
    // },
  ];

  const employeeMenuItems = [
    {
      key: 'attendance',
      icon: <ClockCircleOutlined />,
      label: 'Attendance',
      path: '/attendance',
    },
    {
      key: 'projects',
      icon: <ProjectOutlined />,
      label: 'Projects',
      path: '/projects',
    },
    {
      key: 'leaves',
      icon: <CalendarOutlined />,
      label: 'Leaves',
      path: '/leaves',
    },
  ];

  const menuItems = user?.role === 'admin' ? adminMenuItems : employeeMenuItems;

  const renderMenuItem = (item) => {
    const content = (
      <Menu.Item key={item.key} icon={item.icon}>
        <Link to={item.path}>{item.label}</Link>
      </Menu.Item>
    );

    return collapsed ? (
      <Tooltip placement="right" title={item.label} key={item.key}>
        {content}
      </Tooltip>
    ) : (
      content
    );
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
      }}
    >
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
          {collapsed ? 'TP' : 'TeamPulse'}
        </Typography.Title>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname.split('/')[1] || 'dashboard']}
      >
        {menuItems.map(renderMenuItem)}
        {/* <Menu.Item key="profile" icon={<UserOutlined />}>
          <Link to="/profile">Profile</Link>
        </Menu.Item> */}
      </Menu>
    </Sider>
  );
};

export default Sidebar; 