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
  Spinner
} from "react-bootstrap";
// Using Bootstrap Icons instead of React Icons
import CheckpointManagement from "../admin/CheckpointManagement";
import JeepneyService from "../../services/jeepneyService";
import RouteService from "../../services/routeService";
import DriverService from "../../services/driverService";

const JeepneyManagement = () => {
  const [jeepneys, setJeepneys] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingJeepney, setEditingJeepney] = useState(null);
  const [qrJeepney, setQrJeepney] = useState(null);
  const [routeQRModalVisible, setRouteQRModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    jeepney_number: "",
    plate_number: "",
    model: "",
    capacity: "",
    route_id: "",
    driver_id: "",
    status: "active"
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([fetchRoutes(), fetchDrivers(), fetchJeepneys()]);
  };

  const fetchJeepneys = async () => {
    setLoading(true);
    try {
      const data = await JeepneyService.getAllJeepneys();
      if (data.status === "success") {
        const transformedJeepneys = data.jeepneys.map((jeepney) => {
          return {
            id: jeepney.id,
            jeepney_number: jeepney.jeepney_number,
            plate_number: jeepney.plate_number,
            model: jeepney.model,
            capacity: jeepney.capacity,
            route: jeepney.route_name || "No Route Assigned",
            driver: jeepney.first_name && jeepney.last_name
              ? `${jeepney.first_name} ${jeepney.last_name}`
              : "No Driver Assigned",
            status: jeepney.status,
            created_at: jeepney.created_at,
            updated_at: jeepney.updated_at
          };
        });
        setJeepneys(transformedJeepneys);
      } else {
        setError(data.message || "Failed to fetch jeepneys");
      }
    } catch (error) {
      console.error("Error fetching jeepneys:", error);
      setError("Failed to fetch jeepneys");
    }
    setLoading(false);
  };

  const fetchRoutes = async () => {
    try {
      const result = await RouteService.getAllRoutes();
      if (result.success) {
        setRoutes(result.routes);
      }
    } catch (error) {
      console.error("Error fetching routes:", error);
      setError("Failed to fetch routes");
    }
  };

  const fetchDrivers = async () => {
    try {
      const result = await DriverService.getAllDrivers();
      if (result.success) {
        setDrivers(result.drivers);
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
      setError("Failed to fetch drivers");
    }
  };

  const handleAddJeepney = () => {
    setEditingJeepney(null);
    setFormData({
      jeepney_number: "",
      plate_number: "",
      model: "",
      capacity: "",
      route_id: "",
      driver_id: "",
      status: "active"
    });
    setModalVisible(true);
  };

  const handleEditJeepney = (jeepney) => {
    setEditingJeepney(jeepney);
    setFormData({
      jeepney_number: jeepney.jeepney_number,
      plate_number: jeepney.plate_number,
      model: jeepney.model,
      capacity: jeepney.capacity,
      route_id: jeepney.route_id || "",
      driver_id: jeepney.driver_id || "",
      status: jeepney.status
    });
    setModalVisible(true);
  };

  const handleDeleteJeepney = async (jeepneyId) => {
    try {
      const result = await JeepneyService.deleteJeepney(jeepneyId);
      if (result.status === "success") {
        setJeepneys(jeepneys.filter((j) => j.id !== jeepneyId));
        setSuccess("Jeepney deleted successfully");
      } else {
        setError(result.message || "Failed to delete jeepney");
      }
    } catch (error) {
      console.error("Error deleting jeepney:", error);
      setError("Failed to delete jeepney");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingJeepney) {
        // Update
        const result = await JeepneyService.updateJeepney(
          editingJeepney.id,
          formData
        );
        if (result.status === "success") {
          setSuccess("Jeepney updated successfully");
          fetchJeepneys();
        } else {
          setError(result.message || "Failed to update jeepney");
        }
      } else {
        // Create
        const result = await JeepneyService.createJeepney(formData);
        if (result.status === "success") {
          setSuccess("Jeepney added successfully");
          fetchJeepneys();
        } else {
          setError(result.message || "Failed to add jeepney");
        }
      }
      setModalVisible(false);
    } catch (error) {
      console.error("Error saving jeepney:", error);
      setError("Failed to save jeepney");
    }
  };

  const generateRouteQR = (jeepney) => {
    setQrJeepney(jeepney);
    setRouteQRModalVisible(true);
  };

  return (
    <div>
      <Card className="p-3 mb-3">
        <div className="d-flex justify-content-between align-items-center">
          <h5>Jeepney Management</h5>
          <Button variant="primary" onClick={handleAddJeepney}>
            <i className="bi bi-plus-lg me-2"></i>Add Jeepney
          </Button>
        </div>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {loading ? (
        <div className="text-center my-3">
          <Spinner animation="border" />
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Jeepney Number</th>
              <th>Plate Number</th>
              <th>Model</th>
              <th>Capacity</th>
              <th>Route</th>
              <th>Driver</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jeepneys.map((j) => (
              <tr key={j.id}>
                <td>
                  <strong className="text-primary">{j.jeepney_number}</strong>
                </td>
                <td>{j.plate_number}</td>
                <td>{j.model}</td>
                <td>{j.capacity} passengers</td>
                <td>
                  <Badge bg="info">{j.route}</Badge>
                </td>
                <td>
                  {j.driver === "No Driver Assigned" ? (
                    <Badge bg="warning">{j.driver}</Badge>
                  ) : (
                    j.driver
                  )}
                </td>
                <td>
                  <Badge
                    bg={
                      j.status === "active"
                        ? "success"
                        : j.status === "maintenance"
                        ? "secondary"
                        : "danger"
                    }
                  >
                    {j.status.toUpperCase()}
                  </Badge>
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <Button
                      size="sm"
                      variant="info"
                      onClick={() => generateRouteQR(j)}
                      title="Generate QR Codes"
                    >
                      <i className="bi bi-qr-code"></i>
                    </Button>
                    <Button
                      size="sm"
                      variant="warning"
                      onClick={() => handleEditJeepney(j)}
                      title="Edit Jeepney"
                    >
                      <i className="bi bi-pencil"></i>
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteJeepney(j.id)}
                      title="Delete Jeepney"
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Add/Edit Jeepney Modal */}
      <Modal show={modalVisible} onHide={() => setModalVisible(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingJeepney ? "Edit Jeepney" : "Add New Jeepney"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Jeepney Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="jeepney_number"
                    value={formData.jeepney_number}
                    onChange={(e) =>
                      setFormData({ ...formData, jeepney_number: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Plate Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="plate_number"
                    value={formData.plate_number}
                    onChange={(e) =>
                      setFormData({ ...formData, plate_number: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Model</Form.Label>
                              <Form.Control
                                type="text"
                                name="model"
                                value={formData.model}
                                onChange={handleChange}
                                placeholder="e.g., Toyota Coaster"
                                required
                              />
                            </Form.Group>
                          </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Capacity</Form.Label>
                  <Form.Control
                    type="number"
                    name="capacity"
                    min="10"
                    max="50"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Route</Form.Label>
              <Form.Select
                name="route_id"
                value={formData.route_id}
                onChange={(e) =>
                  setFormData({ ...formData, route_id: e.target.value })
                }
                required
              >
                <option value="">Select Route</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.route_name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Driver</Form.Label>
              <Form.Select
                name="driver_id"
                value={formData.driver_id}
                onChange={(e) =>
                  setFormData({ ...formData, driver_id: e.target.value })
                }
              >
                <option value="">Select Driver</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.first_name} {driver.last_name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </Form.Select>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="primary" type="submit">
                {editingJeepney ? "Update Jeepney" : "Add Jeepney"}
              </Button>
              <Button variant="secondary" onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Checkpoint Management Modal */}
      <CheckpointManagement
        visible={routeQRModalVisible}
        onClose={() => setRouteQRModalVisible(false)}
      />
    </div>
  );
};

export default JeepneyManagement;
