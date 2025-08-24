import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Card, Button, Alert, Badge } from 'react-bootstrap';

const Auth0Debugger = () => {
  const { user, isAuthenticated, logout, loginWithRedirect } = useAuth0();
  const [debugInfo, setDebugInfo] = useState({});

  const testLogout = async () => {
    try {
      console.log('Testing logout...');
      
      // Clear storage first
      localStorage.clear();
      sessionStorage.clear();
      
      // Try different returnTo URLs
      const returnToOptions = [
        'http://localhost:5173',
        'http://localhost:5173/',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5173/',
        window.location.origin,
        window.location.origin + '/'
      ];
      
      for (const returnTo of returnToOptions) {
        try {
          console.log(`Trying logout with returnTo: ${returnTo}`);
          await logout({
            logoutParams: {
              returnTo,
              clientId: 'ysVIQhHKqNIFT1to9F0K40NuLh7xFvEN'
            }
          });
          console.log(`Logout successful with returnTo: ${returnTo}`);
          return;
        } catch (error) {
          console.warn(`Logout failed with returnTo ${returnTo}:`, error);
          continue;
        }
      }
      
      // If all fail, use manual redirect
      console.log('All logout attempts failed, using manual redirect');
      window.location.href = '/';
      
    } catch (error) {
      console.error('Logout test error:', error);
      setDebugInfo(prev => ({
        ...prev,
        logoutError: error.message
      }));
    }
  };

  const getDebugInfo = () => {
    const info = {
      isAuthenticated,
      user: user ? {
        email: user.email,
        name: user.name,
        sub: user.sub,
        roles: user['https://lakbai.com/roles'],
        permissions: user['https://lakbai.com/permissions']
      } : null,
      location: window.location.href,
      origin: window.location.origin,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    setDebugInfo(info);
    console.log('Debug info:', info);
  };

  return (
    <Card className="m-3">
      <Card.Header>
        <h5>Auth0 Debugger</h5>
      </Card.Header>
      <Card.Body>
        <div className="mb-3">
          <strong>Status:</strong>
          <Badge bg={isAuthenticated ? 'success' : 'secondary'} className="ms-2">
            {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </Badge>
        </div>

        {user && (
          <div className="mb-3">
            <strong>User:</strong>
            <div className="mt-1">
              <small>Email: {user.email}</small><br />
              <small>Name: {user.name}</small><br />
              <small>Roles: {user['https://lakbai.com/roles']?.join(', ') || 'None'}</small>
            </div>
          </div>
        )}

        <div className="d-flex gap-2 mb-3">
          <Button variant="primary" size="sm" onClick={getDebugInfo}>
            Get Debug Info
          </Button>
          <Button variant="warning" size="sm" onClick={testLogout}>
            Test Logout
          </Button>
          {!isAuthenticated && (
            <Button variant="success" size="sm" onClick={() => loginWithRedirect()}>
              Test Login
            </Button>
          )}
        </div>

        {debugInfo.logoutError && (
          <Alert variant="danger">
            <strong>Logout Error:</strong> {debugInfo.logoutError}
          </Alert>
        )}

        {Object.keys(debugInfo).length > 0 && (
          <div className="mt-3">
            <strong>Debug Info:</strong>
            <pre className="mt-2 p-2 bg-light" style={{fontSize: '12px'}}>
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default Auth0Debugger;
