<?php
/**
 * Test script for user type filtering
 * This is for testing purposes only - remove in production
 */

// Set error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h1>LakbAI User Type Filtering Test</h1>";

// Test different user type filters
$testCases = [
    'All Users' => '',
    'Passengers Only' => 'passenger',
    'Drivers Only' => 'driver'
];

foreach ($testCases as $testName => $userType) {
    echo "<h2>Testing: $testName</h2>";
    
    $url = "http://localhost/LakbAI/LakbAI-API/api/admin/users";
    if ($userType) {
        $url .= "?user_type=" . urlencode($userType);
    }
    
    echo "<p>API URL: <code>$url</code></p>";
    
    // Make the API call
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "<p>HTTP Status: <strong>$httpCode</strong></p>";
    
    if ($response) {
        $data = json_decode($response, true);
        
        if ($data && isset($data['status'])) {
            if ($data['status'] === 'success') {
                $users = $data['users'] ?? [];
                $count = count($users);
                
                echo "<p>✅ Success! Found <strong>$count</strong> users</p>";
                
                if ($count > 0) {
                    echo "<h3>User Types Found:</h3>";
                    $typeCounts = [];
                    foreach ($users as $user) {
                        $type = $user['user_type'] ?? 'unknown';
                        $typeCounts[$type] = ($typeCounts[$type] ?? 0) + 1;
                    }
                    
                    foreach ($typeCounts as $type => $count) {
                        echo "<p><strong>$type:</strong> $count users</p>";
                    }
                }
            } else {
                echo "<p>❌ API Error: " . ($data['message'] ?? 'Unknown error') . "</p>";
            }
        } else {
            echo "<p>❌ Invalid JSON response</p>";
            echo "<pre>" . htmlspecialchars($response) . "</pre>";
        }
    } else {
        echo "<p>❌ Failed to get response</p>";
    }
    
    echo "<hr>";
}

echo "<p><small>This is a test script. Remove in production.</small></p>";
?>
