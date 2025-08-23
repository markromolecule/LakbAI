import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { userSyncService } from '../../../services/userSyncService';
import { clearDriverSignupContext } from '../../../utils/authUtils';
import styles from '../styles/Auth0Callback.module.css';

const Auth0Callback = () => {
  const navigate = useNavigate();
  const { 
    handleRedirectCallback, 
    isAuthenticated, 
    isLoading, 
    error, 
    user,
    getAccessTokenSilently
  } = useAuth0();
  
  const [callbackStatus, setCallbackStatus] = useState('processing');
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const processCallback = async () => {
      // Add timeout to prevent hanging (increased to 60 seconds)
      const timeoutId = setTimeout(() => {
        console.error('Auth0 callback timeout - checking context before redirecting');
        
        // Check if this was a driver signup attempt
        const driverSignupContext = JSON.parse(localStorage.getItem('driver_signup_context') || '{}');
        if (driverSignupContext.type === 'driver_signup') {
          console.log('Driver signup context found, redirecting to driver signup page');
          clearDriverSignupContext();
          navigate('/driver-signup', { replace: true });
        } else {
          console.log('No driver signup context, redirecting to admin login');
          clearDriverSignupContext();
          navigate('/admin-login', { replace: true });
        }
      }, 60000); // 60 second timeout
      
      try {
        setCallbackStatus('processing');
        
        // Check if there's a callback to handle
        const urlParams = new URLSearchParams(window.location.search);
        const hasCode = urlParams.get('code');
        const hasError = urlParams.get('error');
        const hasState = urlParams.get('state');
        
        console.log('URL Parameters:', {
          hasCode: !!hasCode,
          hasError: !!hasError,
          hasState: !!hasState,
          error: urlParams.get('error'),
          errorDescription: urlParams.get('error_description')
        });
        
        if (hasError) {
          const errorDescription = urlParams.get('error_description') || 'Authentication failed';
          console.error('Auth0 Error:', { error: urlParams.get('error'), description: errorDescription });
          
          // Handle specific error types
          if (urlParams.get('error') === 'invalid_state') {
            // Clear stale state and redirect to appropriate page
            console.log('Invalid state detected, checking context before redirecting');
            
            // Check if this was a driver signup attempt
            const driverSignupContext = JSON.parse(localStorage.getItem('driver_signup_context') || '{}');
            if (driverSignupContext.type === 'driver_signup') {
              console.log('Driver signup context found, redirecting to driver signup page');
              clearDriverSignupContext();
              navigate('/driver-signup', { replace: true });
            } else {
              console.log('No driver signup context, redirecting to admin login');
              clearDriverSignupContext();
              navigate('/admin-login', { replace: true });
            }
            return;
          }
          
          throw new Error(errorDescription);
        }
        
        if (hasCode) {
          // Handle the Auth0 callback
          console.log('Processing Auth0 callback...');
          try {
            await handleRedirectCallback();
            setCallbackStatus('success');
          } catch (callbackError) {
            console.error('Auth0 callback error:', callbackError);
            
            // If it's a state validation error, clear context and redirect
            if (callbackError.message.includes('state') || callbackError.message.includes('Invalid state')) {
              clearDriverSignupContext();
              console.log('State validation failed, clearing context and redirecting');
              
              // Check if this was a driver signup attempt
              const driverSignupContext = JSON.parse(localStorage.getItem('driver_signup_context') || '{}');
              if (driverSignupContext.type === 'driver_signup') {
                navigate('/driver-signup', { replace: true });
              } else {
                navigate('/admin-login', { replace: true });
              }
              return;
            }
            
            throw callbackError;
          }
        }
        
                     // If already authenticated, check if this was a signup
             if (isAuthenticated && user) {
               console.log('User authenticated, checking signup context...');
               console.log('User:', user);
               
                              // Check for driver signup context first
               const driverSignupContext = JSON.parse(localStorage.getItem('driver_signup_context') || '{}');
               if (driverSignupContext.type === 'driver_signup') {
                 console.log('Driver signup context found, redirecting immediately to username setup');
                 clearDriverSignupContext();
                 navigate('/driver-username-setup', { replace: true });
                 return; // Exit early
               }
               
               // Check if user has driver role and this is a new user (signup)
               const userRolesCheck = user['https://lakbai.com/roles'] || [];
               const hasDriverRoleCheck = userRolesCheck.includes('driver');
               const hasAdminRoleCheck = userRolesCheck.includes('admin');
               const isNewUserCheck = !user.updated_at || 
                                    (new Date(user.updated_at) - new Date(user.created_at)) < 1000; // Within 1 second
               
               if (hasDriverRoleCheck && !hasAdminRoleCheck && isNewUserCheck) {
                 console.log('New user with driver role detected, redirecting to username setup');
                 navigate('/driver-username-setup', { replace: true });
                 return; // Exit early
               }
               
               // Check if user has driver role but is not an admin email
               const adminEmails = [
                 'livadomc@gmail.com',
                 'admin@lakbai.com',
                 'support@lakbai.com'
               ];
               
               if (hasDriverRoleCheck && !hasAdminRoleCheck && !adminEmails.includes(user.email)) {
                 console.log('Non-admin user with driver role detected, redirecting to username setup');
                 navigate('/driver-username-setup', { replace: true });
                 return; // Exit early
               }
           
            // Check if this was a signup (from appState)
            const appState = JSON.parse(localStorage.getItem('auth0_app_state') || '{}');
            console.log('App State:', appState);
          console.log('Driver Signup Context:', driverSignupContext);
          
          // Check URL parameters for signup context
          const urlParams = new URLSearchParams(window.location.search);
          const hasSignupParam = urlParams.get('signup') === 'true';
          const hasDriverParam = urlParams.get('role') === 'driver';
          const hasScreenHint = urlParams.get('screen_hint') === 'signup';
          
          // Check if this is a new user (signup) or existing user (login)
          const isNewUser = !user.updated_at || 
                           (new Date(user.updated_at) - new Date(user.created_at)) < 1000; // Within 1 second
          
          // Check if we have a recent driver signup context (within last 5 minutes)
          const isRecentDriverSignup = driverSignupContext.type === 'driver_signup' && 
                                     driverSignupContext.timestamp && 
                                     (Date.now() - driverSignupContext.timestamp) < 300000; // 5 minutes
          
          const wasSignup = appState.signupComplete || appState.forceSignup || hasSignupParam || hasScreenHint || isNewUser || isRecentDriverSignup;
          
          // Check if user has driver role from Auth0
          const userRoles = user['https://lakbai.com/roles'] || [];
          const hasDriverRole = userRoles.includes('driver');
          const hasAdminRole = userRoles.includes('admin');
          
          // Check if this is a driver signup based on multiple factors
          const isDriverSignup = appState.role === 'driver' || 
                                appState.forceSignup ||
                                hasDriverParam || 
                                (appState.returnTo && appState.returnTo.includes('driver')) ||
                                (appState.returnTo && appState.returnTo.includes('driver-username-setup')) ||
                                isRecentDriverSignup ||
                                driverSignupContext.type === 'driver_signup' ||
                                (hasDriverRole && wasSignup); // If user has driver role and this was a signup
          
          console.log('Signup detection:', {
            wasSignup,
            isDriverSignup,
            hasSignupParam,
            hasDriverParam,
            hasScreenHint,
            isNewUser,
            appStateRole: appState.role,
            appStateReturnTo: appState.returnTo,
            appStateForceSignup: appState.forceSignup,
            driverSignupContextType: driverSignupContext.type,
            driverSignupContextTimestamp: driverSignupContext.timestamp,
            isRecentDriverSignup,
            userRoles,
            hasDriverRole,
            hasAdminRole,
            userCreatedAt: user.created_at,
            userUpdatedAt: user.updated_at,
            fullDriverSignupContext: driverSignupContext
          });
          
          if (wasSignup && isDriverSignup) {
            console.log('Driver signup detected, redirecting to username setup immediately');
            
            // Clear all signup flags and context
            clearDriverSignupContext();
            
            // Redirect immediately without waiting
            navigate('/driver-username-setup', { replace: true });
            return; // Exit early to prevent further processing
          } else if (wasSignup) {
            console.log('Admin signup detected, redirecting to success page');
            // Clear the signup flag
            clearDriverSignupContext();
            setTimeout(() => {
              navigate('/auth/signup-success', { replace: true });
            }, 1500);
          } else {
            // Check if this is a driver login
            const isDriverLogin = appState.role === 'driver' || 
                                appState.returnTo === '/driver-login' ||
                                isRecentDriverSignup;
            
            // If user has driver role, prioritize driver flow
            if (hasDriverRole && !hasAdminRole) {
              console.log('User with driver role detected, syncing to database and redirecting to driver username setup');
              
              // Sync user to database
              try {
                const accessToken = await getAccessTokenSilently();
                const syncResult = await userSyncService.syncCurrentUser(user, accessToken);
                if (syncResult.success) {
                  console.log('Driver account synced to database successfully');
                } else {
                  console.warn('Failed to sync driver account to database:', syncResult.message);
                }
              } catch (syncError) {
                console.warn('Error syncing driver account to database:', syncError);
              }
              
              clearDriverSignupContext();
              setTimeout(() => {
                navigate('/driver-username-setup', { replace: true });
              }, 1500);
            } else if (isDriverLogin) {
              console.log('Driver login detected, redirecting to home page');
              // Clear the login flag
              clearDriverSignupContext();
              setTimeout(() => {
                navigate('/', { replace: true });
              }, 1500);
            } else {
              // Final fallback: check if we have driver signup context
              if (driverSignupContext.type === 'driver_signup' || isRecentDriverSignup) {
                console.log('Driver signup context found in fallback, redirecting to username setup');
                clearDriverSignupContext();
                setTimeout(() => {
                  navigate('/driver-username-setup', { replace: true });
                }, 1500);
              } else {
                console.log('Regular login, redirecting to login form for role check');
                // Clear any remaining context
                clearDriverSignupContext();
                setTimeout(() => {
                  navigate('/login', { replace: true });
                }, 1500);
              }
            }
          }
        }
        
        // If we reach here and no specific action was taken, check for driver signup context
        if (!isAuthenticated) {
          console.log('Not authenticated, checking for driver signup context...');
          const driverSignupContext = JSON.parse(localStorage.getItem('driver_signup_context') || '{}');
          
          if (driverSignupContext.type === 'driver_signup') {
            console.log('Driver signup context found, redirecting to driver signup page');
            clearDriverSignupContext();
            navigate('/driver-signup', { replace: true });
            return;
          }
        }
        
      } catch (err) {
        console.error('Callback processing error:', err);
        setCallbackStatus('error');
        setErrorMessage(err.message || 'Authentication failed. Please try again.');
      } finally {
        clearTimeout(timeoutId);
      }
    };

    if (!isLoading) {
      // Add a small delay to ensure Auth0 has time to complete authentication
      setTimeout(() => {
        processCallback();
      }, 1000);
    }
  }, [handleRedirectCallback, isAuthenticated, isLoading, navigate, error]);

  // Handle Auth0 errors
  useEffect(() => {
    if (error) {
      console.error('Auth0 Error:', error);
      setCallbackStatus('error');
      setErrorMessage(error.message || 'Authentication failed. Please try again.');
    }
  }, [error]);

  const handleRetry = () => {
    // Clear any stale state before retrying
    clearDriverSignupContext();
    
    // Check if this was a driver signup attempt
    const driverSignupContext = JSON.parse(localStorage.getItem('driver_signup_context') || '{}');
    if (driverSignupContext.type === 'driver_signup') {
      navigate('/driver-signup', { replace: true });
    } else {
      navigate('/admin-login', { replace: true });
    }
  };

  const renderContent = () => {
    switch (callbackStatus) {
      case 'processing':
        return (
          <div className={styles.statusContainer}>
            <div className={styles.spinner}></div>
            <h2 className={styles.statusTitle}>Authenticating...</h2>
            <p className={styles.statusMessage}>
              Please wait while we securely sign you in
            </p>
          </div>
        );
        
      case 'success':
        return (
          <div className={styles.statusContainer}>
            <div className={styles.successIcon}>✓</div>
            <h2 className={styles.statusTitle}>Welcome back!</h2>
            <p className={styles.statusMessage}>
              {user?.name ? `Hello ${user.name}!` : 'Authentication successful.'}
              <br />
              Redirecting to your dashboard...
            </p>
          </div>
        );
        
      case 'error':
        return (
          <div className={styles.statusContainer}>
            <div className={styles.errorIcon}>✕</div>
            <h2 className={styles.statusTitle}>Authentication Failed</h2>
            <p className={styles.statusMessage}>
              {errorMessage}
            </p>
            <button 
              onClick={handleRetry}
              className={styles.retryButton}
            >
              <i className="bi bi-arrow-left"></i>
              Try Again
            </button>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className={styles.callbackContainer}>
      <div className={styles.callbackCard}>
        {/* Logo Header */}
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <img
              src="/image/logofinal.png"
              width="50"
              height="50"
              className={styles.logo}
              alt="LakbAI Logo"
            />
            <div className={styles.logoText}>
              <h3 className={styles.brandName}>LakbAI Admin</h3>
              <p className={styles.brandTagline}>Secure Authentication</p>
            </div>
          </div>
        </div>

        {/* Dynamic Content */}
        {renderContent()}

        {/* Security Footer */}
        <div className={styles.securityFooter}>
          <div className={styles.securityBadge}>
            <i className="bi bi-shield-check"></i>
            <span>Secured by Auth0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth0Callback;
