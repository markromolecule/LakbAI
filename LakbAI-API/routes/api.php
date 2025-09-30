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

// Include trip routes
require_once __DIR__ . '/trip_routes.php';
require_once __DIR__ . '/../controllers/TripController.php';

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
require_once __DIR__ . '/../controllers/NotificationController.php';
require_once __DIR__ . '/../controllers/FareMatrixController.php';


// Initialize controller with database connection
$authController = new AuthController($app->get('Database'));
$auth0Controller = new Auth0Controller($app->get('Database'));
$jeepneyController = new JeepneyController($app->get('PDO'));
$driverController = new DriverController($app->get('PDO'));
$routeController = new RouteController($app->get('PDO'));
$checkpointController = new CheckpointController($app->get('PDO'));
$earningsController = new EarningsController($app->get('PDO'));
$fileUploadController = new FileUploadController($app->get('Database'));
$discountController = new DiscountController($app->get('Database'));
$notificationController = new NotificationController($app->get('PDO'));
$fareMatrixController = new FareMatrixController($app->get('PDO'));
$tripController = new TripController($app->get('PDO'));

// Get the request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$rawParts = array_values(array_filter(explode('/', trim($path, '/'))));

// Normalize path: support both /LakbAI/LakbAI-API/routes/api.php/... and /api/...
$idxApiRoot = array_search('LakbAI-API', $rawParts, true);
if ($idxApiRoot !== false) {
    $rawParts = array_slice($rawParts, $idxApiRoot + 1);
}
// Remove 'routes' and 'api.php' from the path
if (isset($rawParts[0]) && $rawParts[0] === 'routes') {
    $rawParts = array_slice($rawParts, 1);
}
if (isset($rawParts[0]) && $rawParts[0] === 'api.php') {
    $rawParts = array_slice($rawParts, 1);
}
if (isset($rawParts[0]) && $rawParts[0] === 'api') {
    $rawParts = array_slice($rawParts, 1);
}

// Use normalized parts
$pathParts = $rawParts;

// Ensure pathParts is not empty to avoid undefined array key warnings
if (empty($pathParts)) {
    $pathParts = [''];
}

// Debug logging (commented out for production)
// error_log("🔍 API Path Debug - Original URI: " . $_SERVER['REQUEST_URI']);
// error_log("🔍 API Path Debug - Parsed path: " . $path);
// error_log("🔍 API Path Debug - Path parts: " . json_encode($pathParts));


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
        $transformed['discount_applied'] = 1; // Mark as applied
        $transformed['discount_status'] = 'pending'; // Set status to pending for admin review
        $transformed['discount_verified'] = 0; // Not verified yet
        
        // Handle document upload (for now, just store the name)
        if (isset($mobileData['fareDiscount']['document'])) {
            $transformed['discount_document_name'] = $mobileData['fareDiscount']['document']['name'] ?? null;
            // Note: File upload handling would need additional implementation
            $transformed['discount_document_path'] = null; // Will be handled separately
        }
    } else {
        // No discount applied
        $transformed['discount_applied'] = 0;
        $transformed['discount_status'] = null;
        $transformed['discount_verified'] = 0;
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

        // DELETE /admin/jeepneys/{id}/driver - Unassign driver from jeepney
        if ($method === 'DELETE' && count($pathParts) === 4 && $pathParts[3] === 'driver') {
            $jeepneyId = intval($pathParts[2]);
            $result = $jeepneyController->unassignDriver($jeepneyId);
            echo json_encode($result);
            exit;
        }

        // POST /admin/jeepneys/reassign - Reassign driver from one jeepney to another
        if ($method === 'POST' && count($pathParts) === 3 && $pathParts[2] === 'reassign') {
            $input = json_decode(file_get_contents('php://input'), true);
            $fromJeepneyId = intval($input['from_jeepney_id'] ?? 0);
            $toJeepneyId = intval($input['to_jeepney_id'] ?? 0);
            $driverId = intval($input['driver_id'] ?? 0);
            
            if (!$fromJeepneyId || !$toJeepneyId || !$driverId) {
                echo json_encode([
                    "status" => "error",
                    "message" => "Missing required parameters: from_jeepney_id, to_jeepney_id, driver_id"
                ]);
                exit;
            }
            
            $result = $jeepneyController->reassignDriver($fromJeepneyId, $toJeepneyId, $driverId);
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

        // PUT /mobile/driver/route/{id} - Update driver route
        if ($method === 'PUT' && count($pathParts) === 4 && $pathParts[2] === 'route' && is_numeric($pathParts[3])) {
            $driverId = $pathParts[3];
            $routeId = $input['route_id'] ?? null;
            
            if (!$routeId) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Route ID is required']);
                exit;
            }
            
            $result = $driverController->updateDriverRoute($driverId, $routeId);
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

        // GET /earnings/daily-aggregated - Get daily aggregated earnings for all drivers
        if ($method === 'GET' && count($pathParts) === 2 && $pathParts[1] === 'daily-aggregated') {
            $date = $_GET['date'] ?? null; // Optional date parameter (defaults to today)
            $result = $earningsController->getDailyAggregatedEarnings($date);
            echo json_encode($result);
            exit;
        }

        // GET /earnings/total-aggregated - Get total aggregated earnings for all drivers (all-time)
        if ($method === 'GET' && count($pathParts) === 2 && $pathParts[1] === 'total-aggregated') {
            $result = $earningsController->getTotalAggregatedEarnings();
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

    // Handle earnings routes with /routes/api.php/earnings/shift/... pattern
    if (isset($pathParts[2]) && $pathParts[2] === 'earnings' && isset($pathParts[3]) && $pathParts[3] === 'shift') {
        // POST /routes/api.php/earnings/shift/end
        if ($method === 'POST' && count($pathParts) === 5 && $pathParts[4] === 'end') {
            $input = json_decode(file_get_contents('php://input'), true);
            $result = $earningsController->endShift($input);
            echo json_encode($result);
            exit;
        }
        
        // POST /routes/api.php/earnings/shift/start
        if ($method === 'POST' && count($pathParts) === 5 && $pathParts[4] === 'start') {
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
    if (isset($pathParts[2]) && $pathParts[2] === 'admin' && isset($pathParts[3]) && $pathParts[3] === 'checkpoints') {
        // GET /admin/checkpoints
        if ($method === 'GET' && count($pathParts) === 4) {
            $result = $checkpointController->getAllCheckpoints();
            echo json_encode($result);
            exit;
        }

        // GET /admin/checkpoints/route/{routeId}
        if ($method === 'GET' && count($pathParts) === 6 && $pathParts[4] === 'route') {
            $routeId = $pathParts[5];
            $result = $checkpointController->getCheckpointsByRoute($routeId);
            echo json_encode($result);
            exit;
        }

        // GET /admin/checkpoints/{id}
        if ($method === 'GET' && count($pathParts) === 5 && is_numeric($pathParts[4])) {
            $checkpointId = $pathParts[4];
            $result = $checkpointController->getCheckpointById($checkpointId);
            echo json_encode($result);
            exit;
        }

        // POST /admin/checkpoints
        if ($method === 'POST' && count($pathParts) === 4) {
            $result = $checkpointController->createCheckpoint($input);
            echo json_encode($result);
            exit;
        }

        // PUT /admin/checkpoints/{id}
        if ($method === 'PUT' && count($pathParts) === 5) {
            $checkpointId = $pathParts[4];
            $result = $checkpointController->updateCheckpoint($checkpointId, $input);
            echo json_encode($result);
            exit;
        }

        // DELETE /admin/checkpoints/{id}
        if ($method === 'DELETE' && count($pathParts) === 5) {
            $checkpointId = $pathParts[4];
            $result = $checkpointController->deleteCheckpoint($checkpointId);
            echo json_encode($result);
            exit;
        }

        // POST /admin/checkpoints/qr/generate/{checkpointId}/{routeId}
        if ($method === 'POST' && count($pathParts) === 8 && $pathParts[4] === 'qr' && $pathParts[5] === 'generate') {
            $checkpointId = $pathParts[6];
            $routeId = $pathParts[7];
            $result = $checkpointController->generateCheckpointQR($checkpointId, $routeId);
            echo json_encode($result);
            exit;
        }

        // POST /admin/checkpoints/qr/route/{routeId}
        if ($method === 'POST' && count($pathParts) === 7 && $pathParts[4] === 'qr' && $pathParts[5] === 'route') {
            $routeId = $pathParts[6];
            $result = $checkpointController->generateRouteQRCodes($routeId);
            echo json_encode($result);
            exit;
        }
    }

    // ---------------------------
    // Driver Checkpoint Scanning Routes
    // ---------------------------
    if (isset($pathParts[2]) && $pathParts[2] === 'mobile' && isset($pathParts[3]) && $pathParts[3] === 'driver' && isset($pathParts[4]) && $pathParts[4] === 'scan') {
        // POST /mobile/driver/scan/checkpoint
        if ($method === 'POST' && count($pathParts) === 6 && $pathParts[5] === 'checkpoint') {
            $driverId = $input['driver_id'] ?? null;
            $qrData = $input['qr_data'] ?? null;
            $scanTimestamp = $input['scan_timestamp'] ?? null;

            if (!$driverId || !$qrData) {
                echo json_encode([
                    "status" => "error",
                    "message" => "Driver ID and QR data are required"
                ]);
                exit;
            }

            $result = $checkpointController->processDriverScan($driverId, $qrData, $scanTimestamp);
            echo json_encode($result);
            exit;
        }
    }

    // ---------------------------
    // Real-time Location Routes
    // ---------------------------
    if (isset($pathParts[2]) && $pathParts[2] === 'mobile' && isset($pathParts[3]) && $pathParts[3] === 'locations') {
        // GET /mobile/locations/route/{routeId}
        if ($method === 'GET' && count($pathParts) === 6 && $pathParts[4] === 'route') {
            $routeId = $pathParts[5];
            $result = $checkpointController->getDriverLocationsForRoute($routeId);
            echo json_encode($result);
            exit;
        }
    }

    // ---------------------------
    // Passenger Notification Routes
    // ---------------------------
    if (isset($pathParts[2]) && $pathParts[2] === 'mobile' && isset($pathParts[3]) && $pathParts[3] === 'passenger') {
        // GET /mobile/passenger/arrivals/{routeId}
        if ($method === 'GET' && count($pathParts) === 6 && $pathParts[4] === 'arrivals') {
            $routeId = $pathParts[5];
            $result = $checkpointController->getDriverLocationsForRoute($routeId);
            echo json_encode($result);
            exit;
        }

        // GET /mobile/passenger/nearest-jeepney/{checkpointId}
        if ($method === 'GET' && count($pathParts) === 6 && $pathParts[4] === 'nearest-jeepney') {
            $checkpointId = $pathParts[5];
            // This would implement logic to find the nearest jeepney based on checkpoint
            // For now, return a placeholder response
            echo json_encode([
                "status" => "success",
                "message" => "Nearest jeepney tracking",
                "data" => [
                    "checkpoint_id" => $checkpointId,
                    "nearest_jeepney" => [
                        "jeepney_number" => "LKB-001",
                        "driver_name" => "Juan Dela Cruz",
                        "estimated_arrival" => "5-7 mins",
                        "current_location" => "Robinson Tejero",
                        "distance_away" => 2
                    ]
                ]
            ]);
            exit;
        }
    }

    // ---------------------------
    // Notification Routes
    // ---------------------------
    if (isset($pathParts[2]) && $pathParts[2] === 'mobile' && isset($pathParts[3]) && $pathParts[3] === 'notifications') {
        // POST /mobile/notifications/subscribe
        if ($method === 'POST' && count($pathParts) === 5 && $pathParts[4] === 'subscribe') {
            $passengerId = $input['passenger_id'] ?? null;
            $routeId = $input['route_id'] ?? null;
            $checkpointId = $input['checkpoint_id'] ?? null;
            $preference = $input['preference'] ?? 'all';

            if (!$passengerId || !$routeId) {
                echo json_encode([
                    "status" => "error",
                    "message" => "Passenger ID and Route ID are required"
                ]);
                exit;
            }

            $result = $notificationController->subscribeToRoute($passengerId, $routeId, $checkpointId, $preference);
            echo json_encode($result);
            exit;
        }

        // POST /mobile/notifications/unsubscribe
        if ($method === 'POST' && count($pathParts) === 5 && $pathParts[4] === 'unsubscribe') {
            $passengerId = $input['passenger_id'] ?? null;
            $routeId = $input['route_id'] ?? null;

            if (!$passengerId || !$routeId) {
                echo json_encode([
                    "status" => "error",
                    "message" => "Passenger ID and Route ID are required"
                ]);
                exit;
            }

            $result = $notificationController->unsubscribeFromRoute($passengerId, $routeId);
            echo json_encode($result);
            exit;
        }

        // GET /mobile/notifications/history/{passengerId}
        if ($method === 'GET' && count($pathParts) === 6 && $pathParts[4] === 'history') {
            $passengerId = $pathParts[5];
            $limit = $_GET['limit'] ?? 20;
            $result = $notificationController->getPassengerNotifications($passengerId, $limit);
            echo json_encode($result);
            exit;
        }

        // PUT /mobile/notifications/read/{notificationId}
        if ($method === 'PUT' && count($pathParts) === 6 && $pathParts[4] === 'read') {
            $notificationId = $pathParts[5];
            $userId = $input['user_id'] ?? null;

            if (!$userId) {
                echo json_encode([
                    "status" => "error",
                    "message" => "User ID is required"
                ]);
                exit;
            }

            $result = $notificationController->markNotificationAsRead($notificationId, $userId);
            echo json_encode($result);
            exit;
        }
    }

    // ---------------------------
    // Enhanced Passenger Location Routes
    // ---------------------------
    if (isset($pathParts[0]) && $pathParts[0] === 'mobile' && isset($pathParts[1]) && $pathParts[1] === 'passenger') {
        // GET /mobile/passenger/real-time-drivers/{routeId}
        if ($method === 'GET' && count($pathParts) === 4 && $pathParts[2] === 'real-time-drivers') {
            $routeId = $pathParts[3];
            $result = $notificationController->getDriverLocationsForPassengers($routeId);
            echo json_encode($result);
            exit;
        }

        // GET /mobile/passenger/checkpoint-conflicts/{checkpointId}
        if ($method === 'GET' && count($pathParts) === 4 && $pathParts[2] === 'checkpoint-conflicts') {
            $checkpointId = $pathParts[3];
            $result = $notificationController->handleMultipleDriversAtCheckpoint($checkpointId);
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

    // PUBLIC ROUTES (for frontend access)
    // ===================================
    
    // GET /routes - Public access to routes (direct path)
    if ($pathParts[0] === 'routes' && $method === 'GET' && count($pathParts) === 1) {
        $result = $routeController->getAllRoutes();
        echo json_encode($result);
        exit;
    }
    
    // GET /routes - Public access to routes (nested path)
    if (isset($pathParts[2]) && $pathParts[2] === 'routes' && $method === 'GET' && count($pathParts) === 3) {
        $result = $routeController->getAllRoutes();
        echo json_encode($result);
        exit;
    }
    
    // PUT /routes/fare - Update base fare for all routes
    if ($pathParts[0] === 'routes' && $pathParts[1] === 'fare' && $method === 'PUT' && count($pathParts) === 2) {
        $newFare = $input['fare'] ?? null;
        if (!$newFare) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Fare amount required']);
            exit;
        }
        $result = $routeController->updateBaseFare($newFare);
        echo json_encode($result);
        exit;
    }
    
    // GET /jeepneys - Public access to jeepneys (direct path)
    if ($pathParts[0] === 'jeepneys' && $method === 'GET' && count($pathParts) === 1) {
        $result = $jeepneyController->getAllJeepneys();
        echo json_encode($result);
        exit;
    }
    
    // GET /mobile/locations/route/{routeId} - Direct path for driver locations
    if ($pathParts[0] === 'mobile' && $pathParts[1] === 'locations' && $pathParts[2] === 'route' && $method === 'GET' && count($pathParts) === 4) {
        $routeId = $pathParts[3];
        $result = $checkpointController->getDriverLocationsForRoute($routeId);
        echo json_encode($result);
        exit;
    }
    
    // POST /mobile/driver/scan/checkpoint - Direct path for checkpoint scanning
    if ($pathParts[0] === 'mobile' && $pathParts[1] === 'driver' && $pathParts[2] === 'scan' && $pathParts[3] === 'checkpoint' && $method === 'POST' && count($pathParts) === 4) {
        $driverId = $input['driver_id'] ?? null;
        $qrData = $input['qr_data'] ?? null;
        $scanTimestamp = $input['scan_timestamp'] ?? null;

        if (!$driverId || !$qrData) {
            echo json_encode([
                "status" => "error",
                "message" => "Driver ID and QR data are required"
            ]);
            exit;
        }

        $result = $checkpointController->processDriverScan($driverId, $qrData, $scanTimestamp);
        echo json_encode($result);
        exit;
    }
    
    // GET /routes/{id}/checkpoints - Get checkpoints for a specific route (direct path)
    if ($pathParts[0] === 'routes' && $method === 'GET' && count($pathParts) === 3 && $pathParts[2] === 'checkpoints') {
        $routeId = $pathParts[1];
        $result = $checkpointController->getCheckpointsByRoute($routeId);
        echo json_encode($result);
        exit;
    }
    
    // GET /checkpoints/coordinates/{checkpointName} - Get coordinates for a specific checkpoint
    if ($pathParts[0] === 'checkpoints' && $pathParts[1] === 'coordinates' && $method === 'GET' && count($pathParts) === 3) {
        $checkpointName = urldecode($pathParts[2]);
        $result = $checkpointController->getCheckpointCoordinates($checkpointName);
        echo json_encode($result);
        exit;
    }
    
    // GET /checkpoints/coordinates - Get all checkpoints with coordinates
    if ($pathParts[0] === 'checkpoints' && $pathParts[1] === 'coordinates' && $method === 'GET' && count($pathParts) === 2) {
        $result = $checkpointController->getAllCheckpointsWithCoordinates();
        echo json_encode($result);
        exit;
    }
    
    // POST /admin/checkpoints/qr/generate/{checkpointId}/{routeId} - Direct path for single QR generation
    if ($pathParts[0] === 'admin' && $pathParts[1] === 'checkpoints' && $pathParts[2] === 'qr' && $pathParts[3] === 'generate' && $method === 'POST' && count($pathParts) === 6) {
        $checkpointId = $pathParts[4];
        $routeId = $pathParts[5];
        $result = $checkpointController->generateCheckpointQR($checkpointId, $routeId);
        echo json_encode($result);
        exit;
    }
    
    // POST /admin/checkpoints/qr/route/{routeId} - Direct path for route QR generation
    if ($pathParts[0] === 'admin' && $pathParts[1] === 'checkpoints' && $pathParts[2] === 'qr' && $pathParts[3] === 'route' && $method === 'POST' && count($pathParts) === 5) {
        $routeId = $pathParts[4];
        $result = $checkpointController->generateRouteQRCodes($routeId);
        echo json_encode($result);
        exit;
    }
    
    // GET /routes/{id}/checkpoints - Get checkpoints for a specific route (nested path)
    if (isset($pathParts[2]) && $pathParts[2] === 'routes' && $method === 'GET' && count($pathParts) === 5 && $pathParts[4] === 'checkpoints') {
        $routeId = $pathParts[3];
        $result = $checkpointController->getCheckpointsByRoute($routeId);
        echo json_encode($result);
        exit;
    }
    
    // GET /jeepneys - Public access to jeepneys
    if (isset($pathParts[2]) && $pathParts[2] === 'jeepneys' && $method === 'GET' && count($pathParts) === 3) {
        $result = $jeepneyController->getJeepneys();
        echo json_encode($result);
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
    
    // Xendit Webhook route
    if (end($pathParts) === 'webhook' && $method === 'POST') {
        // Include the webhook handler
        include __DIR__ . '/../webhooks/xendit.php';
        exit;
    }
    
// API Documentation route
if (end($pathParts) === 'docs' && $method === 'GET') {
    // Redirect to documentation
    header('Location: ../docs/index.html');
    exit;
}

// Search routes
if (count($pathParts) >= 2 && $pathParts[0] === 'search') {
    include __DIR__ . '/search.php';
    exit;
}

// Passenger Notifications routes
if (count($pathParts) >= 3 && $pathParts[0] === 'mobile' && $pathParts[1] === 'passenger' && $pathParts[2] === 'notifications') {
    include __DIR__ . '/passenger_notifications.php';
    exit;
}

// Trip Booking routes
if (count($pathParts) >= 4 && $pathParts[0] === 'mobile' && $pathParts[1] === 'passenger') {
    // POST /mobile/passenger/book-trip
    if ($pathParts[2] === 'book-trip' && $method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $result = $tripController->bookTrip($input);
        echo json_encode($result);
        exit;
    }
    
    // GET /mobile/passenger/active-trips
    if ($pathParts[2] === 'active-trips' && $method === 'GET') {
        $passengerId = $_GET['passenger_id'] ?? null;
        if (!$passengerId) {
            echo json_encode([
                "status" => "error",
                "message" => "Passenger ID is required"
            ]);
            exit;
        }
        $result = $tripController->getActiveTrips($passengerId);
        echo json_encode($result);
        exit;
    }
    
    // POST /mobile/passenger/clear-trips
    if ($pathParts[2] === 'clear-trips' && $method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $passengerId = $input['passenger_id'] ?? null;
        if (!$passengerId) {
            echo json_encode([
                "status" => "error",
                "message" => "Passenger ID is required"
            ]);
            exit;
        }
        $result = $tripController->clearActiveTrips($passengerId);
        echo json_encode($result);
        exit;
    }
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

    // Driver license document serving route
    if ($pathParts[0] === 'driver-license' && $method === 'GET' && isset($pathParts[1])) {
        $documentPath = $pathParts[1];
        $fullPath = __DIR__ . '/../uploads/licenses/' . $documentPath;
        
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
            echo json_encode(['status' => 'error', 'message' => 'Driver license document not found']);
            exit;
        }
    }

    // Simple document serving route for admin panel
    if ($pathParts[0] === 'document' && ($method === 'GET' || $method === 'HEAD') && isset($pathParts[1])) {
        // Reconstruct the full path from pathParts
        $documentPath = implode('/', array_slice($pathParts, 1));
        $fullPath = __DIR__ . '/../' . $documentPath;
        
        if (file_exists($fullPath) && is_readable($fullPath)) {
            $fileInfo = pathinfo($fullPath);
            $extension = strtolower($fileInfo['extension'] ?? '');
            
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
            
            if ($method === 'GET') {
                readfile($fullPath);
            }
            exit;
        } else {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Document not found', 'path' => $fullPath]);
            exit;
        }
    }

    /**
     * @OA\Get(
     *     path="/",
     *     tags={"System"},
     *     summary="API Health Check",
     *     description="Check if the API is running and get available endpoints",
     *     @OA\Response(
     *         response=200,
     *         description="API is running successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="string", example="success"),
     *             @OA\Property(property="message", type="string", example="LakbAI API is running"),
     *             @OA\Property(property="timestamp", type="string", format="date-time"),
     *             @OA\Property(property="endpoints", type="object")
     *         )
     *     )
     * )
     */
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

        // Serve driver license documents
        if ($pathParts[1] === 'driver-license-document' && isset($pathParts[2]) && $method === 'GET') {
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
                echo json_encode(['status' => 'error', 'message' => 'Driver license document not found']);
                exit;
            }
        }
    }

    // File upload routes
    if (end($pathParts) === 'upload-discount-document' && $method === 'POST') {
        $result = $fileUploadController->uploadDiscountDocument();
        echo json_encode($result);
        exit;
    }

    // Driver license upload routes
    if (end($pathParts) === 'upload-driver-license' && $method === 'POST') {
        $result = $fileUploadController->uploadDriverLicense();
        echo json_encode($result);
        exit;
    }
    
    // Profile picture upload routes
    if (end($pathParts) === 'upload-profile-picture' && $method === 'POST') {
        $result = $fileUploadController->uploadProfilePicture();
        echo json_encode($result);
        exit;
    }

    // Serve discount document file
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

    // Serve driver license file
    if (isset($pathParts[0]) && $pathParts[0] === 'driver-license' && $method === 'GET') {
        $filePath = isset($_GET['path']) ? $_GET['path'] : '';
        if ($filePath) {
            $fileUploadController->serveDriverLicense($filePath);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'File path parameter is required']);
        }
        exit;
    }
    
    // Serve profile picture file
    if (isset($pathParts[0]) && $pathParts[0] === 'profile-picture' && ($method === 'GET' || $method === 'HEAD')) {
        $filePath = isset($_GET['path']) ? $_GET['path'] : '';
        if ($filePath) {
            $fileUploadController->serveProfilePicture($filePath);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'File path parameter is required']);
        }
        exit;
    }

    // Delete discount document file
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

    // Delete driver license file
    if (isset($pathParts[0]) && $pathParts[0] === 'delete-driver-license' && $method === 'DELETE') {
        $input = json_decode(file_get_contents('php://input'), true);
        $filePath = isset($input['file_path']) ? $input['file_path'] : '';
        
        if ($filePath) {
            $result = $fileUploadController->deleteDriverLicense($filePath);
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'File path is required']);
        }
        exit;
    }

    // ---------------------------
    // Fare Matrix Routes
    // ---------------------------
    if ($pathParts[0] === 'fare-matrix') {
        // GET /fare-matrix - Get all fare matrices
        if ($method === 'GET' && count($pathParts) === 1) {
            $result = $fareMatrixController->getAllFareMatrices();
            echo json_encode($result);
            exit;
        }

        // GET /fare-matrix/route/{routeId} - Get fare matrix for specific route
        if ($method === 'GET' && count($pathParts) === 3 && $pathParts[1] === 'route') {
            $routeId = intval($pathParts[2]);
            $result = $fareMatrixController->getFareMatrixForRoute($routeId);
            echo json_encode($result);
            exit;
        }

        // GET /fare-matrix/fare/{fromCheckpointId}/{toCheckpointId} - Get fare between two checkpoints
        if ($method === 'GET' && count($pathParts) === 4 && $pathParts[1] === 'fare') {
            $fromCheckpointId = intval($pathParts[2]);
            $toCheckpointId = intval($pathParts[3]);
            $routeId = isset($_GET['route_id']) ? intval($_GET['route_id']) : null;
            $result = $fareMatrixController->getFareBetweenCheckpoints($fromCheckpointId, $toCheckpointId, $routeId);
            echo json_encode($result);
            exit;
        }

        // POST /fare-matrix/generate/{routeId} - Generate fare matrix for route
        if ($method === 'POST' && count($pathParts) === 3 && $pathParts[1] === 'generate') {
            $routeId = intval($pathParts[2]);
            $baseFare = isset($input['base_fare']) ? floatval($input['base_fare']) : 13.00;
            $result = $fareMatrixController->generateFareMatrixForRoute($routeId, $baseFare);
            echo json_encode($result);
            exit;
        }

        // POST /fare-matrix/create - Create or update fare matrix entry
        if ($method === 'POST' && count($pathParts) === 2 && $pathParts[1] === 'create') {
            $result = $fareMatrixController->createOrUpdateFareEntry($input);
            echo json_encode($result);
            exit;
        }

        // PUT /fare-matrix/{fareMatrixId} - Update fare matrix entry
        if ($method === 'PUT' && count($pathParts) === 2 && is_numeric($pathParts[1])) {
            $fareMatrixId = intval($pathParts[1]);
            $input['fare_matrix_id'] = $fareMatrixId;
            $result = $fareMatrixController->createOrUpdateFareEntry($input);
            echo json_encode($result);
            exit;
        }

        // DELETE /fare-matrix/{fareMatrixId} - Delete fare matrix entry
        if ($method === 'DELETE' && count($pathParts) === 2 && is_numeric($pathParts[1])) {
            $fareMatrixId = intval($pathParts[1]);
            $result = $fareMatrixController->deleteFareEntry($fareMatrixId);
            echo json_encode($result);
            exit;
        }

        // GET /fare-matrix/stats - Get fare matrix statistics
        if ($method === 'GET' && count($pathParts) === 2 && $pathParts[1] === 'stats') {
            $result = $fareMatrixController->getFareMatrixStats();
            echo json_encode($result);
            exit;
        }

        // POST /fare-matrix/cleanup - Clean up duplicate entries
        if ($method === 'POST' && count($pathParts) === 2 && $pathParts[1] === 'cleanup') {
            $result = $fareMatrixController->cleanupDuplicateEntries();
            echo json_encode($result);
            exit;
        }

        // GET /fare-matrix/history/{fareMatrixId} - Get fare matrix history
        if ($method === 'GET' && count($pathParts) === 3 && $pathParts[1] === 'history') {
            $fareMatrixId = intval($pathParts[2]);
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
            $result = $fareMatrixController->getFareMatrixHistory($fareMatrixId, $limit);
            echo json_encode($result);
            exit;
        }
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