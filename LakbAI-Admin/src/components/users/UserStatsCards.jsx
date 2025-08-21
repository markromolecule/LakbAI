import React from 'react';
import { Row, Col, Card, Spinner } from 'react-bootstrap';

const UserStatsCards = ({ stats, loading }) => {
  const StatCard = ({ title, value, icon, bgColor, textColor = "white" }) => (
    <Col md={6} lg={3} className="mb-3">
      <Card className={`border-0 shadow-sm ${bgColor} text-${textColor} h-100`}>
        <Card.Body className="d-flex align-items-center">
          <div className="flex-shrink-0 me-3">
            <i className={`${icon} fs-1 opacity-75`}></i>
          </div>
          <div className="flex-grow-1">
            <h6 className="card-title mb-1 text-uppercase fw-bold small">
              {title}
            </h6>
            <h2 className="mb-0 fw-bold">
              {loading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                value.toLocaleString()
              )}
            </h2>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );

  return (
    <Row className="mb-4">
      <StatCard
        title="Total Users"
        value={stats.totalUsers}
        icon="bi bi-people-fill"
        bgColor="bg-primary"
      />
      <StatCard
        title="Passengers"
        value={stats.totalPassengers}
        icon="bi bi-person-fill"
        bgColor="bg-info"
      />
      <StatCard
        title="Drivers"
        value={stats.totalDrivers}
        icon="bi bi-car-front-fill"
        bgColor="bg-success"
      />
      <StatCard
        title="Pending Approvals"
        value={stats.pendingApprovals}
        icon="bi bi-clock-history"
        bgColor="bg-warning"
        textColor="dark"
      />
    </Row>
  );
};

export default UserStatsCards;

