import React, { useState } from 'react';
import { Card, Button, Alert, Spinner } from 'react-bootstrap';

const ApiTestComponent = () => {
  const [testResults, setTestResults] = useState({});
  const [testing, setTesting] = useState(false);

  const API_BASE_URL = '/api';

  const testEndpoints = [
    { name: 'Health Check', url: API_BASE_URL, method: 'GET' },
    { name: 'Test Endpoint', url: `${API_BASE_URL}/test`, method: 'GET' },
    { name: 'Admin Users', url: `${API_BASE_URL}/admin/users`, method: 'GET' },
    { name: 'Pending Approvals', url: `${API_BASE_URL}/admin/pending-approvals`, method: 'GET' }
  ];

  const testEndpoint = async (endpoint) => {
    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        status: response.status,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: 'Failed'
      };
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    setTestResults({});

    for (const endpoint of testEndpoints) {
      const result = await testEndpoint(endpoint);
      setTestResults(prev => ({
        ...prev,
        [endpoint.name]: result
      }));
    }

    setTesting(false);
  };

  const getStatusBadgeClass = (result) => {
    if (!result) return 'secondary';
    return result.success ? 'success' : 'danger';
  };

  const getStatusText = (result) => {
    if (!result) return 'Not tested';
    return result.success ? `${result.status}` : `${result.error}`;
  };

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5 className="mb-0">
          <i className="bi bi-bug me-2"></i>
          API Connectivity Test
        </h5>
      </Card.Header>
      <Card.Body>
        <p className="text-muted mb-3">
          Use this tool to test API connectivity and debug issues.
        </p>

        <Button 
          variant="primary" 
          onClick={runAllTests} 
          disabled={testing}
          className="mb-3"
        >
          {testing ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Testing...
            </>
          ) : (
            <>
              <i className="bi bi-play me-2"></i>
              Run Tests
            </>
          )}
        </Button>

        {Object.keys(testResults).length > 0 && (
          <div>
            <h6>Test Results:</h6>
            {testEndpoints.map(endpoint => {
              const result = testResults[endpoint.name];
              return (
                <Alert 
                  key={endpoint.name}
                  variant={result?.success ? 'success' : 'danger'}
                  className="mb-2"
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <strong>{endpoint.name}</strong>
                      <br />
                      <small className="text-muted">{endpoint.method} {endpoint.url}</small>
                    </div>
                    <div className="text-end">
                      <div>{getStatusText(result)}</div>
                    </div>
                  </div>
                  
                  {result?.data && (
                    <details className="mt-2">
                      <summary>Response Data</summary>
                      <pre className="mt-2 bg-light p-2 rounded" style={{ fontSize: '0.8em' }}>
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </Alert>
              );
            })}
          </div>
        )}

        <Alert variant="info" className="mt-3">
          <strong>Troubleshooting Tips:</strong>
          <ul className="mb-0 mt-2">
            <li>Make sure XAMPP Apache server is running</li>
            <li>Verify the API base URL: <code>{API_BASE_URL}</code></li>
            <li>Check browser console for CORS errors</li>
            <li>Ensure .htaccess URL rewriting is working</li>
          </ul>
        </Alert>
      </Card.Body>
    </Card>
  );
};

export default ApiTestComponent;
