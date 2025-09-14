<?php
/**
 * Test File Upload System
 * This script demonstrates how to test the file upload functionality
 */

// Test file upload endpoints
function testFileUpload() {
    echo "=== Testing File Upload System ===\n\n";
    
    // Test 1: Upload a general document
    echo "1. Testing general document upload...\n";
    testGeneralDocumentUpload();
    
    echo "\n";
    
    // Test 2: Upload a license document
    echo "2. Testing license document upload...\n";
    testLicenseDocumentUpload();
    
    echo "\n";
    
    // Test 3: Test registration with files
    echo "3. Testing registration with files...\n";
    testRegistrationWithFiles();
}

function testGeneralDocumentUpload() {
    // Create a test file
    $testContent = "This is a test document for upload testing.";
    $testFile = tempnam(sys_get_temp_dir(), 'test_doc');
    file_put_contents($testFile, $testContent);
    
    // Simulate file upload
    $_FILES['document'] = [
        'name' => 'test_document.txt',
        'type' => 'text/plain',
        'tmp_name' => $testFile,
        'error' => UPLOAD_ERR_OK,
        'size' => strlen($testContent)
    ];
    
    // Include the file upload controller
    require_once __DIR__ . '/controllers/FileUploadController.php';
    require_once __DIR__ . '/bootstrap/app.php';
    
    try {
        $app = new App();
        $fileUploadController = new FileUploadController($app->get('Database'));
        
        $result = $fileUploadController->uploadDocument('document');
        
        if ($result['status'] === 'success') {
            echo "✅ General document upload successful!\n";
            echo "   File path: " . $result['data']['file_path'] . "\n";
            echo "   Original name: " . $result['data']['original_name'] . "\n";
            echo "   File size: " . $result['data']['file_size'] . " bytes\n";
        } else {
            echo "❌ General document upload failed: " . $result['message'] . "\n";
        }
    } catch (Exception $e) {
        echo "❌ Error: " . $e->getMessage() . "\n";
    }
    
    // Clean up
    unlink($testFile);
}

function testLicenseDocumentUpload() {
    // Create a test image file (simulate a license document)
    $testImageData = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    $testFile = tempnam(sys_get_temp_dir(), 'test_license');
    file_put_contents($testFile, $testImageData);
    
    // Simulate file upload
    $_FILES['license_document'] = [
        'name' => 'test_license.png',
        'type' => 'image/png',
        'tmp_name' => $testFile,
        'error' => UPLOAD_ERR_OK,
        'size' => strlen($testImageData)
    ];
    
    // Include the file upload controller
    require_once __DIR__ . '/controllers/FileUploadController.php';
    require_once __DIR__ . '/bootstrap/app.php';
    
    try {
        $app = new App();
        $fileUploadController = new FileUploadController($app->get('Database'));
        
        $result = $fileUploadController->uploadLicenseDocument('license_document');
        
        if ($result['status'] === 'success') {
            echo "✅ License document upload successful!\n";
            echo "   File path: " . $result['data']['file_path'] . "\n";
            echo "   Original name: " . $result['data']['original_name'] . "\n";
            echo "   File size: " . $result['data']['file_size'] . " bytes\n";
        } else {
            echo "❌ License document upload failed: " . $result['message'] . "\n";
        }
    } catch (Exception $e) {
        echo "❌ Error: " . $e->getMessage() . "\n";
    }
    
    // Clean up
    unlink($testFile);
}

function testRegistrationWithFiles() {
    echo "To test registration with files, use the following endpoints:\n";
    echo "• POST /api/register-with-files (for web)\n";
    echo "• POST /api/ with action: 'register-with-files' (for mobile)\n\n";
    
    echo "Example cURL command:\n";
    echo "curl -X POST http://localhost/LakbAI/LakbAI-API/api/register-with-files \\\n";
    echo "  -F 'username=testuser' \\\n";
    echo "  -F 'email=test@example.com' \\\n";
    echo "  -F 'password=Password123' \\\n";
    echo "  -F 'first_name=John' \\\n";
    echo "  -F 'last_name=Doe' \\\n";
    echo "  -F 'phone_number=09123456789' \\\n";
    echo "  -F 'birthday=1990-01-01' \\\n";
    echo "  -F 'gender=Male' \\\n";
    echo "  -F 'house_number=123' \\\n";
    echo "  -F 'street_name=Test Street' \\\n";
    echo "  -F 'barangay=Test Barangay' \\\n";
    echo "  -F 'city_municipality=Test City' \\\n";
    echo "  -F 'province=Test Province' \\\n";
    echo "  -F 'postal_code=1234' \\\n";
    echo "  -F 'user_type=passenger' \\\n";
    echo "  -F 'discount_type=PWD' \\\n";
    echo "  -F 'discount_document=@/path/to/document.pdf' \\\n";
    echo "  -F 'license_document=@/path/to/license.jpg'\n";
}

// Run the tests
testFileUpload();

echo "\n=== File Upload System Test Complete ===\n";
echo "Check the uploads/ directory to see uploaded files.\n";
?>
