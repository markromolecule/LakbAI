/**
 * Reusable Form Field Component
 * Handles input, select, and error display
 */

import React from 'react';
import styles from '../../styles/RegisterForm.module.css';

const FormField = ({
  type = 'text',
  name,
  label,
  value,
  onChange,
  error,
  placeholder,
  options = [],
  accept,
  className = '',
  required = false,
  ...props
}) => {
  const isSelect = type === 'select';
  const isFile = type === 'file';
  
  const baseClassName = `${styles.formControl} ${error ? styles.invalid : ''} ${className}`;

  const renderInput = () => {
    if (isSelect) {
      return (
        <select
          className={baseClassName}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          {...props}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (isFile) {
      return (
        <input
          type="file"
          className={baseClassName}
          id={name}
          name={name}
          accept={accept}
          onChange={onChange}
          {...props}
        />
      );
    }

    return (
      <input
        type={type}
        className={baseClassName}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...props}
      />
    );
  };

  return (
    <div className={styles.formGroup}>
      <label htmlFor={name} className={styles.formLabel}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      {renderInput()}
      {error && (
        <div className={styles.errorMessage}>{error}</div>
      )}
    </div>
  );
};

export default FormField;
