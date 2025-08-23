import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Button, Alert } from 'react-bootstrap';
import { useAuth0 } from '@auth0/auth0-react';
import { CheckCircleFill, ArrowRight, Shield, ArrowLeft } from 'react-bootstrap-icons';
import { clearAllSignupContext, validateAndClearAuth0State, setAuth0StateTimestamp, clearAuth0Data } from '../../../utils/authUtils';
import styles from '../styles/DriverSignupPage.module.css';

const DriverSignupPage = () => {
  const { loginWithRedirect, isAuthenticated, user } = useAuth0();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Clear any existing session when component mounts
  useEffect(() => {
    // Validate and clear stale Auth0 state
    validateAndClearAuth0State();
    
    // Clear all signup context and authentication data
    clearAllSignupContext();
    
    // Force clear any existing Auth0 authentication to ensure fresh signup
    clearAuth0Data();
    console.log('Cleared existing session and Auth0 data for fresh driver signup');
    
    // Clear session when user leaves the page
    const handleBeforeUnload = () => {
      clearAllSignupContext();
      clearAuth0Data();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Handle Auth0 signup
  const handleAuth0Signup = async () => {
    try {
      setIsProcessing(true);
      setError('');
      
      // Clear any existing context first
      clearAllSignupContext();
      
      // Set Auth0 state timestamp for validation
      setAuth0StateTimestamp();
      
      // Store fresh signup context in localStorage
      localStorage.setItem('driver_signup_context', JSON.stringify({
        timestamp: Date.now(),
        type: 'driver_signup',
        returnTo: '/driver-username-setup'
      }));
      
      await loginWithRedirect({
        authorizationParams: {
          screen_hint: 'signup',
          role: 'driver',
          app: 'admin',
          prompt: 'login' // Force login prompt even if user is already authenticated
        },
        appState: {
          returnTo: '/driver-username-setup',
          signupComplete: true,
          role: 'driver',
          forceSignup: true
        }
      });
    } catch (err) {
      console.error('Auth0 signup error:', err);
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Google signup
  const handleGoogleSignup = async () => {
    try {
      setIsProcessing(true);
      setError('');
      
      // Clear any existing context first
      clearAllSignupContext();
      
      // Set Auth0 state timestamp for validation
      setAuth0StateTimestamp();
      
      // Store fresh signup context in localStorage
      localStorage.setItem('driver_signup_context', JSON.stringify({
        timestamp: Date.now(),
        type: 'driver_signup',
        returnTo: '/driver-username-setup'
      }));
      
      await loginWithRedirect({
        authorizationParams: {
          connection: 'google-oauth2',
          screen_hint: 'signup',
          role: 'driver',
          app: 'admin',
          prompt: 'login' // Force login prompt even if user is already authenticated
        },
        appState: {
          returnTo: '/driver-username-setup',
          signupComplete: true,
          role: 'driver',
          forceSignup: true
        }
      });
    } catch (err) {
      console.error('Google signup error:', err);
      setError(err.message || 'Google signup failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Facebook signup
  const handleFacebookSignup = async () => {
    try {
      setIsProcessing(true);
      setError('');
      
      // Clear any existing context first
      clearAllSignupContext();
      
      // Set Auth0 state timestamp for validation
      setAuth0StateTimestamp();
      
      // Store fresh signup context in localStorage
      localStorage.setItem('driver_signup_context', JSON.stringify({
        timestamp: Date.now(),
        type: 'driver_signup',
        returnTo: '/driver-username-setup'
      }));
      
      await loginWithRedirect({
        authorizationParams: {
          connection: 'facebook',
          screen_hint: 'signup',
          role: 'driver',
          app: 'admin',
          prompt: 'login' // Force login prompt even if user is already authenticated
        },
        appState: {
          returnTo: '/driver-username-setup',
          signupComplete: true,
          role: 'driver',
          forceSignup: true
        }
      });
    } catch (err) {
      console.error('Facebook signup error:', err);
      setError(err.message || 'Facebook signup failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

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
              <p className={styles.description}>
                Join our network of professional drivers and start earning
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="danger" className={styles.alert}>
                {error}
              </Alert>
            )}

            {/* Signup Options */}
            <div className={styles.signupOptions}>
              {/* Auth0 Signup */}
              <Button
                variant="primary"
                size="lg"
                className={styles.signupButton}
                onClick={handleAuth0Signup}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className={styles.spinner}></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <Shield className="me-2" />
                    Create Driver Account
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className={styles.divider}>
                <span>or continue with</span>
              </div>

              {/* Social Signup Options */}
              <div className={styles.socialButtons}>
                <Button
                  variant="outline-danger"
                  className={styles.socialButton}
                  onClick={handleGoogleSignup}
                  disabled={isProcessing}
                >
                  <div className={styles.googleIcon}></div>
                  Google
                </Button>

                <Button
                  variant="outline-primary"
                  className={styles.socialButton}
                  onClick={handleFacebookSignup}
                  disabled={isProcessing}
                >
                  <div className={styles.facebookIcon}></div>
                  Facebook
                </Button>
              </div>
            </div>

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
                Already have an account?{' '}
                <Link to="/admin-login" className={styles.footerLink}>
                  Admin Login
                </Link>
              </p>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default DriverSignupPage;
