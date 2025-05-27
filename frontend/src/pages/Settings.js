import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Button,
  Typography,
  Spin,
  Alert,
  Switch,
  TimePicker,
  Select,
  Checkbox,
  Space,
  Divider,
  InputNumber,
  message,
} from 'antd';
import api from '../utils/axios';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();

  const workingDaysOptions = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  const payrollCycleOptions = ['weekly', 'biweekly', 'monthly'];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings');
      
      // Convert time strings to dayjs objects and ensure proper structure
      const formData = {
        ...response.data,
        workingHours: {
          start: response.data.workingHours?.start ? dayjs(response.data.workingHours.start, 'HH:mm') : null,
          end: response.data.workingHours?.end ? dayjs(response.data.workingHours.end, 'HH:mm') : null,
        },
        leaveSettings: {
          annualLeaveQuota: response.data.leaveSettings?.annualLeaveQuota || 14,
          sickLeaveQuota: response.data.leaveSettings?.sickLeaveQuota || 7,
          personalLeaveQuota: response.data.leaveSettings?.personalLeaveQuota || 5,
          maternityLeaveQuota: response.data.leaveSettings?.maternityLeaveQuota || 90,
          paternityLeaveQuota: response.data.leaveSettings?.paternityLeaveQuota || 14,
          unpaidLeaveQuota: response.data.leaveSettings?.unpaidLeaveQuota || 30,
          carryForwardLimit: response.data.leaveSettings?.carryForwardLimit || 5
        }
      };

      console.log('Setting form values:', formData);
      form.setFieldsValue(formData);
      setError(null);
    } catch (err) {
      console.error('Error fetching settings:', err);
      message.error(err.response?.data?.message || 'Failed to fetch settings');
      setError(err.response?.data?.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setError(null);

      // Format working hours and ensure all values are properly structured
      const formattedValues = {
        ...values,
        workingHours: {
          start: dayjs.isDayjs(values.workingHours?.start) ? values.workingHours.start.format('HH:mm') : null,
          end: dayjs.isDayjs(values.workingHours?.end) ? values.workingHours.end.format('HH:mm') : null,
        }
      };

      // Ensure all leave settings are numbers and properly nested
      if (!formattedValues.leaveSettings) {
        formattedValues.leaveSettings = {};
      }

      const leaveTypes = [
        'annualLeaveQuota',
        'sickLeaveQuota',
        'personalLeaveQuota',
        'maternityLeaveQuota',
        'paternityLeaveQuota',
        'unpaidLeaveQuota',
        'carryForwardLimit'
      ];

      leaveTypes.forEach(type => {
        console.log({type})
        formattedValues.leaveSettings[type] = Number(values.leaveSettings?.[type]);
      });
      

      // Log the values being sent for debugging
      console.log('Submitting settings:', formattedValues);

      const response = await api.put('/settings', formattedValues);
      console.log('Settings update response:', response.data);
      
      message.success('Settings updated successfully');
      
      // Refresh settings after update
      await fetchSettings();
    } catch (err) {
      console.error('Settings update error:', err);
      message.error(err.response?.data?.message || 'Failed to update settings');
      setError(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !form.getFieldValue('companyName')) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>System Settings</Title>

      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 24 }} />}


        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            emailNotifications: {
              leaveRequests: true,
              payrollGeneration: true,
              attendanceAlerts: true,
            },
            workingDays: [],
            payrollSettings: {
              payrollCycle: 'monthly',
            },
            leaveSettings: {
              annualLeaveQuota: 14,
              sickLeaveQuota: 7,
              personalLeaveQuota: 5,
              maternityLeaveQuota: 90,
              paternityLeaveQuota: 14,
              unpaidLeaveQuota: 30,
              carryForwardLimit: 5
            }
          }}
        >
          <Row gutter={[24, 24]}>
            {/* Company Information */}
            <Col xs={24} lg={12}>
              <Card title="Company Information" bordered={false} style={{ height: '100%' }}>
                <Form.Item
                  name="companyName"
                  label="Company Name"
                  rules={[{ required: true, message: 'Please enter company name' }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  name="companyEmail"
                  label="Company Email"
                  rules={[
                    { required: true, message: 'Please enter company email' },
                    { type: 'email', message: 'Please enter a valid email' },
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  name="companyPhone"
                  label="Company Phone"
                  rules={[{ required: true, message: 'Please enter company phone' }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  name="companyAddress"
                  label="Company Address"
                  rules={[{ required: true, message: 'Please enter company address' }]}
                >
                  <TextArea rows={3} />
                </Form.Item>
              </Card>
            </Col>

            {/* Working Hours & Days */}
            <Col xs={24} lg={12}>
              <Card title="Working Hours & Days" bordered={false} style={{ height: '100%' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name={['workingHours', 'start']}
                      label="Start Time"
                      rules={[{ required: true, message: 'Please select start time' }]}
                    >
                      <TimePicker format="HH:mm" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name={['workingHours', 'end']}
                      label="End Time"
                      rules={[{ required: true, message: 'Please select end time' }]}
                    >
                      <TimePicker format="HH:mm" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="workingDays" label="Working Days">
                  <Checkbox.Group style={{ width: '100%' }}>
                    <Row gutter={[8, 8]}>
                      {workingDaysOptions.map(day => (
                        <Col span={12} key={day}>
                          <Checkbox value={day}>{day}</Checkbox>
                        </Col>
                      ))}
                    </Row>
                  </Checkbox.Group>
                </Form.Item>
              </Card>
            </Col>

            {/* Leave Settings */}
            <Col xs={24} lg={12}>
              <Card title="Leave Settings" bordered={false} style={{ height: '100%' }}>
                <Form.Item
                  name={['leaveSettings', 'annualLeaveQuota']}
                  label="Annual Leave Quota"
                  rules={[{ required: true, message: 'Please enter annual leave quota' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                  name={['leaveSettings', 'sickLeaveQuota']}
                  label="Sick Leave Quota"
                  rules={[{ required: true, message: 'Please enter sick leave quota' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                  name={['leaveSettings', 'personalLeaveQuota']}
                  label="Personal Leave Quota"
                  rules={[{ required: true, message: 'Please enter personal leave quota' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                  name={['leaveSettings', 'maternityLeaveQuota']}
                  label="Maternity Leave Quota"
                  rules={[{ required: true, message: 'Please enter maternity leave quota' }]}
                  tooltip="This will be available only for female employees"
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                  name={['leaveSettings', 'paternityLeaveQuota']}
                  label="Paternity Leave Quota"
                  rules={[{ required: true, message: 'Please enter paternity leave quota' }]}
                  tooltip="This will be available only for male employees"
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                  name={['leaveSettings', 'unpaidLeaveQuota']}
                  label="Unpaid Leave Quota"
                  rules={[{ required: true, message: 'Please enter unpaid leave quota' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                  name={['leaveSettings', 'carryForwardLimit']}
                  label="Carry Forward Limit"
                  rules={[{ required: true, message: 'Please enter carry forward limit' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Card>
            </Col>

            {/* Payroll Settings */}
            <Col xs={24} lg={12}>
              <Card title="Payroll Settings" bordered={false} style={{ height: '100%' }}>
                <Form.Item
                  name={['payrollSettings', 'payrollCycle']}
                  label="Payroll Cycle"
                  rules={[{ required: true, message: 'Please select payroll cycle' }]}
                >
                  <Select>
                    {payrollCycleOptions.map(cycle => (
                      <Select.Option key={cycle} value={cycle}>
                        {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name={['payrollSettings', 'payDay']}
                  label="Pay Day"
                  rules={[{ required: true, message: 'Please enter pay day' }]}
                >
                  <InputNumber min={1} max={31} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                  name={['payrollSettings', 'taxRate']}
                  label="Tax Rate (%)"
                  rules={[{ required: true, message: 'Please enter tax rate' }]}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    style={{ width: '100%' }}
                    formatter={value => `${value}%`}
                    parser={value => value.replace('%', '')}
                  />
                </Form.Item>

                <Form.Item
                  name={['payrollSettings', 'overtimeRate']}
                  label="Overtime Rate"
                  rules={[{ required: true, message: 'Please enter overtime rate' }]}
                >
                  <InputNumber
                    min={1}
                    step={0.5}
                    style={{ width: '100%' }}
                    formatter={value => `${value}x`}
                    parser={value => value.replace('x', '')}
                  />
                </Form.Item>
              </Card>
            </Col>

            {/* Email Notifications */}
            {/* <Col xs={24}>
              <Card title="Email Notifications" bordered={false}>
                <Row gutter={[24, 16]}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name={['emailNotifications', 'leaveRequests']}
                      valuePropName="checked"
                      label="Leave Requests"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name={['emailNotifications', 'payrollGeneration']}
                      valuePropName="checked"
                      label="Payroll Generation"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name={['emailNotifications', 'attendanceAlerts']}
                      valuePropName="checked"
                      label="Attendance Alerts"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col> */}
          </Row>

          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Button type="primary" htmlType="submit" loading={loading}>
              Save Settings
            </Button>
          </div>
        </Form>
      </Space>
    </div>
  );
};

export default Settings; 