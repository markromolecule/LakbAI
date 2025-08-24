import React from 'react';
import { RegisterForm } from '../components';
import styles from '../styles/AuthPage.module.css';

const RegisterPage = () => {
  return (
    <div className={styles.authPageContainer}>
      <div className={`${styles.authContent} ${styles.singleRegisterLayout}`}>
        <div className={styles.registerSection}>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
