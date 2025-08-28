<?php

require_once __DIR__ . '/../src/providers/AppServiceProvider.php';

class Auth0Controller {
    private $authService;
    private $userRepository;
    private $appProvider;

    public function __construct($dbConnection) {
        $this->appProvider = new AppServiceProvider($dbConnection);
        $this->authService = $this->appProvider->get('AuthService');
        $this->userRepository = $this->appProvider->get('UserRepository');
    }

    /**
     * Sync Auth0 user with local database
     */
    public function syncUser($data) {
        try {
            if (!isset($data['auth0_user'])) {
                return $this->errorResponse('Auth0 user data is required');
            }

            $auth0User = $data['auth0_user'];
            
            // Validate required Auth0 fields
            if (!isset($auth0User['sub']) || !isset($auth0User['email'])) {
                return $this->errorResponse('Invalid Auth0 user data');
            }

            // Check if user already exists by Auth0 ID
            $existingUser = $this->userRepository->findByAuth0Id($auth0User['sub']);
            
            if ($existingUser) {
                // Update existing user with Auth0 data
                $updateData = [
                    'email' => $auth0User['email'],
                    'email_verified' => $auth0User['email_verified'] ?? false,
                    'name' => $auth0User['name'] ?? null,
                    'nickname' => $auth0User['nickname'] ?? null,
                    'picture' => $auth0User['picture'] ?? null,
                    'provider' => $auth0User['provider'] ?? 'auth0',
                    'connection' => $auth0User['connection'] ?? 'oauth',
                    'last_active' => date('Y-m-d H:i:s')
                ];

                $this->userRepository->update($existingUser['id'], $updateData);
                
                // Return updated user with profile completion status
                $updatedUser = $this->userRepository->findById($existingUser['id']);
                return $this->successResponse('User synced successfully', [
                    'user' => $updatedUser,
                    'is_new_user' => false,
                    'profile_completed' => $updatedUser['profile_completed'] ?? false
                ]);
            } else {
                // Check if user exists by email
                $existingUserByEmail = $this->userRepository->findByEmail($auth0User['email']);
                
                if ($existingUserByEmail) {
                    // Link existing user to Auth0
                    $updateData = [
                        'auth0_id' => $auth0User['sub'],
                        'email_verified' => $auth0User['email_verified'] ?? false,
                        'name' => $auth0User['name'] ?? null,
                        'nickname' => $auth0User['nickname'] ?? null,
                        'picture' => $auth0User['picture'] ?? null,
                        'provider' => $auth0User['provider'] ?? 'auth0',
                        'connection' => $auth0User['connection'] ?? 'oauth',
                        'last_active' => date('Y-m-d H:i:s')
                    ];

                    $this->userRepository->update($existingUserByEmail['id'], $updateData);
                    
                    // Return updated user with profile completion status
                    $updatedUser = $this->userRepository->findById($existingUserByEmail['id']);
                    return $this->successResponse('User linked to Auth0 successfully', [
                        'user' => $updatedUser,
                        'is_new_user' => false,
                        'profile_completed' => $updatedUser['profile_completed'] ?? false
                    ]);
                } else {
                    // Create new user with Auth0 data
                    $newUserData = [
                        'auth0_id' => $auth0User['sub'],
                        'username' => $this->generateUsername($auth0User['email']),
                        'email' => $auth0User['email'],
                        'email_verified' => $auth0User['email_verified'] ?? false,
                        'name' => $auth0User['name'] ?? null,
                        'nickname' => $auth0User['nickname'] ?? null,
                        'picture' => $auth0User['picture'] ?? null,
                        'provider' => $auth0User['provider'] ?? 'auth0',
                        'connection' => $auth0User['connection'] ?? 'oauth',
                        'password' => password_hash(uniqid(), PASSWORD_DEFAULT), // Generate random password
                        'user_type' => 'passenger', // Default to passenger
                        'roles' => json_encode(['user']),
                        'profile_completed' => false,
                        'created_at' => date('Y-m-d H:i:s'),
                        'updated_at' => date('Y-m-d H:i:s')
                    ];

                    $userId = $this->userRepository->create($newUserData);
                    
                    if ($userId) {
                        $newUser = $this->userRepository->findById($userId);
                        return $this->successResponse('New user created successfully', [
                            'user' => $newUser,
                            'is_new_user' => true,
                            'profile_completed' => false
                        ]);
                    } else {
                        return $this->errorResponse('Failed to create new user');
                    }
                }
            }

        } catch (Exception $e) {
            return $this->errorResponse('User sync failed: ' . $e->getMessage());
        }
    }

    /**
     * Exchange authorization code for tokens
     */
    public function exchangeTokens($data) {
        try {
            if (!isset($data['code']) || !isset($data['code_verifier']) || !isset($data['redirect_uri'])) {
                return $this->errorResponse('Code, code verifier, and redirect URI are required');
            }

            $code = $data['code'];
            $codeVerifier = $data['code_verifier'];
            $redirectUri = $data['redirect_uri'];

            // Auth0 configuration
            $auth0Domain = 'dev-0aaa1azz6qjnlz2l.us.auth0.com';
            $clientId = 'oRukVKxyipmWOeKTcP05u3MshZpk66f5';
            $clientSecret = 'UHWvwWdnWWHlqHapPHRxaM7HZiPAuN-hXlBK1Y3KTqRiQFKeWzctRHCtKA2lAnyi';

            // Prepare token exchange request
            $tokenData = [
                'grant_type' => 'authorization_code',
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'code' => $code,
                'redirect_uri' => $redirectUri,
                'code_verifier' => $codeVerifier
            ];

            // Make request to Auth0
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, "https://{$auth0Domain}/oauth/token");
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenData));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/x-www-form-urlencoded'
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200) {
                return $this->errorResponse('Token exchange failed: ' . $response);
            }

            $tokenResponse = json_decode($response, true);
            
            if (isset($tokenResponse['error'])) {
                return $this->errorResponse('Auth0 error: ' . $tokenResponse['error_description']);
            }

            return $this->successResponse('Token exchange successful', $tokenResponse);

        } catch (Exception $e) {
            return $this->errorResponse('Token exchange failed: ' . $e->getMessage());
        }
    }

    /**
     * Get user profile from Auth0 using access token
     */
    public function getUserProfile($data) {
        try {
            if (!isset($data['access_token'])) {
                return $this->errorResponse('Access token is required');
            }

            $accessToken = $data['access_token'];
            $auth0Domain = 'dev-0aaa1azz6qjnlz2l.us.auth0.com';
            
            // Call Auth0's userinfo endpoint to get user profile
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, "https://{$auth0Domain}/userinfo");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $accessToken,
                'Content-Type: application/json'
            ]);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);

            if ($error) {
                return $this->errorResponse('CURL error: ' . $error);
            }

            if ($httpCode !== 200) {
                return $this->errorResponse('Auth0 API error: HTTP ' . $httpCode . ' - ' . $response);
            }

            $userData = json_decode($response, true);
            if (!$userData) {
                return $this->errorResponse('Invalid response from Auth0');
            }

            return $this->successResponse('User profile retrieved successfully', [
                'user' => $userData
            ]);

        } catch (Exception $e) {
            return $this->errorResponse('Failed to get user profile: ' . $e->getMessage());
        }
    }

    /**
     * Complete user profile after Auth0 authentication
     */
    public function completeProfile($data) {
        try {
            if (!isset($data['profile_data'])) {
                return $this->errorResponse('Profile data is required');
            }

            $profileData = $data['profile_data'];
            $user = null;

            // Try to find user by auth0_id first
            if (isset($data['auth0_id']) && !empty($data['auth0_id'])) {
                $user = $this->userRepository->findByAuth0Id($data['auth0_id']);
            }

            // If not found by auth0_id, try to find by user_id
            if (!$user && isset($data['user_id']) && !empty($data['user_id'])) {
                $user = $this->userRepository->findById($data['user_id']);
            }

            // If still not found, try to find by email
            if (!$user && isset($data['email']) && !empty($data['email'])) {
                $user = $this->userRepository->findByEmail($data['email']);
            }
            
            if (!$user) {
                return $this->errorResponse('User not found');
            }

            // Prepare update data
            $updateData = [
                'first_name' => $profileData['first_name'] ?? null,
                'last_name' => $profileData['last_name'] ?? null,
                'phone_number' => $profileData['phone_number'] ?? null,
                'birthday' => $profileData['birthday'] ?? null,
                'gender' => $profileData['gender'] ?? null,
                'house_number' => $profileData['house_number'] ?? null,
                'street_name' => $profileData['street_name'] ?? null,
                'barangay' => $profileData['barangay'] ?? null,
                'city_municipality' => $profileData['city_municipality'] ?? null,
                'province' => $profileData['province'] ?? null,
                'postal_code' => $profileData['postal_code'] ?? null,
                'user_type' => $profileData['user_type'] ?? 'passenger',
                'profile_completed' => true,
                'updated_at' => date('Y-m-d H:i:s')
            ];

            // Update user profile
            $success = $this->userRepository->update($user['id'], $updateData);
            
            if ($success) {
                $updatedUser = $this->userRepository->findById($user['id']);
                return $this->successResponse('Profile completed successfully', [
                    'user' => $updatedUser
                ]);
            } else {
                return $this->errorResponse('Failed to update profile');
            }

        } catch (Exception $e) {
            return $this->errorResponse('Profile completion failed: ' . $e->getMessage());
        }
    }

    /**
     * Apply for a discount
     */
    public function applyDiscount($data) {
        try {
            if (!isset($data['auth0_id']) || !isset($data['discount_type'])) {
                return $this->errorResponse('Auth0 ID and discount type are required');
            }

            $auth0Id = $data['auth0_id'];
            $discountType = $data['discount_type'];
            $documentPath = $data['document_path'] ?? null;
            $documentName = $data['document_name'] ?? null;

            // Find user by Auth0 ID
            $user = $this->userRepository->findByAuth0Id($auth0Id);
            
            if (!$user) {
                return $this->errorResponse('User not found');
            }

            // Update user with discount information
            $updateData = [
                'discount_type' => $discountType,
                'discount_document_path' => $documentPath,
                'discount_document_name' => $documentName,
                'discount_verified' => false, // Pending admin verification
                'updated_at' => date('Y-m-d H:i:s')
            ];

            $success = $this->userRepository->update($user['id'], $updateData);
            
            if ($success) {
                $updatedUser = $this->userRepository->findById($user['id']);
                return $this->successResponse('Discount application submitted successfully', [
                    'user' => $updatedUser
                ]);
            } else {
                return $this->errorResponse('Failed to submit discount application');
            }

        } catch (Exception $e) {
            return $this->errorResponse('Discount application failed: ' . $e->getMessage());
        }
    }

    /**
     * Get discount status for a user
     */
    public function getDiscountStatus($data) {
        try {
            if (!isset($data['auth0_id'])) {
                return $this->errorResponse('Auth0 ID is required');
            }

            $auth0Id = $data['auth0_id'];

            // Find user by Auth0 ID
            $user = $this->userRepository->findByAuth0Id($auth0Id);
            
            if (!$user) {
                return $this->errorResponse('User not found');
            }

            return $this->successResponse('Discount status retrieved successfully', [
                'user' => $user
            ]);

        } catch (Exception $e) {
            return $this->errorResponse('Failed to get discount status: ' . $e->getMessage());
        }
    }

    /**
     * Generate unique username from email
     */
    private function generateUsername($email) {
        $baseUsername = strtolower(explode('@', $email)[0]);
        $username = $baseUsername;
        $counter = 1;

        while ($this->userRepository->usernameExists($username)) {
            $username = $baseUsername . $counter;
            $counter++;
        }

        return $username;
    }

    /**
     * Success response helper
     */
    private function successResponse($message, $data = []) {
        return [
            'status' => 'success',
            'message' => $message,
            'data' => $data
        ];
    }

    /**
     * Error response helper
     */
    private function errorResponse($message) {
        return [
            'status' => 'error',
            'message' => $message
        ];
    }
}
