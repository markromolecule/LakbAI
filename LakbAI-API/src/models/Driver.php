<?php

/**
 * Driver Model
 * Handles CRUD operations for driver accounts
 * Admin-only access with proper authentication
 */

class Driver {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    /**
     * Get all drivers (admin only)
     */
    public function getAllDrivers() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT 
                    id as driver_id,
                    username,
                    email,
                    first_name,
                    last_name,
                    phone_number,
                    gender,
                    birthday,
                    user_type,
                    house_number,
                    street_name,
                    barangay,
                    city_municipality as city,
                    province,
                    postal_code,
                    drivers_license_verified as license_verification_status,
                    is_verified as account_verified,
                    drivers_license_path as license_document,
                    created_at,
                    updated_at
                FROM users 
                WHERE user_type = 'driver'
                ORDER BY created_at DESC
            ");
            
            $stmt->execute();
            $drivers = $stmt->fetchAll();
            
            return [
                'status' => 'success',
                'message' => 'Drivers retrieved successfully',
                'data' => $drivers
            ];
            
        } catch (PDOException $e) {
            return [
                'status' => 'error',
                'message' => 'Failed to retrieve drivers: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Get single driver by ID (admin only)
     */
    public function getDriverById($driverId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT 
                    id as driver_id,
                    username,
                    email,
                    first_name,
                    last_name,
                    phone_number,
                    gender,
                    birthday,
                    user_type,
                    house_number,
                    street_name,
                    barangay,
                    city_municipality as city,
                    province,
                    postal_code,
                    drivers_license_verified as license_verification_status,
                    is_verified as account_verified,
                    drivers_license_path as license_document,
                    created_at,
                    updated_at
                FROM users 
                WHERE id = ? AND user_type = 'driver'
            ");
            
            $stmt->execute([$driverId]);
            $driver = $stmt->fetch();
            
            if (!$driver) {
                return [
                    'status' => 'error',
                    'message' => 'Driver not found'
                ];
            }
            
            return [
                'status' => 'success',
                'message' => 'Driver retrieved successfully',
                'data' => $driver
            ];
            
        } catch (PDOException $e) {
            return [
                'status' => 'error',
                'message' => 'Failed to retrieve driver: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Create new driver (admin only)
     */
    public function createDriver($data) {
        try {
            // Validate required fields
            $requiredFields = [
                'username', 'email', 'password', 'first_name', 'last_name',
                'phone_number', 'gender', 'birthday', 'house_number',
                'street_name', 'barangay', 'city', 'province', 'postal_code'
            ];
            
            foreach ($requiredFields as $field) {
                if (empty($data[$field])) {
                    return [
                        'status' => 'error',
                        'message' => "Field '$field' is required"
                    ];
                }
            }
            
            // Validate email format
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                return [
                    'status' => 'error',
                    'message' => 'Invalid email format'
                ];
            }
            
            // Validate gender
            $validGenders = ['Male', 'Female', 'Other'];
            if (!in_array($data['gender'], $validGenders)) {
                return [
                    'status' => 'error',
                    'message' => 'Invalid gender value'
                ];
            }
            
            // Check if username already exists
            $stmt = $this->pdo->prepare("SELECT id FROM users WHERE username = ?");
            $stmt->execute([$data['username']]);
            if ($stmt->fetch()) {
                return [
                    'status' => 'error',
                    'message' => 'Username already exists'
                ];
            }
            
            // Check if email already exists
            $stmt = $this->pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$data['email']]);
            if ($stmt->fetch()) {
                return [
                    'status' => 'error',
                    'message' => 'Email already exists'
                ];
            }
            
            // Check if phone number already exists
            $stmt = $this->pdo->prepare("SELECT id FROM users WHERE phone_number = ?");
            $stmt->execute([$data['phone_number']]);
            if ($stmt->fetch()) {
                return [
                    'status' => 'error',
                    'message' => 'Phone number already exists'
                ];
            }
            
            // Hash password
            $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
            
            // Insert new driver
            $stmt = $this->pdo->prepare("
                INSERT INTO users (
                    username, email, password, first_name, last_name,
                    phone_number, gender, birthday, user_type,
                    house_number, street_name, barangay, city_municipality,
                    province, postal_code, is_verified, drivers_license_verified
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, 'driver', ?, ?, ?, ?, ?, ?, ?, ?
                )
            ");
            
            $stmt->execute([
                $data['username'],
                $data['email'],
                $hashedPassword,
                $data['first_name'],
                $data['last_name'],
                $data['phone_number'],
                $data['gender'],
                $data['birthday'],
                $data['house_number'],
                $data['street_name'],
                $data['barangay'],
                $data['city'],
                $data['province'],
                $data['postal_code'],
                $data['account_verified'] ?? false,
                $data['license_verification_status'] ?? false
            ]);
            
            $driverId = $this->pdo->lastInsertId();
            
            // Get the created driver
            return $this->getDriverById($driverId);
            
        } catch (PDOException $e) {
            return [
                'status' => 'error',
                'message' => 'Failed to create driver: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Update driver (admin only)
     */
    public function updateDriver($driverId, $data) {
        try {
            // Check if driver exists
            $stmt = $this->pdo->prepare("SELECT id FROM users WHERE id = ? AND user_type = 'driver'");
            $stmt->execute([$driverId]);
            if (!$stmt->fetch()) {
                return [
                    'status' => 'error',
                    'message' => 'Driver not found'
                ];
            }
            
            // Build update query dynamically
            $updateFields = [];
            $updateValues = [];
            
            $allowedFields = [
                'username', 'email', 'first_name', 'last_name', 'phone_number',
                'gender', 'birthday', 'house_number', 'street_name', 'barangay',
                'city', 'province', 'postal_code', 'is_verified', 'drivers_license_verified'
            ];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updateFields[] = "$field = ?";
                    $updateValues[] = $data[$field];
                }
            }
            
            // Handle password update separately
            if (!empty($data['password'])) {
                $updateFields[] = "password = ?";
                $updateValues[] = password_hash($data['password'], PASSWORD_DEFAULT);
            }
            
            if (empty($updateFields)) {
                return [
                    'status' => 'error',
                    'message' => 'No valid fields to update'
                ];
            }
            
            // Add driver ID to values
            $updateValues[] = $driverId;
            
            // Check for unique constraints
            if (isset($data['username'])) {
                $stmt = $this->pdo->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
                $stmt->execute([$data['username'], $driverId]);
                if ($stmt->fetch()) {
                    return [
                        'status' => 'error',
                        'message' => 'Username already exists'
                    ];
                }
            }
            
            if (isset($data['email'])) {
                $stmt = $this->pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
                $stmt->execute([$data['email'], $driverId]);
                if ($stmt->fetch()) {
                    return [
                        'status' => 'error',
                        'message' => 'Email already exists'
                    ];
                }
            }
            
            if (isset($data['phone_number'])) {
                $stmt = $this->pdo->prepare("SELECT id FROM users WHERE phone_number = ? AND id != ?");
                $stmt->execute([$data['phone_number'], $driverId]);
                if ($stmt->fetch()) {
                    return [
                        'status' => 'error',
                        'message' => 'Phone number already exists'
                    ];
                }
            }
            
            // Update driver
            $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ? AND user_type = 'driver'";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($updateValues);
            
            // Get the updated driver
            return $this->getDriverById($driverId);
            
        } catch (PDOException $e) {
            return [
                'status' => 'error',
                'message' => 'Failed to update driver: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Delete driver (admin only)
     */
    public function deleteDriver($driverId) {
        try {
            // Check if driver exists
            $stmt = $this->pdo->prepare("SELECT id FROM users WHERE id = ? AND user_type = 'driver'");
            $stmt->execute([$driverId]);
            if (!$stmt->fetch()) {
                return [
                    'status' => 'error',
                    'message' => 'Driver not found'
                ];
            }
            
            // Delete driver
            $stmt = $this->pdo->prepare("DELETE FROM users WHERE id = ? AND user_type = 'driver'");
            $stmt->execute([$driverId]);
            
            return [
                'status' => 'success',
                'message' => 'Driver deleted successfully'
            ];
            
        } catch (PDOException $e) {
            return [
                'status' => 'error',
                'message' => 'Failed to delete driver: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Verify admin authentication
     */
    public function verifyAdminAuth($adminId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT id, user_type, is_verified 
                FROM users 
                WHERE id = ? AND user_type = 'admin' AND is_verified = 1
            ");
            $stmt->execute([$adminId]);
            return $stmt->fetch() !== false;
        } catch (PDOException $e) {
            return false;
        }
    }
}
