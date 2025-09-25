import React from 'react';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import FareMatrixManagement from '../../components/admin/FareMatrixManagement';

const FareMatrix = () => {
  return (
    <AdminLayout 
      title="Fare Management"
      subtitle="Configure and manage fare pricing"
    >
      <FareMatrixManagement />
    </AdminLayout>
  );
};

export default FareMatrix;
