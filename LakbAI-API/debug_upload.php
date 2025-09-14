<?php
/**
 * Debug File Upload
 * Debug the file upload process
 */

echo "=== Debug File Upload ===\n\n";

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
    
    // Debug the upload path
    $reflection = new ReflectionClass($fileUploadController);
    $property = $reflection->getProperty('baseUploadPath');
    $property->setAccessible(true);
    $basePath = $property->getValue($fileUploadController);
    
    echo "Base upload path: $basePath\n";
    echo "Base path exists: " . (file_exists($basePath) ? 'Yes' : 'No') . "\n";
    echo "Base path writable: " . (is_writable($basePath) ? 'Yes' : 'No') . "\n";
    
    // Test the upload process step by step
    echo "\nTesting upload process...\n";
    
    // Check if file was uploaded
    if (!isset($_FILES['document'])) {
        echo "❌ No file uploaded\n";
        exit(1);
    }
    echo "✅ File uploaded check passed\n";
    
    $file = $_FILES['document'];
    
    // Test validation
    $validationMethod = $reflection->getMethod('validateFile');
    $validationMethod->setAccessible(true);
    $validationErrors = $validationMethod->invoke($fileUploadController, $file);
    
    if (!empty($validationErrors)) {
        echo "❌ Validation failed: " . implode(', ', $validationErrors) . "\n";
        exit(1);
    }
    echo "✅ Validation passed\n";
    
    // Test filename generation
    $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $safeOriginalName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $file['name']);
    $uniqueFilename = uniqid() . '_' . time() . '_' . substr($safeOriginalName, 0, 20) . '.' . $fileExtension;
    $filePath = $basePath . $uniqueFilename;
    
    echo "Generated filename: $uniqueFilename\n";
    echo "Full file path: $filePath\n";
    echo "Directory exists: " . (file_exists(dirname($filePath)) ? 'Yes' : 'No') . "\n";
    echo "Directory writable: " . (is_writable(dirname($filePath)) ? 'Yes' : 'No') . "\n";
    
    // Test file move
    if (move_uploaded_file($file['tmp_name'], $filePath)) {
        echo "✅ File moved successfully!\n";
        echo "File exists at destination: " . (file_exists($filePath) ? 'Yes' : 'No') . "\n";
        echo "File size at destination: " . (file_exists($filePath) ? filesize($filePath) : 'N/A') . " bytes\n";
        
        // Clean up
        unlink($filePath);
    } else {
        echo "❌ Failed to move file\n";
        echo "Source file exists: " . (file_exists($file['tmp_name']) ? 'Yes' : 'No') . "\n";
        echo "Source file readable: " . (is_readable($file['tmp_name']) ? 'Yes' : 'No') . "\n";
        echo "Destination directory writable: " . (is_writable(dirname($filePath)) ? 'Yes' : 'No') . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Debug Complete ===\n";
?>
