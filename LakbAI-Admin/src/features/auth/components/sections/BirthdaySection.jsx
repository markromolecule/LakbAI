/**
 * Birthday Information Section Component
 */

import React from 'react';
import styles from '../../styles/RegisterForm.module.css';
import FormField from '../shared/FormField';
import { generateMonths, generateDays, generateYears } from '../../helpers/formHelpers';

const BirthdaySection = ({ formData, errors, onChange }) => {
  const monthOptions = [{ value: '', label: 'Month' }, ...generateMonths()];
  const dayOptions = [{ value: '', label: 'Day' }, ...generateDays()];
  const yearOptions = [{ value: '', label: 'Year' }, ...generateYears()];

  return (
    <>
      <div className={styles.sectionTitle}>Birthday</div>
      <div className={styles.birthdayRow}>
        <FormField
          type="select"
          name="birthMonth"
          label="Month"
          value={formData.birthMonth}
          onChange={onChange}
          error={errors.birthMonth}
          options={monthOptions}
          required
        />
        <FormField
          type="select"
          name="birthDay"
          label="Day"
          value={formData.birthDay}
          onChange={onChange}
          error={errors.birthDay}
          options={dayOptions}
          required
        />
        <FormField
          type="select"
          name="birthYear"
          label="Year"
          value={formData.birthYear}
          onChange={onChange}
          error={errors.birthYear}
          options={yearOptions}
          required
        />
      </div>
    </>
  );
};

export default BirthdaySection;
