import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import JeepneyService from '../../services/jeepneyService';
import UserService from '../../services/userService';

// Jeepney routes (General Trias -> Dasmariñas Pala-Pala)
const jeepneyRoutes = [
  "General Trias Bayan - Dasmariñas Pala-Pala via Arnaldo Highway",
  "General Trias Bayan - Dasmariñas Pala-Pala via Congressional Road",
  "General Trias Bayan - Dasmariñas Pala-Pala via Governor’s Drive",
  "General Trias Bayan - Dasmariñas Pala-Pala via Tejero",
  "General Trias Bayan - Dasmariñas Pala-Pala via Pasong Camachile"
];

const Jeepneys = () => {
  const [jeepneys, setJeepneys] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingJeepney, setEditingJeepney] = useState(null);

  // Jeepney form state
  const [formData, setFormData] = useState({
    plateNumber: '',
    capacity: '',
    route: '',
    driver: ''
  });

  useEffect(() => {
    fetchJeepneys();
    fetchDrivers(); // load drivers initially
  }, []);

  const fetchJeepneys = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await JeepneyService.getJeepneys();
      if (result.success) {
        setJeepneys(result.data || []);
      } else {
        setError(result.error || 'Failed to load jeepneys');
      }
    } catch (err) {
      console.error('Error fetching jeepneys:', err);
      setError('Failed to load jeepneys');
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      setLoadingDrivers(true);
      const result = await UserService.getUsers({ userType: "driver" });
      if (result.success) {
        setDrivers(result.users || []);
      }
    } catch (err) {
      console.error("Error fetching drivers:", err);
    } finally {
      setLoadingDrivers(false);
    }
  };

  const handleShowModal = (jeepney = null) => {
    if (jeepney) {
      setEditingJeepney(jeepney);
      setFormData({
        plateNumber: jeepney.plateNumber,
        capacity: jeepney.capacity,
        route: jeepney.route,
        driver: jeepney.driver
      });
    } else {
      setEditingJeepney(null);
      setFormData({ plateNumber: '', capacity: '', route: '', driver: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingJeepney(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (editingJeepney) {
        await JeepneyService.updateJeepney(editingJeepney.id, formData);
      } else {
        await JeepneyService.createJeepney(formData);
      }
      fetchJeepneys();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving jeepney:', err);
      setError('Failed to save jeepney');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this jeepney?')) {
      try {
        await JeepneyService.deleteJeepney(id);
        fetchJeepneys();
      } catch (err) {
        console.error('Error deleting jeepney:', err);
        setError('Failed to delete jeepney');
      }
    }
  };

  return (
    <AdminLayout 
      title="Jeepneys Management"
      subtitle="Manage your jeepney fleet and assignments"
    >
      {error && (
        <Alert variant="danger">
          <i className="bi bi-exclamation-triangle me-2"></i> {error}
        </Alert>
      )}

      <Card className="border-0 shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Jeepney Fleet</h5>
          <Button variant="primary" onClick={() => handleShowModal()}>
            <i className="bi bi-plus-lg me-2"></i> Add Jeepney
          </Button>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          ) : (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>Plate Number</th>
                  <th>Capacity</th>
                  <th>Route</th>
                  <th>Driver</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jeepneys.length > 0 ? (
                  jeepneys.map((jeepney) => (
                    <tr key={jeepney.id}>
                      <td>{jeepney.plateNumber}</td>
                      <td>{jeepney.capacity}</td>
                      <td>{jeepney.route}</td>
                      <td>
                        {drivers.find(d => d.id === jeepney.driver)
                          ? `${drivers.find(d => d.id === jeepney.driver).first_name} ${drivers.find(d => d.id === jeepney.driver).last_name}`
                          : "Unassigned"}
                      </td>
                      <td>
                        <Button 
                          variant="warning" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleShowModal(jeepney)}
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => handleDelete(jeepney.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">
                      No jeepneys found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Jeepney Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingJeepney ? 'Edit Jeepney' : 'Add Jeepney'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Plate Number</Form.Label>
              <Form.Control 
                type="text"
                name="plateNumber"
                value={formData.plateNumber}
                onChange={handleInputChange}
                placeholder="e.g. ABC-1234"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Capacity</Form.Label>
              <Form.Control 
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                placeholder="e.g. 16"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Route</Form.Label>
              <Form.Select
                name="route"
                value={formData.route}
                onChange={handleInputChange}
              >
                <option value="">-- Select Route --</option>
                {jeepneyRoutes.map((route, idx) => (
                  <option key={idx} value={route}>
                    {route}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Driver</Form.Label>
              <Form.Select
                name="driver"
                value={formData.driver}
                onChange={handleInputChange}
                disabled={loadingDrivers}
              >
                <option value="">-- Select Driver --</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.first_name} {driver.last_name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {editingJeepney ? 'Update' : 'Save'}
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
};

export default Jeepneys;
