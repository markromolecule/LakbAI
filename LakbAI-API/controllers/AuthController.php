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