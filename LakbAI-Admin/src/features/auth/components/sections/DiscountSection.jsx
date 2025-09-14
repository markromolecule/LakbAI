/**
 * Discount Information Section Component
 */

import React from 'react';
import styles from '../../styles/RegisterForm.module.css';
import { DISCOUNT_TYPE_OPTIONS } from '../../helpers/constants';

const DiscountSection = ({ formData, errors, onChange, onFileChange }) => {
  const showDiscountFields = formData.userType === 'passenger';

  if (!showDiscountFields) {
    return null;
  }

  return (
    <>
      <div className={styles.sectionTitle}>Discount Information</div>
      
      {/* Discount Type Selection */}
      <div className={styles.formGroup}>
        <select
          name="discountType"
          value={formData.discountType}
          onChange={onChange}
          className={`${styles.formSelect} ${errors.discountType ? styles.invalid : ''}`}
        >
          {DISCOUNT_TYPE_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.discountType && (
          <div className={styles.errorMessage}>{errors.discountType}</div>
        )}
      </div>

      {/* Discount Document Upload (only if discount type is selected) */}
      {formData.discountType && (
        <div className={styles.formGroup}>
          <div className={styles.fileUpload}>
            <input
              type="file"
              id="discountDocument"
              name="discountDocument"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={onFileChange}
              className={styles.fileInput}
            />
            <label 
              htmlFor="discountDocument" 
              className={`${styles.fileLabel} ${errors.discountDocument ? styles.invalid : ''}`}
            >
              <i className="bi bi-upload"></i>
              <span className={styles.uploadText}>
                {formData.discountDocument ? formData.discountDocument.name : 'Upload Discount Document'}
              </span>
              <span className={styles.uploadSubtext}>
                Max 5MB, JPG, PNG or PDF only
              </span>
            </label>
          </div>
          {errors.discountDocument && (
            <div className={styles.errorMessage}>{errors.discountDocument}</div>
          )}
        </div>
      )}
    </>
  );
};

export default DiscountSection;
