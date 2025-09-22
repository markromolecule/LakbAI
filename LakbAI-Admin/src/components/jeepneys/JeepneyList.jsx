import React, { useState, useEffect, useRef } from "react";
import { 
  Table, 
  Button, 
  Spinner, 
  Modal, 
  Form, 
  Row, 
  Col, 
  Alert, 
  Badge,
  Card
} from "react-bootstrap";
import JeepneyService from "../../services/jeepneyService";

const JeepneyList = ({ jeepneys, onDataUpdate }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingJeepney, setEditingJeepney] = useState(null);
  const [deletingJeepney, setDeletingJeepney] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const successTimeoutRef = useRef(null);
  const [formData, setFormData] = useState({
    jeepney_number: "",
    plate_number: "",
    model: "",
    capacity: "",
    route_id: "",
    driver_id: "",
    status: "active"
  });

  // Auto-dismiss success message after 2 seconds
  const showSuccessMessage = (message) => {
    setSuccess(message);
    
    // Clear any existing timeout
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    
    // Set timeout for auto-dismiss
    successTimeoutRef.current = setTimeout(() => {
      setSuccess(null);
    }, 2000);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    fetchDrivers();
    fetchRoutes();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/admin/users?user_type=driver');
      const data = await response.json();
      if (data.status === 'success') {
        setDrivers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const fetchRoutes = async () => {
    // Mock routes for now - you can replace with actual API call
    setRoutes([
      { id: 1, route_name: 'SM Epza → SM Dasmariñas' },
      { id: 2, route_name: 'SM Dasmariñas → SM Epza' }
    ]);
  };

  const handleEdit = (jeepney) => {
    setEditingJeepney(jeepney);
    setFormData({
      jeepney_number: jeepney.jeepney_number?.replace('LKB-', '') || '',
      plate_number: jeepney.plate_number || '',
      model: jeepney.model || '',
      capacity: jeepney.capacity?.toString() || '',
      route_id: jeepney.route_id?.toString() || '',
      driver_id: jeepney.driver_id?.toString() || '',
      status: jeepney.status || 'active'
    });
    setShowEditModal(true);
  };

  const handleDelete = (jeepney) => {
    setDeletingJeepney(jeepney);
    setShowDeleteModal(true);
  };


  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate required fields
      if (!formData.plate_number || !formData.capacity) {
        setError("Please fill in all required fields (Plate Number and Capacity)");
        setLoading(false);
        return;
      }

      const payload = {
        plate_number: formData.plate_number,
        model: formData.model,
        route: formData.route_id ? Number(formData.route_id) : null,
        capacity: Number(formData.capacity),
        driver_id: formData.driver_id ? Number(formData.driver_id) : null,
        status: formData.status || 'active',
      };

      const result = await JeepneyService.updateJeepney(editingJeepney.id, payload);
      if (result.success) {
        showSuccessMessage("Jeepney updated successfully!");
        setShowEditModal(false);
        onDataUpdate();
      } else {
        setError(result.error || result.message || "Failed to update jeepney");
      }
    } catch (error) {
      setError("Failed to update jeepney");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      const result = await JeepneyService.deleteJeepney(deletingJeepney.id);
      if (result.success) {
        showSuccessMessage("Jeepney deleted successfully!");
        setShowDeleteModal(false);
        onDataUpdate();
      } else {
        setError(result.error || result.message || "Failed to delete jeepney");
      }
    } catch (error) {
      setError("Failed to delete jeepney");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { variant: 'success', icon: 'bi-check-circle' },
      inactive: { variant: 'secondary', icon: 'bi-pause-circle' },
      maintenance: { variant: 'warning', icon: 'bi-tools' }
    };
    
    const config = statusConfig[status] || statusConfig.inactive;
    return (
      <Badge bg={config.variant} className="d-flex align-items-center gap-1">
        <i className={`bi ${config.icon}`}></i>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (!jeepneys) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Loading jeepneys...</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="mb-3">
          {success}
        </Alert>
      )}

      <Card className="border-0 shadow-sm">
        <div className="table-responsive" style={{ overflowX: 'auto', width: '100%' }}>
          <Table hover className="mb-0" style={{ tableLayout: 'fixed', width: '100%' }}>
            <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <tr>
                <th className="text-center fw-semibold text-muted" style={{ width: '5%' }}>#</th>
                <th className="fw-semibold text-muted" style={{ width: '15%' }}>Jeepney Number</th>
                <th className="fw-semibold text-muted" style={{ width: '12%' }}>Plate Number</th>
                <th className="fw-semibold text-muted" style={{ width: '12%' }}>Model</th>
                <th className="fw-semibold text-muted" style={{ width: '18%' }}>Driver</th>
                <th className="fw-semibold text-muted" style={{ width: '18%' }}>Route</th>
                <th className="text-center fw-semibold text-muted" style={{ width: '8%' }}>Capacity</th>
                <th className="text-center fw-semibold text-muted" style={{ width: '8%' }}>Status</th>
                <th className="text-center fw-semibold text-muted" style={{ width: '8%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jeepneys.length > 0 ? (
                jeepneys.map((jeepney, index) => (
                  <tr key={jeepney.id} className="align-middle" style={{ borderBottom: '1px solid #f1f3f4' }}>
                    <td className="text-center text-muted fw-medium">{index + 1}</td>
                    <td>
                      <div className="d-flex align-items-center" style={{ minWidth: 0 }}>
                        <i className="bi bi-bus-front text-primary me-2 flex-shrink-0"></i>
                        <strong className="text-primary text-truncate">{jeepney.jeepney_number}</strong>
                      </div>
                    </td>
                    <td>
                      <code className="bg-light px-2 py-1 rounded text-truncate d-block">{jeepney.plate_number}</code>
                    </td>
                    <td>
                      <Badge bg="info" className="text-uppercase text-truncate d-block">
                        {jeepney.model || 'N/A'}
                      </Badge>
                    </td>
                    <td>
                      {jeepney.driver ? (
                        <div className="d-flex align-items-center" style={{ minWidth: 0 }}>
                          <i className="bi bi-person-circle text-success me-2 flex-shrink-0"></i>
                          <div className="text-truncate">
                            <div className="fw-medium text-truncate">{jeepney.driver}</div>
                            <small className="text-muted text-truncate d-block">{jeepney.driver_email || ''}</small>
                          </div>
                        </div>
                      ) : (
                        <Badge bg="warning" className="d-flex align-items-center gap-1 text-truncate">
                          <i className="bi bi-exclamation-triangle flex-shrink-0"></i>
                          <span className="text-truncate">No Driver</span>
                        </Badge>
                      )}
                    </td>
                    <td>
                      <span className="text-muted text-truncate d-block">{jeepney.route || 'No Route'}</span>
                    </td>
                    <td className="text-center">
                      <Badge bg="secondary">{jeepney.capacity}</Badge>
                    </td>
                    <td className="text-center">
                      {getStatusBadge(jeepney.status)}
                    </td>
                    <td className="text-center">
                      <div className="d-flex gap-2 justify-content-center">
                        <Button
                          variant="outline-primary"
                          size="md"
                          onClick={() => handleEdit(jeepney)}
                          title="Edit jeepney"
                          className="px-3"
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        
                        <Button
                          variant="outline-danger"
                          size="md"
                          onClick={() => handleDelete(jeepney)}
                          title="Delete jeepney"
                          className="px-3"
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-5">
                    <div className="text-muted">
                      <i className="bi bi-bus-front display-1 d-block mb-3"></i>
                      <h5>No jeepneys available</h5>
                      <p>Add your first jeepney to get started</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-pencil me-2"></i>
            Edit Jeepney
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Jeepney Number</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">LKB-</span>
                    <Form.Control
                      type="text"
                      name="jeepney_number"
                      value={formData.jeepney_number}
                      onChange={(e) => setFormData({...formData, jeepney_number: e.target.value})}
                      required
                    />
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Plate Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="plate_number"
                    value={formData.plate_number}
                    onChange={(e) => setFormData({...formData, plate_number: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Model</Form.Label>
                  <Form.Select
                    name="model"
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                    required
                  >
                    <option value="">Select Model</option>
                    <option value="MODERN JEEPNEY">MODERN JEEPNEY</option>
                    <option value="TRADITIONAL JEEPNEY">TRADITIONAL JEEPNEY</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Capacity</Form.Label>
                  <Form.Control
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                    min="10"
                    max="50"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Route</Form.Label>
                  <Form.Select
                    name="route_id"
                    value={formData.route_id}
                    onChange={(e) => setFormData({...formData, route_id: e.target.value})}
                  >
                    <option value="">Select Route</option>
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.route_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Driver</Form.Label>
                  <Form.Select
                    name="driver_id"
                    value={formData.driver_id}
                    onChange={(e) => setFormData({...formData, driver_id: e.target.value})}
                  >
                    <option value="">Select Driver</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.first_name} {driver.last_name} ({driver.email})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spinner size="sm" className="me-2" /> : null}
              Update Jeepney
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-exclamation-triangle text-danger me-2"></i>
            Confirm Delete
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this jeepney?</p>
          {deletingJeepney && (
            <div className="bg-light p-3 rounded">
              <strong>{deletingJeepney.jeepney_number}</strong> - {deletingJeepney.plate_number}
              <br />
              <small className="text-muted">This action cannot be undone.</small>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm} disabled={loading}>
            {loading ? <Spinner size="sm" className="me-2" /> : null}
            Delete Jeepney
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default JeepneyList;
