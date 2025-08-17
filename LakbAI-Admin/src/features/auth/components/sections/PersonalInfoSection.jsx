/**
 * Personal Information Section Component
 */

import React from 'react';
import styles from '../../styles/RegisterForm.module.css';
import FormField from '../shared/FormField';
import { GENDER_OPTIONS } from '../../helpers/constants';

const PersonalInfoSection = ({ formData, errors, onChange }) => {
  return (
    <>
      {/* Name Fields */}
      <div className={styles.formRow}>
        <FormField
          name="firstName"
          label="First Name"
          value={formData.firstName}
          onChange={onChange}
          error={errors.firstName}
          placeholder="First Name"
          required
        />
        <FormField
          name="lastName"
          label="Last Name"
          value={formData.lastName}
          onChange={onChange}
          error={errors.lastName}
          placeholder="Last Name"
          required
        />
      </div>

      {/* Email Field */}
      <FormField
        type="email"
        name="email"
        label="Email Address"
        value={formData.email}
        onChange={onChange}
        error={errors.email}
        placeholder="Enter your email"
        required
      />

      {/* Phone Number */}
      <FormField
        type="tel"
        name="phoneNumber"
        label="Phone Number"
        value={formData.phoneNumber}
        onChange={onChange}
        error={errors.phoneNumber}
        placeholder="Enter your phone number"
        required
      />

      {/* Gender */}
      <FormField
        type="select"
        name="gender"
        label="Gender"
        value={formData.gender}
        onChange={onChange}
        error={errors.gender}
        options={GENDER_OPTIONS}
        required
      />

      {/* Password Fields */}
      <div className={styles.formRow}>
        <FormField
          type="password"
          name="password"
          label="Password"
          value={formData.password}
          onChange={onChange}
          error={errors.password}
          placeholder="Create password"
          required
        />
        <FormField
          type="password"
          name="confirmPassword"
          label="Confirm Password"
          value={formData.confirmPassword}
          onChange={onChange}
          error={errors.confirmPassword}
          placeholder="Confirm Password"
          required
        />
      </div>
    </>
  );
};

export default PersonalInfoSection;
