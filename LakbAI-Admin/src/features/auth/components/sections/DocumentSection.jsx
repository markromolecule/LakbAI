/**
 * Document Upload Section Component
 */

import React from 'react';
import styles from '../../styles/RegisterForm.module.css';
import { FILE_UPLOAD } from '../../helpers/constants';

const DocumentSection = ({ formData, errors, onFileChange }) => {
  const showDriverLicense = formData.userType === 'driver';

  if (!showDriverLicense) {
    return null;
  }

  return (
    <>
      <div className={styles.sectionTitle}>Driver's License</div>
      <div className={styles.formGroup}>
        <div className={styles.fileUpload}>
          <input
            type="file"
            id="driversLicense"
            name="driversLicense"
            accept={FILE_UPLOAD.ACCEPT_ATTRIBUTE}
            onChange={onFileChange}
            className={styles.fileInput}
          />
          <label 
            htmlFor="driversLicense" 
            className={`${styles.fileLabel} ${errors.driversLicense ? styles.invalid : ''}`}
          >
            <i className="bi bi-upload"></i>
            <span className={styles.uploadText}>
              {formData.driversLicense ? formData.driversLicense.name : 'Upload Driver\'s License'}
            </span>
            <span className={styles.uploadSubtext}>
              Max 5MB, JPG, PNG or PDF only
            </span>
          </label>
        </div>
        {errors.driversLicense && (
          <div className={styles.errorMessage}>{errors.driversLicense}</div>
        )}
      </div>
    </>
  );
};

export default DocumentSection;
