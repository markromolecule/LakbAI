import React from 'react';
import { Form, Row, Col } from 'react-bootstrap';

const DriverLicenseForm = ({ formData, handleInputChange, isReadOnly }) => {
  // Only show for drivers
  if (formData.user_type !== 'driver') {
    return null;
  }

  return (
    <>
      <h6 className="mb-3 text-primary mt-4">
        <i className="bi bi-car-front me-2"></i>
        Driver's License & Verification
      </h6>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>License Verification Status</Form.Label>
            <div className="d-flex flex-column justify-content-center" style={{ minHeight: '38px' }}>
              <Form.Check
                type="checkbox"
                name="drivers_license_verified"
                label="License Verified"
                checked={formData.drivers_license_verified === 1}
                onChange={(e) => {
                  handleInputChange({
                    target: {
                      name: 'drivers_license_verified',
                      value: e.target.checked ? 1 : 0,
                      type: 'checkbox'
                    }
                  });
                }}
                disabled={isReadOnly}
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
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>License Document</Form.Label>
            <div className="text-muted small">
              {formData.drivers_license_name ? (
                <div>
                  <strong>Current:</strong> {formData.drivers_license_name}
                  {formData.drivers_license_path && (
                    <div className="mt-2">
                      <a 
                        href={`http://localhost/LakbAI/LakbAI-API/api/document/${formData.drivers_license_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-primary btn-sm"
                      >
                        <i className="bi bi-eye me-1"></i>
                        View Document
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div>No license document uploaded</div>
              )}
            </div>
          </Form.Group>
        </Col>
      </Row>
    </>
  );
};

export default DriverLicenseForm;
