<?php

require_once __DIR__ . '/../src/providers/AppServiceProvider.php';

class AuthController {
    private $authService;
    private $appProvider;

    public function __construct($dbConnection) {
        $this->appProvider = new AppServiceProvider($dbConnection);
        $this->authService = $this->appProvider->get('AuthService');
    }

    /**
     * Handle user registration
     */
    public function register($data) {
        try {
            // Create and validate request
            $request = $this->appProvider->createRegisterRequest($data);
            
            if (!$request->validate()) {
                return $this->validationErrorResponse($request->getErrors());
            }

            // Get validated data for user creation
            $userData = $request->getCreateData();

            // Register user through service
            return $this->authService->register($userData);

        } catch (Exception $e) {
            return $this->errorResponse('Registration failed: ' . $e->getMessage());
        }
    }

    /**
     * Handle user login
     */
    public function login($data) {
        try {
            // Create and validate request
            $request = $this->appProvider->createLoginRequest($data);
            
            if (!$request->validate()) {
                return $this->validationErrorResponse($request->getErrors());
            }

            // Login user through service
            return $this->authService->login(
                $request->getLoginIdentifier(),
                $request->getPassword(),
                $request->isEmailLogin()
            );

        } catch (Exception $e) {
            return $this->errorResponse('Login failed: ' . $e->getMessage());
        }
    }

    /**
     * Get user profile
     */
    public function getProfile($userId) {
        try {
            if (empty($userId)) {
                return $this->errorResponse('User ID is required');
            }

            return $this->authService->getProfile($userId);

        } catch (Exception $e) {
            return $this->errorResponse('Failed to get profile: ' . $e->getMessage());
        }
    }
    /**
     * Update user profile
     */
    public function updateProfile($userId, $data) {
        try {
            if (empty($userId)) {
                return $this->errorResponse('User ID is required');
            }

            return $this->authService->updateProfile($userId, $data);

        } catch (Exception $e) {
            return $this->errorResponse('Failed to update profile: ' . $e->getMessage());
        }
    }

    /**
     * Check if user exists
     */
    public function checkUserExists($field, $value) {
        try {
            $exists = $this->authService->checkUserExists($field, $value);
            
            return [
                'status' => 'success',
                'exists' => $exists
            ];

        } catch (Exception $e) {
            return $this->errorResponse('Failed to check user existence: ' . $e->getMessage());
        }
    }

    /**
     * Get driver information by ID
     */
    public function getDriverInfo($driverId) {
        try {
            if (empty($driverId)) {
                return $this->errorResponse('Driver ID is required');
            }

            // Get driver profile from database
            $driverProfile = $this->authService->getProfile($driverId);
            
            if ($driverProfile['status'] !== 'success') {
                return $this->errorResponse('Driver not found: ' . ($driverProfile['message'] ?? 'Unknown error'));
            }

            $driver = $driverProfile['user'];
            
            // Transform database data to QRDriverInfo format
            $driverInfo = [
                'id' => $driver['id'],
                'name' => $driver['first_name'] . ' ' . $driver['last_name'],
                'license' => $driver['drivers_license_name'] ?? 'N/A',
                'jeepneyNumber' => 'LKB-' . str_pad($driver['id'], 3, '0', STR_PAD_LEFT),
                'jeepneyModel' => 'Toyota Coaster', // Default for now
                'rating' => 4.5, // Default rating
                'totalTrips' => 0, // Will be updated when trip system is implemented
                'route' => $driver['route'] ?? 'N/A',
                'currentLocation' => 'N/A', // Will be updated when location system is implemented
                'contactNumber' => $driver['phone_number'] ?? 'N/A',
                'plateNumber' => 'N/A', // Will be updated when jeepney assignment is implemented
            ];

            return [
                'success' => true,
                'driverInfo' => $driverInfo,
                'message' => 'Driver information retrieved successfully'
            ];

        } catch (Exception $e) {
            return $this->errorResponse('Failed to get driver info: ' . $e->getMessage());
        }
    }

    /**
     * Get users by type (admin function)
     */
    public function getUsersByType($userType) {
        try {
            return $this->authService->getUsersByType($userType);

        } catch (Exception $e) {
            return $this->errorResponse('Failed to get users: ' . $e->getMessage());
        }
    }

    /**
     * Get all users with filtering and pagination (admin function)
     */
    public function getUsers($userType = null, $discountStatus = null, $page = 1, $limit = 10) {
        try {
            return $this->authService->getAllUsers($userType, $discountStatus, $page, $limit);

        } catch (Exception $e) {
            return $this->errorResponse('Failed to get users: ' . $e->getMessage());
        }
    }

    /**
     * Admin update user
     */
    public function adminUpdateUser($userId, $data) {
        try {
            if (empty($userId)) {
                return $this->errorResponse('User ID is required');
            }

            return $this->authService->adminUpdateUser($userId, $data);

        } catch (Exception $e) {
            return $this->errorResponse('Failed to update user: ' . $e->getMessage());
        }
    }

    /**
     * Delete user (admin function)
     */
    public function deleteUser($userId) {
        try {
            if (empty($userId)) {
                return $this->errorResponse('User ID is required');
            }

            return $this->authService->deleteUser($userId);

        } catch (Exception $e) {
            return $this->errorResponse('Failed to delete user: ' . $e->getMessage());
        }
    }

    /**
     * Approve or reject discount application
     */
    public function approveDiscount($userId, $approved, $rejectionReason = null) {
        try {
            if (empty($userId)) {
                return $this->errorResponse('User ID is required');
            }

            return $this->authService->approveDiscount($userId, $approved, $rejectionReason);

        } catch (Exception $e) {
            return $this->errorResponse('Failed to process discount approval: ' . $e->getMessage());
        }
    }

    /**
     * Approve or reject driver license
     */
    public function approveDriverLicense($userId, $approved) {
        try {
            if (empty($userId)) {
                return $this->errorResponse('User ID is required');
            }

            return $this->authService->approveDriverLicense($userId, $approved);

        } catch (Exception $e) {
            return $this->errorResponse('Failed to process license approval: ' . $e->getMessage());
        }
    }

    /**
     * Get pending discount approvals
     */
    public function getPendingApprovals() {
        try {
            return $this->authService->getPendingApprovals();

        } catch (Exception $e) {
            return $this->errorResponse('Failed to get pending approvals: ' . $e->getMessage());
        }
    }

    /**
     * Get all discount applications
     */
    public function getAllDiscountApplications() {
        try {
            return $this->authService->getAllDiscountApplications();

        } catch (Exception $e) {
            return $this->errorResponse('Failed to get discount applications: ' . $e->getMessage());
        }
    }

    /**
     * Get discount status for mobile users
     */
    public function getDiscountStatus($userId) {
        try {
            if (empty($userId)) {
                return $this->errorResponse('User ID is required');
            }

            return $this->authService->getDiscountStatus($userId);

        } catch (Exception $e) {
            return $this->errorResponse('Failed to get discount status: ' . $e->getMessage());
        }
    }

    /**
     * Get user by Auth0 ID
     */
    public function getUserByAuth0Id($auth0Id) {
        try {
            if (empty($auth0Id)) {
                return $this->errorResponse('Auth0 ID is required');
            }

            return $this->authService->getUserByAuth0Id($auth0Id);

        } catch (Exception $e) {
            return $this->errorResponse('Failed to get user by Auth0 ID: ' . $e->getMessage());
        }
    }

    /**
     * Format validation errors for response
     */
    private function validationErrorResponse($errors) {
        $messages = [];
        foreach ($errors as $field => $fieldErrors) {
            $messages[] = implode(', ', $fieldErrors);
        }

        return [
            'status' => 'error',
            'message' => 'Validation failed',
            'errors' => $errors,
            'details' => implode('; ', $messages)
        ];
    }

    /**
     * Standard error response
     */
    private function errorResponse($message) {
        return [
            'status' => 'error',
            'message' => $message
        ];
    }
}
?>