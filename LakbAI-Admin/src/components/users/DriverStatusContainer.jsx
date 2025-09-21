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

const DriverStatusContainer = ({ onDataUpdate }) => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'offline'

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch real driver status from the API
      const response = await fetch('http://localhost:80/LakbAI/LakbAI-API/routes/api.php/admin/drivers');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 'success' && data.drivers) {
          // Use real driver data with actual shift status
          const driversWithStatus = data.drivers.map(driver => ({
            ...driver,
            shift_status: driver.shift_status || 'off_shift',
            last_active: driver.last_active || driver.updated_at || driver.created_at
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
              last_active: driver.updated_at || driver.created_at
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
            last_active: driver.updated_at || driver.created_at
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
    
    return { active, offline, total: drivers.length };
  };

  const DriverCard = ({ driver }) => (
    <Card className="border-0 shadow-sm mb-3">
      <Card.Body>
        <Row className="align-items-center">
          <Col md={8}>
            <div className="d-flex align-items-center mb-2">
              <div className="me-3">
                <i className="bi bi-car-front fs-4 text-primary"></i>
              </div>
              <div>
                <h6 className="mb-1 fw-bold">
                  {driver.first_name} {driver.last_name}
                  <Badge 
                    bg={driver.shift_status === 'on_shift' ? 'success' : 'secondary'} 
                    className="ms-2"
                  >
                    {driver.shift_status === 'on_shift' ? 'On Duty' : 'Off Duty'}
                  </Badge>
                </h6>
                <small className="text-muted">{driver.email}</small>
              </div>
            </div>
            
            <div className="mb-2">
              <strong>Phone:</strong> {driver.phone_number}
            </div>

            <div className="mb-2">
              <strong>Status:</strong>
              <Badge bg={driver.is_verified ? 'success' : 'warning'} className="ms-2">
                {driver.is_verified ? 'Verified' : 'Pending Verification'}
              </Badge>
            </div>

            <small className="text-muted">
              <i className="bi bi-clock me-1"></i>
              Last Active: {driver.last_active.toLocaleString()}
            </small>
          </Col>

          <Col md={4}>
            <div className="text-center">
              <div className="mb-3">
                <div 
                  className={`rounded-circle d-inline-flex align-items-center justify-content-center ${
                    driver.shift_status === 'on_shift' ? 'bg-success' : 'bg-secondary'
                  }`}
                  style={{ width: '60px', height: '60px' }}
                >
                  <i className={`bi ${
                    driver.shift_status === 'on_shift' ? 'bi-check-circle' : 'bi-dash-circle'
                  } fs-3 text-white`}></i>
                </div>
              </div>
              
              {/* Note: In a real implementation, you would have API endpoints to update driver status */}
              <small className="text-muted">
                Status managed by driver
              </small>
            </div>
          </Col>
        </Row>
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
        <Col md={4}>
          <Card className="border-0 bg-success text-white">
            <Card.Body className="text-center">
              <i className="bi bi-car-front-fill fs-1 mb-2 opacity-75"></i>
              <h3 className="mb-1">{stats.active}</h3>
              <small className="text-uppercase fw-bold">Active Drivers</small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="border-0 bg-secondary text-white">
            <Card.Body className="text-center">
              <i className="bi bi-pause-circle-fill fs-1 mb-2 opacity-75"></i>
              <h3 className="mb-1">{stats.offline}</h3>
              <small className="text-uppercase fw-bold">Offline Drivers</small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
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
        <strong>Note:</strong> Driver shift status is managed through the mobile application. 
        This view shows the current status based on driver check-ins. To implement real-time 
        status tracking, additional database fields and API endpoints would be needed.
      </Alert>
    </div>
  );
};

export default DriverStatusContainer;

