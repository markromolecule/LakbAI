import React from 'react';
import { Card } from 'react-bootstrap';
import AdminLayout from '../../components/admin/layout/AdminLayout';

const FareMatrix = () => {
  return (
    <AdminLayout 
      title="Fare Matrix"
      subtitle="Configure and manage fare pricing"
    >
      <Card className="border-0 shadow-sm text-center py-5">
        <Card.Body>
          <div className="text-muted">
            <i className="bi bi-calculator display-1 mb-4 opacity-25"></i>
            <h4 className="text-muted mb-3">Fare Matrix Management</h4>
            <p className="lead">This section will contain fare pricing configuration features.</p>
            <small className="text-muted">
              Features: Base fare settings, distance-based pricing, discounts, and fare calculators.
            </small>
          </div>
        </Card.Body>
      </Card>
    </AdminLayout>
  );
};

export default FareMatrix;
