import React from 'react';
import { Form, Row, Col } from 'react-bootstrap';

const DiscountForm = ({ formData, handleInputChange, isReadOnly }) => {
  // Hide discount form for drivers
  if (formData.user_type === 'driver') {
    return null;
  }

  return (
    <>
      <h6 className="mb-3 text-primary mt-4">
        <i className="bi bi-award me-2"></i>
        Discount & Verification
      </h6>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Discount Type</Form.Label>
            <Form.Select
              name="discount_type"
              value={formData.discount_type}
              onChange={handleInputChange}
              disabled={isReadOnly}
            >
              <option value="">No Discount</option>
              <option value="PWD">PWD</option>
              <option value="Senior Citizen">Senior Citizen</option>
              <option value="Student">Student</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Verification Status</Form.Label>
            <div className="d-flex flex-column justify-content-center" style={{ minHeight: '38px' }}>
              <Form.Check
                type="checkbox"
                name="discount_verified"
                label="Discount Verified"
                checked={formData.discount_verified}
                onChange={handleInputChange}
                disabled={isReadOnly || !formData.discount_type}
              />
              <Form.Check
                type="checkbox"
                name="is_verified"
                label="Account Verified"
                checked={formData.is_verified}
                onChange={handleInputChange}
                disabled={isReadOnly}
              />
            </div>
          </Form.Group>
        </Col>
      </Row>
    </>
  );
};

export default DiscountForm;
