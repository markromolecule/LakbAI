import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge } from 'react-bootstrap';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import MetricCard from '../../components/admin/shared/MetricCard';
import { API_CONFIG } from '../../config/apiConfig';

const Dashboard = () => {
  const [recentActivities, setRecentActivities] = useState([]);
  const [metrics, setMetrics] = useState([
    {
      title: 'Jeepneys',
      value: '8',
      subtitle: 'Modern Jeepney',
      color: 'warning',
      icon: 'bi-truck',
      trend: { type: 'up', value: 12 }
    },
    {
      title: 'Active Driver',
      value: '0',
      subtitle: 'Current drivers',
      color: 'success',
      icon: 'bi-person-badge',
      trend: { type: 'down', value: 2 }
    },
    {
      title: 'Passenger',
      value: '20',
      subtitle: 'Current Passengers',
      color: 'primary',
      icon: 'bi-people',
      trend: { type: 'up', value: 8 }
    },
    {
      title: 'Daily Revenue',
      value: '₱2,450',
      subtitle: 'Today\'s earnings',
      color: 'info',
      icon: 'bi-cash-coin',
      trend: { type: 'up', value: 22 }
    }
  ]);
  const [loading, setLoading] = useState(true);

  // Fetch real-time driver data
  useEffect(() => {
    const fetchDriverStats = async () => {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/admin/drivers`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.status === 'success' && data.drivers) {
            const activeDrivers = data.drivers.filter(driver => 
              driver.shift_status === 'on_shift'
            ).length;
            
            setMetrics(prevMetrics => 
              prevMetrics.map(metric => 
                metric.title === 'Active Driver' 
                  ? { ...metric, value: activeDrivers.toString() }
                  : metric
              )
            );
          }
        }
      } catch (error) {
        console.error('Error fetching driver stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDriverStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchDriverStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Mock recent activities - We can use API or WebSocket for live updates
  useEffect(() => {
    const activities = [
      {
        id: 1,
        type: 'user_created',
        message: 'New passenger Melthon registered',
        timestamp: new Date(Date.now() - 5 * 60000), // 5 minutes ago
        icon: 'bi-person-plus',
        color: 'success'
      },
      {
        id: 2,
        type: 'driver_login',
        message: 'Driver Juan Cruz logged in',
        timestamp: new Date(Date.now() - 12 * 60000), // 12 minutes ago
        icon: 'bi-person-check',
        color: 'info'
      },
      {
        id: 3,
        type: 'fare_update',
        message: 'Fare matrix updated for Route A',
        timestamp: new Date(Date.now() - 45 * 60000), // 45 minutes ago
        icon: 'bi-calculator',
        color: 'primary'
      },
    ];
    setRecentActivities(activities);
  }, []);

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return timestamp.toLocaleDateString();
  };

  const getActivityColor = (type) => {
    const colorMap = {
      'user_created': 'success',
      'driver_login': 'info',
      'jeepney_maintenance': 'warning',
      'fare_update': 'primary',
      'system_backup': 'success'
    };
    return colorMap[type] || 'secondary';
  };

  return (
    <AdminLayout 
      title="System Dashboard"
      subtitle="Overview of the LakbAI Jeepney System"
    >
      <Row className="g-3 mb-4">
        {metrics.map((metric, index) => (
          <Col xl={3} md={6} key={index}>
            <MetricCard
              title={metric.title}
              value={metric.value}
              subtitle={metric.subtitle}
              color={metric.color}
              icon={metric.icon}
              trend={metric.trend}
            />
          </Col>
        ))}
      </Row>
      
      {/* Recent Activity and Quick Actions */}
      <Row className="g-3">
        <Col lg={8}>
          <Card className="h-100">
            <Card.Header className="py-3 px-3">
              <div className="d-flex align-items-center justify-content-between">
                <h6 className="mb-0 fw-semibold text-dark">
                  <i className="bi bi-clock-history me-2 text-primary"></i>
                  Recent Activity
                </h6>
                <small className="text-muted badge bg-light text-dark px-2 py-1">Live updates</small>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="activity-list">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="activity-item d-flex align-items-center py-3 px-3 border-bottom">
                    <div className={`activity-icon me-3 rounded-circle d-flex align-items-center justify-content-center bg-${activity.color} bg-opacity-10`}>
                      <i className={`bi ${activity.icon} text-${activity.color}`}></i>
                    </div>
                    <div className="flex-grow-1">
                      <div className="activity-message fw-medium text-dark mb-1">
                        {activity.message}
                      </div>
                      <small className="text-muted">
                        {formatTimeAgo(activity.timestamp)}
                      </small>
                    </div>
                    <Badge bg={getActivityColor(activity.type)} className="ms-2 px-2 py-1">
                      {activity.type.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
              {recentActivities.length === 0 && (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-clock-history fs-2 d-block mb-3 opacity-50"></i>
                  <p>No recent activity to display</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="h-100">
            <Card.Header className="py-3 px-3">
              <h6 className="mb-0 fw-semibold text-dark">
                <i className="bi bi-lightning me-2 text-warning"></i>
                Quick Actions
              </h6>
            </Card.Header>
            <Card.Body className="p-3">
              <div className="d-grid gap-2">
                <button className="btn btn-outline-primary d-flex align-items-center justify-content-start p-3">
                  <i className="bi bi-plus-circle me-3 fs-5 text-primary"></i>
                  <div className="text-start">
                    <div className="fw-semibold text-dark">Add New Jeepney</div>
                    <small className="text-muted">Register a new vehicle</small>
                  </div>
                </button>
                <button className="btn btn-outline-success d-flex align-items-center justify-content-start p-3">
                  <i className="bi bi-person-plus me-3 fs-5 text-success"></i>
                  <div className="text-start">
                    <div className="fw-semibold text-dark">Register Driver</div>
                    <small className="text-muted">Add new driver account</small>
                  </div>
                </button>
                <button className="btn btn-outline-info d-flex align-items-center justify-content-start p-3">
                  <i className="bi bi-calculator me-3 fs-5 text-info"></i>
                  <div className="text-start">
                    <div className="fw-semibold text-dark">Update Fare Matrix</div>
                    <small className="text-muted">Modify pricing structure</small>
                  </div>
                </button>
                <button className="btn btn-outline-warning d-flex align-items-center justify-content-start p-3">
                  <i className="bi bi-geo-alt me-3 fs-5 text-warning"></i>
                  <div className="text-start">
                    <div className="fw-semibold text-dark">Manage Routes</div>
                    <small className="text-muted">Update checkpoints</small>
                  </div>
                </button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </AdminLayout>
  );
};

export default Dashboard;
