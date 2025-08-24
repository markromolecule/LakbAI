import React from 'react';
import { Form, Row, Col } from 'react-bootstrap';

const BasicInformationSection = ({ formData, errors, handleInputChange, isReadOnly, mode }) => {
  return (
    <>
      <h6 className="mb-3 text-primary">
        <i className="bi bi-person-circle me-2"></i>
        Basic Information
      </h6>
      
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Username *</Form.Label>
            <Form.Control
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              isInvalid={!!errors.username}
              readOnly={isReadOnly}
            />
            <Form.Control.Feedback type="invalid">
              {errors.username}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Email *</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              isInvalid={!!errors.email}
              readOnly={isReadOnly}
            />
            <Form.Control.Feedback type="invalid">
              {errors.email}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      {(mode === 'create' || mode === 'edit') && (
        <Row>
          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>
                Password {mode === 'create' ? '*' : '(leave blank to keep current)'}
              </Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                isInvalid={!!errors.password}
                placeholder={mode === 'edit' ? 'Leave blank to keep current password' : ''}
              />
              <Form.Control.Feedback type="invalid">
                {errors.password}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>
      )}

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>First Name *</Form.Label>
            <Form.Control
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              isInvalid={!!errors.first_name}
              readOnly={isReadOnly}
            />
            <Form.Control.Feedback type="invalid">
              {errors.first_name}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Last Name *</Form.Label>
            <Form.Control
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              isInvalid={!!errors.last_name}
              readOnly={isReadOnly}
            />
            <Form.Control.Feedback type="invalid">
              {errors.last_name}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Phone Number *</Form.Label>
            <Form.Control
              type="text"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              isInvalid={!!errors.phone_number}
              readOnly={isReadOnly}
              placeholder="09XXXXXXXXX"
            />
            <Form.Control.Feedback type="invalid">
              {errors.phone_number}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Gender *</Form.Label>
            <Form.Select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              disabled={isReadOnly}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Birthday *</Form.Label>
            <Form.Control
              type="date"
              name="birthday"
              value={formData.birthday}
              onChange={handleInputChange}
              isInvalid={!!errors.birthday}
              readOnly={isReadOnly}
            />
            <Form.Control.Feedback type="invalid">
              {errors.birthday}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>User Type *</Form.Label>
            <Form.Select
              name="user_type"
              value={formData.user_type}
              onChange={handleInputChange}
              disabled={isReadOnly}
            >
              <option value="passenger">Passenger</option>
              <option value="driver">Driver</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
    </>
  );
};

export default BasicInformationSection;
