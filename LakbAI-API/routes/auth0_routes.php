<?php

/**
 * Auth0 Integration Routes
 */

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
    errorResponse('No action provided', 400);
}

$action = strtolower($input['action']);

try {
    switch ($action) {
        case 'token_exchange':
            $result = $auth0Controller->exchangeTokens($input);
            response($result);
            break;

        case 'auth0_sync':
            $result = $auth0Controller->syncUser($input);
            response($result);
            break;

        case 'complete_profile':
            $result = $auth0Controller->completeProfile($input);
            response($result);
            break;

        default:
            errorResponse('Invalid action: ' . $action, 400);
            break;
    }
} catch (Exception $e) {
    errorResponse('Server error: ' . $e->getMessage(), 500);
}

/**
 * Send JSON response
 */
function response($data) {
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

/**
 * Send error response
 */
function errorResponse($message, $statusCode = 400) {
    http_response_code($statusCode);
    response([
        'status' => 'error',
        'message' => $message
    ]);
}
