import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Tab, Tabs, Alert } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import UserService from '../../services/userService';
import PendingUsersContainer from '../../components/users/PendingUsersContainer';
import AllUsersContainer from '../../components/users/AllUsersContainer';
import UserStatsCards from '../../components/users/UserStatsCards';
import ApiTestComponent from '../../components/debug/ApiTestComponent';

const Users = () => {
  const location = useLocation();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPassengers: 0,
    totalDrivers: 0,
    pendingApprovals: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    loadUserStats();
    
    // Check if we should show a specific tab (from dashboard quick action)
    if (location.state?.showAddModal && location.state?.userType === 'driver') {
      setActiveTab("drivers");
    }
  }, [location.state]);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all users
      const allUsersResult = await UserService.getUsers();
      
      // Get pending approvals
      const pendingResult = await UserService.getPendingApprovals();

      if (allUsersResult.success && pendingResult.success) {
        const allUsers = allUsersResult.users || [];
        
        setStats({
          totalUsers: allUsers.length,
          totalPassengers: allUsers.filter(user => user.user_type === 'passenger').length,
          totalDrivers: allUsers.filter(user => user.user_type === 'driver').length,
          pendingApprovals: pendingResult.count || 0
        });
      } else {
        setError(allUsersResult.error || pendingResult.error || 'Failed to load user statistics');
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
      setError('Failed to load user statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleDataUpdate = () => {
    // Callback to refresh stats when data changes
    loadUserStats();
  };

  return (
    <AdminLayout 
      title="User Management"
      subtitle="Manage passenger and driver accounts, approvals, and user data"
    >
      {error && (
        <Alert variant="danger" className="mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {/* Debug Component - Remove in production */}
      {error && <ApiTestComponent />}

      {/* User Statistics Cards */}
      <UserStatsCards stats={stats} loading={loading} />

        {/* Main Content Tabs */}
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <Tabs 
              activeKey={activeTab}
              onSelect={(key) => {
                setActiveTab(key);
                handleDataUpdate();
              }}
              className="nav-tabs-custom px-3 pt-3"
            >
              <Tab 
                eventKey="pending" 
                title={
                  <span>
                    <i className="bi bi-clock-history me-2"></i>
                    Pending Approvals
                    {stats.pendingApprovals > 0 && (
                      <span className="badge bg-warning text-dark ms-2">
                        {stats.pendingApprovals}
                      </span>
                    )}
                  </span>
                }
              >
                <div className="p-3">
                  <PendingUsersContainer onDataUpdate={handleDataUpdate} />
                </div>
              </Tab>

              <Tab 
                eventKey="all-users" 
                title={
                  <span>
                    <i className="bi bi-people me-2"></i>
                    All Users
                    <span className="badge bg-primary ms-2">{stats.totalUsers}</span>
                  </span>
                }
              >
                <div className="p-3">
                  <AllUsersContainer onDataUpdate={handleDataUpdate} />
                </div>
              </Tab>

              <Tab 
                eventKey="passengers" 
                title={
                  <span>
                    <i className="bi bi-person me-2"></i>
                    Passengers
                    <span className="badge bg-info ms-2">{stats.totalPassengers}</span>
                  </span>
                }
              >
                <div className="p-3">
                  <AllUsersContainer 
                    userType="passenger" 
                    onDataUpdate={handleDataUpdate} 
                  />
                </div>
              </Tab>

              <Tab 
                eventKey="drivers" 
                title={
                  <span>
                    <i className="bi bi-car-front me-2"></i>
                    Drivers
                    <span className="badge bg-success ms-2">{stats.totalDrivers}</span>
                  </span>
                }
              >
                <div className="p-3">
                  <AllUsersContainer 
                    userType="driver" 
                    onDataUpdate={handleDataUpdate} 
                  />
                </div>
              </Tab>

            </Tabs>
          </Card.Body>
        </Card>

      <style>{`
        .nav-tabs-custom {
          border-bottom: 1px solid #dee2e6;
        }
        
        .nav-tabs-custom .nav-link {
          border: none;
          border-bottom: 3px solid transparent;
          color: #6c757d;
          font-weight: 500;
          padding: 1rem 1.5rem;
        }
        
        .nav-tabs-custom .nav-link:hover {
          border-color: transparent;
          color: #495057;
          background-color: #f8f9fa;
        }
        
        .nav-tabs-custom .nav-link.active {
          color: #0d6efd;
          background-color: transparent;
          border-color: transparent transparent #0d6efd;
        }

        .badge {
          font-size: 0.75em;
        }
      `}</style>
    </AdminLayout>
  );
};

export default Users;
