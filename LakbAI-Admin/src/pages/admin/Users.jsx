import React from 'react';
import { Card } from 'react-bootstrap';
import AdminLayout from '../../components/admin/layout/AdminLayout';

const Users = () => {
  return (
    <AdminLayout 
      title="Users Management"
      subtitle="Manage passenger and driver accounts"
    >
      <Card className="border-0 shadow-sm text-center py-5">
        <Card.Body>
          <div className="text-muted">
            <i className="bi bi-people display-1 mb-4 opacity-25"></i>
            <h4 className="text-muted mb-3">User Management</h4>
            <p className="lead">This section will contain user account management features.</p>
            <small className="text-muted">
              Features: Driver registration, passenger accounts, user profiles, and permissions management.
            </small>
          </div>
        </Card.Body>
      </Card>
    </AdminLayout>
  );
};

export default Users;
