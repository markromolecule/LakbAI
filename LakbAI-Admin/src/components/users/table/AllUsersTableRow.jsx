import React from 'react';
import { Badge, Button, Dropdown } from 'react-bootstrap';

const AllUsersTableRow = ({ user, onUserAction }) => {
  const getDiscountBadge = (user) => {
    if (!user.discount_type) return null;
    
    if (user.discount_verified === 1) {
      return <Badge bg="success">{user.discount_type} - Approved</Badge>;
    } else if (user.discount_verified === -1) {
      return <Badge bg="danger">{user.discount_type} - Rejected</Badge>;
    } else {
      return <Badge bg="warning" text="dark">{user.discount_type} - Pending</Badge>;
    }
  };

  const renderDiscountAndDocuments = () => {
    if (user.user_type === 'driver') {
      return (
        <div>
          <Badge bg="secondary" text="white" className="me-2">
            <i className="bi bi-car-front me-1"></i>
            Driver
          </Badge>
          {user.drivers_license_verified === 1 && (
            <Badge bg="success" className="me-2">
              <i className="bi bi-check-circle me-1"></i>
              License Verified
            </Badge>
          )}
          {user.drivers_license_verified === 0 && (
            <Badge bg="warning" text="dark" className="me-2">
              <i className="bi bi-clock me-1"></i>
              License Pending
            </Badge>
          )}
          {user.drivers_license_verified === -1 && (
            <Badge bg="danger" className="me-2">
              <i className="bi bi-x-circle me-1"></i>
              License Rejected
            </Badge>
          )}
        </div>
      );
    }

    return (
      <div>
        {getDiscountBadge(user)}
        {user.discount_document_name && (
          <div className="mt-1">
            <small className="text-muted">
              <i className="bi bi-file-earmark-text me-1"></i>
              {user.discount_document_name}
            </small>
          </div>
        )}
      </div>
    );
  };

  const renderStatus = () => {
    if (user.is_verified) {
      return <Badge bg="success">Verified</Badge>;
    } else {
      return <Badge bg="warning" text="dark">Unverified</Badge>;
    }
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
      <td>{renderDiscountAndDocuments()}</td>
      <td>
        <div className="text-center">
          {renderStatus()}
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
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => onUserAction(user, 'view')}
            title="View details"
          >
            <i className="bi bi-eye"></i>
          </Button>
          <Button
            variant="outline-warning"
            size="sm"
            onClick={() => onUserAction(user, 'edit')}
            title="Edit user"
          >
            <i className="bi bi-pencil"></i>
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => onUserAction(user, 'delete')}
            title="Delete user"
          >
            <i className="bi bi-trash"></i>
          </Button>
        </div>
      </td>
    </tr>
  );
};

export default AllUsersTableRow;
