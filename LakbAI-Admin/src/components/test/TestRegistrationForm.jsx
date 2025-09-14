/**
 * Test Registration Form
 * Demonstrates the file upload functionality
 */

import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';

const TestRegistrationForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: '',
    password: '',
    confirmPassword: '',
    houseNumber: '',
    streetName: '',
    barangay: '',
    city: '',
    province: '',
    postalCode: '',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    userType: 'passenger',
    discountType: '',
    driversLicense: null,
    discountDocument: null,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const fieldName = e.target.name;
    
    if (file) {
      // Basic validation
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          [fieldName]: 'Please upload a valid image (JPG, PNG) or PDF file'
        }));
        return;
      }
      
      if (file.size > maxSize) {
        setErrors(prev => ({
          ...prev,
          [fieldName]: 'File size must be less than 5MB'
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        [fieldName]: file
      }));

      // Clear error if file is valid
      if (errors[fieldName]) {
        setErrors(prev => ({
          ...prev,
          [fieldName]: ''
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setErrors({});

    try {
      // Prepare form data for file upload
      const formDataToSend = new FormData();
      
      // Add basic registration data
      formDataToSend.append('username', formData.firstName.toLowerCase() + formData.lastName.toLowerCase());
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('first_name', formData.firstName);
      formDataToSend.append('last_name', formData.lastName);
      formDataToSend.append('phone_number', formData.phoneNumber.replace(/\s/g, ''));
      formDataToSend.append('birthday', `${formData.birthYear}-${formData.birthMonth.toString().padStart(2, '0')}-${formData.birthDay.toString().padStart(2, '0')}`);
      formDataToSend.append('gender', formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1));
      formDataToSend.append('house_number', formData.houseNumber);
      formDataToSend.append('street_name', formData.streetName);
      formDataToSend.append('barangay', formData.barangay);
      formDataToSend.append('city_municipality', formData.city);
      formDataToSend.append('province', formData.province);
      formDataToSend.append('postal_code', formData.postalCode);
      formDataToSend.append('user_type', formData.userType);
      formDataToSend.append('is_verified', 'false');
      formDataToSend.append('discount_type', formData.discountType || '');
      formDataToSend.append('discount_verified', 'false');
      
      // Add driver's license file if present (for drivers)
      if (formData.driversLicense && formData.userType === 'driver') {
        formDataToSend.append('license_document', formData.driversLicense);
        formDataToSend.append('drivers_license', formData.driversLicense.name);
      }
      
      // Add discount document file if present (for passengers with discount)
      if (formData.discountDocument && formData.userType === 'passenger' && formData.discountType) {
        formDataToSend.append('discount_document', formData.discountDocument);
      }

      // Send to API
      const response = await fetch('/api/register-with-files', {
        method: 'POST',
        body: formDataToSend,
      });
      
      const result = await response.json();
      setResult(result);
      
      if (result.status === 'success') {
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phoneNumber: '',
          gender: '',
          password: '',
          confirmPassword: '',
          houseNumber: '',
          streetName: '',
          barangay: '',
          city: '',
          province: '',
          postalCode: '',
          birthYear: '',
          birthMonth: '',
          birthDay: '',
          userType: 'passenger',
          discountType: '',
          driversLicense: null,
          discountDocument: null,
        });
      }
    } catch (error) {
      setResult({
        status: 'error',
        message: 'Registration failed: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Header>
              <h3>Test Registration Form with File Upload</h3>
              <p className="mb-0">This form demonstrates the new file upload functionality</p>
            </Card.Header>
            <Card.Body>
              {result && (
                <Alert variant={result.status === 'success' ? 'success' : 'danger'}>
                  <strong>{result.status === 'success' ? 'Success!' : 'Error!'}</strong>
                  <br />
                  {result.message}
                  {result.data && (
                    <div className="mt-2">
                      <strong>File Upload Details:</strong>
                      <ul className="mb-0">
                        {result.data.file_path && (
                          <li>File Path: {result.data.file_path}</li>
                        )}
                        {result.data.original_name && (
                          <li>Original Name: {result.data.original_name}</li>
                        )}
                        {result.data.file_size && (
                          <li>File Size: {result.data.file_size} bytes</li>
                        )}
                      </ul>
                    </div>
                  )}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>First Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        isInvalid={!!errors.firstName}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Last Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        isInvalid={!!errors.lastName}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email *</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        isInvalid={!!errors.email}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number *</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        isInvalid={!!errors.phoneNumber}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Gender *</Form.Label>
                      <Form.Select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        isInvalid={!!errors.gender}
                        required
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>User Type *</Form.Label>
                      <Form.Select
                        name="userType"
                        value={formData.userType}
                        onChange={handleChange}
                        isInvalid={!!errors.userType}
                        required
                      >
                        <option value="passenger">Passenger</option>
                        <option value="driver">Driver</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Password *</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        isInvalid={!!errors.password}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Confirm Password *</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        isInvalid={!!errors.confirmPassword}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Address Fields */}
                <h5 className="mt-4">Address Information</h5>
                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>House Number *</Form.Label>
                      <Form.Control
                        type="text"
                        name="houseNumber"
                        value={formData.houseNumber}
                        onChange={handleChange}
                        isInvalid={!!errors.houseNumber}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={9}>
                    <Form.Group className="mb-3">
                      <Form.Label>Street Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="streetName"
                        value={formData.streetName}
                        onChange={handleChange}
                        isInvalid={!!errors.streetName}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Barangay *</Form.Label>
                      <Form.Control
                        type="text"
                        name="barangay"
                        value={formData.barangay}
                        onChange={handleChange}
                        isInvalid={!!errors.barangay}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>City/Municipality *</Form.Label>
                      <Form.Control
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        isInvalid={!!errors.city}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Province *</Form.Label>
                      <Form.Control
                        type="text"
                        name="province"
                        value={formData.province}
                        onChange={handleChange}
                        isInvalid={!!errors.province}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Postal Code *</Form.Label>
                      <Form.Control
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        isInvalid={!!errors.postalCode}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Birthday *</Form.Label>
                      <Form.Control
                        type="date"
                        name="birthday"
                        value={`${formData.birthYear}-${formData.birthMonth.toString().padStart(2, '0')}-${formData.birthDay.toString().padStart(2, '0')}`}
                        onChange={(e) => {
                          const date = new Date(e.target.value);
                          setFormData(prev => ({
                            ...prev,
                            birthYear: date.getFullYear().toString(),
                            birthMonth: (date.getMonth() + 1).toString(),
                            birthDay: date.getDate().toString()
                          }));
                        }}
                        isInvalid={!!errors.birthday}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Discount Section for Passengers */}
                {formData.userType === 'passenger' && (
                  <>
                    <h5 className="mt-4">Discount Information</h5>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Discount Type</Form.Label>
                          <Form.Select
                            name="discountType"
                            value={formData.discountType}
                            onChange={handleChange}
                            isInvalid={!!errors.discountType}
                          >
                            <option value="">No Discount</option>
                            <option value="PWD">PWD (Person with Disability)</option>
                            <option value="Senior Citizen">Senior Citizen</option>
                            <option value="Student">Student</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    {formData.discountType && (
                      <Row>
                        <Col md={12}>
                          <Form.Group className="mb-3">
                            <Form.Label>Discount Document</Form.Label>
                            <Form.Control
                              type="file"
                              name="discountDocument"
                              onChange={handleFileChange}
                              accept=".jpg,.jpeg,.png,.pdf"
                              isInvalid={!!errors.discountDocument}
                            />
                            <Form.Text className="text-muted">
                              Upload your discount document (JPG, PNG, or PDF, max 5MB)
                            </Form.Text>
                            {errors.discountDocument && (
                              <Form.Control.Feedback type="invalid">
                                {errors.discountDocument}
                              </Form.Control.Feedback>
                            )}
                          </Form.Group>
                        </Col>
                      </Row>
                    )}
                  </>
                )}

                {/* Driver License Section for Drivers */}
                {formData.userType === 'driver' && (
                  <>
                    <h5 className="mt-4">Driver's License</h5>
                    <Row>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Driver's License Document *</Form.Label>
                          <Form.Control
                            type="file"
                            name="driversLicense"
                            onChange={handleFileChange}
                            accept=".jpg,.jpeg,.png,.pdf"
                            isInvalid={!!errors.driversLicense}
                            required
                          />
                          <Form.Text className="text-muted">
                            Upload your driver's license (JPG, PNG, or PDF, max 5MB)
                          </Form.Text>
                          {errors.driversLicense && (
                            <Form.Control.Feedback type="invalid">
                              {errors.driversLicense}
                            </Form.Control.Feedback>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>
                  </>
                )}

                <div className="d-grid">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? 'Registering...' : 'Register Account'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TestRegistrationForm;
