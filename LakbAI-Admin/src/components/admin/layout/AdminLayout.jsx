import React from 'react';
import { Container } from 'react-bootstrap';
import AdminHeader from './AdminHeader';
import AdminFooter from './AdminFooter';

const AdminLayout = ({ children, title, subtitle }) => {
  return (
    <div className="admin-layout min-vh-100 d-flex flex-column">
      <AdminHeader />
      <main className="flex-grow-1">
        <Container fluid className="main-content px-0" style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div className="content-padding px-3 px-sm-4 px-lg-5 py-3 py-md-4">
            {(title || subtitle) && (
              <div className="mb-3 mb-md-4">
                {title && (
                  <h1 className="fw-bold mb-1 text-dark fs-3 fs-md-2">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-muted mb-0 fs-6 fs-md-5">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
            <div className="content-wrapper">
              {children}
            </div>
          </div>
        </Container>
      </main>
      <AdminFooter />
    </div>
  );
};

export default AdminLayout;