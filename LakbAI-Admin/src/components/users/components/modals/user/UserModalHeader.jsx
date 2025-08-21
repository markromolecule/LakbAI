import React from 'react';
import { Row, Col, Card, Badge } from 'react-bootstrap';

const UserModalHeader = ({ user, mode }) => {
  if (mode !== 'view' || !user) return null;

  return (
    <Row className="mb-4">
      <Col md={6}>
        <Card className="border-0 bg-light">
          <Card.Body className="py-2">
            <small className="text-muted">User Type</small>
            <div>
              <Badge bg={user.user_type === 'driver' ? 'success' : 'info'}>
                {user.user_type}
              </Badge>
            </div>
          </Card.Body>
        </Card>
      </Col>
      <Col md={6}>
        <Card className="border-0 bg-light">
          <Card.Body className="py-2">
            <small className="text-muted">Account Status</small>
            <div>
              <Badge bg={user.is_verified ? 'success' : 'warning'}>
                {user.is_verified ? 'Verified' : 'Unverified'}
              </Badge>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default UserModalHeader;
