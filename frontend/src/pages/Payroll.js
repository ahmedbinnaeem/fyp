import React, { useEffect, useState, useCallback } from 'react';
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
  InputNumber,
  Tag,
  Tooltip,
  Popconfirm
} from 'antd';
import {
  EditOutlined,
  DownloadOutlined,
  PlusOutlined,
  DollarOutlined,
  CalendarOutlined,
  SyncOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import api from '../utils/axios';
import dayjs from 'dayjs';
import { formatCurrency } from '../utils/format';

const { Title } = Typography;
const { Option } = Select;

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const Payroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [employees, setEmployees] = useState([]);
  const [form] = Form.useForm();
  const [selectedRows, setSelectedRows] = useState([]);
  const [statusUpdateVisible, setStatusUpdateVisible] = useState(false);
  const [updateForm] = Form.useForm();

  const fetchPayrolls = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/payroll?month=${selectedMonth.getMonth() + 1}&year=${selectedMonth.getFullYear()}`
      );
      setPayrolls(response.data);
      setError(null);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to fetch payrolls');
      setError(err.response?.data?.message || 'Failed to fetch payrolls');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/users');
      setEmployees(response.data);
    } catch (err) {
      message.error('Failed to fetch employees');
    }
  };

  useEffect(() => {
    fetchPayrolls();
    fetchEmployees();
  }, [fetchPayrolls]);

  const handleOpenModal = (payroll = null) => {
    setSelectedPayroll(payroll);
    if (payroll) {
      form.setFieldsValue({
        employee: payroll.user._id,
        basicSalary: payroll.basicSalary,
        'allowances.housing': payroll.allowances?.housing || '',
        'allowances.transport': payroll.allowances?.transport || '',
        'allowances.meal': payroll.allowances?.meal || '',
        'allowances.other': payroll.allowances?.other || '',
        'deductions.tax': payroll.deductions?.tax || '',
        'deductions.insurance': payroll.deductions?.insurance || '',
        'deductions.other': payroll.deductions?.other || '',
        month: payroll.month,
        year: payroll.year,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        month: selectedMonth.getMonth() + 1,
        year: selectedMonth.getFullYear(),
      });
    }
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedPayroll(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      // Extract and convert allowances
      const allowances = {
        housing: values['allowances.housing'] ? Number(values['allowances.housing']) : 0,
        transport: values['allowances.transport'] ? Number(values['allowances.transport']) : 0,
        meal: values['allowances.meal'] ? Number(values['allowances.meal']) : 0,
        other: values['allowances.other'] ? Number(values['allowances.other']) : 0
      };

      // Extract and convert deductions
      const deductions = {
        tax: values['deductions.tax'] ? Number(values['deductions.tax']) : 0,
        insurance: values['deductions.insurance'] ? Number(values['deductions.insurance']) : 0,
        other: values['deductions.other'] ? Number(values['deductions.other']) : 0
      };

      // Calculate totals
      const totalAllowances = Object.values(allowances).reduce((a, b) => a + b, 0);
      const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0);
      const netSalary = Number(values.basicSalary) + totalAllowances - totalDeductions;

      const payload = {
        employee: values.employee,
        month: values.month || selectedMonth.getMonth() + 1,
        year: values.year || selectedMonth.getFullYear(),
        basicSalary: Number(values.basicSalary),
        allowances,
        deductions,
        netSalary
      };

      if (selectedPayroll) {
        await api.put(`/payroll/${selectedPayroll._id}`, payload);
        message.success('Payroll updated successfully');
      } else {
        await api.post('/payroll', payload);
        message.success('Payroll created successfully');
      }
      handleCloseModal();
      fetchPayrolls();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to save payroll');
    }
  };

  const handleGeneratePayroll = async () => {
    try {
      await api.post('/payroll/generate', {
        month: selectedMonth.getMonth() + 1,
        year: selectedMonth.getFullYear(),
      });
      message.success('Payroll generated successfully');
      fetchPayrolls();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to generate payroll');
    }
  };

  const handleDownloadPayslip = async (id) => {
    try {
      const response = await api.get(`/payroll/${id}/payslip`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'payslip.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('Payslip downloaded successfully');
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to download payslip');
    }
  };

  const calculateTotalAllowances = (allowances) => {
    return Object.values(allowances).reduce((sum, value) => sum + (Number(value) || 0), 0);
  };

  const calculateTotalDeductions = (deductions) => {
    return Object.values(deductions).reduce((sum, value) => sum + (Number(value) || 0), 0);
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

  const handleBulkStatusUpdate = async (values) => {
    try {
      setLoading(true);
      const promises = selectedRows.map(id => 
        api.put(`/payroll/${id}`, {
          status: values.status,
          paymentDate: values.paymentDate?.toISOString(),
          paymentMethod: values.paymentMethod,
          remarks: values.remarks
        })
      );

      await Promise.all(promises);
      message.success('Successfully updated payroll status');
      setStatusUpdateVisible(false);
      setSelectedRows([]);
      updateForm.resetFields();
      fetchPayrolls();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to update payroll status');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => record?.user ? `${record.user.firstName} ${record.user.lastName}` : '-',
    },
    {
      title: 'Basic Salary',
      dataIndex: 'basicSalary',
      key: 'basicSalary',
      render: (value) => `$${value.toLocaleString()}`,
    },
    {
      title: 'Total Allowances',
      key: 'allowances',
      render: (_, record) => `$${calculateTotalAllowances(record.allowances).toLocaleString()}`,
    },
    {
      title: 'Total Deductions',
      key: 'deductions',
      render: (_, record) => `$${calculateTotalDeductions(record.deductions).toLocaleString()}`,
    },
    {
      title: 'Net Salary',
      key: 'netSalary',
      render: (_, record) => {
        const netSalary = record.basicSalary +
          calculateTotalAllowances(record.allowances) -
          calculateTotalDeductions(record.deductions);
        return `$${netSalary.toLocaleString()}`;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          />
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadPayslip(record._id)}
          />
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys: selectedRows,
    onChange: (selectedRowKeys) => {
      setSelectedRows(selectedRowKeys);
    },
    getCheckboxProps: (record) => ({
      disabled: record.status === 'REJECTED' // Can't update rejected payrolls
    })
  };

  const statusUpdateModal = (
    <Modal
      title="Update Payroll Status"
      visible={statusUpdateVisible}
      onCancel={() => {
        setStatusUpdateVisible(false);
        updateForm.resetFields();
      }}
      footer={null}
    >
      <Form
        form={updateForm}
        onFinish={handleBulkStatusUpdate}
        layout="vertical"
      >
        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true, message: 'Please select status' }]}
        >
          <Select>
            <Option value="Pending">Pending</Option>
            <Option value="Processing">Processing</Option>
            <Option value="Paid">Paid</Option>
            <Option value="Rejected">Rejected</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="paymentMethod"
          label="Payment Method"
          rules={[
            { 
              required: values => values.status === 'Paid',
              message: 'Please select payment method'
            }
          ]}
        >
          <Select>
            <Option value="Bank Transfer">Bank Transfer</Option>
            <Option value="Cash">Cash</Option>
            <Option value="Check">Check</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="paymentDate"
          label="Payment Date"
          rules={[
            { 
              required: values => values.status === 'Paid',
              message: 'Please select payment date'
            }
          ]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="remarks"
          label="Remarks"
        >
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              Update Status
            </Button>
            <Button onClick={() => {
              setStatusUpdateVisible(false);
              updateForm.resetFields();
            }}>
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );

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
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>Payroll Management</Title>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<SyncOutlined />}
                onClick={fetchPayrolls}
                loading={loading}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<DollarOutlined />}
                onClick={() => setStatusUpdateVisible(true)}
                disabled={selectedRows.length === 0}
              >
                Update Status ({selectedRows.length})
              </Button>
            </Space>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <Statistic
                title="Total Payroll"
                value={payrolls.reduce((sum, p) => sum + p.basicSalary, 0)}
                prefix={<DollarOutlined />}
                precision={2}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Total Employees"
                value={payrolls.length}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
          <Card>
              <Statistic
                title="Average Salary"
                value={payrolls.length ? payrolls.reduce((sum, p) => sum + p.basicSalary, 0) / payrolls.length : 0}
                prefix={<DollarOutlined />}
                precision={2}
              />
          </Card>
          </Col>
        </Row>

        <Card>
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={payrolls}
            rowKey="_id"
            loading={loading}
          />
        </Card>

        {statusUpdateModal}
      </Space>
    </div>
  );
};

export default Payroll; 