import React from 'react';
import {
  Table,
  Tag,
  Space,
  Button,
  Tooltip,
  Typography,
  Popconfirm
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

const PerformanceList = ({
  reviews,
  onView,
  onEdit,
  onDelete,
  onAcknowledge,
  isAdmin,
  loading
}) => {
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
      dataIndex: ['user', 'firstName'],
      key: 'employee',
      render: (_, record) => `${record.user.firstName} ${record.user.lastName}`
    },
    {
      title: 'Review Date',
      dataIndex: 'reviewDate',
      key: 'reviewDate',
      render: (date) => dayjs(date).format('MMM DD, YYYY')
    },
    {
      title: 'Review Period',
      key: 'reviewPeriod',
      render: (_, record) => (
        `${dayjs(record.reviewPeriod.startDate).format('MMM DD')} - ${dayjs(record.reviewPeriod.endDate).format('MMM DD, YYYY')}`
      )
    },
    {
      title: 'Reviewer',
      dataIndex: ['reviewer', 'firstName'],
      key: 'reviewer',
      render: (_, record) => `${record.reviewer.firstName} ${record.reviewer.lastName}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Overall Rating',
      dataIndex: 'overallRating',
      key: 'overallRating',
      render: (rating) => (
        <Space>
          <Text>{rating}</Text>
          <Text type="secondary">/ 5</Text>
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const isEditable = isAdmin && (record.status === 'Draft' || record.status === 'Pending');
        const isDeletable = isAdmin && record.status === 'Draft';
        const canAcknowledge = !isAdmin && record.status === 'Reviewed' && !record.isAcknowledged;

        return (
          <Space>
            <Tooltip title="View Details">
              <Button
                icon={<EyeOutlined />}
                onClick={() => onView(record)}
              />
            </Tooltip>

            {isEditable && (
              <Tooltip title="Edit Review">
                <Button
                  icon={<EditOutlined />}
                  onClick={() => onEdit(record)}
                />
              </Tooltip>
            )}

            {isDeletable && (
              <Popconfirm
                title="Are you sure you want to delete this review?"
                onConfirm={() => onDelete(record._id)}
                okText="Yes"
                cancelText="No"
              >
                <Tooltip title="Delete Review">
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Tooltip>
              </Popconfirm>
            )}

            {canAcknowledge && (
              <Tooltip title="Acknowledge Review">
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => onAcknowledge(record._id)}
                >
                  Acknowledge
                </Button>
              </Tooltip>
            )}

            {record.isAcknowledged && (
              <Tooltip title="Acknowledged">
                <Tag icon={<CheckOutlined />} color="success">
                  Acknowledged
                </Tag>
              </Tooltip>
            )}
          </Space>
        );
      }
    }
  ];

  return (
    <Table
      columns={columns}
      dataSource={reviews}
      rowKey="_id"
      loading={loading}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} reviews`
      }}
    />
  );
};

export default PerformanceList; 