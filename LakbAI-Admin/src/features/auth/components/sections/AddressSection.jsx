/**
 * Address Information Section Component
 */

import React from 'react';
import styles from '../../styles/RegisterForm.module.css';
import FormField from '../shared/FormField';

const AddressSection = ({ formData, errors, onChange }) => {
  return (
    <>
      <div className={styles.sectionTitle}>Full Address</div>
      
      {/* House and Street */}
      <div className={styles.formRow}>
        <FormField
          name="houseNumber"
          label="House/Building No."
          value={formData.houseNumber}
          onChange={onChange}
          error={errors.houseNumber}
          placeholder="House/Building No."
          required
        />
        <FormField
          name="streetName"
          label="Street Name"
          value={formData.streetName}
          onChange={onChange}
          error={errors.streetName}
          placeholder="Street Name"
          required
        />
      </div>

      {/* Barangay */}
      <FormField
        name="barangay"
        label="Barangay"
        value={formData.barangay}
        onChange={onChange}
        error={errors.barangay}
        placeholder="Barangay"
        required
      />

      {/* City, Province, Postal */}
      <div className={styles.formRow}>
        <FormField
          name="city"
          label="City/Municipality"
          value={formData.city}
          onChange={onChange}
          error={errors.city}
          placeholder="City/Municipality"
          required
        />
        <FormField
          name="province"
          label="Province"
          value={formData.province}
          onChange={onChange}
          error={errors.province}
          placeholder="Province"
          required
        />
        <FormField
          name="postalCode"
          label="Postal Code"
          value={formData.postalCode}
          onChange={onChange}
          error={errors.postalCode}
          placeholder="Postal Code"
          required
        />
      </div>
    </>
  );
};

export default AddressSection;
