import React from 'react';

export const PendingUsersTableHeader = () => (
  <thead className="table-dark">
    <tr>
      <th style={{ width: '25%' }}>User</th>
      <th style={{ width: '10%' }}>Type</th>
      <th style={{ width: '15%' }}>Phone</th>
      <th style={{ width: '20%' }}>Verification Type</th>
      <th style={{ width: '15%' }}>Document</th>
      <th style={{ width: '10%' }}>Applied</th>
      <th style={{ width: '15%' }}>Actions</th>
    </tr>
  </thead>
);

export const AllUsersTableHeader = () => (
  <thead className="table-dark">
    <tr>
      <th style={{ width: '25%' }}>User</th>
      <th style={{ width: '10%' }}>Type</th>
      <th style={{ width: '15%' }}>Phone</th>
      <th style={{ width: '20%' }}>Discount & Documents</th>
      <th style={{ width: '10%' }}>Status</th>
      <th style={{ width: '10%' }}>Joined</th>
      <th style={{ width: '10%' }}>Actions</th>
    </tr>
  </thead>
);
