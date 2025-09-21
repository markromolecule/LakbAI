import React, { useState } from "react";
import { Card, Button, Row, Col, Alert } from "react-bootstrap";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import CheckpointManagement from "../../components/admin/CheckpointManagement";

const Checkpoints = () => {
  const [checkpointModalVisible, setCheckpointModalVisible] = useState(false);

  return (
    <AdminLayout
      title="Checkpoint Management System"
      subtitle="Advanced QR code generation and real-time driver tracking"
    >
      <Row className="mb-4">
        <Col>
          <Alert variant="info">
            <div className="d-flex align-items-center">
              <i className="bi bi-qr-code me-2"></i>
              <strong>New Checkpoint Management System</strong>
            </div>
            <p className="mb-0 mt-2">
              Generate QR codes for checkpoints, monitor real-time driver locations, and manage passenger notifications.
            </p>
          </Alert>
        </Col>
      </Row>

      <Row>
        <Col lg={4} md={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div className="mb-3">
                <i className="bi bi-qr-code text-primary" style={{ fontSize: '3rem' }}></i>
              </div>
              <Card.Title>QR Code Generation</Card.Title>
              <Card.Text>
                Generate QR codes for all checkpoints on a route. Drivers can scan these to update their location in real-time.
              </Card.Text>
              <Button 
                variant="primary" 
                onClick={() => setCheckpointModalVisible(true)}
                className="w-100"
              >
                Open QR Generator
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4} md={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div className="mb-3">
                <i className="bi bi-display text-success" style={{ fontSize: '3rem' }}></i>
              </div>
              <Card.Title>Real-time Monitoring</Card.Title>
              <Card.Text>
                Track driver locations in real-time as they scan checkpoint QR codes. Monitor arrival estimates and driver status.
              </Card.Text>
              <Button 
                variant="success" 
                onClick={() => setCheckpointModalVisible(true)}
                className="w-100"
              >
                View Live Tracking
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4} md={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div className="mb-3">
                <i className="bi bi-gear text-warning" style={{ fontSize: '3rem' }}></i>
              </div>
              <Card.Title>System Management</Card.Title>
              <Card.Text>
                Configure notification settings, manage passenger subscriptions, and handle multiple driver conflicts.
              </Card.Text>
              <Button 
                variant="warning" 
                onClick={() => setCheckpointModalVisible(true)}
                className="w-100"
              >
                Manage System
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">System Features</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h6 className="fw-bold">QR Code Features:</h6>
                  <ul className="list-unstyled">
                    <li>✅ Generate individual checkpoint QR codes</li>
                    <li>✅ Bulk generate for entire routes</li>
                    <li>✅ Download and print QR codes</li>
                    <li>✅ QR code preview and validation</li>
                    <li>✅ Expiration date management</li>
                  </ul>
                </Col>
                <Col md={6}>
                  <h6 className="fw-bold">Real-time Features:</h6>
                  <ul className="list-unstyled">
                    <li>✅ Live driver location tracking</li>
                    <li>✅ Passenger arrival notifications</li>
                    <li>✅ "Next Jeep Arrival: 5-7 mins" display</li>
                    <li>✅ Multiple driver conflict resolution</li>
                    <li>✅ Driver status monitoring</li>
                  </ul>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Checkpoint Management Modal */}
      <CheckpointManagement 
        visible={checkpointModalVisible}
        onClose={() => setCheckpointModalVisible(false)}
      />
    </AdminLayout>
  );
};

export default Checkpoints;
