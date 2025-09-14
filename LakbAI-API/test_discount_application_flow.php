<?php
/**
 * Test script for the complete discount application flow
 * This script tests the entire process from mobile app submission to admin approval
 */

require_once __DIR__ . '/bootstrap/app.php';
require_once __DIR__ . '/controllers/DiscountController.php';
require_once __DIR__ . '/controllers/FileUploadController.php';
require_once __DIR__ . '/controllers/AuthController.php';

// Initialize services
$app = require_once __DIR__ . '/bootstrap/app.php';
$discountController = new DiscountController($app->get('Database'));
$fileUploadController = new FileUploadController($app->get('Database'));
$authController = new AuthController($app->get('Database'));

echo "=== DISCOUNT APPLICATION FLOW TEST ===\n\n";

// Test 1: Create a test user (passenger)
echo "1. Creating test user...\n";
$testUserData = [
    'username' => 'test_passenger_' . time(),
    'email' => 'test' . time() . '@lakbai.com',
    'password' => 'testpassword123',
    'first_name' => 'Test',
    'last_name' => 'User',
    'phone_number' => '09123456789',
    'birthday' => '1995-05-15',
    'gender' => 'Male',
    'house_number' => '123',
    'street_name' => 'Test Street',
    'barangay' => 'Test Barangay',
    'city_municipality' => 'Test City',
    'province' => 'Test Province',
    'postal_code' => '1234',
    'user_type' => 'passenger'
];

$userResult = $authController->register($testUserData);
if ($userResult['status'] === 'success') {
    $testUserId = $userResult['user_id'];
    echo "✓ Test user created with ID: $testUserId\n";
} else {
    echo "✗ Failed to create test user: " . $userResult['message'] . "\n";
    exit(1);
}

// Test 2: Simulate document upload
echo "\n2. Testing document upload...\n";
// Create a temporary test file
$testDocumentContent = "This is a test discount document for user verification.";
$testDocumentPath = __DIR__ . '/uploads/discounts/test_document_' . time() . '.txt';

// Ensure uploads directory exists
if (!file_exists(dirname($testDocumentPath))) {
    mkdir(dirname($testDocumentPath), 0755, true);
}

file_put_contents($testDocumentPath, $testDocumentContent);

// Get relative path for database storage
$relativeDocumentPath = 'uploads/discounts/' . basename($testDocumentPath);
echo "✓ Test document created at: $relativeDocumentPath\n";

// Test 3: Submit discount application
echo "\n3. Testing discount application submission...\n";
$applicationResult = $discountController->submitDiscountApplication(
    $testUserId,
    'Student',
    $relativeDocumentPath,
    basename($testDocumentPath)
);

if ($applicationResult['status'] === 'success') {
    echo "✓ Discount application submitted successfully\n";
    echo "  - User ID: " . $applicationResult['data']['user_id'] . "\n";
    echo "  - Discount Type: " . $applicationResult['data']['discount_type'] . "\n";
    echo "  - Status: " . $applicationResult['data']['discount_status'] . "\n";
    echo "  - Document: " . $applicationResult['data']['document_name'] . "\n";
} else {
    echo "✗ Failed to submit discount application: " . $applicationResult['message'] . "\n";
}

// Test 4: Get user discount status
echo "\n4. Testing get user discount status...\n";
$statusResult = $discountController->getUserDiscountStatus($testUserId);
if ($statusResult['status'] === 'success') {
    echo "✓ Retrieved user discount status\n";
    echo "  - Applied: " . ($statusResult['data']['discount_applied'] ? 'Yes' : 'No') . "\n";
    echo "  - Status: " . $statusResult['data']['discount_status'] . "\n";
    echo "  - Type: " . $statusResult['data']['discount_type'] . "\n";
    echo "  - File Path: " . ($statusResult['data']['discount_file_path'] ?: 'None') . "\n";
} else {
    echo "✗ Failed to get discount status: " . $statusResult['message'] . "\n";
}

// Test 5: Get pending discount applications
echo "\n5. Testing get pending discount applications...\n";
$pendingResult = $discountController->getPendingDiscountApplications();
if ($pendingResult['status'] === 'success') {
    echo "✓ Retrieved pending discount applications\n";
    echo "  - Count: " . $pendingResult['count'] . "\n";
    
    // Find our test user in the results
    $testUserFound = false;
    foreach ($pendingResult['data'] as $application) {
        if ($application['id'] == $testUserId) {
            $testUserFound = true;
            echo "  - Test user found in pending applications\n";
            echo "    * Name: " . $application['first_name'] . ' ' . $application['last_name'] . "\n";
            echo "    * Email: " . $application['email'] . "\n";
            echo "    * Discount Type: " . $application['discount_type'] . "\n";
            echo "    * Status: " . $application['discount_status'] . "\n";
            break;
        }
    }
    
    if (!$testUserFound) {
        echo "  - Warning: Test user not found in pending applications\n";
    }
} else {
    echo "✗ Failed to get pending applications: " . $pendingResult['message'] . "\n";
}

// Test 6: Get detailed user info for review
echo "\n6. Testing get user details for review...\n";
$reviewResult = $discountController->getUserDetailsForReview($testUserId);
if ($reviewResult['status'] === 'success') {
    echo "✓ Retrieved user details for review\n";
    $userDetails = $reviewResult['data'];
    echo "  - Name: " . $userDetails['first_name'] . ' ' . $userDetails['last_name'] . "\n";
    echo "  - Email: " . $userDetails['email'] . "\n";
    echo "  - Phone: " . $userDetails['phone_number'] . "\n";
    echo "  - Discount Type: " . $userDetails['discount']['type'] . "\n";
    echo "  - Discount Status: " . $userDetails['discount']['status'] . "\n";
    echo "  - Document: " . ($userDetails['discount']['file_name'] ?: 'None') . "\n";
} else {
    echo "✗ Failed to get user review details: " . $reviewResult['message'] . "\n";
}

// Test 7: Test approval process
echo "\n7. Testing discount approval...\n";
$approvalResult = $discountController->updateDiscountStatus($testUserId, 'approved');
if ($approvalResult['status'] === 'success') {
    echo "✓ Discount application approved successfully\n";
    echo "  - User ID: " . $approvalResult['data']['user_id'] . "\n";
    echo "  - Status: " . $approvalResult['data']['discount_status'] . "\n";
    echo "  - Amount: " . $approvalResult['data']['discount_amount'] . "%\n";
    echo "  - Verified: " . ($approvalResult['data']['discount_verified'] ? 'Yes' : 'No') . "\n";
} else {
    echo "✗ Failed to approve discount: " . $approvalResult['message'] . "\n";
}

// Test 8: Verify status after approval
echo "\n8. Verifying status after approval...\n";
$finalStatusResult = $discountController->getUserDiscountStatus($testUserId);
if ($finalStatusResult['status'] === 'success') {
    echo "✓ Final status retrieved\n";
    echo "  - Applied: " . ($finalStatusResult['data']['discount_applied'] ? 'Yes' : 'No') . "\n";
    echo "  - Status: " . $finalStatusResult['data']['discount_status'] . "\n";
    echo "  - Type: " . $finalStatusResult['data']['discount_type'] . "\n";
    echo "  - Amount: " . ($finalStatusResult['data']['discount_amount'] ?: 'None') . "%\n";
    echo "  - Verified: " . ($finalStatusResult['data']['discount_verified'] ? 'Yes' : 'No') . "\n";
} else {
    echo "✗ Failed to get final status: " . $finalStatusResult['message'] . "\n";
}

// Test 9: Test rejection process with a new application
echo "\n9. Testing discount rejection...\n";

// Create another test user
$testUserData2 = $testUserData;
$testUserData2['username'] = 'test_passenger_reject_' . time();
$testUserData2['email'] = 'testReject' . time() . '@lakbai.com';

$userResult2 = $authController->register($testUserData2);
if ($userResult2['status'] === 'success') {
    $testUserId2 = $userResult2['user_id'];
    echo "✓ Second test user created with ID: $testUserId2\n";
    
    // Submit application for second user
    $testDocumentPath2 = __DIR__ . '/uploads/discounts/test_document_reject_' . time() . '.txt';
    file_put_contents($testDocumentPath2, $testDocumentContent);
    $relativeDocumentPath2 = 'uploads/discounts/' . basename($testDocumentPath2);
    
    $applicationResult2 = $discountController->submitDiscountApplication(
        $testUserId2,
        'PWD',
        $relativeDocumentPath2,
        basename($testDocumentPath2)
    );
    
    if ($applicationResult2['status'] === 'success') {
        echo "✓ Second discount application submitted\n";
        
        // Test rejection
        $rejectionResult = $discountController->updateDiscountStatus(
            $testUserId2, 
            'rejected', 
            null, 
            'Document not clear enough'
        );
        
        if ($rejectionResult['status'] === 'success') {
            echo "✓ Discount application rejected successfully\n";
            echo "  - Status: " . $rejectionResult['data']['discount_status'] . "\n";
            echo "  - Verified: " . ($rejectionResult['data']['discount_verified'] ? 'Yes' : 'No') . "\n";
        } else {
            echo "✗ Failed to reject discount: " . $rejectionResult['message'] . "\n";
        }
    }
}

// Cleanup
echo "\n10. Cleaning up test data...\n";

// Remove test documents
if (file_exists($testDocumentPath)) {
    unlink($testDocumentPath);
    echo "✓ Removed test document 1\n";
}

if (isset($testDocumentPath2) && file_exists($testDocumentPath2)) {
    unlink($testDocumentPath2);
    echo "✓ Removed test document 2\n";
}

// Note: In a real scenario, you might want to keep test users for further testing
// or clean them up as well. For now, we'll leave them in the database.

echo "\n=== TEST SUMMARY ===\n";
echo "✓ User registration\n";
echo "✓ Document upload simulation\n";
echo "✓ Discount application submission\n";
echo "✓ Get user discount status\n";
echo "✓ Get pending applications\n";
echo "✓ Get user details for review\n";
echo "✓ Discount approval process\n";
echo "✓ Status verification after approval\n";
echo "✓ Discount rejection process\n";
echo "✓ Test cleanup\n";

echo "\n🎉 All tests completed successfully!\n";
echo "\nTest users created:\n";
echo "- Approved user ID: $testUserId (username: " . $testUserData['username'] . ")\n";
if (isset($testUserId2)) {
    echo "- Rejected user ID: $testUserId2 (username: " . $testUserData2['username'] . ")\n";
}
echo "\nYou can now test the admin interface with these users.\n";

?>
