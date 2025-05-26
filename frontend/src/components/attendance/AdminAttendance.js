import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Table,
  Typography,
  DatePicker,
  Space,
  Tag,
  Spin,
  Alert,
  Empty,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import axios from '../../utils/axios';
import dayjs from 'dayjs';

const { Title } = Typography;

const AdminAttendance = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [dateFilter, setDateFilter] = useState(dayjs());

  const fetchAttendances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/attendance', {
        params: { date: dateFilter.format('YYYY-MM-DD') }
      });
      setAttendances(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    fetchAttendances();
  }, [fetchAttendances]);

  const formatTime = (date) => {
    if (!date) return 'Not Recorded';
    return dayjs(date).format('hh:mm A');
  };

  const formatWorkingHours = (workingHours) => {
    if (!workingHours) return '-';
    
    // Handle old format (decimal number)
    if (typeof workingHours === 'number') {
      const hours = Math.floor(workingHours);
      const minutes = Math.round((workingHours - hours) * 60);
      if (hours === 0 && minutes === 0) return '-';
      if (hours === 0) return `${minutes}m`;
      if (minutes === 0) return `${hours}h`;
      return `${hours}h ${minutes}m`;
    }

    // Handle new format (object with hours and minutes)
    const { hours, minutes } = workingHours;
    if (hours === 0 && minutes === 0) return '-';
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const getStatusTag = (status) => {
    const config = {
      present: { color: 'success', icon: <CheckCircleOutlined /> },
      late: { color: 'warning', icon: <ClockCircleOutlined /> },
      absent: { color: 'error', icon: <CloseCircleOutlined /> },
    };

    const { color, icon } = config[status] || { color: 'default', icon: null };
    return (
      <Tag color={color} icon={icon}>
        {status.toUpperCase()}
      </Tag>
    );
  };

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => `${record.user.firstName} ${record.user.lastName}`,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('MM/DD/YYYY'),
    },
    {
      title: 'Clock In',
      key: 'clockIn',
      render: (_, record) => formatTime(record.checkIn?.time),
    },
    {
      title: 'Clock Out',
      key: 'clockOut',
      render: (_, record) => formatTime(record.checkOut?.time),
    },
    {
      title: 'Working Hours',
      key: 'workingHours',
      render: (_, record) => formatWorkingHours(record.workingHours),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => getStatusTag(record.status),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={2}>Attendance Management</Title>

        <Space>
          <DatePicker
            value={dateFilter}
            onChange={setDateFilter}
            allowClear={false}
          />
          {error && <Alert message={error} type="error" showIcon />}
        </Space>

        <Card>
          <Table
            columns={columns}
            dataSource={attendances}
            rowKey="_id"
            locale={{
              emptyText: <Empty description="No attendance records found for this date" />,
            }}
            scroll={{ x: true }}
          />
        </Card>
      </Space>
    </div>
  );
};

export default AdminAttendance;