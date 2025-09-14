/**
 * Custom Hook for Registration Form
 * Manages form state, validation, and submission logic
 */

import { useState } from 'react';
import { INITIAL_FORM_STATE, ERROR_MESSAGES } from '../helpers/constants';
import { validateRegistrationForm } from '../helpers/validation';
import { validateFile } from '../utils/fileUtils';

export const useRegisterForm = () => {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  


  /**
   * Handle input change for text fields and selects
   * @param {Event} e - Input change event
   */
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

  /**
   * Handle file upload change
   * @param {Event} e - File input change event
   */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const fieldName = e.target.name;
    
    if (file) {
      const validation = validateFile(file);
      
      if (!validation.isValid) {
        setErrors(prev => ({
          ...prev,
          [fieldName]: validation.error
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        [fieldName]: file
      }));

      // Clear error if file is valid
      if (errors[fieldName]) {
        setErrors(prev => ({
          ...prev,
          [fieldName]: ''
        }));
      }
    }
  };

  /**
   * Validate the entire form
   * @returns {boolean} True if form is valid
   */
  const validateForm = () => {
    const validationErrors = validateRegistrationForm(formData);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE);
    setErrors({});
    setLoading(false);
  };

  /**
   * Set specific field error
   * @param {string} field - Field name
   * @param {string} error - Error message
   */
  const setFieldError = (field, error) => {
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  /**
   * Clear specific field error
   * @param {string} field - Field name
   */
  const clearFieldError = (field) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };



  /**
   * Set general error (for API errors, etc.)
   * @param {string} error - Error message
   */
  const setGeneralError = (error) => {
    setErrors(prev => ({
      ...prev,
      general: error
    }));
  };

  /**
   * Handle form submission with file uploads
   * @param {Event} e - Form submit event
   * @param {Function} onSubmit - Custom submit handler
   */
  const handleSubmit = async (e, onSubmit) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      // Clear ALL errors including general error
      setErrors({});
      
      // Prepare form data for file upload
      const formDataToSend = new FormData();
      
      // Add basic registration data
      formDataToSend.append('username', formData.firstName.toLowerCase() + formData.lastName.toLowerCase());
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('first_name', formData.firstName);
      formDataToSend.append('last_name', formData.lastName);
      formDataToSend.append('phone_number', formData.phoneNumber.replace(/\s/g, ''));
      formDataToSend.append('birthday', `${formData.birthYear}-${formData.birthMonth.toString().padStart(2, '0')}-${formData.birthDay.toString().padStart(2, '0')}`);
      formDataToSend.append('gender', formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1));
      formDataToSend.append('house_number', formData.houseNumber);
      formDataToSend.append('street_name', formData.streetName);
      formDataToSend.append('barangay', formData.barangay);
      formDataToSend.append('city_municipality', formData.city);
      formDataToSend.append('province', formData.province);
      formDataToSend.append('postal_code', formData.postalCode);
      formDataToSend.append('user_type', formData.userType);
      formDataToSend.append('is_verified', 'false');
      formDataToSend.append('discount_type', formData.discountType || '');
      formDataToSend.append('discount_verified', 'false');
      
      // Add driver's license file if present (for drivers)
      if (formData.driversLicense && formData.userType === 'driver') {
        formDataToSend.append('license_document', formData.driversLicense);
        formDataToSend.append('drivers_license', formData.driversLicense.name);
      }
      
      // Add discount document file if present (for passengers with discount)
      if (formData.discountDocument && formData.userType === 'passenger' && formData.discountType) {
        formDataToSend.append('discount_document', formData.discountDocument);
      }
      
      if (onSubmit) {
        // For custom submit handlers, also provide the FormData
        const driverData = {
          username: formData.firstName.toLowerCase() + formData.lastName.toLowerCase(),
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone_number: formData.phoneNumber.replace(/\s/g, ''),
          birthday: `${formData.birthYear}-${formData.birthMonth.toString().padStart(2, '0')}-${formData.birthDay.toString().padStart(2, '0')}`,
          gender: formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1),
          house_number: formData.houseNumber,
          street_name: formData.streetName,
          barangay: formData.barangay,
          city_municipality: formData.city,
          province: formData.province,
          postal_code: formData.postalCode,
          user_type: 'driver',
          is_verified: false,
          discount_type: null,
          discount_verified: false,
          drivers_license: formData.driversLicense ? formData.driversLicense.name : null,
          drivers_license_verified: false
        };
        await onSubmit(driverData, formDataToSend);
      } else {
        // Use the new file upload endpoint
        const response = await fetch('/api/register-with-files', {
          method: 'POST',
          body: formDataToSend, // Send as FormData for file upload
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
          const userTypeText = formData.userType === 'driver' ? 'Driver' : 'Passenger';
          alert(`${userTypeText} account created successfully! Please wait for admin verification before logging in.`);
          // Reset form
          setFormData(INITIAL_FORM_STATE);
          setErrors({}); // Ensure errors are cleared
          
          // Redirect to login page after successful registration
          window.location.href = '/login';
        } else {
          setGeneralError(result.message || 'Registration failed');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setGeneralError(
        error.message || ERROR_MESSAGES.GENERAL.REGISTRATION_FAILED
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if form has unsaved changes
   * @returns {boolean} True if form has been modified
   */
  const hasUnsavedChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(INITIAL_FORM_STATE);
  };

  /**
   * Get form completion percentage
   * @returns {number} Percentage of completed required fields
   */
  const getFormCompletionPercentage = () => {
    const requiredFields = [
      'firstName', 'lastName', 'email', 'phoneNumber', 'gender',
      'password', 'confirmPassword', 'houseNumber', 'streetName',
      'barangay', 'city', 'province', 'postalCode',
      'birthMonth', 'birthDay', 'birthYear'
      // Note: driversLicense is optional for now
    ];
    
    const completedFields = requiredFields.filter(field => {
      const value = formData[field];
      return value && value !== '';
    });
    
    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  return {
    // State
    formData,
    errors,
    loading,
    
    // Actions
    handleChange,
    handleFileChange,
    handleSubmit,
    validateForm,
    resetForm,
    setFieldError,
    clearFieldError,
    setGeneralError,
    
    // Utilities
    hasUnsavedChanges,
    getFormCompletionPercentage,
  };
};
