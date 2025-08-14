import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const RegisterForm = () => {
  // State management - keep intact for team to use
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
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
    
    // Basic validation logic - keep intact for team to use
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      // TODO: Implement registration logic
      console.log('Registration data:', formData);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Registration successful!');
    } catch (error) {
      setErrors({ general: 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center px-3 py-4">
      <div className="row w-100 justify-content-center">
        <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5 col-xxl-4">
          <div className="card shadow-lg border-0" style={{ borderRadius: '20px' }}>
            <div className="card-body p-4 p-md-5">
              {/* Header */}
              <div className="text-center mb-4">
                <img
                  src="/image/logofinal.png"
                  width="60"
                  height="60"
                  className="mb-3"
                  alt="LakbAI Logo"
                />
                <h2 className="fw-bold text-primary mb-2">Join LakbAI</h2>
                <p className="text-muted">Create your account to get started</p>
              </div>

              {/* Register Form */}
              <form onSubmit={handleSubmit}>
                {errors.general && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {errors.general}
                  </div>
                )}

                {/* Name Fields */}
                <div className="row mb-3">
                  <div className="col-12 col-sm-6 mb-3 mb-sm-0">
                    <label htmlFor="firstName" className="form-label fw-semibold">
                      <i className="bi bi-person me-2 text-primary"></i>
                      First Name
                    </label>
                    <input
                      type="text"
                      className={`form-control form-control-lg ${errors.firstName ? 'is-invalid' : ''}`}
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="First name"
                      style={{ borderRadius: '12px', padding: '12px 16px' }}
                    />
                    {errors.firstName && (
                      <div className="invalid-feedback">{errors.firstName}</div>
                    )}
                  </div>
                  <div className="col-12 col-sm-6">
                    <label htmlFor="lastName" className="form-label fw-semibold">
                      <i className="bi bi-person me-2 text-primary"></i>
                      Last Name
                    </label>
                    <input
                      type="text"
                      className={`form-control form-control-lg ${errors.lastName ? 'is-invalid' : ''}`}
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Last name"
                      style={{ borderRadius: '12px', padding: '12px 16px' }}
                    />
                    {errors.lastName && (
                      <div className="invalid-feedback">{errors.lastName}</div>
                    )}
                  </div>
                </div>

                {/* Username Field */}
                <div className="mb-3">
                  <label htmlFor="username" className="form-label fw-semibold">
                    <i className="bi bi-at me-2 text-primary"></i>
                    Username
                  </label>
                  <input
                    type="text"
                    className={`form-control form-control-lg ${errors.username ? 'is-invalid' : ''}`}
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a username"
                    style={{ borderRadius: '12px', padding: '12px 16px' }}
                  />
                  {errors.username && (
                    <div className="invalid-feedback">{errors.username}</div>
                  )}
                </div>

                {/* Email Field */}
                <div className="mb-3">
                  <label htmlFor="email" className="form-label fw-semibold">
                    <i className="bi bi-envelope me-2 text-primary"></i>
                    Email Address
                  </label>
                  <input
                    type="email"
                    className={`form-control form-control-lg ${errors.email ? 'is-invalid' : ''}`}
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    style={{ borderRadius: '12px', padding: '12px 16px' }}
                  />
                  {errors.email && (
                    <div className="invalid-feedback">{errors.email}</div>
                  )}
                </div>

                {/* Password Fields */}
                <div className="row mb-4">
                  <div className="col-12 col-sm-6 mb-3 mb-sm-0">
                    <label htmlFor="password" className="form-label fw-semibold">
                      <i className="bi bi-lock me-2 text-primary"></i>
                      Password
                    </label>
                    <input
                      type="password"
                      className={`form-control form-control-lg ${errors.password ? 'is-invalid' : ''}`}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create password"
                      style={{ borderRadius: '12px', padding: '12px 16px' }}
                    />
                    {errors.password && (
                      <div className="invalid-feedback">{errors.password}</div>
                    )}
                  </div>
                  <div className="col-12 col-sm-6">
                    <label htmlFor="confirmPassword" className="form-label fw-semibold">
                      <i className="bi bi-lock-fill me-2 text-primary"></i>
                      Confirm
                    </label>
                    <input
                      type="password"
                      className={`form-control form-control-lg ${errors.confirmPassword ? 'is-invalid' : ''}`}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm password"
                      style={{ borderRadius: '12px', padding: '12px 16px' }}
                    />
                    {errors.confirmPassword && (
                      <div className="invalid-feedback">{errors.confirmPassword}</div>
                    )}
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="form-check mb-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="agreeTerms"
                    required
                  />
                  <label className="form-check-label text-muted" htmlFor="agreeTerms">
                    I agree to the{' '}
                    <a href="#terms" className="text-primary text-decoration-none">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#privacy" className="text-primary text-decoration-none">
                      Privacy Policy
                    </a>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-100 fw-semibold"
                  disabled={loading}
                  style={{
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #2c5aa0 0%, #1e3d72 100%)',
                    border: 'none',
                    minHeight: '50px'
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-plus me-2"></i>
                      Create Account
                    </>
                  )}
                </button>
              </form>

              {/* Login Link */}
              <div className="text-center mt-4 pt-3 border-top">
                <p className="text-muted mb-0">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary text-decoration-none fw-semibold">
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
