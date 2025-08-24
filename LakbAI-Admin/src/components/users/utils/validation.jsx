export const validateUserForm = (formData, mode) => {
  const errors = {};

  // Required fields validation
  const requiredFields = [
    'username', 'email', 'first_name', 'last_name', 
    'phone_number', 'birthday', 'house_number', 'street_name',
    'barangay', 'city_municipality', 'province', 'postal_code'
  ];

  if (mode === 'create') {
    requiredFields.push('password');
  }

  requiredFields.forEach(field => {
    if (!formData[field]?.trim()) {
      errors[field] = `${field.replace('_', ' ')} is required`;
    }
  });

  // Email validation
  if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
    errors.email = 'Invalid email format';
  }

  // Phone validation - accept whitespace and format like mobile (09xx xxx xxxx)
  if (formData.phone_number) {
    const cleanPhone = formData.phone_number.replace(/\s/g, '');
    if (!/^09\d{9}$/.test(cleanPhone)) {
      errors.phone_number = 'Phone number must be 11 digits starting with 09 (e.g., 09xx xxx xxxx)';
    }
  }

  // Password validation (only for create mode or when password is provided)
  if ((mode === 'create' || formData.password) && formData.password && formData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long';
  }

  // Postal code validation
  if (formData.postal_code && !/^\d{4}$/.test(formData.postal_code)) {
    errors.postal_code = 'Postal code must be 4 digits';
  }

  // Birthday validation
  if (formData.birthday) {
    const birthDate = new Date(formData.birthday);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 13) {
      errors.birthday = 'User must be at least 13 years old';
    }
  }

  return errors;
};

export const isValidForm = (errors) => {
  return Object.keys(errors).length === 0;
};

// New function to clean form data before submission
export const cleanFormDataForSubmission = (formData, userType) => {
  const cleanedData = { ...formData };
  
  // For drivers, remove discount-related fields
  if (userType === 'driver') {
    delete cleanedData.discount_type;
    delete cleanedData.discount_verified;
    delete cleanedData.discount_document_path;
    delete cleanedData.discount_document_name;
  }
  
  // For passengers, remove driver license-related fields
  if (userType === 'passenger') {
    delete cleanedData.drivers_license_path;
    delete cleanedData.drivers_license_name;
    delete cleanedData.drivers_license_verified;
  }
  
  // Remove password if empty
  if (!cleanedData.password) {
    delete cleanedData.password;
  }
  
  return cleanedData;
};
