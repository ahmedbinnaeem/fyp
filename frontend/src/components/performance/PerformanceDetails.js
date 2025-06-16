import React, { useState } from 'react';
import {
  Descriptions,
  Rate,
  Card,
  Typography,
  Space,
  Button,
  Form,
  Input,
  Tag,
  Divider,
  Row,
  Col,
  Timeline,
  Select
} from 'antd';
import {
  CheckOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const PerformanceDetails = ({ review, onAddComments, onAcknowledge, isAdmin }) => {
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [form] = Form.useForm();

  const handleAddComments = async (values) => {
    await onAddComments(review._id, values.comments);
    setShowCommentForm(false);
    form.resetFields();
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

  const getGoalStatusIcon = (status) => {
    const icons = {
      'Not Started': <ClockCircleOutlined style={{ color: '#d9d9d9' }} />,
      'In Progress': <ClockCircleOutlined style={{ color: '#1890ff' }} />,
      'Completed': <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      'Not Achieved': <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
    };
    return icons[status] || icons['Not Started'];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft':
        return '#faad14';
      case 'Pending':
        return '#1890ff';
      case 'Completed':
        return '#52c41a';
      case 'Acknowledged':
        return '#722ed1';
      default:
        return '#d9d9d9';
    }
  };

  return (
    <div>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Descriptions title="Review Details" bordered>
            <Descriptions.Item label="Employee" span={3}>
              {review.user.firstName} {review.user.lastName}
            </Descriptions.Item>
            <Descriptions.Item label="Department" span={3}>
              {review.user.department}
            </Descriptions.Item>
            <Descriptions.Item label="Review Date" span={3}>
              {dayjs(review.reviewDate).format('MMMM D, YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Review Period" span={3}>
              {dayjs(review.reviewPeriod.startDate).format('MMMM D, YYYY')} - {dayjs(review.reviewPeriod.endDate).format('MMMM D, YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Status" span={3}>
              {getStatusTag(review.status)}
            </Descriptions.Item>
            <Descriptions.Item label="Overall Rating" span={3}>
              <Rate disabled defaultValue={review.overallRating} />
            </Descriptions.Item>
            <Descriptions.Item label="Overall Comments" span={3}>
              {review.overallComments}
            </Descriptions.Item>
            <Descriptions.Item label="Next Review Date" span={3}>
              {dayjs(review.nextReviewDate).format('MMMM D, YYYY')}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Title level={5}>Performance Categories</Title>
          <Row gutter={[16, 16]}>
            {review.categories.map((category, index) => (
              <Col span={8} key={index}>
                <Card size="small" title={category.name}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Rate disabled defaultValue={category.score} />
                    {category.comments && <Text type="secondary">{category.comments}</Text>}
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>

          <Divider />

          <Title level={5}>Goals</Title>
          <Timeline>
            {review.goals.map((goal, index) => (
              <Timeline.Item
                key={index}
                dot={getGoalStatusIcon(goal.status)}
              >
                <Card size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{goal.description}</Text>
                    <Space>
                      <Tag color={
                        goal.status === 'Completed' ? 'success' :
                        goal.status === 'In Progress' ? 'processing' :
                        goal.status === 'Not Achieved' ? 'error' : 'default'
                      }>
                        {goal.status}
                      </Tag>
                      {goal.targetDate && (
                        <Text type="secondary">
                          Target: {dayjs(goal.targetDate).format('MMM DD, YYYY')}
                        </Text>
                      )}
                    </Space>
                    {goal.comments && <Text type="secondary">{goal.comments}</Text>}
                  </Space>
                </Card>
              </Timeline.Item>
            ))}
          </Timeline>

          <Divider />

          <Row gutter={16}>
            <Col span={12}>
              <Title level={5}>Strengths</Title>
              <ul>
                {review.strengths.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </Col>
            <Col span={12}>
              <Title level={5}>Areas of Improvement</Title>
              <ul>
                {review.areasOfImprovement.map((area, index) => (
                  <li key={index}>{area}</li>
                ))}
              </ul>
            </Col>
          </Row>

          <Divider />

          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Title level={5}>Overall Rating</Title>
              <Rate disabled defaultValue={review.overallRating} />
              <Text>{review.overallComments}</Text>
            </Space>
          </Card>

          {review.employeeComments && (
            <>
              <Divider />
              <Card>
                <Title level={5}>Employee Comments</Title>
                <Text>{review.employeeComments}</Text>
              </Card>
            </>
          )}

          {!isAdmin && review.status === 'Reviewed' && !review.isAcknowledged && (
            <>
              <Divider />
              <Space direction="vertical" style={{ width: '100%' }}>
                {!showCommentForm ? (
                  <Space>
                    <Button
                      type="primary"
                      icon={<CheckOutlined />}
                      onClick={() => onAcknowledge(review._id)}
                    >
                      Acknowledge Review
                    </Button>
                    <Button onClick={() => setShowCommentForm(true)}>
                      Add Comments
                    </Button>
                  </Space>
                ) : (
                  <Form form={form} onFinish={handleAddComments}>
                    <Form.Item
                      name="comments"
                      rules={[{ required: true, message: 'Please enter your comments' }]}
                    >
                      <TextArea rows={4} placeholder="Enter your comments about this review" />
                    </Form.Item>
                    <Form.Item>
                      <Space>
                        <Button type="primary" htmlType="submit">
                          Submit Comments
                        </Button>
                        <Button onClick={() => setShowCommentForm(false)}>
                          Cancel
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                )}
              </Space>
            </>
          )}

          {review.isAcknowledged && (
            <>
              <Divider />
              <Text type="secondary">
                Acknowledged on {dayjs(review.acknowledgedAt).format('MMM DD, YYYY HH:mm')}
              </Text>
            </>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default PerformanceDetails; 