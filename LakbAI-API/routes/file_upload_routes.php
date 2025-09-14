<?php

require_once __DIR__ . '/../controllers/FileUploadController.php';

// Initialize file upload controller
$fileUploadController = new FileUploadController($dbConnection);

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];
$pathParts = explode('/', trim(parse_url($requestUri, PHP_URL_PATH), '/'));

// Remove 'api' from path parts if present
if (isset($pathParts[0]) && $pathParts[0] === 'api') {
    array_shift($pathParts);
}

// General document upload routes
if (end($pathParts) === 'upload-document' && $method === 'POST') {
    $result = $fileUploadController->uploadDocument();
    echo json_encode($result);
    exit;
}

// License document upload routes
if (end($pathParts) === 'upload-license' && $method === 'POST') {
    $result = $fileUploadController->uploadLicenseDocument();
    echo json_encode($result);
    exit;
}

// Serve document file
if (isset($pathParts[0]) && $pathParts[0] === 'document' && $method === 'GET') {
    $filePath = isset($_GET['path']) ? $_GET['path'] : '';
    if ($filePath) {
        $fileUploadController->serveDocument($filePath);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'File path parameter is required']);
    }
    exit;
}

// Delete document file
if (isset($pathParts[0]) && $pathParts[0] === 'delete-document' && $method === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    $filePath = isset($input['file_path']) ? $input['file_path'] : '';
    
    if ($filePath) {
        $result = $fileUploadController->deleteDocument($filePath);
        echo json_encode($result);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'File path is required']);
    }
    exit;
}

// DEPRECATED: Legacy discount document routes (maintained for backward compatibility)
if (end($pathParts) === 'upload-discount-document' && $method === 'POST') {
    $result = $fileUploadController->uploadDiscountDocument();
    echo json_encode($result);
    exit;
}

// DEPRECATED: Serve discount document file
if (isset($pathParts[0]) && $pathParts[0] === 'discount-document' && $method === 'GET') {
    $filePath = isset($_GET['path']) ? $_GET['path'] : '';
    if ($filePath) {
        $fileUploadController->serveDiscountDocument($filePath);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'File path parameter is required']);
    }
    exit;
}

// DEPRECATED: Delete discount document file
if (isset($pathParts[0]) && $pathParts[0] === 'delete-discount-document' && $method === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    $filePath = isset($input['file_path']) ? $input['file_path'] : '';
    
    if ($filePath) {
        $result = $fileUploadController->deleteDiscountDocument($filePath);
        echo json_encode($result);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'File path is required']);
    }
    exit;
}
