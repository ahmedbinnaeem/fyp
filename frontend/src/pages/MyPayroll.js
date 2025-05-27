import React, { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Tag,
  Typography,
  Space,
  Statistic,
  Row,
  Col,
  Button,
  Modal,
  Descriptions,
  Spin,
  message
} from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import api from '../utils/axios';
import { formatCurrency } from '../utils/format';

const { Title } = Typography;

const MyPayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payroll/my-payroll');
      setPayrolls(response.data);
    } catch (err) {
      message.error('Failed to fetch payroll history');
    } finally {
      setLoading(false);
    }
  };

  const showPayrollDetail = async (id) => {
    try {
      setLoading(true);
      const response = await api.get(`/payroll/${id}`);
      setSelectedPayroll(response.data);
      setModalVisible(true);
    } catch (err) {
      message.error('Failed to fetch payroll details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const colors = {
      DRAFT: 'default',
      PENDING: 'warning',
      PROCESSING: 'processing',
      PAID: 'success',
      REJECTED: 'error'
    };
    
    const displayStatus = (status || 'DRAFT').toUpperCase();
    return <Tag color={colors[displayStatus]}>{displayStatus}</Tag>;
  };

  const columns = [
    {
      title: 'Period',
      key: 'period',
      render: (_, record) => `${record.month}/${record.year}`,
      sorter: (a, b) => new Date(a.year, a.month) - new Date(b.year, b.month)
    },
    {
      title: 'Basic Salary',
      dataIndex: 'basicSalary',
      render: (value) => formatCurrency(value)
    },
    {
      title: 'Gross Salary',
      dataIndex: 'grossSalary',
      render: (value) => formatCurrency(value)
    },
    {
      title: 'Net Salary',
      dataIndex: 'netSalary',
      render: (value) => formatCurrency(value)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Payment Date',
      dataIndex: 'paymentDate',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-'
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="link" onClick={() => showPayrollDetail(record._id)}>
          View Details
        </Button>
      )
    }
  ];

  const renderPayrollDetails = () => {
    if (!selectedPayroll) return null;

    // Calculate totals correctly
    const totalAllowances = selectedPayroll.allowances?.reduce((sum, a) => sum + (Number(a.amount) || 0), 0) || 0;
    const totalDeductions = selectedPayroll.deductions?.reduce((sum, d) => sum + (Number(d.amount) || 0), 0) || 0;
    const grossSalary = Number(selectedPayroll.basicSalary) + Number(selectedPayroll.overtimeAmount) + totalAllowances;
    const totalDeductionsWithTax = totalDeductions + Number(selectedPayroll.taxAmount);
    const netSalary = grossSalary - totalDeductionsWithTax;

    return (
      <Modal
        title="Payroll Details"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Period">
            {selectedPayroll.month}/{selectedPayroll.year}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            {getStatusTag(selectedPayroll.status || 'Draft')}
          </Descriptions.Item>
          <Descriptions.Item label="Basic Salary">
            {formatCurrency(selectedPayroll.basicSalary || 0)}
          </Descriptions.Item>
          <Descriptions.Item label="Overtime Hours">
            {selectedPayroll.overtimeHours || 0}
          </Descriptions.Item>
          <Descriptions.Item label="Overtime Amount">
            {formatCurrency(selectedPayroll.overtimeAmount || 0)}
          </Descriptions.Item>
          <Descriptions.Item label="Tax Amount">
            {formatCurrency(selectedPayroll.taxAmount || 0)}
          </Descriptions.Item>
        </Descriptions>

        <Title level={5} style={{ marginTop: 24 }}>Allowances</Title>
        <Table
          dataSource={selectedPayroll.allowances || []}
          columns={[
            { title: 'Type', dataIndex: 'type' },
            { 
              title: 'Amount', 
              dataIndex: 'amount',
              render: (value) => formatCurrency(Number(value) || 0)
            },
            { title: 'Description', dataIndex: 'description' }
          ]}
          pagination={false}
          size="small"
          locale={{ emptyText: 'No allowances' }}
        />

        <Title level={5} style={{ marginTop: 24 }}>Deductions</Title>
        <Table
          dataSource={selectedPayroll.deductions || []}
          columns={[
            { title: 'Type', dataIndex: 'type' },
            { 
              title: 'Amount', 
              dataIndex: 'amount',
              render: (value) => formatCurrency(Number(value) || 0)
            },
            { title: 'Description', dataIndex: 'description' }
          ]}
          pagination={false}
          size="small"
          locale={{ emptyText: 'No deductions' }}
        />

        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col span={8}>
            <Statistic 
              title="Gross Salary" 
              value={grossSalary} 
              prefix="$"
              precision={2}
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="Total Deductions" 
              value={totalDeductionsWithTax}
              prefix="$"
              precision={2}
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="Net Salary" 
              value={netSalary}
              prefix="$"
              precision={2}
            />
          </Col>
        </Row>
      </Modal>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={2}>My Payroll History</Title>

        <Card>
          <Table
            columns={columns}
            dataSource={payrolls}
            rowKey="_id"
            loading={loading}
          />
        </Card>

        {renderPayrollDetails()}
      </Space>
    </div>
  );
};

export default MyPayroll; 