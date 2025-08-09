export const MONTHS_DATA = [
  { label: 'JAN', value: 'January' },
  { label: 'FEB', value: 'February' },
  { label: 'MAR', value: 'March' },
  { label: 'APR', value: 'April' },
  { label: 'MAY', value: 'May' },
  { label: 'JUN', value: 'June' },
  { label: 'JUL', value: 'July' },
  { label: 'AUG', value: 'August' },
  { label: 'SEP', value: 'September' },
  { label: 'OCT', value: 'October' },
  { label: 'NOV', value: 'November' },
  { label: 'DEC', value: 'December' }
];

export const VALIDATION_MESSAGES = {
  REQUIRED_FIELDS: 'Please fill in all required fields',
  INVALID_EMAIL: 'Please enter a valid email address',
  USERNAME_TOO_SHORT: 'Username must be at least 3 characters long',
  INVALID_PASSWORD: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number',
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
  INVALID_BIRTH_DATE: 'Please enter a valid birth date',
  ACCEPT_TERMS: 'Please accept the Terms and Conditions',
};

export const PLACEHOLDERS = {
  FIRST_NAME: 'First name',
  LAST_NAME: 'Last name',
  EMAIL: 'your.email@example.com',
  PHONE_NUMBER: '0917 123 4567',
  USERNAME: 'Choose a username',
  PASSWORD: 'Create password',
  CONFIRM_PASSWORD: 'Confirm password',
  HOUSE_NUMBER: '123',
  STREET_NAME: 'Main Street',
  BARANGAY: 'Barangay name',
  CITY: 'City',
  PROVINCE: 'Province',
  POSTAL_CODE: '1234',
  BIRTH_DATE: 'DD',
  BIRTH_YEAR: 'YYYY',
  MONTH: 'Month',
} as const;

export const HELP_TEXTS = {
  USERNAME: 'At least 3 characters, no spaces',
  PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, and number',
  PHONE_NUMBER: 'Enter Philippine mobile number (e.g., 0917 123 4567)',
  BIRTH_DATE: 'Enter a valid date (1920-2025)',
};