<?php
// Enhanced CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept, X-Requested-With');
header('Access-Control-Allow-Credentials: false');
header('Access-Control-Max-Age: 0');
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

// Bootstrap the application with new architecture
$app = require_once __DIR__ . '/../bootstrap/app.php';
require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/Auth0Controller.php';
require_once __DIR__ . '/../controllers/JeepneyController.php';
require_once __DIR__ . '/../controllers/DriverController.php';
require_once __DIR__ . '/../controllers/RouteController.php';
require_once __DIR__ . '/../controllers/CheckpointController.php';
require_once __DIR__ . '/../controllers/EarningsController.php';
require_once __DIR__ . '/../controllers/FileUploadController.php';
require_once __DIR__ . '/../controllers/DiscountController.php';


// Initialize controller with database connection
$authController = new AuthController($app->get('Database'));
$auth0Controller = new Auth0Controller($app->get('Database'));
// Controllers below expect PDO; provide the PDO service registered in bootstrap/app.php
$jeepneyController = new JeepneyController($app->get('PDO'));
$driverController = new DriverController($app->get('PDO'));
$routeController = new RouteController($app->get('PDO'));
$checkpointController = new CheckpointController($app->get('PDO'));
$earningsController = new EarningsController();
$fileUploadController = new FileUploadController($app->get('Database'));
$discountController = new DiscountController($app->get('Database'));

// Get the request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$rawParts = array_values(array_filter(explode('/', trim($path, '/'))));

// Normalize path: support both /LakbAI/LakbAI-API/api/... and /api/...
$idxApiRoot = array_search('LakbAI-API', $rawParts, true);
if ($idxApiRoot !== false) {
    $rawParts = array_slice($rawParts, $idxApiRoot + 1);
}
if (isset($rawParts[0]) && $rawParts[0] === 'api') {
    $rawParts = array_slice($rawParts, 1);
}

// Debug logging (remove in production)
error_log("API Request - Method: $method, Path: $path");
error_log("RawParts: " . json_encode($rawParts));

// Use normalized parts
$pathParts = $rawParts;

// Get request data
$input = [];
if ($method === 'POST' || $method === 'PUT' || $method === 'PATCH') {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    
    if (strpos($contentType, 'application/json') !== false) {
        $input = json_decode(file_get_contents('php://input'), true);
    } else {
        $input = $_POST;
    }
}

/**
 * Transform mobile app data to API format
 */
function transformMobileRegistrationData($mobileData) {
    // Convert mobile app field names to API field names
    $transformed = [];
    
    // Basic fields
    $transformed['username'] = $mobileData['username'] ?? '';
    $transformed['email'] = $mobileData['email'] ?? '';
    $transformed['password'] = $mobileData['password'] ?? '';
    $transformed['first_name'] = $mobileData['firstName'] ?? '';
    $transformed['last_name'] = $mobileData['lastName'] ?? '';
    $transformed['phone_number'] = $mobileData['phoneNumber'] ?? '';
    $transformed['gender'] = ucfirst(strtolower($mobileData['gender'] ?? ''));
    
    // Address fields
    $transformed['house_number'] = $mobileData['houseNumber'] ?? '';
    $transformed['street_name'] = $mobileData['streetName'] ?? '';
    $transformed['barangay'] = $mobileData['barangay'] ?? '';
    $transformed['city_municipality'] = $mobileData['cityMunicipality'] ?? '';
    $transformed['province'] = $mobileData['province'] ?? '';
    $transformed['postal_code'] = $mobileData['postalCode'] ?? '';
    
    // Birthday conversion from separate fields
    if (isset($mobileData['birthMonth'], $mobileData['birthDate'], $mobileData['birthYear'])) {
        $monthMap = [
            'January' => '01', 'February' => '02', 'March' => '03', 'April' => '04',
            'May' => '05', 'June' => '06', 'July' => '07', 'August' => '08',
            'September' => '09', 'October' => '10', 'November' => '11', 'December' => '12'
        ];
        
        $month = $monthMap[$mobileData['birthMonth']] ?? '01';
        $day = str_pad($mobileData['birthDate'], 2, '0', STR_PAD_LEFT);
        $year = $mobileData['birthYear'];
        
        $transformed['birthday'] = "$year-$month-$day";
    }
    
    // User type and discount
    $transformed['user_type'] = 'passenger'; // Default for mobile registration
    
    // Handle discount information
    if (isset($mobileData['fareDiscount']) && $mobileData['fareDiscount']['type']) {
        $transformed['discount_type'] = $mobileData['fareDiscount']['type'];
        
        // Handle document upload (for now, just store the name)
        if (isset($mobileData['fareDiscount']['document'])) {
            $transformed['discount_document_name'] = $mobileData['fareDiscount']['document']['name'] ?? null;
            // Note: File upload handling would need additional implementation
            $transformed['discount_document_path'] = null; // Will be handled separately
        }
    }
    
    return $transformed;
}

// Route handling
try {
    // ---------------------------
    // Jeepney CRUD Routes
    // ---------------------------
    if ($pathParts[0] === 'admin' && isset($pathParts[1]) && $pathParts[1] === 'jeepneys') {
        // GET /admin/jeepneys
        if ($method === 'GET' && count($pathParts) === 2) {
            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 10;

            $result = $jeepneyController->getJeepneys($page, $limit);
            echo json_encode($result);
            exit;
        }

        // POST /admin/jeepneys
        if ($method === 'POST' && count($pathParts) === 2) {
            $result = $jeepneyController->createJeepney($input);
            echo json_encode($result);
            exit;
        }

        // PUT /admin/jeepneys/{id}
        if ($method === 'PUT' && count($pathParts) === 3) {
            $jeepneyId = $pathParts[2];
            $result = $jeepneyController->updateJeepney($jeepneyId, $input);
            echo json_encode($result);
            exit;
        }

        // DELETE /admin/jeepneys/{id}
        if ($method === 'DELETE' && count($pathParts) === 3) {
            $jeepneyId = $pathParts[2];
            $result = $jeepneyController->deleteJeepney($jeepneyId);
            echo json_encode($result);
            exit;
        }
    }

    // ---------------------------
    // Driver Routes
    // ---------------------------
    if ($pathParts[0] === 'admin' && isset($pathParts[1]) && $pathParts[1] === 'drivers') {
        // GET /admin/drivers - Get all drivers
        if ($method === 'GET' && count($pathParts) === 2) {
            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 10;
            $result = $driverController->getAllDrivers($page, $limit);
            echo json_encode($result);
            exit;
        }

        // GET /admin/drivers/search?q=query
        if ($method === 'GET' && count($pathParts) === 3 && $pathParts[2] === 'search') {
            $query = $_GET['q'] ?? '';
            $limit = $_GET['limit'] ?? 10;
            $result = $driverController->searchDrivers($query, $limit);
            echo json_encode($result);
            exit;
        }

        // GET /admin/drivers/available
        if ($method === 'GET' && count($pathParts) === 3 && $pathParts[2] === 'available') {
            $result = $driverController->getAvailableDrivers();
            echo json_encode($result);
            exit;
        }

        // GET /admin/drivers/{id}
        if ($method === 'GET' && count($pathParts) === 3 && is_numeric($pathParts[2])) {
            $driverId = $pathParts[2];
            $result = $driverController->getDriverById($driverId);
            echo json_encode($result);
            exit;
        }
    }

    // ---------------------------
    // Mobile Driver Routes
    // ---------------------------
    if ($pathParts[0] === 'mobile' && isset($pathParts[1]) && $pathParts[1] === 'driver') {
        // GET /mobile/driver/profile/{id}
        if ($method === 'GET' && count($pathParts) === 4 && $pathParts[2] === 'profile' && is_numeric($pathParts[3])) {
            $driverId = $pathParts[3];
            $result = $driverController->getDriverProfile($driverId);
            echo json_encode($result);
            exit;
        }

        // GET /mobile/driver/info/{id} - For QR scanning
        if ($method === 'GET' && count($pathParts) === 4 && $pathParts[2] === 'info' && is_numeric($pathParts[3])) {
            $driverId = $pathParts[3];
            $result = $driverController->getDriverWithJeepney($driverId);
            echo json_encode($result);
            exit;
        }

        // GET /admin/drivers
        if ($method === 'GET' && count($pathParts) === 2) {
            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 10;
            $result = $driverController->getAllDrivers($page, $limit);
            echo json_encode($result);
            exit;
        }
    }

    // ---------------------------
    // EARNINGS ROUTES
    // ---------------------------
    if (isset($pathParts[0]) && $pathParts[0] === 'earnings') {
        // GET /earnings/driver/{id}
        if ($method === 'GET' && count($pathParts) === 3 && $pathParts[1] === 'driver' && is_numeric($pathParts[2])) {
            $driverId = $pathParts[2];
            $result = $earningsController->getDriverEarnings($driverId);
            echo json_encode($result);
            exit;
        }

        // POST /earnings/add
        if ($method === 'POST' && count($pathParts) === 2 && $pathParts[1] === 'add') {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['driverId']) || !isset($input['tripId']) || !isset($input['finalFare'])) {
                echo json_encode([
                    "status" => "error",
                    "message" => "Missing required fields: driverId, tripId, finalFare"
                ]);
                exit;
            }
            
            $result = $earningsController->addEarnings($input);
            echo json_encode($result);
            exit;
        }

        // GET /earnings/transactions/{driverId}
        if ($method === 'GET' && count($pathParts) === 3 && $pathParts[1] === 'transactions' && is_numeric($pathParts[2])) {
            $driverId = $pathParts[2];
            $limit = $_GET['limit'] ?? 50;
            $offset = $_GET['offset'] ?? 0;
            
            $result = $earningsController->getTransactionHistory($driverId, $limit, $offset);
            echo json_encode($result);
            exit;
        }
    }

    // Shift management routes
    if (isset($pathParts[0]) && $pathParts[0] === 'earnings' && isset($pathParts[1]) && $pathParts[1] === 'shift') {
        // POST /earnings/shift/end
        if ($method === 'POST' && count($pathParts) === 3 && $pathParts[2] === 'end') {
            $input = json_decode(file_get_contents('php://input'), true);
            $result = $earningsController->endShift($input);
            echo json_encode($result);
            exit;
        }
        
        // POST /earnings/shift/start
        if ($method === 'POST' && count($pathParts) === 3 && $pathParts[2] === 'start') {
            $input = json_decode(file_get_contents('php://input'), true);
            $result = $earningsController->startShift($input);
            echo json_encode($result);
            exit;
        }
    }

    // ---------------------------
    // Route Routes
    // ---------------------------
    if ($pathParts[0] === 'admin' && isset($pathParts[1]) && $pathParts[1] === 'routes') {
        // GET /admin/routes
        if ($method === 'GET' && count($pathParts) === 2) {
            $result = $routeController->getAllRoutes();
            echo json_encode($result);
            exit;
        }

        // GET /admin/routes/{id}
        if ($method === 'GET' && count($pathParts) === 3 && is_numeric($pathParts[2])) {
            $routeId = $pathParts[2];
            $result = $routeController->getRouteById($routeId);
            echo json_encode($result);
            exit;
        }

        // POST /admin/routes
        if ($method === 'POST' && count($pathParts) === 2) {
            $result = $routeController->createRoute($input);
            echo json_encode($result);
            exit;
        }

        // PUT /admin/routes/{id}
        if ($method === 'PUT' && count($pathParts) === 3) {
            $routeId = $pathParts[2];
            $result = $routeController->updateRoute($routeId, $input);
            echo json_encode($result);
            exit;
        }

        // DELETE /admin/routes/{id}
        if ($method === 'DELETE' && count($pathParts) === 3) {
            $routeId = $pathParts[2];
            $result = $routeController->deleteRoute($routeId);
            echo json_encode($result);
            exit;
        }
    }

    // ---------------------------
    // Checkpoint Routes
    // ---------------------------
    if ($pathParts[0] === 'admin' && isset($pathParts[1]) && $pathParts[1] === 'checkpoints') {
        // GET /admin/checkpoints
        if ($method === 'GET' && count($pathParts) === 2) {
            $result = $checkpointController->getAllCheckpoints();
            echo json_encode($result);
            exit;
        }

        // GET /admin/checkpoints/route/{routeId}
        if ($method === 'GET' && count($pathParts) === 4 && $pathParts[2] === 'route') {
            $routeId = $pathParts[3];
            $result = $checkpointController->getCheckpointsByRoute($routeId);
            echo json_encode($result);
            exit;
        }

        // GET /admin/checkpoints/{id}
        if ($method === 'GET' && count($pathParts) === 3 && is_numeric($pathParts[2])) {
            $checkpointId = $pathParts[2];
            $result = $checkpointController->getCheckpointById($checkpointId);
            echo json_encode($result);
            exit;
        }

        // POST /admin/checkpoints
        if ($method === 'POST' && count($pathParts) === 2) {
            $result = $checkpointController->createCheckpoint($input);
            echo json_encode($result);
            exit;
        }

        // PUT /admin/checkpoints/{id}
        if ($method === 'PUT' && count($pathParts) === 3) {
            $checkpointId = $pathParts[2];
            $result = $checkpointController->updateCheckpoint($checkpointId, $input);
            echo json_encode($result);
            exit;
        }

        // DELETE /admin/checkpoints/{id}
        if ($method === 'DELETE' && count($pathParts) === 3) {
            $checkpointId = $pathParts[2];
            $result = $checkpointController->deleteCheckpoint($checkpointId);
            echo json_encode($result);
            exit;
        }
    }

    // Handle requests with actions in the request body (for mobile app)
    if (isset($input['action']) && $method === 'POST') {
        switch ($input['action']) {
            case 'register':
                // Check if this is web registration (already in correct format) or mobile
                $isWebRegistration = isset($input['first_name']) && isset($input['last_name']) && isset($input['phone_number']);
                
                if ($isWebRegistration) {
                    // Web registration - data is already in correct format
                    $transformedData = $input;
                } else {
                    // Mobile registration - transform data format
                    $transformedData = transformMobileRegistrationData($input);
                }
                
                $result = $authController->register($transformedData);
                echo json_encode($result);
                exit;
                
            case 'register-with-files':
                try {
                    // Handle file uploads first
                    $uploadedFiles = [];
                    
                    // Check for discount document upload
                    if (isset($_FILES['discount_document']) && $_FILES['discount_document']['error'] === UPLOAD_ERR_OK) {
                        $uploadResult = $fileUploadController->uploadDocument('discount_document');
                        if ($uploadResult['status'] === 'success') {
                            $uploadedFiles['discount_document_path'] = $uploadResult['data']['file_path'];
                            $uploadedFiles['discount_document_name'] = $uploadResult['data']['original_name'];
                        } else {
                            echo json_encode($uploadResult);
                            exit;
                        }
                    }
                    
                    // Check for license document upload
                    if (isset($_FILES['license_document']) && $_FILES['license_document']['error'] === UPLOAD_ERR_OK) {
                        $uploadResult = $fileUploadController->uploadLicenseDocument('license_document');
                        if ($uploadResult['status'] === 'success') {
                            $uploadedFiles['drivers_license_path'] = $uploadResult['data']['file_path'];
                            $uploadedFiles['drivers_license_name'] = $uploadResult['data']['original_name'];
                        } else {
                            echo json_encode($uploadResult);
                            exit;
                        }
                    }
                    
                    // Merge uploaded file data with registration data
                    $registrationData = array_merge($input, $uploadedFiles);
                    
                    // Check if this is web registration or mobile
                    $isWebRegistration = isset($registrationData['first_name']) && isset($registrationData['last_name']) && isset($registrationData['phone_number']);
                    
                    if ($isWebRegistration) {
                        // Web registration - data is already in correct format
                        $transformedData = $registrationData;
                    } else {
                        // Mobile registration - transform data format
                        $transformedData = transformMobileRegistrationData($registrationData);
                    }
                    
                    $result = $authController->register($transformedData);
                    echo json_encode($result);
                    exit;
                    
                } catch (Exception $e) {
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Registration with files failed: ' . $e->getMessage()
                    ]);
                    exit;
                }
                
            case 'login':
                $result = $authController->login($input);
                echo json_encode($result);
                exit;
                
            default:
                // Unknown action, continue to path-based routing
                break;
        }
    }
    
    // Traditional path-based Auth routes (for web)
    if (end($pathParts) === 'register' && $method === 'POST') {
        // Check if this is web registration (already in correct format) or mobile
        $isWebRegistration = isset($input['first_name']) && isset($input['last_name']) && isset($input['phone_number']);
        
        if ($isWebRegistration) {
            // Web registration - data is already in correct format
            $transformedData = $input;
        } else {
            // Mobile registration - transform data format
            $transformedData = transformMobileRegistrationData($input);
        }
        
        $result = $authController->register($transformedData);
        echo json_encode($result);
        exit;
    }

    // Enhanced registration with file upload support
    if (end($pathParts) === 'register-with-files' && $method === 'POST') {
        try {
            // Handle file uploads first
            $uploadedFiles = [];
            
            // Check for discount document upload
            if (isset($_FILES['discount_document']) && $_FILES['discount_document']['error'] === UPLOAD_ERR_OK) {
                $uploadResult = $fileUploadController->uploadDocument('discount_document');
                if ($uploadResult['status'] === 'success') {
                    $uploadedFiles['discount_document_path'] = $uploadResult['data']['file_path'];
                    $uploadedFiles['discount_document_name'] = $uploadResult['data']['original_name'];
                } else {
                    echo json_encode($uploadResult);
                    exit;
                }
            }
            
            // Check for license document upload
            if (isset($_FILES['license_document']) && $_FILES['license_document']['error'] === UPLOAD_ERR_OK) {
                $uploadResult = $fileUploadController->uploadLicenseDocument('license_document');
                if ($uploadResult['status'] === 'success') {
                    $uploadedFiles['drivers_license_path'] = $uploadResult['data']['file_path'];
                    $uploadedFiles['drivers_license_name'] = $uploadResult['data']['original_name'];
                } else {
                    echo json_encode($uploadResult);
                    exit;
                }
            }
            
            // Merge uploaded file data with registration data
            $registrationData = array_merge($input, $uploadedFiles);
            
            // Check if this is web registration or mobile
            $isWebRegistration = isset($registrationData['first_name']) && isset($registrationData['last_name']) && isset($registrationData['phone_number']);
            
            if ($isWebRegistration) {
                // Web registration - data is already in correct format
                $transformedData = $registrationData;
            } else {
                // Mobile registration - transform data format
                $transformedData = transformMobileRegistrationData($registrationData);
            }
            
            $result = $authController->register($transformedData);
            echo json_encode($result);
            exit;
            
        } catch (Exception $e) {
            echo json_encode([
                'status' => 'error',
                'message' => 'Registration with files failed: ' . $e->getMessage()
            ]);
            exit;
        }
    }
    
    if (end($pathParts) === 'login' && $method === 'POST') {
        $result = $authController->login($input);
        echo json_encode($result);
        exit;
    }
    
    // Profile routes
    if (end($pathParts) === 'profile' && $method === 'GET') {
        $userId = $_GET['user_id'] ?? null;
        if (!$userId) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'User ID required']);
            exit;
        }
        
        $result = $authController->getProfile($userId);
        echo json_encode($result);
        exit;
    }

    // Get discount status for mobile users
    if (end($pathParts) === 'discount-status' && $method === 'GET') {
        $userId = $_GET['user_id'] ?? null;
        if (!$userId) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'User ID required']);
            exit;
        }
        
        $result = $authController->getDiscountStatus($userId);
        echo json_encode($result);
        exit;
    }
    
    if (end($pathParts) === 'profile' && $method === 'PUT') {
        $userId = $input['user_id'] ?? null;
        if (!$userId) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'User ID required']);
            exit;
        }
        
        $result = $authController->updateProfile($userId, $input);
        echo json_encode($result);
        exit;
    }
    
    // Check user existence
    if (end($pathParts) === 'check-exists' && $method === 'POST') {
        $field = $input['field'] ?? null;
        $value = $input['value'] ?? null;
        
        if (!$field || !$value) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Field and value required']);
            exit;
        }
        
        $result = $authController->checkUserExists($field, $value);
        echo json_encode($result);
        exit;
    }

    // Debug: Log all routes being processed
    error_log("Processing route - Method: $method, PathParts: " . json_encode($pathParts));
    
    // Simple test endpoint to verify routing
    if (in_array('test-auth0', $pathParts) && $method === 'GET') {
        echo json_encode([
            'status' => 'success',
            'message' => 'Auth0 test endpoint working',
            'pathParts' => $pathParts,
            'method' => $method
        ]);
        exit;
    }

    // Public: checkpoints for routes (shared admin/mobile)
    if (end($pathParts) === 'checkpoints' && $method === 'GET') {
        echo json_encode([
            'status' => 'success',
            'data' => [
                'SM Epza',
                'Robinson Tejero',
                'Malabon',
                'Riverside',
                'Lancaster New City',
                'Pasong Camachile I',
                'Open Canal',
                'Santiago',
                'Bella Vista',
                'San Francisco',
                'Country Meadow',
                'Pabahay',
                'Monterey',
                'Langkaan',
                'Tierra Vista',
                'Robinson Dasmariñas',
                'SM Dasmariñas',
            ]
        ]);
        exit;
    }
    
    // Auth0 Integration Routes - Single endpoint for all Auth0 actions
    if (in_array('auth0', $pathParts) && $method === 'POST') {
        error_log("Auth0 endpoint matched! PathParts: " . json_encode($pathParts));
        $action = $input['action'] ?? '';
        error_log("Auth0 action: " . $action);
        
        switch ($action) {
            case 'token_exchange':
                $result = $auth0Controller->exchangeTokens($input);
                break;
            case 'auth0_sync':
                $result = $auth0Controller->syncUser($input);
                break;
            case 'complete_profile':
                $result = $auth0Controller->completeProfile($input);
                break;
            default:
                $result = ['status' => 'error', 'message' => 'Invalid Auth0 action: ' . $action];
                break;
        }
        
        echo json_encode($result);
        exit;
    }
    
    // Test route
    if (end($pathParts) === 'test' && $method === 'GET') {
        echo json_encode([
            'status' => 'success',
            'message' => 'LakbAI API is working with clean architecture!',
            'timestamp' => date('Y-m-d H:i:s'),
            'version' => '2.0',
            'debug' => [
                'method' => $method,
                'path' => $path,
                'pathParts' => $pathParts
            ]
        ]);
        exit;
    }

    // Health check route
    if (empty($pathParts) || $pathParts[0] === '' && $method === 'GET') {
        echo json_encode([
            'status' => 'success',
            'message' => 'LakbAI API is running',
            'timestamp' => date('Y-m-d H:i:s'),
            'endpoints' => [
                'GET /test' => 'API test endpoint',
                'GET /admin/users' => 'Get all users (admin)',
                'GET /admin/pending-approvals' => 'Get pending approvals',
                'POST /register' => 'User registration',
                'POST /login' => 'User login',
                'POST /auth0' => 'Auth0 integration (token exchange, sync, profile completion)',
                'GET /jeepneys' => 'Get all jeepneys',
                'POST /jeepneys' => 'Create jeepney',
                'PUT /jeepneys/{id}' => 'Update jeepney',
                'DELETE /jeepneys/{id}' => 'Delete jeepney'
            ]
        ]);
        exit;
    }
    
    // Debug: Log all unmatched routes
    error_log("Unmatched route - Method: $method, PathParts: " . json_encode($pathParts));
    
    // Admin user management routes
    if ($pathParts[0] === 'admin' && count($pathParts) >= 2) {
        // Get all users with filtering (only if no additional path parts)
        if ($pathParts[1] === 'users' && $method === 'GET' && count($pathParts) === 2) {
            $userType = $_GET['user_type'] ?? null;
            $discountStatus = $_GET['discount_status'] ?? null;
            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 10;
            
            $result = $authController->getUsers($userType, $discountStatus, $page, $limit);
            echo json_encode($result);
            exit;
        }
        
        // Update user (admin action)
        if ($pathParts[1] === 'users' && isset($pathParts[2]) && $method === 'PUT') {
            $userId = $pathParts[2];
            $result = $authController->adminUpdateUser($userId, $input);
            echo json_encode($result);
            exit;
        }
        
        // Delete user (admin action)
        if ($pathParts[1] === 'users' && isset($pathParts[2]) && $method === 'DELETE') {
            $userId = $pathParts[2];
            $result = $authController->deleteUser($userId);
            echo json_encode($result);
            exit;
        }
        
        // Approve discount application
        if ($pathParts[1] === 'approve-discount' && $method === 'POST') {
            $userId = $input['user_id'] ?? null;
            $approved = $input['approved'] ?? false;
            $rejectionReason = $input['rejection_reason'] ?? null;
            $result = $authController->approveDiscount($userId, $approved, $rejectionReason);
            echo json_encode($result);
            exit;
        }

        // Approve driver license
        if ($pathParts[1] === 'approve-license' && $method === 'POST') {
            $userId = $input['user_id'] ?? null;
            $approved = $input['approved'] ?? false;
            $result = $authController->approveDriverLicense($userId, $approved);
            echo json_encode($result);
            exit;
        }
        
        // Get pending approvals
        if ($pathParts[1] === 'pending-approvals' && $method === 'GET') {
            $result = $authController->getPendingApprovals();
            echo json_encode($result);
            exit;
        }

        // Get all discount applications
        if ($pathParts[1] === 'discount-applications' && $method === 'GET') {
            $result = $authController->getAllDiscountApplications();
            echo json_encode($result);
            exit;
        }

        // Serve documents
        if ($pathParts[1] === 'documents' && isset($pathParts[2]) && $method === 'GET') {
            $documentPath = $pathParts[2];
            $fullPath = __DIR__ . '/../uploads/' . $documentPath;
            
            if (file_exists($fullPath) && is_readable($fullPath)) {
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
                
                header('Content-Type: ' . $contentType);
                header('Content-Disposition: inline; filename="' . $fileInfo['basename'] . '"');
                header('Content-Length: ' . filesize($fullPath));
                header('Cache-Control: public, max-age=3600');
                
                readfile($fullPath);
                exit;
            } else {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'Document not found']);
                exit;
            }
        }
    }

    // File upload routes - New structure
    if (end($pathParts) === 'upload-document' && $method === 'POST') {
        $result = $fileUploadController->uploadDocument();
        echo json_encode($result);
        exit;
    }

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

    // ---------------------------
    // Discount Management Routes
    // ---------------------------
    
    // GET /users/{id}/discount - Get user discount status
    if ($pathParts[0] === 'users' && isset($pathParts[1]) && is_numeric($pathParts[1]) && 
        isset($pathParts[2]) && $pathParts[2] === 'discount' && $method === 'GET') {
        $userId = $pathParts[1];
        $result = $discountController->getUserDiscountStatus($userId);
        echo json_encode($result);
        exit;
    }

    // PATCH /users/{id}/discount - Update discount status (admin only)
    if ($pathParts[0] === 'users' && isset($pathParts[1]) && is_numeric($pathParts[1]) && 
        isset($pathParts[2]) && $pathParts[2] === 'discount' && $method === 'PATCH') {
        $userId = $pathParts[1];
        $status = $input['status'] ?? '';
        $discountAmount = $input['discount_amount'] ?? null;
        $rejectionReason = $input['rejection_reason'] ?? null;
        
        $result = $discountController->updateDiscountStatus($userId, $status, $discountAmount, $rejectionReason);
        echo json_encode($result);
        exit;
    }

    // GET /admin/discount-applications - Get all pending discount applications
    if ($pathParts[0] === 'admin' && isset($pathParts[1]) && $pathParts[1] === 'discount-applications' && $method === 'GET') {
        $result = $discountController->getPendingDiscountApplications();
        echo json_encode($result);
        exit;
    }

    // GET /admin/users/{id}/review - Get detailed user info for discount review
    if ($pathParts[0] === 'admin' && isset($pathParts[1]) && $pathParts[1] === 'users' && 
        isset($pathParts[2]) && is_numeric($pathParts[2]) && isset($pathParts[3]) && $pathParts[3] === 'review' && $method === 'GET') {
        $userId = $pathParts[2];
        $result = $discountController->getUserDetailsForReview($userId);
        echo json_encode($result);
        exit;
    }

    // POST /discount-applications - Submit new discount application
    if ($pathParts[0] === 'discount-applications' && $method === 'POST') {
        $userId = $input['user_id'] ?? null;
        $discountType = $input['discount_type'] ?? null;
        $documentPath = $input['document_path'] ?? null;
        $documentName = $input['document_name'] ?? null;
        
        $result = $discountController->submitDiscountApplication($userId, $discountType, $documentPath, $documentName);
        echo json_encode($result);
        exit;
    }

    // POST /user-by-auth0-id - Get user ID by Auth0 ID
    if ($pathParts[0] === 'user-by-auth0-id' && $method === 'POST') {
        $auth0Id = $input['auth0_id'] ?? null;
        
        if (!$auth0Id) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Auth0 ID is required']);
            exit;
        }
        
        $result = $authController->getUserByAuth0Id($auth0Id);
        echo json_encode($result);
        exit;
    }

    // Route not found
    http_response_code(404);
    echo json_encode([
        'status' => 'error',
        'message' => 'Route not found',
        'available_routes' => [
            'POST /register' => 'User registration',
            'POST /login' => 'User login',
            'GET /profile?user_id=X' => 'Get user profile',
            'PUT /profile' => 'Update user profile',
            'POST /check-exists' => 'Check if user exists',
            'GET /admin/users' => 'Get all users (admin)',
            'PUT /admin/users/{id}' => 'Update user (admin)',
            'DELETE /admin/users/{id}' => 'Delete user (admin)',
            'POST /admin/approve-discount' => 'Approve discount application',
            'POST /admin/approve-license' => 'Approve driver license',
            'GET /admin/pending-approvals' => 'Get pending approvals',
            'GET /admin/jeepneys' => 'Get all jeepneys (admin)',
            'POST /admin/jeepneys' => 'Create jeepney (admin)',
            'PUT /admin/jeepneys/{id}' => 'Update jeepney (admin)',
            'DELETE /admin/jeepneys/{id}' => 'Delete jeepney (admin)',
            'GET /test' => 'API test endpoint'
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Internal server error: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>