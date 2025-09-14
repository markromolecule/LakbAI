<?php
/**
 * Health check endpoint to verify server is working
 */

// Enhanced CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'CORS preflight OK']);
    exit;
}

// Get server information
$serverInfo = [
    'status' => 'success',
    'message' => 'Server is running',
    'timestamp' => date('Y-m-d H:i:s'),
    'server' => [
        'software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'php_version' => PHP_VERSION,
        'request_method' => $_SERVER['REQUEST_METHOD'],
        'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Unknown',
        'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'Unknown',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
    ],
    'file_paths' => [
        'current_file' => __FILE__,
        'auth0_file_exists' => file_exists(__DIR__ . '/auth0.php'),
        'api_file_exists' => file_exists(__DIR__ . '/api.php'),
        'routes_dir' => __DIR__,
        'project_root' => dirname(__DIR__),
    ],
    'database' => [
        'connection_test' => 'pending'
    ]
];

// Test database connection if possible
try {
    if (file_exists(__DIR__ . '/../bootstrap/app.php')) {
        $app = require_once __DIR__ . '/../bootstrap/app.php';
        if (method_exists($app, 'get') && $app->get('Database')) {
            $db = $app->get('Database');
            if ($db && method_exists($db, 'query')) {
                $result = $db->query('SELECT 1 as test');
                $serverInfo['database']['connection_test'] = 'success';
                $serverInfo['database']['test_result'] = $result->fetch_assoc();
            } else {
                $serverInfo['database']['connection_test'] = 'failed - no query method';
            }
        } else {
            $serverInfo['database']['connection_test'] = 'failed - no database service';
        }
    } else {
        $serverInfo['database']['connection_test'] = 'failed - bootstrap file not found';
    }
} catch (Exception $e) {
    $serverInfo['database']['connection_test'] = 'failed - ' . $e->getMessage();
}

echo json_encode($serverInfo, JSON_PRETTY_PRINT);
