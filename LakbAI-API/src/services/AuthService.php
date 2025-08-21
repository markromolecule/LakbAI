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
     * Get all users with filtering and pagination (admin function)
     */
    public function getAllUsers($userType = null, $discountStatus = null, $page = 1, $limit = 10) {
        try {
            $users = $this->userRepository->getAllUsers($userType, $discountStatus, $page, $limit);
            $totalUsers = $this->userRepository->countUsers($userType, $discountStatus);

            // Remove passwords from all users
            $users = array_map(function($user) {
                unset($user['password']);
                return $user;
            }, $users);

            return $this->successResponse('Users retrieved successfully', [
                'users' => $users,
                'pagination' => [
                    'current_page' => (int)$page,
                    'per_page' => (int)$limit,
                    'total' => $totalUsers,
                    'total_pages' => ceil($totalUsers / $limit)
                ]
            ]);

        } catch (Exception $e) {
            return $this->errorResponse('Failed to retrieve users: ' . $e->getMessage());
        }
    }

    /**
     * Admin update user - allows updating any field
     */
    public function adminUpdateUser($userId, $updateData) {
        try {
            // Check if user exists
            $currentUser = $this->userRepository->findById($userId);
            if (!$currentUser) {
                return $this->errorResponse('User not found');
            }

            // Validate email if being updated and changed
            if (isset($updateData['email']) && $updateData['email'] !== $currentUser['email']) {
                if ($this->userRepository->emailExists($updateData['email'])) {
                    return $this->errorResponse('Email already exists');
                }
                if (!$this->validationHelper->isValidEmail($updateData['email'])) {
                    return $this->errorResponse('Invalid email format');
                }
            }

            // Validate phone if being updated and changed
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
                return $this->successResponse('User updated successfully');
            } else {
                return $this->errorResponse('Failed to update user');
            }

        } catch (Exception $e) {
            return $this->errorResponse('Update failed: ' . $e->getMessage());
        }
    }

    /**
     * Delete user (admin function)
     */
    public function deleteUser($userId) {
        try {
            // Check if user exists
            $user = $this->userRepository->findById($userId);
            if (!$user) {
                return $this->errorResponse('User not found');
            }

            $success = $this->userRepository->delete($userId);

            if ($success) {
                return $this->successResponse('User deleted successfully');
            } else {
                return $this->errorResponse('Failed to delete user');
            }

        } catch (Exception $e) {
            return $this->errorResponse('Delete failed: ' . $e->getMessage());
        }
    }

    /**
     * Approve or reject discount application
     */
    public function approveDiscount($userId, $approved) {
        try {
            $user = $this->userRepository->findById($userId);
            if (!$user) {
                return $this->errorResponse('User not found');
            }

            if (!$user['discount_type']) {
                return $this->errorResponse('User has no discount application');
            }

            if ($approved) {
                // Approve: set discount_verified = 1
                $updateData = [
                    'discount_verified' => 1
                ];
                $message = 'Discount application approved';
            } else {
                // Reject: set discount_verified = -1 (rejected status)
                $updateData = [
                    'discount_verified' => -1
                ];
                $message = 'Discount application rejected';
            }

            $success = $this->userRepository->update($userId, $updateData);

            if ($success) {
                return $this->successResponse($message);
            } else {
                return $this->errorResponse('Failed to update discount status');
            }

        } catch (Exception $e) {
            return $this->errorResponse('Approval failed: ' . $e->getMessage());
        }
    }

    /**
     * Approve or reject driver license
     */
    public function approveDriverLicense($userId, $approved) {
        try {
            $user = $this->userRepository->findById($userId);
            if (!$user) {
                return $this->errorResponse('User not found');
            }

            if ($user['user_type'] !== 'driver') {
                return $this->errorResponse('User is not a driver');
            }

            if ($approved) {
                // Approve: set drivers_license_verified = 1
                $updateData = [
                    'drivers_license_verified' => 1
                ];
                $message = 'Driver license verified successfully';
            } else {
                // Reject: set drivers_license_verified = -1 (rejected status)
                $updateData = [
                    'drivers_license_verified' => -1
                ];
                $message = 'Driver license rejected successfully';
            }

            $success = $this->userRepository->update($userId, $updateData);

            if ($success) {
                return $this->successResponse($message);
            } else {
                return $this->errorResponse('Failed to update license status');
            }

        } catch (Exception $e) {
            return $this->errorResponse('License approval failed: ' . $e->getMessage());
        }
    }

    /**
     * Get pending discount approvals
     */
    public function getPendingApprovals() {
        try {
            $pendingUsers = $this->userRepository->findUsersWithPendingDiscounts();

            // Remove passwords from all users
            $pendingUsers = array_map(function($user) {
                unset($user['password']);
                return $user;
            }, $pendingUsers);

            return $this->successResponse('Pending approvals retrieved successfully', [
                'users' => $pendingUsers,
                'count' => count($pendingUsers)
            ]);

        } catch (Exception $e) {
            return $this->errorResponse('Failed to retrieve pending approvals: ' . $e->getMessage());
        }
    }

    /**
     * Get all discount applications (pending, approved, rejected)
     */
    public function getAllDiscountApplications() {
        try {
            $allUsers = $this->userRepository->findUsersWithDiscounts();

            // Remove passwords from all users
            $allUsers = array_map(function($user) {
                unset($user['password']);
                return $user;
            }, $allUsers);

            return $this->successResponse('All discount applications retrieved successfully', [
                'users' => $allUsers,
                'count' => count($allUsers)
            ]);

        } catch (Exception $e) {
            return $this->errorResponse('Failed to retrieve discount applications: ' . $e->getMessage());
        }
    }

    /**
     * Get discount status for mobile users
     */
    public function getDiscountStatus($userId) {
        try {
            $user = $this->userRepository->findById($userId);
            if (!$user) {
                return $this->errorResponse('User not found');
            }

            // Determine discount status
            $discountStatus = 'none';
            $discountMessage = 'No discount application submitted';
            $canApplyDiscount = true;

            if ($user['discount_type']) {
                if ($user['discount_verified'] === 1) {
                    $discountStatus = 'approved';
                    $discountMessage = "Your {$user['discount_type']} discount has been approved and is active";
                    $canApplyDiscount = false;
                } elseif ($user['discount_verified'] === -1) {
                    $discountStatus = 'rejected';
                    $discountMessage = "Your {$user['discount_type']} discount application was rejected. You can apply again.";
                    $canApplyDiscount = true;
                } else {
                    $discountStatus = 'pending';
                    $discountMessage = "Your {$user['discount_type']} discount application is under review";
                    $canApplyDiscount = false;
                }
            }

            return $this->successResponse('Discount status retrieved successfully', [
                'user_id' => $userId,
                'discount_status' => $discountStatus,
                'discount_type' => $user['discount_type'],
                'discount_verified' => (bool)$user['discount_verified'],
                'discount_message' => $discountMessage,
                'can_apply_discount' => $canApplyDiscount,
                'document_submitted' => !empty($user['discount_document_name']),
                'application_date' => $user['discount_type'] ? $user['updated_at'] : null
            ]);

        } catch (Exception $e) {
            return $this->errorResponse('Failed to retrieve discount status: ' . $e->getMessage());
        }
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
