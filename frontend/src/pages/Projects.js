import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Typography,
  Tag,
  Spin,
  Alert,
  Popconfirm,
  message,
  InputNumber,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import api from '../utils/axios';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const statusOptions = ['Not Started', 'In Progress', 'On Hold', 'Completed'];

const getStatusTag = (status) => {
  const statusConfig = {
    'Completed': { color: 'success', icon: <CheckCircleOutlined /> },
    'In Progress': { color: 'processing', icon: <ClockCircleOutlined /> },
    'On Hold': { color: 'warning', icon: <PauseCircleOutlined /> },
    'Not Started': { color: 'default', icon: <StopOutlined /> },
  };

  const config = statusConfig[status] || { color: 'default', icon: null };
  return (
    <Tag color={config.color} icon={config.icon}>
      {status.toUpperCase()}
    </Tag>
  );
};

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [form] = Form.useForm();
  const { user } = useSelector((state) => state.auth);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const endpoint = user?.role === 'admin' ? '/projects' : '/projects/my-projects';
      const response = await api.get(endpoint);
      setProjects(response.data);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to fetch projects');
      setError(err.response?.data?.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  const fetchEmployees = useCallback(async () => {
    if (user?.role === 'admin') {
      try {
        const response = await api.get('/users');
        setEmployees(response.data);
      } catch (err) {
        message.error('Failed to fetch employees');
      }
    }
  }, [user?.role]);

  useEffect(() => {
    fetchProjects();
    if (user?.role === 'admin') {
      fetchEmployees();
    }
  }, [user, fetchProjects, fetchEmployees]);

  const handleOpenModal = (project = null) => {
    setSelectedProject(project);
    if (project) {
      form.setFieldsValue({
        ...project,
        dateRange: [dayjs(project.startDate), dayjs(project.endDate)],
        team: project.team.map(member => member._id),
      });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedProject(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      const [startDate, endDate] = values.dateRange;
      const formData = {
        ...values,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
      };
      delete formData.dateRange;

      if (selectedProject) {
        await api.put(`/projects/${selectedProject._id}`, formData);
        message.success('Project updated successfully');
      } else {
        await api.post('/projects', formData);
        message.success('Project created successfully');
      }
      handleCloseModal();
      fetchProjects();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to save project');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/projects/${id}`);
      message.success('Project deleted successfully');
      fetchProjects();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const columns = [
    {
      title: 'Project Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date) => dayjs(date).format('MM/DD/YYYY'),
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date) => dayjs(date).format('MM/DD/YYYY'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Team Members',
      dataIndex: 'team',
      key: 'team',
      render: (team) => team.map(member => `${member.firstName} ${member.lastName}`).join(', '),
    },
    {
      title: 'Team Lead',
      dataIndex: 'teamLead',
      key: 'teamLead',
      render: (teamLead) => `${teamLead?.firstName} ${teamLead?.lastName}`,
    },
    ...(user?.role === 'admin' ? [
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
              title="Are you sure you want to delete this project?"
              onConfirm={() => handleDelete(record._id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ] : []),
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
          <Title level={2}>
            {user?.role === 'admin' ? 'All Projects' : 'My Projects'}
          </Title>
          {user?.role === 'admin' && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
            >
              Add Project
            </Button>
          )}
        </div>

        <Card>
          <Table
            columns={columns}
            dataSource={projects}
            rowKey="_id"
            scroll={{ x: true }}
          />
        </Card>

        {user?.role === 'admin' && (
          <Modal
            title={selectedProject ? 'Edit Project' : 'New Project'}
            open={modalVisible}
            onCancel={handleCloseModal}
            footer={null}
            width={800}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                status: 'Not Started',
                progress: 0,
              }}
            >
              <Form.Item
                name="name"
                label="Project Name"
                rules={[{ required: true, message: 'Please enter project name' }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="description"
                label="Description"
                rules={[{ required: true, message: 'Please enter project description' }]}
              >
                <TextArea rows={4} />
              </Form.Item>

              <Form.Item
                name="dateRange"
                label="Project Duration"
                rules={[{ required: true, message: 'Please select project duration' }]}
              >
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select project status' }]}
              >
                <Select>
                  {statusOptions.map((status) => (
                    <Option key={status} value={status}>
                      {status}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="teamLead"
                label="Team Lead"
                rules={[{ required: true, message: 'Please select team lead' }]}
              >
                <Select>
                  {employees.map((emp) => (
                    <Option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="team"
                label="Team Members"
                rules={[{ required: true, message: 'Please select team members' }]}
              >
                <Select mode="multiple">
                  {employees.map((emp) => (
                    <Option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="budget"
                label="Budget"
                rules={[{ required: true, message: 'Please enter project budget' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>

              <Form.Item
                name="progress"
                label="Progress"
                rules={[{ required: true, message: 'Please enter project progress' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  formatter={(value) => `${value}%`}
                  parser={(value) => value.replace('%', '')}
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    {selectedProject ? 'Update' : 'Create'}
                  </Button>
                  <Button onClick={handleCloseModal}>Cancel</Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>
        )}
      </Space>
    </div>
  );
};

export default Projects; 