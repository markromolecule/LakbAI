<?php
// Simple test script to verify API endpoints are working

// Test the rewrite rules and admin endpoints
echo "<h2>LakbAI API Test</h2>";

echo "<h3>Testing API Endpoints:</h3>";

$base_url = 'http://localhost/LakbAI/LakbAI-API';

$endpoints = [
    'GET /test' => $base_url . '/test',
    'GET /admin/users' => $base_url . '/admin/users',
    'GET /admin/pending-approvals' => $base_url . '/admin/pending-approvals'
];

foreach ($endpoints as $name => $url) {
    echo "<h4>Testing: $name</h4>";
    echo "URL: $url<br>";
    
    try {
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => 'Content-type: application/json',
                'timeout' => 10
            ]
        ]);
        
        $response = file_get_contents($url, false, $context);
        
        if ($response !== false) {
            $data = json_decode($response, true);
            echo "<strong>Status:</strong> ✅ Success<br>";
            echo "<strong>Response:</strong> <pre>" . htmlspecialchars(json_encode($data, JSON_PRETTY_PRINT)) . "</pre>";
        } else {
            echo "<strong>Status:</strong> ❌ Failed to connect<br>";
        }
    } catch (Exception $e) {
        echo "<strong>Status:</strong> ❌ Error: " . htmlspecialchars($e->getMessage()) . "<br>";
    }
    
    echo "<hr>";
}

echo "<h3>URL Rewrite Test:</h3>";
echo "Current REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'not set') . "<br>";
echo "Script Name: " . ($_SERVER['SCRIPT_NAME'] ?? 'not set') . "<br>";
echo "Path Info: " . ($_SERVER['PATH_INFO'] ?? 'not set') . "<br>";
?>

