import React from 'react';
import { Container, Button, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import styles from '../styles/HeroSection.module.css';

const HeroSection = () => {
  return (
    <>
      {/* Hero Text Section */}
      <section className={styles.heroSection}>
        <Container>
          <Row className="align-items-center">
            <Col lg={12} className="text-center">
              <div className={styles.heroContent}>
                <h1 className={styles.heroTitle}>
                  A Smarter Way to Ride
                </h1>
                <p className={styles.heroSubtitle}>
                  Student-led Digital Jeepney System for Dasmariñas
                </p>
                <div className={styles.heroButtons}>
                  <Link to="/login">
                    <Button variant="outline-warning" size="lg" className={styles.heroBtn}>
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Login
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="outline-light" size="lg" className={styles.heroBtn}>
                      <i className="bi bi-person-plus me-2"></i>
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Hero Image Section */}
      <section className={styles.heroImageSection}>
        <Container fluid className="p-0">
          <div className={styles.heroImageContainer}>
            <img
              src="/image/modern-jeep.JPG"
              alt="Modern Jeepney Fleet"
              className={styles.heroImage}
            />
          </div>
        </Container>
      </section>
    </>
  );
};

export default HeroSection;
