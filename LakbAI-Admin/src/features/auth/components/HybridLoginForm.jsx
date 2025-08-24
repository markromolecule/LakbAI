import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import Auth0LoginForm from './Auth0LoginForm';
import LoginForm from './LoginForm';
import { simpleRoleService } from '../../../services/simpleRoleService';
import styles from '../styles/HybridLoginForm.module.css';

const HybridLoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, user, logout } = useAuth0();
  const [authMethod, setAuthMethod] = useState('choice'); // 'choice' | 'auth0' | 'regular'
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  // Check if user came from access denied page or wants fresh login
  useEffect(() => {
    if (location.state?.from === 'access-denied') {
      setShowAccessDenied(true);
    }
    
    // Check URL parameters for fresh login
    const urlParams = new URLSearchParams(window.location.search);
    const forceFresh = urlParams.get('fresh') === 'true';
    
    if (forceFresh) {
      console.log('Fresh login requested, clearing session...');
      localStorage.clear();
      sessionStorage.clear();
      // Remove the fresh parameter from URL
      window.history.replaceState({}, document.title, '/login');
    }
  }, [location.state, location.search]);

  // Handle Auth0 authentication state changes
  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      console.log('Auth0 user authenticated:', user);
      
      // Check if user wants to force a fresh login (from URL params)
      const urlParams = new URLSearchParams(window.location.search);
      const forceFresh = urlParams.get('fresh') === 'true';
      
      if (forceFresh) {
        console.log('Force fresh login detected, clearing session...');
        // Clear the session and redirect to home
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/';
        return;
      }
      
      // Enhance user with local roles if Auth0 roles are missing
      const enhancedUser = simpleRoleService.enhanceUserWithRoles(user);
      const userRoles = enhancedUser['https://lakbai.com/roles'] || [];
      const isAdmin = enhancedUser['https://lakbai.com/is_admin'] || userRoles.includes('admin');
      
      console.log('HybridLoginForm - Role check:', {
        email: user.email,
        auth0Roles: user['https://lakbai.com/roles'] || [],
        enhancedRoles: userRoles,
        isAdmin: isAdmin,
        roleSource: enhancedUser['https://lakbai.com/source'] || 'auth0'
      });
      
      if (isAdmin) {
        navigate('/admin/dashboard');
      } else {
        // User is authenticated but doesn't have admin access
        setShowAccessDenied(true);
      }
    }
  }, [isAuthenticated, user, isLoading, navigate]);

  // Show access denied message if user is authenticated but doesn't have admin access
  if (showAccessDenied && isAuthenticated && user) {
    const enhancedUser = simpleRoleService.enhanceUserWithRoles(user);
    const userRoles = enhancedUser['https://lakbai.com/roles'] || [];
    
    return (
      <div className={styles.hybridContainer}>
        <div className={styles.hybridCard}>
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
                <p className={styles.brandTagline}>Access Restricted</p>
              </div>
            </div>
          </div>

          {/* Access Denied Message */}
          <div style={{
            textAlign: 'center',
            padding: '20px',
            backgroundColor: '#fff3cd',
            borderRadius: '8px',
            margin: '20px 0',
            border: '1px solid #ffeaa7'
          }}>
            <div style={{ fontSize: '48px', color: '#f39c12', marginBottom: '10px' }}>⚠️</div>
            <h4 style={{ color: '#856404', marginBottom: '10px' }}>Admin Access Required</h4>
            <p style={{ color: '#856404', marginBottom: '15px' }}>
              You are signed in as <strong>{user.email}</strong>, but you don't have admin privileges.
            </p>
            
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '10px',
              borderRadius: '4px',
              fontSize: '12px',
              marginBottom: '15px'
            }}>
              <strong>Your current roles:</strong> {userRoles.length > 0 ? userRoles.join(', ') : 'None'}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  // Use the enhanced logout from auth0Service
                  import('../../../services/auth0Service').then(({ auth0Service }) => {
                    auth0Service.logout();
                  }).catch(() => {
                    // Fallback: manual logout
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = '/';
                  });
                }}
                style={{
                  padding: '10px 20px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Sign Out
              </button>
              <button
                onClick={() => window.location.href = '/debug/roles'}
                style={{
                  padding: '10px 20px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Debug Roles
              </button>
              <button
                onClick={() => {
                  // Complete manual logout - bypass Auth0 entirely
                  localStorage.clear();
                  sessionStorage.clear();
                  
                  // Clear any Auth0 cache
                  if (window.caches) {
                    window.caches.keys().then(names => {
                      names.forEach(name => {
                        window.caches.delete(name);
                      });
                    });
                  }
                  
                  // Clear all cookies
                  document.cookie.split(";").forEach(function(c) { 
                    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                  });
                  
                  // Force complete page reload
                  window.location.href = '/';
                }}
                style={{
                  padding: '10px 20px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Complete Logout
              </button>
              <button
                onClick={() => {
                  // Force fresh login by redirecting with fresh parameter
                  window.location.href = '/login?fresh=true';
                }}
                style={{
                  padding: '10px 20px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Force Fresh Login
              </button>
            </div>
          </div>

          {/* Authentication Method Options */}
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

            {/* Regular Option */}
            <div 
              className={styles.methodOption}
              onClick={() => setAuthMethod('regular')}
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

          {/* Security Information */}
          <div className={styles.securityInfo}>
            <div className={styles.securityBadge}>
              <i className="bi bi-shield-check"></i>
              <span>All methods are secured with enterprise-grade encryption</span>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <p className={styles.footerText}>
              By signing in, you agree to our{' '}
              <Link to="/terms" className={styles.footerLink}>Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className={styles.footerLink}>Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authentication method choice screen
  if (authMethod === 'choice') {
    return (
      <div className={styles.hybridContainer}>
        <div className={styles.hybridCard}>
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
                <p className={styles.brandTagline}>Choose Your Sign In Method</p>
              </div>
            </div>
            <h2 className={styles.formTitle}>Welcome Back</h2>
            <p className={styles.formSubtitle}>Select how you'd like to access your admin account</p>
          </div>

          {/* Authentication Method Options */}
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

            {/* Regular Option */}
            <div 
              className={styles.methodOption}
              onClick={() => setAuthMethod('regular')}
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

          {/* Security Information */}
          <div className={styles.securityInfo}>
            <div className={styles.securityBadge}>
              <i className="bi bi-shield-check"></i>
              <span>All methods are secured with enterprise-grade encryption</span>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <p className={styles.footerText}>
              By signing in, you agree to our{' '}
              <Link to="/terms" className={styles.footerLink}>Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className={styles.footerLink}>Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Auth0 Flow
  if (authMethod === 'auth0') {
    return (
      <div className={styles.authFormContainer}>
        <button 
          className={styles.backToChoice}
          onClick={() => setAuthMethod('choice')}
        >
          <i className="bi bi-arrow-left"></i>
          Back to Options
        </button>
        <Auth0LoginForm />
      </div>
    );
  }

  // Regular Login Flow
  if (authMethod === 'regular') {
    return (
      <div className={styles.authFormContainer}>
        <button 
          className={styles.backToChoice}
          onClick={() => setAuthMethod('choice')}
        >
          <i className="bi bi-arrow-left"></i>
          Back to Options
        </button>
        <LoginForm />
      </div>
    );
  }

  return null;
};

export default HybridLoginForm;
