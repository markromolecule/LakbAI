<?php
/**
 * Test Script for Driver API Endpoints
 * This script demonstrates how to use the admin-only driver CRUD API
 */

// Test configuration
$baseUrl = 'http://localhost:8000/LakbAI/LakbAI-API/routes/driver.php';
$adminId = 1; // Replace with actual admin user ID

// Test data for creating a driver
$testDriver = [
    'username' => 'test_driver_' . time(),
    'email' => 'test_driver_' . time() . '@example.com',
    'password' => 'TestPassword123',
    'first_name' => 'John',
    'last_name' => 'Doe',
    'phone_number' => '09123456789',
    'gender' => 'Male',
    'birthday' => '1990-01-15',
    'house_number' => '123',
    'street_name' => 'Test Street',
    'barangay' => 'Test Barangay',
    'city' => 'Test City',
    'province' => 'Test Province',
    'postal_code' => '1234',
    'account_verified' => true,
    'license_verification_status' => false
];

/**
 * Helper function to make HTTP requests
 */
function makeRequest($url, $method = 'GET', $data = null, $headers = []) {
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    if ($data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        $headers[] = 'Content-Type: application/json';
    }
    
    if (!empty($headers)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'status_code' => $httpCode,
        'response' => json_decode($response, true)
    ];
}

/**
 * Test functions
 */
function testGetAllDrivers($baseUrl, $adminId) {
    echo "=== Testing GET /drivers (Get All Drivers) ===\n";
    
    $headers = ['X-Admin-ID: ' . $adminId];
    $result = makeRequest($baseUrl . '/drivers', 'GET', null, $headers);
    
    echo "Status Code: " . $result['status_code'] . "\n";
    echo "Response: " . json_encode($result['response'], JSON_PRETTY_PRINT) . "\n\n";
    
    return $result;
}

function testCreateDriver($baseUrl, $adminId, $driverData) {
    echo "=== Testing POST /drivers/create (Create Driver) ===\n";
    
    $headers = ['X-Admin-ID: ' . $adminId];
    $result = makeRequest($baseUrl . '/drivers/create', 'POST', $driverData, $headers);
    
    echo "Status Code: " . $result['status_code'] . "\n";
    echo "Response: " . json_encode($result['response'], JSON_PRETTY_PRINT) . "\n\n";
    
    return $result;
}

function testGetDriverById($baseUrl, $adminId, $driverId) {
    echo "=== Testing GET /drivers/{id} (Get Driver by ID) ===\n";
    
    $headers = ['X-Admin-ID: ' . $adminId];
    $result = makeRequest($baseUrl . '/drivers/' . $driverId, 'GET', null, $headers);
    
    echo "Status Code: " . $result['status_code'] . "\n";
    echo "Response: " . json_encode($result['response'], JSON_PRETTY_PRINT) . "\n\n";
    
    return $result;
}

function testUpdateDriver($baseUrl, $adminId, $driverId, $updateData) {
    echo "=== Testing PUT /drivers/update/{id} (Update Driver) ===\n";
    
    $headers = ['X-Admin-ID: ' . $adminId];
    $result = makeRequest($baseUrl . '/drivers/update/' . $driverId, 'PUT', $updateData, $headers);
    
    echo "Status Code: " . $result['status_code'] . "\n";
    echo "Response: " . json_encode($result['response'], JSON_PRETTY_PRINT) . "\n\n";
    
    return $result;
}

function testDeleteDriver($baseUrl, $adminId, $driverId) {
    echo "=== Testing DELETE /drivers/delete/{id} (Delete Driver) ===\n";
    
    $headers = ['X-Admin-ID: ' . $adminId];
    $result = makeRequest($baseUrl . '/drivers/delete/' . $driverId, 'DELETE', null, $headers);
    
    echo "Status Code: " . $result['status_code'] . "\n";
    echo "Response: " . json_encode($result['response'], JSON_PRETTY_PRINT) . "\n\n";
    
    return $result;
}

// Run tests
echo "Driver API Test Suite\n";
echo "=====================\n\n";

// Test 1: Get all drivers
$allDriversResult = testGetAllDrivers($baseUrl, $adminId);

// Test 2: Create a new driver
$createResult = testCreateDriver($baseUrl, $adminId, $testDriver);

if ($createResult['status_code'] === 201 && isset($createResult['response']['data']['driver_id'])) {
    $driverId = $createResult['response']['data']['driver_id'];
    
    // Test 3: Get the created driver
    testGetDriverById($baseUrl, $adminId, $driverId);
    
    // Test 4: Update the driver
    $updateData = [
        'first_name' => 'Jane',
        'last_name' => 'Smith',
        'license_verification_status' => true
    ];
    testUpdateDriver($baseUrl, $adminId, $driverId, $updateData);
    
    // Test 5: Get the updated driver
    testGetDriverById($baseUrl, $adminId, $driverId);
    
    // Test 6: Delete the driver
    testDeleteDriver($baseUrl, $adminId, $driverId);
    
    // Test 7: Verify driver is deleted
    testGetDriverById($baseUrl, $adminId, $driverId);
} else {
    echo "Failed to create driver. Skipping subsequent tests.\n";
}

echo "Test suite completed.\n";
?>
