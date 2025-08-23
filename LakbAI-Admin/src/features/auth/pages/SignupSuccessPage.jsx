import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Card, Alert, Button } from 'react-bootstrap';
import { CheckCircleFill, ArrowRight } from 'react-bootstrap-icons';
import styles from '../styles/SignupSuccessPage.module.css';

const SignupSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate('/auth/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleGoToLogin = () => {
    navigate('/auth/login');
  };

  const handleGoToHome = () => {
    navigate('/');
  };

  return (
    <Container className={styles.container}>
      <div className={styles.content}>
        <Card className={styles.successCard}>
          <Card.Body className={styles.cardBody}>
            {/* Success Icon */}
            <div className={styles.iconContainer}>
              <CheckCircleFill className={styles.successIcon} />
            </div>

            {/* Success Message */}
            <h2 className={styles.title}>Account Created Successfully!</h2>
            <p className={styles.message}>
              Welcome to LakbAI! Your driver account has been created and you've been assigned the driver role.
            </p>

            {/* Role Information */}
            <Alert variant="info" className={styles.roleInfo}>
              <strong>Driver Role Assigned:</strong>
              <ul className={styles.roleList}>
                <li>Access to driver dashboard</li>
                <li>Manage ride requests</li>
                <li>Track earnings and routes</li>
                <li>Use mobile app with driver features</li>
              </ul>
            </Alert>

            {/* Next Steps */}
            <div className={styles.nextSteps}>
              <h5>Next Steps:</h5>
              <ol className={styles.stepsList}>
                <li>Log in to your account</li>
                <li>Complete your profile information</li>
                <li>Upload required documents</li>
                <li>Start accepting ride requests</li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className={styles.buttonContainer}>
              <Button 
                variant="primary" 
                size="lg" 
                onClick={handleGoToLogin}
                className={styles.loginButton}
              >
                Go to Login <ArrowRight className="ms-2" />
              </Button>
              
              <Button 
                variant="outline-secondary" 
                onClick={handleGoToHome}
                className={styles.homeButton}
              >
                Back to Home
              </Button>
            </div>

            {/* Auto-redirect notice */}
            <p className={styles.autoRedirect}>
              Redirecting to login in {countdown} seconds...
            </p>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default SignupSuccessPage;
