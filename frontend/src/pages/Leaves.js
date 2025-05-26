import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Typography,
  Tag,
  Spin,
  Alert,
  Popconfirm,
  message,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import api from '../utils/axios';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const leaveTypes = ['Annual', 'Sick', 'Personal', 'Maternity', 'Paternity', 'Unpaid'];

const getStatusTag = (status) => {
  const statusConfig = {
    approved: { color: 'success', icon: <CheckOutlined /> },
    pending: { color: 'warning', icon: null },
    rejected: { color: 'error', icon: <CloseOutlined /> },
  };

  const config = statusConfig[status.toLowerCase()] || { color: 'default', icon: null };
  return (
    <Tag color={config.color} icon={config.icon}>
      {status.toUpperCase()}
    </Tag>
  );
};

const Leaves = () => {
  const { user } = useSelector((state) => state.auth);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [form] = Form.useForm();

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const endpoint = user?.role === 'admin' ? '/leaves' : '/leaves/my-leaves';
      const response = await api.get(endpoint);
      setLeaves(response.data);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to fetch leaves');
      setError(err.response?.data?.message || 'Failed to fetch leaves');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleOpenModal = (leave = null) => {
    setSelectedLeave(leave);
    if (leave) {
      form.setFieldsValue({
        leaveType: leave.leaveType,
        dateRange: [dayjs(leave.startDate), dayjs(leave.endDate)],
        reason: leave.reason,
      });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedLeave(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      const [startDate, endDate] = values.dateRange;
      const formData = {
        leaveType: values.leaveType,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        reason: values.reason,
        status: 'Pending',
      };

      if (selectedLeave) {
        await api.put(`/leaves/${selectedLeave._id}`, formData);
        message.success('Leave request updated successfully');
      } else {
        await api.post('/leaves', formData);
        message.success('Leave request submitted successfully');
      }
      handleCloseModal();
      fetchLeaves();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to save leave request');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/leaves/${id}`);
      message.success('Leave request deleted successfully');
      fetchLeaves();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to delete leave request');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/leaves/${id}/status`, { status });
      message.success(`Leave request ${status.toLowerCase()} successfully`);
      fetchLeaves();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to update leave status');
    }
  };

  const columns = [
    ...(user?.role === 'admin' ? [
      {
        title: 'Employee',
        key: 'employee',
        render: (_, record) => `${record.user.firstName} ${record.user.lastName}`,
      },
    ] : []),
    {
      title: 'Leave Type',
      dataIndex: 'leaveType',
      key: 'leaveType',
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Duration (Days)',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {user?.role === 'admin' ? (
            record.status === 'Pending' && (
              <>
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => handleStatusChange(record._id, 'Approved')}
                >
                  Approve
                </Button>
                <Button
                  danger
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => handleStatusChange(record._id, 'Rejected')}
                >
                  Reject
                </Button>
              </>
            )
          ) : (
            record.status === 'Pending' && (
              <>
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => handleOpenModal(record)}
                />
                <Popconfirm
                  title="Are you sure you want to delete this leave request?"
                  onConfirm={() => handleDelete(record._id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button type="link" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </>
            )
          )}
        </Space>
      ),
    },
  ];

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
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>
          {user?.role === 'admin' ? 'All Leave Requests' : 'My Leave Requests'}
        </Title>
        {user?.role !== 'admin' && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            Request Leave
          </Button>
        )}
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={leaves}
          rowKey="_id"
          scroll={{ x: true }}
        />
      </Card>

      <Modal
        title={selectedLeave ? 'Edit Leave Request' : 'New Leave Request'}
        open={modalVisible}
        onCancel={handleCloseModal}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            leaveType: 'Annual',
          }}
        >
          <Form.Item
            name="leaveType"
            label="Leave Type"
            rules={[{ required: true, message: 'Please select leave type' }]}
          >
            <Select>
              {leaveTypes.map((type) => (
                <Select.Option key={type} value={type}>
                  {type}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Leave Period"
            rules={[{ required: true, message: 'Please select leave period' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Reason"
            rules={[{ required: true, message: 'Please enter reason for leave' }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {selectedLeave ? 'Update' : 'Submit'}
              </Button>
              <Button onClick={handleCloseModal}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Leaves; 