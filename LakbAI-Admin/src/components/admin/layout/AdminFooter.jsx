import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const AdminFooter = () => {
  return (
    <footer className="admin-footer text-white py-2 py-md-3 mt-auto">
      <Container fluid className="px-0">
        <Row className="align-items-center">
          {/* Mobile: Stacked layout */}
          <Col xs={12} className="d-md-none text-center">
            <div className="mb-1">
              <span className="fw-bold fs-6">LakbAI Admin</span>
            </div>
            <div className="d-flex justify-content-center align-items-center gap-2 small opacity-75">
              <span>© 2024</span>
              <span>•</span>
              <span>v1.0.0</span>
            </div>
          </Col>

          {/* Desktop: Side by side layout */}
          <Col md={8} className="d-none d-md-block">
            <div className="d-flex align-items-center">
              <span className="fw-bold me-2">LakbAI Admin Dashboard</span>
              <span className="opacity-75 fs-6">© 2024 All rights reserved</span>
            </div>
          </Col>

          <Col md={4} className="d-none d-md-block">
            <div className="d-flex justify-content-end align-items-center gap-3">
              <small className="opacity-75 d-flex align-items-center">
                <i className="bi bi-code-square me-1"></i>
                Version 1.0.0
              </small>
              <small className="opacity-75 d-flex align-items-center">
                <i className="bi bi-envelope me-2" style={{ lineHeight: '1', fontSize: '0.875rem' }}></i>
                <span style={{ lineHeight: '1', fontSize: '0.875rem' }}>
                  <a href="mailto:admin@lakbai.com" className="text-white text-decoration-none">
                    Support
                  </a>
                </span>
              </small>
            </div>
          </Col>
        </Row>

        {/* Additional mobile info */}
        <Row className="d-md-none mt-2">
          <Col xs={12} className="text-center">
            <small className="opacity-75">
              <a href="mailto:admin@lakbai.com" className="text-white text-decoration-none">
                admin@lakbai.com
              </a>
            </small>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default AdminFooter;