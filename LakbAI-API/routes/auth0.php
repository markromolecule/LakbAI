<?php
/**
 * Dedicated Auth0 endpoint
 * This avoids complex routing issues with the main API
 */

// Enhanced CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
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

// Bootstrap the application
$app = require_once __DIR__ . '/../bootstrap/app.php';

// Load the Auth0Controller
require_once __DIR__ . '/../controllers/Auth0Controller.php';

// Initialize controller with database connection
$auth0Controller = new Auth0Controller($app->get('Database'));

// Get request data
$input = $_POST;
if (empty($input)) {
    $input = json_decode(file_get_contents('php://input'), true);
}

// Check if action is provided
if (empty($input) || !isset($input['action'])) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'No action provided'
    ]);
    exit;
}

$action = $input['action'];

try {
    switch ($action) {
        case 'token_exchange':
            $result = $auth0Controller->exchangeTokens($input);
            break;
            
        case 'auth0_sync':
            $result = $auth0Controller->syncUser($input);
            break;
            
        case 'complete_profile':
            $result = $auth0Controller->completeProfile($input);
            break;
            
        case 'get_user_profile':
            $result = $auth0Controller->getUserProfile($input);
            break;
            
        case 'apply_discount':
            $result = $auth0Controller->applyDiscount($input);
            break;
            
        case 'get_discount_status':
            $result = $auth0Controller->getDiscountStatus($input);
            break;
            
        case 'get_user_by_auth0_id':
            $result = $auth0Controller->getUserByAuth0Id($input);
            break;
            
        default:
            $result = [
                'status' => 'error',
                'message' => 'Invalid action: ' . $action
            ];
            break;
    }
    
    echo json_encode($result);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
