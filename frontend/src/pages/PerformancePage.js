import React, { useState, useEffect } from 'react';
import {
  Button,
  Space,
  Modal,
  message,
  Card,
  Tabs,
  Typography,
  Row,
  Col,
  Statistic,
  Form,
  Select,
  Popconfirm,
  Alert
} from 'antd';
import {
  PlusOutlined,
  FileSearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../utils/axios';
import PerformanceList from '../components/performance/PerformanceList';
import PerformanceForm from '../components/performance/PerformanceForm';
import PerformanceDetails from '../components/performance/PerformanceDetails';
import { useAuth } from '../contexts/AuthContext';

const { Title } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const PerformancePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  console.log('PerformancePage - User:', user);
  console.log('PerformancePage - Is Admin:', isAdmin);

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [form] = Form.useForm();

  const fetchReviews = async () => {
    try {
      setLoading(true);
      console.log('Fetching reviews for user:', user);
      
      // For employees, explicitly pass their user ID
      const url = isAdmin ? '/performance-reviews' : `/performance-reviews?user=${user._id}`;
      console.log('Fetching from URL:', url);
      
      const response = await api.get(url);
      console.log('API Response:', response.data);
      
      if (!response.data) {
        console.error('No data received from API');
        setError('No performance reviews found');
        setReviews([]);
        return;
      }
      
      setReviews(response.data);
    } catch (err) {
      console.error('Error fetching reviews:', err.response || err);
      setError(err.response?.data?.message || 'Failed to fetch performance reviews');
      message.error('Failed to fetch performance reviews');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Current user:', user);
    if (user) {
      fetchReviews();
    }
  }, [user, isAdmin]); // Added isAdmin to dependencies since we use it in fetchReviews

  const handleCreate = () => {
    setModalMode('create');
    setSelectedReview(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (review) => {
    setModalMode('edit');
    setSelectedReview(review);
    form.setFieldsValue({
      user: review.user._id,
      reviewDate: dayjs(review.reviewDate),
      reviewPeriod: [dayjs(review.reviewPeriod.startDate), dayjs(review.reviewPeriod.endDate)],
      nextReviewDate: review.nextReviewDate ? dayjs(review.nextReviewDate) : null,
      categories: review.categories,
      goals: review.goals,
      strengths: review.strengths,
      areasOfImprovement: review.areasOfImprovement,
      overallRating: review.overallRating,
      overallComments: review.overallComments
    });
    setModalVisible(true);
  };

  const handleView = (review) => {
    setModalMode('view');
    setSelectedReview(review);
    setModalVisible(true);
  };

  const handleDelete = async (reviewId) => {
    try {
      await api.delete(`/performance-reviews/${reviewId}`);
      message.success('Performance review deleted successfully');
      fetchReviews();
    } catch (err) {
      message.error('Failed to delete performance review');
      console.error(err);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const reviewData = {
        ...values,
        reviewPeriod: {
          startDate: values.reviewPeriod[0].toISOString(),
          endDate: values.reviewPeriod[1].toISOString()
        },
        reviewDate: values.reviewDate.toISOString(),
        nextReviewDate: values.nextReviewDate?.toISOString(),
        reviewer: user._id,
        status: 'Draft'
      };

      if (modalMode === 'create') {
        await api.post('/performance-reviews', reviewData);
        message.success('Performance review created successfully');
      } else {
        await api.put(`/performance-reviews/${selectedReview._id}`, reviewData);
        message.success('Performance review updated successfully');
      }

      setModalVisible(false);
      fetchReviews();
    } catch (err) {
      message.error(`Failed to ${modalMode} performance review`);
      console.error(err);
    }
  };

  const handleAcknowledge = async (reviewId) => {
    try {
      await api.put(`/performance-reviews/${reviewId}/acknowledge`);
      message.success('Review acknowledged successfully');
      fetchReviews();
    } catch (err) {
      message.error('Failed to acknowledge review');
      console.error(err);
    }
  };

  const handleAddComments = async (reviewId, comments) => {
    try {
      await api.put(`/performance-reviews/${reviewId}/comments`, { comments });
      message.success('Comments added successfully');
      fetchReviews();
    } catch (err) {
      message.error('Failed to add comments');
      console.error(err);
    }
  };

  const getModalTitle = () => {
    switch (modalMode) {
      case 'create':
        return 'Create Performance Review';
      case 'edit':
        return 'Edit Performance Review';
      case 'view':
        return 'Performance Review Details';
      default:
        return '';
    }
  };

  const getModalContent = () => {
    switch (modalMode) {
      case 'create':
      case 'edit':
        return (
          <PerformanceForm
            form={form}
            onSubmit={handleSubmit}
            onCancel={() => setModalVisible(false)}
            initialValues={selectedReview}
          />
        );
      case 'view':
        return (
          <PerformanceDetails
            review={selectedReview}
            onAddComments={handleAddComments}
            onAcknowledge={handleAcknowledge}
            isAdmin={isAdmin}
          />
        );
      default:
        return null;
    }
  };

  const getModalWidth = () => {
    return modalMode === 'view' ? 1000 : 800;
  };

  const getStats = () => {
    const total = reviews.length;
    const pending = reviews.filter(r => r.status === 'Pending').length;
    const completed = reviews.filter(r => r.status === 'Completed').length;
    const acknowledged = reviews.filter(r => r.isAcknowledged).length;

    return { total, pending, completed, acknowledged };
  };

  const stats = getStats();

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Typography.Title level={2}>Performance Reviews</Typography.Title>
          </Col>
          <Col>
            {isAdmin && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Create Review
              </Button>
            )}
          </Col>
        </Row>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Reviews"
              value={stats.total}
              prefix={<FileSearchOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Reviews"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Completed Reviews"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Acknowledged Reviews"
              value={stats.acknowledged}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs defaultActiveKey={isAdmin ? "all" : "my"}>
          {isAdmin ? (
            <>
              <TabPane tab="All Reviews" key="all">
                <PerformanceList
                  reviews={reviews}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAcknowledge={handleAcknowledge}
                  isAdmin={isAdmin}
                  loading={loading}
                />
              </TabPane>
              <TabPane tab="Pending Reviews" key="pending">
                <PerformanceList
                  reviews={reviews.filter(r => r.status === 'Pending')}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAcknowledge={handleAcknowledge}
                  isAdmin={isAdmin}
                  loading={loading}
                />
              </TabPane>
            </>
          ) : (
            <TabPane tab="My Reviews" key="my">
              <PerformanceList
                reviews={reviews}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAcknowledge={handleAcknowledge}
                isAdmin={isAdmin}
                loading={loading}
              />
            </TabPane>
          )}
        </Tabs>
      </Card>

      <Modal
        title={getModalTitle()}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={getModalWidth()}
        destroyOnClose
      >
        {getModalContent()}
      </Modal>
    </div>
  );
};

export default PerformancePage; 