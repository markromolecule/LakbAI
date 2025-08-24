import React from 'react';
import { Card } from 'react-bootstrap';
import AdminLayout from '../../components/admin/layout/AdminLayout';

const Jeepneys = () => {
  return (
    <AdminLayout 
      title="Jeepneys Management"
      subtitle="Manage your jeepney fleet and assignments"
    >
      <Card className="border-0 shadow-sm text-center py-5">
        <Card.Body>
          <div className="text-muted">
            <i className="bi bi-truck display-1 mb-4 opacity-25"></i>
            <h4 className="text-muted mb-3">Jeepney Management</h4>
            <p className="lead">This section will contain jeepney fleet management features.</p>
            <small className="text-muted">
              Features: Vehicle registration, driver assignments, maintenance tracking, and route management.
            </small>
          </div>
        </Card.Body>
      </Card>
    </AdminLayout>
  );
};

export default Jeepneys;
