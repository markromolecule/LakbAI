import React from 'react';
import { Badge, Button, Dropdown } from 'react-bootstrap';

const AllUsersTableRow = ({ user, onUserAction }) => {


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
