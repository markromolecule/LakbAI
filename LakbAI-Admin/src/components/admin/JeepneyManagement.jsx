import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, message, Space, Tag, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, QrcodeOutlined, UserOutlined } from '@ant-design/icons';
import RouteQRGeneration from './RouteQRGeneration';

const { Option } = Select;

const JeepneyManagement = () => {
  const [jeepneys, setJeepneys] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [assignDriverModalVisible, setAssignDriverModalVisible] = useState(false);
  const [routeQRModalVisible, setRouteQRModalVisible] = useState(false);
  const [editingJeepney, setEditingJeepney] = useState(null);
  const [selectedJeepney, setSelectedJeepney] = useState(null);
  const [qrJeepney, setQrJeepney] = useState(null);
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();

  // Mock data - in production, fetch from API
  useEffect(() => {
    fetchJeepneys();
    fetchDrivers();
  }, []);

  const fetchJeepneys = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockJeepneys = [
        {
          id: 'jeep_001',
          jeepneyNumber: 'LKB-001',
          plateNumber: 'ABC 1234',
          model: 'Toyota Coaster',
          capacity: 18,
          route: 'Robinson Tejero - Robinson Pala-pala',
          status: 'active',
          assignedDriver: {
            id: 'driver_001',
            name: 'Juan Dela Cruz',
            license: 'D123-456-789'
          },
          createdAt: '2024-01-15',
          lastMaintenance: '2024-01-10'
        },
        {
          id: 'jeep_002',
          jeepneyNumber: 'LKB-002',
          plateNumber: 'DEF 5678',
          model: 'Toyota Coaster',
          capacity: 20,
          route: 'Ayala Center - Lahug',
          status: 'active',
          assignedDriver: null,
          createdAt: '2024-01-12',
          lastMaintenance: '2024-01-08'
        }
      ];
      setJeepneys(mockJeepneys);
    } catch (error) {
      message.error('Failed to fetch jeepneys');
    }
    setLoading(false);
  };

  const fetchDrivers = async () => {
    try {
      // Mock data - replace with actual API call
      const mockDrivers = [
        {
          id: 'driver_001',
          name: 'Juan Dela Cruz',
          license: 'D123-456-789',
          phone: '+63 912 345 6789',
          email: 'juan@lakbai.com',
          status: 'active',
          assignedJeepney: 'jeep_001'
        },
        {
          id: 'driver_002',
          name: 'Maria Santos',
          license: 'D987-654-321',
          phone: '+63 998 765 4321',
          email: 'maria@lakbai.com',
          status: 'active',
          assignedJeepney: null
        },
        {
          id: 'driver_003',
          name: 'Pedro Garcia',
          license: 'D555-666-777',
          phone: '+63 917 888 9999',
          email: 'pedro@lakbai.com',
          status: 'active',
          assignedJeepney: null
        }
      ];
      setDrivers(mockDrivers);
    } catch (error) {
      message.error('Failed to fetch drivers');
    }
  };

  const handleAddJeepney = () => {
    setEditingJeepney(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditJeepney = (jeepney) => {
    setEditingJeepney(jeepney);
    form.setFieldsValue({
      jeepneyNumber: jeepney.jeepneyNumber,
      plateNumber: jeepney.plateNumber,
      model: jeepney.model,
      capacity: jeepney.capacity,
      route: jeepney.route,
      status: jeepney.status
    });
    setModalVisible(true);
  };

  const handleDeleteJeepney = async (jeepneyId) => {
    try {
      // API call to delete jeepney
      setJeepneys(jeepneys.filter(j => j.id !== jeepneyId));
      message.success('Jeepney deleted successfully');
    } catch (error) {
      message.error('Failed to delete jeepney');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingJeepney) {
        // Update existing jeepney
        const updatedJeepneys = jeepneys.map(j => 
          j.id === editingJeepney.id 
            ? { ...j, ...values, updatedAt: new Date().toISOString() }
            : j
        );
        setJeepneys(updatedJeepneys);
        message.success('Jeepney updated successfully');
      } else {
        // Add new jeepney
        const newJeepney = {
          id: `jeep_${Date.now()}`,
          ...values,
          assignedDriver: null,
          createdAt: new Date().toISOString(),
          lastMaintenance: new Date().toISOString()
        };
        setJeepneys([...jeepneys, newJeepney]);
        message.success('Jeepney added successfully');
      }
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to save jeepney');
    }
  };

  const handleAssignDriver = (jeepney) => {
    setSelectedJeepney(jeepney);
    assignForm.setFieldsValue({
      driverId: jeepney.assignedDriver?.id || null
    });
    setAssignDriverModalVisible(true);
  };

  const handleDriverAssignment = async (values) => {
    try {
      const { driverId } = values;
      const selectedDriver = drivers.find(d => d.id === driverId);
      
      // Update jeepney with assigned driver
      const updatedJeepneys = jeepneys.map(j => 
        j.id === selectedJeepney.id 
          ? { 
              ...j, 
              assignedDriver: selectedDriver ? {
                id: selectedDriver.id,
                name: selectedDriver.name,
                license: selectedDriver.license
              } : null
            }
          : j
      );
      
      // Update drivers assignment status
      const updatedDrivers = drivers.map(d => ({
        ...d,
        assignedJeepney: d.id === driverId ? selectedJeepney.id : 
                        (d.assignedJeepney === selectedJeepney.id ? null : d.assignedJeepney)
      }));
      
      setJeepneys(updatedJeepneys);
      setDrivers(updatedDrivers);
      setAssignDriverModalVisible(false);
      message.success('Driver assignment updated successfully');
    } catch (error) {
      message.error('Failed to assign driver');
    }
  };

  const generateRouteQR = (jeepney) => {
    setQrJeepney(jeepney);
    setRouteQRModalVisible(true);
  };

  const columns = [
    {
      title: 'Jeepney Number',
      dataIndex: 'jeepneyNumber',
      key: 'jeepneyNumber',
      render: (text) => <strong style={{ color: '#1890ff' }}>{text}</strong>
    },
    {
      title: 'Plate Number',
      dataIndex: 'plateNumber',
      key: 'plateNumber'
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model'
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (capacity) => `${capacity} passengers`
    },
    {
      title: 'Route',
      dataIndex: 'route',
      key: 'route',
      render: (route) => <Tag color="blue">{route}</Tag>
    },
    {
      title: 'Assigned Driver',
      dataIndex: 'assignedDriver',
      key: 'assignedDriver',
      render: (driver) => (
        driver ? (
          <div>
            <div style={{ fontWeight: 500 }}>{driver.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{driver.license}</div>
          </div>
        ) : (
          <Tag color="orange">No Driver Assigned</Tag>
        )
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<UserOutlined />} 
            onClick={() => handleAssignDriver(record)}
            title="Assign Driver"
          >
            Assign
          </Button>
          <Button 
            icon={<QrcodeOutlined />} 
            onClick={() => generateRouteQR(record)}
            title="Generate Route QR"
          >
            QR
          </Button>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEditJeepney(record)}
            title="Edit Jeepney"
          />
          <Popconfirm
            title="Are you sure you want to delete this jeepney?"
            onConfirm={() => handleDeleteJeepney(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              icon={<DeleteOutlined />} 
              danger
              title="Delete Jeepney"
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const availableDrivers = drivers.filter(d => !d.assignedJeepney || d.assignedJeepney === selectedJeepney?.id);

  return (
    <div>
      <Card 
        title="Jeepney Management" 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddJeepney}
          >
            Add Jeepney
          </Button>
        }
      >
        <Table 
          columns={columns} 
          dataSource={jeepneys} 
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Add/Edit Jeepney Modal */}
      <Modal
        title={editingJeepney ? 'Edit Jeepney' : 'Add New Jeepney'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="jeepneyNumber"
            label="Jeepney Number"
            rules={[{ required: true, message: 'Please enter jeepney number' }]}
          >
            <Input placeholder="e.g., LKB-003" />
          </Form.Item>

          <Form.Item
            name="plateNumber"
            label="Plate Number"
            rules={[{ required: true, message: 'Please enter plate number' }]}
          >
            <Input placeholder="e.g., ABC 1234" />
          </Form.Item>

          <Form.Item
            name="model"
            label="Model"
            rules={[{ required: true, message: 'Please enter jeepney model' }]}
          >
            <Select placeholder="Select jeepney model">
              <Option value="Toyota Coaster">Toyota Coaster</Option>
              <Option value="Isuzu Elf">Isuzu Elf</Option>
              <Option value="Mitsubishi Rosa">Mitsubishi Rosa</Option>
              <Option value="Hyundai County">Hyundai County</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="capacity"
            label="Passenger Capacity"
            rules={[{ required: true, message: 'Please enter passenger capacity' }]}
          >
            <Input type="number" placeholder="e.g., 18" min="10" max="30" />
          </Form.Item>

          <Form.Item
            name="route"
            label="Route"
            rules={[{ required: true, message: 'Please enter route' }]}
          >
            <Select placeholder="Select route">
              <Option value="Robinson Tejero - Robinson Pala-pala">Robinson Tejero - Robinson Pala-pala</Option>
              <Option value="Ayala Center - Lahug">Ayala Center - Lahug</Option>
              <Option value="SM City Cebu - IT Park">SM City Cebu - IT Park</Option>
              <Option value="Colon Street - USC Main">Colon Street - USC Main</Option>
              <Option value="Fuente Circle - Capitol Site">Fuente Circle - Capitol Site</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select placeholder="Select status">
              <Option value="active">Active</Option>
              <Option value="maintenance">Under Maintenance</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingJeepney ? 'Update Jeepney' : 'Add Jeepney'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Assign Driver Modal */}
      <Modal
        title={`Assign Driver to ${selectedJeepney?.jeepneyNumber}`}
        open={assignDriverModalVisible}
        onCancel={() => setAssignDriverModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={assignForm}
          layout="vertical"
          onFinish={handleDriverAssignment}
        >
          <Form.Item
            name="driverId"
            label="Select Driver"
            rules={[{ required: false }]}
          >
            <Select 
              placeholder="Select a driver (or leave empty to unassign)"
              allowClear
            >
              {availableDrivers.map(driver => (
                <Option key={driver.id} value={driver.id}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{driver.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      License: {driver.license} | Phone: {driver.phone}
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Assign Driver
              </Button>
              <Button onClick={() => setAssignDriverModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Route QR Generation Modal */}
      <RouteQRGeneration
        visible={routeQRModalVisible}
        onClose={() => setRouteQRModalVisible(false)}
        jeepney={qrJeepney}
      />
    </div>
  );
};

export default JeepneyManagement;
