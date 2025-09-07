import React, { useState } from "react";
import { Form, Button, Card, Alert } from "react-bootstrap";
import JeepneyService from "../../services/jeepneyService";

const JeepneyForm = ({ onDataUpdate }) => {
  const [formData, setFormData] = useState({
    route: "",
    plate_number: "",
    status: "active",
    capacity: "",
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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
      setFormData({ route: "", plate_number: "", status: "active", capacity: "" });
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
          <Form.Group className="mb-3">
            <Form.Label>Route</Form.Label>
            <Form.Control
              type="text"
              name="route"
              value={formData.route}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Plate Number</Form.Label>
            <Form.Control
              type="text"
              name="plate_number"
              value={formData.plate_number}
              onChange={handleChange}
              required
            />
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
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Capacity</Form.Label>
            <Form.Control
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Button variant="primary" type="submit">
            Save
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default JeepneyForm;
