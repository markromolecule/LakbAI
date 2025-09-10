import React, { useState } from 'react';
import { Card, Button, ButtonGroup, Spinner, Alert } from 'react-bootstrap';
import UserService from '../../services/userService';
import PendingUsersTable from './components/tables/PendingUsersTable';
import ConfirmationModal from './components/modals/ConfirmationModal';
import DocumentViewerModal from './components/modals/DocumentViewerModal';
import DiscountDocumentViewer from './components/DiscountDocumentViewer';
import DiscountReviewModal from './components/DiscountReviewModal';
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
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [selectedDiscountUser, setSelectedDiscountUser] = useState(null);
  const [showDiscountReview, setShowDiscountReview] = useState(false);
  const [selectedReviewUser, setSelectedReviewUser] = useState(null);

  const handleApprovalAction = (user, approved) => {
    setActionData({ user, approved, type: 'discount' });
    setShowConfirmModal(true);
  };

  const handleDriverLicenseApproval = (user, approved) => {
    setActionData({ user, approved, type: 'license' });
    setShowConfirmModal(true);
  };

  const handleViewDocument = (user) => {
    if (user.user_type === 'driver' && user.drivers_license_name) {
      // For drivers, use the simple document viewer
      setSelectedDocument({
        name: user.drivers_license_name,
        type: 'Driver\'s License',
        user: `${user.first_name} ${user.last_name}`,
        userId: user.id,
        path: user.drivers_license_path || null
      });
      setShowDocumentModal(true);
    } else if (user.user_type === 'passenger' && (user.discount_applied || user.discount_type)) {
      // For passengers with discount applications, show enhanced discount review modal
      setSelectedReviewUser(user);
      setShowDiscountReview(true);
    }
  };

  const confirmAction = async () => {
    if (!actionData) return;
    
    try {
      let result;
      if (actionData.type === 'license') {
        result = await UserService.approveDriverLicense(actionData.user.id, actionData.approved);
      } else {
        result = await UserService.approveDiscount(
          actionData.user.id, 
          actionData.approved, 
          actionData.rejectionReason || null
        );
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

  const handleDiscountStatusUpdate = async (status) => {
    // Refresh the pending users list after discount status update
    await loadPendingUsers();
    if (onDataUpdate) onDataUpdate();
  };

  const handleDiscountReviewUpdate = async (status) => {
    // Refresh the pending users list after discount review
    await loadPendingUsers();
    if (onDataUpdate) onDataUpdate();
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
          <p className="text-muted mb-0">All account verification applications have been processed.</p>
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
            Account Verification & Approval
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
        title={`${actionData?.approved ? 'Approve' : 'Reject'} Account`}
        message={
          actionData ? 
          `Are you sure you want to ${actionData.approved ? 'approve' : 'reject'} the account for ${actionData.user.first_name} ${actionData.user.last_name}? ${
            actionData.type === 'license' 
              ? 'This will verify their driver\'s license and activate their account.' 
              : `This will ${actionData.approved ? 'approve their discount application and activate' : 'reject their discount application and deactivate'} their account.`
          }` : ''
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
          if (user) handleDriverLicenseApproval(user, true);
        }}
        onReject={(rejectionReason) => {
          setShowDocumentModal(false);
          const user = currentUsers.find(u => u.id === selectedDocument.userId);
          if (user) {
            setActionData({ user, approved: false, type: 'license', rejectionReason });
            setShowConfirmModal(true);
          }
        }}
      />

      <DiscountDocumentViewer
        show={showDiscountModal}
        onHide={() => setShowDiscountModal(false)}
        user={selectedDiscountUser}
        onStatusUpdate={handleDiscountStatusUpdate}
      />

      <DiscountReviewModal
        show={showDiscountReview}
        onHide={() => setShowDiscountReview(false)}
        user={selectedReviewUser}
        onStatusUpdate={handleDiscountReviewUpdate}
      />
    </div>
  );
};

export default PendingUsersContainer;
