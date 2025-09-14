/**
 * User Type Selection Section Component
 */

import React from 'react';
import styles from '../../styles/RegisterForm.module.css';
import { USER_TYPE_OPTIONS } from '../../helpers/constants';

const UserTypeSection = ({ formData, errors, onChange }) => {
  return (
    <>
      <div className={styles.sectionTitle}>Account Type</div>
      <div className={styles.formGroup}>
        <select
          name="userType"
          value={formData.userType}
          onChange={onChange}
          className={`${styles.formSelect} ${errors.userType ? styles.invalid : ''}`}
        >
          {USER_TYPE_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.userType && (
          <div className={styles.errorMessage}>{errors.userType}</div>
        )}
      </div>
    </>
  );
};

export default UserTypeSection;
