<?php
// Simple driver license document serving script
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

$filename = $_GET['file'] ?? '';
if (empty($filename)) {
    http_response_code(400);
    echo json_encode(['error' => 'File parameter is required']);
    exit;
}

// Security: Only allow files from licenses directory
$filename = basename($filename); // Remove any path traversal attempts
$fullPath = __DIR__ . '/uploads/licenses/' . $filename;

// Debug: Log the file path
error_log("Looking for file: " . $fullPath);
error_log("File exists: " . (file_exists($fullPath) ? 'YES' : 'NO'));

if (!file_exists($fullPath) || !is_readable($fullPath)) {
    http_response_code(404);
    echo json_encode(['error' => 'File not found', 'path' => $fullPath]);
    exit;
}

// Get file info
$fileInfo = pathinfo($fullPath);
$extension = strtolower($fileInfo['extension']);

// Set appropriate content type
$contentTypes = [
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png' => 'image/png',
    'pdf' => 'application/pdf'
];

$contentType = $contentTypes[$extension] ?? 'application/octet-stream';

// Set headers
header('Content-Type: ' . $contentType);
header('Content-Disposition: inline; filename="' . $fileInfo['basename'] . '"');
header('Content-Length: ' . filesize($fullPath));
header('Cache-Control: public, max-age=3600');

// Output file
readfile($fullPath);
?>
