import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Space,
  Select,
  DatePicker,
  Rate,
  Row,
  Col,
  Typography,
  Divider,
  InputNumber,
  Card
} from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import api from '../../utils/axios';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const defaultCategories = [
  { name: 'Job Knowledge', score: 3, comments: '' },
  { name: 'Work Quality', score: 3, comments: '' },
  { name: 'Attendance & Punctuality', score: 3, comments: '' },
  { name: 'Communication', score: 3, comments: '' },
  { name: 'Teamwork', score: 3, comments: '' }
];

const PerformanceForm = ({ form, onSubmit, onCancel, initialValues }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await api.get('/users');
        setEmployees(response.data.filter(user => user.role !== 'admin'));
      } catch (err) {
        console.error('Failed to fetch employees:', err);
      }
    };
    fetchEmployees();
  }, []);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      await onSubmit(values);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        categories: defaultCategories,
        goals: [{ description: '', status: 'Not Started' }],
        strengths: [''],
        areasOfImprovement: [''],
        overallRating: 3
      }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="user"
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
            name="reviewDate"
            label="Review Date"
            rules={[{ required: true, message: 'Please select review date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="reviewPeriod"
        label="Review Period"
        rules={[{ required: true, message: 'Please select review period' }]}
      >
        <DatePicker.RangePicker style={{ width: '100%' }} />
      </Form.Item>

      <Title level={5}>Performance Categories</Title>
      <Form.List name="categories">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Card key={key} style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      {...restField}
                      name={[name, 'name']}
                      rules={[{ required: true, message: 'Category name is required' }]}
                    >
                      <Input placeholder="Category Name" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      {...restField}
                      name={[name, 'score']}
                      rules={[{ required: true, message: 'Rating is required' }]}
                    >
                      <Rate />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item {...restField} name={[name, 'comments']}>
                      <TextArea placeholder="Comments" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            ))}
            <Form.Item>
              <Button
                type="dashed"
                onClick={() => add({ name: '', score: 3, comments: '' })}
                block
                icon={<PlusOutlined />}
              >
                Add Category
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>

      <Title level={5}>Goals</Title>
      <Form.List name="goals">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Card key={key} style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      {...restField}
                      name={[name, 'description']}
                      rules={[{ required: true, message: 'Goal description is required' }]}
                    >
                      <TextArea placeholder="Goal Description" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      {...restField}
                      name={[name, 'status']}
                      rules={[{ required: true, message: 'Status is required' }]}
                    >
                      <Select>
                        <Option value="Not Started">Not Started</Option>
                        <Option value="In Progress">In Progress</Option>
                        <Option value="Completed">Completed</Option>
                        <Option value="Not Achieved">Not Achieved</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item {...restField} name={[name, 'targetDate']}>
                      <DatePicker style={{ width: '100%' }} placeholder="Target Date" />
                    </Form.Item>
                  </Col>
                  <Col span={2}>
                    <MinusCircleOutlined
                      onClick={() => remove(name)}
                      style={{ marginTop: 8 }}
                    />
                  </Col>
                </Row>
                <Form.Item {...restField} name={[name, 'comments']}>
                  <TextArea placeholder="Comments" />
                </Form.Item>
              </Card>
            ))}
            <Form.Item>
              <Button
                type="dashed"
                onClick={() => add({ description: '', status: 'Not Started' })}
                block
                icon={<PlusOutlined />}
              >
                Add Goal
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>

      <Title level={5}>Strengths</Title>
      <Form.List name="strengths">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Row key={key} gutter={16} style={{ marginBottom: 8 }}>
                <Col span={22}>
                  <Form.Item
                    {...restField}
                    name={[name]}
                    rules={[{ required: true, message: 'Strength is required' }]}
                  >
                    <Input placeholder="Enter strength" />
                  </Form.Item>
                </Col>
                <Col span={2}>
                  <MinusCircleOutlined
                    onClick={() => remove(name)}
                    style={{ marginTop: 8 }}
                  />
                </Col>
              </Row>
            ))}
            <Form.Item>
              <Button
                type="dashed"
                onClick={() => add('')}
                block
                icon={<PlusOutlined />}
              >
                Add Strength
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>

      <Title level={5}>Areas of Improvement</Title>
      <Form.List name="areasOfImprovement">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Row key={key} gutter={16} style={{ marginBottom: 8 }}>
                <Col span={22}>
                  <Form.Item
                    {...restField}
                    name={[name]}
                    rules={[{ required: true, message: 'Area of improvement is required' }]}
                  >
                    <Input placeholder="Enter area of improvement" />
                  </Form.Item>
                </Col>
                <Col span={2}>
                  <MinusCircleOutlined
                    onClick={() => remove(name)}
                    style={{ marginTop: 8 }}
                  />
                </Col>
              </Row>
            ))}
            <Form.Item>
              <Button
                type="dashed"
                onClick={() => add('')}
                block
                icon={<PlusOutlined />}
              >
                Add Area of Improvement
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>

      <Divider />

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="overallRating"
            label="Overall Rating"
            rules={[{ required: true, message: 'Overall rating is required' }]}
          >
            <Rate />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="nextReviewDate"
            label="Next Review Date"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="overallComments"
        label="Overall Comments"
        rules={[{ required: true, message: 'Overall comments are required' }]}
      >
        <TextArea rows={4} />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {initialValues ? 'Update' : 'Create'} Review
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default PerformanceForm; 