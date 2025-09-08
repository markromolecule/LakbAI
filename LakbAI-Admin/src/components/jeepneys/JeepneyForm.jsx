import React, { useState, useEffect } from "react";
import { Form, Button, Card, Alert, Row, Col } from "react-bootstrap";
import JeepneyService from "../../services/jeepneyService";
import RouteService from "../../services/routeService";
import DriverService from "../../services/driverService";

const JeepneyForm = ({ onDataUpdate }) => {
  const [formData, setFormData] = useState({
    jeepney_number: "",
    plate_number: "",
    model: "",
    capacity: "",
    route_id: "",
    driver_id: "",
    status: "active",
  });

  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchRoutes();
    fetchDrivers();
  }, []);

  const fetchRoutes = async () => {
    const result = await RouteService.getAllRoutes();
    if (result.success) setRoutes(result.routes);
  };

  const fetchDrivers = async () => {
    const result = await DriverService.getAllDrivers();
    if (result.success) setDrivers(result.drivers);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const result = await JeepneyService.createJeepney(formData);
    if (result.status === "success") {
      setSuccess("Jeepney added successfully!");
      setFormData({
        jeepney_number: "",
        plate_number: "",
        model: "",
        capacity: "",
        route_id: "",
        driver_id: "",
        status: "active",
      });
      onDataUpdate();
    } else {
      setError(result.message || "Failed to add jeepney");
    }
  };

  return (
    <Card className="shadow-sm border-0">
      <Card.Body>
        <h5 className="mb-3">Add New Jeepney</h5>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Jeepney Number</Form.Label>
                <Form.Control
                  type="text"
                  name="jeepney_number"
                  value={formData.jeepney_number}
                  onChange={handleChange}
                  placeholder="e.g., LKB-001"
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
                  onChange={handleChange}
                  placeholder="e.g., ABC 1234"
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
                  value={formData.capacity}
                  onChange={handleChange}
                  min="10"
                  max="50"
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
              onChange={handleChange}
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
            <Form.Label>Driver (Optional)</Form.Label>
            <Form.Select
              name="driver_id"
              value={formData.driver_id}
              onChange={handleChange}
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
              onChange={handleChange}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </Form.Select>
          </Form.Group>

          <Button variant="primary" type="submit">
            Save Jeepney
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default JeepneyForm;
