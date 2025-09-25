import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import AuthService from '../../services/authService';
import { API_CONFIG } from '../../config/apiConfig';

const DriverDashboard = () => {
  const navigate = useNavigate();
  const [driverData, setDriverData] = useState(null);
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    try {
      setLoading(true);
      const userId = AuthService.getUserId();
      
      if (!userId) {
        setError('Driver ID not found. Please log in again.');
        return;
      }
      
      // Load driver profile
      const profileResponse = await fetch(`${API_CONFIG.BASE_URL}/mobile/driver/profile/${userId}`);
      const profileData = await profileResponse.json();
      
      console.log('Driver profile response:', profileData);
      
      if (profileData.status === 'success' && profileData.driverProfile) {
        setDriverData(profileData.driverProfile);
      } else {
        console.error('Failed to load driver profile:', profileData.message);
        setError(profileData.message || 'Failed to load driver profile');
      }

      // Load real earnings data
      const earningsResponse = await fetch(`${API_CONFIG.BASE_URL}/earnings/driver/${userId}`);
      const earningsData = await earningsResponse.json();
      
      console.log('Earnings response:', earningsData);
      
      if (earningsData.status === 'success' && earningsData.earnings) {
        setEarningsData({
          todayEarnings: earningsData.earnings.todayEarnings,
          todayTrips: earningsData.earnings.todayTrips,
          weeklyEarnings: earningsData.earnings.weeklyEarnings,
          weeklyTrips: earningsData.earnings.weeklyTrips,
          monthlyEarnings: earningsData.earnings.monthlyEarnings,
          monthlyTrips: earningsData.earnings.monthlyTrips,
          averageFare: earningsData.earnings.averageFarePerTrip
        });
      } else {
        console.error('Failed to load earnings data:', earningsData.message);
        // Fallback to mock data if API fails
        setEarningsData({
          todayEarnings: 0,
          todayTrips: 0,
          weeklyEarnings: 0,
          weeklyTrips: 0,
          monthlyEarnings: 0,
          monthlyTrips: 0,
          averageFare: 0
        });
      }

    } catch (error) {
      console.error('Error loading driver data:', error);
      setError('Failed to load driver data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <Spinner animation="border" role="status" className="lakbai-primary mb-3">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="text-muted">Loading driver dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <Alert variant="danger">{error}</Alert>
        <Button onClick={loadDriverData} variant="outline-primary">
          Try Again
        </Button>
      </div>
    );
  }

  const currentUser = AuthService.getCurrentUser();

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#ffffff' }}>
      <style>{`
        .simple-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: none;
          transition: all 0.2s ease;
        }
        .simple-card:hover {
          border-color: #2c5aa0;
          box-shadow: 0 1px 3px rgba(44, 90, 160, 0.1);
        }
        .metric-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1.5rem;
          text-align: center;
        }
        .metric-number {
          font-size: 2rem;
          font-weight: 700;
          color: #2c5aa0;
          margin-bottom: 0.25rem;
        }
        .metric-label {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        .info-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1rem;
          text-align: center;
        }
        .info-label {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }
        .info-value {
          font-size: 1rem;
          color: #111827;
          font-weight: 600;
        }
        .lakbai-primary {
          color: #2c5aa0 !important;
        }
        .lakbai-success {
          color: #10b981 !important;
        }
        .lakbai-info {
          color: #06b6d4 !important;
        }
        .lakbai-warning {
          color: #f59e0b !important;
        }
        .compact-header {
          min-height: 60px;
          padding: 0.75rem 0;
        }
        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }
      `}</style>
      {/* Compact Header */}
      <div className="bg-white border-bottom compact-header" style={{ borderColor: '#e5e7eb' }}>
        <div className="header-content">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <img 
                src="/image/logofinal.png" 
                alt="LakbAI" 
                className="me-3"
                style={{ height: '36px', width: 'auto' }}
              />
              <div>
                <h4 className="mb-0 lakbai-primary fw-bold">Dashboard</h4>
                <p className="mb-0 text-muted" style={{ fontSize: '0.75rem' }}>
                  Welcome back, {driverData ? `${driverData.first_name} ${driverData.last_name}` : 'Driver'}!
                </p>
              </div>
            </div>
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={handleLogout}
              style={{ 
                borderColor: '#e5e7eb', 
                color: '#6b7280',
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem'
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="py-5">
        <div className="header-content">
        {/* Key Metrics - Simple Cards */}
        <Row className="mb-5">
          <Col md={3}>
            <div className="metric-card">
              <div className="metric-number lakbai-success">
                {formatCurrency(earningsData?.todayEarnings || 0)}
              </div>
              <div className="metric-label">Today's Earnings</div>
            </div>
          </Col>
          <Col md={3}>
            <div className="metric-card">
              <div className="metric-number lakbai-primary">
                {earningsData?.todayTrips || 0}
              </div>
              <div className="metric-label">Trips Today</div>
            </div>
          </Col>
          <Col md={3}>
            <div className="metric-card">
              <div className="metric-number lakbai-info">
                {formatCurrency(earningsData?.weeklyEarnings || 0)}
              </div>
              <div className="metric-label">Weekly Earnings</div>
            </div>
          </Col>
          <Col md={3}>
            <div className="metric-card">
              <div className="metric-number lakbai-warning">
                ₱{earningsData?.averageFare?.toFixed(2) || '0.00'}
              </div>
              <div className="metric-label">Average Fare</div>
            </div>
          </Col>
        </Row>

        {/* Driver Information - Simple Grid */}
        <Row className="mb-4">
          <Col lg={12}>
            <div className="simple-card p-4">
              <h5 className="mb-4 lakbai-primary fw-semibold">Driver Information</h5>
              {driverData ? (
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">Name</div>
                    <div className="info-value">{driverData.first_name} {driverData.last_name}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Phone</div>
                    <div className="info-value">{driverData.phone_number}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Jeepney</div>
                    <div className="info-value">
                      {driverData.assignedJeepney ? 
                        `${driverData.assignedJeepney.jeepneyNumber}` : 
                        'Not Assigned'
                      }
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Status</div>
                    <div className="info-value">
                      <span className={`badge ${driverData.is_verified ? 'bg-success' : 'bg-warning'}`}>
                        {driverData.is_verified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="spinner-border lakbai-primary mb-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-muted">Loading driver information...</p>
                </div>
              )}
            </div>
          </Col>
        </Row>

        {/* Additional Metrics */}
        <Row>
          <Col md={6}>
            <div className="simple-card p-4">
              <h6 className="mb-3 lakbai-primary fw-semibold">Monthly Performance</h6>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fs-4 fw-bold lakbai-info">
                    {formatCurrency(earningsData?.monthlyEarnings || 0)}
                  </div>
                  <div className="text-muted small">Monthly Earnings</div>
                </div>
                <div className="text-end">
                  <div className="fs-5 fw-bold text-dark">
                    {earningsData?.monthlyTrips || 0}
                  </div>
                  <div className="text-muted small">Trips This Month</div>
                </div>
              </div>
            </div>
          </Col>
          <Col md={6}>
            <div className="simple-card p-4">
              <h6 className="mb-3 lakbai-primary fw-semibold">Weekly Performance</h6>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fs-4 fw-bold lakbai-primary">
                    {formatCurrency(earningsData?.weeklyEarnings || 0)}
                  </div>
                  <div className="text-muted small">Weekly Earnings</div>
                </div>
                <div className="text-end">
                  <div className="fs-5 fw-bold text-dark">
                    {earningsData?.weeklyTrips || 0}
                  </div>
                  <div className="text-muted small">Trips This Week</div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
