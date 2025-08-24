import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Alert, Button } from 'react-bootstrap';
import { ExclamationTriangle, ArrowRight } from 'react-bootstrap-icons';
import styles from '../styles/Auth0Callback.module.css';

const Auth0Callback = () => {
  const { handleRedirectCallback, isAuthenticated, user, isLoading, error } = useAuth0();
  const navigate = useNavigate();
  const [callbackStatus, setCallbackStatus] = useState('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        console.log('🔄 Processing Auth0 callback...');
        await handleRedirectCallback();
      } catch (err) {
        console.error('❌ Auth0 callback error:', err);
        
        if (err.message.includes('Invalid state')) {
          setErrorMessage('Authentication state expired. Please try signing up again.');
        } else {
          setErrorMessage(err.message || 'Authentication failed. Please try again.');
        }
        
        setCallbackStatus('error');
      }
    };

    if (!isLoading) {
      processCallback();
    }
  }, [handleRedirectCallback, isLoading]);

  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('✅ User authenticated:', user);
      
      // Check if this is a driver signup
      const driverSignupContext = localStorage.getItem('lakbai_driver_signup');
      
      if (driverSignupContext) {
        try {
          const context = JSON.parse(driverSignupContext);
          console.log('Driver signup context found:', context);
          
          // Clear the context
          localStorage.removeItem('lakbai_driver_signup');
          
          // Redirect to LakbAI driver authentication
          console.log('🔄 Redirecting to LakbAI driver authentication...');
          navigate('/driver-signup', { replace: true });
          return;
        } catch (parseError) {
          console.error('Error parsing driver context:', parseError);
        }
      }
      
      // Default redirect for other users
      console.log('🔄 Redirecting to home...');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (error) {
      console.error('Auth0 error:', error);
      setErrorMessage(error.message || 'Authentication failed');
      setCallbackStatus('error');
    }
  }, [error]);

  const handleRetry = () => {
    console.log('🔄 Retrying authentication...');
    localStorage.removeItem('lakbai_driver_signup');
    navigate('/driver-signup', { replace: true });
  };

  if (isLoading) {
    return (
      <Container className={styles.container}>
        <div className={styles.content}>
          <Card className={styles.callbackCard}>
            <Card.Body className={styles.cardBody}>
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <h3>Processing Authentication...</h3>
                <p>Please wait while we complete your sign-in process.</p>
              </div>
            </Card.Body>
          </Card>
        </div>
      </Container>
    );
  }

  if (callbackStatus === 'error' || error) {
    return (
      <Container className={styles.container}>
        <div className={styles.content}>
          <Card className={styles.callbackCard}>
            <Card.Body className={styles.cardBody}>
              <div className={styles.errorContainer}>
                <ExclamationTriangle className={styles.errorIcon} />
                <h3>Authentication Error</h3>
                <p className={styles.errorMessage}>{errorMessage}</p>
                <Button 
                  variant="primary" 
                  onClick={handleRetry}
                  className={styles.retryButton}
                >
                  <ArrowRight className="me-2" />
                  Try Again
                </Button>
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
        <Card className={styles.callbackCard}>
          <Card.Body className={styles.cardBody}>
            <div className={styles.processingContainer}>
              <div className={styles.spinner}></div>
              <h3>Completing Authentication...</h3>
              <p>Please wait while we redirect you to the appropriate page.</p>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default Auth0Callback;
