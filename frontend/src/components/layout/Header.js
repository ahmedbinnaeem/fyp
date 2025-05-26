import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Layout, Button, Avatar, Dropdown, Space, Typography, message } from 'antd';
import { 
  UserOutlined, 
  LogoutOutlined, 
  SettingOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { logout } from '../../store/slices/authSlice';
import { clockIn, clockOut, fetchClockInStatus } from '../../store/slices/attendanceSlice';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

const Header = ({ collapsed, toggle, icon }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { clockInStatus = { isClockedIn: false, isLoading: false } } = useSelector((state) => state.attendance || {});

  useEffect(() => {
    if (user?.role === 'employee') {
      dispatch(fetchClockInStatus());
    }
  }, [dispatch, user]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleClockInOut = async () => {
    try {
      if (clockInStatus.isClockedIn) {
        await dispatch(clockOut()).unwrap();
        message.success('Successfully clocked out!');
      } else {
        await dispatch(clockIn()).unwrap();
        message.success('Successfully clocked in!');
      }
    } catch (error) {
      message.error(error || 'Failed to process attendance');
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />,
      onClick: () => navigate('/profile'),
    },
    user.role === 'admin' && {
      key: 'settings',
      label: 'Settings',
      icon: <SettingOutlined />,
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  return (
    <AntHeader
      style={{
        padding: 0,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      <Button
        type="text"
        icon={icon}
        onClick={toggle}
        style={{
          fontSize: '16px',
          width: 64,
          height: 64,
        }}
      />
      
      <div style={{ marginRight: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        {user?.role === 'employee' && (
          <Button
            type={clockInStatus.isClockedIn ? 'default' : 'primary'}
            icon={clockInStatus.isClockedIn ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
            onClick={handleClockInOut}
            loading={clockInStatus.isLoading}
          >
            {clockInStatus.isClockedIn && !clockInStatus.isClockedOut ? 'Clock Out' : 'Clock In'}
          </Button>
        )}
        <Dropdown
          menu={{ items: userMenuItems }}
          placement="bottomRight"
          arrow
        >
          <Space style={{ cursor: 'pointer' }}>
            <Avatar
              style={{
                backgroundColor: '#1890ff',
                verticalAlign: 'middle',
              }}
            >
              {getInitials(user?.firstName, user?.lastName)}
            </Avatar>
            <Text strong>
              {user?.firstName} {user?.lastName}
            </Text>
          </Space>
        </Dropdown>
      </div>
    </AntHeader>
  );
};

export default Header; 