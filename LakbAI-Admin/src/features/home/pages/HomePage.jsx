import React from 'react';
import { Container, Button, Row, Col, Card } from 'react-bootstrap';
import { Header, Footer } from '../../../components/common';
import { HeroSection, HowItWorks, RouteSection, AboutUs } from '../components';
import { BiyaBot } from '../../../components/ui';
import styles from '../styles/HomePage.module.css';

const HomePage = () => {
  return (
    <div className={styles.homepage}>
      <Header />
      <HeroSection />
      <HowItWorks />
      <RouteSection />
      <AboutUs />
      <Footer />
      
      {/* BiyaBot Chat Widget */}
      <BiyaBot />
    </div>
  );
};

export default HomePage;
