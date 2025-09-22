import React, { useState } from 'react';
import { Modal, Button, Row, Col, Badge, Alert, Form, ButtonGroup } from 'react-bootstrap';

const DocumentViewerModal = ({ 
  show, 
  onHide, 
  document, 
  onApprove, 
  onReject 
}) => {
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [imageError, setImageError] = useState(false);
  
  if (!document) return null;

  const predefinedReasons = [
    'Document is not clear/readable',
    'Document appears to be expired',
    'Document type does not match application',
    'Invalid or fake document',
    'Missing required information',
    'Other (please specify)'
  ];

  const handleReject = () => {
    if (selectedReason || rejectionReason.trim()) {
      const reason = selectedReason === 'Other (please specify)' ? rejectionReason : selectedReason;
      onReject(reason);
      setShowRejectionForm(false);
      setRejectionReason('');
      setSelectedReason('');
    }
  };

  const getDocumentUrl = () => {
    if (!document.path) return null;
    // Use the API endpoint for document serving
    return `http://localhost/LakbAI/LakbAI-API/api/document/${document.path}`;
  };

  const isImageDocument = (filename) => {
    if (!filename) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-file-earmark-text me-2"></i>
          Review Document
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="mb-3">
          <Col md={6}>
            <strong>User:</strong> {document.user}
          </Col>
          <Col md={6}>
            <strong>Document Type:</strong> 
            <Badge bg="warning" text="dark" className="ms-2">
              {document.type} - Pending
            </Badge>
          </Col>
        </Row>
        
        <Row className="mb-3">
          <Col md={6}>
            <strong>Document Name:</strong> {document.name}
          </Col>
          <Col md={6}>
            <strong>File Path:</strong> 
            <code className="ms-2">{document.path || 'Not specified'}</code>
          </Col>
        </Row>

        <div className="border rounded p-4 bg-light">
          {document.path ? (
            <>
              {/* Document Preview */}
              <div className="text-center mb-4">
                {isImageDocument(document.name) ? (
                  <div>
                    <img 
                      src={getDocumentUrl()} 
                      alt={document.name}
                      className="img-fluid rounded border"
                      style={{ maxHeight: '400px', maxWidth: '100%' }}
                      onError={() => setImageError(true)}
                      onLoad={() => setImageError(false)}
                    />
                    {imageError && (
                      <div className="mt-2">
                        <i className="bi bi-exclamation-triangle text-warning"></i>
                        <small className="text-muted d-block">Unable to load image preview</small>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <i className="bi bi-file-earmark-pdf display-1 text-primary mb-3"></i>
                    <h5 className="text-muted">PDF Document</h5>
                    <p className="text-muted">
                      File: <code>{document.name}</code>
                    </p>
                  </div>
                )}
              </div>
              
              <Alert variant="info">
                <strong>Review Instructions:</strong> This document was submitted to verify the user's eligibility for {document.type} discount.
                <ul className="mb-0 mt-2">
                  <li><strong>PWD:</strong> Check for valid PWD ID or certificate with photo</li>
                  <li><strong>Senior Citizen:</strong> Verify age (60+) and senior citizen ID</li>
                  <li><strong>Student:</strong> Confirm current school enrollment and valid student ID</li>
                </ul>
              </Alert>

              <div className="text-center mt-3">
                <ButtonGroup>
                  <Button 
                    variant="primary" 
                    onClick={() => {
                      window.open(getDocumentUrl(), '_blank');
                    }}
                  >
                    <i className="bi bi-download me-1"></i>
                    Download
                  </Button>
                  <Button 
                    variant="outline-primary"
                    onClick={() => {
                      window.open(getDocumentUrl(), '_blank');
                    }}
                  >
                    <i className="bi bi-zoom-in me-1"></i>
                    Full Size
                  </Button>
                </ButtonGroup>
              </div>
            </>
          ) : (
            <div className="text-center">
              <i className="bi bi-exclamation-triangle display-1 text-warning mb-3"></i>
              <h5 className="text-warning">Document Not Accessible</h5>
              <p className="text-muted mb-3">
                The document file path is not available or the file may have been moved/deleted.
              </p>
              
              <Alert variant="warning">
                <strong>Document Status:</strong> This user has applied for a discount but the supporting document may not be accessible.
                <br />
                <strong>Recommendation:</strong> Contact the user to resubmit the document or proceed with manual verification.
              </Alert>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-4 pt-3 border-top">
          <h6>Quick Actions:</h6>
          
          {!showRejectionForm ? (
            <div className="d-flex gap-2">
              <Button variant="success" onClick={onApprove}>
                <i className="bi bi-check-circle me-1"></i>
                Approve Application
              </Button>
              <Button variant="danger" onClick={() => setShowRejectionForm(true)}>
                <i className="bi bi-x-circle me-1"></i>
                Reject Application
              </Button>
            </div>
          ) : (
            <div className="border rounded p-3 bg-light">
              <h6 className="text-danger">
                <i className="bi bi-exclamation-triangle me-1"></i>
                Rejection Reason Required
              </h6>
              
              <Form.Group className="mb-3">
                <Form.Label>Select a reason for rejection:</Form.Label>
                <Form.Select 
                  value={selectedReason} 
                  onChange={(e) => setSelectedReason(e.target.value)}
                >
                  <option value="">Choose a reason...</option>
                  {predefinedReasons.map((reason, index) => (
                    <option key={index} value={reason}>{reason}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              {selectedReason === 'Other (please specify)' && (
                <Form.Group className="mb-3">
                  <Form.Label>Specify reason:</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Please provide a detailed reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </Form.Group>
              )}

              <div className="d-flex gap-2">
                <Button 
                  variant="danger" 
                  onClick={handleReject}
                  disabled={!selectedReason || (selectedReason === 'Other (please specify)' && !rejectionReason.trim())}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  Confirm Rejection
                </Button>
                <Button 
                  variant="outline-secondary" 
                  onClick={() => {
                    setShowRejectionForm(false);
                    setSelectedReason('');
                    setRejectionReason('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DocumentViewerModal;
