<?php
/**
 * Driver Management API - Admin Only
 * RESTful endpoints for driver CRUD operations
 * Requires admin authentication
 */

// Enhanced CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept, X-Requested-With, X-Admin-ID');
header('Access-Control-Allow-Credentials: false');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'CORS preflight OK']);
    exit;
}

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Load database configuration
require_once __DIR__ . '/../config/db.php';

// Load the Driver model
require_once __DIR__ . '/../src/models/Driver.php';

// Initialize Driver model with PDO connection
$driverModel = new Driver($pdo);

/**
 * Helper function to get admin ID from headers
 */
function getAdminId() {
    $headers = getallheaders();
    
    // Check X-Admin-ID header first
    if (isset($headers['X-Admin-ID'])) {
        return $headers['X-Admin-ID'];
    }
    
    // Check Authorization header (Bearer token format)
    if (isset($headers['Authorization'])) {
        $auth = $headers['Authorization'];
        if (strpos($auth, 'Bearer ') === 0) {
            return substr($auth, 7); // Remove 'Bearer ' prefix
        }
    }
    
    // Check for admin_id in POST/GET data
    if (isset($_POST['admin_id'])) {
        return $_POST['admin_id'];
    }
    
    if (isset($_GET['admin_id'])) {
        return $_GET['admin_id'];
    }
    
    return null;
}

/**
 * Verify admin authentication
 */
function verifyAdminAuth() {
    $adminId = getAdminId();
    
    if (!$adminId) {
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Admin authentication required'
        ]);
        exit;
    }
    
    global $driverModel;
    if (!$driverModel->verifyAdminAuth($adminId)) {
        http_response_code(403);
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid admin credentials or insufficient permissions'
        ]);
        exit;
    }
    
    return $adminId;
}

/**
 * Get request data
 */
function getRequestData() {
    $input = $_POST;
    if (empty($input)) {
        $input = json_decode(file_get_contents('php://input'), true);
    }
    return $input ?: [];
}

/**
 * Parse URL path to get driver ID
 */
function getDriverIdFromPath() {
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathParts = explode('/', trim($path, '/'));
    
    // Look for driver ID in the path
    foreach ($pathParts as $i => $part) {
        if ($part === 'update' || $part === 'delete') {
            if (isset($pathParts[$i + 1]) && is_numeric($pathParts[$i + 1])) {
                return (int)$pathParts[$i + 1];
            }
        }
    }
    
    return null;
}

try {
    // Verify admin authentication for all endpoints
    $adminId = verifyAdminAuth();
    
    $method = $_SERVER['REQUEST_METHOD'];
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathParts = explode('/', trim($path, '/'));
    
    // Route based on HTTP method and path
    switch ($method) {
        case 'GET':
            if (in_array('drivers', $pathParts)) {
                // Check if it's a specific driver request
                $driverId = null;
                foreach ($pathParts as $i => $part) {
                    if (is_numeric($part) && isset($pathParts[$i - 1]) && $pathParts[$i - 1] === 'drivers') {
                        $driverId = (int)$part;
                        break;
                    }
                }
                
                if ($driverId) {
                    // GET /drivers/{id} - Get single driver
                    $result = $driverModel->getDriverById($driverId);
                    $statusCode = $result['status'] === 'success' ? 200 : 404;
                    http_response_code($statusCode);
                    echo json_encode($result);
                } else {
                    // GET /drivers - Get all drivers
                    $result = $driverModel->getAllDrivers();
                    http_response_code(200);
                    echo json_encode($result);
                }
            } else {
                http_response_code(404);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Endpoint not found'
                ]);
            }
            break;
            
        case 'POST':
            if (in_array('create', $pathParts)) {
                // POST /drivers/create - Create new driver
                $data = getRequestData();
                $result = $driverModel->createDriver($data);
                $statusCode = $result['status'] === 'success' ? 201 : 400;
                http_response_code($statusCode);
                echo json_encode($result);
            } else {
                http_response_code(404);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Endpoint not found'
                ]);
            }
            break;
            
        case 'PUT':
            if (in_array('update', $pathParts)) {
                // PUT /drivers/update/{id} - Update driver
                $driverId = getDriverIdFromPath();
                
                if (!$driverId) {
                    http_response_code(400);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Driver ID required'
                    ]);
                    break;
                }
                
                $data = getRequestData();
                $result = $driverModel->updateDriver($driverId, $data);
                $statusCode = $result['status'] === 'success' ? 200 : 404;
                http_response_code($statusCode);
                echo json_encode($result);
            } else {
                http_response_code(404);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Endpoint not found'
                ]);
            }
            break;
            
        case 'DELETE':
            if (in_array('delete', $pathParts)) {
                // DELETE /drivers/delete/{id} - Delete driver
                $driverId = getDriverIdFromPath();
                
                if (!$driverId) {
                    http_response_code(400);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Driver ID required'
                    ]);
                    break;
                }
                
                $result = $driverModel->deleteDriver($driverId);
                $statusCode = $result['status'] === 'success' ? 200 : 404;
                http_response_code($statusCode);
                echo json_encode($result);
            } else {
                http_response_code(404);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Endpoint not found'
                ]);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode([
                'status' => 'error',
                'message' => 'Method not allowed'
            ]);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
