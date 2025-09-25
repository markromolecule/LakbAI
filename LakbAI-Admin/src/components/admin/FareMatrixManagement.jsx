import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Row,
  Col,
  Alert,
  Badge,
  Spinner,
  InputGroup,
  Dropdown,
  ButtonGroup
} from "react-bootstrap";
import FareMatrixService from "../../services/fareMatrixService";
import RouteService from "../../services/routeService";

const FareMatrixManagement = () => {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [fareMatrix, setFareMatrix] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    from_checkpoint_id: "",
    to_checkpoint_id: "",
    fare_amount: "",
    route_id: "",
    is_base_fare: false,
    status: "active"
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [stats, setStats] = useState(null);
  const [baseFare, setBaseFare] = useState(13.00);

  // Fetch data on mount
  useEffect(() => {
    fetchRoutes();
    fetchStats();
  }, []);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const result = await RouteService.getAllRoutes();
      if (result.success) {
        setRoutes(result.routes);
        if (result.routes.length > 0) {
          setSelectedRoute(result.routes[0]);
          await fetchFareMatrixForRoute(result.routes[0].id);
        }
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to fetch routes');
    } finally {
      setLoading(false);
    }
  };

  const fetchFareMatrixForRoute = async (routeId) => {
    setLoading(true);
    try {
      const result = await FareMatrixService.getFareMatrixForRoute(routeId);
      if (result.success) {
        setFareMatrix(result.fareMatrix);
        setCheckpoints(result.checkpoints);
        setSelectedRoute(result.route);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to fetch fare matrix');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const result = await FareMatrixService.getFareMatrixStats();
      if (result.success) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleRouteChange = (routeId) => {
    const route = routes.find(r => r.id === parseInt(routeId));
    if (route) {
      setSelectedRoute(route);
      fetchFareMatrixForRoute(route.id);
    }
  };

  const handleGenerateMatrix = async () => {
    if (!selectedRoute) return;
    
    setLoading(true);
    try {
      const result = await FareMatrixService.generateFareMatrixForRoute(selectedRoute.id, baseFare);
      if (result.success) {
        setSuccess(`Generated ${result.createdEntries} fare entries for ${selectedRoute.route_name}`);
        await fetchFareMatrixForRoute(selectedRoute.id);
        await fetchStats();
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to generate fare matrix');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setFormData({
      from_checkpoint_id: entry.from_checkpoint_id,
      to_checkpoint_id: entry.to_checkpoint_id,
      fare_amount: entry.fare_amount,
      route_id: entry.route_id,
      is_base_fare: entry.is_base_fare,
      status: entry.status
    });
    setModalVisible(true);
  };

  const handleCreateEntry = () => {
    setEditingEntry(null);
    setFormData({
      from_checkpoint_id: "",
      to_checkpoint_id: "",
      fare_amount: "",
      route_id: selectedRoute?.id || "",
      is_base_fare: false,
      status: "active"
    });
    setModalVisible(true);
  };

  const handleSaveEntry = async () => {
    setLoading(true);
    try {
      // Ensure all required fields are included
      const dataToSend = {
        ...formData,
        route_id: selectedRoute?.id || formData.route_id,
        fare_matrix_id: editingEntry?.id || null,
        effective_date: new Date().toISOString().split('T')[0], // Set to today
        expiry_date: null 
      };
      
      const result = await FareMatrixService.createOrUpdateFareEntry(dataToSend);
      
      if (result.success) {
        setSuccess(result.message);
        setModalVisible(false);
        await fetchFareMatrixForRoute(selectedRoute.id);
        await fetchStats();
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to save fare entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this fare entry?')) return;
    
    setLoading(true);
    try {
      const result = await FareMatrixService.deleteFareEntry(entryId);
      if (result.success) {
        setSuccess(result.message);
        await fetchFareMatrixForRoute(selectedRoute.id);
        await fetchStats();
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to delete fare entry');
    } finally {
      setLoading(false);
    }
  };

  const createFareMatrixTable = () => {
    if (!checkpoints.length || !fareMatrix.length) return [];

    const checkpointMap = {};
    checkpoints.forEach(cp => {
      checkpointMap[cp.id] = cp.checkpoint_name;
    });

    const tableData = [];
    checkpoints.forEach(fromCp => {
      const row = {
        fromCheckpoint: fromCp.checkpoint_name,
        fromCheckpointId: fromCp.id,
        fares: {}
      };
      
      checkpoints.forEach(toCp => {
        const fareEntry = fareMatrix.find(fm => 
          fm.from_checkpoint_id === fromCp.id && 
          fm.to_checkpoint_id === toCp.id
        );
        
        row.fares[toCp.id] = {
          fare: fareEntry ? fareEntry.fare_amount : null,
          fareMatrixId: fareEntry ? fareEntry.id : null,
          isBaseFare: fareEntry ? fareEntry.is_base_fare : false,
          status: fareEntry ? fareEntry.status : 'missing'
        };
      });
      
      tableData.push(row);
    });

    return tableData;
  };

  const tableData = createFareMatrixTable();

  return (
    <div>
      {/* Statistics Cards */}
      {stats && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h5 className="text-primary">{stats.total_entries}</h5>
                <small className="text-muted">Total Entries</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h5 className="text-success">{stats.base_fare_entries}</h5>
                <small className="text-muted">Base Fare Entries</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h5 className="text-info">{stats.route_statistics?.length || 0}</h5>
                <small className="text-muted">Active Routes</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h5 className="text-warning">₱{parseFloat(stats.route_statistics?.[0]?.avg_fare || 0).toFixed(2)}</h5>
                <small className="text-muted">Average Fare</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Route Selection and Actions */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Select Route</Form.Label>
                <Form.Select 
                  value={selectedRoute?.id || ''} 
                  onChange={(e) => handleRouteChange(e.target.value)}
                >
                  <option value="">Choose a route...</option>
                  {routes.map(route => (
                    <option key={route.id} value={route.id}>
                      {route.route_name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Base Fare</Form.Label>
                <InputGroup>
                  <InputGroup.Text>₱</InputGroup.Text>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={baseFare}
                    onChange={(e) => setBaseFare(parseFloat(e.target.value))}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={5}>
              <div className="d-flex gap-2 justify-content-end">
                <Button 
                  variant="primary" 
                  onClick={handleGenerateMatrix}
                  disabled={!selectedRoute || loading}
                >
                  {loading ? <Spinner animation="border" /> : <i className="bi bi-gear"></i>} Generate Matrix
                </Button>
                <Button 
                  variant="success" 
                  onClick={handleCreateEntry}
                  disabled={!selectedRoute}
                >
                  <i className="bi bi-plus"></i> Add Entry
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Fare Matrix Table */}
      {selectedRoute && tableData.length > 0 && (
        <Card>
          <Card.Header>
            <h5>Fare Matrix: {selectedRoute.route_name}</h5>
            <small className="text-muted">
              {tableData.length} checkpoints × {checkpoints.length} destinations = {tableData.length * checkpoints.length} fare combinations
            </small>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>From</th>
                    {checkpoints.map(cp => (
                      <th key={cp.id} className="text-center">
                        {cp.checkpoint_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, index) => (
                    <tr key={row.fromCheckpointId}>
                      <td className="fw-bold">{row.fromCheckpoint}</td>
                      {checkpoints.map(cp => {
                        const fareData = row.fares[cp.id];
                        return (
                          <td key={cp.id} className="text-center">
                            {fareData.fare ? (
                              <div className="d-flex flex-column align-items-center">
                                <Badge 
                                  bg={fareData.isBaseFare ? 'primary' : 'secondary'}
                                  className="mb-1"
                                >
                                  ₱{fareData.fare}
                                </Badge>
                                <ButtonGroup>
                                  <Button 
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => handleEditEntry({
                                      id: fareData.fareMatrixId,
                                      from_checkpoint_id: row.fromCheckpointId,
                                      to_checkpoint_id: cp.id,
                                      fare_amount: fareData.fare,
                                      route_id: selectedRoute.id,
                                      is_base_fare: fareData.isBaseFare,
                                      status: fareData.status
                                    })}
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </Button>
                                  <Button 
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDeleteEntry(fareData.fareMatrixId)}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </Button>
                                </ButtonGroup>
                              </div>
                            ) : (
                              <Button 
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => {
                                  setFormData({
                                    from_checkpoint_id: row.fromCheckpointId,
                                    to_checkpoint_id: cp.id,
                                    fare_amount: baseFare,
                                    route_id: selectedRoute.id,
                                    is_base_fare: row.fromCheckpointId === cp.id,
                                    status: "active"
                                  });
                                  setEditingEntry(null);
                                  setModalVisible(true);
                                }}
                              >
                                <i className="bi bi-plus"></i>
                              </Button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Edit/Create Modal */}
      <Modal show={modalVisible} onHide={() => setModalVisible(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingEntry ? 'Edit Fare Entry' : 'Create Fare Entry'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>From Checkpoint</Form.Label>
                  <Form.Select
                    value={formData.from_checkpoint_id}
                    onChange={(e) => setFormData({...formData, from_checkpoint_id: e.target.value})}
                  >
                    <option value="">Select checkpoint...</option>
                    {checkpoints.map(cp => (
                      <option key={cp.id} value={cp.id}>
                        {cp.checkpoint_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>To Checkpoint</Form.Label>
                  <Form.Select
                    value={formData.to_checkpoint_id}
                    onChange={(e) => setFormData({...formData, to_checkpoint_id: e.target.value})}
                  >
                    <option value="">Select checkpoint...</option>
                    {checkpoints.map(cp => (
                      <option key={cp.id} value={cp.id}>
                        {cp.checkpoint_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fare Amount</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>₱</InputGroup.Text>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={formData.fare_amount}
                      onChange={(e) => setFormData({...formData, fare_amount: e.target.value})}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Is Base Fare"
                checked={formData.is_base_fare}
                onChange={(e) => setFormData({...formData, is_base_fare: e.target.checked})}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModalVisible(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveEntry} disabled={loading}>
            {loading ? <Spinner animation="border" /> : 'Save'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default FareMatrixManagement;
