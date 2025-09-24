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
        
        // Create upload directories if they don't exist (silently fail if no permission)
        $this->createUploadDirectory();
        $this->createLicenseUploadDirectory();
        $this->createProfilePicturesUploadDirectory();
    }

    /**
     * Create upload directory if it doesn't exist
     */
    private function createUploadDirectory() {
        if (!file_exists($this->uploadPath)) {
            if (!@mkdir($this->uploadPath, 0755, true)) {
                // Silently fail if we can't create directory
                return false;
            }
        }
        return true;
    }

    /**
     * Create license upload directory if it doesn't exist
     */
    private function createLicenseUploadDirectory() {
        $licensePath = __DIR__ . '/../uploads/licenses/';
        if (!file_exists($licensePath)) {
            if (!@mkdir($licensePath, 0755, true)) {
                // Silently fail if we can't create directory
                return false;
            }
        }
        return true;
    }

    /**
     * Create profile pictures upload directory if it doesn't exist
     */
    private function createProfilePicturesUploadDirectory() {
        $profilePath = __DIR__ . '/../uploads/profile_pictures/';
        if (!file_exists($profilePath)) {
            @mkdir($profilePath, 0755, true);
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
     * Handle driver license upload
     */
    public function uploadDriverLicense() {
        try {
            // Check if file was uploaded
            if (!isset($_FILES['drivers_license']) || $_FILES['drivers_license']['error'] !== UPLOAD_ERR_OK) {
                $errorMsg = 'No file uploaded or upload error occurred';
                if (isset($_FILES['drivers_license'])) {
                    $errorMsg .= ' (Error code: ' . $_FILES['drivers_license']['error'] . ')';
                }
                return $this->errorResponse($errorMsg);
            }

            $file = $_FILES['drivers_license'];
            
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
            $licensePath = __DIR__ . '/../uploads/licenses/';
            $filePath = $licensePath . $uniqueFilename;

            // Move uploaded file
            if (move_uploaded_file($file['tmp_name'], $filePath)) {
                // Return relative path for database storage
                $relativePath = 'uploads/licenses/' . $uniqueFilename;
                
                return $this->successResponse('Driver license uploaded successfully', [
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
     * Serve driver license file
     */
    public function serveDriverLicense($filePath) {
        try {
            // Security: Only allow files from uploads/licenses directory
            $fullPath = __DIR__ . '/../' . $filePath;
            
            // Validate file path
            if (!file_exists($fullPath) || strpos($filePath, 'uploads/licenses/') !== 0) {
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
     * Delete driver license file
     */
    public function deleteDriverLicense($filePath) {
        try {
            $fullPath = __DIR__ . '/../' . $filePath;
            
            // Security: Only allow deletion of files from uploads/licenses directory
            if (strpos($filePath, 'uploads/licenses/') !== 0) {
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
     * Error response helper
     */
    private function errorResponse($message) {
        return [
            'status' => 'error',
            'message' => $message
        ];
    }

    /**
     * Handle profile picture upload
     */
    public function uploadProfilePicture() {
        try {
            // Check if file was uploaded
            if (!isset($_FILES['profile_picture']) || $_FILES['profile_picture']['error'] !== UPLOAD_ERR_OK) {
                $errorMsg = 'No file uploaded or upload error occurred';
                if (isset($_FILES['profile_picture']['error'])) {
                    switch ($_FILES['profile_picture']['error']) {
                        case UPLOAD_ERR_INI_SIZE:
                        case UPLOAD_ERR_FORM_SIZE:
                            $errorMsg = 'File size too large';
                            break;
                        case UPLOAD_ERR_PARTIAL:
                            $errorMsg = 'File upload was interrupted';
                            break;
                        case UPLOAD_ERR_NO_FILE:
                            $errorMsg = 'No file was uploaded';
                            break;
                        default:
                            $errorMsg = 'Unknown upload error';
                    }
                }
                return $this->errorResponse($errorMsg);
            }

            $file = $_FILES['profile_picture'];
            $userId = $_POST['user_id'] ?? null;

            if (!$userId) {
                return $this->errorResponse('User ID is required');
            }

            // Validate file type
            $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            if (!in_array($fileExtension, $this->allowedTypes)) {
                return $this->errorResponse('Invalid file type. Only JPG, JPEG, PNG files are allowed.');
            }

            // Validate file size
            if ($file['size'] > $this->maxFileSize) {
                return $this->errorResponse('File size too large. Maximum size is 5MB.');
            }

            // Generate unique filename
            $profilePath = __DIR__ . '/../uploads/profile_pictures/';
            $fileName = 'profile_' . $userId . '_' . time() . '.' . $fileExtension;
            $filePath = $profilePath . $fileName;

            // Move uploaded file
            if (move_uploaded_file($file['tmp_name'], $filePath)) {
                
                // Return relative path for database storage
                $relativePath = 'uploads/profile_pictures/' . $fileName;
                
                return [
                    'status' => 'success',
                    'message' => 'Profile picture uploaded successfully',
                    'file_path' => $relativePath,
                    'file_name' => $fileName
                ];
            } else {
                return $this->errorResponse('Failed to save uploaded file');
            }

        } catch (Exception $e) {
            return $this->errorResponse('Upload failed: ' . $e->getMessage());
        }
    }

    /**
     * Serve profile picture
     */
    public function serveProfilePicture($filePath) {
        try {
            // Handle both full paths and relative paths
            if (strpos($filePath, 'uploads/profile_pictures/') === 0) {
                // If it's a relative path starting with uploads/profile_pictures/
                $fullPath = __DIR__ . '/../' . $filePath;
            } else {
                // If it's just a filename, construct the full path
                $fullPath = __DIR__ . '/../uploads/profile_pictures/' . basename($filePath);
            }
            
            if (!file_exists($fullPath)) {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'File not found']);
                return;
            }

            // Get file info
            $fileInfo = pathinfo($fullPath);
            $extension = strtolower($fileInfo['extension']);

            // Set appropriate content type
            switch ($extension) {
                case 'jpg':
                case 'jpeg':
                    header('Content-Type: image/jpeg');
                    break;
                case 'png':
                    header('Content-Type: image/png');
                    break;
                default:
                    header('Content-Type: application/octet-stream');
            }

            // Output file
            readfile($fullPath);
            exit;

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Failed to serve file: ' . $e->getMessage()]);
        }
    }
}
