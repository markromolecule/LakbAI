import React, { useState, useEffect } from "react";
import { Form, Button, Card, Alert, Row, Col, Badge } from "react-bootstrap";
import JeepneyService from "../../services/jeepneyService";
import RouteService from "../../services/routeService";
import DriverService from "../../services/driverService";
import CheckpointService from "../../services/checkpointService";
import { API_CONFIG } from "../../config/apiConfig";

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
  const [checkpoints, setCheckpoints] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchRoutes();
    fetchDrivers();
    generateJeepneyNumber();
  }, []);

  const generateJeepneyNumber = () => {
    // Generate a random 3-digit number for the admin to use
    const random = Math.floor(100 + Math.random() * 900).toString();
    setFormData((prev) => ({ ...prev, jeepney_number: random }));
  };

  const fetchRoutes = async () => {
    setRoutes([
      { id: 1, route_name: 'SM Epza → SM Dasmariñas' },
      { id: 2, route_name: 'SM Dasmariñas → SM Epza' }
    ]);
  };

  const fetchDrivers = async () => {
    try {
      const baseUrl = API_CONFIG.BASE_URL.replace('/routes/api.php', '');
      const response = await fetch(`${baseUrl}/api/admin/users?user_type=driver`);
      const data = await response.json();
      if (data.status === 'success') {
        setDrivers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setError('Failed to fetch drivers');
    }
  };

  const handleChange = (e) => {
    const newFormData = {
      ...formData,
      [e.target.name]: e.target.value,
    };
    setFormData(newFormData);
    
    // If route is changed, fetch checkpoints for that route
    if (e.target.name === 'route_id' && e.target.value) {
      fetchCheckpoints(e.target.value);
    }
  };

  const fetchCheckpoints = async (routeId) => {
    const result = await CheckpointService.getCheckpointsByRoute(routeId);
    if (result.success) {
      setCheckpoints(result.checkpoints);
    } else {
      setCheckpoints([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const payload = {
      jeepney_number: `LKB-${formData.jeepney_number}`,
      plate_number: formData.plate_number,
      model: formData.model,
      capacity: Number(formData.capacity) || 20,
      route_id: Number(formData.route_id) || null,
      driver_id: formData.driver_id ? Number(formData.driver_id) : null,
      status: formData.status,
    };

    const result = await JeepneyService.createJeepney(payload);
    if (result.success) {
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
      generateJeepneyNumber();
      onDataUpdate();
    } else {
      setError(result.error || result.message || "Failed to add jeepney");
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
                <div className="input-group">
                  <span className="input-group-text">LKB-</span>
                  <Form.Control
                    type="text"
                    name="jeepney_number"
                    value={formData.jeepney_number}
                    onChange={handleChange}
                    placeholder="e.g., 001"
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
                <Form.Select
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
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
                  {driver.first_name} {driver.last_name} ({driver.email})
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

          {/* Route Checkpoints Display */}
          {formData.route_id && checkpoints.length > 0 && (
            <div className="mt-3">
              <h6>Route Checkpoints ({checkpoints.length} stops)</h6>
              <div className="d-flex flex-wrap gap-2">
                {checkpoints.map((checkpoint) => (
                  <Badge 
                    key={checkpoint.id}
                    bg={checkpoint.is_origin ? "success" : checkpoint.is_destination ? "primary" : "secondary"}
                    className="p-2"
                  >
                    {checkpoint.sequence_order}. {checkpoint.checkpoint_name}
                    {checkpoint.is_origin && " (Origin)"}
                    {checkpoint.is_destination && " (Destination)"}
                    <br />
                    <small>₱{parseFloat(checkpoint.fare_from_origin).toFixed(2)}</small>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button variant="primary" type="submit" className="mt-3">
            Save Jeepney
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default JeepneyForm;
