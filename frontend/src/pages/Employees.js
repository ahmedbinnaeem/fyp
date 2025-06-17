import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Typography,
  Spin,
  Alert,
  Popconfirm,
  message,
  InputNumber,
  Select,
  Row,
  Col,
  Tag,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import api from '../utils/axios';

const { Title } = Typography;
const { Option } = Select;

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [settings, setSettings] = useState(null);
  const [form] = Form.useForm();

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setEmployees(response.data);
      setError(null);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to fetch employees');
      setError(err.response?.data?.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings(response.data);
    } catch (error) {
      message.error('Failed to fetch company settings');
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchSettings();
  }, []);

  const handleOpenModal = (employee = null) => {
    setSelectedEmployee(employee);
    if (employee) {
      const domain = settings?.companyName ? 
        `@${settings.companyName.toLowerCase().replace(/\s+/g, '')}.com` : '';
      const username = employee.email.replace(domain, '');
      
      form.setFieldsValue({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: username,
        position: employee.position,
        department: employee.department,
        basicSalary: employee.basicSalary,
        gender: employee.gender,
      });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedEmployee(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      if (!settings?.companyName) {
        message.error('Company settings not configured');
        return;
      }

      const domain = `@${settings.companyName.toLowerCase().replace(/\s+/g, '')}.com`;
      const fullEmail = values.email + domain;
      
      const submitData = {
        ...values,
        email: fullEmail
      };

      if (selectedEmployee) {
        await api.put(`/users/${selectedEmployee._id}`, submitData);
        message.success('Employee updated successfully');
      } else {
        await api.post('/users', submitData);
        message.success('Employee added successfully');
      }
      handleCloseModal();
      fetchEmployees();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to save employee');
    }
  };

  const handleDelete = async (id) => {
      try {
        await api.delete(`/users/${id}`);
      message.success('Employee deleted successfully');
        fetchEmployees();
      } catch (err) {
      message.error(err.response?.data?.message || 'Failed to delete employee');
    }
  };

  const validateEmail = (_, value) => {
    if (!value) {
      return Promise.reject('Please enter username');
    }

    if (!settings || !settings.companyName) {
      return Promise.reject('Company settings not configured');
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(value)) {
      return Promise.reject('Username can only contain letters, numbers, dots, underscores and hyphens');
    }

    return Promise.resolve();
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'firstName',
      key: 'name',
      render: (_, record) => `${record.firstName} ${record.lastName}`,
    },
    {
      title: 'Employee ID',
      dataIndex: 'employeeId',
      key: 'employeeId',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender) => (
        <Tag color={gender === 'Male' ? 'blue' : 'pink'}>
          {gender}
        </Tag>
      ),
    },
    {
      title: 'Basic Salary',
      dataIndex: 'basicSalary',
      key: 'basicSalary',
      render: (salary) => `$${salary.toLocaleString()}`,
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
          <Popconfirm
            title="Are you sure you want to delete this employee?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
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
          <Title level={2}>Employees Management</Title>
        <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
        >
          Add Employee
        </Button>
        </div>

        <Card>
          <Table
            columns={columns}
            dataSource={employees}
            rowKey="_id"
            scroll={{ x: true }}
          />
        </Card>

        <Modal
          title={selectedEmployee ? 'Edit Employee' : 'New Employee'}
          open={modalVisible}
          onCancel={handleCloseModal}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={selectedEmployee || {}}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
              name="firstName"
              label="First Name"
                  rules={[{ required: true, message: 'Please enter first name' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
              name="lastName"
              label="Last Name"
                  rules={[{ required: true, message: 'Please enter last name' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="gender"
              label="Gender"
              rules={[{ required: true, message: 'Please select gender' }]}
            >
              <Select>
                <Option value="Male">Male</Option>
                <Option value="Female">Female</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="email"
              label="Email Username"
              rules={[
                { required: true, message: 'Please enter username' },
                { validator: validateEmail }
              ]}
              extra={settings?.companyName ? 
                `Enter username only - full email will be username@${settings.companyName.toLowerCase().replace(/\s+/g, '')}.com` : 
                'Loading company settings...'}
            >
              <Input 
                placeholder="username"
                addonAfter={settings?.companyName ? 
                  `@${settings.companyName.toLowerCase().replace(/\s+/g, '')}.com` : 
                  'Loading...'}
              />
            </Form.Item>

            <Form.Item
              name="position"
              label="Position"
              rules={[{ required: true, message: 'Please enter position' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="department"
              label="Department"
              rules={[{ required: true, message: 'Please enter department' }]}
            >
              <Input />
            </Form.Item>

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

            {!selectedEmployee && (
              <Form.Item
              name="password"
              label="Password"
                rules={[
                  { required: true, message: 'Please enter password' },
                  { min: 6, message: 'Password must be at least 6 characters' },
                ]}
              >
                <Input.Password />
              </Form.Item>
            )}

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
            {selectedEmployee ? 'Update' : 'Add'}
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

export default Employees; 