import React, { useState, useEffect } from 'react';
  import {
  Modal,
  Form,
  Button,
  Row,
  Col,
  Card,
  Table,
  Alert,
  Spinner,
  Badge,
  Tabs,
  Tab,
  InputGroup,
  Image,
  ListGroup
} from 'react-bootstrap';

const CheckpointManagement = ({ visible, onClose }) => {
  const [routes, setRoutes] = useState([]);
  const [jeepneys, setJeepneys] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedJeepney, setSelectedJeepney] = useState('');
  const [checkpoints, setCheckpoints] = useState([]);
  const [generatedQRs, setGeneratedQRs] = useState([]);
  const [driverLocations, setDriverLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewQR, setPreviewQR] = useState(null);
  const [activeTab, setActiveTab] = useState('qr-generation');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch routes when component mounts
  useEffect(() => {
    if (visible) {
      fetchRoutes();
      fetchJeepneys();
    }
  }, [visible]);

  const fetchRoutes = async () => {
    try {
      const response = await fetch('http://localhost:80/LakbAI/LakbAI-API/routes/api.php/routes');
      if (response.ok) {
        const data = await response.json();
        setRoutes(data.routes || []);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      setError('Failed to fetch routes');
    }
  };

  const fetchJeepneys = async () => {
    try {
      const response = await fetch('http://localhost:80/LakbAI/LakbAI-API/routes/api.php/jeepneys');
      if (response.ok) {
        const data = await response.json();
        setJeepneys(data.jeepneys || []);
      }
    } catch (error) {
      console.error('Error fetching jeepneys:', error);
      setError('Failed to fetch jeepneys');
    }
  };

  const fetchCheckpoints = async (routeId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:80/LakbAI/LakbAI-API/routes/api.php/routes/${routeId}/checkpoints`);
      if (response.ok) {
        const data = await response.json();
        setCheckpoints(data.checkpoints || []);
      }
    } catch (error) {
      console.error('Error fetching checkpoints:', error);
      setError('Failed to fetch checkpoints');
    } finally {
      setLoading(false);
    }
  };

  const generateSingleQR = async (checkpointId) => {
    if (!selectedRoute) {
      setError('Please select a route first');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:80/LakbAI/LakbAI-API/routes/api.php/admin/checkpoints/qr/generate/${checkpointId}/${selectedRoute}`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          // Map API response to expected frontend structure
          const qrData = {
            ...data.qr_data,
            qr_image_url: data.qr_url
          };
          setGeneratedQRs(prev => [...prev, qrData]);
          setSuccess('QR code generated successfully');
        } else {
          setError(data.message || 'Failed to generate QR code');
        }
      }
    } catch (error) {
      console.error('Error generating QR:', error);
      setError('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const generateAllQRs = async () => {
    if (!selectedRoute) {
      setError('Please select a route first');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:80/LakbAI/LakbAI-API/routes/api.php/admin/checkpoints/qr/route/${selectedRoute}`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          // Map API response to expected frontend structure
          const qrCodes = (data.qr_codes || []).map(qr => ({
            ...qr.qr_data,
            qr_image_url: qr.qr_url
          }));
          setGeneratedQRs(qrCodes);
          setSuccess(`Generated ${qrCodes.length} QR codes successfully`);
        } else {
          setError(data.message || 'Failed to generate QR codes');
        }
      }
    } catch (error) {
      console.error('Error generating QRs:', error);
      setError('Failed to generate QR codes');
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverLocations = async () => {
    if (!selectedRoute) {
      setError('Please select a route first');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:80/LakbAI/LakbAI-API/routes/api.php/mobile/locations/route/${selectedRoute}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setDriverLocations(data.drivers || []);
      }
    } catch (error) {
      console.error('Error fetching driver locations:', error);
      setError('Failed to fetch driver locations');
    } finally {
      setLoading(false);
    }
  };

  const handleRouteChange = (e) => {
    const routeId = e.target.value;
    setSelectedRoute(routeId);
    setGeneratedQRs([]);
    setDriverLocations([]);
    if (routeId) {
      fetchCheckpoints(routeId);
    } else {
      setCheckpoints([]);
    }
  };

  const downloadQR = (qr) => {
    const link = document.createElement('a');
    link.href = qr.qr_image_url;
    link.download = `checkpoint_${qr.checkpoint_name}_qr.png`;
    link.click();
  };

  const printQR = (qr) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Print QR Code - ${qr.checkpoint_name}</title></head>
        <body style="text-align: center; padding: 20px;">
          <h2>${qr.checkpoint_name}</h2>
          <p>Route: ${qr.route_name}</p>
          <img src="${qr.qr_image_url}" alt="QR Code" style="max-width: 300px;">
          <p>Scan this QR code when arriving at this checkpoint</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const deleteQR = (index) => {
    if (window.confirm('Are you sure you want to delete this QR code?')) {
      setGeneratedQRs(prev => prev.filter((_, i) => i !== index));
      setSuccess('QR code deleted successfully');
    }
  };

  const clearAllQRs = () => {
    if (window.confirm('Are you sure you want to delete all generated QR codes?')) {
      setGeneratedQRs([]);
      setSuccess('All QR codes cleared successfully');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'live': { variant: 'success', text: 'Live' },
      'recent': { variant: 'warning', text: 'Recent' },
      'stale': { variant: 'secondary', text: 'Stale' },
      'inactive': { variant: 'danger', text: 'Inactive' }
    };
    
    const config = statusConfig[status] || statusConfig['inactive'];
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60); // minutes
    
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Modal show={visible} onHide={onClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-qr-code me-2"></i>
          Checkpoint Management
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
          <Tab eventKey="qr-generation" title={
            <span><i className="bi bi-qr-code me-2"></i>QR Code Generation</span>
          }>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Select Route</Form.Label>
                  <Form.Select value={selectedRoute} onChange={handleRouteChange}>
                    <option value="">Choose a route...</option>
                    {routes.map(route => (
                      <option key={route.id} value={route.id}>
                        {route.route_name} ({route.origin} → {route.destination})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Select Jeepney (Optional)</Form.Label>
                  <Form.Select value={selectedJeepney} onChange={(e) => setSelectedJeepney(e.target.value)}>
                    <option value="">Choose a jeepney...</option>
                    {jeepneys.filter(j => !selectedRoute || j.route_id == selectedRoute).map(jeepney => (
                      <option key={jeepney.id} value={jeepney.id}>
                        {jeepney.jeepney_number} - {jeepney.plate_number}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {selectedRoute && (
              <Row className="mb-3">
                <Col>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="primary" 
                      onClick={generateAllQRs}
                      disabled={loading || checkpoints.length === 0}
                    >
                      {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                      <i className="bi bi-qr-code me-2"></i>
                      Generate All QR Codes
                    </Button>
                    <Button variant="outline-info" onClick={() => fetchCheckpoints(selectedRoute)}>
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Refresh Checkpoints
                    </Button>
                  </div>
                </Col>
              </Row>
            )}

            {checkpoints.length > 0 && (
              <Card className="mb-3">
                <Card.Header>
                  <Card.Title className="mb-0">Route Checkpoints</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Table responsive striped>
                    <thead>
                      <tr>
                        <th>Sequence</th>
                        <th>Checkpoint Name</th>
                        <th>Type</th>
                        <th>Fare</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checkpoints.map(checkpoint => (
                        <tr key={checkpoint.id}>
                          <td>{checkpoint.sequence_order}</td>
                          <td>{checkpoint.checkpoint_name}</td>
                          <td>
                            {checkpoint.is_origin == 1 && <Badge bg="success" className="me-1">Origin</Badge>}
                            {checkpoint.is_destination == 1 && <Badge bg="danger" className="me-1">Destination</Badge>}
                            {checkpoint.is_origin != 1 && checkpoint.is_destination != 1 && <Badge bg="secondary">Stop</Badge>}
                          </td>
                          <td>₱{checkpoint.fare_from_origin}</td>
                          <td>
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => generateSingleQR(checkpoint.id)}
                              disabled={loading}
                              title="Generate QR Code"
                            >
                              <i className="bi bi-qr-code"></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            )}

            {generatedQRs.length > 0 && (
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <Card.Title className="mb-0">Generated QR Codes</Card.Title>
                  <Button 
                    size="sm" 
                    variant="outline-danger"
                    onClick={clearAllQRs}
                    title="Clear All QR Codes"
                  >
                    <i className="bi bi-trash me-1"></i>
                    Clear All
                  </Button>
                </Card.Header>
                <Card.Body>
                  <Row>
                    {generatedQRs.map((qr, index) => (
                      <Col md={6} lg={4} key={index} className="mb-3">
                        <Card className="h-100">
                          <Card.Body className="text-center d-flex flex-column">
                            <h6 className="mb-3">{qr.checkpoint_name}</h6>
                            <div className="d-flex justify-content-center align-items-center flex-grow-1 mb-3">
                              <Image 
                                src={qr.qr_image_url} 
                                alt="QR Code" 
                                fluid 
                                style={{ 
                                  maxWidth: '150px', 
                                  width: '150px',
                                  height: '150px',
                                  objectFit: 'contain',
                                  cursor: 'pointer',
                                  border: '1px solid #dee2e6',
                                  borderRadius: '8px',
                                  padding: '8px'
                                }}
                                onClick={() => {
                                  setPreviewQR(qr);
                                  setPreviewVisible(true);
                                }}
                              />
                            </div>
                            <div className="d-flex justify-content-center gap-2">
                              <Button 
                                size="sm" 
                                variant="outline-primary" 
                                onClick={() => downloadQR(qr)}
                                title="Download QR Code"
                              >
                                <i className="bi bi-download"></i>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline-secondary"
                                onClick={() => printQR(qr)}
                                title="Print QR Code"
                              >
                                <i className="bi bi-printer"></i>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline-danger"
                                onClick={() => deleteQR(index)}
                                title="Delete QR Code"
                              >
                                <i className="bi bi-trash"></i>
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            )}
          </Tab>

          <Tab eventKey="monitoring" title={
            <span><i className="bi bi-display me-2"></i>Real-time Monitoring</span>
          }>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Select Route</Form.Label>
                  <Form.Select value={selectedRoute} onChange={handleRouteChange}>
                    <option value="">Choose a route...</option>
                    {routes.map(route => (
                      <option key={route.id} value={route.id}>
                        {route.route_name} ({route.origin} → {route.destination})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <div className="d-flex align-items-end">
                  <Button 
                    variant="primary" 
                    onClick={fetchDriverLocations}
                    disabled={!selectedRoute || loading}
                  >
                    {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Refresh Locations
                  </Button>
                </div>
              </Col>
            </Row>

            {driverLocations.length > 0 ? (
              <Card>
                <Card.Header>
                  <Card.Title className="mb-0">Active Drivers</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Row>
                    {driverLocations.map((driver, index) => (
                      <Col md={6} lg={4} key={index} className="mb-3">
                        <Card className="h-100">
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="mb-0">
                                <i className="bi bi-truck me-2"></i>
                                {driver.jeepney_number}
                              </h6>
                              {getStatusBadge(driver.status)}
                            </div>
                            <ListGroup variant="flush" className="border-0">
                              <ListGroup.Item className="px-0 py-1">
                                <small className="text-muted">Driver:</small><br />
                                {driver.driver_name}
                              </ListGroup.Item>
                              <ListGroup.Item className="px-0 py-1">
                                <small className="text-muted">Current Location:</small><br />
                                <i className="bi bi-geo-alt me-1"></i>
                                {driver.current_location || 'Unknown'}
                              </ListGroup.Item>
                              <ListGroup.Item className="px-0 py-1">
                                <small className="text-muted">Last Update:</small><br />
                                <i className="bi bi-clock me-1"></i>
                                {formatLastUpdate(driver.last_update)}
                              </ListGroup.Item>
                              {driver.estimated_arrival && (
                                <ListGroup.Item className="px-0 py-1">
                                  <small className="text-muted">Next Arrival:</small><br />
                                  <i className="bi bi-stopwatch me-1"></i>
                                  {driver.estimated_arrival}
                                </ListGroup.Item>
                              )}
                            </ListGroup>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            ) : selectedRoute ? (
              <Alert variant="info">
                <i className="bi bi-info-circle me-2"></i>
                No active drivers found for this route. Drivers will appear here when they scan checkpoint QR codes.
              </Alert>
            ) : (
              <Alert variant="secondary">
                <i className="bi bi-arrow-up me-2"></i>
                Please select a route to view driver locations.
              </Alert>
            )}
          </Tab>
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>

      {/* QR Preview Modal */}
      <Modal show={previewVisible} onHide={() => setPreviewVisible(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>QR Code Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {previewQR && (
            <>
              <h5>{previewQR.checkpoint_name}</h5>
              <p className="text-muted">Route: {previewQR.route_name}</p>
              <div className="d-flex justify-content-center align-items-center my-4">
                <Image 
                  src={previewQR.qr_image_url} 
                  alt="QR Code" 
                  fluid 
                  style={{ 
                    maxWidth: '300px',
                    width: '300px',
                    height: '300px',
                    objectFit: 'contain',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    padding: '16px'
                  }} 
                />
              </div>
              <div className="d-flex justify-content-center gap-3">
                <Button 
                  variant="primary" 
                  onClick={() => downloadQR(previewQR)}
                >
                  <i className="bi bi-download me-2"></i>Download
                </Button>
                <Button 
                  variant="outline-secondary"
                  onClick={() => printQR(previewQR)}
                >
                  <i className="bi bi-printer me-2"></i>Print
                </Button>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </Modal>
  );
};

export default CheckpointManagement;