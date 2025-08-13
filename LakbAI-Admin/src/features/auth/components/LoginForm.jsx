import React, { useState } from 'react';
import { Link } from 'react-router-dom';

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
    <div>
      {/* Empty container for team to design login form */}
      {/* Available props/state for team:
          - formData: { email, password }
          - errors: object with error messages
          - loading: boolean
          - handleChange: function for input changes
          - handleSubmit: function for form submission
          - Link component available for navigation to /register
      */}
    </div>
  );
};

export default LoginForm;
