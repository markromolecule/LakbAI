import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Alert, Button } from 'react-bootstrap';
import { ExclamationTriangle, ArrowRight, Refresh } from 'react-bootstrap-icons';
import { driverStorage } from '../../../utils/authUtils';
import styles from '../styles/Auth0Callback.module.css';

const Auth0Callback = () => {
  const { handleRedirectCallback, isAuthenticated, user, isLoading, error } = useAuth0();
  const navigate = useNavigate();
  const [callbackStatus, setCallbackStatus] = useState('processing');
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const processCallback = async () => {
      try {
        console.log('🔄 Processing Auth0 callback...');
        await handleRedirectCallback();
      } catch (err) {
        console.error('❌ Auth0 callback error:', err);
        
        if (err.message.includes('Invalid state')) {
          console.log('⚠️ Invalid state error detected, attempting recovery...');
          
          // Check if we have driver signup context
          const driverSignupContext = driverStorage.get('signup_context', {});
          
          if (driverSignupContext.type === 'driver_signup' && retryCount < 2) {
            // Try to recover by clearing state and retrying
            console.log(`🔄 Attempting recovery (attempt ${retryCount + 1}/2)...`);
            setRetryCount(prev => prev + 1);
            setIsRetrying(true);
            
            // Clear Auth0 state and retry
            setTimeout(() => {
              setIsRetrying(false);
              window.location.reload();
            }, 2000);
            return;
          } else {
            // Max retries reached or no context, show error
            setErrorMessage('Authentication state expired. Please try signing up again.');
            setCallbackStatus('error');
          }
        } else {
          setErrorMessage(err.message || 'Authentication failed. Please try again.');
          setCallbackStatus('error');
        }
      }
    };

    if (!isLoading && !isRetrying) {
      processCallback();
    }
  }, [handleRedirectCallback, isLoading, retryCount, isRetrying]);

  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('✅ User authenticated:', user);
      
      // Check if this is a driver signup
      const driverSignupContext = driverStorage.get('signup_context', {});
      
      if (driverSignupContext.type === 'driver_signup') {
        console.log('🚗 Driver signup context found:', driverSignupContext);
        
        // Clear the context to prevent loops
        driverStorage.remove('signup_context');
        
        // Check if user is admin (should not be here)
        const adminEmails = [
          'livadomc@gmail.com',
          'admin@lakbai.com',
          'support@lakbai.com'
        ];
        
        if (adminEmails.includes(user.email)) {
          console.log('❌ Admin user detected in driver flow, redirecting to admin login');
          navigate('/admin-login', { replace: true });
          return;
        }
        
        // Redirect to driver profile completion
        console.log('🔄 Redirecting to driver profile completion...');
        navigate('/driver-username-setup', { replace: true });
        return;
      }
      
      // Default redirect for other users
      console.log('🔄 Redirecting to home...');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (error) {
      console.error('❌ Auth0 error:', error);
      setErrorMessage(error.message || 'Authentication failed');
      setCallbackStatus('error');
    }
  }, [error]);

  const handleRetry = () => {
    console.log('🔄 Retrying authentication...');
    driverStorage.clear();
    navigate('/driver-signup', { replace: true });
  };

  const handleRefresh = () => {
    console.log('🔄 Refreshing page...');
    window.location.reload();
  };

  if (isLoading || isRetrying) {
    return (
      <Container className={styles.container}>
        <div className={styles.content}>
          <Card className={styles.callbackCard}>
            <Card.Body className={styles.cardBody}>
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <h3>
                  {isRetrying 
                    ? `Recovering Authentication... (Attempt ${retryCount}/2)`
                    : 'Processing Authentication...'
                  }
                </h3>
                <p>
                  {isRetrying 
                    ? 'Attempting to recover from authentication state issue...'
                    : 'Please wait while we complete your sign-in process.'
                  }
                </p>
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
                <div className={styles.errorActions}>
                  <Button 
                    variant="primary" 
                    onClick={handleRetry}
                    className={styles.retryButton}
                  >
                    <ArrowRight className="me-2" />
                    Try Again
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={handleRefresh}
                    className={styles.refreshButton}
                  >
                    <Refresh className="me-2" />
                    Refresh Page
                  </Button>
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
