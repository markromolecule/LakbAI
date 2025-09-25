import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from "../../features/home/pages/HomePage";
import { LoginPage, RegisterPage, AuthPage } from '../../features/auth';

// Admin Components
import ProtectedRoute from '../../components/admin/shared/ProtectedRoute';
import Dashboard from '../../pages/admin/Dashboard';
import Jeepneys from '../../pages/admin/Jeepneys';
import Users from '../../pages/admin/Users';
import FareMatrix from '../../pages/admin/FareMatrix';
import Checkpoints from '../../pages/admin/Checkpoints';

// Driver Components
import DriverDashboard from '../../pages/driver/DriverDashboard';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Admin Routes - Protected */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedUserTypes={['admin']}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/jeepneys" 
          element={
            <ProtectedRoute allowedUserTypes={['admin']}>
              <Jeepneys />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute allowedUserTypes={['admin']}>
              <Users />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/fare-matrix" 
          element={
            <ProtectedRoute allowedUserTypes={['admin']}>
              <FareMatrix />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/checkpoints" 
          element={
            <ProtectedRoute allowedUserTypes={['admin']}>
              <Checkpoints />
            </ProtectedRoute>
          } 
        />

        {/* Driver Routes - Protected */}
        <Route path="/driver" element={<Navigate to="/driver/dashboard" replace />} />
        <Route 
          path="/driver/dashboard" 
          element={
            <ProtectedRoute allowedUserTypes={['driver']}>
              <DriverDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Catch-all route for unmatched paths */}
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
