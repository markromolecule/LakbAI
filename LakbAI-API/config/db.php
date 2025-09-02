<?php
// Database configuration
$host = '127.0.0.1';
$user = 'root';          // XAMPP default
$pass = '';              // XAMPP default (empty)
$db   = 'lakbai_db';     // Replace with your database name

// PDO connection string
$dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";

try {
    // Create PDO connection with error handling
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    // Keep mysqli connection for backward compatibility
    $conn = new mysqli($host, $user, $pass, $db);
    
    // Check mysqli connection
    if ($conn->connect_error) {
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }
    
} catch (Exception $e) {
    die(json_encode([
        'status' => 'error',
        'message' => 'Database connection failed: ' . $e->getMessage()
    ]));
}
