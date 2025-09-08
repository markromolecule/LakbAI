import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import styles from '../styles/HowItWorks.module.css';

const HowItWorks = () => {
  const steps = [
    {
      id: 1,
      icon: 'bi-qr-code-scan',
      title: 'Scan the QR',
      description: 'Find the QR code inside the jeepney and scan it with your phone to get started.',
      iconClass: styles.qrIcon
    },
    {
      id: 2,
      icon: 'bi-currency-exchange',
      title: 'View Fare',
      description: 'Select your destination and calculate the exact fare instantly with our smart system.',
      iconClass: styles.fareIcon
    },
    {
      id: 3,
      icon: 'bi-clock-history',
      title: 'Check Arrivals',
      description: 'Get real-time arrival updates and travel information to stay on schedule.',
      iconClass: styles.timeIcon
    },
    {
      id: 4,
      icon: 'bi-chat-dots-fill',
      title: 'Ask BiyaBot',
      description: 'Get instant answers and helpful travel info from BiyaBot - your smart commute assistant.',
      iconClass: styles.chatIcon
    }
  ];

  return (
    <section id="how-it-works" className={styles.howItWorks}>
      <Container>
        <Row>
          <Col lg={12} className="text-center mb-5">
            <h2 className={styles.sectionTitle}>How It Works</h2>
            <p className={styles.sectionSubtitle}>
              Simple, Fast, and Reliable - Just Four Steps to a Better Jeepney Experience
            </p>
          </Col>
        </Row>
        <Row>
          {steps.map((step) => (
            <Col lg={3} md={6} className="mb-4" key={step.id}>
              <Card className={`${styles.stepCard} text-center h-100`}>
                <Card.Body>
                  <div className={`${styles.stepIconContainer} ${step.iconClass}`}>
                    <i className={`bi ${step.icon} ${styles.stepIcon}`}></i>
                    <div className={styles.stepNumber}>{step.id}</div>
                  </div>
                  <h5 className={styles.stepTitle}>{step.title}</h5>
                  <p className={styles.stepDescription}>
                    {step.description}
                  </p>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default HowItWorks;
