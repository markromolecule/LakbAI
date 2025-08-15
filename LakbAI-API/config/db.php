<?php
// Database configuration
$host = '127.0.0.1';
$user = 'root';          // XAMPP default
$pass = '';              // XAMPP default (empty)
$db   = 'lakbai_db';     // Replace with your database name

// Connect to MySQL
$conn = new mysqli($host, $user, $pass, $db);

// Check connection
if ($conn->connect_error) {
    die(json_encode([
        'status' => 'error',
        'message' => 'Database connection failed: ' . $conn->connect_error
    ]));
}
