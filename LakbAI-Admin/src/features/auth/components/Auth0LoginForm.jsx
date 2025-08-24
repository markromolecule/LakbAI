import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import styles from '../styles/Auth0LoginForm.module.css';

const Auth0LoginForm = () => {
  const navigate = useNavigate();
  const {
    loginWithRedirect,
    logout,
    isAuthenticated,
    isLoading,
    user,
    error
  } = useAuth0();

  const [authError, setAuthError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle authentication state changes
  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      console.log('User authenticated successfully:', user);
      // Don't auto-redirect - let the HybridLoginForm handle role checking
      // This prevents auto-redirect to admin dashboard for non-admin users
    }
  }, [isAuthenticated, user, isLoading, navigate]);

  // Handle Auth0 errors
  useEffect(() => {
    if (error) {
      console.error('Auth0 Error:', error);
      setAuthError(error.message || 'Authentication failed. Please try again.');
    }
  }, [error]);

  const handleLogin = async () => {
    try {
      setIsProcessing(true);
      setAuthError(null);
      
      await loginWithRedirect({
        authorizationParams: {
          screen_hint: 'login',
          role: 'driver',
          app: 'admin'
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      setAuthError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignUp = async () => {
    try {
      setIsProcessing(true);
      setAuthError(null);
      
      await loginWithRedirect({
        authorizationParams: {
          screen_hint: 'signup',
          role: 'driver',
          app: 'admin'
        },
        appState: {
          returnTo: '/auth/login',
          signupComplete: true
        }
      });
    } catch (err) {
      console.error('Sign up error:', err);
      setAuthError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsProcessing(true);
      setAuthError(null);
      
      await loginWithRedirect({
        authorizationParams: {
          connection: 'google-oauth2',
          role: 'driver',
          app: 'admin'
        }
      });
    } catch (err) {
      console.error('Google login error:', err);
      setAuthError(err.message || 'Google login failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setIsProcessing(true);
      setAuthError(null);
      
      await loginWithRedirect({
        authorizationParams: {
          connection: 'facebook',
          role: 'driver',
          app: 'admin'
        }
      });
    } catch (err) {
      console.error('Facebook login error:', err);
      setAuthError(err.message || 'Facebook login failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading authentication...</p>
      </div>
    );
  }

  // Show authenticated state (should not normally be seen due to redirect)
  if (isAuthenticated) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.checkIcon}>✓</div>
        <p>Welcome back, {user?.name}!</p>
        <p>Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.loginFormContainer}>
      <div className={styles.loginCard}>
        {/* Back Button */}
        <Link to="/" className={styles.backButton}>
          <i className="bi bi-arrow-left"></i>
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
              <p className={styles.brandTagline}>Driver & Fleet Management</p>
            </div>
          </div>
          <h2 className={styles.formTitle}>Welcome Back</h2>
          <p className={styles.formSubtitle}>Sign in to manage your LakbAI operations</p>
        </div>

        {/* Error Display */}
        {authError && (
          <div className={styles.errorAlert}>
            <i className="bi bi-exclamation-triangle-fill"></i>
            <span>{authError}</span>
            <button 
              className={styles.dismissError}
              onClick={() => setAuthError(null)}
            >
              <i className="bi bi-x"></i>
            </button>
          </div>
        )}

        {/* Auth Buttons */}
        <div className={styles.authSection}>
          {/* Primary Login Button */}
          <button
            onClick={handleLogin}
            disabled={isProcessing}
            className={`${styles.primaryButton} ${isProcessing ? styles.loading : ''}`}
          >
            {isProcessing ? (
              <>
                <span className={styles.spinner}></span>
                Authenticating...
              </>
            ) : (
              <>
                <i className="bi bi-shield-lock"></i>
                Sign In with Auth0
              </>
            )}
          </button>

          {/* Social Login Section */}
          <div className={styles.divider}>
            <span className={styles.dividerText}>or continue with</span>
          </div>

          <div className={styles.socialButtons}>
            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              disabled={isProcessing}
              className={`${styles.socialButton} ${styles.googleButton}`}
            >
              <i className="bi bi-google"></i>
              <span>Google</span>
            </button>

            {/* Facebook Login */}
            <button
              onClick={handleFacebookLogin}
              disabled={isProcessing}
              className={`${styles.socialButton} ${styles.facebookButton}`}
            >
              <i className="bi bi-facebook"></i>
              <span>Facebook</span>
            </button>
          </div>

          {/* Sign Up Option */}
          <div className={styles.signUpSection}>
            <p className={styles.signUpText}>
              Don't have an account?{' '}
              <button 
                onClick={handleSignUp}
                disabled={isProcessing}
                className={styles.signUpLink}
              >
                Sign up here
              </button>
            </p>
          </div>
        </div>

        {/* Security Information */}
        <div className={styles.securityInfo}>
          <div className={styles.securityBadge}>
            <i className="bi bi-shield-check"></i>
            <span>Secured by Auth0</span>
          </div>
          <p className={styles.securityText}>
            Your login is protected with enterprise-grade security
          </p>
        </div>

        {/* Footer Content */}
        <div className={styles.formFooter}>
          <div className={styles.helpSection}>
            <h4 className={styles.helpTitle}>Need Help?</h4>
            <p className={styles.helpText}>
              Having trouble signing in? Contact our support team for assistance.
            </p>
            <div className={styles.contactInfo}>
              <a href="mailto:support@lakbai.com" className={styles.contactLink}>
                <i className="bi bi-envelope"></i>
                support@lakbai.com
              </a>
              <a href="tel:+639123456789" className={styles.contactLink}>
                <i className="bi bi-telephone"></i>
                +63 912 345 6789
              </a>
            </div>
          </div>

          <div className={styles.legalLinks}>
            <p className={styles.termsText}>
              By signing in, you agree to our{' '}
              <Link to="/terms" className={styles.legalLink}>Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className={styles.legalLink}>Privacy Policy</Link>
            </p>
            <p className={styles.copyrightText}>
              © 2024 LakbAI. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth0LoginForm;
