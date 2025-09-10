import React from 'react';
import { Table, Badge, Button } from 'react-bootstrap';
import styles from './TableStyles.module.css';

const AllUsersTable = ({ users, onUserAction }) => {
  const getDiscountBadge = (user) => {
    if (!user.discount_type) {
      return <Badge className={`${styles.badge} ${styles.badgeSecondary}`}>No Discount</Badge>;
    }
    
    // Use new discount_status field if available, otherwise fall back to discount_verified
    const status = user.discount_status || (user.discount_verified === 1 ? 'approved' : user.discount_verified === -1 ? 'rejected' : 'pending');
    
    if (status === 'approved') {
      return <Badge className={`${styles.badge} ${styles.badgeSuccess}`}>{user.discount_type} - Approved</Badge>;
    } else if (status === 'rejected') {
      return (
        <div>
          <Badge className={`${styles.badge} ${styles.badgeDanger}`}>{user.discount_type} - Rejected</Badge>
          {user.discount_rejection_reason && (
            <div className="mt-1">
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                {user.discount_rejection_reason}
              </small>
            </div>
          )}
        </div>
      );
    } else {
      return <Badge className={`${styles.badge} ${styles.badgeWarning}`}>{user.discount_type} - Pending</Badge>;
    }
  };

  const renderDiscountAndDocuments = (user) => (
    <div className="d-flex align-items-center gap-2">
      {getDiscountBadge(user)}
      {(user.discount_file_path || user.discount_document_name) && (
        <Badge className={`${styles.badge} ${styles.badgeInfo}`}>
          <i className="bi bi-file-earmark-text me-1"></i>
          Document
        </Badge>
      )}
    </div>
  );

  const renderStatus = (user) => (
    <Badge className={`${styles.badge} ${user.is_verified ? styles.badgeSuccess : styles.badgeWarning}`}>
      {user.is_verified ? 'Verified' : 'Unverified'}
    </Badge>
  );

  const renderUserType = (user) => (
    <Badge className={`${styles.badge} ${user.user_type === 'driver' ? styles.badgeDriver : styles.badgePassenger}`}>
      {user.user_type}
    </Badge>
  );

  return (
    <div className="table-responsive">
      <Table className={styles.responsiveTable}>
        <thead className={styles.tableHeader}>
          <tr>
            <th className={styles.userColumn}>User</th>
            <th className={styles.typeColumn}>Type</th>
            <th className={styles.phoneColumn}>Phone</th>
            <th className={styles.verificationColumn}>Discount Status</th>
            <th className={styles.statusColumn}>Status</th>
            <th className={styles.joinedColumn}>Joined</th>
            <th className={styles.actionsColumn}>Actions</th>
          </tr>
        </thead>
        <tbody className={styles.tableBody}>
          {users.map(user => (
            <tr key={user.id}>
              <td>
                <div className={styles.userInfo}>
                  <i className={`bi ${user.user_type === 'driver' ? 'bi-car-front' : 'bi-person'} ${styles.userIcon}`}></i>
                  <div className={styles.userDetails}>
                    <div className={styles.userName}>{user.first_name} {user.last_name}</div>
                    <div className={styles.userEmail}>{user.email}</div>
                  </div>
                </div>
              </td>
              <td className={styles.typeColumn}>
                {renderUserType(user)}
              </td>
              <td>{user.phone_number}</td>
              <td>{renderDiscountAndDocuments(user)}</td>
              <td className={styles.statusColumn}>
                {renderStatus(user)}
              </td>
              <td className={styles.joinedColumn}>
                <div>
                  <div>{new Date(user.created_at).toLocaleDateString()}</div>
                  <small className="text-muted">{new Date(user.created_at).toLocaleTimeString()}</small>
                </div>
              </td>
              <td className={styles.actionsColumn}>
                <div className={styles.actionButtons}>
                  <Button
                    variant="outline-info"
                    size="sm"
                    className={`${styles.actionButton} ${styles.actionButtonView}`}
                    onClick={() => onUserAction(user, 'view')}
                    title="View details"
                  >
                    <i className="bi bi-eye"></i>
                  </Button>
                  <Button
                    variant="outline-warning"
                    size="sm"
                    className={`${styles.actionButton} ${styles.actionButtonEdit}`}
                    onClick={() => onUserAction(user, 'edit')}
                    title="Edit user"
                  >
                    <i className="bi bi-pencil"></i>
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className={`${styles.actionButton} ${styles.actionButtonDelete}`}
                    onClick={() => onUserAction(user, 'delete')}
                    title="Delete user"
                  >
                    <i className="bi bi-trash"></i>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default AllUsersTable;
