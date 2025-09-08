import React from 'react';
import { Container, Navbar, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import styles from './Header.module.css';

const Header = () => {
  return (
    <Navbar bg="white" expand="lg" className={`${styles.customHeader} ${styles.fixedHeader} shadow-sm py-2`}>
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
            <Nav.Link href="#how-it-works" className={`${styles.navLinkCustom} me-4`}>
              <i className="bi bi-play-circle me-1"></i>
              How It Works
            </Nav.Link>
            <Nav.Link href="#route-section" className={`${styles.navLinkCustom}`}>
              <i className="bi bi-signpost-2 me-1"></i>
              Route
            </Nav.Link>
            <Nav.Link href="#about" className={`${styles.navLinkCustom} me-4`}>
              <i className="bi bi-info-circle me-1"></i>
              About Us
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
