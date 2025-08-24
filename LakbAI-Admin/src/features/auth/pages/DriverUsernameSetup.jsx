import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { CheckCircleFill, ArrowLeft } from 'react-bootstrap-icons';
import lakbaiAuthService from '../../../services/lakbaiAuthService';
import { userSyncService } from '../../../services/userSyncService';
import styles from '../styles/DriverUsernameSetup.module.css';

const DriverUsernameSetup = () => {
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

  // Check authentication and redirect logic
  useEffect(() => {
    const session = lakbaiAuthService.getCurrentDriverSession();
    
    if (!session) {
      console.log('❌ No driver session found, redirecting to driver signup');
      navigate('/driver-signup');
      return;
    }

    if (session.isProfileComplete) {
      console.log('✅ Driver profile already complete, redirecting to home');
      navigate('/');
      return;
    }

    console.log('✅ Driver session found, proceeding with profile completion');
  }, [navigate]);

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

    if (!birthMonth) {
      setError('Birth month is required');
      return false;
    }

    if (!birthDate) {
      setError('Birth date is required');
      return false;
    }

    if (!birthYear) {
      setError('Birth year is required');
      return false;
    }

    if (!gender) {
      setError('Gender is required');
      return false;
    }

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
      console.log('📝 Completing driver profile...');
      
      // Complete profile using LakbAI service
      const result = await lakbaiAuthService.completeDriverProfile(formData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to complete profile');
      }

      console.log('✅ Driver profile completed successfully:', result.data);
      
      // Prepare complete profile data for database sync
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

      // Sync to database (optional - can be skipped if backend is not ready)
      try {
        const syncResult = await userSyncService.syncAfterDriverSignup(
          { email: result.data.profileData.username }, // Mock user object
          null, // No access token needed for local auth
          completeProfileData
        );

        if (syncResult.success) {
          console.log('✅ Driver profile synced to database:', syncResult);
        } else {
          console.warn('⚠️ Database sync failed (non-critical):', syncResult.message);
        }
      } catch (syncError) {
        console.warn('⚠️ Database sync error (non-critical):', syncError);
        // Continue with the flow even if sync fails
      }

      // Show success and redirect
      setIsSuccess(true);
      
      // Redirect to home page after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
    } catch (err) {
      console.error('❌ Error completing driver setup:', err);
      setError(err.message || 'Failed to complete setup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  Redirecting to home page...
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
              Please complete your profile information to finish your driver registration.
            </p>

            {/* Setup Form */}
            <Form onSubmit={handleSubmit} className={styles.form}>
              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              )}

              {/* Username */}
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Username *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.username}
                      onChange={(e) => updateFormData('username', e.target.value)}
                      placeholder="Choose a username"
                      className={styles.input}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone Number *</Form.Label>
                    <Form.Control
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => updateFormData('phoneNumber', e.target.value)}
                      placeholder="Enter phone number"
                      className={styles.input}
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Name */}
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>First Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => updateFormData('firstName', e.target.value)}
                      placeholder="Enter first name"
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
                      placeholder="Enter last name"
                      className={styles.input}
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Address */}
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>House Number *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.houseNumber}
                      onChange={(e) => updateFormData('houseNumber', e.target.value)}
                      placeholder="Enter house number"
                      className={styles.input}
                    />
                  </Form.Group>
                </Col>
                <Col md={8}>
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
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
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
                </Col>
              </Row>

              {/* Submit Button */}
              <div className={styles.submitContainer}>
                <Button
                  type="submit"
                  variant="success"
                  size="lg"
                  disabled={isSubmitting}
                  className={styles.submitButton}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Completing Setup...
                    </>
                  ) : (
                    'Complete Profile'
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default DriverUsernameSetup;
