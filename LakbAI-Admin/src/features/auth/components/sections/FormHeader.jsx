/**
 * Form Header Component
 */

import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/RegisterForm.module.css';

const FormHeader = () => {
  return (
    <>
      {/* Back Button */}
      <Link to="/" className={styles.backButton}>
        <i className="bi bi-arrow-left"></i>
      </Link>

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
            <h3 className={styles.brandName}>LakbAI</h3>
            <p className={styles.brandTagline}>A Smarter Way to Ride</p>
          </div>
        </div>
        <h2 className={styles.formTitle}>Create Account</h2>
        <p className={styles.formSubtitle}>Join the LakbAI Community Today</p>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        <Link to="/login" className={styles.tabButton}>
          Sign In
        </Link>
        <button className={`${styles.tabButton} ${styles.active}`}>
          Sign Up
        </button>
      </div>
    </>
  );
};

export default FormHeader;
