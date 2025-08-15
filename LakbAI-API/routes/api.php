<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../controllers/AuthController.php';

$auth = new AuthController($conn);

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

// Route handling
try {
    // Auth routes
    if (end($pathParts) === 'register' && $method === 'POST') {
        echo json_encode($auth->register($input));
        exit;
    }
    
    if (end($pathParts) === 'login' && $method === 'POST') {
        echo json_encode($auth->login($input));
        exit;
    }
    
    // Test route
    if (end($pathParts) === 'test' && $method === 'GET') {
        echo json_encode([
            'status' => 'success',
            'message' => 'LakbAI API is working!',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit;
    }
    
    // Route not found
    http_response_code(404);
    echo json_encode([
        'status' => 'error',
        'message' => 'Route not found'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Internal server error: ' . $e->getMessage()
    ]);
}



