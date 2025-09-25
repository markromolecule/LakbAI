/**
 * Custom Hook for Registration Form
 * Manages form state, validation, and submission logic
 */

import { useState } from 'react';
import { INITIAL_FORM_STATE, ERROR_MESSAGES } from '../helpers/constants';
import { validateRegistrationForm } from '../helpers/validation';
import { validateFile } from '../utils/fileUtils';
import { API_CONFIG } from '../../../config/apiConfig';

export const useRegisterForm = () => {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Debug: Log initial form state
  console.log('🔍 useRegisterForm - INITIAL_FORM_STATE:', INITIAL_FORM_STATE);
  console.log('🔍 useRegisterForm - formData:', formData);
  


  /**
   * Handle input change for text fields and selects
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Ensure value is never undefined
    const safeValue = value || '';
    
    setFormData(prev => ({
      ...prev,
      [name]: safeValue
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
    
    if (file) {
      const validation = validateFile(file);
      
      if (!validation.isValid) {
        setErrors(prev => ({
          ...prev,
          driversLicense: validation.error
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        driversLicense: file
      }));

      // Clear error if file is valid
      if (errors.driversLicense) {
        setErrors(prev => ({
          ...prev,
          driversLicense: ''
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
   * Handle form submission
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
      
      let licensePath = null;
      
      // Upload driver license if provided (optional - continue even if upload fails)
      if (formData.driversLicense) {
        try {
          const formDataUpload = new FormData();
          formDataUpload.append('drivers_license', formData.driversLicense);
          
          const uploadUrl = `${API_CONFIG.BASE_URL}/upload-driver-license?t=${Date.now()}`;
          console.log('📤 Uploading driver license to:', uploadUrl);
          console.log('📤 Upload URL:', uploadUrl);
          
          const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            body: formDataUpload,
          });
          
          console.log('📥 Upload response status:', uploadResponse.status);
          console.log('📥 Upload response statusText:', uploadResponse.statusText);
          console.log('📥 Upload response URL:', uploadResponse.url);
          console.log('📥 Upload response redirected:', uploadResponse.redirected);
          console.log('📥 Upload response type:', uploadResponse.type);
          console.log('📥 Upload response ok:', uploadResponse.ok);
          
          // Check if response is JSON
          const uploadContentType = uploadResponse.headers.get('content-type');
          console.log('📥 Upload Content-Type:', uploadContentType);
          
          if (!uploadContentType || !uploadContentType.includes('application/json')) {
            const uploadTextResponse = await uploadResponse.text();
            console.error('❌ Upload non-JSON response:', uploadTextResponse);
            console.warn('⚠️ File upload failed, but continuing with registration...');
            // Don't return - continue with registration without file
            licensePath = null;
          } else {
            const uploadResult = await uploadResponse.json();
            console.log('📥 Upload result:', uploadResult);
            
            if (uploadResult.status === 'success') {
              licensePath = uploadResult.data.file_path;
            } else {
              console.warn('⚠️ File upload failed:', uploadResult.message, 'but continuing with registration...');
              // Don't return - continue with registration without file
              licensePath = null;
            }
          }
        } catch (uploadError) {
          console.error('❌ Upload error:', uploadError);
          console.warn('⚠️ File upload failed, but continuing with registration...');
          // Don't return - continue with registration without file
          licensePath = null;
        }
      }
      
      // Set user type to driver for web registration and format data for API
      const driverData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: formData.phoneNumber.replace(/\s/g, ''), // Remove whitespace
        birthday: `${formData.birthYear}-${formData.birthMonth.toString().padStart(2, '0')}-${formData.birthDay.toString().padStart(2, '0')}`,
        gender: formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1), // Capitalize first letter
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
        drivers_license: formData.driversLicense ? formData.driversLicense.name : 'pending_upload',
        drivers_license_path: licensePath || 'pending_upload',
        drivers_license_verified: 0  // 0 = pending, 1 = approved, -1 = rejected
      };
      
      if (onSubmit) {
        await onSubmit(driverData);
      } else {
        // Default submission logic - send to API
        console.log('🔧 API_CONFIG:', API_CONFIG);
        console.log('🔧 API_CONFIG.BASE_URL:', API_CONFIG.BASE_URL);
        const apiUrl = `${API_CONFIG.BASE_URL}/register`;
        console.log('🚀 Registration API URL:', apiUrl);
        console.log('📤 Registration data:', driverData);
        console.log('📤 Registration data JSON:', JSON.stringify(driverData, null, 2));
        
        // Use API_CONFIG.BASE_URL instead of hardcoded URL
        const finalUrl = `${apiUrl}?t=${Date.now()}`;
        console.log('🚀 Using API_CONFIG URL:', apiUrl);
        console.log('🚀 Final URL with cache busting:', finalUrl);
        
        const response = await fetch(finalUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(driverData),
        });
        
        console.log('📥 Response status:', response.status);
        console.log('📥 Response statusText:', response.statusText);
        console.log('📥 Response headers:', response.headers);
        console.log('📥 Response URL:', response.url);
        console.log('📥 Response redirected:', response.redirected);
        console.log('📥 Response type:', response.type);

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        console.log('📥 Content-Type:', contentType);
        console.log('📥 Response ok:', response.ok);
        
        // Always try to get the response as text first to see what we're actually getting
        const responseText = await response.text();
        console.log('📥 Raw response text:', responseText);
        console.log('📥 Response length:', responseText.length);
        console.log('📥 First 200 chars:', responseText.substring(0, 200));
        console.log('📥 Full response text:', responseText); // Log the full response to see the HTML error

        if (!contentType || !contentType.includes('application/json')) {
          console.error('❌ Non-JSON response received. Content-Type:', contentType);
          console.error('❌ Full response text:', responseText);
          
          // Check if it's an HTML error page
          if (responseText.includes('<html') || responseText.includes('<br')) {
            setGeneralError('Server error occurred. Please check your connection and try again.');
          } else {
            setGeneralError('Server returned invalid response. Please try again.');
          }
          return;
        }

        // Try to parse as JSON
        let result;
        try {
          result = JSON.parse(responseText);
          console.log('📥 Parsed JSON response:', result);
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError);
          console.error('❌ Response text that failed to parse:', responseText);
          console.error('❌ Response status:', response.status);
          console.error('❌ Response URL:', response.url);
          
          // More specific error message based on response content
          if (responseText.includes('Fatal error') || responseText.includes('Parse error')) {
            setGeneralError('Server configuration error. Please contact support.');
          } else if (responseText.includes('<br')) {
            setGeneralError('Server returned HTML error page. Please try again.');
          } else {
            setGeneralError('Server returned invalid JSON response. Please try again.');
          }
          return;
        }
        
        if (result.status === 'success') {
          let successMessage = 'Driver account created successfully! Please wait for admin verification before logging in.';
          if (formData.driversLicense && !licensePath) {
            successMessage += '\n\nNote: Driver license file upload failed, but your account was created. You can upload your license later through the admin panel.';
          }
          alert(successMessage);
          // Reset form with proper initial state
          setFormData({...INITIAL_FORM_STATE});
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
      'firstName', 'lastName', 'username', 'email', 'phoneNumber', 'gender',
      'password', 'confirmPassword', 'houseNumber', 'streetName',
      'barangay', 'city', 'province', 'postalCode',
      'birthMonth', 'birthDay', 'birthYear', 'driversLicense'
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
