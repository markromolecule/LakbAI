import React from 'react';
import { Form, Row, Col, InputGroup } from 'react-bootstrap';

const AddressForm = ({ formData, errors, handleInputChange, isReadOnly }) => {
  return (
    <div className="bg-white rounded-3 p-4 border shadow-sm">

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold text-dark">
              <i className="bi bi-house me-1"></i>
              House Number *
            </Form.Label>
            <InputGroup>
              <InputGroup.Text>
                <i className="bi bi-123 text-muted"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                name="house_number"
                value={formData.house_number}
                onChange={handleInputChange}
                isInvalid={!!errors.house_number}
                readOnly={isReadOnly}
                placeholder="Enter house number"
                className={errors.house_number ? 'border-danger' : ''}
              />
            </InputGroup>
            <Form.Control.Feedback type="invalid">
              {errors.house_number}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold text-dark">
              <i className="bi bi-signpost me-1"></i>
              Street Name *
            </Form.Label>
            <InputGroup>
              <InputGroup.Text>
                <i className="bi bi-road text-muted"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                name="street_name"
                value={formData.street_name}
                onChange={handleInputChange}
                isInvalid={!!errors.street_name}
                readOnly={isReadOnly}
                placeholder="Enter street name"
                className={errors.street_name ? 'border-danger' : ''}
              />
            </InputGroup>
            <Form.Control.Feedback type="invalid">
              {errors.street_name}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold text-dark">
              <i className="bi bi-building me-1"></i>
              Barangay *
            </Form.Label>
            <InputGroup>
              <InputGroup.Text>
                <i className="bi bi-geo-alt text-muted"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                name="barangay"
                value={formData.barangay}
                onChange={handleInputChange}
                isInvalid={!!errors.barangay}
                readOnly={isReadOnly}
                placeholder="Enter barangay"
                className={errors.barangay ? 'border-danger' : ''}
              />
            </InputGroup>
            <Form.Control.Feedback type="invalid">
              {errors.barangay}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold text-dark">
              <i className="bi bi-building me-1"></i>
              City/Municipality *
            </Form.Label>
            <InputGroup>
              <InputGroup.Text>
                <i className="bi bi-geo text-muted"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                name="city_municipality"
                value={formData.city_municipality}
                onChange={handleInputChange}
                isInvalid={!!errors.city_municipality}
                readOnly={isReadOnly}
                placeholder="Enter city or municipality"
                className={errors.city_municipality ? 'border-danger' : ''}
              />
            </InputGroup>
            <Form.Control.Feedback type="invalid">
              {errors.city_municipality}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold text-dark">
              <i className="bi bi-map me-1"></i>
              Province *
            </Form.Label>
            <InputGroup>
              <InputGroup.Text>
                <i className="bi bi-geo-fill text-muted"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                isInvalid={!!errors.province}
                readOnly={isReadOnly}
                placeholder="Enter province"
                className={errors.province ? 'border-danger' : ''}
              />
            </InputGroup>
            <Form.Control.Feedback type="invalid">
              {errors.province}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold text-dark">
              <i className="bi bi-mailbox me-1"></i>
              Postal Code *
            </Form.Label>
            <InputGroup>
              <InputGroup.Text>
                <i className="bi bi-123 text-muted"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleInputChange}
                isInvalid={!!errors.postal_code}
                readOnly={isReadOnly}
                placeholder="XXXX"
                className={errors.postal_code ? 'border-danger' : ''}
              />
            </InputGroup>
            <Form.Control.Feedback type="invalid">
              {errors.postal_code}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              <i className="bi bi-info-circle me-1"></i>
              Enter 4-digit postal code
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>
    </div>
  );
};

export default AddressForm;
