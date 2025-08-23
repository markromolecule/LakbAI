import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleFill, ArrowLeft } from 'react-bootstrap-icons';
import { userSyncService } from '../../../services/userSyncService';
import styles from '../styles/DriverUsernameSetup.module.css';

const DriverUsernameSetup = () => {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    houseNumber: '',
    streetName: '',
    barangay: '',
    cityMunicipality: '',
    province: '',
    postalCode: '',
    birthMonth: '',
    birthDate: '',
    birthYear: '',
    gender: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Redirect if not authenticated or if user is admin
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/driver-signup');
      return;
    }

    if (isAuthenticated && user) {
      // Check if user is admin (should not be here)
      const adminEmails = [
        'livadomc@gmail.com',
        'admin@lakbai.com',
        'support@lakbai.com'
      ];
      
      console.log('Checking user email:', user.email, 'against admin emails:', adminEmails);
      
      if (adminEmails.includes(user.email)) {
        // Admin user - redirect to admin login
        console.log('Admin user detected in driver flow, redirecting to admin login');
        navigate('/admin-login');
        return;
      }

      // Check if user has admin role from Auth0
      const userRoles = user['https://lakbai.com/roles'] || [];
      const hasAdminRole = userRoles.includes('admin');
      const hasDriverRole = userRoles.includes('driver');
      
      console.log('User roles:', userRoles, 'Has admin role:', hasAdminRole, 'Has driver role:', hasDriverRole);
      
      // If user has both admin and driver roles, prioritize driver role for this flow
      if (hasAdminRole && !hasDriverRole) {
        // User with admin role but no driver role - redirect to admin login
        console.log('User with admin role (no driver role) detected in driver flow, redirecting to admin login');
        navigate('/admin-login');
        return;
      }

      // Check if username already exists
      const existingUsername = localStorage.getItem(`driver_username_${user.email}`);
      if (existingUsername) {
        // Username already set up, redirect to driver login
        navigate('/driver-login');
        return;
      }
    }
  }, [isAuthenticated, user, isLoading, navigate]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const { username, firstName, lastName, phoneNumber, houseNumber, streetName, barangay, cityMunicipality, province, postalCode, birthMonth, birthDate, birthYear, gender } = formData;

    if (!username.trim()) {
      setError('Username is required');
      return false;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }

    if (username.length > 20) {
      setError('Username must be less than 20 characters');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return false;
    }

    if (!firstName.trim()) {
      setError('First name is required');
      return false;
    }

    if (!lastName.trim()) {
      setError('Last name is required');
      return false;
    }

    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return false;
    }

    // Validate phone number format (Philippine format)
    const phoneRegex = /^(\+63|0)[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s+/g, ''))) {
      setError('Please enter a valid Philippine phone number');
      return false;
    }

    if (!houseNumber.trim()) {
      setError('House number is required');
      return false;
    }

    if (!streetName.trim()) {
      setError('Street name is required');
      return false;
    }

    if (!barangay.trim()) {
      setError('Barangay is required');
      return false;
    }

    if (!cityMunicipality.trim()) {
      setError('City/Municipality is required');
      return false;
    }

    if (!province.trim()) {
      setError('Province is required');
      return false;
    }

    if (!postalCode.trim()) {
      setError('Postal code is required');
      return false;
    }

    if (!birthMonth || !birthDate || !birthYear) {
      setError('Complete birthday information is required');
      return false;
    }

    if (!gender) {
      setError('Gender is required');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Store username
      localStorage.setItem(`driver_username_${user.email}`, formData.username);

      // Prepare complete profile data
      const completeProfileData = {
        ...formData,
        username: formData.username,
        birthday: `${formData.birthMonth} ${formData.birthDate}, ${formData.birthYear}`,
        address: {
          house_number: formData.houseNumber,
          street_name: formData.streetName,
          barangay: formData.barangay,
          city_municipality: formData.cityMunicipality,
          province: formData.province,
          postal_code: formData.postalCode
        }
      };

      // Sync to database
      const accessToken = await getAccessTokenSilently();
      const syncResult = await userSyncService.syncAfterDriverSignup(user, accessToken, completeProfileData);

      if (syncResult.success) {
        console.log('Driver profile synced successfully:', syncResult);
        setIsSuccess(true);
        
        // Redirect to driver login after 3 seconds
        setTimeout(() => {
          navigate('/driver-login');
        }, 3000);
      } else {
        throw new Error(syncResult.message || 'Failed to sync profile data');
      }
    } catch (err) {
      console.error('Error completing driver setup:', err);
      setError(err.message || 'Failed to complete setup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Container className={styles.container}>
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner}></div>
          <p>Loading...</p>
        </div>
      </Container>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect in useEffect
  }

  if (isSuccess) {
    return (
      <Container className={styles.container}>
        <div className={styles.content}>
          <Card className={styles.setupCard}>
            <Card.Body className={styles.cardBody}>
              <div className={styles.successContainer}>
                <CheckCircleFill className={styles.successIcon} />
                <h2 className={styles.successTitle}>Profile Complete!</h2>
                <p className={styles.successMessage}>
                  Your driver account has been successfully set up.
                </p>
                <p className={styles.redirectMessage}>
                  Redirecting to driver login...
                </p>
              </div>
            </Card.Body>
          </Card>
        </div>
      </Container>
    );
  }

  return (
    <Container className={styles.container}>
      <div className={styles.content}>
        <Card className={styles.setupCard}>
          <Card.Body className={styles.cardBody}>
            {/* Back Button */}
            <button 
              className={styles.backButton}
              onClick={() => navigate('/driver-signup')}
            >
              <ArrowLeft className="me-2" />
              Back to Signup
            </button>

            {/* Header */}
            <div className={styles.header}>
              <div className={styles.logoContainer}>
                <img
                  src="/image/logofinal.png"
                  width="60"
                  height="60"
                  className={styles.logo}
                  alt="LakbAI Logo"
                />
                <div className={styles.logoText}>
                  <h3 className={styles.brandName}>LakbAI</h3>
                  <p className={styles.brandTagline}>Complete Your Profile</p>
                </div>
              </div>
            </div>

            <h2 className={styles.title}>Complete Your Driver Profile</h2>
            <p className={styles.subtitle}>
              Welcome, {user.name || user.email}! Please complete your profile information to finish your driver registration.
            </p>

            {/* Setup Form */}
            <Form onSubmit={handleSubmit} className={styles.form}>
              {error && (
                <Alert variant="danger" className={styles.alert}>
                  {error}
                </Alert>
              )}

              {/* Username */}
              <Form.Group className="mb-3">
                <Form.Label>Username *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.username}
                  onChange={(e) => updateFormData('username', e.target.value)}
                  placeholder="Enter your username"
                  className={styles.input}
                  maxLength={20}
                />
                <Form.Text className="text-muted">
                  Username must be 3-20 characters long and can only contain letters, numbers, and underscores.
                </Form.Text>
              </Form.Group>

              {/* Personal Information */}
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>First Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => updateFormData('firstName', e.target.value)}
                      placeholder="Enter your first name"
                      className={styles.input}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Last Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => updateFormData('lastName', e.target.value)}
                      placeholder="Enter your last name"
                      className={styles.input}
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Phone Number */}
              <Form.Group className="mb-3">
                <Form.Label>Phone Number *</Form.Label>
                <Form.Control
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => updateFormData('phoneNumber', e.target.value)}
                  placeholder="Enter your phone number"
                  className={styles.input}
                />
              </Form.Group>

              {/* Address */}
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>House No. *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.houseNumber}
                      onChange={(e) => updateFormData('houseNumber', e.target.value)}
                      placeholder="House No."
                      className={styles.input}
                    />
                  </Form.Group>
                </Col>
                <Col md={9}>
                  <Form.Group className="mb-3">
                    <Form.Label>Street Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.streetName}
                      onChange={(e) => updateFormData('streetName', e.target.value)}
                      placeholder="Enter street name"
                      className={styles.input}
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
                      value={formData.barangay}
                      onChange={(e) => updateFormData('barangay', e.target.value)}
                      placeholder="Enter barangay"
                      className={styles.input}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>City/Municipality *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.cityMunicipality}
                      onChange={(e) => updateFormData('cityMunicipality', e.target.value)}
                      placeholder="Enter city or municipality"
                      className={styles.input}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Province *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.province}
                      onChange={(e) => updateFormData('province', e.target.value)}
                      placeholder="Enter province"
                      className={styles.input}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Postal Code *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => updateFormData('postalCode', e.target.value)}
                      placeholder="Postal Code"
                      className={styles.input}
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Birthday */}
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Birth Month *</Form.Label>
                    <Form.Select
                      value={formData.birthMonth}
                      onChange={(e) => updateFormData('birthMonth', e.target.value)}
                      className={styles.input}
                    >
                      <option value="">Select Month</option>
                      <option value="January">January</option>
                      <option value="February">February</option>
                      <option value="March">March</option>
                      <option value="April">April</option>
                      <option value="May">May</option>
                      <option value="June">June</option>
                      <option value="July">July</option>
                      <option value="August">August</option>
                      <option value="September">September</option>
                      <option value="October">October</option>
                      <option value="November">November</option>
                      <option value="December">December</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Birth Date *</Form.Label>
                    <Form.Select
                      value={formData.birthDate}
                      onChange={(e) => updateFormData('birthDate', e.target.value)}
                      className={styles.input}
                    >
                      <option value="">Select Date</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(date => (
                        <option key={date} value={date}>{date}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Birth Year *</Form.Label>
                    <Form.Select
                      value={formData.birthYear}
                      onChange={(e) => updateFormData('birthYear', e.target.value)}
                      className={styles.input}
                    >
                      <option value="">Select Year</option>
                      {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              {/* Gender */}
              <Form.Group className="mb-4">
                <Form.Label>Gender *</Form.Label>
                <Form.Select
                  value={formData.gender}
                  onChange={(e) => updateFormData('gender', e.target.value)}
                  className={styles.input}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </Form.Select>
              </Form.Group>

              <Button
                type="submit"
                variant="success"
                size="lg"
                className={styles.submitButton}
                disabled={isSubmitting}
                block
              >
                {isSubmitting ? (
                  <>
                    <div className={styles.spinner}></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <CheckCircleFill className="me-2" />
                    Complete Setup
                  </>
                )}
              </Button>
            </Form>

            {/* User Info */}
            <div className={styles.userInfo}>
              <h6>Account Information:</h6>
              <div className={styles.userDetails}>
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>Name:</strong> {user.name || 'Not provided'}</div>
                <div><strong>Role:</strong> Driver</div>
              </div>
            </div>

            {/* Security Info */}
            <div className={styles.securityInfo}>
              <div className={styles.securityBadge}>
                <CheckCircleFill className="me-2" />
                <span>Secured by Auth0</span>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default DriverUsernameSetup;
