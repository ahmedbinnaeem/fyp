import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Typography,
  Spin,
  Alert,
  Row,
  Col,
  Statistic,
  Progress,
  Space,
  Tag,
  Input,
} from 'antd';
import { useSelector } from 'react-redux';
import api from '../utils/axios';
import { CalendarOutlined, MedicineBoxOutlined, UserOutlined, HeartOutlined, TeamOutlined, DollarOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Search } = Input;

const LeaveBalance = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [balanceData, setBalanceData] = useState(null);
  const [allBalances, setAllBalances] = useState([]);
  const [filteredBalances, setFilteredBalances] = useState([]);
  const { user } = useSelector((state) => state.auth);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch personal balance
      const myBalanceResponse = await api.get('/leave-balances/my-balance');
      setBalanceData(myBalanceResponse.data);

      // If admin, fetch all balances
      if (user.role === 'admin') {
        const allBalancesResponse = await api.get('/leave-balances');
        setAllBalances(allBalancesResponse.data);
        setFilteredBalances(allBalancesResponse.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch leave balances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [user.role]);

  const handleSearch = (value) => {
    const searchTerm = value.toLowerCase();
    const filtered = allBalances.filter(balance => {
      const fullName = `${balance.user.firstName} ${balance.user.lastName}`.toLowerCase();
      return fullName.includes(searchTerm);
    });
    setFilteredBalances(filtered);
  };

  const columns = [
    {
      title: 'Employee',
      dataIndex: ['user', 'firstName'],
      key: 'name',
      render: (_, record) => `${record.user.firstName} ${record.user.lastName}`,
    },
    {
      title: 'Department',
      dataIndex: ['user', 'department'],
      key: 'department',
    },
    {
      title: 'Annual Leave',
      children: [
        {
          title: 'Total',
          dataIndex: ['annualLeave', 'total'],
          key: 'annualTotal',
        },
        {
          title: 'Used',
          dataIndex: ['annualLeave', 'used'],
          key: 'annualUsed',
        },
        {
          title: 'Pending',
          dataIndex: ['annualLeave', 'pending'],
          key: 'annualPending',
          render: (pending) => (
            pending > 0 ? <Tag color="orange">{pending}</Tag> : pending
          ),
        },
        {
          title: 'Remaining',
          dataIndex: ['annualLeave', 'remaining'],
          key: 'annualRemaining',
          render: (remaining) => (
            <Tag color={remaining > 0 ? 'green' : 'red'}>
              {remaining}
            </Tag>
          ),
        },
      ],
    },
    {
      title: 'Sick Leave',
      children: [
        {
          title: 'Total',
          dataIndex: ['sickLeave', 'total'],
          key: 'sickTotal',
        },
        {
          title: 'Used',
          dataIndex: ['sickLeave', 'used'],
          key: 'sickUsed',
        },
        {
          title: 'Pending',
          dataIndex: ['sickLeave', 'pending'],
          key: 'sickPending',
          render: (pending) => (
            pending > 0 ? <Tag color="orange">{pending}</Tag> : pending
          ),
        },
        {
          title: 'Remaining',
          dataIndex: ['sickLeave', 'remaining'],
          key: 'sickRemaining',
          render: (remaining) => (
            <Tag color={remaining > 0 ? 'green' : 'red'}>
              {remaining}
            </Tag>
          ),
        },
      ],
    },
  ];

  const renderLeaveCard = (title, data) => {
    if (!data) return null;
    
    // Get appropriate icon based on leave type
    const getLeaveIcon = (leaveType) => {
      const icons = {
        'Annual Leave': <CalendarOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
        'Sick Leave': <MedicineBoxOutlined style={{ fontSize: '24px', color: '#f5222d' }} />,
        'Personal Leave': <UserOutlined style={{ fontSize: '24px', color: '#722ed1' }} />,
        'Maternity Leave': <HeartOutlined style={{ fontSize: '24px', color: '#eb2f96' }} />,
        'Paternity Leave': <TeamOutlined style={{ fontSize: '24px', color: '#73d13d' }} />,
        'Unpaid Leave': <DollarOutlined style={{ fontSize: '24px', color: '#faad14' }} />,
      };
      return icons[leaveType] || <CalendarOutlined style={{ fontSize: '24px', color: '#1890ff' }} />;
    };

    // Calculate percentage for progress
    const usedPercentage = Math.round((data.used / data.total) * 100);
    const remainingPercentage = 100 - usedPercentage;

    return (
      <Col xs={24} sm={12} lg={8}>
        <Card
          hoverable
          style={{
            height: '100%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
            borderRadius: '8px',
            transition: 'all 0.3s',
          }}
          bodyStyle={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {getLeaveIcon(title)}
            <div style={{ flex: 1 }}>
              <Typography.Text type="secondary" style={{ fontSize: '14px', display: 'block' }}>
                {title}
              </Typography.Text>
              <Typography.Title level={3} style={{ margin: '0' }}>
                {data.remaining} <Typography.Text type="secondary" style={{ fontSize: '16px', fontWeight: 'normal' }}>/ {data.total}</Typography.Text>
              </Typography.Title>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <Typography.Text type="secondary">Used</Typography.Text>
              <Typography.Text>{usedPercentage}%</Typography.Text>
            </div>
            <Progress
              percent={usedPercentage}
              success={{ percent: remainingPercentage }}
              showInfo={false}
              strokeColor={{
                '0%': '#1890ff',
                '100%': '#f0f0f0'
              }}
              trailColor="#f5f5f5"
              strokeWidth={10}
              style={{ margin: '8px 0' }}
            />
          </div>

          {data.pending > 0 && (
            <Tag
              color="orange"
              style={{
                alignSelf: 'flex-start',
                padding: '4px 8px',
                borderRadius: '4px',
                marginTop: 'auto'
              }}
            >
              {data.pending} days pending
            </Tag>
          )}
        </Card>
      </Col>
    );
  };

  const getLeaveTypes = () => {
    if (!balanceData) return [];

    const commonLeaveTypes = [
      { title: "Annual Leave", key: "annualLeave" },
      { title: "Sick Leave", key: "sickLeave" },
      { title: "Personal Leave", key: "personalLeave" },
      { title: "Unpaid Leave", key: "unpaidLeave" },
    ];

    // Add gender-specific leave types
    if (user.gender === 'Female') {
      commonLeaveTypes.push({ title: "Maternity Leave", key: "maternityLeave" });
    } else if (user.gender === 'Male') {
      commonLeaveTypes.push({ title: "Paternity Leave", key: "paternityLeave" });
    }

    return commonLeaveTypes.filter(type => balanceData[type.key]);
  };

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

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={2}>Leave Balance</Title>

        {balanceData && (
          <Row gutter={[24, 24]}>
            {getLeaveTypes().map(type => 
              renderLeaveCard(type.title, balanceData[type.key])
            )}
            {balanceData.carryForward > 0 && (
              <Col xs={24} sm={12} lg={8}>
                <Card>
                  <Statistic
                    title="Carried Forward"
                    value={balanceData.carryForward}
                  />
                </Card>
              </Col>
            )}
          </Row>
        )}

        {user.role === 'admin' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Search
                placeholder="Search by employee name"
                onSearch={handleSearch}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ width: 300 }}
              />
            </div>
            <Card title="All Employees Leave Balances">
              <Table
                columns={columns}
                dataSource={filteredBalances}
                rowKey="_id"
                scroll={{ x: true }}
                bordered
              />
            </Card>
          </>
        )}
      </Space>
    </div>
  );
};

export default LeaveBalance; 