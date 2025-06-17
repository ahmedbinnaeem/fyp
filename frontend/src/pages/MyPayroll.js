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
  message,
  Alert,
  DatePicker
} from 'antd';
import {
  DownloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import api from '../utils/axios';
import { formatCurrency } from '../utils/format';

const { Title } = Typography;

const MyPayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [payslipModalVisible, setPayslipModalVisible] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

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

  const handleViewPayslip = async (record) => {
    try {
      const response = await api.get(`/payroll/${record._id}`);
      setSelectedPayslip(response.data);
      setPayslipModalVisible(true);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to fetch payslip details');
    }
  };

  const handleDownloadPayslip = async (id) => {
    try {
      const response = await api.get(`/payroll/${id}/payslip`, {
        responseType: 'blob',
      });
      
      // Check if the response is actually a PDF
      const contentType = response.headers['content-type'];
      if (contentType === 'application/pdf') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'payslip.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
        message.success('Payslip downloaded successfully');
      } else {
        // If not a PDF, show the data in the modal
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const data = JSON.parse(reader.result);
            setSelectedPayslip(data);
            setPayslipModalVisible(true);
          } catch (e) {
            message.error('Failed to process payslip data');
          }
        };
        reader.readAsText(response.data);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        message.error('You are not authorized to view this payslip');
      } else {
        message.error(err.response?.data?.message || 'Failed to download payslip');
      }
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
    },
    {
      title: 'Basic Salary',
      dataIndex: 'basicSalary',
      key: 'basicSalary',
      render: (value) => formatCurrency(value),
    },
    {
      title: 'Net Salary',
      dataIndex: 'netSalary',
      key: 'netSalary',
      render: (value) => formatCurrency(value),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => getStatusTag(record.status),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewPayslip(record)}
          />
        </Space>
      ),
    },
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

  const renderPayslipModal = () => {
    if (!selectedPayslip) return null;

    // Calculate totals
    const totalAllowances = selectedPayslip.allowances?.reduce((sum, a) => sum + (Number(a.amount) || 0), 0) || 0;
    const totalDeductions = selectedPayslip.deductions?.reduce((sum, d) => sum + (Number(d.amount) || 0), 0) || 0;
    const grossSalary = Number(selectedPayslip.basicSalary) + totalAllowances;
    const netSalary = grossSalary - totalDeductions;

    return (
      <Modal
        title="Payslip Details"
        open={payslipModalVisible}
        onCancel={() => {
          setPayslipModalVisible(false);
          setSelectedPayslip(null);
        }}
        footer={[
          <Button 
            key="download" 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadPayslip(selectedPayslip._id)}
          >
            Download
          </Button>,
          <Button 
            key="close" 
            onClick={() => {
              setPayslipModalVisible(false);
              setSelectedPayslip(null);
            }}
          >
            Close
          </Button>
        ]}
        width={800}
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Period">
            {selectedPayslip.month}/{selectedPayslip.year}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            {getStatusTag(selectedPayslip.status)}
          </Descriptions.Item>
          <Descriptions.Item label="Basic Salary">
            {formatCurrency(selectedPayslip.basicSalary)}
          </Descriptions.Item>
          <Descriptions.Item label="Overtime Hours">
            {selectedPayslip.overtimeHours || 0}
          </Descriptions.Item>
          <Descriptions.Item label="Overtime Amount">
            {formatCurrency(selectedPayslip.overtimeAmount || 0)}
          </Descriptions.Item>
          <Descriptions.Item label="Tax Amount">
            {formatCurrency(selectedPayslip.taxAmount || 0)}
          </Descriptions.Item>
        </Descriptions>

        <Title level={5} style={{ marginTop: 24 }}>Allowances</Title>
        <Table
          dataSource={selectedPayslip.allowances || []}
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
          dataSource={selectedPayslip.deductions || []}
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
              value={totalDeductions}
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
        {renderPayslipModal()}
      </Space>
    </div>
  );
};

export default MyPayroll; 