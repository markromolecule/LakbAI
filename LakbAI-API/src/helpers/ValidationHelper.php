<?php

class ValidationHelper {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Check if email already exists in users table
     * @param string $email
     * @return bool
     */
    public function emailExists($email) {
        $query = "SELECT id FROM users WHERE email = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("s", $email);
        $stmt->execute();

        $result = $stmt->get_result();
        return $result->num_rows > 0;
    }

    /**
     * Check if username already exists in users table
     * @param string $username
     * @return bool
     */
    public function usernameExists($username) {
        $query = "SELECT id FROM users WHERE username = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("s", $username);
        $stmt->execute();

        $result = $stmt->get_result();
        return $result->num_rows > 0;
    }

    /**
     * Check if phone number already exists in users table
     * @param string $phone_number
     * @return bool
     */
    public function phoneExists($phone_number) {
        $query = "SELECT id FROM users WHERE phone_number = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("s", $phone_number);
        $stmt->execute();

        $result = $stmt->get_result();
        return $result->num_rows > 0;
    }

    /**
     * Validate email format
     * @param string $email
     * @return bool
     */
    public function isValidEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * Validate phone number format (basic validation)
     * @param string $phone
     * @return bool
     */
    public function isValidPhone($phone) {
        // Remove all non-digit characters
        $clean_phone = preg_replace('/[^0-9]/', '', $phone);
        // Check if it's 10-11 digits (common for PH numbers)
        return strlen($clean_phone) >= 10 && strlen($clean_phone) <= 11;
    }

    /**
     * Validate username format
     * @param string $username
     * @return bool
     */
    public function isValidUsername($username) {
        // Username should be 3-20 characters, alphanumeric and underscore only
        return preg_match('/^[a-zA-Z0-9_]{3,20}$/', $username);
    }

    /**
     * Validate password strength
     * @param string $password
     * @return bool
     */
    public function isValidPassword($password) {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        return strlen($password) >= 8 && 
               preg_match('/[A-Z]/', $password) && 
               preg_match('/[a-z]/', $password) && 
               preg_match('/[0-9]/', $password);
    }

    /**
     * Validate postal code format
     * @param string $postal_code
     * @return bool
     */
    public function isValidPostalCode($postal_code) {
        // Philippine postal codes are 4 digits
        return preg_match('/^[0-9]{4}$/', $postal_code);
    }

    /**
     * Sanitize input string
     * @param string $input
     * @return string
     */
    public function sanitizeInput($input) {
        return htmlspecialchars(strip_tags(trim($input)));
    }

    /**
     * Validate required fields
     * @param array $data
     * @param array $required_fields
     * @return array Array with 'valid' boolean and 'missing_fields' array
     */
    public function validateRequiredFields($data, $required_fields) {
        $missing_fields = [];
        
        foreach ($required_fields as $field) {
            if (!isset($data[$field]) || empty(trim($data[$field]))) {
                $missing_fields[] = $field;
            }
        }
        
        return [
            'valid' => empty($missing_fields),
            'missing_fields' => $missing_fields
        ];
    }

    /**
     * Get discount percentage based on type
     * @param string $discount_type
     * @return int
     */
    public function getDiscountPercentage($discount_type) {
        switch($discount_type) {
            case 'PWD':
                return 20; // 20% discount for PWD
            case 'Senior Citizen':
                return 20; // 20% discount for seniors
            case 'Student':
                return 10; // 10% discount for students
            default:
                return 0; // No discount
        }
    }
}
?>
