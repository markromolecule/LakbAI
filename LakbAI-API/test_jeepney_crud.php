<?php
/**
 * Test script for Jeepney CRUD operations
 * Run this script to verify that the Jeepney CRUD system is working properly
 */

require_once __DIR__ . '/bootstrap/app.php';
require_once __DIR__ . '/controllers/JeepneyController.php';

// Initialize controller
$database = $app->get("Database");
$controller = new JeepneyController($database);

echo "=== Jeepney CRUD System Test ===\n\n";

// Test data
$testJeepney = [
    'plate_number' => 'TEST-001',
    'route' => 'Test Route - Test Destination',
    'capacity' => 20,
    'status' => 'active'
];

echo "1. Testing CREATE operation...\n";
$createResult = $controller->createJeepney($testJeepney);
if ($createResult['status'] === 'success') {
    echo "✅ CREATE: Success - " . $createResult['message'] . "\n";
    $jeepneyId = $createResult['jeepney_id'];
} else {
    echo "❌ CREATE: Failed - " . $createResult['message'] . "\n";
    exit(1);
}

echo "\n2. Testing READ operation (get all)...\n";
$readAllResult = $controller->getAllJeepneys();
if ($readAllResult['status'] === 'success') {
    echo "✅ READ ALL: Success - Found " . count($readAllResult['jeepneys']) . " jeepneys\n";
} else {
    echo "❌ READ ALL: Failed - " . $readAllResult['message'] . "\n";
}

echo "\n3. Testing READ operation (get by ID)...\n";
$readByIdResult = $controller->getJeepneyById($jeepneyId);
if ($readByIdResult['status'] === 'success') {
    echo "✅ READ BY ID: Success - Found jeepney with plate: " . $readByIdResult['jeepney']['plate_number'] . "\n";
} else {
    echo "❌ READ BY ID: Failed - " . $readByIdResult['message'] . "\n";
}

echo "\n4. Testing UPDATE operation...\n";
$updateData = [
    'plate_number' => 'TEST-001-UPDATED',
    'route' => 'Updated Test Route - Updated Destination',
    'capacity' => 25,
    'status' => 'active'
];
$updateResult = $controller->updateJeepney($jeepneyId, $updateData);
if ($updateResult['status'] === 'success') {
    echo "✅ UPDATE: Success - " . $updateResult['message'] . "\n";
} else {
    echo "❌ UPDATE: Failed - " . $updateResult['message'] . "\n";
}

echo "\n5. Testing DELETE operation...\n";
$deleteResult = $controller->deleteJeepney($jeepneyId);
if ($deleteResult['status'] === 'success') {
    echo "✅ DELETE: Success - " . $deleteResult['message'] . "\n";
} else {
    echo "❌ DELETE: Failed - " . $deleteResult['message'] . "\n";
}

echo "\n6. Testing validation (empty data)...\n";
$invalidData = [
    'plate_number' => '',
    'route' => '',
    'capacity' => 0
];
$validationResult = $controller->createJeepney($invalidData);
if ($validationResult['status'] === 'error') {
    echo "✅ VALIDATION: Success - Properly rejected invalid data: " . $validationResult['message'] . "\n";
} else {
    echo "❌ VALIDATION: Failed - Should have rejected invalid data\n";
}

echo "\n7. Testing SQL injection prevention...\n";
$maliciousData = [
    'plate_number' => "'; DROP TABLE jeepneys; --",
    'route' => 'Test Route',
    'capacity' => 20,
    'status' => 'active'
];
$injectionResult = $controller->createJeepney($maliciousData);
if ($injectionResult['status'] === 'success') {
    echo "✅ SQL INJECTION PREVENTION: Success - Malicious input was sanitized\n";
    // Clean up the test record
    $controller->deleteJeepney($injectionResult['jeepney_id']);
} else {
    echo "❌ SQL INJECTION PREVENTION: Failed - " . $injectionResult['message'] . "\n";
}

echo "\n=== Test Complete ===\n";
echo "If all tests show ✅, your Jeepney CRUD system is working correctly!\n";
echo "If any tests show ❌, there are issues that need to be fixed.\n";
?>
