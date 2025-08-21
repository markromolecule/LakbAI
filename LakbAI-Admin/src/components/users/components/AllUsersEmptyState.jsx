import React from 'react';
import { Card, Button } from 'react-bootstrap';

const AllUsersEmptyState = ({ userType, onCreateUser }) => {
  return (
    <Card className="border-0 shadow-sm text-center py-5">
      <Card.Body>
        <i className="bi bi-people display-1 text-muted mb-3 opacity-50"></i>
        <h5 className="text-muted mb-2">No Users Found</h5>
        <p className="text-muted mb-3">
          {userType ? `No ${userType}s found` : 'No users found with current filters'}.
        </p>
        <Button variant="primary" onClick={onCreateUser}>
          <i className="bi bi-plus me-1"></i>
          Add First User
        </Button>
      </Card.Body>
    </Card>
  );
};

export default AllUsersEmptyState;
