<?php

require_once __DIR__ . '/../controllers/Auth0SyncController.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth0_config.php';

// Create database connection
try {
    $pdo = new PDO(
        "mysql:host=127.0.0.1;dbname=lakbai_db;charset=utf8mb4",
        'root',
        '',
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// Initialize controller
$syncController = new Auth0SyncController($pdo);

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
