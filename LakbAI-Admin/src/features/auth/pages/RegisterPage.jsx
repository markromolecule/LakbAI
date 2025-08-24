import React from 'react';
import { RegisterForm } from '../components';
import styles from '../styles/AuthPage.module.css';

const RegisterPage = () => {
  return (
    <div className={styles.authPage}>
      <RegisterForm />
    </div>
  );
};

export default RegisterPage;
