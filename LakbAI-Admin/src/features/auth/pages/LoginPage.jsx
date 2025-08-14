import React from 'react';
import { LoginForm } from '../components';
import styles from '../styles/AuthPage.module.css';

const LoginPage = () => {
  return (
    <div className={styles.authPage}>
      <LoginForm />
    </div>
  );
};

export default LoginPage;
