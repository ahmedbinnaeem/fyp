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
  Space,
  message,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  LockOutlined,
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
  const [settings, setSettings] = useState(null);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    if (user) {
      // Extract username from email for editing
      const domain = settings?.companyName ? 
        `@${settings.companyName.toLowerCase().replace(/\s+/g, '')}.com` : '';
      const username = user.email.replace(domain, '');

      form.setFieldsValue({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: username,
        phone: user.phoneNumber || '',
        address: user.address || '',
      });
    }
    fetchSettings();
  }, [user, form, settings]);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings(response.data);
    } catch (err) {
      message.error('Failed to fetch company settings');
    }
  };

  const validateEmail = (_, value) => {
    if (!value) {
      return Promise.reject('Please enter username');
    }

    if (!settings || !settings.companyName) {
      return Promise.reject('Company settings not configured');
    }

    // Skip validation for admin users
    if (user.role === 'admin') {
      return Promise.resolve();
    }

    // Only validate the username part
    if (!/^[a-zA-Z0-9._-]+$/.test(value)) {
      return Promise.reject('Username can only contain letters, numbers, dots, underscores and hyphens');
    }

    return Promise.resolve();
  };

  const handleUpdateProfile = async (values) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { phone, ...profileData } = values;

      // Construct the full email with domain
      const domain = `@${settings.companyName.toLowerCase().replace(/\s+/g, '')}.com`;
      profileData.email = values.email + domain;

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

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <Spin size="large" />
      </div>
    );
  }

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
                {user.firstName[0]}
                {user.lastName[0]}
              </Avatar>
              <Title level={4} style={{ marginBottom: 4 }}>
                {user.firstName} {user.lastName}
              </Title>
              <Text type="secondary" style={{ textTransform: 'capitalize' }}>
                {user.position || user.role}
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card title="Personal Information">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdateProfile}
              initialValues={{
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phoneNumber || '',
                address: user.address || '',
              }}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="firstName"
                    label="First Name"
                    rules={[{ required: true, message: 'Please input your first name!' }]}
                  >
                    <Input prefix={<UserOutlined />} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="lastName"
                    label="Last Name"
                    rules={[{ required: true, message: 'Please input your last name!' }]}
                  >
                    <Input prefix={<UserOutlined />} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="email"
                label="Email Username"
                rules={[
                  { required: true, message: 'Please enter username' },
                  { validator: validateEmail }
                ]}
                extra={user.role !== 'admin' && settings?.companyName ? 
                  `Enter username only - full email will be username@${settings.companyName.toLowerCase().replace(/\s+/g, '')}.com` : 
                  undefined}
              >
                <Input 
                  prefix={<MailOutlined />}
                  placeholder="username"
                  addonAfter={settings?.companyName ? 
                    `@${settings.companyName.toLowerCase().replace(/\s+/g, '')}.com` : 
                    'Loading...'}
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