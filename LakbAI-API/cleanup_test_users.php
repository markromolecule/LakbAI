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
    
    // Delete test users (keeping only real users)
    $deleteQuery = "DELETE FROM users WHERE 
                    auth0_id LIKE 'facebook|test%' OR 
                    auth0_id LIKE 'facebook|1865848894337356' OR
                    email LIKE 'facebook_%' OR
                    email = 'user1@gmail.com'";
    
    $stmt = $pdo->prepare($deleteQuery);
    $stmt->execute();
    $deletedCount = $stmt->rowCount();
    
    echo "Deleted {$deletedCount} test user(s)\n";
    
    // Show remaining users
    $remainingUsers = $pdo->query("SELECT id, auth0_id, email, name, created_at FROM users ORDER BY id")->fetchAll();
    
    echo "\nRemaining users in database:\n";
    if (empty($remainingUsers)) {
        echo "No users found\n";
    } else {
        foreach ($remainingUsers as $user) {
            echo "ID: {$user['id']}, Auth0 ID: {$user['auth0_id']}, Email: {$user['email']}, Name: {$user['name']}, Created: {$user['created_at']}\n";
        }
    }
    
    // Reset auto-increment if needed
    if (empty($remainingUsers)) {
        $pdo->exec("ALTER TABLE users AUTO_INCREMENT = 1");
        echo "\nReset auto-increment to 1\n";
    }
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
