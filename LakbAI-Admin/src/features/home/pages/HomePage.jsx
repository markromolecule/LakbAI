import React from 'react';
import { Container, Button, Row, Col, Card } from 'react-bootstrap';
import { Header, Footer } from '../../../components/common';
import { HeroSection, HowItWorks, RouteSection } from '../components';
import styles from '../styles/HomePage.module.css';

const HomePage = () => {
  return (
    <div className={styles.homepage}>
      <Header />
      <HeroSection />
      <HowItWorks />
      <RouteSection />
      <Footer />
    </div>
  );
};

export default HomePage;
