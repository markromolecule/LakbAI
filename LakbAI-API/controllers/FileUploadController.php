<?php

require_once __DIR__ . '/../src/providers/AppServiceProvider.php';

class FileUploadController {
    private $appProvider;
    private $baseUploadPath;
    private $allowedTypes;
    private $maxFileSize;

    public function __construct($dbConnection) {
        $this->appProvider = new AppServiceProvider($dbConnection);
        
        // Set upload configuration
        $this->baseUploadPath = __DIR__ . '/../../uploads/';
        $this->allowedTypes = ['pdf', 'jpg', 'jpeg', 'png'];
        $this->maxFileSize = 5 * 1024 * 1024; // 5MB in bytes
        
        // Create upload directories if they don't exist
        $this->createUploadDirectories();
    }

    /**
     * Create upload directories if they don't exist
     */
    private function createUploadDirectories() {
        // Create base uploads directory
        if (!file_exists($this->baseUploadPath)) {
            mkdir($this->baseUploadPath, 0755, true);
        }
        
        // Create license subdirectory
        $licensePath = $this->baseUploadPath . 'license/';
        if (!file_exists($licensePath)) {
            mkdir($licensePath, 0755, true);
        }
    }

    /**
     * Handle general document upload (for user registration documents)
     */
    public function uploadDocument($fileInputName = 'document') {
        try {
            // Check if file was uploaded
            if (!isset($_FILES[$fileInputName])) {
                return $this->errorResponse('No file uploaded');
            }

            $file = $_FILES[$fileInputName];
            
            // Enhanced validation
            $validationErrors = $this->validateFile($file);
            if (!empty($validationErrors)) {
                return $this->errorResponse('Validation failed: ' . implode(', ', $validationErrors));
            }

            // Get file extension
            $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

            // Generate unique filename with additional security
            $safeOriginalName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $file['name']);
            $uniqueFilename = uniqid() . '_' . time() . '_' . substr($safeOriginalName, 0, 20) . '.' . $fileExtension;
            $filePath = $this->baseUploadPath . $uniqueFilename;

            // Move uploaded file
            if (move_uploaded_file($file['tmp_name'], $filePath)) {
                // Set proper file permissions
                chmod($filePath, 0644);
                
                // Return relative path for database storage
                $relativePath = 'uploads/' . $uniqueFilename;
                
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
     * Handle license document upload (specifically for driver licenses)
     */
    public function uploadLicenseDocument($fileInputName = 'license_document') {
        try {
            // Check if file was uploaded
            if (!isset($_FILES[$fileInputName])) {
                return $this->errorResponse('No license file uploaded');
            }

            $file = $_FILES[$fileInputName];
            
            // Enhanced validation
            $validationErrors = $this->validateFile($file);
            if (!empty($validationErrors)) {
                return $this->errorResponse('License validation failed: ' . implode(', ', $validationErrors));
            }

            // Get file extension
            $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

            // Generate unique filename with additional security
            $safeOriginalName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $file['name']);
            $uniqueFilename = 'license_' . uniqid() . '_' . time() . '_' . substr($safeOriginalName, 0, 20) . '.' . $fileExtension;
            $filePath = $this->baseUploadPath . 'license/' . $uniqueFilename;

            // Move uploaded file
            if (move_uploaded_file($file['tmp_name'], $filePath)) {
                // Set proper file permissions
                chmod($filePath, 0644);
                
                // Return relative path for database storage
                $relativePath = 'uploads/license/' . $uniqueFilename;
                
                return $this->successResponse('License file uploaded successfully', [
                    'file_path' => $relativePath,
                    'original_name' => $file['name'],
                    'file_size' => $file['size'],
                    'file_type' => $fileExtension
                ]);
            } else {
                return $this->errorResponse('Failed to save license file');
            }

        } catch (Exception $e) {
            return $this->errorResponse('License upload failed: ' . $e->getMessage());
        }
    }

    /**
     * Handle discount document upload (DEPRECATED - use uploadDocument instead)
     * @deprecated This method is deprecated. Use uploadDocument() instead.
     */
    public function uploadDiscountDocument() {
        // Redirect to general document upload but maintain backward compatibility
        return $this->uploadDocument('discount_document');
    }

    /**
     * Serve document file (general documents and licenses)
     */
    public function serveDocument($filePath) {
        try {
            // Security: Only allow files from uploads directory
            $fullPath = __DIR__ . '/../../' . $filePath;
            
            // Validate file path - allow uploads/ and uploads/license/ paths
            if (!file_exists($fullPath) || 
                (strpos($filePath, 'uploads/') !== 0 && strpos($filePath, 'uploads/license/') !== 0)) {
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
     * Serve discount document file (DEPRECATED - use serveDocument instead)
     * @deprecated This method is deprecated. Use serveDocument() instead.
     */
    public function serveDiscountDocument($filePath) {
        // Redirect to general document serving but maintain backward compatibility
        return $this->serveDocument($filePath);
    }

    /**
     * Enhanced file validation
     */
    private function validateFile($file) {
        $errors = [];
        
        // Check if file was uploaded successfully
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $errorMessages = [
                UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize directive',
                UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE directive',
                UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
                UPLOAD_ERR_NO_FILE => 'No file was uploaded',
                UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
                UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
                UPLOAD_ERR_EXTENSION => 'File upload stopped by extension'
            ];
            
            $errors[] = $errorMessages[$file['error']] ?? 'Unknown upload error';
            return $errors;
        }
        
        // Validate file size
        if ($file['size'] > $this->maxFileSize) {
            $errors[] = 'File size exceeds ' . ($this->maxFileSize / (1024 * 1024)) . 'MB limit';
        }
        
        // Validate file size (minimum)
        if ($file['size'] < 100) { // Minimum 100 bytes
            $errors[] = 'File is too small (minimum 100 bytes)';
        }
        
        // Get file extension
        $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        // Validate file extension
        if (!in_array($fileExtension, $this->allowedTypes)) {
            $errors[] = 'Invalid file type. Only ' . implode(', ', $this->allowedTypes) . ' files are allowed';
        }
        
        // Validate MIME type (additional security)
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        $allowedMimeTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png'
        ];
        
        if (!in_array($mimeType, $allowedMimeTypes)) {
            $errors[] = 'Invalid file content. File does not match expected type';
        }
        
        // Validate filename (security)
        if (preg_match('/[^a-zA-Z0-9._-]/', $file['name'])) {
            $errors[] = 'Invalid filename. Only alphanumeric characters, dots, underscores, and hyphens are allowed';
        }
        
        // Check for suspicious file content
        if ($this->isSuspiciousFile($file['tmp_name'], $fileExtension)) {
            $errors[] = 'File content appears to be suspicious and was rejected';
        }
        
        return $errors;
    }
    
    /**
     * Check if file content is suspicious
     */
    private function isSuspiciousFile($filePath, $extension) {
        // Read first few bytes to check for executable content
        $handle = fopen($filePath, 'rb');
        if (!$handle) {
            return true; // If we can't read it, consider it suspicious
        }
        
        $header = fread($handle, 1024);
        fclose($handle);
        
        // Check for executable signatures
        $executableSignatures = [
            'MZ', // PE/EXE files
            'ELF', // Linux executables
            '#!/', // Shell scripts
            '<?php', // PHP files
            '<script', // JavaScript
            'javascript:', // JavaScript URLs
        ];
        
        foreach ($executableSignatures as $signature) {
            if (strpos($header, $signature) !== false) {
                return true;
            }
        }
        
        // Additional checks for image files
        if (in_array($extension, ['jpg', 'jpeg', 'png'])) {
            // Check for proper image headers
            $imageHeaders = [
                'jpg' => ["\xFF\xD8\xFF"],
                'jpeg' => ["\xFF\xD8\xFF"],
                'png' => ["\x89\x50\x4E\x47\x0D\x0A\x1A\x0A"]
            ];
            
            if (isset($imageHeaders[$extension])) {
                $hasValidHeader = false;
                foreach ($imageHeaders[$extension] as $header) {
                    if (strpos($header, $header) === 0) {
                        $hasValidHeader = true;
                        break;
                    }
                }
                if (!$hasValidHeader) {
                    return true;
                }
            }
        }
        
        return false;
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
     * Delete document file (general documents and licenses)
     */
    public function deleteDocument($filePath) {
        try {
            $fullPath = __DIR__ . '/../../' . $filePath;
            
            // Security: Only allow deletion of files from uploads directory
            if (strpos($filePath, 'uploads/') !== 0) {
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
     * Delete discount document file (DEPRECATED - use deleteDocument instead)
     * @deprecated This method is deprecated. Use deleteDocument() instead.
     */
    public function deleteDiscountDocument($filePath) {
        // Redirect to general document deletion but maintain backward compatibility
        return $this->deleteDocument($filePath);
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
