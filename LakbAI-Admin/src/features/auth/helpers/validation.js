/**
 * Form Validation Functions
 * Contains all validation logic for the registration form
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format (Philippine format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if phone is valid
 */
export const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^(\+63|0)9\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with isValid and message
 */
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!hasUpperCase || !hasLowerCase) {
    return { isValid: false, message: 'Password must contain both uppercase and lowercase letters' };
  }
  
  if (!hasNumbers) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  if (!hasSpecialChar) {
    return { isValid: false, message: 'Password must contain at least one special character' };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate postal code format (Philippine format)
 * @param {string} postalCode - Postal code to validate
 * @returns {boolean} True if postal code is valid
 */
export const isValidPostalCode = (postalCode) => {
  const postalRegex = /^\d{4}$/;
  return postalRegex.test(postalCode);
};

/**
 * Validate registration form data
 * @param {object} formData - Form data to validate
 * @returns {object} Validation errors object
 */
export const validateRegistrationForm = (formData) => {
  const errors = {};

  // Personal Information
  if (!formData.firstName?.trim()) {
    errors.firstName = 'First name is required';
  } else if (formData.firstName.length < 2) {
    errors.firstName = 'First name must be at least 2 characters';
  }

  if (!formData.lastName?.trim()) {
    errors.lastName = 'Last name is required';
  } else if (formData.lastName.length < 2) {
    errors.lastName = 'Last name must be at least 2 characters';
  }

  if (!formData.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!formData.phoneNumber?.trim()) {
    errors.phoneNumber = 'Phone number is required';
  } else if (!isValidPhoneNumber(formData.phoneNumber)) {
    errors.phoneNumber = 'Please enter a valid Philippine phone number';
  }

  if (!formData.gender) {
    errors.gender = 'Gender is required';
  }

  // Password validation
  if (!formData.password) {
    errors.password = 'Password is required';
  } else {
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.message;
    }
  }

  if (!formData.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  // Address validation
  if (!formData.houseNumber?.trim()) {
    errors.houseNumber = 'House/Building number is required';
  }

  if (!formData.streetName?.trim()) {
    errors.streetName = 'Street name is required';
  }

  if (!formData.barangay?.trim()) {
    errors.barangay = 'Barangay is required';
  }

  if (!formData.city?.trim()) {
    errors.city = 'City/Municipality is required';
  }

  if (!formData.province?.trim()) {
    errors.province = 'Province is required';
  }

  if (!formData.postalCode?.trim()) {
    errors.postalCode = 'Postal code is required';
  } else if (!isValidPostalCode(formData.postalCode)) {
    errors.postalCode = 'Please enter a valid 4-digit postal code';
  }

  // Birthday validation
  if (!formData.birthMonth) {
    errors.birthMonth = 'Birth month is required';
  }

  if (!formData.birthDay) {
    errors.birthDay = 'Birth day is required';
  }

  if (!formData.birthYear) {
    errors.birthYear = 'Birth year is required';
  }

  // Driver's license validation
  if (!formData.driversLicense) {
    errors.driversLicense = 'Driver\'s license is required';
  }

  return errors;
};
