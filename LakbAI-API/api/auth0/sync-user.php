<?php
/**
 * Auth0 User Sync Endpoint
 * This endpoint handles syncing Auth0 users to the MySQL database
 * Matches the endpoint expected by your Auth0 action: /api/auth0/sync-user
 */

// Bootstrap the application
require_once __DIR__ . '/../../bootstrap/app.php';

// Load the Auth0SyncController
require_once __DIR__ . '/../../controllers/Auth0SyncController.php';

// Initialize controller with database connection
$syncController = new Auth0SyncController($app->get('Database'));

// Set CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Auth0-Action');
header('Content-Type: application/json');

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Route: POST /api/auth0/sync-user
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $syncController->syncUser();
    exit;
}

// Route not found
http_response_code(404);
echo json_encode(['error' => 'Route not found']);
?>
