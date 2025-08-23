import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { simpleRoleService } from '../../../services/simpleRoleService';

/**
 * Auth0 Protected Route Component
 * Protects routes using Auth0 authentication state
 * Redirects unauthenticated users to login page
 */
const Auth0ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { 
    isLoading, 
    isAuthenticated, 
    user, 
    error,
    logout
  } = useAuth0();

  // Show loading spinner while Auth0 is checking authentication
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '16px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e9ecef',
          borderRadius: '50%',
          borderTopColor: '#667eea',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{
          margin: 0,
          color: '#6c757d',
          fontSize: '16px'
        }}>
          Loading...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Handle Auth0 errors
  if (error) {
    console.error('Auth0 Error in ProtectedRoute:', error);
    return <Navigate to="/login" replace state={{ error: error.message }} />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check admin access if required
  if (requireAdmin && user) {
    // Enhance user with local roles if Auth0 roles are missing
    const enhancedUser = simpleRoleService.enhanceUserWithRoles(user);
    const userRoles = enhancedUser['https://lakbai.com/roles'] || [];
    const isAdmin = enhancedUser['https://lakbai.com/is_admin'] || userRoles.includes('admin');
    
    console.log('Auth0ProtectedRoute - User roles check:', {
      email: user.email,
      roles: userRoles,
      isAdmin: isAdmin,
      requireAdmin: requireAdmin,
      source: enhancedUser['https://lakbai.com/source'] || 'auth0',
      fullUser: user
    });
    
    if (!isAdmin) {
      console.warn('User does not have admin access:', {
        email: user.email,
        roles: userRoles,
        appMetadata: user.app_metadata
      });
      
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: '16px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
          textAlign: 'center',
          padding: '20px'
        }}>
          <div style={{
            fontSize: '48px',
            color: '#dc3545'
          }}>🚫</div>
          <h2 style={{
            margin: 0,
            color: '#1a1a1a',
            fontSize: '24px',
            fontWeight: '700'
          }}>
            Access Denied
          </h2>
          <p style={{
            margin: 0,
            color: '#6c757d',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            You don't have permission to access this resource.
            <br />
            Please contact your administrator.
          </p>
          

          
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={() => {
                // Clear all local storage and session storage first
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
                
                // Force Auth0 logout with proper parameters
                logout({
                  logoutParams: {
                    returnTo: window.location.origin,
                    clientId: 'ysVIQhHKqNIFT1to9F0K40NuLh7xFvEN'
                  }
                });
              }}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Logout & Go Home
            </button>
            <button
              onClick={() => {
                // Navigate to login with state indicating access denied
                window.location.href = '/login';
              }}
              style={{
                padding: '12px 24px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Try Different Account
            </button>
            <button
              onClick={() => window.location.href = '/debug/roles'}
              style={{
                padding: '12px 24px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Debug Roles
            </button>
          </div>
        </div>
      );
    }
  }

  // Log successful authentication
  if (user) {
    console.log('User authenticated successfully:', {
      name: user.name,
      email: user.email,
      roles: user['https://lakbai.com/roles'] || []
    });
  }

  // Render protected content
  return children;
};

export default Auth0ProtectedRoute;
