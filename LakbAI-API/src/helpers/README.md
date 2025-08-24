# ValidationHelper Usage Guide

The `ValidationHelper` class provides comprehensive validation utilities for the LakbAI API.

## Basic Usage

```php
require_once __DIR__ . '/../src/helpers/ValidationHelper.php';

// Initialize with database connection
$validationHelper = new ValidationHelper($dbConnection);
```

## Available Methods

### Existence Checkers
- `emailExists($email)` - Check if email already exists in users table
- `usernameExists($username)` - Check if username already exists in users table  
- `phoneExists($phone_number)` - Check if phone number already exists in users table

### Format Validators
- `isValidEmail($email)` - Validate email format
- `isValidPhone($phone)` - Validate phone number format (10-11 digits)
- `isValidUsername($username)` - Validate username format (3-20 chars, alphanumeric + underscore)
- `isValidPassword($password)` - Validate password strength (8+ chars, uppercase, lowercase, number)
- `isValidPostalCode($postal_code)` - Validate Philippine postal code (4 digits)

### Utility Methods
- `sanitizeInput($input)` - Sanitize and trim input strings
- `validateRequiredFields($data, $required_fields)` - Check if all required fields are present
- `getDiscountPercentage($discount_type)` - Get discount percentage for PWD/Senior/Student

## Examples

### User Registration Validation
```php
// Check if email exists
if ($validationHelper->emailExists($email)) {
    return ["status" => "error", "message" => "Email already exists"];
}

// Validate email format
if (!$validationHelper->isValidEmail($email)) {
    return ["status" => "error", "message" => "Invalid email format"];
}

// Validate password strength
if (!$validationHelper->isValidPassword($password)) {
    return ["status" => "error", "message" => "Password too weak"];
}
```

### Required Fields Validation
```php
$required = ['email', 'password', 'first_name', 'last_name'];
$validation = $validationHelper->validateRequiredFields($data, $required);

if (!$validation['valid']) {
    return ["status" => "error", "message" => "Missing: " . implode(', ', $validation['missing_fields'])];
}
```

### Input Sanitization
```php
$cleanUsername = $validationHelper->sanitizeInput($username);
$cleanEmail = $validationHelper->sanitizeInput($email);
```

### Discount Calculation
```php
$discountPercent = $validationHelper->getDiscountPercentage('PWD'); // Returns 20
$discountPercent = $validationHelper->getDiscountPercentage('Student'); // Returns 10
```

## Refactored AuthController

The `AuthController` has been refactored to use the `ValidationHelper` and `User` model properly.

### Required Fields for Registration

**Required Fields:**
- `username` - Unique username (3-20 chars, alphanumeric + underscore)
- `email` - Valid email format, must be unique
- `password` - Strong password (8+ chars, uppercase, lowercase, number)
- `first_name` - User's first name
- `last_name` - User's last name
- `phone_number` - Valid phone number (10-11 digits), must be unique
- `birthday` - Date of birth (YYYY-MM-DD format)
- `gender` - User's gender
- `house_number` - House/building number
- `street_name` - Street name
- `barangay` - Barangay
- `city_municipality` - City or municipality
- `province` - Province
- `postal_code` - 4-digit postal code

**Optional Fields:**
- `user_type` - Default: 'passenger' (can be 'driver' or 'passenger')
- `discount_type` - Optional: 'PWD', 'Senior Citizen', 'Student', or null
- `discount_document_path` - Path to discount document file
- `discount_document_name` - Name of discount document

### Example Registration Data

```php
$registrationData = [
    'username' => 'john_doe',
    'email' => 'john.doe@example.com',
    'password' => 'SecurePass123',
    'first_name' => 'John',
    'last_name' => 'Doe',
    'phone_number' => '09123456789',
    'birthday' => '1990-01-01',
    'gender' => 'Male',
    'house_number' => '123',
    'street_name' => 'Main Street',
    'barangay' => 'Barangay 1',
    'city_municipality' => 'Manila',
    'province' => 'Metro Manila',
    'postal_code' => '1234',
    'user_type' => 'passenger',
    'discount_type' => 'Student'
];
```

## Benefits of Using ValidationHelper

1. **Centralized Validation Logic** - All validation rules in one place
2. **Reusability** - Use the same validation across different controllers
3. **Consistency** - Ensures consistent validation behavior throughout the app
4. **Maintainability** - Easy to update validation rules in one location
5. **Database Efficiency** - Reuses database connections for existence checks
6. **Better Separation of Concerns** - User model handles data operations, ValidationHelper handles validation
