/**
 * Registration Form Constants
 * Contains all constant values used in the registration form
 */

// File upload constants
export const FILE_UPLOAD = {
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
  MAX_SIZE: 5 * 1024 * 1024, // 5MB in bytes
  ACCEPT_ATTRIBUTE: '.jpg,.jpeg,.png,.pdf',
};

// Gender options
export const GENDER_OPTIONS = [
  { value: '', label: 'Select Gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

// Age constraints
export const AGE_CONSTRAINTS = {
  MIN_AGE: 18,
  MAX_AGE: 65,
};

// Form field limits
export const FIELD_LIMITS = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 8,
  POSTAL_CODE_LENGTH: 4,
};

// Error messages
export const ERROR_MESSAGES = {
  REQUIRED: {
    FIRST_NAME: 'First name is required',
    LAST_NAME: 'Last name is required',
    USERNAME: 'Username is required',
    EMAIL: 'Email is required',
    PHONE: 'Phone number is required',
    GENDER: 'Gender is required',
    PASSWORD: 'Password is required',
    CONFIRM_PASSWORD: 'Please confirm your password',
    HOUSE_NUMBER: 'House/Building number is required',
    STREET_NAME: 'Street name is required',
    BARANGAY: 'Barangay is required',
    CITY: 'City/Municipality is required',
    PROVINCE: 'Province is required',
    POSTAL_CODE: 'Postal code is required',
    BIRTH_MONTH: 'Birth month is required',
    BIRTH_DAY: 'Birth day is required',
    BIRTH_YEAR: 'Birth year is required',
    DRIVERS_LICENSE: 'Driver\'s license is required',
  },
  FILE_UPLOAD: {
    INVALID_TYPE: 'Please upload a valid image (JPG, PNG) or PDF file',
    FILE_TOO_LARGE: 'File size must be less than 5MB',
  },
  VALIDATION: {
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_PHONE: 'Please enter a valid Philippine phone number',
    INVALID_POSTAL_CODE: 'Please enter a valid 4-digit postal code',
    PASSWORD_MISMATCH: 'Passwords do not match',
    NAME_TOO_SHORT: 'Name must be at least 2 characters',
    USERNAME_TOO_SHORT: 'Username must be at least 3 characters',
    USERNAME_TOO_LONG: 'Username must be no more than 20 characters',
    USERNAME_INVALID_CHARS: 'Username can only contain letters, numbers, and underscores',
    INVALID_AGE: 'You must be between 18 and 65 years old',
  },
  GENERAL: {
    REGISTRATION_FAILED: 'Registration failed. Please try again.',
    SOMETHING_WENT_WRONG: 'Something went wrong. Please try again.',
  },
};

// Success messages
export const SUCCESS_MESSAGES = {
  REGISTRATION_SUCCESS: 'Registration successful! Welcome to LakbAI.',
  FILE_UPLOADED: 'File uploaded successfully',
};

// API endpoints (if needed)
export const API_ENDPOINTS = {
  REGISTER: '/api/auth/register',
  UPLOAD_DOCUMENT: '/api/upload/document',
};

// Form initial state
export const INITIAL_FORM_STATE = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  phoneNumber: '',
  gender: '',
  password: '',
  confirmPassword: '',
  houseNumber: '',
  streetName: '',
  barangay: '',
  city: '',
  province: '',
  postalCode: '',
  birthMonth: '',
  birthDay: '',
  birthYear: '',
  driversLicense: null,
};
