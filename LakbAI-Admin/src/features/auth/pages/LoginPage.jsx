import React from 'react';
import { LoginForm } from '../components';
import styles from '../styles/AuthPage.module.css';

const LoginPage = () => {
  return (
    <div className={styles.authPageContainer}>
      <div className={`${styles.authContent} ${styles.singleLoginLayout}`}>
        <div className={styles.loginSection}>
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
