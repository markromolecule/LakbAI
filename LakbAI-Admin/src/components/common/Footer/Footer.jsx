import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <>
      <footer className={styles.customFooter}>
        <div className="header-content">
          <div className="footer-container">
            {/* Main Footer Content */}
            <div className="footer-content">
              {/* Brand Section */}
              <div className="footer-brand-section">
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
              </div>

              {/* Links Sections */}
              <div className="footer-links-sections">
                {/* Quick Links */}
                <div className="footer-links-section">
                  <h5 className="text-white mb-3 fw-semibold">Quick Links</h5>
                  <ul className={styles.footerLinks}>
                    <li><a href="#home" className={styles.footerLink}>Home</a></li>
                    <li><a href="#about" className={styles.footerLink}>About Us</a></li>
                    <li><a href="#services" className={styles.footerLink}>Services</a></li>
                    <li><a href="#routes" className={styles.footerLink}>Routes</a></li>
                    <li><a href="#contact" className={styles.footerLink}>Contact</a></li>
                  </ul>
                </div>

                {/* Services */}
                <div className="footer-links-section">
                  <h5 className="text-white mb-3 fw-semibold">Our Services</h5>
                  <ul className={styles.footerLinks}>
                    <li><a href="#qr-scanning" className={styles.footerLink}>QR Code Scanning</a></li>
                    <li><a href="#fare-calculator" className={styles.footerLink}>Fare Calculator</a></li>
                    <li><a href="#route-tracking" className={styles.footerLink}>Route Tracking</a></li>
                    <li><a href="#biyabot" className={styles.footerLink}>BiyaBot Assistant</a></li>
                    <li><a href="#real-time" className={styles.footerLink}>Real-time Updates</a></li>
                  </ul>
                </div>

                {/* Contact Info */}
                <div className="footer-links-section">
                  <h5 className="text-white mb-3 fw-semibold">Get In Touch</h5>
                  <div className={styles.contactInfo}>
                    <div className="d-flex align-items-start mb-3">
                      <i className="bi bi-geo-alt-fill text-warning me-2" style={{fontSize: '14px', marginTop: '2px'}}></i>
                      <span className="text-white-50">Dasmariñas, Cavite, Philippines</span>
                    </div>
                    <div className="d-flex align-items-start mb-3">
                      <i className="bi bi-envelope-fill text-warning me-2" style={{fontSize: '14px', marginTop: '2px'}}></i>
                      <span className="text-white-50">info@lakbai.com</span>
                    </div>
                    <div className="d-flex align-items-start mb-3">
                      <i className="bi bi-telephone-fill text-warning me-2" style={{fontSize: '14px', marginTop: '2px'}}></i>
                      <span className="text-white-50">+63 123 456 7890</span>
                    </div>
                    <div className="d-flex align-items-start">
                      <i className="bi bi-clock-fill text-warning me-2" style={{fontSize: '14px', marginTop: '2px'}}></i>
                      <span className="text-white-50">24/7 Service</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="footer-bottom">
              <div className="footer-bottom-content">
                <p className="text-white-50 mb-0 small">
                  © 2024 LakbAI. All rights reserved.
                </p>
                <div className={styles.footerBottomLinks}>
                  <a href="#privacy" className={`${styles.footerLink} small`}>Privacy Policy</a>
                  <a href="#terms" className={`${styles.footerLink} small`}>Terms of Service</a>
                  <a href="#cookies" className={`${styles.footerLink} small`}>Cookie Policy</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
      
      <style jsx>{`
        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1rem;
          width: 100%;
        }
        
        .footer-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          padding: clamp(2rem, 5vh, 3rem) 0;
        }
        
        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: clamp(2rem, 4vw, 3rem);
          margin-bottom: clamp(2rem, 4vh, 2.5rem);
        }
        
        .footer-brand-section {
          flex: 0 0 35%;
          max-width: 35%;
        }
        
        .footer-links-sections {
          display: flex;
          gap: clamp(1.5rem, 3vw, 2.5rem);
          flex: 1;
          justify-content: space-between;
        }
        
        .footer-links-section {
          flex: 1;
          min-width: 0;
        }
        
        .footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          padding-top: clamp(1rem, 2.5vh, 1.5rem);
        }
        
        .footer-bottom-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        @media (max-width: 992px) {
          .footer-content {
            flex-direction: column;
            gap: clamp(2rem, 4vh, 2.5rem);
          }
          
          .footer-brand-section {
            flex: none;
            max-width: 100%;
            text-align: center;
          }
          
          .footer-links-sections {
            justify-content: space-around;
            gap: clamp(1rem, 2vw, 1.5rem);
          }
        }
        
        @media (max-width: 768px) {
          .footer-links-sections {
            flex-direction: column;
            gap: clamp(1.5rem, 3vh, 2rem);
            text-align: center;
          }
          
          .footer-bottom-content {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }
        }
        
        @media (max-width: 576px) {
          .footer-container {
            padding: clamp(1.5rem, 4vh, 2rem) 0;
          }
          
          .footer-content {
            gap: clamp(1.5rem, 3vh, 2rem);
          }
          
          .footer-links-sections {
            gap: clamp(1rem, 2vh, 1.5rem);
          }
        }
      `}</style>
    </>
  );
};

export default Footer;
