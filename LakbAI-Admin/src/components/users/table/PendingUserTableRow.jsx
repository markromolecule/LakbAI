import React from 'react';
import { Badge, Button, Spinner } from 'react-bootstrap';

const PendingUserTableRow = ({ 
  user, 
  processing, 
  onViewDocument, 
  onApprovalAction, 
  onDriverLicenseApproval 
}) => {
  const getDiscountStatusBadge = (user) => {
    if (user.discount_verified === 1) {
      return <Badge bg="success">{user.discount_type} - Approved</Badge>;
    } else if (user.discount_verified === -1) {
      return <Badge bg="danger">{user.discount_type} - Rejected</Badge>;
    } else {
      return <Badge bg="warning" text="dark">{user.discount_type} - Pending</Badge>;
    }
  };

  const getDriverLicenseStatusBadge = (user) => {
    if (user.drivers_license_verified === 1) {
      return (
        <Badge bg="success">
          <i className="bi bi-check-circle me-1"></i>
          License Verified
        </Badge>
      );
    } else if (user.drivers_license_verified === -1) {
      return (
        <Badge bg="danger">
          <i className="bi bi-x-circle me-1"></i>
          License Rejected
        </Badge>
      );
    } else {
      return (
        <Badge bg="warning" text="dark">
          <i className="bi bi-clock me-1"></i>
          License Pending
        </Badge>
      );
    }
  };

  const renderVerificationType = () => {
    if (user.user_type === 'driver') {
      return (
        <div>
          <Badge bg="secondary" text="white">
            <i className="bi bi-car-front me-1"></i>
            Driver's License
          </Badge>
          <div className="mt-1">
            {getDriverLicenseStatusBadge(user)}
          </div>
        </div>
      );
    }
    return getDiscountStatusBadge(user);
  };

  const renderDocumentButton = () => {
    if (user.user_type === 'driver') {
      return user.drivers_license_name ? (
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => onViewDocument(user)}
          title="View driver's license"
        >
          <i className="bi bi-card-text me-1"></i>
          View License
        </Button>
      ) : (
        <span className="text-muted">No license</span>
      );
    }

    return user.discount_document_name ? (
      <Button
        variant="outline-primary"
        size="sm"
        onClick={() => onViewDocument(user)}
        title="View document"
      >
        <i className="bi bi-file-earmark-text me-1"></i>
        View
      </Button>
    ) : (
      <span className="text-muted">No document</span>
    );
  };

  const renderActions = () => {
    if (user.user_type === 'driver') {
      return (
        <>
          {user.drivers_license_verified === 0 && (
            <>
              <Button
                variant="outline-success"
                size="sm"
                onClick={() => onDriverLicenseApproval(user, true)}
                disabled={processing === user.id}
                title="Verify driver's license"
              >
                {processing === user.id ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <i className="bi bi-check-circle"></i>
                )}
              </Button>
              
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => onDriverLicenseApproval(user, false)}
                disabled={processing === user.id}
                title="Reject driver's license"
              >
                <i className="bi bi-x-circle"></i>
              </Button>
            </>
          )}
          {user.drivers_license_verified === 1 && (
            <Badge bg="success">
              <i className="bi bi-check-circle me-1"></i>
              License Verified
            </Badge>
          )}
          {user.drivers_license_verified === -1 && (
            <Badge bg="danger">
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
              onClick={() => onApprovalAction(user, true)}
              disabled={processing === user.id}
              title="Approve application"
            >
              {processing === user.id ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <i className="bi bi-check-circle"></i>
              )}
            </Button>
            
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => onApprovalAction(user, false)}
              disabled={processing === user.id}
              title="Reject application"
            >
              <i className="bi bi-x-circle"></i>
            </Button>
          </>
        )}
        {user.discount_verified === 1 && (
          <Badge bg="success">
            <i className="bi bi-check-circle me-1"></i>
            Approved
          </Badge>
        )}
        {user.discount_verified === -1 && (
          <Badge bg="danger">
            <i className="bi bi-x-circle me-1"></i>
            Rejected
          </Badge>
        )}
      </>
    );
  };

  return (
    <tr>
      <td>
        <div className="d-flex align-items-center">
          <i className={`bi ${user.user_type === 'driver' ? 'bi-car-front' : 'bi-person'} me-2 text-primary`}></i>
          <div>
            <div className="fw-bold">{user.first_name} {user.last_name}</div>
            <small className="text-muted">{user.email}</small>
          </div>
        </div>
      </td>
      <td>
        <Badge bg={user.user_type === 'driver' ? 'primary' : 'info'}>
          {user.user_type}
        </Badge>
      </td>
      <td>{user.phone_number}</td>
      <td>{renderVerificationType()}</td>
      <td>
        <div className="text-center">
          {renderDocumentButton()}
        </div>
      </td>
      <td>
        <div className="text-center">
          <div>{new Date(user.created_at).toLocaleDateString()}</div>
          <small className="text-muted">{new Date(user.created_at).toLocaleTimeString()}</small>
        </div>
      </td>
      <td>
        <div className="d-flex gap-1 justify-content-center">
          {renderActions()}
        </div>
      </td>
    </tr>
  );
};

export default PendingUserTableRow;
