import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  CalculatorOutlined,
  BarChartOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;
const { SubMenu } = Menu;

const Sidebar = ({ collapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
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
    {
      key: 'performance',
      icon: <BarChartOutlined />,
      label: 'Performance',
      path: '/performance'
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
      key: 'performance',
      icon: <BarChartOutlined />,
      label: 'Performance',
      path: '/performance'
    },
    {
      key: 'leaves',
      icon: <CalendarOutlined />,
      label: 'Leaves',
      path: '/leaves',
      children: [
        {
          key: 'leave-balance',
          icon: <CalculatorOutlined />,
          label: 'Leave Balance',
          path: '/leave-balance',
        },
      ],
    },
    {
      key: 'my-payroll',
      icon: <DollarOutlined />,
      label: 'Payroll',
      path: '/my-payroll',
    },
  ];

  const menuItems = user?.role === 'admin' ? adminMenuItems : employeeMenuItems;

  const renderMenuItem = (item) => {
    if (item.children) {
      const subMenuTitle = (
        <div 
          className="ant-menu-submenu-title-content" 
          style={{ display: 'inline-block', width: '100%' }}
          onClick={(e) => {
            const isArrowClick = e.target.closest('.ant-menu-submenu-arrow');
            if (!isArrowClick) {
              navigate(item.path);
            }
          }}
        >
          {item.icon}
          <span>{item.label}</span>
        </div>
      );

      return (
        <SubMenu 
          key={item.key} 
          title={collapsed ? <Tooltip title={item.label}>{item.icon}</Tooltip> : subMenuTitle}
          onTitleClick={(e) => {
            const isArrowClick = e.domEvent.target.closest('.ant-menu-submenu-arrow');
            if (!isArrowClick) {
              e.domEvent.stopPropagation();
            }
          }}
        >
          {item.children.map(child => (
            <Menu.Item key={child.key}>
              <Link to={child.path}>
                {child.icon && child.icon}
                <span>{child.label}</span>
              </Link>
            </Menu.Item>
          ))}
        </SubMenu>
      );
    }

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
        defaultOpenKeys={['leaves']}
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