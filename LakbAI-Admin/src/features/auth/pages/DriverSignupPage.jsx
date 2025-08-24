import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Button, Alert } from 'react-bootstrap';
import { useAuth0 } from '@auth0/auth0-react';
import { CheckCircleFill, ArrowRight, Shield, ArrowLeft, CarFront } from 'react-bootstrap-icons';
import { driverStorage, clearAllLakbAIStorage } from '../../../utils/authUtils';
import styles from '../styles/DriverSignupPage.module.css';

const DriverSignupPage = () => {
  const { loginWithRedirect, isAuthenticated, user } = useAuth0();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Clear any existing session when component mounts
  useEffect(() => {
    console.log('=== DRIVER SIGNUP PAGE MOUNT ===');
    
    // Clear all existing LakbAI storage for fresh signup
    clearAllLakbAIStorage();
    
    // Clear any Auth0-related state that might cause conflicts
    localStorage.removeItem('auth0.is.authenticated');
    localStorage.removeItem('auth0.is.authenticated.timestamp');
    localStorage.removeItem('auth0.state');
    localStorage.removeItem('auth0.nonce');
    
    // Clear sessionStorage as well
    sessionStorage.clear();
    
    // Clear any cookies that might interfere
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    console.log('Cleared existing context for fresh driver signup');
  }, []);

  // Handle Auth0 signup with proper state management
  const handleAuth0Signup = async () => {
    try {
      setIsProcessing(true);
      setError('');
      
      console.log('=== AUTH0 DRIVER SIGNUP START ===');
      
      // Store driver signup context
      const contextData = {
        timestamp: Date.now(),
        type: 'driver_signup',
        returnTo: '/driver-username-setup'
      };
      
      driverStorage.set('signup_context', contextData);
      
      console.log('✅ Driver signup context set:', contextData);
      console.log('Initiating Auth0 redirect with clean state...');

      // Use loginWithRedirect with minimal, clean configuration
      await loginWithRedirect({
        authorizationParams: {
          screen_hint: 'signup'
        },
        appState: {
          returnTo: '/driver-username-setup',
          signupComplete: true,
          role: 'driver'
        }
      });
      
    } catch (err) {
      console.error('Error starting Auth0 signup:', err);
      setError('Failed to start signup process. Please try again.');
      setIsProcessing(false);
    }
  };

  // Handle Google signup with proper state management
  const handleGoogleSignup = async () => {
    try {
      setIsProcessing(true);
      setError('');
      
      console.log('=== GOOGLE DRIVER SIGNUP START ===');
      
      // Store driver signup context
      const contextData = {
        timestamp: Date.now(),
        type: 'driver_signup',
        returnTo: '/driver-username-setup'
      };
      
      driverStorage.set('signup_context', contextData);
      
      console.log('✅ Driver signup context set for Google:', contextData);
      console.log('Initiating Google signup...');

      await loginWithRedirect({
        authorizationParams: {
          connection: 'google-oauth2',
          screen_hint: 'signup'
        },
        appState: {
          returnTo: '/driver-username-setup',
          signupComplete: true,
          role: 'driver'
        }
      });
      
    } catch (err) {
      console.error('Error starting Google signup:', err);
      setError('Failed to start Google signup. Please try again.');
      setIsProcessing(false);
    }
  };

  // Handle Facebook signup with proper state management
  const handleFacebookSignup = async () => {
    try {
      setIsProcessing(true);
      setError('');
      
      console.log('=== FACEBOOK DRIVER SIGNUP START ===');
      
      // Store driver signup context
      const contextData = {
        timestamp: Date.now(),
        type: 'driver_signup',
        returnTo: '/driver-username-setup'
      };
      
      driverStorage.set('signup_context', contextData);
      
      console.log('✅ Driver signup context set for Facebook:', contextData);
      console.log('Initiating Facebook signup...');

      await loginWithRedirect({
        authorizationParams: {
          connection: 'facebook',
          screen_hint: 'signup'
        },
        appState: {
          returnTo: '/driver-username-setup',
          signupComplete: true,
          role: 'driver'
        }
      });
      
    } catch (err) {
      console.error('Error starting Facebook signup:', err);
      setError('Failed to start Facebook signup. Please try again.');
      setIsProcessing(false);
    }
  };

  // Redirect if already authenticated
  if (isAuthenticated && user) {
    return (
      <Container className={styles.container}>
        <div className={styles.content}>
          <Card className={styles.signupCard}>
            <Card.Body className={styles.cardBody}>
              <div className={styles.successContainer}>
                <CheckCircleFill className={styles.successIcon} />
                <h2 className={styles.successTitle}>Already Signed In!</h2>
                <p className={styles.successMessage}>
                  You are already authenticated as {user.name || user.email}.
                </p>
                <div className={styles.actionButtons}>
                  <Link to="/" className={styles.homeButton}>
                    <ArrowRight className="me-2" />
                    Go to Home
                  </Link>
                </div>
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
                <span>Secured by Auth0</span>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default DriverSignupPage;
