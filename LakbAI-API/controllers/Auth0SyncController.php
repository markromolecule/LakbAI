<?php

class Auth0SyncController {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    /**
     * Sync Auth0 user to MySQL database
     */
    public function syncUser() {
        try {
            // Verify the request is from Auth0 Action
            $this->verifyAuth0Request();
            
            // Get JSON input
            $input = json_decode(file_get_contents('php://input'), true);
            
            
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid JSON input']);
                return;
            }
            
            // Validate required fields
            $requiredFields = ['email'];
            foreach ($requiredFields as $field) {
                if (empty($input[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => "Missing required field: {$field}"]);
                    return;
                }
            }
            
                    // Handle missing auth0_id - try to generate one or use email as fallback
        if (empty($input['auth0_id'])) {
            $input['auth0_id'] = 'auth0|' . md5($input['email']) . '|' . time();
        }
            
            // Check if user already exists
            $existingUser = $this->getUserByAuth0Id($input['auth0_id']);
            
            if ($existingUser) {
                // Update existing user
                $userId = $this->updateUser($input);
                $action = 'updated';
            } else {
                // Create new user
                $userId = $this->createUser($input);
                $action = 'created';
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'action' => $action,
                'user_id' => $userId,
                'auth0_id' => $input['auth0_id']
            ]);
            
        } catch (Exception $e) {
            error_log("Auth0 Sync Error: " . $e->getMessage());
            error_log("Auth0 Sync Stack Trace: " . $e->getTraceAsString());
            http_response_code(500);
            echo json_encode([
                'error' => 'Internal server error',
                'debug_message' => $e->getMessage(),
                'debug_file' => $e->getFile(),
                'debug_line' => $e->getLine()
            ]);
        }
    }
    
    /**
     * Verify request is from Auth0 Action or authenticated frontend
     */
    private function verifyAuth0Request() {
        $headers = getallheaders();
        
        // Handle case-insensitive header names
        $authHeader = '';
        $actionHeader = '';
        $userSyncHeader = '';
        
        foreach ($headers as $key => $value) {
            $lowerKey = strtolower($key);
            switch ($lowerKey) {
                case 'authorization':
                    $authHeader = $value;
                    break;
                case 'x-auth0-action':
                    $actionHeader = $value;
                    break;
                case 'x-user-sync':
                    $userSyncHeader = $value;
                    break;
            }
        }
        

        
        // Check if it's from Auth0 Action
        if ($actionHeader === 'post-user-registration') {
            $expectedToken = defined('BACKEND_API_TOKEN') ? BACKEND_API_TOKEN : 'your-secure-token';
            if ($authHeader !== "Bearer {$expectedToken}") {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized - Invalid Auth0 Action token']);
                exit;
            }
            return;
        }
        
        // Check if it's from frontend (mobile app)
        if ($userSyncHeader === 'frontend-triggered') {
            // For frontend calls, we accept any Auth0 access token
            // In production, you might want to verify the Auth0 token
            if (empty($authHeader) || !str_starts_with($authHeader, 'Bearer ')) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized - Missing or invalid token']);
                exit;
            }
            return;
        }
        
        // Neither Auth0 Action nor frontend sync
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized - Invalid request source']);
        exit;
    }
    
    /**
     * Get user by Auth0 ID
     */
    private function getUserByAuth0Id($auth0Id) {
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE auth0_id = ?");
        $stmt->execute([$auth0Id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Convert birthday string to proper date format
     */
    private function formatBirthday($birthdayString) {
        if (empty($birthdayString)) {
            return null;
        }
        
        // Try to parse the birthday string
        $date = DateTime::createFromFormat('F j, Y', $birthdayString);
        if ($date) {
            return $date->format('Y-m-d');
        }
        
        // Try alternative formats
        $date = DateTime::createFromFormat('M j, Y', $birthdayString);
        if ($date) {
            return $date->format('Y-m-d');
        }
        
        // If all parsing fails, return null
        return null;
    }
    
    /**
     * Create new user in database
     */
    private function createUser($userData) {
        $sql = "INSERT INTO users (
            auth0_id, email, email_verified, name, first_name, last_name, nickname, picture, provider, 
            connection, user_type, roles, phone_number, house_number, street_name, barangay, city_municipality, 
            province, postal_code, birthday, gender, created_at, updated_at
        ) VALUES (
            :auth0_id, :email, :email_verified, :name, :first_name, :last_name, :nickname, :picture, :provider,
            :connection, :user_type, :roles, :phone_number, :house_number, :street_name, :barangay, :city_municipality,
            :province, :postal_code, :birthday, :gender, :created_at, NOW()
        )";
        
        $stmt = $this->pdo->prepare($sql);
        
        // Extract address fields from JSON or use individual fields
        $address = $userData['address'] ?? [];
        if (is_string($address)) {
            $address = json_decode($address, true) ?? [];
        }
        
        $params = [
            ':auth0_id' => $userData['auth0_id'],
            ':email' => $userData['email'],
            ':email_verified' => isset($userData['email_verified']) && $userData['email_verified'] ? 1 : 0,
            ':name' => $userData['name'] ?? '',
            ':first_name' => $userData['first_name'] ?? null,
            ':last_name' => $userData['last_name'] ?? null,
            ':nickname' => $userData['nickname'] ?? $userData['name'] ?? '',
            ':picture' => $userData['picture'] ?? null,
            ':provider' => $userData['provider'] ?? 'auth0',
            ':connection' => $userData['connection'] ?? null,
            ':user_type' => $userData['user_type'] ?? 'passenger',
            ':roles' => json_encode($userData['roles'] ?? ['passenger']),
            ':phone_number' => $userData['phone_number'] ?? null,
            ':house_number' => $address['house_number'] ?? $userData['house_number'] ?? null,
            ':street_name' => $address['street_name'] ?? $userData['street_name'] ?? null,
            ':barangay' => $address['barangay'] ?? $userData['barangay'] ?? null,
            ':city_municipality' => $address['city_municipality'] ?? $userData['city_municipality'] ?? null,
            ':province' => $address['province'] ?? $userData['province'] ?? null,
            ':postal_code' => $address['postal_code'] ?? $userData['postal_code'] ?? null,
            ':birthday' => $this->formatBirthday($userData['birthday'] ?? null),
            ':gender' => $userData['gender'] ?? null,
            ':created_at' => $userData['created_at'] ?? date('Y-m-d H:i:s')
        ];
        
        $stmt->execute($params);
        return $this->pdo->lastInsertId();
    }
    
    /**
     * Update existing user in database
     */
    private function updateUser($userData) {
        $sql = "UPDATE users SET 
            username = :username,
            email = :email,
            email_verified = :email_verified,
            name = :name,
            first_name = :first_name,
            last_name = :last_name,
            nickname = :nickname,
            picture = :picture,
            provider = :provider,
            connection = :connection,
            user_type = :user_type,
            roles = :roles,
            phone_number = :phone_number,
            house_number = :house_number,
            street_name = :street_name,
            barangay = :barangay,
            city_municipality = :city_municipality,
            province = :province,
            postal_code = :postal_code,
            birthday = :birthday,
            gender = :gender,
            updated_at = NOW()
        WHERE auth0_id = :auth0_id";
        
        $stmt = $this->pdo->prepare($sql);
        
        // Extract address fields from JSON or use individual fields
        $address = $userData['address'] ?? [];
        if (is_string($address)) {
            $address = json_decode($address, true) ?? [];
        }
        
        $params = [
            ':auth0_id' => $userData['auth0_id'],
            ':username' => $userData['email'], // Use email as username
            ':email' => $userData['email'],
            ':email_verified' => isset($userData['email_verified']) && $userData['email_verified'] ? 1 : 0,
            ':name' => $userData['name'] ?? '',
            ':first_name' => $userData['first_name'] ?? null,
            ':last_name' => $userData['last_name'] ?? null,
            ':nickname' => $userData['nickname'] ?? $userData['name'] ?? '',
            ':picture' => $userData['picture'] ?? null,
            ':provider' => $userData['provider'] ?? 'auth0',
            ':connection' => $userData['connection'] ?? null,
            ':user_type' => $userData['user_type'] ?? 'passenger',
            ':roles' => json_encode($userData['roles'] ?? ['passenger']),
            ':phone_number' => $userData['phone_number'] ?? null,
            ':house_number' => $address['house_number'] ?? $userData['house_number'] ?? null,
            ':street_name' => $address['street_name'] ?? $userData['street_name'] ?? null,
            ':barangay' => $address['barangay'] ?? $userData['barangay'] ?? null,
            ':city_municipality' => $address['city_municipality'] ?? $userData['city_municipality'] ?? null,
            ':province' => $address['province'] ?? $userData['province'] ?? null,
            ':postal_code' => $address['postal_code'] ?? $userData['postal_code'] ?? null,
            ':birthday' => $this->formatBirthday($userData['birthday'] ?? null),
            ':gender' => $userData['gender'] ?? null
        ];
        
        $stmt->execute($params);
        
        // Get the user ID
        $user = $this->getUserByAuth0Id($userData['auth0_id']);
        return $user['id'];
    }
}
