import React, { useState } from 'react';
import { Navbar, Nav, Container, Button, Dropdown, Collapse } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const AdminHeader = () => {
  const [showMobileNav, setShowMobileNav] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { path: '/admin/jeepneys', label: 'Jeepneys', icon: 'bi-truck' },
    { path: '/admin/users', label: 'Users', icon: 'bi-people' },
    { path: '/admin/fare-matrix', label: 'Fare Matrix', icon: 'bi-calculator' },
    { path: '/admin/checkpoints', label: 'Checkpoints', icon: 'bi-geo-alt' }
  ];

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminEmail');
    navigate('/login');
  };

  const userEmail = localStorage.getItem('adminEmail') || 'Admin';

  return (
    <Navbar bg="white" expand="lg" className="admin-header shadow-sm sticky-top">
      <Container fluid className="px-0 py-1 py-md-2">
        <div className="d-flex align-items-center justify-content-between w-100">
          
          {/* Left side - Logo/Brand and Mobile Menu */}
          <div className="d-flex align-items-center">
            <div className="d-flex align-items-center me-3">
              <img 
                src="/image/logofinal.png" 
                alt="LakbAI Logo" 
                className="me-2"
                style={{ height: '40px', width: 'auto' }}
              />
              <span className="fw-bold text-dark fs-5 d-none d-sm-inline">
                LakbAI
              </span>
            </div>
            
            {/* Mobile menu toggle - Hidden on web, visible on mobile */}
            <Button 
              variant="link" 
              className="p-2 text-dark menu-toggle d-lg-none border-0 shadow-none"
              onClick={() => setShowMobileNav(!showMobileNav)}
              aria-expanded={showMobileNav}
              aria-controls="mobile-navigation"
            >
              <i className={`bi ${showMobileNav ? 'bi-x-lg' : 'bi-list'} fs-5`}></i>
            </Button>
          </div>

          {/* Center - Navigation Pills (Desktop) */}
          <div className="d-none d-lg-flex justify-content-center flex-grow-1">
            <Nav variant="pills" className="admin-nav-pills">
              {navItems.map((item) => (
                <Nav.Item key={item.path}>
                  <Nav.Link
                    as={Link}
                    to={item.path}
                    active={location.pathname === item.path}
                    className="d-flex align-items-center"
                  >
                    <i className={`bi ${item.icon} me-1 d-none d-xl-inline`}></i>
                    {item.label}
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>
          </div>

          {/* Right side - User menu */}
          <div className="d-flex align-items-center">
            <Dropdown align="end">
              <Dropdown.Toggle
                variant="link"
                className="text-decoration-none d-flex align-items-center p-2 border-0"
                id="user-dropdown"
                bsPrefix="btn"
              >
                <div className="user-avatar me-2">
                  <i className="bi bi-person-circle fs-4 text-primary"></i>
                </div>
                <div className="d-none d-sm-block text-start me-1">
                  <div className="fw-semibold text-dark" style={{fontSize: '0.75rem', lineHeight: '1.1'}}>
                    {userEmail.length > 15 ? userEmail.substring(0, 15) + '...' : userEmail}
                  </div>
                  <div className="text-muted" style={{fontSize: '0.65rem', lineHeight: '1.1'}}>
                    Administrator
                  </div>
                </div>
                <i className="bi bi-chevron-down text-muted small"></i>
              </Dropdown.Toggle>

              <Dropdown.Menu className="user-dropdown-menu shadow">
                <Dropdown.Header className="py-2">
                  <div className="fw-semibold text-truncate">{userEmail}</div>
                  <small className="text-muted">Administrator</small>
                </Dropdown.Header>
                <Dropdown.Divider className="my-1" />
                <Dropdown.Item href="#profile" className="py-2">
                  <i className="bi bi-person me-2"></i>
                  Profile Settings
                </Dropdown.Item>
                <Dropdown.Item href="#preferences" className="py-2">
                  <i className="bi bi-gear me-2"></i>
                  Preferences
                </Dropdown.Item>
                <Dropdown.Divider className="my-1" />
                <Dropdown.Item onClick={handleLogout} className="text-danger py-2">
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        {/* Mobile Navigation */}
        <Collapse in={showMobileNav} className="d-lg-none">
          <div id="mobile-navigation" className="mobile-nav-wrapper">
            <div className="mobile-nav mt-3 pt-3 border-top">
              <Nav className="flex-column">
                {navItems.map((item) => (
                  <Nav.Item key={item.path} className="mb-1">
                    <Nav.Link
                      as={Link}
                      to={item.path}
                      active={location.pathname === item.path}
                      className="d-flex align-items-center py-3 px-3 rounded mobile-nav-link"
                      onClick={() => setShowMobileNav(false)}
                    >
                      <i className={`bi ${item.icon} me-3 text-primary fs-5`}></i>
                      <span className="fw-medium">{item.label}</span>
                    </Nav.Link>
                  </Nav.Item>
                ))}
              </Nav>
            </div>
          </div>
        </Collapse>
      </Container>
    </Navbar>
  );
};

export default AdminHeader;