import React, { useEffect } from 'react';
import { Container, Button, Row, Col, Card } from 'react-bootstrap';
import { Header, Footer } from '../../../components/common';
import { HeroSection, HowItWorks, RouteSection } from '../components';
import { BiyaBot } from '../../../components/ui';
import { clearAllAuthData } from '../../../utils/authUtils';
import styles from '../styles/HomePage.module.css';

const HomePage = () => {
  useEffect(() => {
    // Clear any remaining authentication data when homepage loads
    console.log('HomePage: Clearing authentication data...');
    clearAllAuthData();
    
    // Force clear any Auth0 state that might be causing issues
    const auth0Keys = Object.keys(localStorage).filter(key => 
      key.includes('auth0') || 
      key.includes('token') || 
      key.includes('session')
    );
    
    auth0Keys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('HomePage: Authentication data cleared');
  }, []);

  return (
    <div className={styles.homepage}>
      <Header />
      <HeroSection />
      <HowItWorks />
      <RouteSection />
      <Footer />
      
      {/* BiyaBot Chat Widget */}
      <BiyaBot />
    </div>
  );
};

export default HomePage;
