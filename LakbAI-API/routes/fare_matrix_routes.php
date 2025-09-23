<?php
require_once __DIR__ . '/../controllers/FareMatrixController.php';

// Initialize database connection
require_once __DIR__ . '/../config/db.php';
$fareMatrixController = new FareMatrixController($db);

// Set content type to JSON
header('Content-Type: application/json');

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Remove 'api' and 'fare-matrix' from path parts
$pathParts = array_slice($pathParts, 2);

// Route handling
try {
    switch ($method) {
        case 'GET':
            if (empty($pathParts)) {
                // GET /api/fare-matrix - Get all fare matrices
                $result = $fareMatrixController->getAllFareMatrices();
            } elseif ($pathParts[0] === 'route' && isset($pathParts[1])) {
                // GET /api/fare-matrix/route/{routeId} - Get fare matrix for specific route
                $routeId = intval($pathParts[1]);
                $result = $fareMatrixController->getFareMatrixForRoute($routeId);
            } elseif ($pathParts[0] === 'fare' && isset($pathParts[1]) && isset($pathParts[2])) {
                // GET /api/fare-matrix/fare/{fromCheckpointId}/{toCheckpointId} - Get fare between two checkpoints
                $fromCheckpointId = intval($pathParts[1]);
                $toCheckpointId = intval($pathParts[2]);
                $routeId = isset($_GET['route_id']) ? intval($_GET['route_id']) : null;
                $result = $fareMatrixController->getFareBetweenCheckpoints($fromCheckpointId, $toCheckpointId, $routeId);
            } elseif ($pathParts[0] === 'history' && isset($pathParts[1])) {
                // GET /api/fare-matrix/history/{fareMatrixId} - Get fare matrix history
                $fareMatrixId = intval($pathParts[1]);
                $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
                $result = $fareMatrixController->getFareMatrixHistory($fareMatrixId, $limit);
            } elseif ($pathParts[0] === 'stats') {
                // GET /api/fare-matrix/stats - Get fare matrix statistics
                $result = $fareMatrixController->getFareMatrixStats();
            } else {
                $result = [
                    "status" => "error",
                    "message" => "Invalid endpoint"
                ];
            }
            break;

        case 'POST':
            if ($pathParts[0] === 'generate' && isset($pathParts[1])) {
                // POST /api/fare-matrix/generate/{routeId} - Generate fare matrix for route
                $routeId = intval($pathParts[1]);
                $baseFare = isset($_POST['base_fare']) ? floatval($_POST['base_fare']) : 13.00;
                $result = $fareMatrixController->generateFareMatrixForRoute($routeId, $baseFare);
            } elseif ($pathParts[0] === 'create') {
                // POST /api/fare-matrix/create - Create or update fare matrix entry
                $result = $fareMatrixController->createOrUpdateFareEntry($_POST);
            } else {
                $result = [
                    "status" => "error",
                    "message" => "Invalid endpoint"
                ];
            }
            break;

        case 'PUT':
            if (isset($pathParts[0])) {
                // PUT /api/fare-matrix/{fareMatrixId} - Update fare matrix entry
                $fareMatrixId = intval($pathParts[0]);
                $input = json_decode(file_get_contents('php://input'), true);
                $input['fare_matrix_id'] = $fareMatrixId;
                $result = $fareMatrixController->createOrUpdateFareEntry($input);
            } else {
                $result = [
                    "status" => "error",
                    "message" => "Missing fare matrix ID"
                ];
            }
            break;

        case 'DELETE':
            if (isset($pathParts[0])) {
                // DELETE /api/fare-matrix/{fareMatrixId} - Delete fare matrix entry
                $fareMatrixId = intval($pathParts[0]);
                $result = $fareMatrixController->deleteFareEntry($fareMatrixId);
            } else {
                $result = [
                    "status" => "error",
                    "message" => "Missing fare matrix ID"
                ];
            }
            break;

        default:
            $result = [
                "status" => "error",
                "message" => "Method not allowed"
            ];
            break;
    }

    // Return JSON response
    echo json_encode($result, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Internal server error: " . $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>
