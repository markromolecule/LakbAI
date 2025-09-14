<?php

require_once __DIR__ . '/../src/providers/AppServiceProvider.php';

class FileUploadController {
    private $appProvider;
    private $uploadPath;
    private $allowedTypes;
    private $maxFileSize;

    public function __construct($dbConnection) {
        $this->appProvider = new AppServiceProvider($dbConnection);
        
        // Set upload configuration
        $this->uploadPath = __DIR__ . '/../uploads/discounts/';
        $this->allowedTypes = ['pdf', 'jpg', 'jpeg', 'png'];
        $this->maxFileSize = 5 * 1024 * 1024; // 5MB in bytes
        
        // Create upload directory if it doesn't exist
        $this->createUploadDirectory();
    }

    /**
     * Create upload directory if it doesn't exist
     */
    private function createUploadDirectory() {
        if (!file_exists($this->uploadPath)) {
            mkdir($this->uploadPath, 0755, true);
        }
    }

    /**
     * Handle discount document upload
     */
    public function uploadDiscountDocument() {
        try {
            // Check if file was uploaded
            if (!isset($_FILES['discount_document']) || $_FILES['discount_document']['error'] !== UPLOAD_ERR_OK) {
                $errorMsg = 'No file uploaded or upload error occurred';
                if (isset($_FILES['discount_document'])) {
                    $errorMsg .= ' (Error code: ' . $_FILES['discount_document']['error'] . ')';
                }
                return $this->errorResponse($errorMsg);
            }

            $file = $_FILES['discount_document'];
            
            // Validate file size
            if ($file['size'] > $this->maxFileSize) {
                return $this->errorResponse('File size exceeds 5MB limit');
            }

            // Get file extension
            $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            
            // Validate file type
            if (!in_array($fileExtension, $this->allowedTypes)) {
                return $this->errorResponse('Invalid file type. Only PDF, JPG, and PNG files are allowed');
            }

            // Generate unique filename
            $uniqueFilename = uniqid() . '_' . time() . '.' . $fileExtension;
            $filePath = $this->uploadPath . $uniqueFilename;

            // Move uploaded file
            if (move_uploaded_file($file['tmp_name'], $filePath)) {
                // Return relative path for database storage
                $relativePath = 'uploads/discounts/' . $uniqueFilename;
                
                return $this->successResponse('File uploaded successfully', [
                    'file_path' => $relativePath,
                    'original_name' => $file['name'],
                    'file_size' => $file['size'],
                    'file_type' => $fileExtension
                ]);
            } else {
                return $this->errorResponse('Failed to save file');
            }

        } catch (Exception $e) {
            return $this->errorResponse('Upload failed: ' . $e->getMessage());
        }
    }

    /**
     * Serve discount document file
     */
    public function serveDiscountDocument($filePath) {
        try {
            // Security: Only allow files from uploads/discounts directory
            $fullPath = __DIR__ . '/../' . $filePath;
            
            // Validate file path
            if (!file_exists($fullPath) || strpos($filePath, 'uploads/discounts/') !== 0) {
                http_response_code(404);
                echo json_encode(['error' => 'File not found']);
                return;
            }

            // Get file info
            $fileInfo = pathinfo($fullPath);
            $mimeType = $this->getMimeType($fileInfo['extension']);

            // Set headers
            header('Content-Type: ' . $mimeType);
            header('Content-Disposition: inline; filename="' . basename($filePath) . '"');
            header('Content-Length: ' . filesize($fullPath));

            // Output file
            readfile($fullPath);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to serve file: ' . $e->getMessage()]);
        }
    }

    /**
     * Get MIME type based on file extension
     */
    private function getMimeType($extension) {
        $mimeTypes = [
            'pdf' => 'application/pdf',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png'
        ];

        return $mimeTypes[strtolower($extension)] ?? 'application/octet-stream';
    }

    /**
     * Delete discount document file
     */
    public function deleteDiscountDocument($filePath) {
        try {
            $fullPath = __DIR__ . '/../' . $filePath;
            
            // Security: Only allow deletion of files from uploads/discounts directory
            if (strpos($filePath, 'uploads/discounts/') !== 0) {
                return $this->errorResponse('Invalid file path');
            }

            if (file_exists($fullPath)) {
                if (unlink($fullPath)) {
                    return $this->successResponse('File deleted successfully');
                } else {
                    return $this->errorResponse('Failed to delete file');
                }
            } else {
                return $this->errorResponse('File not found');
            }

        } catch (Exception $e) {
            return $this->errorResponse('Delete failed: ' . $e->getMessage());
        }
    }

    /**
     * Success response helper
     */
    private function successResponse($message, $data = []) {
        return [
            'status' => 'success',
            'message' => $message,
            'data' => $data
        ];
    }

    /**
     * Error response helper
     */
    private function errorResponse($message) {
        return [
            'status' => 'error',
            'message' => $message
        ];
    }
}
