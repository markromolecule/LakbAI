<?php

/**
 * Authentication Routes
 */

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Bootstrap the application
$app = require_once __DIR__ . '/../bootstrap/app.php';

// Load the AuthController
require_once __DIR__ . '/../controllers/AuthController.php';

// Initialize controller with database connection
$authController = new AuthController($app->get('Database'));

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
        case 'register':
            $result = $authController->register($input);
            response($result);
            break;

        case 'login':
            $result = $authController->login($input);
            response($result);
            break;

        case 'profile':
            if (!isset($input['user_id'])) {
                errorResponse('User ID required for profile action', 400);
            }
            $result = $authController->getProfile($input['user_id']);
            response($result);
            break;

        case 'update_profile':
            if (!isset($input['user_id'])) {
                errorResponse('User ID required for profile update', 400);
            }
            $result = $authController->updateProfile($input['user_id'], $input);
            response($result);
            break;

        case 'check_exists':
            if (!isset($input['field']) || !isset($input['value'])) {
                errorResponse('Field and value required for existence check', 400);
            }
            $result = $authController->checkUserExists($input['field'], $input['value']);
            response($result);
            break;

        case 'get_users_by_type':
            if (!isset($input['user_type'])) {
                errorResponse('User type required', 400);
            }
            $result = $authController->getUsersByType($input['user_type']);
            response($result);
            break;

        default:
            errorResponse('Invalid action: ' . $input['action'], 400);
    }

} catch (Exception $e) {
    errorResponse('Server error: ' . $e->getMessage(), 500);
}
?>