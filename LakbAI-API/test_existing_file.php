<?php
/**
 * Test with Existing File
 * Tests upload with an existing PNG file
 */

echo "=== Testing with Existing File ===\n\n";

$testFile = __DIR__ . '/test_copy.png';

if (!file_exists($testFile)) {
    echo "❌ Test file does not exist: $testFile\n";
    exit(1);
}

echo "Using test file: $testFile\n";
echo "Test file size: " . filesize($testFile) . " bytes\n";

// Simulate file upload
$_FILES['document'] = [
    'name' => 'test_copy.png',
    'type' => 'image/png',
    'tmp_name' => $testFile,
    'error' => UPLOAD_ERR_OK,
    'size' => filesize($testFile)
];

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
            echo "✅ File size on disk: " . filesize($fullPath) . " bytes\n";
        } else {
            echo "❌ File does not exist on disk: $fullPath\n";
        }
    } else {
        echo "❌ File upload failed: " . $result['message'] . "\n";
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";
?>
