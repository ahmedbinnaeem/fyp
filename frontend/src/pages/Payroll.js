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
  Popconfirm,
  Descriptions
} from 'antd';
import {
  EditOutlined,
  DownloadOutlined,
  PlusOutlined,
  DollarOutlined,
  CalendarOutlined,
  SyncOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined
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
  const [payslipModalVisible, setPayslipModalVisible] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

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
      // Format allowances and deductions for form
      const formattedAllowances = payroll.allowances.reduce((acc, allowance) => {
        acc[allowance.type.toLowerCase()] = allowance.amount;
        return acc;
      }, {});

      const formattedDeductions = payroll.deductions.reduce((acc, deduction) => {
        acc[deduction.type.toLowerCase()] = deduction.amount;
        return acc;
      }, {});

      form.setFieldsValue({
        employee: payroll.user._id,
        basicSalary: payroll.basicSalary,
        allowances: formattedAllowances,
        deductions: formattedDeductions,
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
      const allowances = [];
      if (values.allowances) {
        if (values.allowances.housing) {
          allowances.push({
            type: 'Housing',
            amount: Number(values.allowances.housing),
            description: 'Housing allowance'
          });
        }
        if (values.allowances.transport) {
          allowances.push({
            type: 'Transport',
            amount: Number(values.allowances.transport),
            description: 'Transport allowance'
          });
        }
        if (values.allowances.meal) {
          allowances.push({
            type: 'Meal',
            amount: Number(values.allowances.meal),
            description: 'Meal allowance'
          });
        }
        if (values.allowances.other) {
          allowances.push({
            type: 'Other',
            amount: Number(values.allowances.other),
            description: 'Other allowances'
          });
        }
      }

      // Extract and convert deductions
      const deductions = [];
      if (values.deductions) {
        if (values.deductions.tax) {
          deductions.push({
            type: 'Tax',
            amount: Number(values.deductions.tax),
            description: 'Income tax'
          });
        }
        if (values.deductions.insurance) {
          deductions.push({
            type: 'Insurance',
            amount: Number(values.deductions.insurance),
            description: 'Health insurance'
          });
        }
        if (values.deductions.other) {
          deductions.push({
            type: 'Other',
            amount: Number(values.deductions.other),
            description: 'Other deductions'
          });
        }
      }

      // Calculate totals
      const totalAllowances = allowances.reduce((sum, a) => sum + a.amount, 0);
      const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
      const netSalary = Number(values.basicSalary) + totalAllowances - totalDeductions;

      const payload = {
        employee: values.employee,
        month: values.month || selectedMonth.getMonth() + 1,
        year: values.year || selectedMonth.getFullYear(),
        basicSalary: Number(values.basicSalary),
        allowances,
        deductions,
        netSalary,
        status: selectedPayroll?.status || 'DRAFT' // Preserve existing status or set to DRAFT
      };

      if (selectedPayroll) {
        // For updates, we need to include all fields
        const updatePayload = {
          ...payload,
          status: selectedPayroll.status,
          paymentDate: selectedPayroll.paymentDate,
          paymentMethod: selectedPayroll.paymentMethod,
          remarks: selectedPayroll.remarks
        };
        await api.put(`/payroll/${selectedPayroll._id}`, updatePayload);
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

  const handleGeneratePayroll = async (type = 'bulk') => {
    try {
      if (type === 'bulk') {
        // Generate payroll for all employees
        const response = await api.post('/payroll/generate', {
          month: selectedMonth.getMonth() + 1,
          year: selectedMonth.getFullYear(),
        });
        
        // Show appropriate message based on response
        if (response.data.payrolls.length === 0) {
          message.info(response.data.message);
        } else {
          message.success(response.data.message);
        }
      } else {
        // Generate payroll for selected employees
        if (selectedRows.length === 0) {
          message.warning('Please select employees to generate payroll');
          return;
        }
        const response = await api.post('/payroll/generate-selected', {
          employeeIds: selectedRows,
          month: selectedMonth.getMonth() + 1,
          year: selectedMonth.getFullYear(),
        });
        
        if (response.data.payrolls.length === 0) {
          message.info(response.data.message);
        } else {
          message.success(response.data.message);
        }
      }
      fetchPayrolls();
    } catch (err) {
      // Only show error for actual errors, not for business cases
      if (err.response?.status === 400) {
        message.error(err.response?.data?.message || 'Failed to generate payroll');
      } else {
        message.error('An unexpected error occurred');
      }
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
    if (!allowances || !Array.isArray(allowances)) return 0;
    return allowances.reduce((sum, allowance) => sum + (Number(allowance.amount) || 0), 0);
  };

  const calculateTotalDeductions = (deductions) => {
    if (!deductions || !Array.isArray(deductions)) return 0;
    return deductions.reduce((sum, deduction) => sum + (Number(deduction.amount) || 0), 0);
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

  const handleViewPayslip = async (record) => {
    try {
      const response = await api.get(`/payroll/${record._id}`);
      setSelectedPayslip(response.data);
      setPayslipModalVisible(true);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to fetch payslip details');
    }
  };

  const renderPayslipModal = () => {
    if (!selectedPayslip) return null;

    // Calculate totals
    const totalAllowances = calculateTotalAllowances(selectedPayslip.allowances);
    const totalDeductions = calculateTotalDeductions(selectedPayslip.deductions);
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
          <Descriptions.Item label="Employee">
            {selectedPayslip.user?.firstName} {selectedPayslip.user?.lastName}
          </Descriptions.Item>
          <Descriptions.Item label="Period">
            {selectedPayslip.month}/{selectedPayslip.year}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            {getStatusTag(selectedPayslip.status)}
          </Descriptions.Item>
          <Descriptions.Item label="Basic Salary">
            {formatCurrency(selectedPayslip.basicSalary)}
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
      title: 'Status',
      key: 'status',
      render: (_, record) => getStatusTag(record.status),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status !== 'Paid' && record.status !== 'Rejected' && <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          />}
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewPayslip(record)}
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

  const handleMonthChange = (date) => {
    if (date) {
      setSelectedMonth(date.toDate());
    } else {
      // If date is cleared, set to current month
      setSelectedMonth(new Date());
    }
  };

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
            <DatePicker.MonthPicker
              value={selectedMonth ? dayjs(selectedMonth) : null}
              onChange={handleMonthChange}
              style={{ width: 200 }}
              allowClear={false}
            />
            <Button
              type="primary"
              icon={<SyncOutlined />}
              onClick={() => handleGeneratePayroll('bulk')}
            >
              Generate All Payrolls
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
            >
              Add Manual Payroll
            </Button>
          </Space>
        </div>

        {error && <Alert message={error} type="error" showIcon />}

        <Card>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Button
                onClick={() => setStatusUpdateVisible(true)}
                disabled={selectedRows.length === 0}
              >
                Update Status
              </Button>
            </Space>
          </div>

          <Table
            rowSelection={{
              type: 'checkbox',
              onChange: (selectedRowKeys) => setSelectedRows(selectedRowKeys),
            }}
            columns={columns}
            dataSource={payrolls}
            rowKey="_id"
            loading={loading}
            scroll={{ x: true }}
          />
        </Card>

        {/* Manual Payroll Entry Modal */}
        <Modal
          title={selectedPayroll ? 'Edit Payroll' : 'Add Manual Payroll'}
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
                  <Select placeholder="Select employee">
                    {employees.map(emp => (
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
                    formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    min={0}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Title level={5}>Allowances</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name={['allowances', 'housing']} label="Housing Allowance">
                  <InputNumber
                    style={{ width: '100%' }}
                    formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    min={0}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['allowances', 'transport']} label="Transport Allowance">
                  <InputNumber
                    style={{ width: '100%' }}
                    formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    min={0}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Title level={5}>Deductions</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name={['deductions', 'tax']} label="Tax">
                  <InputNumber
                    style={{ width: '100%' }}
                    formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    min={0}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['deductions', 'insurance']} label="Insurance">
                  <InputNumber
                    style={{ width: '100%' }}
                    formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    min={0}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {selectedPayroll ? 'Update' : 'Create'} Payroll
                </Button>
                <Button onClick={handleCloseModal}>Cancel</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Status Update Modal */}
        <Modal
          title="Update Payroll Status"
          open={statusUpdateVisible}
          onCancel={() => setStatusUpdateVisible(false)}
          footer={null}
        >
          <Form
            form={updateForm}
            layout="vertical"
            onFinish={handleBulkStatusUpdate}
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
              noStyle
              shouldUpdate={(prevValues, currentValues) => 
                prevValues.status !== currentValues.status
              }
            >
              {({ getFieldValue }) => 
                getFieldValue('status') === 'Paid' ? (
                  <>
                    <Form.Item
                      name="paymentDate"
                      label="Payment Date"
                      rules={[{ required: true, message: 'Please select payment date' }]}
                    >
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                      name="paymentMethod"
                      label="Payment Method"
                      rules={[{ required: true, message: 'Please select payment method' }]}
                    >
                      <Select>
                        <Option value="Bank Transfer">Bank Transfer</Option>
                        <Option value="Cash">Cash</Option>
                        <Option value="Check">Check</Option>
                      </Select>
                    </Form.Item>
                  </>
                ) : null
              }
            </Form.Item>

            <Form.Item name="remarks" label="Remarks">
              <Input.TextArea />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Update Status
                </Button>
                <Button onClick={() => setStatusUpdateVisible(false)}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Space>
      {renderPayslipModal()}
    </div>
  );
};

export default Payroll; 