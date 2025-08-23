import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { simpleRoleService } from '../../../services/simpleRoleService';

/**
 * Admin Protected Route Component
 * Protects routes using admin authentication state
 * Supports both Auth0 and traditional admin authentication
 */
const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth0();
  
  // Check traditional admin authentication
  const isTraditionalAdminAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
  const adminEmail = localStorage.getItem('adminEmail');

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
          borderTopColor: '#fbbf24',
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

  // Check Auth0 admin authentication
  if (isAuthenticated && user) {
    const enhancedUser = simpleRoleService.enhanceUserWithRoles(user);
    const userRoles = enhancedUser['https://lakbai.com/roles'] || [];
    const isAdmin = enhancedUser['https://lakbai.com/is_admin'] || userRoles.includes('admin');
    
    // Also check if user has admin email in the allowed list
    const adminEmails = [
      'livadomc@gmail.com',
      'admin@lakbai.com',
      'support@lakbai.com'
    ];
    const isAdminEmail = adminEmails.includes(user.email);
    
    // Check if user has driver role (should not access admin)
    const hasDriverRole = userRoles.includes('driver');
    
    if ((isAdmin || isAdminEmail) && !hasDriverRole) {
      console.log('Auth0 admin authenticated successfully:', {
        email: user.email,
        roles: userRoles,
        isAdmin: isAdmin,
        isAdminEmail: isAdminEmail,
        hasDriverRole: hasDriverRole
      });
      return children;
    } else {
      console.log('Auth0 user not admin or has driver role, redirecting to login:', {
        email: user.email,
        roles: userRoles,
        isAdmin: isAdmin,
        isAdminEmail: isAdminEmail,
        hasDriverRole: hasDriverRole
      });
      return <Navigate to="/admin-login" replace />;
    }
  }

  // Check traditional admin authentication
  if (isTraditionalAdminAuthenticated && adminEmail) {
    console.log('Traditional admin authenticated successfully:', {
      email: adminEmail,
      loginTime: localStorage.getItem('adminLoginTime')
    });
    return children;
  }

  // Redirect to admin login if not authenticated
  console.log('Admin not authenticated, redirecting to admin login');
  return <Navigate to="/admin-login" replace />;
};

export default AdminProtectedRoute;
