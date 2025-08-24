import React from 'react';
import styles from '../styles/RegisterForm.module.css';

// Hooks and sections
import { useRegisterForm } from '../hooks/useRegisterForm';
import {
  FormHeader,
  PersonalInfoSection,
  AddressSection,
  BirthdaySection,
  DocumentSection,
} from './sections';

/**
 * Ultra-Compact Register Form Component
 * All logic delegated to custom hook and section components
 */
const RegisterForm = () => {
  const {
    formData,
    errors,
    loading,
    handleChange,
    handleFileChange,
    handleSubmit,
  } = useRegisterForm();

  return (
    <div className={styles.registerFormContainer}>
      <div className={styles.registerCard}>
        <FormHeader />

        <form onSubmit={handleSubmit} className={styles.registerForm}>

          {/* Error Alert */}
          {errors.general && (
            <div className={styles.errorAlert}>
              <i className="bi bi-exclamation-triangle-fill"></i>
              {errors.general}
            </div>
          )}

          {/* Form Sections */}
          <PersonalInfoSection 
            formData={formData} 
            errors={errors} 
            onChange={handleChange} 
          />
          
          <AddressSection 
            formData={formData} 
            errors={errors} 
            onChange={handleChange} 
          />
          
          <BirthdaySection 
            formData={formData} 
            errors={errors} 
            onChange={handleChange} 
          />
          
          <DocumentSection 
            formData={formData} 
            errors={errors} 
            onFileChange={handleFileChange} 
          />

          {/* Submit Button */}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
