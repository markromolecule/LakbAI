<?php
// Database configuration: provide BOTH mysqli (legacy) and PDO (new)
$host = '127.0.0.1';
$user = 'root';          // XAMPP default
$pass = '';              // XAMPP default (empty)
$db   = 'lakbai_db';     // Replace with your database name

// 1) Legacy mysqli connection (expected by repositories/Auth flows)
$conn = @new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    die(json_encode([
        'status' => 'error',
        'message' => 'Database connection failed (mysqli): ' . $conn->connect_error
    ]));
}

// 2) PDO connection (expected by new controllers)
try {
    $dsn = "mysql:host={$host};dbname={$db};charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    die(json_encode([
        'status' => 'error',
        'message' => 'Database connection failed (PDO): ' . $e->getMessage()
    ]));
}

