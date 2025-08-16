<?php

require_once __DIR__ . '/BaseRequest.php';

class LoginRequest extends BaseRequest {
    
    /**
     * Validation rules for user login
     */
    public function validate() {
        $this->errors = [];
        $this->sanitizeData();

        // Check required fields - either email or username must be provided
        if ((!$this->has('email') || empty($this->get('email'))) && 
            (!$this->has('username') || empty($this->get('username')))) {
            $this->addError('login', 'Email or username is required');
        }

        if (!$this->has('password') || empty($this->get('password'))) {
            $this->addError('password', 'Password is required');
        }

        // Validate email format if email is provided
        if ($this->has('email') && !empty($this->get('email'))) {
            if (!$this->validationHelper->isValidEmail($this->get('email'))) {
                $this->addError('email', 'Invalid email format');
            }
        }

        return $this->isValid();
    }

    /**
     * Get email from request
     */
    public function getEmail() {
        return $this->get('email');
    }

    /**
     * Get username from request
     */
    public function getUsername() {
        return $this->get('username');
    }

    /**
     * Get password from request
     */
    public function getPassword() {
        return $this->get('password');
    }

    /**
     * Get the login identifier (email or username)
     */
    public function getLoginIdentifier() {
        return $this->has('email') ? $this->get('email') : $this->get('username');
    }

    /**
     * Check if login is using email
     */
    public function isEmailLogin() {
        return $this->has('email') && !empty($this->get('email'));
    }
}
?>
