import React from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

const AllUsersToast = ({ toast, onClose }) => {
  return (
    <ToastContainer position="bottom-end" className="p-3">
      <Toast
        show={toast.show}
        onClose={onClose}
        bg={toast.variant}
        delay={3000}
        autohide
      >
        <Toast.Body className="text-white">
          {toast.message}
        </Toast.Body>
      </Toast>
    </ToastContainer>
  );
};

export default AllUsersToast;
