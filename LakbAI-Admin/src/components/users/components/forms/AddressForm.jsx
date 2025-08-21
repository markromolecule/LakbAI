import React from 'react';
import { Form, Row, Col } from 'react-bootstrap';

const AddressForm = ({ formData, errors, handleInputChange, isReadOnly }) => {
  return (
    <>
      <h6 className="mb-3 text-primary mt-4">
        <i className="bi bi-geo-alt me-2"></i>
        Address Information
      </h6>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>House Number *</Form.Label>
            <Form.Control
              type="text"
              name="house_number"
              value={formData.house_number}
              onChange={handleInputChange}
              isInvalid={!!errors.house_number}
              readOnly={isReadOnly}
            />
            <Form.Control.Feedback type="invalid">
              {errors.house_number}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Street Name *</Form.Label>
            <Form.Control
              type="text"
              name="street_name"
              value={formData.street_name}
              onChange={handleInputChange}
              isInvalid={!!errors.street_name}
              readOnly={isReadOnly}
            />
            <Form.Control.Feedback type="invalid">
              {errors.street_name}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Barangay *</Form.Label>
            <Form.Control
              type="text"
              name="barangay"
              value={formData.barangay}
              onChange={handleInputChange}
              isInvalid={!!errors.barangay}
              readOnly={isReadOnly}
            />
            <Form.Control.Feedback type="invalid">
              {errors.barangay}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>City/Municipality *</Form.Label>
            <Form.Control
              type="text"
              name="city_municipality"
              value={formData.city_municipality}
              onChange={handleInputChange}
              isInvalid={!!errors.city_municipality}
              readOnly={isReadOnly}
            />
            <Form.Control.Feedback type="invalid">
              {errors.city_municipality}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Province *</Form.Label>
            <Form.Control
              type="text"
              name="province"
              value={formData.province}
              onChange={handleInputChange}
              isInvalid={!!errors.province}
              readOnly={isReadOnly}
            />
            <Form.Control.Feedback type="invalid">
              {errors.province}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Postal Code *</Form.Label>
            <Form.Control
              type="text"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleInputChange}
              isInvalid={!!errors.postal_code}
              readOnly={isReadOnly}
              placeholder="XXXX"
            />
            <Form.Control.Feedback type="invalid">
              {errors.postal_code}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>
    </>
  );
};

export default AddressForm;
