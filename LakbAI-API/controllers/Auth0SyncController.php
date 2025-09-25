<?php

require_once __DIR__ . '/../src/providers/AppServiceProvider.php';

class Auth0SyncController {
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
     * This endpoint is called by Auth0 Actions after user registration/login
     */
    public function syncUser() {
        try {
            // Verify Auth0 Action authentication
            $this->verifyAuth0Action();

            // Get request data
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                $this->errorResponse('Invalid JSON payload', 400);
                return;
            }

            // Extract user data from Auth0 event
            $user = $input['user'] ?? null;
            $event = $input['event'] ?? null;

            if (!$user || !isset($user['user_id'])) {
                $this->errorResponse('Invalid user data: missing user_id', 400);
                return;
            }

            // Check if user already exists by Auth0 ID
            $existingUser = $this->userRepository->findByAuth0Id($user['user_id']);
            
            if ($existingUser) {
                // Update existing user with Auth0 data
                $updateData = [
                    'email' => $user['email'] ?? null,
                    'email_verified' => $user['email_verified'] ?? false,
                    'name' => $user['name'] ?? null,
                    'nickname' => $user['nickname'] ?? null,
                    'provider' => $this->getProvider($user),
                    'connection' => $user['identities'][0]['connection'] ?? 'unknown',
                    'last_active' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ];
                
                // Only update picture if it's still the original Auth0 picture
                // This preserves user-uploaded profile pictures
                $currentPicture = $existingUser['picture'] ?? null;
                $auth0Picture = $user['picture'] ?? null;
                
                // If current picture is the same as Auth0 picture, or if current picture is null/empty,
                // then update with Auth0 picture. Otherwise, preserve the user's uploaded picture.
                if (empty($currentPicture) || $currentPicture === $auth0Picture || 
                    (strpos($currentPicture, 'lh3.googleusercontent.com') !== false && strpos($auth0Picture, 'lh3.googleusercontent.com') !== false)) {
                    $updateData['picture'] = $auth0Picture;
                }
                // If current picture is a user-uploaded file (contains 'uploads/'), don't update it

                $this->userRepository->update($existingUser['id'], $updateData);
                
                $this->successResponse('User synced successfully', [
                    'user_id' => $existingUser['id'],
                    'auth0_id' => $user['user_id'],
                    'is_new_user' => false
                ]);
                return;
            }

            // Check if user exists by email (for linking accounts)
            $existingUserByEmail = null;
            if (!empty($user['email'])) {
                $existingUserByEmail = $this->userRepository->findByEmail($user['email']);
            }
            
            if ($existingUserByEmail) {
                // Link existing user to Auth0
                $updateData = [
                    'auth0_id' => $user['user_id'],
                    'email_verified' => $user['email_verified'] ?? false,
                    'name' => $user['name'] ?? null,
                    'nickname' => $user['nickname'] ?? null,
                    'picture' => $user['picture'] ?? null,
                    'provider' => $this->getProvider($user),
                    'connection' => $user['identities'][0]['connection'] ?? 'unknown',
                    'last_active' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ];

                $this->userRepository->update($existingUserByEmail['id'], $updateData);
                
                $this->successResponse('User linked to Auth0 successfully', [
                    'user_id' => $existingUserByEmail['id'],
                    'auth0_id' => $user['user_id'],
                    'is_new_user' => false
                ]);
                return;
            }

            // Create new user with Auth0 data
            $newUserData = [
                'auth0_id' => $user['user_id'],
                'username' => $this->generateUsername($user['email'] ?? $user['user_id']),
                'email' => $user['email'] ?? null,
                'email_verified' => $user['email_verified'] ?? false,
                'name' => $user['name'] ?? null,
                'nickname' => $user['nickname'] ?? null,
                'picture' => $user['picture'] ?? null,
                'provider' => $this->getProvider($user),
                'connection' => $user['identities'][0]['connection'] ?? 'unknown',
                'password' => password_hash(uniqid(), PASSWORD_DEFAULT), // Generate random password
                'user_type' => 'passenger', // Default to passenger
                'roles' => json_encode(['user']),
                'profile_completed' => 0,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];

            // Create user with Auth0 data
            $userId = $this->userRepository->createWithAuth0($newUserData);
            
            if ($userId) {
                $this->successResponse('New user created successfully', [
                    'user_id' => $userId,
                    'auth0_id' => $user['user_id'],
                    'is_new_user' => true
                ]);
            } else {
                $this->errorResponse('Failed to create new user', 500);
            }

        } catch (Exception $e) {
            error_log('Auth0 Sync Error: ' . $e->getMessage());
            $this->errorResponse('User sync failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Verify that the request is coming from Auth0 Action
     */
    private function verifyAuth0Action() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        $actionHeader = $headers['X-Auth0-Action'] ?? $headers['x-auth0-action'] ?? null;

        // Check for the custom action header or authorization
        if (!$authHeader && !$actionHeader) {
            $this->errorResponse('Unauthorized: Missing Auth0 Action headers', 401);
            exit;
        }

        // Validate the backend API token if present
        if ($authHeader) {
            $token = str_replace('Bearer ', '', $authHeader);
            $expectedToken = 'NYDdY3H1YuNB+yIkkSF9om8Eb1fT/ykDhFwYsucd19A=';
            
            if ($token !== $expectedToken) {
                $this->errorResponse('Unauthorized: Invalid token', 401);
                exit;
            }
        }
    }

    /**
     * Extract provider information from Auth0 user data
     */
    private function getProvider($user) {
        if (isset($user['identities']) && !empty($user['identities'])) {
            $identity = $user['identities'][0];
            return $identity['provider'] ?? 'auth0';
        }
        
        // Fallback: try to determine from user_id
        if (strpos($user['user_id'], 'google-oauth2|') === 0) {
            return 'google-oauth2';
        } elseif (strpos($user['user_id'], 'facebook|') === 0) {
            return 'facebook';
        } elseif (strpos($user['user_id'], 'auth0|') === 0) {
            return 'auth0';
        }
        
        return 'auth0';
    }

    /**
     * Generate unique username from email or Auth0 ID
     */
    private function generateUsername($emailOrId) {
        if (filter_var($emailOrId, FILTER_VALIDATE_EMAIL)) {
            $baseUsername = strtolower(explode('@', $emailOrId)[0]);
        } else {
            // Generate from Auth0 ID
            $baseUsername = 'user_' . substr(md5($emailOrId), 0, 8);
        }
        
        $username = $baseUsername;
        $counter = 1;

        while ($this->userRepository->usernameExists($username)) {
            $username = $baseUsername . $counter;
            $counter++;
        }

        return $username;
    }

    /**
     * Send success response
     */
    private function successResponse($message, $data = []) {
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'message' => $message,
            'data' => $data
        ]);
        exit;
    }

    /**
     * Send error response
     */
    private function errorResponse($message, $statusCode = 400) {
        http_response_code($statusCode);
        echo json_encode([
            'status' => 'error',
            'message' => $message
        ]);
        exit;
    }
}
