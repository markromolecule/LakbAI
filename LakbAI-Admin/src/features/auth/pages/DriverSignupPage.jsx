import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Alert, Form, Row, Col } from 'react-bootstrap';
import { CheckCircleFill, ArrowRight, Shield, ArrowLeft, CarFront, Eye, EyeSlash } from 'react-bootstrap-icons';
import lakbaiAuthService from '../../../services/lakbaiAuthService';
import styles from '../styles/DriverSignupPage.module.css';

const DriverSignupPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Clear any existing session when component mounts
  useEffect(() => {
    console.log('=== DRIVER SIGNUP PAGE MOUNT ===');
    
    // Clear any existing driver sessions for fresh signup
    lakbaiAuthService.clearDriverSession();
    
    console.log('Cleared existing driver session for fresh signup');
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    const { username, password, confirmPassword } = formData;

    if (!username.trim()) {
      setError('Username is required');
      return false;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }

    if (!password) {
      setError('Password is required');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      console.log('=== LAKBAI DRIVER SIGNUP START ===');
      console.log('Creating driver account:', formData.username);
      
      // Create driver session
      const result = await lakbaiAuthService.storeDriverSession(formData.username, false);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create driver account');
      }

      console.log('✅ Driver account created successfully:', result.data);
      setIsSuccess(true);
      
      // Redirect to profile completion after 2 seconds
      setTimeout(() => {
        navigate('/driver-username-setup');
      }, 2000);
      
    } catch (err) {
      console.error('❌ Error creating driver account:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  if (isSuccess) {
    return (
      <Container className={styles.container}>
        <div className={styles.content}>
          <Card className={styles.signupCard}>
            <Card.Body className={styles.cardBody}>
              <div className={styles.successContainer}>
                <CheckCircleFill className={styles.successIcon} />
                <h2 className={styles.successTitle}>Account Created!</h2>
                <p className={styles.successMessage}>
                  Your driver account has been successfully created.
                </p>
                <p className={styles.redirectMessage}>
                  Redirecting to profile completion...
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
        <Card className={styles.signupCard}>
          <Card.Body className={styles.cardBody}>
            {/* Back Button */}
            <Link to="/" className={styles.backButton}>
              <ArrowLeft className="me-2" />
              Back to Home
            </Link>

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
                  <p className={styles.brandTagline}>Become a Driver</p>
                </div>
              </div>
            </div>

            <h2 className={styles.title}>Join our network of professional drivers and start earning.</h2>

            {error && (
              <Alert variant="danger" className={styles.alert}>
                {error}
              </Alert>
            )}

            {/* Signup Form */}
            <Form onSubmit={handleSubmit} className={styles.form}>
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Username *</Form.Label>
                    <Form.Control
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Choose a username"
                      required
                      className={styles.input}
                    />
                    <Form.Text className="text-muted">
                      Username must be at least 3 characters long
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Password *</Form.Label>
                    <div className={styles.passwordContainer}>
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter password"
                        required
                        className={styles.input}
                      />
                      <Button
                        type="button"
                        variant="link"
                        className={styles.passwordToggle}
                        onClick={togglePasswordVisibility}
                      >
                        {showPassword ? <EyeSlash /> : <Eye />}
                      </Button>
                    </div>
                    <Form.Text className="text-muted">
                      Password must be at least 6 characters long
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label>Confirm Password *</Form.Label>
                    <div className={styles.passwordContainer}>
                      <Form.Control
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm password"
                        required
                        className={styles.input}
                      />
                      <Button
                        type="button"
                        variant="link"
                        className={styles.passwordToggle}
                        onClick={toggleConfirmPasswordVisibility}
                      >
                        {showConfirmPassword ? <EyeSlash /> : <Eye />}
                      </Button>
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className={styles.signupButton}
                disabled={isProcessing}
                block
              >
                {isProcessing ? (
                  <>
                    <div className={styles.spinner}></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <CarFront className="me-2" />
                    Create Driver Account
                  </>
                )}
              </Button>
            </Form>

            {/* Benefits */}
            <div className={styles.benefits}>
              <h5>Why Join as a Driver?</h5>
              <div className={styles.benefitsList}>
                <div className={styles.benefitItem}>
                  <CheckCircleFill className={styles.benefitIcon} />
                  <span>Flexible working hours</span>
                </div>
                <div className={styles.benefitItem}>
                  <CheckCircleFill className={styles.benefitIcon} />
                  <span>Competitive earnings</span>
                </div>
                <div className={styles.benefitItem}>
                  <CheckCircleFill className={styles.benefitIcon} />
                  <span>Professional support</span>
                </div>
                <div className={styles.benefitItem}>
                  <CheckCircleFill className={styles.benefitIcon} />
                  <span>Secure payment system</span>
                </div>
              </div>
            </div>

            {/* Action Links */}
            <div className={styles.actionLinks}>
              <span>Already have an account? </span>
              <Link to="/driver-login" className={styles.loginLink}>
                Sign In
              </Link>
              <span className={styles.divider}>•</span>
              <Link to="/admin-login" className={styles.adminLink}>
                Admin Login
              </Link>
            </div>

            {/* Security Info */}
            <div className={styles.securityInfo}>
              <div className={styles.securityBadge}>
                <Shield className="me-2" />
                <span>Secure driver registration</span>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default DriverSignupPage;
