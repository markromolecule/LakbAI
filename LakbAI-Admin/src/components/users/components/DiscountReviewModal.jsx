import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Card, Badge, Row, Col, Form, InputGroup } from 'react-bootstrap';
import UserService from '../../../services/userService';
import { API_CONFIG } from '../../../config/apiConfig';
import './UserModal.css';

const DiscountReviewModal = ({ show, onHide, user, onStatusUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [discountAmount, setDiscountAmount] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (show && user?.id) {
      fetchUserDetails();
    }
  }, [show, user]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL.replace('/routes/api.php', '');
      const response = await fetch(`${baseUrl}/api/admin/users/${user.id}/review`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setUserDetails(data.data);
        // Set default discount percentage based on type
        if (data.data && data.data.discount && data.data.discount.type) {
          const defaultPercentages = {
            'Senior Citizen': '30',
            'PWD': '20',
            'Student': '20'
          };
          setDiscountAmount(defaultPercentages[data.data.discount.type] || '20');
        }
      } else {
        alert('Error: Failed to load user details - ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      alert('Error: Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    // Discount percentage is automatically determined by user type - no validation needed
    setActionLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL.replace('/routes/api.php', '')}/api/users/${user.id}/discount`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'approved',
          discount_amount: parseFloat(discountAmount) // Static percentage based on type
        }),
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        alert('Success: Discount application approved successfully');
        onStatusUpdate('approved');
        onHide();
      } else {
        alert('Error: ' + (data.message || 'Failed to approve discount'));
      }
    } catch (error) {
      console.error('Error approving discount:', error);
      alert('Error: Failed to approve discount');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Rejection Reason Required: Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL.replace('/routes/api.php', '')}/api/users/${user.id}/discount`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'rejected',
          rejection_reason: rejectionReason
        }),
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        alert('Success: Discount application rejected');
        onStatusUpdate('rejected');
        onHide();
      } else {
        alert('Error: ' + (data.message || 'Failed to reject discount'));
      }
    } catch (error) {
      console.error('Error rejecting discount:', error);
      alert('Error: Failed to reject discount');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDocument = () => {
    if (userDetails?.discount?.file_path) {
      const documentUrl = UserService.getDiscountDocumentUrl(userDetails.discount.file_path);
      window.open(documentUrl, '_blank');
    } else {
      alert('No document available to view');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status?.toUpperCase()}</Badge>;
  };

  const getDiscountTypeIcon = (type) => {
    const icons = {
      'Senior Citizen': '👴',
      'PWD': '♿',
      'Student': '🎓'
    };
    return icons[type] || '💳';
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" className="user-modal">
      <Modal.Header closeButton className="bg-primary text-white">
        <div className="d-flex align-items-center">
          <div className="rounded-circle bg-white d-flex align-items-center justify-content-center me-3">
            <i className="bi bi-card-checklist text-primary"></i>
          </div>
          <Modal.Title>Discount Application Review</Modal.Title>
        </div>
      </Modal.Header>

      <Modal.Body>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status" className="me-2" />
            <span>Loading user details...</span>
          </div>
        ) : userDetails ? (
          <Row>
            {/* User Information */}
            <Col md={6}>
              <Card className="h-100">
                <Card.Header className="bg-light">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center me-2">
                      <i className="bi bi-person text-primary"></i>
                    </div>
                    <h6 className="mb-0">User Information</h6>
                  </div>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <strong>Name:</strong><br />
                    {userDetails.first_name} {userDetails.last_name}
                  </div>
                  <div className="mb-3">
                    <strong>Username:</strong><br />
                    {userDetails.username}
                  </div>
                  <div className="mb-3">
                    <strong>Email:</strong><br />
                    {userDetails.email}
                  </div>
                  <div className="mb-3">
                    <strong>Phone:</strong><br />
                    {userDetails.phone_number}
                  </div>
                  <div className="mb-3">
                    <strong>Address:</strong><br />
                    {userDetails.address.house_number} {userDetails.address.street_name}<br />
                    {userDetails.address.barangay}<br />
                    {userDetails.address.city_municipality}, {userDetails.address.province} {userDetails.address.postal_code}
                  </div>
                  <div className="mb-3">
                    <strong>Birthday:</strong><br />
                    {userDetails.birthday}
                  </div>
                  <div className="mb-3">
                    <strong>Gender:</strong><br />
                    {userDetails.gender}
                  </div>
                  <div className="mb-3">
                    <strong>Account Created:</strong><br />
                    {new Date(userDetails.created_at).toLocaleDateString()}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Discount Application */}
            <Col md={6}>
              <Card className="h-100">
                <Card.Header className="bg-light">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center me-2">
                      <i className="bi bi-percent text-success"></i>
                    </div>
                    <h6 className="mb-0">Discount Application</h6>
                  </div>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <strong>Discount Type:</strong><br />
                    <span className="fs-5 me-2">{getDiscountTypeIcon(userDetails.discount.type)}</span>
                    {userDetails.discount.type}
                  </div>
                  <div className="mb-3">
                    <strong>Current Status:</strong><br />
                    {getStatusBadge(userDetails.discount.status)}
                  </div>
                  
                  {userDetails.discount.file_path && (
                    <div className="mb-3">
                      <strong>Supporting Document:</strong><br />
                      <div className="d-flex align-items-center mt-2">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={handleViewDocument}
                          className="me-2"
                        >
                          <i className="bi bi-file-earmark-text me-1"></i>
                          View Document
                        </Button>
                        {userDetails.discount.file_name && (
                          <small className="text-muted">
                            {userDetails.discount.file_name}
                          </small>
                        )}
                      </div>
                      <small className="text-muted d-block mt-1">
                        Uploaded: {new Date(userDetails.updated_at).toLocaleDateString()}
                      </small>
                    </div>
                  )}

                  {userDetails.discount.status === 'pending' && (
                    <>
                      <hr />
                      <div className="mb-3">
                        <Form.Label><strong>Discount Percentage</strong></Form.Label>
                        <div className="d-flex align-items-center p-3 bg-light rounded">
                          <div className="me-3">
                            <i className="bi bi-percent text-primary fs-4"></i>
                          </div>
                          <div>
                            <div className="fw-bold fs-5 text-primary">{discountAmount}%</div>
                            <small className="text-muted">
                              Fixed rate for {userDetails.discount.type}
                            </small>
                          </div>
                        </div>
                        <Form.Text className="text-muted">
                          Discount percentages are automatically assigned based on user type
                        </Form.Text>
                      </div>

                      <div className="mb-3">
                        <Form.Label><strong>Rejection Reason (if rejecting)</strong></Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Enter reason for rejection (optional for approval)"
                        />
                      </div>
                    </>
                  )}

                  {userDetails.discount.amount && userDetails.discount.status === 'approved' && (
                    <div className="mb-3">
                      <strong>Approved Discount:</strong><br />
                      <span className="text-success fs-5">{userDetails.discount.amount}%</span> off regular fare
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        ) : (
          <div className="text-center py-5">
            <i className="bi bi-exclamation-triangle text-warning fs-1"></i>
            <p className="mt-3">Failed to load user details</p>
          </div>
        )}
      </Modal.Body>

      {userDetails?.discount?.status === 'pending' && (
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={actionLoading}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleReject} 
            disabled={actionLoading}
            className="me-2"
          >
            {actionLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              <>
                <i className="bi bi-x-circle me-1"></i>
                Reject Application
              </>
            )}
          </Button>
          <Button 
            variant="success" 
            onClick={handleApprove} 
            disabled={actionLoading}
          >
            {actionLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-1"></i>
                Approve Application
              </>
            )}
          </Button>
        </Modal.Footer>
      )}
    </Modal>
  );
};

export default DiscountReviewModal;
