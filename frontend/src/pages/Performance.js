import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Typography,
  Spin,
  Alert,
  DatePicker,
  Row,
  Col,
  Statistic,
  message,
  Divider,
  Rate,
  Tag,
  Tooltip,
  Popconfirm,
  Tabs
} from 'antd';
import {
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  BarChartOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import api from '../utils/axios';
import dayjs from 'dayjs';
import PerformanceForm from '../components/performance/PerformanceForm';
import PerformanceStats from '../components/performance/PerformanceStats';
import PerformanceDetails from '../components/performance/PerformanceDetails';

const { Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const Performance = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [statusFilter, setStatusFilter] = useState('');
  const [form] = Form.useForm();
  const [statsVisible, setStatsVisible] = useState(false);
  const [isAdmin] = useState(localStorage.getItem('isAdmin') === 'true');

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange[0] && dateRange[1]) {
        params.append('startDate', dateRange[0].format('YYYY-MM-DD'));
        params.append('endDate', dateRange[1].format('YYYY-MM-DD'));
      }
      if (statusFilter) params.append('status', statusFilter);

      const response = await api.get(`/performance?${params.toString()}`);
      setReviews(response.data);
      setError(null);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to fetch performance reviews');
      setError(err.response?.data?.message || 'Failed to fetch performance reviews');
    } finally {
      setLoading(false);
    }
  }, [dateRange, statusFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleOpenModal = (review = null) => {
    setSelectedReview(review);
    if (review) {
      form.setFieldsValue({
        ...review,
        reviewDate: dayjs(review.reviewDate),
        reviewPeriod: [dayjs(review.reviewPeriod.startDate), dayjs(review.reviewPeriod.endDate)],
        nextReviewDate: review.nextReviewDate ? dayjs(review.nextReviewDate) : null
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        reviewDate: dayjs(),
        reviewPeriod: [dayjs().startOf('month'), dayjs().endOf('month')]
      });
    }
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedReview(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        reviewDate: values.reviewDate.toISOString(),
        reviewPeriod: {
          startDate: values.reviewPeriod[0].toISOString(),
          endDate: values.reviewPeriod[1].toISOString()
        },
        nextReviewDate: values.nextReviewDate?.toISOString()
      };

      if (selectedReview) {
        await api.put(`/performance/${selectedReview._id}`, payload);
        message.success('Performance review updated successfully');
      } else {
        await api.post('/performance', payload);
        message.success('Performance review created successfully');
      }
      handleCloseModal();
      fetchReviews();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to save performance review');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/performance/${id}`);
      message.success('Performance review deleted successfully');
      fetchReviews();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to delete performance review');
    }
  };

  const handleAddComments = async (id, comments) => {
    try {
      await api.put(`/performance/${id}/comments`, { comments });
      message.success('Comments added successfully');
      fetchReviews();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to add comments');
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await api.put(`/performance/${id}/acknowledge`);
      message.success('Review acknowledged successfully');
      fetchReviews();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to acknowledge review');
    }
  };

  const getStatusTag = (status) => {
    const colors = {
      'Draft': 'default',
      'Pending': 'warning',
      'Reviewed': 'processing',
      'Completed': 'success'
    };
    return <Tag color={colors[status]}>{status}</Tag>;
  };

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => record?.user ? `${record.user.firstName} ${record.user.lastName}` : '-',
    },
    {
      title: 'Review Date',
      dataIndex: 'reviewDate',
      key: 'reviewDate',
      render: (date) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Review Period',
      key: 'reviewPeriod',
      render: (_, record) => 
        `${dayjs(record.reviewPeriod.startDate).format('MMM DD')} - ${dayjs(record.reviewPeriod.endDate).format('MMM DD, YYYY')}`,
    },
    {
      title: 'Overall Rating',
      dataIndex: 'overallRating',
      key: 'overallRating',
      render: (rating) => <Rate disabled defaultValue={rating} />,
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
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={() => {
              setSelectedReview(record);
              setDetailsVisible(true);
            }}
          />
          {isAdmin && record.status === 'Draft' && (
            <>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleOpenModal(record)}
              />
              <Popconfirm
                title="Are you sure you want to delete this review?"
                onConfirm={() => handleDelete(record._id)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            </>
          )}
          {!isAdmin && record.status === 'Reviewed' && !record.isAcknowledged && (
            <Button
              type="link"
              icon={<CheckOutlined />}
              onClick={() => handleAcknowledge(record._id)}
            >
              Acknowledge
            </Button>
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

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>Performance Management</Title>
          <Space>
            {isAdmin && (
              <>
                <Button
                  type="primary"
                  icon={<BarChartOutlined />}
                  onClick={() => setStatsVisible(true)}
                >
                  View Statistics
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleOpenModal()}
                >
                  New Review
                </Button>
              </>
            )}
          </Space>
        </div>

        {error && <Alert message={error} type="error" showIcon />}

        <Card>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                allowClear={false}
              />
              <Select
                style={{ width: 120 }}
                placeholder="Status"
                allowClear
                value={statusFilter}
                onChange={setStatusFilter}
              >
                <Option value="Draft">Draft</Option>
                <Option value="Pending">Pending</Option>
                <Option value="Reviewed">Reviewed</Option>
                <Option value="Completed">Completed</Option>
              </Select>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={reviews}
            rowKey="_id"
            loading={loading}
            scroll={{ x: true }}
          />
        </Card>

        {/* Performance Review Form Modal */}
        <Modal
          title={selectedReview ? 'Edit Performance Review' : 'New Performance Review'}
          open={modalVisible}
          onCancel={handleCloseModal}
          footer={null}
          width={800}
        >
          <PerformanceForm
            form={form}
            onSubmit={handleSubmit}
            onCancel={handleCloseModal}
            initialValues={selectedReview}
          />
        </Modal>

        {/* Performance Review Details Modal */}
        <Modal
          title="Performance Review Details"
          open={detailsVisible}
          onCancel={() => {
            setDetailsVisible(false);
            setSelectedReview(null);
          }}
          footer={null}
          width={800}
        >
          {selectedReview && (
            <PerformanceDetails
              review={selectedReview}
              onAddComments={handleAddComments}
              onAcknowledge={handleAcknowledge}
              isAdmin={isAdmin}
            />
          )}
        </Modal>

        {/* Performance Statistics Modal */}
        <Modal
          title="Performance Statistics"
          open={statsVisible}
          onCancel={() => setStatsVisible(false)}
          footer={null}
          width={1000}
        >
          <PerformanceStats />
        </Modal>
      </Space>
    </div>
  );
};

export default Performance; 