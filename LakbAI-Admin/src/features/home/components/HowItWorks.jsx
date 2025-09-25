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
    <>
      <section id="how-it-works" className={styles.howItWorks}>
        <div className="header-content">
          <div className="how-it-works-container">
            {/* Title Section */}
            <div className="title-section">
              <h2 className={styles.sectionTitle}>How It Works</h2>
              <p className={styles.sectionSubtitle}>
                Simple, Fast, and Reliable - Just Four Steps to a Better Jeepney Experience
              </p>
            </div>
            
            {/* Cards Section */}
            <div className="cards-section">
              {steps.map((step) => (
                <Card className={`${styles.stepCard} text-center h-100`} key={step.id}>
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
              ))}
            </div>
          </div>
        </div>
      </section>
      
      <style jsx>{`
        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1rem;
          width: 100%;
        }
        
        .how-it-works-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }
        
        .title-section {
          text-align: center;
          margin-bottom: 3rem;
          max-width: 800px;
        }
        
        .cards-section {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          flex-wrap: wrap;
          width: 100%;
          max-width: 1200px;
        }
        
        .cards-section .card {
          flex: 0 0 280px;
          max-width: 280px;
        }
        
        @media (max-width: 768px) {
          .cards-section {
            flex-direction: column;
            align-items: center;
          }
          
          .cards-section .card {
            flex: none;
            width: 100%;
            max-width: 350px;
          }
        }
      `}</style>
    </>
  );
};

export default HowItWorks;
