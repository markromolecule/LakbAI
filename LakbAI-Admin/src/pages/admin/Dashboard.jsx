import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import MetricCard from '../../components/admin/shared/MetricCard';
import { API_CONFIG } from '../../config/apiConfig';
import DashboardService from '../../services/dashboardService';

const Dashboard = () => {
  const navigate = useNavigate();
  const [recentActivities, setRecentActivities] = useState([]);
  const [metrics, setMetrics] = useState([
    {
      title: 'Total Jeepneys',
      value: '0',
      subtitle: 'Registered vehicles',
      color: 'warning',
      icon: 'bi-truck',
      trend: { type: 'up', value: 0 }
    },
    {
      title: 'Active Drivers',
      value: '0',
      subtitle: 'Currently on shift',
      color: 'success',
      icon: 'bi-person-badge',
      trend: { type: 'up', value: 0 }
    },
    {
      title: 'Total Passengers',
      value: '0',
      subtitle: 'Registered users',
      color: 'primary',
      icon: 'bi-people',
      trend: { type: 'up', value: 0 }
    },
    {
      title: 'Daily Revenue',
      value: '₱0',
      subtitle: 'Today\'s earnings',
      color: 'info',
      icon: 'bi-cash-coin',
      trend: { type: 'up', value: 0 }
    }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    dailyRevenue: 0,
    todayTrips: 0,
    averageFare: 0,
    totalDiscounts: 0,
    driverBreakdown: [],
    hourlyBreakdown: []
  });

  // Fetch all dashboard data
  const fetchDashboardData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      console.log('🔄 Fetching dashboard data...');
      
      // Fetch dashboard statistics
      const statsResult = await DashboardService.getDashboardStats();
      
        if (statsResult.success) {
          const { stats: fetchedStats } = statsResult;
          
          // Update stats state
          setStats(fetchedStats);
          
          // Update metrics with real data
          setMetrics([
          {
            title: 'Total Jeepneys',
            value: DashboardService.formatNumber(fetchedStats.totalJeepneys),
            subtitle: 'Registered vehicles',
            color: 'warning',
            icon: 'bi-truck',
            trend: { type: 'up', value: 0 }
          },
          {
            title: 'Active Drivers',
            value: DashboardService.formatNumber(fetchedStats.activeDrivers),
            subtitle: 'Currently on shift',
            color: 'success',
            icon: 'bi-person-badge',
            trend: { type: 'up', value: 0 }
          },
          {
            title: 'Total Passengers',
            value: DashboardService.formatNumber(fetchedStats.totalPassengers),
            subtitle: 'Registered users',
            color: 'primary',
            icon: 'bi-people',
            trend: { type: 'up', value: 0 }
          },
            {
              title: 'Total Revenue',
              value: DashboardService.formatCurrency(fetchedStats.dailyRevenue),
              subtitle: `${fetchedStats.todayTrips} trips • ₱${parseFloat(fetchedStats.averageFare || 0).toFixed(0)} avg`,
              color: 'info',
              icon: 'bi-cash-coin',
              trend: { type: 'up', value: 0 }
            }
        ]);
        
        setLastUpdated(new Date());
        console.log('✅ Dashboard data updated successfully');
        console.log('📊 Final metrics being set:', [
          {
            title: 'Total Jeepneys',
            value: DashboardService.formatNumber(fetchedStats.totalJeepneys),
            subtitle: 'Registered vehicles'
          },
          {
            title: 'Active Drivers',
            value: DashboardService.formatNumber(fetchedStats.activeDrivers),
            subtitle: 'Currently on shift'
          },
          {
            title: 'Total Passengers',
            value: DashboardService.formatNumber(fetchedStats.totalPassengers),
            subtitle: 'Registered users'
          },
          {
            title: 'Total Revenue',
            value: DashboardService.formatCurrency(fetchedStats.dailyRevenue),
            subtitle: `${fetchedStats.todayTrips} trips • ₱${parseFloat(fetchedStats.averageFare || 0).toFixed(0)} avg`
          }
        ]);
      } else {
        setError(statsResult.error || 'Failed to fetch dashboard statistics');
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Log API configuration
    console.log('🔧 API Configuration:', API_CONFIG);
    API_CONFIG.logCurrentConfig();
    
    // Initial fetch
    fetchDashboardData();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => fetchDashboardData(), 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch recent activities
  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        const activitiesResult = await DashboardService.fetchRecentActivities();
        
        if (activitiesResult.success) {
          setRecentActivities(activitiesResult.activities);
        } else {
          console.error('Failed to fetch recent activities:', activitiesResult.error);
          // Fallback to empty array
          setRecentActivities([]);
        }
      } catch (error) {
        console.error('Error fetching recent activities:', error);
        setRecentActivities([]);
      }
    };

    fetchRecentActivities();
    
    // Refresh activities every 60 seconds
    const interval = setInterval(fetchRecentActivities, 60000);
    
    return () => clearInterval(interval);
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

  // Quick Action Handlers
  const handleAddJeepney = () => {
    console.log('🚗 Navigating to Add Jeepney...');
    navigate('/admin/jeepneys', { 
      state: { 
        showAddModal: true,
        action: 'add'
      } 
    });
  };

  const handleRegisterDriver = () => {
    console.log('👤 Navigating to Register Driver...');
    navigate('/admin/users', { 
      state: { 
        showAddModal: true,
        userType: 'driver',
        action: 'add'
      } 
    });
  };

  const handleUpdateFareMatrix = () => {
    console.log('💰 Navigating to Fare Matrix...');
    navigate('/admin/fare-matrix');
  };

  const handleManageRoutes = () => {
    console.log('🗺️ Navigating to Manage Routes...');
    navigate('/admin/checkpoints');
  };

  return (
    <AdminLayout 
      title="System Dashboard"
      subtitle="Overview of the LakbAI Jeepney System"
    >
      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="mb-3">
          <i className="bi bi-exclamation-triangle me-2"></i>
          <strong>Error:</strong> {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" className="me-2" />
          <span>Loading dashboard data...</span>
        </div>
      )}

      {/* Last Updated Info */}
      {lastUpdated && !loading && (
        <div className="d-flex justify-content-between align-items-center mb-3">
          <small className="text-muted">
            <i className="bi bi-clock me-1"></i>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </small>
          <div className="d-flex align-items-center gap-2">
            <small className="text-muted">
              <i className="bi bi-arrow-clockwise me-1"></i>
              Auto-refreshes every 30 seconds
            </small>
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <Spinner animation="border" size="sm" className="me-1" />
                  Refreshing...
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>
      )}

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

      {/* Earnings Details Section */}
      {!loading && stats.dailyRevenue > 0 && (
        <Row className="g-3 mb-4">
          <Col lg={6}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="py-3 px-3">
                <h6 className="mb-0 fw-semibold text-dark">
                  <i className="bi bi-graph-up me-2 text-success"></i>
                  Total Earnings Summary
                </h6>
              </Card.Header>
              <Card.Body className="p-3">
                <div className="row g-3">
                  <div className="col-6">
                    <div className="text-center p-3 bg-light rounded">
                      <div className="fs-4 fw-bold text-success">
                        {DashboardService.formatCurrency(stats.dailyRevenue)}
                      </div>
                      <small className="text-muted">Total Revenue</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center p-3 bg-light rounded">
                      <div className="fs-4 fw-bold text-primary">
                        {stats.todayTrips}
                      </div>
                      <small className="text-muted">Total Trips</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center p-3 bg-light rounded">
                      <div className="fs-4 fw-bold text-info">
                        ₱{parseFloat(stats.averageFare || 0).toFixed(0)}
                      </div>
                      <small className="text-muted">Average Fare</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center p-3 bg-light rounded">
                      <div className="fs-4 fw-bold text-warning">
                        ₱{parseFloat(stats.totalDiscounts || 0).toFixed(0)}
                      </div>
                      <small className="text-muted">Discounts Given</small>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={6}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="py-3 px-3">
                <h6 className="mb-0 fw-semibold text-dark">
                  <i className="bi bi-person-badge me-2 text-primary"></i>
                  Top Performing Drivers
                </h6>
              </Card.Header>
              <Card.Body className="p-0">
                {stats.driverBreakdown && stats.driverBreakdown.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {console.log('Driver breakdown data:', stats.driverBreakdown)}
                    {stats.driverBreakdown.slice(0, 5).map((driver, index) => (
                      <div key={driver.driver_id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-semibold">
                            {driver.first_name} {driver.last_name}
                          </div>
                          <small className="text-muted">
                            {driver.driver_trips} trips
                          </small>
                        </div>
                        <div className="text-end">
                          <div className="fw-bold text-success">
                            {DashboardService.formatCurrency(driver.driver_revenue)}
                          </div>
                          <small className="text-muted">
                            ₱{parseFloat(driver.driver_avg_fare || 0).toFixed(0)} avg
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-person-badge fs-2 d-block mb-3 opacity-50"></i>
                    <p>No earnings data available</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
      
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
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" size="sm" variant="primary" className="me-2" />
                  <span className="text-muted">Loading activities...</span>
                </div>
              ) : (
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
              )}
              {!loading && recentActivities.length === 0 && (
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
                <button 
                  className="btn btn-outline-primary d-flex align-items-center justify-content-start p-3 quick-action-btn"
                  onClick={handleAddJeepney}
                  title="Navigate to Jeepneys page to add a new vehicle"
                >
                  <i className="bi bi-plus-circle me-3 fs-5 text-primary"></i>
                  <div className="text-start">
                    <div className="fw-semibold text-dark">Add New Jeepney</div>
                    <small className="text-muted">Register a new vehicle</small>
                  </div>
                  <i className="bi bi-arrow-right ms-auto text-muted"></i>
                </button>
                <button 
                  className="btn btn-outline-success d-flex align-items-center justify-content-start p-3 quick-action-btn"
                  onClick={handleRegisterDriver}
                  title="Navigate to Users page to register a new driver"
                >
                  <i className="bi bi-person-plus me-3 fs-5 text-success"></i>
                  <div className="text-start">
                    <div className="fw-semibold text-dark">Register Driver</div>
                    <small className="text-muted">Add new driver account</small>
                  </div>
                  <i className="bi bi-arrow-right ms-auto text-muted"></i>
                </button>
                <button 
                  className="btn btn-outline-info d-flex align-items-center justify-content-start p-3 quick-action-btn"
                  onClick={handleUpdateFareMatrix}
                  title="Navigate to Fare Matrix page to update pricing"
                >
                  <i className="bi bi-calculator me-3 fs-5 text-info"></i>
                  <div className="text-start">
                    <div className="fw-semibold text-dark">Update Fare Matrix</div>
                    <small className="text-muted">Modify pricing structure</small>
                  </div>
                  <i className="bi bi-arrow-right ms-auto text-muted"></i>
                </button>
                <button 
                  className="btn btn-outline-warning d-flex align-items-center justify-content-start p-3 quick-action-btn"
                  onClick={handleManageRoutes}
                  title="Navigate to Checkpoints page to manage routes"
                >
                  <i className="bi bi-geo-alt me-3 fs-5 text-warning"></i>
                  <div className="text-start">
                    <div className="fw-semibold text-dark">Manage Routes</div>
                    <small className="text-muted">Update checkpoints</small>
                  </div>
                  <i className="bi bi-arrow-right ms-auto text-muted"></i>
                </button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style>{`
        .quick-action-btn {
          transition: all 0.2s ease-in-out;
          border: 1px solid #dee2e6;
        }
        
        .quick-action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: currentColor;
        }
        
        .quick-action-btn:hover .bi-arrow-right {
          transform: translateX(3px);
          transition: transform 0.2s ease-in-out;
        }
        
        .quick-action-btn:active {
          transform: translateY(0);
        }
      `}</style>
    </AdminLayout>
  );
};

export default Dashboard;
