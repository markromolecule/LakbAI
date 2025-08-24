<?php
// Enhanced CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept, X-Requested-With');
header('Access-Control-Allow-Credentials: false');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'CORS preflight OK']);
    exit;
}

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Bootstrap the application with new architecture
$app = require_once __DIR__ . '/../bootstrap/app.php';
require_once __DIR__ . '/../controllers/AuthController.php';

// Initialize controller with database connection
$authController = new AuthController($app->get('Database'));

// Get the request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Remove the base path parts (LakbAI/LakbAI-API) to get the actual API path
$apiBaseParts = ['LakbAI', 'LakbAI-API'];
$actualPathParts = array_slice($pathParts, count($apiBaseParts));

// Debug logging (remove in production)
error_log("API Request - Method: $method, Path: $path");
error_log("PathParts: " . json_encode($pathParts));
error_log("ActualPathParts: " . json_encode($actualPathParts));

// Use the actual path parts for routing
$pathParts = $actualPathParts;

// Get request data
$input = [];
if ($method === 'POST' || $method === 'PUT') {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    
    if (strpos($contentType, 'application/json') !== false) {
        $input = json_decode(file_get_contents('php://input'), true);
    } else {
        $input = $_POST;
    }
}

/**
 * Transform mobile app data to API format
 */
function transformMobileRegistrationData($mobileData) {
    // Convert mobile app field names to API field names
    $transformed = [];
    
    // Basic fields
    $transformed['username'] = $mobileData['username'] ?? '';
    $transformed['email'] = $mobileData['email'] ?? '';
    $transformed['password'] = $mobileData['password'] ?? '';
    $transformed['first_name'] = $mobileData['firstName'] ?? '';
    $transformed['last_name'] = $mobileData['lastName'] ?? '';
    $transformed['phone_number'] = $mobileData['phoneNumber'] ?? '';
    $transformed['gender'] = ucfirst(strtolower($mobileData['gender'] ?? ''));
    
    // Address fields
    $transformed['house_number'] = $mobileData['houseNumber'] ?? '';
    $transformed['street_name'] = $mobileData['streetName'] ?? '';
    $transformed['barangay'] = $mobileData['barangay'] ?? '';
    $transformed['city_municipality'] = $mobileData['cityMunicipality'] ?? '';
    $transformed['province'] = $mobileData['province'] ?? '';
    $transformed['postal_code'] = $mobileData['postalCode'] ?? '';
    
    // Birthday conversion from separate fields
    if (isset($mobileData['birthMonth'], $mobileData['birthDate'], $mobileData['birthYear'])) {
        $monthMap = [
            'January' => '01', 'February' => '02', 'March' => '03', 'April' => '04',
            'May' => '05', 'June' => '06', 'July' => '07', 'August' => '08',
            'September' => '09', 'October' => '10', 'November' => '11', 'December' => '12'
        ];
        
        $month = $monthMap[$mobileData['birthMonth']] ?? '01';
        $day = str_pad($mobileData['birthDate'], 2, '0', STR_PAD_LEFT);
        $year = $mobileData['birthYear'];
        
        $transformed['birthday'] = "$year-$month-$day";
    }
    
    // User type and discount
    $transformed['user_type'] = 'passenger'; // Default for mobile registration
    
    // Handle discount information
    if (isset($mobileData['fareDiscount']) && $mobileData['fareDiscount']['type']) {
        $transformed['discount_type'] = $mobileData['fareDiscount']['type'];
        
        // Handle document upload (for now, just store the name)
        if (isset($mobileData['fareDiscount']['document'])) {
            $transformed['discount_document_name'] = $mobileData['fareDiscount']['document']['name'] ?? null;
            // Note: File upload handling would need additional implementation
            $transformed['discount_document_path'] = null; // Will be handled separately
        }
    }
    
    return $transformed;
}

// Route handling
try {
    // Auth routes
    if (end($pathParts) === 'register' && $method === 'POST') {
        // Check if this is web registration (already in correct format) or mobile
        $isWebRegistration = isset($input['first_name']) && isset($input['last_name']) && isset($input['phone_number']);
        
        if ($isWebRegistration) {
            // Web registration - data is already in correct format
            $transformedData = $input;
        } else {
            // Mobile registration - transform data format
            $transformedData = transformMobileRegistrationData($input);
        }
        
        $result = $authController->register($transformedData);
        echo json_encode($result);
        exit;
    }
    
    if (end($pathParts) === 'login' && $method === 'POST') {
        $result = $authController->login($input);
        echo json_encode($result);
        exit;
    }
    
    // Profile routes
    if (end($pathParts) === 'profile' && $method === 'GET') {
        $userId = $_GET['user_id'] ?? null;
        if (!$userId) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'User ID required']);
            exit;
        }
        
        $result = $authController->getProfile($userId);
        echo json_encode($result);
        exit;
    }

    // Get discount status for mobile users
    if (end($pathParts) === 'discount-status' && $method === 'GET') {
        $userId = $_GET['user_id'] ?? null;
        if (!$userId) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'User ID required']);
            exit;
        }
        
        $result = $authController->getDiscountStatus($userId);
        echo json_encode($result);
        exit;
    }
    
    if (end($pathParts) === 'profile' && $method === 'PUT') {
        $userId = $input['user_id'] ?? null;
        if (!$userId) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'User ID required']);
            exit;
        }
        
        $result = $authController->updateProfile($userId, $input);
        echo json_encode($result);
        exit;
    }
    
    // Check user existence
    if (end($pathParts) === 'check-exists' && $method === 'POST') {
        $field = $input['field'] ?? null;
        $value = $input['value'] ?? null;
        
        if (!$field || !$value) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Field and value required']);
            exit;
        }
        
        $result = $authController->checkUserExists($field, $value);
        echo json_encode($result);
        exit;
    }
    
    // Test route
    if (end($pathParts) === 'test' && $method === 'GET') {
        echo json_encode([
            'status' => 'success',
            'message' => 'LakbAI API is working with clean architecture!',
            'timestamp' => date('Y-m-d H:i:s'),
            'version' => '2.0',
            'debug' => [
                'method' => $method,
                'path' => $path,
                'pathParts' => $pathParts
            ]
        ]);
        exit;
    }

    // Health check route
    if (empty($pathParts) || $pathParts[0] === '' && $method === 'GET') {
        echo json_encode([
            'status' => 'success',
            'message' => 'LakbAI API is running',
            'timestamp' => date('Y-m-d H:i:s'),
            'endpoints' => [
                'GET /test' => 'API test endpoint',
                'GET /admin/users' => 'Get all users (admin)',
                'GET /admin/pending-approvals' => 'Get pending approvals',
                'POST /register' => 'User registration',
                'POST /login' => 'User login'
            ]
        ]);
        exit;
    }
    
    // Admin user management routes
    if ($pathParts[0] === 'admin' && count($pathParts) >= 2) {
        // Get all users with filtering
        if ($pathParts[1] === 'users' && $method === 'GET') {
            $userType = $_GET['user_type'] ?? null;
            $discountStatus = $_GET['discount_status'] ?? null;
            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 10;
            
            $result = $authController->getUsers($userType, $discountStatus, $page, $limit);
            echo json_encode($result);
            exit;
        }
        
        // Update user (admin action)
        if ($pathParts[1] === 'users' && isset($pathParts[2]) && $method === 'PUT') {
            $userId = $pathParts[2];
            $result = $authController->adminUpdateUser($userId, $input);
            echo json_encode($result);
            exit;
        }
        
        // Delete user (admin action)
        if ($pathParts[1] === 'users' && isset($pathParts[2]) && $method === 'DELETE') {
            $userId = $pathParts[2];
            $result = $authController->deleteUser($userId);
            echo json_encode($result);
            exit;
        }
        
        // Approve discount application
        if ($pathParts[1] === 'approve-discount' && $method === 'POST') {
            $userId = $input['user_id'] ?? null;
            $approved = $input['approved'] ?? false;
            $result = $authController->approveDiscount($userId, $approved);
            echo json_encode($result);
            exit;
        }

        // Approve driver license
        if ($pathParts[1] === 'approve-license' && $method === 'POST') {
            $userId = $input['user_id'] ?? null;
            $approved = $input['approved'] ?? false;
            $result = $authController->approveDriverLicense($userId, $approved);
            echo json_encode($result);
            exit;
        }
        
        // Get pending approvals
        if ($pathParts[1] === 'pending-approvals' && $method === 'GET') {
            $result = $authController->getPendingApprovals();
            echo json_encode($result);
            exit;
        }

        // Get all discount applications
        if ($pathParts[1] === 'discount-applications' && $method === 'GET') {
            $result = $authController->getAllDiscountApplications();
            echo json_encode($result);
            exit;
        }

        // Serve documents
        if ($pathParts[1] === 'documents' && isset($pathParts[2]) && $method === 'GET') {
            $documentPath = $pathParts[2];
            $fullPath = __DIR__ . '/../uploads/' . $documentPath;
            
            if (file_exists($fullPath) && is_readable($fullPath)) {
                $fileInfo = pathinfo($fullPath);
                $extension = strtolower($fileInfo['extension']);
                
                // Set appropriate content type
                $contentTypes = [
                    'jpg' => 'image/jpeg',
                    'jpeg' => 'image/jpeg',
                    'png' => 'image/png',
                    'pdf' => 'application/pdf'
                ];
                
                $contentType = $contentTypes[$extension] ?? 'application/octet-stream';
                
                header('Content-Type: ' . $contentType);
                header('Content-Disposition: inline; filename="' . $fileInfo['basename'] . '"');
                header('Content-Length: ' . filesize($fullPath));
                header('Cache-Control: public, max-age=3600');
                
                readfile($fullPath);
                exit;
            } else {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'Document not found']);
                exit;
            }
        }
    }

    // Route not found
    http_response_code(404);
    echo json_encode([
        'status' => 'error',
        'message' => 'Route not found',
        'available_routes' => [
            'POST /register' => 'User registration',
            'POST /login' => 'User login',
            'GET /profile?user_id=X' => 'Get user profile',
            'PUT /profile' => 'Update user profile',
            'POST /check-exists' => 'Check if user exists',
            'GET /admin/users' => 'Get all users (admin)',
            'PUT /admin/users/{id}' => 'Update user (admin)',
            'DELETE /admin/users/{id}' => 'Delete user (admin)',
            'POST /admin/approve-discount' => 'Approve discount application',
            'POST /admin/approve-license' => 'Approve driver license',
            'GET /admin/pending-approvals' => 'Get pending approvals',
            'GET /test' => 'API test endpoint'
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Internal server error: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>