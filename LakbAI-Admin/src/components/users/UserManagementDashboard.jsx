import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Form, 
  Button, 
  InputGroup, 
  Badge, 
  Alert,
  Tab,
  Tabs,
  ButtonGroup,
  Spinner
} from 'react-bootstrap';
import AllUsersContainer from './AllUsersContainer';
import PendingUsersContainer from './PendingUsersContainer';
import UserService from '../../services/userService';

const UserManagementDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    approvedDiscounts: 0,
    drivers: 0,
    passengers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadDashboardStats();
  }, [refreshKey]);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      // Load various user statistics
      const [allUsers, pendingApprovals] = await Promise.all([
        UserService.getUsers(),
        UserService.getPendingApprovals()
      ]);

      if (allUsers.success && pendingApprovals.success) {
        const users = allUsers.users || [];
        const pending = pendingApprovals.users || [];

        setStats({
          totalUsers: users.length,
          pendingApprovals: pending.length,
          approvedDiscounts: users.filter(u => u.discount_verified === 1).length,
          drivers: users.filter(u => u.user_type === 'driver').length,
          passengers: users.filter(u => u.user_type === 'passenger').length
        });
      }
    } catch (err) {
      setError('Failed to load dashboard statistics');
      console.error('Dashboard stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDataUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  const StatCard = ({ title, value, icon, color = 'primary', subtext }) => (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Body>
        <div className="d-flex align-items-center">
          <div className={`rounded-circle p-3 bg-${color} bg-opacity-10 me-3`}>
            <i className={`bi ${icon} fs-4 text-${color}`}></i>
          </div>
          <div>
            <h3 className="mb-0 fw-bold">{loading ? <Spinner size="sm" /> : value}</h3>
            <p className="text-muted mb-0">{title}</p>
            {subtext && <small className="text-muted">{subtext}</small>}
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <Container fluid className="py-4">
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Dashboard Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            <i className="bi bi-people me-2"></i>
            User Management Dashboard
          </h2>
          <p className="text-muted mb-0">
            Manage users, approve discounts, and monitor user activities
          </p>
        </div>
        <Button 
          variant="outline-primary" 
          onClick={handleDataUpdate}
          disabled={loading}
        >
          <i className="bi bi-arrow-clockwise me-1"></i>
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col lg={2} md={4} sm={6} className="mb-3">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon="bi-people"
            color="primary"
          />
        </Col>
        <Col lg={2} md={4} sm={6} className="mb-3">
          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            icon="bi-clock-history"
            color="warning"
            subtext="Requires attention"
          />
        </Col>
        <Col lg={2} md={4} sm={6} className="mb-3">
          <StatCard
            title="Approved Discounts"
            value={stats.approvedDiscounts}
            icon="bi-check-circle"
            color="success"
          />
        </Col>
        <Col lg={2} md={4} sm={6} className="mb-3">
          <StatCard
            title="Drivers"
            value={stats.drivers}
            icon="bi-car-front"
            color="info"
          />
        </Col>
        <Col lg={2} md={4} sm={6} className="mb-3">
          <StatCard
            title="Passengers"
            value={stats.passengers}
            icon="bi-person"
            color="secondary"
          />
        </Col>
        <Col lg={2} md={4} sm={6} className="mb-3">
          <Card className="h-100 border-0 shadow-sm bg-light">
            <Card.Body className="text-center">
              <i className="bi bi-graph-up fs-1 text-success mb-2"></i>
              <h6 className="text-muted">System Health</h6>
              <Badge bg="success">Online</Badge>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <Tabs
            defaultActiveKey="pending"
            className="nav-tabs-custom"
            style={{ borderBottom: 'none' }}
          >
            <Tab 
              eventKey="pending" 
              title={
                <span>
                  <i className="bi bi-clock-history me-2"></i>
                  Pending Approvals
                  {stats.pendingApprovals > 0 && (
                    <Badge bg="warning" className="ms-2">
                      {stats.pendingApprovals}
                    </Badge>
                  )}
                </span>
              }
            >
              <div className="p-4">
                <PendingUsersContainer onDataUpdate={handleDataUpdate} />
              </div>
            </Tab>

            <Tab 
              eventKey="all-users" 
              title={
                <span>
                  <i className="bi bi-people me-2"></i>
                  All Users ({stats.totalUsers})
                </span>
              }
            >
              <div className="p-4">
                <AllUsersContainer onDataUpdate={handleDataUpdate} />
              </div>
            </Tab>

            <Tab 
              eventKey="analytics" 
              title={
                <span>
                  <i className="bi bi-graph-up me-2"></i>
                  Analytics
                </span>
              }
            >
              <div className="p-4">
                <Alert variant="info">
                  <h5>
                    <i className="bi bi-info-circle me-2"></i>
                    Analytics Dashboard
                  </h5>
                  <p className="mb-0">
                    Advanced analytics and reporting features will be available in the next update. 
                    This will include user activity trends, discount approval rates, and system usage statistics.
                  </p>
                </Alert>

                <Row className="mt-4">
                  <Col md={6}>
                    <Card>
                      <Card.Header>
                        <h6 className="mb-0">User Type Distribution</h6>
                      </Card.Header>
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span>Drivers</span>
                          <Badge bg="info">{stats.drivers}</Badge>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span>Passengers</span>
                          <Badge bg="secondary">{stats.passengers}</Badge>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card>
                      <Card.Header>
                        <h6 className="mb-0">Discount Status</h6>
                      </Card.Header>
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span>Pending Review</span>
                          <Badge bg="warning">{stats.pendingApprovals}</Badge>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span>Approved</span>
                          <Badge bg="success">{stats.approvedDiscounts}</Badge>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      <style>{`
        .nav-tabs-custom .nav-link {
          border: none;
          border-radius: 0;
          padding: 1rem 1.5rem;
          color: #6c757d;
          font-weight: 500;
        }
        .nav-tabs-custom .nav-link.active {
          background-color: transparent;
          border-bottom: 3px solid #0d6efd;
          color: #0d6efd;
        }
        .nav-tabs-custom .nav-link:hover {
          border-color: transparent;
          color: #0d6efd;
        }
      `}</style>
    </Container>
  );
};

export default UserManagementDashboard;
