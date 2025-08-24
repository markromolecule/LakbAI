import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Alert } from 'react-bootstrap';
import { useAuth0 } from '@auth0/auth0-react';
import { Shield, ArrowLeft, CarFront } from 'react-bootstrap-icons';
import styles from '../styles/DriverLoginPage.module.css';

const DriverLoginPage = () => {
  const navigate = useNavigate();
  const { loginWithRedirect, isAuthenticated, user, isLoading } = useAuth0();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Check if driver is already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Check if user has driver profile
      const driverProfile = localStorage.getItem(`driver_profile_${user.email}`);
      if (driverProfile) {
        console.log('✅ Driver already authenticated with complete profile, redirecting to home');
        navigate('/');
      } else {
        console.log('⚠️ Driver authenticated but profile incomplete, redirecting to profile completion');
        navigate('/driver-username-setup');
      }
    }
  }, [isAuthenticated, user, isLoading, navigate]);

  const handleAuth0Login = async () => {
    try {
      setIsProcessing(true);
      setError('');
      
      console.log('=== AUTH0 DRIVER LOGIN START ===');
      
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
      console.error('Auth0 login error:', err);
      setError(err.message || 'Auth0 login failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsProcessing(true);
      setError('');
      
      console.log('=== GOOGLE DRIVER LOGIN START ===');
      
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
      
      console.log('=== FACEBOOK DRIVER LOGIN START ===');
      
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
        <div className={styles.content}>
          <Card className={styles.loginCard}>
            <Card.Body className={styles.cardBody}>
              <div className={styles.loadingSpinner}>
                <div className={styles.spinner}></div>
                <p>Loading...</p>
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
                onClick={handleAuth0Login}
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
                    Sign In with Auth0
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
                  <CarFront className={styles.benefitIcon} />
                  <span>Access your earnings</span>
                </div>
                <div className={styles.benefitItem}>
                  <CarFront className={styles.benefitIcon} />
                  <span>View ride history</span>
                </div>
                <div className={styles.benefitItem}>
                  <CarFront className={styles.benefitIcon} />
                  <span>Update your profile</span>
                </div>
                <div className={styles.benefitItem}>
                  <CarFront className={styles.benefitIcon} />
                  <span>Manage your schedule</span>
                </div>
              </div>
            </div>

            {/* Action Links */}
            <div className={styles.actionLinks}>
              <span>Don't have a driver account? </span>
              <Link to="/driver-signup" className={styles.signupLink}>
                Register as Driver
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
                <span>Secured by Auth0</span>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default DriverLoginPage;
