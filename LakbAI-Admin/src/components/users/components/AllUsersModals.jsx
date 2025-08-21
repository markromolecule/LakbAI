import React from 'react';
import { Modal, Button, Row, Col, Badge, Alert } from 'react-bootstrap';
import UserModal from '../UserModal';

const AllUsersModals = ({
  showUserModal,
  onHideUserModal,
  selectedUser,
  modalMode,
  onSaveUser,
  showDeleteModal,
  onHideDeleteModal,
  userToDelete,
  onConfirmDelete,
  showDocumentModal,
  onHideDocumentModal,
  selectedDocument
}) => {
  return (
    <>
      {/* User Modal */}
      <UserModal
        show={showUserModal}
        onHide={onHideUserModal}
        user={selectedUser}
        mode={modalMode}
        onSave={onSaveUser}
      />

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={onHideDeleteModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {userToDelete && (
            <p>
              Are you sure you want to delete{' '}
              <strong>{userToDelete.first_name} {userToDelete.last_name}</strong>?
              This action cannot be undone.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHideDeleteModal}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirmDelete}>
            Delete User
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Document Viewer Modal */}
      <Modal show={showDocumentModal} onHide={onHideDocumentModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-file-earmark-text me-2"></i>
            Discount Document
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDocument && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>User:</strong> {selectedDocument.user}
                </Col>
                <Col md={6}>
                  <strong>Discount Type:</strong> 
                  <Badge bg="info" className="ms-2">{selectedDocument.type}</Badge>
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col>
                  <strong>Document Name:</strong> {selectedDocument.name}
                </Col>
              </Row>

              <div className="border rounded p-4 bg-light text-center">
                <i className="bi bi-file-earmark-image display-1 text-muted mb-3"></i>
                <h5 className="text-muted">Document Preview</h5>
                <p className="text-muted mb-3">
                  File: <code>{selectedDocument.name}</code>
                </p>
                
                <Alert variant="info">
                  <strong>Implementation Note:</strong> In a production system, this would display the actual uploaded document. 
                  You would need to:
                  <ul className="mb-0 mt-2 text-start">
                    <li>Store documents in a secure file directory</li>
                    <li>Implement proper file serving endpoints</li>
                    <li>Add image/PDF viewers</li>
                    <li>Include download functionality</li>
                  </ul>
                </Alert>

                <div className="mt-3">
                  <Button variant="primary" className="me-2">
                    <i className="bi bi-download me-1"></i>
                    Download Document
                  </Button>
                  <Button variant="outline-primary">
                    <i className="bi bi-zoom-in me-1"></i>
                    View Full Size
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHideDocumentModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AllUsersModals;
