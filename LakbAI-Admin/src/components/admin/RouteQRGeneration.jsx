import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Form, Select, Space, Table, Tag, message, Divider, Row, Col, Typography, Image } from 'antd';
import { QrcodeOutlined, DownloadOutlined, PrinterOutlined, EyeOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Title, Text } = Typography;

const RouteQRGeneration = ({ visible, onClose, jeepney }) => {
  const [form] = Form.useForm();
  const [generatedQRs, setGeneratedQRs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewQR, setPreviewQR] = useState(null);

  // Predefined checkpoints for different routes
  const routeCheckpoints = {
    'Robinson Tejero - Robinson Pala-pala': [
      { id: 'rt_start', name: 'Robinson Galleria Cebu (Start)', coordinates: { lat: 10.3157, lng: 123.9054 }, type: 'start' },
      { id: 'rt_mid1', name: 'Ayala Center Cebu', coordinates: { lat: 10.3181, lng: 123.9068 }, type: 'checkpoint' },
      { id: 'rt_mid2', name: 'Colon Street', coordinates: { lat: 10.2952, lng: 123.9019 }, type: 'checkpoint' },
      { id: 'rt_end', name: 'Robinson Pala-pala (End)', coordinates: { lat: 10.2844, lng: 123.8856 }, type: 'end' }
    ],
    'Ayala Center - Lahug': [
      { id: 'al_start', name: 'Ayala Center Cebu (Start)', coordinates: { lat: 10.3181, lng: 123.9068 }, type: 'start' },
      { id: 'al_mid1', name: 'Fuente Circle', coordinates: { lat: 10.3156, lng: 123.8994 }, type: 'checkpoint' },
      { id: 'al_mid2', name: 'IT Park', coordinates: { lat: 10.3270, lng: 123.9070 }, type: 'checkpoint' },
      { id: 'al_end', name: 'Lahug Terminal (End)', coordinates: { lat: 10.3347, lng: 123.9143 }, type: 'end' }
    ],
    'SM City Cebu - IT Park': [
      { id: 'si_start', name: 'SM City Cebu (Start)', coordinates: { lat: 10.3089, lng: 123.8914 }, type: 'start' },
      { id: 'si_mid1', name: 'Capitol Site', coordinates: { lat: 10.3072, lng: 123.8964 }, type: 'checkpoint' },
      { id: 'si_end', name: 'IT Park (End)', coordinates: { lat: 10.3270, lng: 123.9070 }, type: 'end' }
    ]
  };

  const getCurrentCheckpoints = () => {
    return routeCheckpoints[jeepney?.route] || [];
  };

  const generateQRData = (checkpoint, jeepney, qrType) => {
    const baseData = {
      type: 'route_checkpoint',
      checkpointId: checkpoint.id,
      checkpointName: checkpoint.name,
      checkpointType: checkpoint.type,
      coordinates: checkpoint.coordinates,
      jeepneyNumber: jeepney.jeepneyNumber,
      route: jeepney.route,
      qrType: qrType, // 'driver_scan' or 'passenger_notification'
      timestamp: new Date().toISOString(),
      adminId: 'admin_001'
    };

    if (qrType === 'driver_scan') {
      return {
        ...baseData,
        purpose: 'driver_location_update',
        metadata: {
          triggerNotification: true,
          updateDriverLocation: true,
          logTrip: checkpoint.type === 'start' || checkpoint.type === 'end'
        }
      };
    } else {
      return {
        ...baseData,
        purpose: 'passenger_notification',
        metadata: {
          notifyPassengers: true,
          showJeepneyInfo: true,
          estimatedArrival: 'now'
        }
      };
    }
  };

  const generateQRImageURL = (qrData) => {
    const qrString = JSON.stringify(qrData);
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrString)}`;
  };

  const handleGenerateQRs = async (values) => {
    setLoading(true);
    try {
      const { qrType, selectedCheckpoints } = values;
      const checkpoints = getCurrentCheckpoints();
      const targetCheckpoints = selectedCheckpoints === 'all' 
        ? checkpoints 
        : checkpoints.filter(cp => selectedCheckpoints.includes(cp.id));

      const newQRs = targetCheckpoints.map(checkpoint => {
        const qrData = generateQRData(checkpoint, jeepney, qrType);
        const qrImageURL = generateQRImageURL(qrData);
        
        return {
          id: `qr_${checkpoint.id}_${qrType}_${Date.now()}`,
          checkpoint,
          qrType,
          qrData,
          qrImageURL,
          qrString: JSON.stringify(qrData),
          generatedAt: new Date().toISOString(),
          printUrl: `https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&data=${encodeURIComponent(JSON.stringify(qrData))}`
        };
      });

      setGeneratedQRs([...generatedQRs, ...newQRs]);
      message.success(`Generated ${newQRs.length} QR codes successfully`);
      form.resetFields();
    } catch (error) {
      message.error('Failed to generate QR codes');
      console.error('QR Generation Error:', error);
    }
    setLoading(false);
  };

  const handlePreviewQR = (qr) => {
    setPreviewQR(qr);
    setPreviewVisible(true);
  };

  const handleDownloadQR = (qr) => {
    const link = document.createElement('a');
    link.href = qr.printUrl;
    link.download = `${jeepney.jeepneyNumber}_${qr.checkpoint.name}_${qr.qrType}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('QR code downloaded');
  };

  const handlePrintQRs = () => {
    const printWindow = window.open('', '_blank');
    const qrCards = generatedQRs.map(qr => `
      <div style="page-break-after: always; text-align: center; padding: 20px; border: 1px solid #ccc; margin: 10px;">
        <h3>${jeepney.jeepneyNumber} - ${qr.checkpoint.name}</h3>
        <p><strong>Type:</strong> ${qr.qrType.replace('_', ' ').toUpperCase()}</p>
        <p><strong>Route:</strong> ${jeepney.route}</p>
        <img src="${qr.qrImageURL}" alt="QR Code" style="width: 200px; height: 200px;" />
        <p style="font-size: 12px; margin-top: 10px;">
          Generated: ${new Date(qr.generatedAt).toLocaleString()}
        </p>
        <p style="font-size: 10px; word-break: break-all; margin-top: 10px;">
          ${qr.qrString}
        </p>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>LakbAI Route QR Codes - ${jeepney.jeepneyNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>${qrCards}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const qrColumns = [
    {
      title: 'Checkpoint',
      dataIndex: 'checkpoint',
      key: 'checkpoint',
      render: (checkpoint) => (
        <div>
          <div style={{ fontWeight: 500 }}>{checkpoint.name}</div>
          <Tag color={checkpoint.type === 'start' ? 'green' : checkpoint.type === 'end' ? 'red' : 'blue'}>
            {checkpoint.type.toUpperCase()}
          </Tag>
        </div>
      )
    },
    {
      title: 'QR Type',
      dataIndex: 'qrType',
      key: 'qrType',
      render: (qrType) => (
        <Tag color={qrType === 'driver_scan' ? 'orange' : 'purple'}>
          {qrType.replace('_', ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Generated',
      dataIndex: 'generatedAt',
      key: 'generatedAt',
      render: (date) => new Date(date).toLocaleString()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EyeOutlined />}
            onClick={() => handlePreviewQR(record)}
            title="Preview QR"
          >
            Preview
          </Button>
          <Button 
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadQR(record)}
            title="Download QR"
          >
            Download
          </Button>
        </Space>
      )
    }
  ];

  if (!jeepney) return null;

  return (
    <Modal
      title={`Generate Route QR Codes - ${jeepney.jeepneyNumber}`}
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        generatedQRs.length > 0 && (
          <Button 
            key="print" 
            icon={<PrinterOutlined />}
            onClick={handlePrintQRs}
          >
            Print All QRs
          </Button>
        )
      ]}
    >
      <div>
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Route:</Text> {jeepney.route}
            </Col>
            <Col span={12}>
              <Text strong>Jeepney:</Text> {jeepney.jeepneyNumber} ({jeepney.plateNumber})
            </Col>
          </Row>
        </Card>

        <Card title="Generate QR Codes" size="small" style={{ marginBottom: 16 }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleGenerateQRs}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="qrType"
                  label="QR Code Type"
                  rules={[{ required: true, message: 'Please select QR type' }]}
                >
                  <Select placeholder="Select QR code type">
                    <Option value="driver_scan">
                      <div>
                        <div><strong>Driver Scan QR</strong></div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          For drivers to scan and update location
                        </div>
                      </div>
                    </Option>
                    <Option value="passenger_notification">
                      <div>
                        <div><strong>Passenger Notification QR</strong></div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Triggers notifications to passengers
                        </div>
                      </div>
                    </Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="selectedCheckpoints"
                  label="Checkpoints"
                  rules={[{ required: true, message: 'Please select checkpoints' }]}
                >
                  <Select 
                    mode="multiple" 
                    placeholder="Select checkpoints"
                    allowClear
                  >
                    <Option value="all">All Checkpoints</Option>
                    {getCurrentCheckpoints().map(checkpoint => (
                      <Option key={checkpoint.id} value={checkpoint.id}>
                        {checkpoint.name} ({checkpoint.type})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<QrcodeOutlined />}
                loading={loading}
              >
                Generate QR Codes
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {generatedQRs.length > 0 && (
          <Card title="Generated QR Codes" size="small">
            <Table 
              columns={qrColumns}
              dataSource={generatedQRs}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        )}

        {/* QR Preview Modal */}
        <Modal
          title={`QR Code Preview - ${previewQR?.checkpoint.name}`}
          open={previewVisible}
          onCancel={() => setPreviewVisible(false)}
          footer={[
            <Button key="close" onClick={() => setPreviewVisible(false)}>
              Close
            </Button>,
            <Button 
              key="download" 
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadQR(previewQR)}
            >
              Download
            </Button>
          ]}
          width={500}
        >
          {previewQR && (
            <div style={{ textAlign: 'center' }}>
              <Title level={4}>{previewQR.checkpoint.name}</Title>
              <Tag color={previewQR.qrType === 'driver_scan' ? 'orange' : 'purple'}>
                {previewQR.qrType.replace('_', ' ').toUpperCase()}
              </Tag>
              <br /><br />
              <Image 
                src={previewQR.qrImageURL} 
                alt="QR Code"
                width={250}
                height={250}
              />
              <Divider />
              <div style={{ textAlign: 'left' }}>
                <Text strong>QR Code Data:</Text>
                <pre style={{ 
                  fontSize: '10px', 
                  backgroundColor: '#f5f5f5', 
                  padding: '10px', 
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}>
                  {JSON.stringify(JSON.parse(previewQR.qrString), null, 2)}
                </pre>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Modal>
  );
};

export default RouteQRGeneration;
