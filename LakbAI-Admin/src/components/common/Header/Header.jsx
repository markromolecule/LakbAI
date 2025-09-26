import React, { useState, useEffect, useRef } from 'react';
import { Container, Navbar, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import styles from './Header.module.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking on the burger button
      if (event.target.closest('.burgerButton') || event.target.closest('[aria-label="Toggle menu"]')) {
        return;
      }
      
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      // Add a small delay to prevent immediate closing
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const scrollToHero = () => {
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
      heroSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleMenuClick = (section) => {
    setIsMenuOpen(false);
    // Only scroll if a specific section is provided
    if (section && section !== '#') {
      const element = document.querySelector(section);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  };

  return (
    <>
      <Navbar bg="white" expand="lg" className={`${styles.customHeader} ${styles.fixedHeader} shadow-sm py-2`}>
        <div className="header-content">
          {/* Logo - Upper Left */}
          <Navbar.Brand 
            className="d-flex align-items-center" 
            style={{ cursor: 'pointer' }}
            onClick={scrollToHero}
          >
            <img
              src="/image/logofinal.png"
              width="40"
              height="40"
              className="d-inline-block align-top me-2"
              alt="LakbAI Logo"
            />
            <span className={`${styles.brandText} fw-bold text-primary`}>LakbAI</span>
          </Navbar.Brand>
          
          {/* Desktop Navigation - Hidden on mobile */}
          <div className={`${styles.desktopNav} d-none d-lg-flex`}>
            <button 
              className={styles.navButton}
              onClick={() => handleMenuClick('#how-it-works')}
            >
              <i className="bi bi-play-circle me-2"></i>
              How It Works
            </button>
            <button 
              className={styles.navButton}
              onClick={() => handleMenuClick('#route-section')}
            >
              <i className="bi bi-signpost-2 me-2"></i>
              Route
            </button>
            <button 
              className={styles.navButton}
              onClick={() => handleMenuClick('#about')}
            >
              <i className="bi bi-info-circle me-2"></i>
              About Us
            </button>
          </div>
          
          {/* Burger Menu - Only visible on mobile/tablet */}
          <button 
            className={`${styles.burgerButton} d-lg-none`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <i className={`bi ${isMenuOpen ? 'bi-x' : 'bi-list'}`}></i>
          </button>
        </div>
      </Navbar>

      {/* Dropdown Menu - Only visible on mobile/tablet */}
      {isMenuOpen && (
        <div ref={dropdownRef} className={`${styles.dropdownMenu} d-lg-none`}>
          <div className={styles.menuContent}>
            <button 
              className={styles.menuItem}
              onClick={() => handleMenuClick('#how-it-works')}
            >
              <i className="bi bi-play-circle me-2"></i>
              How It Works
            </button>
            <button 
              className={styles.menuItem}
              onClick={() => handleMenuClick('#route-section')}
            >
              <i className="bi bi-signpost-2 me-2"></i>
              Route
            </button>
            <button 
              className={styles.menuItem}
              onClick={() => handleMenuClick('#about')}
            >
              <i className="bi bi-info-circle me-2"></i>
              About Us
            </button>
          </div>
        </div>
      )}
      
      <style>{`
        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1rem;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
      `}</style>
    </>
  );
};

export default Header;
