import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Auth0Logout.module.css';

const Auth0Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any remaining local storage
    localStorage.clear();
    
    // Redirect to home page after a brief delay
    const timer = setTimeout(() => {
      navigate('/', { replace: true });
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className={styles.logoutContainer}>
      <div className={styles.logoutCard}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <img
              src="/image/logofinal.png"
              width="50"
              height="50"
              className={styles.logo}
              alt="LakbAI Logo"
            />
            <div className={styles.logoText}>
              <h3 className={styles.brandName}>LakbAI Admin</h3>
              <p className={styles.brandTagline}>Goodbye!</p>
            </div>
          </div>
        </div>

        {/* Logout Status */}
        <div className={styles.statusContainer}>
          <div className={styles.checkIcon}>✓</div>
          <h2 className={styles.statusTitle}>Logged Out Successfully</h2>
          <p className={styles.statusMessage}>
            You have been securely signed out of your LakbAI account.
            <br />
            Redirecting to home page...
          </p>
        </div>

        {/* Security Footer */}
        <div className={styles.securityFooter}>
          <div className={styles.securityBadge}>
            <i className="bi bi-shield-check"></i>
            <span>Secured by Auth0</span>
          </div>
          <p className={styles.securityText}>
            Your session has been terminated safely
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth0Logout;
