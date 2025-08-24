import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { Eye, EyeSlash, Shield, ArrowLeft } from 'react-bootstrap-icons';
import styles from '../styles/AdminLoginPage.module.css';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
      console.log('Admin login attempt:', formData.email);
      
      // Check against specified admin credentials
      if (formData.email === 'livadomc@gmail.com' && formData.password === 'admin') {
        // Store admin session
        localStorage.setItem('adminEmail', formData.email);
        localStorage.setItem('adminName', formData.email.split('@')[0]);
        localStorage.setItem('adminAuthenticated', 'true');
        localStorage.setItem('adminLoginTime', new Date().toISOString());
        
        console.log('✅ Admin authentication successful');
        
        // Redirect to admin dashboard
        navigate('/admin/dashboard');
      } else {
        setError('Invalid admin credentials. Please use: livadomc@gmail.com / admin');
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
                  <p className={styles.brandTagline}>Administrator Access</p>
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

            {/* Admin Credentials */}
            <div className={styles.demoInfo}>
              <h6>Admin Credentials:</h6>
              <div className={styles.demoCredentials}>
                <div><strong>Email:</strong> livadomc@gmail.com</div>
                <div><strong>Password:</strong> admin</div>
              </div>
            </div>

            {/* Security Info */}
            <div className={styles.securityInfo}>
              <div className={styles.securityBadge}>
                <Shield className="me-2" />
                <span>Secure administrator access</span>
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
};

export default AdminLoginPage;
