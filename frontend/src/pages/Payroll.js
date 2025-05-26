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
} from 'antd';
import {
  EditOutlined,
  DownloadOutlined,
  PlusOutlined,
  DollarOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import api from '../utils/axios';
import dayjs from 'dayjs';

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
        employee: payroll.employee._id,
        basicSalary: payroll.basicSalary,
        'allowances.housing': payroll.allowances.housing || '',
        'allowances.transport': payroll.allowances.transport || '',
        'allowances.meal': payroll.allowances.meal || '',
        'allowances.other': payroll.allowances.other || '',
        'deductions.tax': payroll.deductions.tax || '',
        'deductions.insurance': payroll.deductions.insurance || '',
        'deductions.other': payroll.deductions.other || '',
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
      const payload = {
        ...values,
        allowances: {
          housing: Number(values['allowances.housing']) || 0,
          transport: Number(values['allowances.transport']) || 0,
          meal: Number(values['allowances.meal']) || 0,
          other: Number(values['allowances.other']) || 0,
        },
        deductions: {
          tax: Number(values['deductions.tax']) || 0,
          insurance: Number(values['deductions.insurance']) || 0,
          other: Number(values['deductions.other']) || 0,
        },
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

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => `${record.employee.firstName} ${record.employee.lastName}`,
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>Payroll Management</Title>
          <Space>
            <DatePicker
              picker="month"
              value={dayjs(selectedMonth)}
              onChange={(date) => setSelectedMonth(date.toDate())}
              allowClear={false}
            />
            <Button type="primary" onClick={handleGeneratePayroll}>
              Generate Payroll
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
              Add Payroll
            </Button>
          </Space>
        </div>

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
            columns={columns}
            dataSource={payrolls}
            rowKey="_id"
            scroll={{ x: true }}
          />
        </Card>

        <Modal
          title={selectedPayroll ? 'Edit Payroll' : 'New Payroll'}
          open={modalVisible}
          onCancel={handleCloseModal}
          footer={null}
          width={800}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="employee"
                  label="Employee"
                  rules={[{ required: true, message: 'Please select an employee' }]}
                >
                  <Select>
                    {employees.map((emp) => (
                      <Option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="basicSalary"
                  label="Basic Salary"
                  rules={[{ required: true, message: 'Please enter basic salary' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider>Allowances</Divider>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="allowances.housing" label="Housing Allowance">
                  <InputNumber
                    style={{ width: '100%' }}
                    formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="allowances.transport" label="Transport Allowance">
                  <InputNumber
                    style={{ width: '100%' }}
                    formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="allowances.meal" label="Meal Allowance">
                  <InputNumber
                    style={{ width: '100%' }}
                    formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="allowances.other" label="Other Allowances">
                  <InputNumber
                    style={{ width: '100%' }}
                    formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider>Deductions</Divider>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="deductions.tax" label="Tax">
                  <InputNumber
                    style={{ width: '100%' }}
                    formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="deductions.insurance" label="Insurance">
                  <InputNumber
                    style={{ width: '100%' }}
                    formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="deductions.other" label="Other Deductions">
                  <InputNumber
                    style={{ width: '100%' }}
                    formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {selectedPayroll ? 'Update' : 'Create'}
                </Button>
                <Button onClick={handleCloseModal}>Cancel</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    </div>
  );
};

export default Payroll; 