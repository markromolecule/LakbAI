import React from 'react';
import { Row, Col, Button, Dropdown } from 'react-bootstrap';

const AllUsersHeader = ({ 
  userType, 
  pagination, 
  users, 
  onCreateUser, 
  onFilterChange, 
  onRefresh 
}) => {
  return (
    <Row className="mb-3">
      <Col md={6}>
        <h5 className="mb-0">
          <i className="bi bi-people me-2"></i>
          {userType ? `${userType.charAt(0).toUpperCase() + userType.slice(1)}s` : 'All Users'}
          <span className="text-muted ms-2">({pagination.total || users.length})</span>
        </h5>
      </Col>
      
      <Col md={6}>
        <div className="d-flex gap-2 justify-content-end">
          <Button 
            variant="primary" 
            size="sm"
            onClick={onCreateUser}
          >
            <i className="bi bi-plus me-1"></i>
            Add User
          </Button>
          
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              <i className="bi bi-funnel me-1"></i>
              Filter
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.ItemText>Discount Status</Dropdown.ItemText>
              <Dropdown.Item onClick={() => onFilterChange('discountStatus', '')}>
                All
              </Dropdown.Item>
              <Dropdown.Item onClick={() => onFilterChange('discountStatus', 'pending')}>
                Pending
              </Dropdown.Item>
              <Dropdown.Item onClick={() => onFilterChange('discountStatus', 'approved')}>
                Approved
              </Dropdown.Item>
              <Dropdown.Item onClick={() => onFilterChange('discountStatus', 'none')}>
                No Discount
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <Button
            variant="outline-secondary"
            size="sm"
            onClick={onRefresh}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            Refresh
          </Button>
        </div>
      </Col>
    </Row>
  );
};

export default AllUsersHeader;
