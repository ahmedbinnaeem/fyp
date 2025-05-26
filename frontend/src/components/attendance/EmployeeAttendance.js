import React, { useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Typography,
  Space,
  Tag,
  Spin,
  Alert,
  Row,
  Col,
  Statistic,
  Empty,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { fetchAttendance, clockIn, clockOut } from '../../store/slices/attendanceSlice';

const { Title } = Typography;

const EmployeeAttendance = () => {
  const dispatch = useDispatch();
  const { attendanceRecords, isLoading, error, clockInStatus } = useSelector((state) => state.attendance);

  useEffect(() => {
    const startDate = dayjs().startOf('month').format('YYYY-MM-DD');
    const endDate = dayjs().endOf('month').format('YYYY-MM-DD');
    dispatch(fetchAttendance({ startDate, endDate }));
  }, [dispatch]);

  const handleClockIn = async () => {
    try {
      await dispatch(clockIn()).unwrap();
      dispatch(fetchAttendance({
        startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
        endDate: dayjs().endOf('month').format('YYYY-MM-DD')
      }));
    } catch (error) {
      // Error is handled by the reducer
    }
  };

  const handleClockOut = async () => {
    try {
      await dispatch(clockOut()).unwrap();
      dispatch(fetchAttendance({
        startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
        endDate: dayjs().endOf('month').format('YYYY-MM-DD')
      }));
    } catch (error) {
      // Error is handled by the reducer
    }
  };

  const formatTime = (date) => {
    if (!date) return 'Not Recorded';
    return dayjs(date).format('hh:mm A');
  };

  const formatWorkingHours = (workingHours) => {
    if (!workingHours) return '-';
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

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const todayAttendance = clockInStatus.todayAttendance;

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={2}>My Attendance</Title>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        <Card title="Today's Status">
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} sm={6}>
              <Statistic
                title="Status"
                value={
                  clockInStatus.isClockedIn
                    ? clockInStatus.isClockedOut
                      ? 'Completed'
                      : 'In Progress'
                    : 'Not Started'
                }
                valueStyle={{
                  color: clockInStatus.isClockedIn
                    ? clockInStatus.isClockedOut
                      ? '#52c41a'
                      : '#1890ff'
                    : '#8c8c8c',
                }}
              />
            </Col>
            {todayAttendance?.checkIn && (
              <Col xs={24} sm={6}>
                <Statistic
                  title="Clock In"
                  value={formatTime(todayAttendance.checkIn.time)}
                />
              </Col>
            )}
            {todayAttendance?.checkOut?.time && (
              <Col xs={24} sm={6}>
                <Statistic
                  title="Clock Out"
                  value={formatTime(todayAttendance.checkOut.time)}
                />
              </Col>
            )}
            {todayAttendance?.workingHours && (
              <Col xs={24} sm={6}>
                <Statistic
                  title="Working Hours"
                  value={formatWorkingHours(todayAttendance.workingHours)}
                />
              </Col>
            )}
            <Col xs={24}>
              <Space>
                {!clockInStatus.isClockedIn ? (
                  <Button
                    type="primary"
                    icon={<LoginOutlined />}
                    onClick={handleClockIn}
                    loading={clockInStatus.isLoading}
                  >
                    Clock In
                  </Button>
                ) : !clockInStatus.isClockedOut ? (
                  <Button
                    type="primary"
                    danger
                    icon={<LogoutOutlined />}
                    onClick={handleClockOut}
                    loading={clockInStatus.isLoading}
                  >
                    Clock Out
                  </Button>
                ) : null}
              </Space>
            </Col>
          </Row>
        </Card>

        <Card>
          <Table
            columns={columns}
            dataSource={attendanceRecords}
            rowKey="_id"
            locale={{
              emptyText: <Empty description="No attendance records found" />,
            }}
            scroll={{ x: true }}
          />
        </Card>
      </Space>
    </div>
  );
};

export default EmployeeAttendance; 