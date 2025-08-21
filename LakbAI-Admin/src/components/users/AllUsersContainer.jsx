import React, { useState } from 'react';
import { Card, Spinner, Alert } from 'react-bootstrap';
import UserService from '../../services/userService';
import AllUsersTable from './components/tables/AllUsersTable';
import AllUsersHeader from './components/AllUsersHeader';
import AllUsersPagination from './components/AllUsersPagination';
import AllUsersEmptyState from './components/AllUsersEmptyState';
import AllUsersModals from './components/AllUsersModals';
import AllUsersToast from './components/AllUsersToast';
import { useUsers } from './hooks/useUsers';

const AllUsersContainer = ({ userType = null, onDataUpdate }) => {
  const {
    users,
    loading,
    error,
    currentPage,
    pagination,
    filters,
    loadUsers,
    handleFilterChange,
    handlePageChange
  } = useUsers(userType, onDataUpdate);
  
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalMode, setModalMode] = useState('view');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });

  const handleUserAction = (user, action) => {
    setSelectedUser(user);
    setModalMode(action);
    setShowUserModal(true);
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setModalMode('create');
    setShowUserModal(true);
  };

  const handleSaveUser = async (userData) => {
    try {
      let result;
      if (modalMode === 'create') {
        result = await UserService.createUser(userData);
      } else {
        result = await UserService.updateUser(selectedUser.id, userData);
      }

      if (result.success) {
        setToast({
          show: true,
          message: result.message || `User ${modalMode === 'create' ? 'created' : 'updated'} successfully`,
          variant: 'success'
        });
        
        setShowUserModal(false);
        loadUsers();
        if (onDataUpdate) onDataUpdate();
      } else {
        setToast({
          show: true,
          message: result.error || `Failed to ${modalMode} user`,
          variant: 'danger'
        });
      }
    } catch (error) {
      console.error(`Error ${modalMode} user:`, error);
      setToast({
        show: true,
        message: `Failed to ${modalMode} user`,
        variant: 'danger'
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const result = await UserService.deleteUser(userToDelete.id);

      if (result.success) {
        setToast({
          show: true,
          message: 'User deleted successfully',
          variant: 'success'
        });
        
        setShowDeleteModal(false);
        setUserToDelete(null);
        loadUsers();
        if (onDataUpdate) onDataUpdate();
      } else {
        setToast({
          show: true,
          message: result.error || 'Failed to delete user',
          variant: 'danger'
        });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setToast({
        show: true,
        message: 'Failed to delete user',
        variant: 'danger'
      });
    }
  };

  const handleViewDocument = (user) => {
    if (user.discount_document_name) {
      setSelectedDocument({
        name: user.discount_document_name,
        type: user.discount_type,
        user: `${user.first_name} ${user.last_name}`,
        path: user.discount_document_path || null
      });
      setShowDocumentModal(true);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" className="me-2" />
        Loading users...
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <i className="bi bi-exclamation-triangle me-2"></i>
        {error}
        <button 
          className="btn btn-outline-danger btn-sm ms-2"
          onClick={loadUsers}
        >
          Retry
        </button>
      </Alert>
    );
  }

  return (
    <div>
      <AllUsersHeader
        userType={userType}
        pagination={pagination}
        users={users}
        onCreateUser={handleCreateUser}
        onFilterChange={handleFilterChange}
        onRefresh={loadUsers}
      />

      {users.length === 0 ? (
        <AllUsersEmptyState userType={userType} onCreateUser={handleCreateUser} />
      ) : (
        <>
          <Card className="border-0 shadow-sm">
            <div className="table-responsive">
              <AllUsersTable
                users={users}
                onUserAction={handleUserAction}
                onViewDocument={handleViewDocument}
              />
            </div>
          </Card>

          <AllUsersPagination
            currentPage={currentPage}
            totalPages={pagination.total_pages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      <AllUsersModals
        showUserModal={showUserModal}
        onHideUserModal={() => setShowUserModal(false)}
        selectedUser={selectedUser}
        modalMode={modalMode}
        onSaveUser={handleSaveUser}
        showDeleteModal={showDeleteModal}
        onHideDeleteModal={() => setShowDeleteModal(false)}
        userToDelete={userToDelete}
        onConfirmDelete={handleDeleteUser}
        showDocumentModal={showDocumentModal}
        onHideDocumentModal={() => setShowDocumentModal(false)}
        selectedDocument={selectedDocument}
      />

      <AllUsersToast
        toast={toast}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
};

export default AllUsersContainer;
