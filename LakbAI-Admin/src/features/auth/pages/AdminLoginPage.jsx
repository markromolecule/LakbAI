import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { Eye, EyeSlash, Shield, ArrowLeft } from 'react-bootstrap-icons';
import { useAuth0 } from '@auth0/auth0-react';
import styles from '../styles/AdminLoginPage.module.css';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { loginWithRedirect } = useAuth0();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [authMethod, setAuthMethod] = useState('choice'); // 'choice' | 'auth0' | 'traditional'

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
      // Simulate admin authentication
      // In production, this would call your backend API
      console.log('Admin login attempt:', formData.email);
      
      // For demo purposes, check against hardcoded admin credentials
      const adminEmails = [
        'livadomc@gmail.com',
        'admin@lakbai.com',
        'support@lakbai.com'
      ];
      
      if (adminEmails.includes(formData.email) && formData.password === 'admin123') {
        // Store admin session
        localStorage.setItem('adminEmail', formData.email);
        localStorage.setItem('adminName', formData.email.split('@')[0]);
        localStorage.setItem('adminAuthenticated', 'true');
        localStorage.setItem('adminLoginTime', new Date().toISOString());
        
        // Redirect to admin dashboard
        navigate('/admin/dashboard');
      } else {
        setError('Invalid admin credentials. Please check your email and password.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Admin login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleAuth0Login = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      await loginWithRedirect({
        authorizationParams: {
          screen_hint: 'login',
          role: 'admin',
          app: 'admin'
        },
        appState: {
          returnTo: '/admin/dashboard'
        }
      });
    } catch (err) {
      console.error('Auth0 login error:', err);
      setError(err.message || 'Auth0 login failed. Please try again.');
      setIsLoading(false);
    }
  };

  // Show choice screen
  if (authMethod === 'choice') {
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
                    <h3 className={styles.brandName}>LakbAI Admin</h3>
                    <p className={styles.brandTagline}>Choose Your Login Method</p>
                  </div>
                </div>
              </div>

              <h2 className={styles.title}>Admin Login</h2>
              <p className={styles.subtitle}>
                Select how you'd like to access the admin dashboard
              </p>

              {/* Login Method Options */}
              <div className={styles.methodContainer}>
                {/* Auth0 Option */}
                <div 
                  className={styles.methodOption}
                  onClick={() => setAuthMethod('auth0')}
                >
                  <div className={styles.methodIcon}>
                    <i className="bi bi-shield-lock-fill"></i>
                  </div>
                  <div className={styles.methodContent}>
                    <h4 className={styles.methodTitle}>Quick & Secure</h4>
                    <p className={styles.methodDescription}>
                      Sign in with Google, Facebook, or Auth0
                    </p>
                    <div className={styles.methodFeatures}>
                      <span className={styles.featureTag}>• One-click login</span>
                      <span className={styles.featureTag}>• Enhanced security</span>
                      <span className={styles.featureTag}>• Social accounts</span>
                    </div>
                  </div>
                  <div className={styles.methodArrow}>
                    <i className="bi bi-chevron-right"></i>
                  </div>
                </div>

                {/* Traditional Option */}
                <div 
                  className={styles.methodOption}
                  onClick={() => setAuthMethod('traditional')}
                >
                  <div className={styles.methodIcon}>
                    <i className="bi bi-envelope-fill"></i>
                  </div>
                  <div className={styles.methodContent}>
                    <h4 className={styles.methodTitle}>Traditional Login</h4>
                    <p className={styles.methodDescription}>
                      Use your email and password
                    </p>
                    <div className={styles.methodFeatures}>
                      <span className={styles.featureTag}>• Email & password</span>
                      <span className={styles.featureTag}>• Full control</span>
                      <span className={styles.featureTag}>• Local account</span>
                    </div>
                  </div>
                  <div className={styles.methodArrow}>
                    <i className="bi bi-chevron-right"></i>
                  </div>
                </div>
              </div>

              {/* Security Info */}
              <div className={styles.securityInfo}>
                <div className={styles.securityBadge}>
                  <Shield className="me-2" />
                  <span>All methods are secured with enterprise-grade encryption</span>
                </div>
              </div>

              {/* Footer */}
              <div className={styles.footer}>
                <p className={styles.footerText}>
                  Need driver registration?{' '}
                  <Link to="/driver-signup" className={styles.footerLink}>
                    Register as Driver
                  </Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </div>
      </Container>
    );
  }

  // Auth0 Flow
  if (authMethod === 'auth0') {
    return (
      <Container className={styles.container}>
        <div className={styles.content}>
          <Card className={styles.loginCard}>
            <Card.Body className={styles.cardBody}>
              {/* Back Button */}
              <button 
                className={styles.backButton}
                onClick={() => setAuthMethod('choice')}
              >
                <ArrowLeft className="me-2" />
                Back to Options
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
                    <h3 className={styles.brandName}>LakbAI Admin</h3>
                    <p className={styles.brandTagline}>Auth0 Login</p>
                  </div>
                </div>
              </div>

              <h2 className={styles.title}>Secure Admin Login</h2>
              <p className={styles.subtitle}>
                Sign in with your Auth0 account
              </p>

              {error && (
                <Alert variant="danger" className={styles.alert}>
                  {error}
                </Alert>
              )}

              <Button
                variant="primary"
                size="lg"
                className={styles.loginButton}
                onClick={handleAuth0Login}
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
                    <Shield className="me-2" />
                    Sign In with Auth0
                  </>
                )}
              </Button>

              {/* Security Info */}
              <div className={styles.securityInfo}>
                <div className={styles.securityBadge}>
                  <Shield className="me-2" />
                  <span>Secured by Auth0</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </Container>
    );
  }

  // Traditional Login Flow
  return (
    <Container className={styles.container}>
      <div className={styles.content}>
        <Card className={styles.loginCard}>
          <Card.Body className={styles.cardBody}>
            {/* Back Button */}
            <button 
              className={styles.backButton}
              onClick={() => setAuthMethod('choice')}
            >
              <ArrowLeft className="me-2" />
              Back to Options
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
                  <h3 className={styles.brandName}>LakbAI Admin</h3>
                  <p className={styles.brandTagline}>Traditional Login</p>
                </div>
              </div>
            </div>

            <h2 className={styles.title}>Admin Login</h2>
            <p className={styles.subtitle}>
              Access the LakbAI administration dashboard
            </p>

            {/* Login Form */}
            <Form onSubmit={handleSubmit} className={styles.form}>
              {error && (
                <Alert variant="danger" className={styles.alert}>
                  {error}
                </Alert>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Admin Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your admin email"
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
                    <Shield className="me-2" />
                    Sign In as Admin
                  </>
                )}
              </Button>
            </Form>

            {/* Demo Credentials */}
            <div className={styles.demoInfo}>
              <h6>Demo Admin Credentials:</h6>
              <div className={styles.demoCredentials}>
                <div><strong>Email:</strong> livadomc@gmail.com</div>
                <div><strong>Password:</strong> admin123</div>
              </div>
            </div>

            {/* Security Info */}
            <div className={styles.securityInfo}>
              <div className={styles.securityBadge}>
                <Shield className="me-2" />
                <span>Secure administrator access</span>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default AdminLoginPage;
