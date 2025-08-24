<?php
// List all users with detailed profile information
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

    // Get all users with detailed information
    $stmt = $pdo->query("SELECT id, email, auth0_id, name, first_name, last_name, user_type, phone_number, address, birthday, gender, created_at, updated_at FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll();

    // Decode JSON fields
    foreach ($users as &$user) {
        if ($user['address']) {
            $user['address'] = json_decode($user['address'], true);
        }
        if ($user['roles']) {
            $user['roles'] = json_decode($user['roles'], true);
        }
    }

    echo json_encode([
        'success' => true,
        'total_users' => count($users),
        'users' => $users
    ], JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
