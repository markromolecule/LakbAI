import React from 'react';
import { Container, Navbar, Nav, Button, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import styles from './Header.module.css';

const Header = () => {

  return (
    <Navbar bg="white" expand="lg" className={`${styles.customHeader} shadow-sm py-2 sticky-top`}>
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <img
            src="/image/logofinal.png"
            width="40"
            height="40"
            className="d-inline-block align-top me-2"
            alt="LakbAI Logo"
          />
          <span className={`${styles.brandText} fw-bold text-primary`}>LakbAI</span>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className={`${styles.navRight} ms-auto`}>
            <Nav.Link href="#biyabot" className={`${styles.navLinkCustom} me-4`}>
              <i className="bi bi-robot me-1"></i>
              BiyaBot
            </Nav.Link>
            <Nav.Link href="#about" className={`${styles.navLinkCustom} me-4`}>
              <i className="bi bi-info-circle me-1"></i>
              About Us
            </Nav.Link>
            
            {/* Profile as navigation link for mobile */}
            <Nav.Link href="#profile" className={`${styles.navLinkCustom} d-lg-none`}>
              <i className="bi bi-person-fill me-1"></i>
              Profile
            </Nav.Link>
            

          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
