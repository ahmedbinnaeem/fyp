import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Spin,
  Alert,
  Table,
  Tag,
  Statistic,
  Progress,
  Space,
  List,
  Avatar,
} from 'antd';
import {
  TeamOutlined,
  ProjectOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  PauseCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import api from '../utils/axios';

const { Title, Text } = Typography;

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
    return <Alert message="Please log in to view the dashboard" type="error" showIcon />;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert message={error} type="error" showIcon />;
  }

  if (!dashboardData) {
    return <Alert message="No dashboard data available" type="warning" showIcon />;
  }

  return user.role === 'admin' ? (
    <AdminDashboard data={dashboardData} />
  ) : (
    <EmployeeDashboard data={dashboardData} />
  );
};

const AdminDashboard = ({ data }) => {
  if (!data || !data.stats || !data.recentProjects || !data.recentActivities) {
    return <Alert message="Incomplete dashboard data" type="warning" showIcon />;
  }

  const { stats, recentProjects, recentActivities } = data;

  const getStatusTag = (status) => {
    const statusConfig = {
      'Completed': { color: 'success', icon: <CheckCircleOutlined /> },
      'In Progress': { color: 'processing', icon: <ClockCircleOutlined /> },
      'On Hold': { color: 'warning', icon: <PauseCircleOutlined /> },
      'Not Started': { color: 'default', icon: <StopOutlined /> },
    };

    const config = statusConfig[status] || { color: 'default', icon: null };
    return (
      <Tag color={config.color} icon={config.icon}>
        {status.toUpperCase()}
      </Tag>
    );
  }

  // Ensure all required stats exist
  const defaultStats = {
    totalEmployees: 0,
    activeProjects: 0,
    pendingLeaves: 0,
    todayAttendance: 0,
    monthlyPayroll: 0,
  };

  const safeStats = { ...defaultStats, ...stats };

  const projectColumns = [
    {
      title: 'Project Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => text || 'Untitled Project',
    },
    {
      title: 'Team Lead',
      dataIndex: 'teamLead',
      key: 'teamLead',
      render: (teamLead) => 
        teamLead ? `${teamLead.firstName} ${teamLead.lastName}` : 'Not Assigned',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Admin Dashboard</Title>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} md={8} lg={4.8}>
          <Card>
            <Statistic
              title="Total Employees"
              value={safeStats.totalEmployees}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4.8}>
          <Card>
            <Statistic
              title="Active Projects"
              value={safeStats.activeProjects}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4.8}>
          <Card>
            <Statistic
              title="Pending Leaves"
              value={safeStats.pendingLeaves}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4.8}>
          <Card>
            <Statistic
              title="Today's Attendance"
              value={safeStats.todayAttendance}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4.8}>
          <Card>
            <Statistic
              title="Monthly Payroll"
              value={safeStats.monthlyPayroll}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Recent Projects">
            <Table
              columns={projectColumns}
              dataSource={recentProjects || []}
              rowKey={(record) => record._id || 'temp-key'}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Recent Activities">
            <List
              size="small"
              dataSource={recentActivities.leaves || []}
              renderItem={(activity) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar style={{ backgroundColor: activity.status === 'approved' ? '#52c41a' : '#f5222d' }}>
                        {activity.status === 'approved' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                      </Avatar>
                    }
                    title={`${activity.user.firstName} ${activity.user.lastName}`}
                    description={`Leave request ${activity.status} for ${activity.startDate} to ${activity.endDate}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const EmployeeDashboard = ({ data }) => {
  if (!data || !data.stats) {
    return <Alert message="Incomplete dashboard data" type="warning" showIcon />;
  }

  const { stats, currentProjects = [], latestPayslip = null, recentActivities = { leaves: [] } } = data;

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>My Dashboard</Title>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Projects"
              value={stats.activeProjects || 0}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Leaves"
              value={stats.pendingLeaves || 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Leave Balance"
              value={stats.leaveBalance ? stats.leaveBalance.remaining : 0}
              suffix={`/ ${stats.leaveBalance ? stats.leaveBalance.total : 0}`}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Monthly Attendance"
              value={stats.attendance ? stats.attendance.present : 0}
              suffix={`/ ${stats.attendance ? stats.attendance.total : 0}`}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Current Projects">
            <List
              size="small"
              dataSource={currentProjects}
              renderItem={(project) => (
                <List.Item
                  extra={
                    <Tag color={
                      project.status === 'completed' ? 'success' :
                      project.status === 'in_progress' ? 'processing' :
                      project.status === 'on_hold' ? 'warning' :
                      'default'
                    }>
                      {project.status ? project.status.replace('_', ' ').toUpperCase() : 'NOT SET'}
                    </Tag>
                  }
                >
                  <List.Item.Meta
                    title={project.name}
                    description={`Team Lead: ${project.teamLead ? `${project.teamLead.firstName} ${project.teamLead.lastName}` : 'Not Assigned'}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Attendance Summary">
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Present"
                  value={stats.attendance?.present || 0}
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Late"
                  value={stats.attendance?.late || 0}
                  prefix={<WarningOutlined style={{ color: '#faad14' }} />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Absent"
                  value={stats.attendance?.absent || 0}
                  prefix={<CloseCircleOutlined style={{ color: '#f5222d' }} />}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 