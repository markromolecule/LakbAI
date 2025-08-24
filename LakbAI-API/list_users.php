<?php
// List all users with their IDs
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    // Connect to database
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
    
    // Get all users
    $stmt = $pdo->query("SELECT id, email, auth0_id, name, user_type, created_at FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'total_users' => count($users),
        'users' => $users
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
