import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Alert, 
  Spinner, 
  Badge, 
  Row, 
  Col, 
  Button,
  ButtonGroup,
  Form
} from 'react-bootstrap';
import UserService from '../../services/userService';
import { API_CONFIG } from '../../config/apiConfig';

const DriverStatusContainer = ({ onDataUpdate }) => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'offline'

  useEffect(() => {
    // Log current API configuration for debugging
    API_CONFIG.logCurrentConfig();
    loadDrivers();
    
    // Auto-refresh driver status every 30 seconds
    const interval = setInterval(() => {
      loadDrivers();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch real driver status from the API
      const response = await fetch(`${API_CONFIG.BASE_URL}/admin/drivers`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 'success' && data.drivers) {
          // Use real driver data with actual shift status
          const driversWithStatus = data.drivers.map(driver => ({
            ...driver,
            shift_status: driver.shift_status || 'off_shift',
            last_active: driver.last_active || driver.updated_at || driver.created_at,
            // Add real-time status indicators
            is_active: driver.shift_status === 'on_shift',
            status_updated: new Date(driver.last_active || driver.updated_at || driver.created_at)
          }));
          
          setDrivers(driversWithStatus);
        } else {
          // Fallback to UserService if API fails
          const result = await UserService.getUsers({
            userType: 'driver',
            limit: 100
          });

          if (result.success) {
            const driversWithStatus = (result.users || []).map(driver => ({
              ...driver,
              shift_status: 'off_shift', // Default to off_shift if no real data
              last_active: driver.updated_at || driver.created_at,
              is_active: false,
              status_updated: new Date(driver.updated_at || driver.created_at)
            }));
            
            setDrivers(driversWithStatus);
          } else {
            setError(result.error || 'Failed to load drivers');
          }
        }
      } else {
        // Fallback to UserService if API fails
        const result = await UserService.getUsers({
          userType: 'driver',
          limit: 100
        });

        if (result.success) {
          const driversWithStatus = (result.users || []).map(driver => ({
            ...driver,
            shift_status: 'off_shift', // Default to off_shift if no real data
            last_active: driver.updated_at || driver.created_at,
            is_active: false,
            status_updated: new Date(driver.updated_at || driver.created_at)
          }));
          
          setDrivers(driversWithStatus);
        } else {
          setError(result.error || 'Failed to load drivers');
        }
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
      setError('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredDrivers = () => {
    if (statusFilter === 'all') return drivers;
    return drivers.filter(driver => driver.shift_status === statusFilter);
  };

  const getStatusStats = () => {
    const active = drivers.filter(d => d.shift_status === 'on_shift').length;
    const offline = drivers.filter(d => d.shift_status === 'off_shift').length;
    const recentlyActive = drivers.filter(d => {
      if (!d.status_updated) return false;
      const now = new Date();
      const diffMinutes = (now - d.status_updated) / (1000 * 60);
      return diffMinutes <= 5; // Active in last 5 minutes
    }).length;
    
    return { active, offline, recentlyActive, total: drivers.length };
  };

  const DriverCard = ({ driver }) => (
    <Card className="border-0 shadow-sm mb-3 compact-driver-card">
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="d-flex align-items-center">
            <i className="bi bi-person-circle me-2 text-primary"></i>
            <div>
              <h6 className="mb-1 fw-bold">
                {driver.first_name} {driver.last_name}
              </h6>
              <small className="text-muted">{driver.email}</small>
            </div>
          </div>
          <div className="d-flex flex-column gap-1">
            <Badge 
              bg={driver.shift_status === 'on_shift' ? 'success' : 'secondary'} 
              className="badge-sm"
            >
              {driver.shift_status === 'on_shift' ? 'On Duty' : 'Off Duty'}
            </Badge>
            <Badge bg={driver.is_verified ? 'success' : 'warning'} className="badge-sm">
              {driver.is_verified ? 'Verified' : 'Pending'}
            </Badge>
            {driver.is_active && (
              <Badge bg="success" className="pulse-animation badge-sm">
                <i className="bi bi-circle-fill me-1"></i>
                Live
              </Badge>
            )}
          </div>
        </div>
        
        <div className="row g-2 small">
          <div className="col-6">
            <i className="bi bi-phone me-1"></i>
            {driver.phone_number}
          </div>
          <div className="col-6">
            <i className="bi bi-clock me-1"></i>
            {driver.status_updated ? driver.status_updated.toLocaleDateString() : 'Unknown'}
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  const stats = getStatusStats();
  const filteredDrivers = getFilteredDrivers();

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" className="me-2" />
        Loading driver status...
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <i className="bi bi-exclamation-triangle me-2"></i>
        {error}
        <Button 
          variant="outline-danger" 
          size="sm" 
          className="ms-2"
          onClick={loadDrivers}
        >
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <div>
      {/* Status Statistics */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 bg-success text-white">
            <Card.Body className="text-center">
              <i className="bi bi-car-front-fill fs-1 mb-2 opacity-75"></i>
              <h3 className="mb-1">{stats.active}</h3>
              <small className="text-uppercase fw-bold">On Shift</small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="border-0 bg-info text-white">
            <Card.Body className="text-center">
              <i className="bi bi-activity fs-1 mb-2 opacity-75"></i>
              <h3 className="mb-1">{stats.recentlyActive}</h3>
              <small className="text-uppercase fw-bold">Recently Active</small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="border-0 bg-secondary text-white">
            <Card.Body className="text-center">
              <i className="bi bi-pause-circle-fill fs-1 mb-2 opacity-75"></i>
              <h3 className="mb-1">{stats.offline}</h3>
              <small className="text-uppercase fw-bold">Offline</small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="border-0 bg-primary text-white">
            <Card.Body className="text-center">
              <i className="bi bi-people-fill fs-1 mb-2 opacity-75"></i>
              <h3 className="mb-1">{stats.total}</h3>
              <small className="text-uppercase fw-bold">Total Drivers</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filter Controls */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">
          <i className="bi bi-speedometer me-2"></i>
          Driver Status Monitor
        </h5>
        
        <div className="d-flex gap-2">
          <ButtonGroup size="sm">
            <Button 
              variant={statusFilter === 'all' ? 'primary' : 'outline-primary'}
              onClick={() => setStatusFilter('all')}
            >
              All ({stats.total})
            </Button>
            <Button 
              variant={statusFilter === 'on_shift' ? 'success' : 'outline-success'}
              onClick={() => setStatusFilter('on_shift')}
            >
              Active ({stats.active})
            </Button>
            <Button 
              variant={statusFilter === 'off_shift' ? 'secondary' : 'outline-secondary'}
              onClick={() => setStatusFilter('off_shift')}
            >
              Offline ({stats.offline})
            </Button>
          </ButtonGroup>
          
          <Button 
            variant="outline-primary" 
            size="sm"
            onClick={loadDrivers}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            Refresh
          </Button>
        </div>
      </div>

      {/* Driver Status Cards */}
      {filteredDrivers.length === 0 ? (
        <Card className="border-0 shadow-sm text-center py-5">
          <Card.Body>
            <i className="bi bi-car-front display-1 text-muted mb-3 opacity-50"></i>
            <h5 className="text-muted mb-2">No Drivers Found</h5>
            <p className="text-muted mb-0">
              {statusFilter === 'all' ? 
                'No drivers registered yet.' : 
                `No drivers currently ${statusFilter}.`
              }
            </p>
          </Card.Body>
        </Card>
      ) : (
        <div>
          {filteredDrivers.map(driver => (
            <DriverCard key={driver.id} driver={driver} />
          ))}
        </div>
      )}

      {/* Information Alert */}
      <Alert variant="info" className="mt-4">
        <i className="bi bi-info-circle me-2"></i>
        <strong>Real-time Status:</strong> Driver status updates automatically every 30 seconds. 
        Drivers marked as "Live" are currently on shift and actively scanning checkpoints. 
        Status changes are reflected immediately when drivers start or end their shifts.
      </Alert>
      
      <style>{`
        .pulse-animation {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
        }
        
        /* Compact Driver Card Styles */
        .compact-driver-card {
          border-radius: 8px !important;
          transition: all 0.2s ease !important;
        }
        
        .compact-driver-card:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
        }
        
        .compact-driver-card .card-body {
          padding: 1rem !important;
        }
        
        .compact-driver-card .small {
          font-size: 0.8rem !important;
          color: #6c757d !important;
        }
        
        .badge-sm {
          font-size: 0.7rem !important;
          padding: 0.25rem 0.5rem !important;
        }
      `}</style>
    </div>
  );
};

export default DriverStatusContainer;

