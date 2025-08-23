import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleFill, ArrowLeft, Shield } from 'react-bootstrap-icons';
import styles from '../styles/DriverLoginPage.module.css';

const DriverLoginPage = () => {
  const { loginWithRedirect, isAuthenticated, user, isLoading } = useAuth0();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated and has driver profile
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Check if user has driver profile
      const driverProfile = localStorage.getItem(`driver_profile_${user.email}`);
      if (driverProfile) {
        console.log('Driver already authenticated, redirecting to home');
        navigate('/', { replace: true });
        return;
      }
    }
  }, [isAuthenticated, user, isLoading, navigate]);

  const handleDriverLogin = async () => {
    try {
      setIsProcessing(true);
      setError('');
      
      await loginWithRedirect({
        authorizationParams: {
          screen_hint: 'login',
          role: 'driver',
          app: 'driver'
        },
        appState: {
          returnTo: '/driver-login',
          loginComplete: true,
          role: 'driver'
        }
      });
    } catch (err) {
      console.error('Driver login error:', err);
      setError(err.message || 'Login failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsProcessing(true);
      setError('');
      
      await loginWithRedirect({
        authorizationParams: {
          connection: 'google-oauth2',
          screen_hint: 'login',
          role: 'driver',
          app: 'driver'
        },
        appState: {
          returnTo: '/driver-login',
          loginComplete: true,
          role: 'driver'
        }
      });
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.message || 'Google login failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setIsProcessing(true);
      setError('');
      
      await loginWithRedirect({
        authorizationParams: {
          connection: 'facebook',
          screen_hint: 'login',
          role: 'driver',
          app: 'driver'
        },
        appState: {
          returnTo: '/driver-login',
          loginComplete: true,
          role: 'driver'
        }
      });
    } catch (err) {
      console.error('Facebook login error:', err);
      setError(err.message || 'Facebook login failed. Please try again.');
      setIsProcessing(false);
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

  return (
    <Container className={styles.container}>
      <div className={styles.content}>
        <Card className={styles.loginCard}>
          <Card.Body className={styles.cardBody}>
            {/* Back Button */}
            <button 
              className={styles.backButton}
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="me-2" />
              Back to Home
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
                  <p className={styles.brandTagline}>Driver Login</p>
                </div>
              </div>
            </div>

            <h2 className={styles.title}>Driver Login</h2>
            <p className={styles.subtitle}>
              Access your driver account and start earning
            </p>

            {error && (
              <Alert variant="danger" className={styles.alert}>
                {error}
              </Alert>
            )}

            {/* Login Options */}
            <div className={styles.loginOptions}>
              {/* Auth0 Login */}
              <Button
                variant="success"
                size="lg"
                className={styles.loginButton}
                onClick={handleDriverLogin}
                disabled={isProcessing}
                block
              >
                {isProcessing ? (
                  <>
                    <div className={styles.spinner}></div>
                    Signing In...
                  </>
                ) : (
                  <>
                    <Shield className="me-2" />
                    Sign In as Driver
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className={styles.divider}>
                <span>or continue with</span>
              </div>

              {/* Social Login Options */}
              <div className={styles.socialButtons}>
                <Button
                  variant="outline-danger"
                  className={styles.socialButton}
                  onClick={handleGoogleLogin}
                  disabled={isProcessing}
                >
                  <div className={styles.googleIcon}></div>
                  Google
                </Button>

                <Button
                  variant="outline-primary"
                  className={styles.socialButton}
                  onClick={handleFacebookLogin}
                  disabled={isProcessing}
                >
                  <div className={styles.facebookIcon}></div>
                  Facebook
                </Button>
              </div>
            </div>

            {/* Driver Benefits */}
            <div className={styles.benefits}>
              <h5>Why Login as a Driver?</h5>
              <div className={styles.benefitsList}>
                <div className={styles.benefitItem}>
                  <CheckCircleFill className={styles.benefitIcon} />
                  <span>Access your earnings</span>
                </div>
                <div className={styles.benefitItem}>
                  <CheckCircleFill className={styles.benefitIcon} />
                  <span>View ride history</span>
                </div>
                <div className={styles.benefitItem}>
                  <CheckCircleFill className={styles.benefitIcon} />
                  <span>Update your profile</span>
                </div>
                <div className={styles.benefitItem}>
                  <CheckCircleFill className={styles.benefitIcon} />
                  <span>Manage your schedule</span>
                </div>
              </div>
            </div>

            {/* Security Info */}
            <div className={styles.securityInfo}>
              <div className={styles.securityBadge}>
                <Shield className="me-2" />
                <span>Secured by Auth0</span>
              </div>
            </div>

            {/* Footer */}
            <div className={styles.footer}>
              <p className={styles.footerText}>
                Don't have a driver account?{' '}
                <button 
                  className={styles.footerLink}
                  onClick={() => navigate('/driver-signup')}
                >
                  Register as Driver
                </button>
              </p>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default DriverLoginPage;
