import React from 'react';
import { Table, Badge, Button, Spinner } from 'react-bootstrap';
import styles from './TableStyles.module.css';

const PendingUsersTable = ({ 
  users, 
  processing, 
  onApprovalAction, 
  onDriverLicenseApproval,
  onViewDocument 
}) => {
  const getDiscountStatusBadge = (user) => {
    if (user.discount_verified === 1) {
      return <Badge className={`${styles.badge} ${styles.badgeSuccess}`}>{user.discount_type} - Approved</Badge>;
    } else if (user.discount_verified === -1) {
      return <Badge className={`${styles.badge} ${styles.badgeDanger}`}>{user.discount_type} - Rejected</Badge>;
    } else {
      return <Badge className={`${styles.badge} ${styles.badgeWarning}`}>{user.discount_type} - Pending</Badge>;
    }
  };

  const getDriverLicenseStatusBadge = (user) => {
    if (user.drivers_license_verified === 1) {
      return (
        <Badge className={`${styles.badge} ${styles.badgeSuccess}`}>
          <i className="bi bi-check-circle me-1"></i>
          License Verified
        </Badge>
      );
    } else if (user.drivers_license_verified === -1) {
      return (
        <Badge className={`${styles.badge} ${styles.badgeDanger}`}>
          <i className="bi bi-x-circle me-1"></i>
          License Rejected
        </Badge>
      );
    } else {
      return (
        <Badge className={`${styles.badge} ${styles.badgeWarning}`}>
          <i className="bi bi-clock me-1"></i>
          License Pending
        </Badge>
      );
    }
  };

  const renderVerificationType = (user) => {
    if (user.user_type === 'driver') {
      return (
        <div className={styles.verificationType}>
          <Badge className={`${styles.badge} ${styles.badgeSecondary}`}>
            <i className="bi bi-car-front me-1"></i>
            Driver's License
          </Badge>
          <div>
            {getDriverLicenseStatusBadge(user)}
          </div>
        </div>
      );
    }
    return getDiscountStatusBadge(user);
  };

  const renderDocumentButton = (user) => {
    if (user.user_type === 'driver') {
      return user.drivers_license_name ? (
        <Button
          variant="outline-primary"
          size="sm"
          className={styles.documentButton}
          onClick={() => onViewDocument(user)}
          title="Review driver's license and approve account"
        >
          <i className="bi bi-card-text me-1"></i>
          Review License
        </Button>
      ) : (
        <span className="text-muted">No license uploaded</span>
      );
    }

    return (user.discount_file_path || user.discount_document_name || user.discount_document_path) ? (
      <Button
        variant="outline-primary"
        size="sm"
        className={styles.documentButton}
        onClick={() => onViewDocument(user)}
        title="Review discount application and approve account"
      >
        <i className="bi bi-file-earmark-text me-1"></i>
        Review Application
      </Button>
    ) : (
      <span className="text-muted">No document uploaded</span>
    );
  };

  const renderActions = (user) => {
    if (user.user_type === 'driver') {
      return (
        <>
          {user.drivers_license_verified === 0 && (
            <>
              <Button
                variant="outline-success"
                size="sm"
                className={`${styles.actionButton} ${styles.actionButtonApprove}`}
                onClick={() => onDriverLicenseApproval(user, true)}
                disabled={processing === user.id}
                title="Approve driver account"
              >
                {processing === user.id ? (
                  <Spinner animation="border" size="sm" className={styles.loadingSpinner} />
                ) : (
                  <i className="bi bi-check-circle"></i>
                )}
              </Button>
              
              <Button
                variant="outline-danger"
                size="sm"
                className={`${styles.actionButton} ${styles.actionButtonReject}`}
                onClick={() => onDriverLicenseApproval(user, false)}
                disabled={processing === user.id}
                title="Reject driver account"
              >
                <i className="bi bi-x-circle"></i>
              </Button>
            </>
          )}
          {user.drivers_license_verified === 1 && (
            <Badge className={`${styles.badge} ${styles.badgeSuccess}`}>
              <i className="bi bi-check-circle me-1"></i>
              License Verified
            </Badge>
          )}
          {user.drivers_license_verified === -1 && (
            <Badge className={`${styles.badge} ${styles.badgeDanger}`}>
              <i className="bi bi-x-circle me-1"></i>
              License Rejected
            </Badge>
          )}
        </>
      );
    }

    return (
      <>
        {user.discount_verified === 0 && (
          <>
            <Button
              variant="outline-success"
              size="sm"
              className={`${styles.actionButton} ${styles.actionButtonApprove}`}
              onClick={() => onApprovalAction(user, true)}
              disabled={processing === user.id}
              title="Approve passenger account"
            >
              {processing === user.id ? (
                <Spinner animation="border" size="sm" className={styles.loadingSpinner} />
              ) : (
                <i className="bi bi-check-circle"></i>
              )}
            </Button>
            
            <Button
              variant="outline-danger"
              size="sm"
              className={`${styles.actionButton} ${styles.actionButtonReject}`}
              onClick={() => onApprovalAction(user, false)}
              disabled={processing === user.id}
              title="Reject passenger account"
            >
              <i className="bi bi-x-circle"></i>
            </Button>
          </>
        )}
        {user.discount_verified === 1 && (
          <Badge className={`${styles.badge} ${styles.badgeSuccess}`}>
            <i className="bi bi-check-circle me-1"></i>
            Approved
          </Badge>
        )}
        {user.discount_verified === -1 && (
          <Badge className={`${styles.badge} ${styles.badgeDanger}`}>
            <i className="bi bi-x-circle me-1"></i>
            Rejected
          </Badge>
        )}
      </>
    );
  };

  return (
    <div className="table-responsive">
      <Table className={styles.responsiveTable}>
        <thead className={styles.tableHeader}>
          <tr>
            <th className={styles.userColumn}>User</th>
            <th className={styles.typeColumn}>Type</th>
            <th className={styles.phoneColumn}>Phone</th>
            <th className={styles.verificationColumn}>Verification Type</th>
            <th className={styles.documentColumn}>Review Documents</th>
            <th className={styles.joinedColumn}>Applied</th>
            <th className={styles.actionsColumn}>Approve Account</th>
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
                <Badge className={`${styles.badge} ${user.user_type === 'driver' ? styles.badgeDriver : styles.badgePassenger}`}>
                  {user.user_type}
                </Badge>
              </td>
              <td>{user.phone_number}</td>
              <td>{renderVerificationType(user)}</td>
              <td className={styles.documentColumn}>
                {renderDocumentButton(user)}
              </td>
              <td className={styles.joinedColumn}>
                <div>
                  <div>{new Date(user.created_at).toLocaleDateString()}</div>
                  <small className="text-muted">{new Date(user.created_at).toLocaleTimeString()}</small>
                </div>
              </td>
              <td className={styles.actionsColumn}>
                <div className={styles.actionButtons}>
                  {renderActions(user)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default PendingUsersTable;
