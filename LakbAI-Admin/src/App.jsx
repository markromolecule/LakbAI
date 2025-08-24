import React, { useEffect } from 'react'
import { AppRoutes } from './app/routes'
import { clearAllAuthData } from './utils/authUtils'
import './App.css'

function App() {
  useEffect(() => {
    // Clear all authentication data on app start to prevent session conflicts
    console.log('Clearing all authentication data...');
    clearAllAuthData();
    
    // Additional clearing for any remaining Auth0 state
    const remainingKeys = Object.keys(localStorage).filter(key => 
      key.includes('auth0') || 
      key.includes('token') || 
      key.includes('session') ||
      key.includes('state') ||
      key.includes('context')
    );
    
    remainingKeys.forEach(key => {
      console.log('Removing remaining key:', key);
      localStorage.removeItem(key);
    });
    
    // Clear sessionStorage completely
    sessionStorage.clear();
    
    // Clear any cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    console.log('All authentication data cleared successfully');
  }, []);

  return (
    <div className="App">
      <AppRoutes />
    </div>
  )
}

export default App

