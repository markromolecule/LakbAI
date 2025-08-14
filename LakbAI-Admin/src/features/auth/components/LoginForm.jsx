import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const LoginForm = () => {
  // State management - keep intact for team to use
  const [formData, setFormData] = useState({
    username: '',
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
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center px-3">
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
                <h2 className="fw-bold text-primary mb-2">Welcome Back</h2>
                <p className="text-muted">Sign in to your LakbAI account</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit}>
                {errors.general && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {errors.general}
                  </div>
                )}

                {/* Username Field */}
                <div className="mb-3">
                  <label htmlFor="username" className="form-label fw-semibold">
                    <i className="bi bi-person-fill me-2 text-primary"></i>
                    Username
                  </label>
                  <input
                    type="text"
                    className={`form-control form-control-lg ${errors.username ? 'is-invalid' : ''}`}
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter your username"
                    style={{ borderRadius: '12px', padding: '12px 16px' }}
                  />
                  {errors.username && (
                    <div className="invalid-feedback">
                      {errors.username}
                    </div>
                  )}
                </div>

                {/* Password Field */}
                <div className="mb-4">
                  <label htmlFor="password" className="form-label fw-semibold">
                    <i className="bi bi-lock-fill me-2 text-primary"></i>
                    Password
                  </label>
                  <input
                    type="password"
                    className={`form-control form-control-lg ${errors.password ? 'is-invalid' : ''}`}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    style={{ borderRadius: '12px', padding: '12px 16px' }}
                  />
                  {errors.password && (
                    <div className="invalid-feedback">
                      {errors.password}
                    </div>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mb-4">
                  <div className="form-check mb-2 mb-sm-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="rememberMe"
                    />
                    <label className="form-check-label text-muted" htmlFor="rememberMe">
                      Remember me
                    </label>
                  </div>
                  <a href="#forgot" className="text-primary text-decoration-none">
                    Forgot password?
                  </a>
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
                      Signing in...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Sign In
                    </>
                  )}
                </button>
              </form>

              {/* Register Link */}
              <div className="text-center mt-4 pt-3 border-top">
                <p className="text-muted mb-0">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-primary text-decoration-none fw-semibold">
                    Create Account
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

export default LoginForm;
