<?php

require_once __DIR__ . '/../repositories/UserRepository.php';
require_once __DIR__ . '/../helpers/ValidationHelper.php';

class AuthService {
    private $userRepository;
    private $validationHelper;

    public function __construct($userRepository, $validationHelper) {
        $this->userRepository = $userRepository;
        $this->validationHelper = $validationHelper;
    }

    /**
     * Register a new user
     */
    public function register($userData) {
        try {
            // Check if email already exists
            if ($this->userRepository->emailExists($userData['email'])) {
                return $this->errorResponse('Email already exists');
            }

            // Check if username already exists
            if ($this->userRepository->usernameExists($userData['username'])) {
                return $this->errorResponse('Username already exists');
            }

            // Check if phone number already exists
            if ($this->userRepository->phoneExists($userData['phone_number'])) {
                return $this->errorResponse('Phone number already exists');
            }

            // Create user
            $userId = $this->userRepository->create($userData);

            if ($userId) {
                return $this->successResponse('User registered successfully', [
                    'user_id' => $userId
                ]);
            } else {
                return $this->errorResponse('Failed to create user');
            }

        } catch (Exception $e) {
            return $this->errorResponse('Registration failed: ' . $e->getMessage());
        }
    }

    /**
     * Authenticate user login
     */
    public function login($identifier, $password, $isEmail = true) {
        try {
            // Find user by email or username
            if ($isEmail) {
                $user = $this->userRepository->findByEmail($identifier);
            } else {
                $user = $this->userRepository->findByUsername($identifier);
            }

            if (!$user) {
                return $this->errorResponse('User not found');
            }

            // Verify password
            if (!password_verify($password, $user['password'])) {
                return $this->errorResponse('Incorrect password');
            }

            // Remove password from response
            unset($user['password']);

            return $this->successResponse('Login successful', [
                'user' => $user
            ]);

        } catch (Exception $e) {
            return $this->errorResponse('Login failed: ' . $e->getMessage());
        }
    }

    /**
     * Get user profile
     */
    public function getProfile($userId) {
        try {
            $user = $this->userRepository->findById($userId);

            if (!$user) {
                return $this->errorResponse('User not found');
            }

            // Remove password from response
            unset($user['password']);

            return $this->successResponse('Profile retrieved successfully', [
                'user' => $user
            ]);

        } catch (Exception $e) {
            return $this->errorResponse('Failed to retrieve profile: ' . $e->getMessage());
        }
    }

    /**
     * Update user profile
     */
    public function updateProfile($userId, $updateData) {
        try {
            // Check if user exists
            $currentUser = $this->userRepository->findById($userId);
            if (!$currentUser) {
                return $this->errorResponse('User not found');
            }

            // Validate email if being updated
            if (isset($updateData['email']) && $updateData['email'] !== $currentUser['email']) {
                if ($this->userRepository->emailExists($updateData['email'])) {
                    return $this->errorResponse('Email already exists');
                }
                if (!$this->validationHelper->isValidEmail($updateData['email'])) {
                    return $this->errorResponse('Invalid email format');
                }
            }

            // Validate phone if being updated
            if (isset($updateData['phone_number']) && $updateData['phone_number'] !== $currentUser['phone_number']) {
                if ($this->userRepository->phoneExists($updateData['phone_number'])) {
                    return $this->errorResponse('Phone number already exists');
                }
                if (!$this->validationHelper->isValidPhone($updateData['phone_number'])) {
                    return $this->errorResponse('Invalid phone number format');
                }
            }

            // Hash password if being updated
            if (isset($updateData['password'])) {
                if (!$this->validationHelper->isValidPassword($updateData['password'])) {
                    return $this->errorResponse('Password must be at least 8 characters with uppercase, lowercase, and number');
                }
                $updateData['password'] = password_hash($updateData['password'], PASSWORD_DEFAULT);
            }

            // Update user
            $success = $this->userRepository->update($userId, $updateData);

            if ($success) {
                return $this->successResponse('Profile updated successfully');
            } else {
                return $this->errorResponse('Failed to update profile');
            }

        } catch (Exception $e) {
            return $this->errorResponse('Update failed: ' . $e->getMessage());
        }
    }

    /**
     * Check user existence by different fields
     */
    public function checkUserExists($field, $value) {
        switch ($field) {
            case 'email':
                return $this->userRepository->emailExists($value);
            case 'username':
                return $this->userRepository->usernameExists($value);
            case 'phone':
                return $this->userRepository->phoneExists($value);
            default:
                return false;
        }
    }

    /**
     * Get users by type
     */
    public function getUsersByType($userType) {
        try {
            $users = $this->userRepository->findByUserType($userType);

            // Remove passwords from all users
            $users = array_map(function($user) {
                unset($user['password']);
                return $user;
            }, $users);

            return $this->successResponse('Users retrieved successfully', [
                'users' => $users,
                'count' => count($users)
            ]);

        } catch (Exception $e) {
            return $this->errorResponse('Failed to retrieve users: ' . $e->getMessage());
        }
    }

    /**
     * Get discount percentage for user
     */
    public function getDiscountPercentage($discountType) {
        return $this->validationHelper->getDiscountPercentage($discountType);
    }

    /**
     * Success response format
     */
    private function successResponse($message, $data = null) {
        $response = [
            'status' => 'success',
            'message' => $message
        ];

        if ($data !== null) {
            $response = array_merge($response, $data);
        }

        return $response;
    }

    /**
     * Error response format
     */
    private function errorResponse($message) {
        return [
            'status' => 'error',
            'message' => $message
        ];
    }
}
?>
