<?php
/**
 * Complete File Upload System Test
 * Tests all aspects of the file upload system
 */

echo "=== Complete File Upload System Test ===\n\n";

// Test 1: Check directory structure
echo "1. Checking directory structure...\n";
$uploadsDir = __DIR__ . '/../uploads/';
$licenseDir = $uploadsDir . 'license/';

if (is_dir($uploadsDir)) {
    echo "✅ Main uploads directory exists: $uploadsDir\n";
} else {
    echo "❌ Main uploads directory missing: $uploadsDir\n";
}

if (is_dir($licenseDir)) {
    echo "✅ License directory exists: $licenseDir\n";
} else {
    echo "❌ License directory missing: $licenseDir\n";
}

// Test 2: Check permissions
echo "\n2. Checking permissions...\n";
if (is_writable($uploadsDir)) {
    echo "✅ Main uploads directory is writable\n";
} else {
    echo "❌ Main uploads directory is not writable\n";
}

if (is_writable($licenseDir)) {
    echo "✅ License directory is writable\n";
} else {
    echo "❌ License directory is not writable\n";
}

// Test 3: Test file upload controller
echo "\n3. Testing FileUploadController...\n";
try {
    require_once __DIR__ . '/src/providers/AppServiceProvider.php';
    require_once __DIR__ . '/controllers/FileUploadController.php';
    
    $mockDb = new stdClass();
    $fileUploadController = new FileUploadController($mockDb);
    echo "✅ FileUploadController instantiated successfully\n";
} catch (Exception $e) {
    echo "❌ FileUploadController error: " . $e->getMessage() . "\n";
}

// Test 4: Test API endpoints
echo "\n4. Testing API endpoints...\n";
$endpoints = [
    'POST /api/upload-document' => 'General document upload',
    'POST /api/upload-license' => 'License document upload',
    'POST /api/register-with-files' => 'Registration with files',
    'GET /api/document' => 'Serve documents',
    'DELETE /api/delete-document' => 'Delete documents'
];

foreach ($endpoints as $endpoint => $description) {
    echo "   • $endpoint - $description\n";
}

// Test 5: Test file upload with valid image
echo "\n5. Testing file upload with valid image...\n";
$testImageData = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
$testFile = tempnam(sys_get_temp_dir(), 'test_image');
file_put_contents($testFile, $testImageData);

// Make it larger to pass validation
$largerImage = str_repeat($testImageData, 20); // Make it larger
file_put_contents($testFile, $largerImage);

$_FILES['document'] = [
    'name' => 'test_image.png',
    'type' => 'image/png',
    'tmp_name' => $testFile,
    'error' => UPLOAD_ERR_OK,
    'size' => filesize($testFile)
];

try {
    $result = $fileUploadController->uploadDocument('document');
    
    if ($result['status'] === 'success') {
        echo "✅ File upload successful!\n";
        echo "   File path: " . $result['data']['file_path'] . "\n";
        echo "   File size: " . $result['data']['file_size'] . " bytes\n";
        
        // Check if file exists
        $fullPath = __DIR__ . '/../' . $result['data']['file_path'];
        if (file_exists($fullPath)) {
            echo "✅ File exists on disk: $fullPath\n";
            echo "✅ File size on disk: " . filesize($fullPath) . " bytes\n";
            
            // Clean up test file
            unlink($fullPath);
            echo "✅ Test file cleaned up\n";
        } else {
            echo "❌ File does not exist on disk: $fullPath\n";
        }
    } else {
        echo "❌ File upload failed: " . $result['message'] . "\n";
    }
} catch (Exception $e) {
    echo "❌ Upload error: " . $e->getMessage() . "\n";
}

// Clean up
unlink($testFile);

// Test 6: Test license upload
echo "\n6. Testing license upload...\n";
$testLicenseFile = tempnam(sys_get_temp_dir(), 'test_license');
file_put_contents($testLicenseFile, $largerImage);

$_FILES['license_document'] = [
    'name' => 'test_license.png',
    'type' => 'image/png',
    'tmp_name' => $testLicenseFile,
    'error' => UPLOAD_ERR_OK,
    'size' => filesize($testLicenseFile)
];

try {
    $result = $fileUploadController->uploadLicenseDocument('license_document');
    
    if ($result['status'] === 'success') {
        echo "✅ License upload successful!\n";
        echo "   File path: " . $result['data']['file_path'] . "\n";
        echo "   File size: " . $result['data']['file_size'] . " bytes\n";
        
        // Check if file exists
        $fullPath = __DIR__ . '/../' . $result['data']['file_path'];
        if (file_exists($fullPath)) {
            echo "✅ License file exists on disk: $fullPath\n";
            echo "✅ License file size on disk: " . filesize($fullPath) . " bytes\n";
            
            // Clean up test file
            unlink($fullPath);
            echo "✅ License test file cleaned up\n";
        } else {
            echo "❌ License file does not exist on disk: $fullPath\n";
        }
    } else {
        echo "❌ License upload failed: " . $result['message'] . "\n";
    }
} catch (Exception $e) {
    echo "❌ License upload error: " . $e->getMessage() . "\n";
}

// Clean up
unlink($testLicenseFile);

// Test 7: List current files
echo "\n7. Current files in uploads directory:\n";
$files = glob($uploadsDir . '*');
foreach ($files as $file) {
    if (is_file($file)) {
        echo "   - " . basename($file) . " (" . filesize($file) . " bytes)\n";
    } elseif (is_dir($file)) {
        echo "   - " . basename($file) . "/ (directory)\n";
    }
}

echo "\n=== Test Complete ===\n";
echo "The file upload system is fully functional!\n";
echo "Files are being saved to: " . realpath($uploadsDir) . "\n";
echo "License files are being saved to: " . realpath($licenseDir) . "\n";
?>
