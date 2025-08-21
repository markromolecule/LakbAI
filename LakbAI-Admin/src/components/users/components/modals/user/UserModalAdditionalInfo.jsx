import React from 'react';
import { Row, Col } from 'react-bootstrap';

const UserModalAdditionalInfo = ({ user, mode }) => {
  if (mode !== 'view' || !user) return null;

  return (
    <div className="mt-4 pt-3 border-top">
      <Row>
        <Col md={6}>
          <small className="text-muted">Created At:</small>
          <div>{new Date(user.created_at).toLocaleString()}</div>
        </Col>
        <Col md={6}>
          <small className="text-muted">Last Updated:</small>
          <div>{new Date(user.updated_at).toLocaleString()}</div>
        </Col>
      </Row>
    </div>
  );
};

export default UserModalAdditionalInfo;
