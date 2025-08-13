import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.customFooter}>
      <Container>
        <Row className="py-5">
          {/* Brand Section */}
          <Col lg={4} md={6} className="mb-4">
            <div className={styles.footerBrand}>
              <div className="d-flex align-items-center mb-3">
                <img
                  src="/image/logofinal.png"
                  width="50"
                  height="50"
                  className="me-3"
                  alt="LakbAI Logo"
                />
                <h3 className="text-white mb-0 fw-bold">LakbAI</h3>
              </div>
              <p className="text-white-50 mb-3">
                A smarter way to ride. Student-led digital jeepney system 
                revolutionizing public transportation in Dasmariñas.
              </p>
              <div className={styles.socialLinks}>
                <Button variant="outline-light" size="sm" className={`me-2 ${styles.socialBtn}`}>
                  <i className="bi bi-facebook"></i>
                </Button>
                <Button variant="outline-light" size="sm" className={`me-2 ${styles.socialBtn}`}>
                  <i className="bi bi-twitter"></i>
                </Button>
                <Button variant="outline-light" size="sm" className={`me-2 ${styles.socialBtn}`}>
                  <i className="bi bi-instagram"></i>
                </Button>
                <Button variant="outline-light" size="sm" className={styles.socialBtn}>
                  <i className="bi bi-linkedin"></i>
                </Button>
              </div>
            </div>
          </Col>

          {/* Quick Links */}
          <Col lg={2} md={6} className="mb-4">
            <h5 className="text-white mb-3 fw-semibold">Quick Links</h5>
            <ul className={styles.footerLinks}>
              <li><a href="#home" className={styles.footerLink}>Home</a></li>
              <li><a href="#about" className={styles.footerLink}>About Us</a></li>
              <li><a href="#services" className={styles.footerLink}>Services</a></li>
              <li><a href="#routes" className={styles.footerLink}>Routes</a></li>
              <li><a href="#contact" className={styles.footerLink}>Contact</a></li>
            </ul>
          </Col>

          {/* Services */}
          <Col lg={3} md={6} className="mb-4">
            <h5 className="text-white mb-3 fw-semibold">Our Services</h5>
            <ul className={styles.footerLinks}>
              <li><a href="#qr-scanning" className={styles.footerLink}>QR Code Scanning</a></li>
              <li><a href="#fare-calculator" className={styles.footerLink}>Fare Calculator</a></li>
              <li><a href="#route-tracking" className={styles.footerLink}>Route Tracking</a></li>
              <li><a href="#biyabot" className={styles.footerLink}>BiyaBot Assistant</a></li>
              <li><a href="#real-time" className={styles.footerLink}>Real-time Updates</a></li>
            </ul>
          </Col>

          {/* Contact Info */}
          <Col lg={3} md={6} className="mb-4">
            <h5 className="text-white mb-3 fw-semibold">Get In Touch</h5>
            <div className={styles.contactInfo}>
              <div className="d-flex align-items-start mb-2">
                <i className="bi bi-geo-alt-fill text-warning me-2" style={{fontSize: '14px', marginTop: '2px'}}></i>
                <span className="text-white-50">Dasmariñas, Cavite, Philippines</span>
              </div>
              <div className="d-flex align-items-start mb-2">
                <i className="bi bi-envelope-fill text-warning me-2" style={{fontSize: '14px', marginTop: '2px'}}></i>
                <span className="text-white-50">info@lakbai.com</span>
              </div>
              <div className="d-flex align-items-start mb-2">
                <i className="bi bi-telephone-fill text-warning me-2" style={{fontSize: '14px', marginTop: '2px'}}></i>
                <span className="text-white-50">+63 123 456 7890</span>
              </div>
              <div className="d-flex align-items-start">
                <i className="bi bi-clock-fill text-warning me-2" style={{fontSize: '14px', marginTop: '2px'}}></i>
                <span className="text-white-50">24/7 Service</span>
              </div>
            </div>
          </Col>
        </Row>

        {/* Bottom Footer */}
        <Row className="border-top border-secondary pt-4 pb-3">
          <Col md={6}>
            <p className="text-white-50 mb-0 small">
              © 2024 LakbAI. All rights reserved.
            </p>
          </Col>
          <Col md={6} className="text-md-end">
            <div className={styles.footerBottomLinks}>
              <a href="#privacy" className={`${styles.footerLink} small me-3`}>Privacy Policy</a>
              <a href="#terms" className={`${styles.footerLink} small me-3`}>Terms of Service</a>
              <a href="#cookies" className={`${styles.footerLink} small`}>Cookie Policy</a>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
