import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from "../../features/home/pages/HomePage";
import { LoginPage, RegisterPage, AuthPage } from '../../features/auth';

// Auth0 Components
import Auth0LoginPage from '../../features/auth/pages/Auth0LoginPage';
import HybridLoginPage from '../../features/auth/pages/HybridLoginPage';
import AdminLoginPage from '../../features/auth/pages/AdminLoginPage';
import DriverSignupPage from '../../features/auth/pages/DriverSignupPage';
import DriverUsernameSetup from '../../features/auth/pages/DriverUsernameSetup';
import DriverLoginPage from '../../features/auth/pages/DriverLoginPage';
import Auth0Callback from '../../features/auth/components/Auth0Callback';
import Auth0Logout from '../../features/auth/components/Auth0Logout';
import SignupSuccessPage from '../../features/auth/pages/SignupSuccessPage';
import Auth0Debugger from '../../components/debug/Auth0Debugger';

// Admin Components
import Auth0ProtectedRoute from '../../components/admin/shared/Auth0ProtectedRoute';
import AdminProtectedRoute from '../../components/admin/shared/AdminProtectedRoute';
import Dashboard from '../../pages/admin/Dashboard';
import Jeepneys from '../../pages/admin/Jeepneys';
import Users from '../../pages/admin/Users';
import FareMatrix from '../../pages/admin/FareMatrix';
import Checkpoints from '../../pages/admin/Checkpoints';



const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<HybridLoginPage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/driver-signup" element={<DriverSignupPage />} />
        <Route path="/driver-username-setup" element={<DriverUsernameSetup />} />
        <Route path="/driver-login" element={<DriverLoginPage />} />
        <Route path="/auth/callback" element={<Auth0Callback />} />
        <Route path="/auth/logout" element={<Auth0Logout />} />
        <Route path="/auth/signup-success" element={<SignupSuccessPage />} />
        <Route path="/debug/auth0" element={<Auth0Debugger />} />
        
        {/* Direct Auth0 Route (for backward compatibility) */}
        <Route path="/auth0-login" element={<Auth0LoginPage />} />
        
        {/* Legacy Routes (for backward compatibility) */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth" element={<AuthPage />} />



        {/* Admin Routes - Admin Protected */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route 
          path="/admin/dashboard" 
          element={
            <AdminProtectedRoute>
              <Dashboard />
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/admin/jeepneys" 
          element={
            <AdminProtectedRoute>
              <Jeepneys />
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            <AdminProtectedRoute>
              <Users />
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/admin/fare-matrix" 
          element={
            <AdminProtectedRoute>
              <FareMatrix />
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/admin/checkpoints" 
          element={
            <AdminProtectedRoute>
              <Checkpoints />
            </AdminProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
