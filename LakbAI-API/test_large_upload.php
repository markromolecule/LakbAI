<?php
/**
 * Test Large File Upload
 * Tests with a larger valid image file
 */

echo "=== Testing Large File Upload ===\n\n";

// Create a larger PNG image (100x100 pixels)
$width = 100;
$height = 100;
$image = imagecreate($width, $height);

// Set background color
$bg = imagecolorallocate($image, 255, 255, 255);
$text_color = imagecolorallocate($image, 0, 0, 0);

// Add some text to make it larger
imagestring($image, 5, 10, 10, 'Test Image', $text_color);

// Save to temporary file
$testFile = tempnam(sys_get_temp_dir(), 'test_large_image');
imagepng($image, $testFile);
imagedestroy($image);

echo "Created test PNG file: $testFile\n";
echo "Test file size: " . filesize($testFile) . " bytes\n";

// Simulate file upload
$_FILES['document'] = [
    'name' => 'test_large_image.png',
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

// Clean up
unlink($testFile);

echo "\n=== Test Complete ===\n";
?>
