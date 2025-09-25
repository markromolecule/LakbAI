import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthService from '../../../services/authService';

const ProtectedRoute = ({ children, allowedUserTypes = ['admin', 'driver'] }) => {
  const isAuthenticated = AuthService.isAuthenticated();
  const userType = AuthService.getUserType();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user type is allowed for this route
  if (!allowedUserTypes.includes(userType)) {
    // Redirect to appropriate dashboard based on user type
    if (userType === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userType === 'driver') {
      return <Navigate to="/driver/dashboard" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }
  
  return children;
};

export default ProtectedRoute;
