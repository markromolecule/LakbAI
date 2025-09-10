import React, { useState } from 'react';
import { Modal, Button, Alert, Spinner, Card, Badge, Row, Col } from 'react-bootstrap';
import UserService from '../../../services/userService';
import './UserModal.css';

const DiscountDocumentViewer = ({ show, onHide, user, onStatusUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApprove = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await UserService.approveDiscount(user.id, true);
      if (result.success) {
        onStatusUpdate && onStatusUpdate('approved');
        onHide();
      } else {
        setError(result.error || 'Failed to approve discount');
      }
    } catch (err) {
      setError('Failed to approve discount');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await UserService.approveDiscount(user.id, false);
      if (result.success) {
        onStatusUpdate && onStatusUpdate('rejected');
        onHide();
      } else {
        setError(result.error || 'Failed to reject discount');
      }
    } catch (err) {
      setError('Failed to reject discount');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = () => {
    if (user.discount_file_path) {
      const documentUrl = UserService.getDiscountDocumentUrl(user.discount_file_path);
      window.open(documentUrl, '_blank');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'bg-warning',
      'approved': 'bg-success',
      'rejected': 'bg-danger'
    };
    return badges[status] || 'bg-secondary';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': 'bi-clock',
      'approved': 'bi-check-circle',
      'rejected': 'bi-x-circle'
    };
    return icons[status] || 'bi-question-circle';
  };

  if (!user) return null;

  return (
    <Modal show={show} onHide={onHide} size="xl" centered className="user-modal">
      <Modal.Header closeButton className="border-0 bg-gradient-primary text-white">
        <Modal.Title className="d-flex align-items-center">
          <div className="bg-white bg-opacity-20 rounded-circle me-3 d-flex align-items-center justify-content-center">
            <i className="bi bi-file-earmark-text text-white"></i>
          </div>
          <div>
            <h4 className="mb-0">Discount Application Review</h4>
            <small className="opacity-75">Review and approve/reject discount applications</small>
          </div>
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-0">
        {error && (
          <Alert variant="danger" className="m-4 mb-0">
            <div className="d-flex align-items-center">
              <i className="bi bi-exclamation-triangle me-2"></i>
              <div>
                <strong>Error:</strong> {error}
              </div>
            </div>
          </Alert>
        )}

        <div className="p-4">

        {/* User Information */}
        <Row className="mb-4">
          <Col md={6}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Header className="bg-primary text-white border-0">
                <div className="d-flex align-items-center">
                  <div className="bg-white bg-opacity-20 rounded-circle me-3">
                    <i className="bi bi-person text-white"></i>
                  </div>
                  <div>
                    <h6 className="mb-0">Applicant Information</h6>
                    <small className="opacity-75">User details and contact information</small>
                  </div>
                </div>
              </Card.Header>
              <Card.Body className="p-3">
                <div className="mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-person-circle text-primary me-2"></i>
                    <span className="fw-semibold">Full Name:</span>
                  </div>
                  <p className="mb-0 ms-4">{user.first_name} {user.last_name}</p>
                </div>
                <div className="mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-envelope text-primary me-2"></i>
                    <span className="fw-semibold">Email:</span>
                  </div>
                  <p className="mb-0 ms-4">{user.email}</p>
                </div>
                <div className="mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-telephone text-primary me-2"></i>
                    <span className="fw-semibold">Phone:</span>
                  </div>
                  <p className="mb-0 ms-4">{user.phone_number}</p>
                </div>
                <div>
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-people text-primary me-2"></i>
                    <span className="fw-semibold">User Type:</span>
                  </div>
                  <Badge bg="info" className="ms-4 px-3 py-1">
                    {user.user_type?.charAt(0).toUpperCase() + user.user_type?.slice(1)}
                  </Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Header className="bg-success text-white border-0">
                <div className="d-flex align-items-center">
                  <div className="bg-white bg-opacity-20 rounded-circle me-3">
                    <i className="bi bi-award text-white"></i>
                  </div>
                  <div>
                    <h6 className="mb-0">Discount Details</h6>
                    <small className="opacity-75">Application status and verification</small>
                  </div>
                </div>
              </Card.Header>
              <Card.Body className="p-3">
                <div className="mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-tag text-success me-2"></i>
                    <span className="fw-semibold">Discount Type:</span>
                  </div>
                  <Badge bg="primary" className="ms-4 px-3 py-1">
                    {user.discount_type}
                  </Badge>
                </div>
                <div className="mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-clock text-success me-2"></i>
                    <span className="fw-semibold">Status:</span>
                  </div>
                  <Badge bg={getStatusBadge(user.discount_status).replace('bg-', '')} className="ms-4 px-3 py-1">
                    <i className={`bi ${getStatusIcon(user.discount_status)} me-1`}></i>
                    {user.discount_status?.charAt(0).toUpperCase() + user.discount_status?.slice(1)}
                  </Badge>
                </div>
                <div className="mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-check-circle text-success me-2"></i>
                    <span className="fw-semibold">Applied:</span>
                  </div>
                  <Badge bg={user.discount_applied ? 'success' : 'secondary'} className="ms-4 px-3 py-1">
                    {user.discount_applied ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div>
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-shield-check text-success me-2"></i>
                    <span className="fw-semibold">Verified:</span>
                  </div>
                  <Badge bg={user.discount_verified ? 'success' : 'warning'} className="ms-4 px-3 py-1">
                    {user.discount_verified ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Document Section */}
        {user.discount_file_path ? (
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-warning text-dark border-0">
              <div className="d-flex align-items-center">
                <div className="bg-white bg-opacity-20 rounded-circle me-3">
                  <i className="bi bi-file-earmark text-dark"></i>
                </div>
                <div>
                  <h6 className="mb-0">Supporting Document</h6>
                  <small className="opacity-75">Uploaded verification document</small>
                </div>
              </div>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <div className="bg-danger bg-opacity-10 rounded-circle me-3">
                    <i className="bi bi-file-earmark-pdf text-danger"></i>
                  </div>
                  <div>
                    <h6 className="mb-1 fw-semibold">{user.discount_document_name || 'Document'}</h6>
                    <div className="d-flex align-items-center text-success">
                      <i className="bi bi-check-circle me-1"></i>
                      <small>Document uploaded successfully</small>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline-primary"
                  onClick={handleViewDocument}
                  className="px-3 py-2"
                >
                  <i className="bi bi-eye me-2"></i>
                  View Document
                </Button>
              </div>
            </Card.Body>
          </Card>
        ) : (
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Body className="p-4">
              <Alert variant="warning" className="mb-0">
                <div className="d-flex align-items-center">
                  <i className="bi bi-exclamation-triangle me-2 fs-4"></i>
                  <div>
                    <strong>No Document Uploaded</strong>
                    <div className="small">No supporting document was uploaded for this discount application.</div>
                  </div>
                </div>
              </Alert>
            </Card.Body>
          </Card>
        )}

        {/* Action Buttons */}
        {user.discount_status === 'pending' && (
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1 fw-semibold text-dark">Review Actions</h6>
                  <small className="text-muted">Approve or reject this discount application</small>
                </div>
                <div className="d-flex gap-3">
                  <Button
                    variant="outline-danger"
                    onClick={handleReject}
                    disabled={loading}
                    className="px-3 py-2"
                  >
                    {loading ? (
                      <Spinner size="sm" className="me-2" />
                    ) : (
                      <i className="bi bi-x-circle me-2"></i>
                    )}
                    Reject Application
                  </Button>
                  <Button
                    variant="success"
                    onClick={handleApprove}
                    disabled={loading}
                    className="px-3 py-2"
                  >
                    {loading ? (
                      <Spinner size="sm" className="me-2" />
                    ) : (
                      <i className="bi bi-check-circle me-2"></i>
                    )}
                    Approve Application
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        )}
        </div>
      </Modal.Body>

      <Modal.Footer className="border-0 bg-light">
        <div className="d-flex justify-content-between align-items-center w-100">
          <Button 
            variant="outline-secondary" 
            onClick={onHide}
            className="px-3 py-2"
            disabled={loading}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to List
          </Button>
          <small className="text-muted">
            <i className="bi bi-info-circle me-1"></i>
            Review all information before making a decision
          </small>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default DiscountDocumentViewer;
