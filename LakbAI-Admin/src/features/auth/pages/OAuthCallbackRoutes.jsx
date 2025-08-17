/**
 * OAuth Callback Routes
 * Routes for handling OAuth callbacks
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import GoogleCallbackPage from './GoogleCallbackPage';
import FacebookCallbackPage from './FacebookCallbackPage';

const OAuthCallbackRoutes = () => {
  return (
    <Routes>
      <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
      <Route path="/auth/facebook/callback" element={<FacebookCallbackPage />} />
    </Routes>
  );
};

export default OAuthCallbackRoutes;
