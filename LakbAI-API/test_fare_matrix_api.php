<?php
/**
 * Fare Matrix API Test Script
 * 
 * This script tests the fare matrix API endpoints to ensure they're working correctly
 */

// Test configuration
$baseUrl = 'http://localhost/LakbAI/LakbAI-API/routes/api.php';
$testResults = [];

function makeRequest($url, $method = 'GET', $data = null) {
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    return [
        'http_code' => $httpCode,
        'response' => $response,
        'error' => $error
    ];
}

function testEndpoint($name, $url, $method = 'GET', $data = null) {
    global $testResults;
    
    echo "🧪 Testing: $name\n";
    echo "   URL: $url\n";
    echo "   Method: $method\n";
    
    $result = makeRequest($url, $method, $data);
    
    if ($result['error']) {
        echo "   ❌ cURL Error: " . $result['error'] . "\n";
        $testResults[] = ['name' => $name, 'status' => 'error', 'message' => $result['error']];
        return;
    }
    
    if ($result['http_code'] !== 200) {
        echo "   ❌ HTTP Error: " . $result['http_code'] . "\n";
        $testResults[] = ['name' => $name, 'status' => 'error', 'message' => "HTTP $result[http_code]"];
        return;
    }
    
    $responseData = json_decode($result['response'], true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo "   ❌ JSON Parse Error: " . json_last_error_msg() . "\n";
        echo "   Raw Response: " . substr($result['response'], 0, 200) . "...\n";
        $testResults[] = ['name' => $name, 'status' => 'error', 'message' => 'Invalid JSON response'];
        return;
    }
    
    if (isset($responseData['status']) && $responseData['status'] === 'success') {
        echo "   ✅ Success\n";
        if (isset($responseData['fare_info'])) {
            echo "   💰 Fare: ₱" . $responseData['fare_info']['fare_amount'] . "\n";
        }
        if (isset($responseData['fare_matrices'])) {
            echo "   📊 Routes: " . count($responseData['fare_matrices']) . "\n";
        }
        if (isset($responseData['created_entries'])) {
            echo "   📝 Created: " . $responseData['created_entries'] . " entries\n";
        }
        $testResults[] = ['name' => $name, 'status' => 'success', 'data' => $responseData];
    } else {
        echo "   ❌ API Error: " . ($responseData['message'] ?? 'Unknown error') . "\n";
        $testResults[] = ['name' => $name, 'status' => 'error', 'message' => $responseData['message'] ?? 'Unknown error'];
    }
    
    echo "\n";
}

echo "🚀 Starting Fare Matrix API Tests...\n\n";

// Test 1: Get all fare matrices
testEndpoint(
    'Get All Fare Matrices',
    "$baseUrl/fare-matrix"
);

// Test 2: Get fare matrix for route 1
testEndpoint(
    'Get Fare Matrix for Route 1',
    "$baseUrl/fare-matrix/route/1"
);

// Test 3: Get fare between checkpoints
testEndpoint(
    'Get Fare Between Checkpoints',
    "$baseUrl/fare-matrix/fare/1/2?route_id=1"
);

// Test 4: Generate fare matrix for route 1
testEndpoint(
    'Generate Fare Matrix for Route 1',
    "$baseUrl/fare-matrix/generate/1",
    'POST',
    ['base_fare' => 13.00]
);

// Test 5: Get fare matrix statistics
testEndpoint(
    'Get Fare Matrix Statistics',
    "$baseUrl/fare-matrix/stats"
);

// Test 6: Create a custom fare entry
testEndpoint(
    'Create Custom Fare Entry',
    "$baseUrl/fare-matrix/create",
    'POST',
    [
        'from_checkpoint_id' => 1,
        'to_checkpoint_id' => 3,
        'fare_amount' => 20.00,
        'route_id' => 1,
        'is_base_fare' => false,
        'effective_date' => date('Y-m-d')
    ]
);

// Test 7: Test different checkpoint combinations
$testCheckpoints = [
    [1, 1], // Same checkpoint (base fare)
    [1, 5], // Different checkpoints
    [5, 1], // Reverse direction
    [17, 1], // Full route
];

foreach ($testCheckpoints as $index => $checkpoints) {
    testEndpoint(
        "Fare Test " . ($index + 1) . " (Checkpoint {$checkpoints[0]} to {$checkpoints[1]})",
        "$baseUrl/fare-matrix/fare/{$checkpoints[0]}/{$checkpoints[1]}?route_id=1"
    );
}

// Summary
echo "📊 Test Summary:\n";
echo "================\n";

$successCount = 0;
$errorCount = 0;

foreach ($testResults as $result) {
    if ($result['status'] === 'success') {
        $successCount++;
        echo "✅ {$result['name']}\n";
    } else {
        $errorCount++;
        echo "❌ {$result['name']}: {$result['message']}\n";
    }
}

echo "\n";
echo "📈 Results: $successCount successful, $errorCount failed\n";

if ($errorCount === 0) {
    echo "🎉 All tests passed! Fare Matrix API is working correctly.\n";
} else {
    echo "⚠️  Some tests failed. Please check the API implementation.\n";
}

echo "\n📋 Manual Testing Checklist:\n";
echo "1. ✅ Run database setup script\n";
echo "2. ✅ Test API endpoints\n";
echo "3. 🔄 Test mobile app integration\n";
echo "4. 🔄 Test admin panel fare matrix management\n";
echo "5. 🔄 Test fare calculation in scanner view\n";
echo "6. 🔄 Test discount application\n";
echo "7. 🔄 Test fare matrix updates\n";

echo "\n🔗 Useful API Endpoints:\n";
echo "- GET /api/fare-matrix - Get all fare matrices\n";
echo "- GET /api/fare-matrix/route/{id} - Get fare matrix for route\n";
echo "- GET /api/fare-matrix/fare/{from}/{to} - Get fare between checkpoints\n";
echo "- POST /api/fare-matrix/generate/{routeId} - Generate fare matrix\n";
echo "- POST /api/fare-matrix/create - Create fare entry\n";
echo "- GET /api/fare-matrix/stats - Get statistics\n";

?>
