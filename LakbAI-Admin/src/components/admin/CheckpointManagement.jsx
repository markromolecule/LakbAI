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
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-dismiss success messages after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Force refresh function
  const forceRefresh = () => {
    console.log('🔄 Force refresh triggered');
    setRefreshKey(prev => prev + 1);
    fetchDriverLocations();
  };

  // Auto-refresh driver locations every 3 seconds when on monitoring tab
  useEffect(() => {
    console.log('🔄 Auto-refresh effect triggered. activeTab:', activeTab, 'selectedRoute:', selectedRoute);
    let interval;
    if (activeTab === 'monitoring' && selectedRoute) {
      // Initial fetch
      console.log('🔄 Initial fetch triggered for route:', selectedRoute);
      fetchDriverLocations();
      
      // Set up auto-refresh
      interval = setInterval(() => {
        console.log('🔄 Auto-refresh triggered at', new Date().toLocaleTimeString(), 'for route:', selectedRoute);
        fetchDriverLocations();
      }, 3000); // Refresh every 3 seconds for faster updates
      console.log('🔄 Auto-refresh interval set up successfully');
    } else {
      console.log('🔄 Auto-refresh NOT set up. activeTab:', activeTab, 'selectedRoute:', selectedRoute);
    }
    
    return () => {
      if (interval) {
        console.log('🔄 Clearing auto-refresh interval');
        clearInterval(interval);
      }
    };
  }, [activeTab, selectedRoute, refreshKey]);

  // Additional effect to ensure refresh happens when tab changes
  useEffect(() => {
    if (activeTab === 'monitoring' && selectedRoute) {
      console.log('🔄 Tab changed to monitoring, triggering refresh');
      fetchDriverLocations();
    }
  }, [activeTab]);

  // Force refresh when component becomes visible
  useEffect(() => {
    if (visible && activeTab === 'monitoring' && selectedRoute) {
      console.log('🔄 Force refresh on visibility change');
      fetchDriverLocations();
    }
  }, [visible, activeTab, selectedRoute]);

  // Fetch routes when component mounts
  useEffect(() => {
    if (visible) {
      fetchRoutes();
      fetchJeepneys();
    }
  }, [visible]);

  const fetchRoutes = async () => {
    try {
      const response = await fetch('http://192.168.254.110/LakbAI/LakbAI-API/routes/api.php/routes');
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
      const response = await fetch('http://192.168.254.110/LakbAI/LakbAI-API/routes/api.php/jeepneys');
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
      const response = await fetch(`http://192.168.254.110/LakbAI/LakbAI-API/routes/api.php/routes/${routeId}/checkpoints`);
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
        `http://192.168.254.110/LakbAI/LakbAI-API/routes/api.php/admin/checkpoints/qr/generate/${checkpointId}/${selectedRoute}`,
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
        `http://192.168.254.110/LakbAI/LakbAI-API/routes/api.php/admin/checkpoints/qr/route/${selectedRoute}`,
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
      console.log('🔄 Fetching driver locations for route:', selectedRoute);
      
      // Get driver locations for the specific route (this already filters by route)
      const timestamp = new Date().getTime();
      const locationsResponse = await fetch(
        `http://192.168.254.110/LakbAI/LakbAI-API/routes/api.php/mobile/locations/route/${selectedRoute}?t=${timestamp}`
      );
      
      // Also get driver details for contact information
      const driversResponse = await fetch(
        `http://192.168.254.110/LakbAI/LakbAI-API/routes/api.php/admin/drivers?t=${timestamp}`
      );
      
      let driverLocations = [];
      let driverDetails = [];
      
      if (locationsResponse.ok) {
        const locationsResult = await locationsResponse.json();
        console.log('📍 Location data from API:', locationsResult);
        
        if (locationsResult.status === 'success' && locationsResult.driver_locations) {
          driverLocations = locationsResult.driver_locations.filter(driver => driver.shift_status === 'on_shift');
        }
      } else {
        console.error('❌ Failed to fetch locations:', locationsResponse.status, locationsResponse.statusText);
      }
      
      if (driversResponse.ok) {
        const driversResult = await driversResponse.json();
        console.log('🚗 Driver details from API:', driversResult);
        
        if (driversResult.status === 'success' && driversResult.drivers) {
          driverDetails = driversResult.drivers;
        }
      } else {
        console.error('❌ Failed to fetch driver details:', driversResponse.status, driversResponse.statusText);
      }
      
      // Merge location data with driver details
      const mergedDriverLocations = driverLocations.map(driver => {
        const driverInfo = driverDetails.find(d => d.id == driver.driver_id);
        
        return {
          driver_id: driver.driver_id,
          driver_name: driver.driver_name,
          jeepney_number: driver.jeepney_number || 'N/A',
          current_location: driver.last_scanned_checkpoint || 'Unknown',
          last_update: driver.last_update || 'Never',
          estimated_arrival: driver.estimated_arrival || 'N/A',
          status: driver.status || 'active',
          shift_status: driver.shift_status,
          phone: driverInfo?.phone || 'N/A',
          email: driverInfo?.email || 'N/A'
        };
      });
      
      console.log('📍 Merged driver locations:', mergedDriverLocations);
      console.log('🔄 Setting driver locations in state...');
      setDriverLocations(mergedDriverLocations);
      setLastUpdateTime(new Date());
      setSuccess(`Found ${mergedDriverLocations.length} active drivers on this route`);
      console.log('✅ Driver locations updated successfully');
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
    
    // Clear generated QRs when selecting a different route
    if (generatedQRs.length > 0) {
      setGeneratedQRs([]);
      setSuccess('Generated QR codes cleared for new route selection');
    }
    
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
      'active': { variant: 'success', text: 'Active' },
      'live': { variant: 'success', text: 'Live' },
      'recent': { variant: 'warning', text: 'Recent' },
      'stale': { variant: 'secondary', text: 'Stale' },
      'no_data': { variant: 'secondary', text: 'No Data' },
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
    <>
      <style>
        {`
          .checkpoint-modal .modal-dialog {
            margin: 1.75rem auto !important;
            max-width: 80vw !important;
            width: 80vw !important;
          }
          .checkpoint-modal .modal-body {
            padding: 1rem !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .checkpoint-modal .card {
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .checkpoint-modal .card-body {
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .checkpoint-table-container {
            width: 100% !important;
            max-width: 100% !important;
            overflow: visible !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .checkpoint-table-container .table {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
            table-layout: fixed !important;
            margin: 0 !important;
            border-spacing: 0 !important;
            border-collapse: collapse !important;
            flex: 1 !important;
            display: table !important;
          }
          .checkpoint-table-container .table th,
          .checkpoint-table-container .table td {
            border: 1px solid #dee2e6 !important;
            width: auto !important;
            padding: 0.5rem !important;
          }
          .checkpoint-table-container .table th:nth-child(1),
          .checkpoint-table-container .table td:nth-child(1) {
            width: 10% !important;
          }
          .checkpoint-table-container .table th:nth-child(2),
          .checkpoint-table-container .table td:nth-child(2) {
            width: 50% !important;
          }
          .checkpoint-table-container .table th:nth-child(3),
          .checkpoint-table-container .table td:nth-child(3) {
            width: 15% !important;
          }
          .checkpoint-table-container .table th:nth-child(4),
          .checkpoint-table-container .table td:nth-child(4) {
            width: 15% !important;
          }
          .checkpoint-table-container .table th:nth-child(5),
          .checkpoint-table-container .table td:nth-child(5) {
            width: 10% !important;
          }
        `}
      </style>
      <Modal show={visible} onHide={onClose} size="xl" centered className="checkpoint-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-qr-code me-2"></i>
          Checkpoint Management
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ width: '100%', padding: '1rem', maxWidth: '100%' }}>
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
              <Card className="w-100" style={{ width: '100%', maxWidth: '100%' }}>
                <Card.Header className="py-2">
                  <Card.Title className="mb-0 fs-6">Route Checkpoints</Card.Title>
                </Card.Header>
                <Card.Body className="p-0" style={{ width: '100%', padding: '0' }}>
                  <div className="checkpoint-table-container" style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Table striped className="mb-0 w-100" style={{ 
                      fontSize: '0.875rem', 
                      tableLayout: 'fixed', 
                      width: '100%', 
                      minWidth: '100%',
                      maxWidth: '100%',
                      margin: '0',
                      borderCollapse: 'collapse',
                      borderSpacing: '0'
                    }}>
                    <thead>
                      <tr>
                        <th className="py-2 px-2" style={{ fontSize: '0.8rem', fontWeight: '600', width: '10%' }}>Sequence</th>
                        <th className="py-2 px-2" style={{ fontSize: '0.8rem', fontWeight: '600', width: '50%' }}>Checkpoint Name</th>
                        <th className="py-2 px-2" style={{ fontSize: '0.8rem', fontWeight: '600', width: '15%' }}>Type</th>
                        <th className="py-2 px-2" style={{ fontSize: '0.8rem', fontWeight: '600', width: '15%' }}>Fare</th>
                        <th className="py-2 px-2" style={{ fontSize: '0.8rem', fontWeight: '600', width: '10%' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checkpoints.map(checkpoint => (
                        <tr key={checkpoint.id}>
                          <td className="py-2 px-2 align-middle" style={{ width: '10%' }}>{checkpoint.sequence_order}</td>
                          <td className="py-2 px-2 align-middle" style={{ width: '50%' }}>{checkpoint.checkpoint_name}</td>
                          <td className="py-2 px-2 align-middle" style={{ width: '15%' }}>
                            {checkpoint.is_origin == 1 && <Badge bg="success" className="me-1" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>Origin</Badge>}
                            {checkpoint.is_destination == 1 && <Badge bg="danger" className="me-1" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>Destination</Badge>}
                            {checkpoint.is_origin != 1 && checkpoint.is_destination != 1 && <Badge bg="secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>Stop</Badge>}
                          </td>
                          <td className="py-2 px-2 align-middle" style={{ width: '15%' }}>₱{checkpoint.fare_from_origin}</td>
                          <td className="py-2 px-2 align-middle" style={{ width: '10%' }}>
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => generateSingleQR(checkpoint.id)}
                              disabled={loading}
                              title="Generate QR Code"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              <i className="bi bi-qr-code"></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  </div>
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
                <Form.Group>
                  <Form.Label style={{ visibility: 'hidden' }}>Spacer</Form.Label>
                  <div className="d-flex justify-content-start">
                    <Button 
                      variant="primary" 
                      onClick={forceRefresh}
                      disabled={!selectedRoute || loading}
                      style={{ width: '200px' }}
                    >
                      {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Refresh Locations
                    </Button>
                  </div>
                </Form.Group>
              </Col>
            </Row>

            {driverLocations.length > 0 ? (
              <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <Card.Title className="mb-0">
            <i className="bi bi-people-fill me-2"></i>
            Active Drivers ({driverLocations.length})
          </Card.Title>
          <div className="d-flex align-items-center gap-2">
            <Badge bg="success" className="pulse-animation">
              <i className="bi bi-circle-fill me-1"></i>
              Live Tracking
            </Badge>
            {loading && (
              <Spinner animation="border" size="sm" variant="primary" />
            )}
            {lastUpdateTime && (
              <small className="text-muted">
                <i className="bi bi-clock me-1"></i>
                Updated: {lastUpdateTime.toLocaleTimeString()}
              </small>
            )}
          </div>
                </Card.Header>
                <Card.Body>
                  <Row>
                    {driverLocations.map((driver, index) => (
                      <Col md={6} lg={4} key={index} className="mb-3">
                        <Card className="h-100 border-success">
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="mb-0">
                                <i className="bi bi-truck me-2 text-success"></i>
                                {driver.jeepney_number}
                              </h6>
                              <div className="d-flex flex-column align-items-end">
                              {getStatusBadge(driver.status)}
                                <Badge bg="success" className="mt-1 pulse-animation">
                                  <i className="bi bi-circle-fill me-1"></i>
                                  On Shift
                                </Badge>
                              </div>
                            </div>
                            <ListGroup variant="flush" className="border-0">
                              <ListGroup.Item className="px-0 py-1">
                                <small className="text-muted">Driver:</small><br />
                                <strong>{driver.driver_name}</strong>
                              </ListGroup.Item>
                              <ListGroup.Item className="px-0 py-1">
                                <small className="text-muted">Current Location:</small><br />
                                <i className="bi bi-geo-alt me-1 text-success"></i>
                                <strong className="text-success">{driver.current_location || 'Unknown'}</strong>
                              </ListGroup.Item>
                              <ListGroup.Item className="px-0 py-1">
                                <small className="text-muted">Last QR Scan:</small><br />
                                <i className="bi bi-qr-code me-1"></i>
                                {formatLastUpdate(driver.last_update)}
                              </ListGroup.Item>
                              <ListGroup.Item className="px-0 py-1">
                                <small className="text-muted">Contact:</small><br />
                                <i className="bi bi-phone me-1"></i>
                                {driver.phone || 'N/A'}
                              </ListGroup.Item>
                              {driver.estimated_arrival && driver.estimated_arrival !== 'N/A' && (
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
      
      <style jsx>{`
        .pulse-animation {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </Modal>
    </>
  );
};

export default CheckpointManagement;