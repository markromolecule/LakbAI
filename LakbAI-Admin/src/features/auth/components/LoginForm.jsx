import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/LoginForm.module.css';

const LoginForm = () => {
  // State management - keep intact for team to use
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  


  // Event handlers - keep intact for team to use
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // TODO: Implement login logic
      console.log('Login data:', formData);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Login successful!');
    } catch (error) {
      setErrors({ general: 'Invalid email or password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginFormContainer}>
      <div className={styles.loginCard}>
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
          <h2 className={styles.formTitle}>Welcome Back</h2>
          <p className={styles.formSubtitle}>Sign in to your LakbAI account</p>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNavigation}>
          <button className={`${styles.tabButton} ${styles.active}`}>
            Sign In
          </button>
          <Link to="/register" className={styles.tabButton}>
            Sign Up
          </Link>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className={styles.loginForm}>
          {errors.general && (
            <div className={styles.errorAlert}>
              <i className="bi bi-exclamation-triangle-fill"></i>
              {errors.general}
            </div>
          )}

          {/* Email Field */}
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.formLabel}>
              Email Address
            </label>
            <input
              type="email"
              className={`${styles.formControl} ${errors.email ? styles.invalid : ''}`}
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />
            {errors.email && (
              <div className={styles.errorMessage}>
                {errors.email}
              </div>
            )}
          </div>

          {/* Password Field */}
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.formLabel}>
              Password
            </label>
            <input
              type="password"
              className={`${styles.formControl} ${errors.password ? styles.invalid : ''}`}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />
            {errors.password && (
              <div className={styles.errorMessage}>
                {errors.password}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Additional Links */}
          <div className={styles.additionalLinks}>
            <Link to="/forgot-password" className={styles.forgotPassword}>
              <i className="bi bi-key"></i>
              Forgot your password?
            </Link>
          </div>
        </form>

        {/* Footer Content */}
        <div className={styles.formFooter}>
          <div className={styles.helpSection}>
            <h4 className={styles.helpTitle}>Need Help?</h4>
            <p className={styles.helpText}>
              Having trouble signing in? Contact our support team for assistance.
            </p>
            <div className={styles.contactInfo}>
              <a href="mailto:support@lakbai.com" className={styles.contactLink}>
                <i className="bi bi-envelope"></i>
                support@lakbai.com
              </a>
              <a href="tel:+639123456789" className={styles.contactLink}>
                <i className="bi bi-telephone"></i>
                +63 912 345 6789
              </a>
            </div>
          </div>

          <div className={styles.divider}>
            <span className={styles.dividerText}>Alternative Sign-In Options</span>
          </div>

          <div className={styles.socialSignInSection}>
            <button type="button" className={styles.socialButton}>
              <i className="bi bi-google"></i>
              <span>Continue with Google</span>
            </button>
            <button type="button" className={styles.socialButton}>
              <i className="bi bi-facebook"></i>
              <span>Continue with Facebook</span>
            </button>
          </div>

          <div className={styles.legalLinks}>
            <p className={styles.termsText}>
              By signing in, you agree to our{' '}
              <Link to="/terms" className={styles.legalLink}>Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className={styles.legalLink}>Privacy Policy</Link>
            </p>
            <p className={styles.copyrightText}>
              © 2024 LakbAI. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
