import React from 'react';
import { Container, Navbar, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import styles from './Header.module.css';

const Header = () => {
  return (
    <Navbar bg="white" expand="lg" className={`${styles.customHeader} shadow-sm py-3 sticky-top`}>
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <img
            src="/image/logofinal.png"
            width="50"
            height="50"
            className="d-inline-block align-top me-2"
            alt="LakbAI Logo"
          />
          <span className={`${styles.brandText} fw-bold text-primary`}>LakbAI</span>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto me-4">
            <Nav.Link href="#biyabot" className={`${styles.navLinkCustom} me-4`}>
              <i className="bi bi-robot me-1"></i>
              BiyaBot
            </Nav.Link>
            <Nav.Link href="#about" className={styles.navLinkCustom}>
              <i className="bi bi-info-circle me-1"></i>
              About Us
            </Nav.Link>
          </Nav>
          
          <div className={styles.userProfile}>
            <div className={`${styles.userAvatar} bg-primary rounded-circle d-flex align-items-center justify-content-center`}>
              <i className="bi bi-person-fill text-white"></i>
            </div>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
