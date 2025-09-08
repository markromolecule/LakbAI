<?php

/**
 * Bootstrap file for the LakbAI API
 * This file initializes the application and sets up the service container
 */

// Load database configuration
require_once __DIR__ . '/../config/db.php';

// Load the main service provider
require_once __DIR__ . '/../src/providers/AppServiceProvider.php';

// Initialize the application service provider with the mysqli connection
$app = new AppServiceProvider($conn);

// Also expose PDO for components that expect it
$app->getContainer()->register('PDO', function($container) use ($pdo) {
    return $pdo;
});

// Make the container globally available (optional)
$GLOBALS['app'] = $app;

/**
 * Helper function to get service from container
 */
function app($service = null) {
    global $app;
    
    if ($service === null) {
        return $app;
    }
    
    return $app->get($service);
}

/**
 * Helper function to create response
 */
function response($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

/**
 * Helper function for error responses
 */
function errorResponse($message, $statusCode = 400) {
    response([
        'status' => 'error',
        'message' => $message
    ], $statusCode);
}

/**
 * Helper function for success responses
 */
function successResponse($message, $data = null, $statusCode = 200) {
    $response = [
        'status' => 'success',
        'message' => $message
    ];
    
    if ($data !== null) {
        $response = array_merge($response, $data);
    }
    
    response($response, $statusCode);
}

return $app;
?>
