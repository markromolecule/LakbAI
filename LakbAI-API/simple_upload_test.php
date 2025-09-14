<?php
/**
 * Simple File Upload Test
 * Tests the file upload functionality directly
 */

echo "=== Simple File Upload Test ===\n\n";

// Test 1: Check if uploads directory exists and is writable
echo "1. Checking uploads directory...\n";
$uploadsDir = __DIR__ . '/../uploads/';
$licenseDir = $uploadsDir . 'license/';

if (is_dir($uploadsDir)) {
    echo "✅ Main uploads directory exists: $uploadsDir\n";
    if (is_writable($uploadsDir)) {
        echo "✅ Main uploads directory is writable\n";
    } else {
        echo "❌ Main uploads directory is not writable\n";
    }
} else {
    echo "❌ Main uploads directory does not exist\n";
}

if (is_dir($licenseDir)) {
    echo "✅ License directory exists: $licenseDir\n";
    if (is_writable($licenseDir)) {
        echo "✅ License directory is writable\n";
    } else {
        echo "❌ License directory is not writable\n";
    }
} else {
    echo "❌ License directory does not exist\n";
}

echo "\n";

// Test 2: Create a test file and try to upload it
echo "2. Testing file upload functionality...\n";

// Create a test file
$testContent = "This is a test document for upload testing.";
$testFile = tempnam(sys_get_temp_dir(), 'test_doc');
file_put_contents($testFile, $testContent);

echo "Created test file: $testFile\n";
echo "Test file size: " . filesize($testFile) . " bytes\n";

// Simulate file upload
$_FILES['document'] = [
    'name' => 'test_document.txt',
    'type' => 'text/plain',
    'tmp_name' => $testFile,
    'error' => UPLOAD_ERR_OK,
    'size' => strlen($testContent)
];

// Test the FileUploadController directly
try {
    require_once __DIR__ . '/src/providers/AppServiceProvider.php';
    require_once __DIR__ . '/controllers/FileUploadController.php';
    
    // Create a mock database connection
    $mockDb = new stdClass();
    
    // Create FileUploadController instance
    $fileUploadController = new FileUploadController($mockDb);
    
    // Test upload
    $result = $fileUploadController->uploadDocument('document');
    
    if ($result['status'] === 'success') {
        echo "✅ File upload successful!\n";
        echo "   File path: " . $result['data']['file_path'] . "\n";
        echo "   Original name: " . $result['data']['original_name'] . "\n";
        echo "   File size: " . $result['data']['file_size'] . " bytes\n";
        
        // Check if file actually exists
        $fullPath = __DIR__ . '/../' . $result['data']['file_path'];
        if (file_exists($fullPath)) {
            echo "✅ File exists on disk: $fullPath\n";
        } else {
            echo "❌ File does not exist on disk: $fullPath\n";
        }
    } else {
        echo "❌ File upload failed: " . $result['message'] . "\n";
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

// Clean up
unlink($testFile);

echo "\n";

// Test 3: List current files in uploads directory
echo "3. Current files in uploads directory:\n";
$files = glob($uploadsDir . '*');
foreach ($files as $file) {
    if (is_file($file)) {
        echo "   - " . basename($file) . " (" . filesize($file) . " bytes)\n";
    } elseif (is_dir($file)) {
        echo "   - " . basename($file) . "/ (directory)\n";
    }
}

echo "\n=== Test Complete ===\n";
?>
