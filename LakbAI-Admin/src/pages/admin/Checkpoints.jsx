import React from 'react';
import { Card } from 'react-bootstrap';
import AdminLayout from '../../components/admin/layout/AdminLayout';

const Checkpoints = () => {
  return (
    <AdminLayout 
      title="Checkpoints Management"
      subtitle="Manage route checkpoints and stops"
    >
      <Card className="border-0 shadow-sm text-center py-5">
        <Card.Body>
          <div className="text-muted">
            <i className="bi bi-geo-alt display-1 mb-4 opacity-25"></i>
            <h4 className="text-muted mb-3">Checkpoints Management</h4>
            <p className="lead">This section will contain route checkpoint management features.</p>
            <small className="text-muted">
              Features: Route planning, checkpoint creation, GPS coordinates, and stop management.
            </small>
          </div>
        </Card.Body>
      </Card>
    </AdminLayout>
  );
};

export default Checkpoints;
