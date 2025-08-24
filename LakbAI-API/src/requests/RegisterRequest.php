<?php

require_once __DIR__ . '/BaseRequest.php';

class RegisterRequest extends BaseRequest {
    
    /**
     * Validation rules for user registration
     */
    public function validate() {
        $this->errors = [];
        $this->sanitizeData();

        // Define required fields
        $required = [
            'username', 'email', 'password', 'first_name', 'last_name',
            'phone_number', 'birthday', 'gender', 'house_number', 'street_name',
            'barangay', 'city_municipality', 'province', 'postal_code'
        ];

        // Check required fields
        $validation = $this->validationHelper->validateRequiredFields($this->data, $required);
        if (!$validation['valid']) {
            foreach ($validation['missing_fields'] as $field) {
                $this->addError($field, ucfirst(str_replace('_', ' ', $field)) . ' is required');
            }
        }

        // Validate email
        if ($this->has('email')) {
            if (!$this->validationHelper->isValidEmail($this->get('email'))) {
                $this->addError('email', 'Invalid email format');
            }
        }

        // Validate username
        if ($this->has('username')) {
            if (!$this->validationHelper->isValidUsername($this->get('username'))) {
                $this->addError('username', 'Username must be 3-20 characters, alphanumeric and underscore only');
            }
        }

        // Validate password
        if ($this->has('password')) {
            if (!$this->validationHelper->isValidPassword($this->get('password'))) {
                $this->addError('password', 'Password must be at least 8 characters with uppercase, lowercase, and number');
            }
        }

        // Validate phone number
        if ($this->has('phone_number')) {
            if (!$this->validationHelper->isValidPhone($this->get('phone_number'))) {
                $this->addError('phone_number', 'Invalid phone number format');
            }
        }

        // Validate postal code
        if ($this->has('postal_code')) {
            if (!$this->validationHelper->isValidPostalCode($this->get('postal_code'))) {
                $this->addError('postal_code', 'Invalid postal code format (must be 4 digits)');
            }
        }

        // Validate gender
        if ($this->has('gender')) {
            $validGenders = ['Male', 'Female', 'Other'];
            if (!in_array($this->get('gender'), $validGenders)) {
                $this->addError('gender', 'Gender must be Male, Female, or Other');
            }
        }

        // Validate birthday
        if ($this->has('birthday')) {
            $birthday = $this->get('birthday');
            if (!$this->isValidDate($birthday)) {
                $this->addError('birthday', 'Invalid birthday format (use YYYY-MM-DD)');
            } else {
                // Check if user is at least 13 years old
                $birthDate = new DateTime($birthday);
                $today = new DateTime();
                $age = $today->diff($birthDate)->y;
                
                if ($age < 13) {
                    $this->addError('birthday', 'User must be at least 13 years old');
                }
            }
        }

        // Validate user type
        if ($this->has('user_type')) {
            $validUserTypes = ['passenger', 'driver'];
            if (!in_array($this->get('user_type'), $validUserTypes)) {
                $this->addError('user_type', 'User type must be passenger or driver');
            }
        }

        // Validate discount type (only for passengers)
        if ($this->has('user_type') && $this->get('user_type') === 'passenger') {
            if ($this->has('discount_type') && !empty($this->get('discount_type'))) {
                $validDiscountTypes = ['PWD', 'Senior Citizen', 'Student'];
                if (!in_array($this->get('discount_type'), $validDiscountTypes)) {
                    $this->addError('discount_type', 'Discount type must be PWD, Senior Citizen, or Student');
                }
            }
        }

        // Validate driver's license (required for drivers)
        if ($this->has('user_type') && $this->get('user_type') === 'driver') {
            if (!$this->has('drivers_license') || empty($this->get('drivers_license'))) {
                $this->addError('drivers_license', 'Driver\'s license is required for driver accounts');
            }
        }

        return $this->isValid();
    }

    /**
     * Check if date is valid
     */
    private function isValidDate($date) {
        $d = DateTime::createFromFormat('Y-m-d', $date);
        return $d && $d->format('Y-m-d') === $date;
    }

    /**
     * Get prepared data for user creation
     */
    public function getCreateData() {
        $data = $this->validated();
        
        // Set defaults
        $data['user_type'] = $data['user_type'] ?? 'passenger';
        $data['discount_type'] = $data['discount_type'] ?? null;
        $data['discount_document_path'] = $data['discount_document_path'] ?? null;
        $data['discount_document_name'] = $data['discount_document_name'] ?? null;
        
        // Hash password
        $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        
        return $data;
    }
}
?>
