import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Form,
  Input,
  Button,
  Avatar,
  Spin,
  Alert,
  Row,
  Col,
  Divider,
  message,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  LockOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { getUserProfile } from '../store/slices/authSlice';
import api from '../utils/axios';

const { Title, Text } = Typography;

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phoneNumber || '',
        address: user.address || '',
        employeeId: user.employeeId || '',
      });
    }
  }, [user, form]);

  const handleUpdateProfile = async (values) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { phone, ...profileData } = values;

      // Map phone to phoneNumber
      if (phone) {
        profileData.phoneNumber = phone;
      }

      await api.put('/users/profile', profileData);
      await dispatch(getUserProfile()).unwrap();
      message.success('Profile updated successfully');
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await api.put('/users/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      message.success('Password changed successfully');
      passwordForm.resetFields();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <Title level={2}>My Profile</Title>

      {error && (
        <Alert message={error} type="error" showIcon style={{ marginBottom: 24 }} />
      )}

      {success && (
        <Alert message={success} type="success" showIcon style={{ marginBottom: 24 }} />
      )}

      <Row gutter={24}>
        <Col xs={24} md={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Avatar
                size={100}
                style={{
                  backgroundColor: '#1890ff',
                  fontSize: '2rem',
                  marginBottom: 16,
                }}
              >
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </Avatar>
              <Title level={4} style={{ marginBottom: 4 }}>
                {user?.firstName} {user?.lastName}
              </Title>
              <Text type="secondary" style={{ textTransform: 'capitalize' }}>
                {user?.position || user?.role}
              </Text>
              {user?.employeeId && (
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">
                    <IdcardOutlined /> Employee ID: {user.employeeId}
                  </Text>
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card title="Personal Information">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdateProfile}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="firstName"
                    label="First Name"
                    rules={[{ required: true, message: 'Please input your first name!' }]}
                  >
                    <Input 
                      prefix={<UserOutlined />} 
                      disabled={!isAdmin}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="lastName"
                    label="Last Name"
                    rules={[{ required: true, message: 'Please input your last name!' }]}
                  >
                    <Input 
                      prefix={<UserOutlined />} 
                      disabled={!isAdmin}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  disabled={!isAdmin}
                />
              </Form.Item>

              <Form.Item
                name="employeeId"
                label="Employee ID"
              >
                <Input 
                  prefix={<IdcardOutlined />} 
                  disabled={true}
                />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Phone Number"
              >
                <Input prefix={<PhoneOutlined />} />
              </Form.Item>

              <Form.Item
                name="address"
                label="Address"
              >
                <Input.TextArea prefix={<HomeOutlined />} rows={3} />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Update Profile
                </Button>
              </Form.Item>
            </Form>

            <Divider />

            <Title level={4}>Change Password</Title>
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
            >
              <Form.Item
                name="currentPassword"
                label="Current Password"
                rules={[{ required: true, message: 'Please input your current password!' }]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="New Password"
                rules={[
                  { required: true, message: 'Please input your new password!' },
                  { min: 6, message: 'Password must be at least 6 characters!' }
                ]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirm New Password"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Please confirm your new password!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('The two passwords do not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Change Password
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile; 