import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { Eye, EyeSlash, Shield, ArrowLeft, CarFront } from 'react-bootstrap-icons';
import lakbaiAuthService from '../../../services/lakbaiAuthService';
import styles from '../styles/DriverLoginPage.module.css';

const DriverLoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if driver is already authenticated
  useEffect(() => {
    const session = lakbaiAuthService.getCurrentDriverSession();
    if (session) {
      if (session.isProfileComplete) {
        console.log('✅ Driver already authenticated with complete profile, redirecting to home');
        navigate('/');
      } else {
        console.log('⚠️ Driver authenticated but profile incomplete, redirecting to profile completion');
        navigate('/driver-username-setup');
      }
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 Driver login attempt:', formData.username);
      
      // Authenticate driver using LakbAI service
      const result = await lakbaiAuthService.authenticateDriver(
        formData.username, 
        formData.password
      );

      if (result.success) {
        console.log('✅ Driver authentication successful:', result.data);
        
        // Check if profile is complete
        if (result.data.isProfileComplete) {
          console.log('✅ Profile complete, redirecting to home');
          navigate('/');
        } else {
          console.log('⚠️ Profile incomplete, redirecting to profile completion');
          navigate('/driver-username-setup');
        }
      } else {
        setError(result.error || 'Authentication failed. Please try again.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Driver login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container className={styles.container}>
      <div className={styles.content}>
        <Card className={styles.loginCard}>
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
                  <p className={styles.brandTagline}>Driver Login</p>
                </div>
              </div>
            </div>

            <h2 className={styles.title}>Welcome Back, Driver!</h2>
            <p className={styles.subtitle}>
              Sign in to access your driver dashboard and start earning
            </p>

            {/* Login Form */}
            <Form onSubmit={handleSubmit} className={styles.form}>
              {error && (
                <Alert variant="danger" className={styles.alert}>
                  {error}
                </Alert>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter your username"
                  required
                  className={styles.input}
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Password</Form.Label>
                <div className={styles.passwordContainer}>
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
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
              </Form.Group>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className={styles.loginButton}
                disabled={isLoading}
                block
              >
                {isLoading ? (
                  <>
                    <div className={styles.spinner}></div>
                    Signing In...
                  </>
                ) : (
                  <>
                    <CarFront className="me-2" />
                    Sign In as Driver
                  </>
                )}
              </Button>
            </Form>

            {/* Driver Info */}
            <div className={styles.driverInfo}>
              <h6>New to LakbAI?</h6>
              <p className={styles.driverDescription}>
                Join our network of professional drivers and start earning today!
              </p>
            </div>

            {/* Action Links */}
            <div className={styles.actionLinks}>
              <Link to="/driver-signup" className={styles.signupLink}>
                Create Driver Account
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
                <span>Secure driver authentication</span>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default DriverLoginPage;
