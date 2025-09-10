import React from 'react';
import { Form, Row, Col, InputGroup } from 'react-bootstrap';

const BasicInformationForm = ({ formData, errors, handleInputChange, isReadOnly, mode }) => {
  return (
    <div className="bg-white rounded-3 p-4 border shadow-sm">
      
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold text-dark">
              <i className="bi bi-person me-1"></i>
              Username *
            </Form.Label>
            <InputGroup>
              <InputGroup.Text>
                <i className="bi bi-at text-muted"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                isInvalid={!!errors.username}
                readOnly={isReadOnly}
                placeholder="Enter username"
                className={errors.username ? 'border-danger' : ''}
              />
            </InputGroup>
            <Form.Control.Feedback type="invalid">
              {errors.username}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              <i className="bi bi-info-circle me-1"></i>
              Choose a unique username for login
            </Form.Text>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold text-dark">
              <i className="bi bi-envelope me-1"></i>
              Email Address *
            </Form.Label>
            <InputGroup>
              <InputGroup.Text>
                <i className="bi bi-envelope text-muted"></i>
              </InputGroup.Text>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                isInvalid={!!errors.email}
                readOnly={isReadOnly}
                placeholder="Enter email address"
                className={errors.email ? 'border-danger' : ''}
              />
            </InputGroup>
            <Form.Control.Feedback type="invalid">
              {errors.email}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              <i className="bi bi-info-circle me-1"></i>
              We'll use this for notifications and account recovery
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>

      {(mode === 'create' || mode === 'edit') && (
        <Row>
          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold text-dark">
                <i className="bi bi-lock me-1"></i>
                Password {mode === 'create' ? '*' : '(leave blank to keep current)'}
              </Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-key text-muted"></i>
                </InputGroup.Text>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  isInvalid={!!errors.password}
                  placeholder={mode === 'edit' ? 'Leave blank to keep current password' : 'Enter secure password'}
                  className={errors.password ? 'border-danger' : ''}
                />
              </InputGroup>
              <Form.Control.Feedback type="invalid">
                {errors.password}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                {mode === 'create' ? 'Minimum 8 characters with uppercase, lowercase, and number' : 'Leave blank to keep current password'}
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>
      )}

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold text-dark">
              <i className="bi bi-person me-1"></i>
              First Name *
            </Form.Label>
            <InputGroup>
              <InputGroup.Text>
                <i className="bi bi-person text-muted"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                isInvalid={!!errors.first_name}
                readOnly={isReadOnly}
                placeholder="Enter first name"
                className={errors.first_name ? 'border-danger' : ''}
              />
            </InputGroup>
            <Form.Control.Feedback type="invalid">
              {errors.first_name}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold text-dark">
              <i className="bi bi-person me-1"></i>
              Last Name *
            </Form.Label>
            <InputGroup>
              <InputGroup.Text>
                <i className="bi bi-person text-muted"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                isInvalid={!!errors.last_name}
                readOnly={isReadOnly}
                placeholder="Enter last name"
                className={errors.last_name ? 'border-danger' : ''}
              />
            </InputGroup>
            <Form.Control.Feedback type="invalid">
              {errors.last_name}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold text-dark">
              <i className="bi bi-phone me-1"></i>
              Phone Number *
            </Form.Label>
            <InputGroup>
              <InputGroup.Text>
                <i className="bi bi-telephone text-muted"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                isInvalid={!!errors.phone_number}
                readOnly={isReadOnly}
                placeholder="09XXXXXXXXX"
                className={errors.phone_number ? 'border-danger' : ''}
              />
            </InputGroup>
            <Form.Control.Feedback type="invalid">
              {errors.phone_number}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              <i className="bi bi-info-circle me-1"></i>
              Enter 11-digit mobile number starting with 09
            </Form.Text>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold text-dark">
              <i className="bi bi-gender-ambiguous me-1"></i>
              Gender *
            </Form.Label>
            <InputGroup>
              <InputGroup.Text>
                <i className="bi bi-person-badge text-muted"></i>
              </InputGroup.Text>
              <Form.Select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                disabled={isReadOnly}
                className="form-select"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </Form.Select>
            </InputGroup>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold text-dark">
              <i className="bi bi-calendar-event me-1"></i>
              Birthday *
            </Form.Label>
            <InputGroup>
              <InputGroup.Text>
                <i className="bi bi-calendar text-muted"></i>
              </InputGroup.Text>
              <Form.Control
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleInputChange}
                isInvalid={!!errors.birthday}
                readOnly={isReadOnly}
                className={errors.birthday ? 'border-danger' : ''}
              />
            </InputGroup>
            <Form.Control.Feedback type="invalid">
              {errors.birthday}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              <i className="bi bi-info-circle me-1"></i>
              Must be at least 13 years old
            </Form.Text>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold text-dark">
              <i className="bi bi-person-workspace me-1"></i>
              User Type *
            </Form.Label>
            <InputGroup>
              <InputGroup.Text>
                <i className="bi bi-people text-muted"></i>
              </InputGroup.Text>
              <Form.Select
                name="user_type"
                value={formData.user_type}
                onChange={handleInputChange}
                disabled={isReadOnly}
                className="form-select"
              >
                <option value="passenger">Passenger</option>
                <option value="driver">Driver</option>
              </Form.Select>
            </InputGroup>
            <Form.Text className="text-muted">
              <i className="bi bi-info-circle me-1"></i>
              Choose the user's role in the system
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>
    </div>
  );
};

export default BasicInformationForm;
