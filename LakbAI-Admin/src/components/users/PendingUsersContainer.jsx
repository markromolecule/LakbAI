import React, { useState } from 'react';
import { Card, Button, ButtonGroup, Spinner, Alert } from 'react-bootstrap';
import UserService from '../../services/userService';
import PendingUsersTable from './components/tables/PendingUsersTable';
import ConfirmationModal from './components/modals/ConfirmationModal';
import DocumentViewerModal from './components/modals/DocumentViewerModal';
import { usePendingUsers } from './hooks/usePendingUsers';

const PendingUsersContainer = ({ onDataUpdate }) => {
  const {
    pendingUsers,
    allDiscountUsers,
    loading,
    processing,
    viewMode,
    setViewMode,
    loadPendingUsers,
    loadAllDiscountUsers
  } = usePendingUsers(onDataUpdate);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionData, setActionData] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const handleApprovalAction = (user, approved) => {
    setActionData({ user, approved, type: 'discount' });
    setShowConfirmModal(true);
  };

  const handleDriverLicenseApproval = (user, approved) => {
    setActionData({ user, approved, type: 'license' });
    setShowConfirmModal(true);
  };

  const handleViewDocument = (user) => {
    if (user.discount_document_name || user.drivers_license_name) {
      setSelectedDocument({
        name: user.discount_document_name || user.drivers_license_name,
        type: user.user_type === 'driver' ? 'Driver\'s License' : user.discount_type,
        user: `${user.first_name} ${user.last_name}`,
        userId: user.id,
        path: user.discount_document_path || user.drivers_license_path || null
      });
      setShowDocumentModal(true);
    }
  };

  const confirmAction = async () => {
    if (!actionData) return;
    
    try {
      let result;
      if (actionData.type === 'license') {
        result = await UserService.approveDriverLicense(actionData.user.id, actionData.approved);
      } else {
        result = await UserService.approveDiscount(actionData.user.id, actionData.approved);
      }

      if (result.success) {
        await loadPendingUsers();
        if (onDataUpdate) onDataUpdate();
      }
    } catch (error) {
      console.error('Error processing approval:', error);
    } finally {
      setShowConfirmModal(false);
      setActionData(null);
    }
  };

  const currentUsers = viewMode === 'pending' ? pendingUsers : allDiscountUsers;

  if (loading && pendingUsers.length === 0) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" className="text-primary" />
        <p className="mt-3 text-muted">Loading pending approvals...</p>
      </div>
    );
  }

  if (pendingUsers.length === 0) {
    return (
      <Card className="border-0 shadow-sm text-center py-5">
        <Card.Body>
          <i className="bi bi-check-circle display-1 text-success mb-3 opacity-50"></i>
          <h5 className="text-muted mb-2">No Pending Approvals</h5>
          <p className="text-muted mb-0">All discount applications have been processed.</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center gap-3">
          <h5 className="mb-0">
            <i className="bi bi-clock-history me-2"></i>
            Verification Applications
          </h5>
          
          <ButtonGroup size="sm">
            <Button
              variant={viewMode === 'pending' ? 'primary' : 'outline-primary'}
              onClick={() => setViewMode('pending')}
            >
              Pending ({pendingUsers.length})
            </Button>
            <Button
              variant={viewMode === 'all' ? 'primary' : 'outline-primary'}
              onClick={() => setViewMode('all')}
            >
              All ({allDiscountUsers.length})
            </Button>
          </ButtonGroup>
        </div>
        
        <Button 
          variant="outline-primary" 
          size="sm"
          onClick={viewMode === 'pending' ? loadPendingUsers : loadAllDiscountUsers}
        >
          <i className="bi bi-arrow-clockwise me-1"></i>
          Refresh
        </Button>
      </div>
      
      <Card className="border-0 shadow-sm">
        <div className="table-responsive">
          <PendingUsersTable
            users={currentUsers}
            processing={processing}
            onApprovalAction={handleApprovalAction}
            onDriverLicenseApproval={handleDriverLicenseApproval}
            onViewDocument={handleViewDocument}
          />
        </div>
      </Card>

      <ConfirmationModal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        title={`${actionData?.approved ? 'Approve' : 'Reject'} Application`}
        message={
          actionData ? 
          `Are you sure you want to ${actionData.approved ? 'approve' : 'reject'} the ${
            actionData.type === 'license' ? 'driver\'s license' : `${actionData.user.discount_type} discount application`
          } for ${actionData.user.first_name} ${actionData.user.last_name}?` : ''
        }
        confirmText={actionData?.approved ? 'Approve' : 'Reject'}
        variant={actionData?.approved ? 'success' : 'danger'}
        onConfirm={confirmAction}
      />

      <DocumentViewerModal
        show={showDocumentModal}
        onHide={() => setShowDocumentModal(false)}
        document={selectedDocument}
        onApprove={() => {
          setShowDocumentModal(false);
          const user = currentUsers.find(u => u.id === selectedDocument.userId);
          if (user) handleApprovalAction(user, true);
        }}
        onReject={() => {
          setShowDocumentModal(false);
          const user = currentUsers.find(u => u.id === selectedDocument.userId);
          if (user) handleApprovalAction(user, false);
        }}
      />
    </div>
  );
};

export default PendingUsersContainer;
