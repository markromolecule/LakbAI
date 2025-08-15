<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');
header('Cache-Control: no-cache');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
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
        // Transform mobile data format to API format
        $transformedData = transformMobileRegistrationData($input);
        
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
            'version' => '2.0'
        ]);
        exit;
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
            'GET /test' => 'API test endpoint',
            'POST /debug' => 'Debug endpoint'
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