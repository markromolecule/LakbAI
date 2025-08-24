<?php
require_once __DIR__ . '/config/db.php';

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
    
    echo "Connected to database successfully\n";
    
    // Delete users with specific auth0_id or email
    $deleteQuery = "DELETE FROM users WHERE auth0_id = ? OR email = ?";
    $stmt = $pdo->prepare($deleteQuery);
    
    // Delete the test user
    $auth0Id = "google-oauth2|117636535362428471444";
    $email = "livadomark@gmail.com";
    
    $stmt->execute([$auth0Id, $email]);
    $deletedCount = $stmt->rowCount();
    
    echo "Deleted {$deletedCount} user(s) with auth0_id: {$auth0Id} or email: {$email}\n";
    
    // Show remaining users
    $remainingUsers = $pdo->query("SELECT id, auth0_id, email, name, created_at FROM users ORDER BY id DESC LIMIT 10")->fetchAll();
    
    echo "\nRemaining users:\n";
    foreach ($remainingUsers as $user) {
        echo "ID: {$user['id']}, Auth0 ID: {$user['auth0_id']}, Email: {$user['email']}, Name: {$user['name']}, Created: {$user['created_at']}\n";
    }
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
