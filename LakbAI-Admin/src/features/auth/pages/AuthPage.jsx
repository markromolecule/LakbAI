import React, { useState } from 'react';
import { LoginForm, RegisterForm } from '../components';
import styles from '../styles/AuthPage.module.css';

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState('login');

  return (
    <div className={styles.authPageContainer}>
      <div className={styles.authContent}>
        <div className={styles.desktopLayout}>
          <div className={styles.loginSection}>
            <LoginForm />
          </div>
          <div className={styles.registerSection}>
            <RegisterForm />
          </div>
        </div>
        <div className={styles.mobileLayout}>
          <div className={styles.mobileTabNavigation}>
            <button 
              className={`${styles.mobileTab} ${activeTab === 'login' ? styles.active : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Login
            </button>
            <button 
              className={`${styles.mobileTab} ${activeTab === 'register' ? styles.active : ''}`}
              onClick={() => setActiveTab('register')}
            >
              Register
            </button>
          </div>
          
          <div className={styles.mobileContent}>
            {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
