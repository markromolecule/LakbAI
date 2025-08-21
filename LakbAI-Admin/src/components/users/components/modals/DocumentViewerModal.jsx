import React from 'react';
import { Modal, Button, Row, Col, Badge, Alert } from 'react-bootstrap';

const DocumentViewerModal = ({ 
  show, 
  onHide, 
  document, 
  onApprove, 
  onReject 
}) => {
  if (!document) return null;

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

        <div className="border rounded p-4 bg-light text-center">
          {document.path ? (
            <>
              <i className="bi bi-file-earmark-image display-1 text-muted mb-3"></i>
              <h5 className="text-muted">Document Preview</h5>
              <p className="text-muted mb-3">
                File: <code>{document.name}</code>
              </p>
              
              <Alert variant="info">
                <strong>Review Instructions:</strong> This document was submitted to verify the user's eligibility for {document.type} discount.
                <ul className="mb-0 mt-2 text-start">
                  <li><strong>PWD:</strong> Check for valid PWD ID or certificate</li>
                  <li><strong>Senior Citizen:</strong> Verify age and senior citizen ID</li>
                  <li><strong>Student:</strong> Confirm school enrollment and valid student ID</li>
                </ul>
              </Alert>

              <div className="mt-3">
                <Button 
                  variant="primary" 
                  className="me-2"
                  onClick={() => {
                    if (document.path) {
                      window.open(`/api/documents/${document.path}`, '_blank');
                    }
                  }}
                >
                  <i className="bi bi-download me-1"></i>
                  Download Document
                </Button>
                <Button 
                  variant="outline-primary"
                  onClick={() => {
                    if (document.path) {
                      window.open(`/api/documents/${document.path}`, '_blank');
                    }
                  }}
                >
                  <i className="bi bi-zoom-in me-1"></i>
                  View Full Size
                </Button>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-4 pt-3 border-top">
          <h6>Quick Actions:</h6>
          <div className="d-flex gap-2">
            <Button variant="success" onClick={onApprove}>
              <i className="bi bi-check-circle me-1"></i>
              Approve Application
            </Button>
            <Button variant="danger" onClick={onReject}>
              <i className="bi bi-x-circle me-1"></i>
              Reject Application
            </Button>
          </div>
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
