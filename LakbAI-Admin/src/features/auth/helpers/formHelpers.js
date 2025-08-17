/**
 * Form Helper Functions
 * Utility functions for generating form options and data
 */

/**
 * Generate months array for dropdown
 * @returns {Array} Array of month objects with value and label
 */
export const generateMonths = () => {
  return Array.from({ length: 12 }, (_, i) => {
    const month = new Date(0, i).toLocaleString('en', { month: 'long' });
    return { value: i + 1, label: month };
  });
};

/**
 * Generate days array for dropdown (1-31)
 * @returns {Array} Array of day objects with value and label
 */
export const generateDays = () => {
  return Array.from({ length: 31 }, (_, i) => ({ 
    value: i + 1, 
    label: i + 1 
  }));
};

/**
 * Generate years array for dropdown (18-65 years old)
 * @returns {Array} Array of year objects with value and label
 */
export const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 65; // 65 years old maximum
  const endYear = currentYear - 18;   // 18 years old minimum
  
  return Array.from({ length: endYear - startYear + 1 }, (_, i) => ({
    value: endYear - i,
    label: endYear - i
  }));
};

/**
 * Get current year
 * @returns {number} Current year
 */
export const getCurrentYear = () => new Date().getFullYear();

/**
 * Validate age based on birth date
 * @param {number} month - Birth month (1-12)
 * @param {number} day - Birth day (1-31)
 * @param {number} year - Birth year
 * @returns {boolean} True if age is between 18-65
 */
export const validateAge = (month, day, year) => {
  if (!month || !day || !year) return false;
  
  const today = new Date();
  const birthDate = new Date(year, month - 1, day);
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age >= 18 && age <= 65;
};
