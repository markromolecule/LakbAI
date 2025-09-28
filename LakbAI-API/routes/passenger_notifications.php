<?php
/**
 * Passenger Notifications API Routes
 */

require_once __DIR__ . '/../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Parse the request path - use the same logic as main API
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

$path_parts = $rawParts;

try {
    // Route: GET /mobile/passenger/notifications/{passenger_id}
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && count($path_parts) >= 4 && 
        $path_parts[0] === 'mobile' && $path_parts[1] === 'passenger' && 
        $path_parts[2] === 'notifications') {
        
        $passengerId = $path_parts[3];
        
        // Get query parameters
        $tripId = $_GET['trip_id'] ?? null;
        $type = $_GET['type'] ?? null;
        $limit = intval($_GET['limit'] ?? 10);
        $status = $_GET['status'] ?? 'pending';
        
        // Build query
        $sql = "SELECT id, passenger_id, driver_id, notification_type, title, message, data, status, created_at 
                FROM push_notifications 
                WHERE passenger_id = ?";
        $params = [$passengerId];
        
        if ($tripId) {
            // Only filter by trip_id for trip-specific notifications (not location updates)
            if ($type !== 'location_update') {
                $sql .= " AND JSON_EXTRACT(data, '$.trip_id') = ?";
                $params[] = $tripId;
            }
        }
        
        if ($type) {
            $sql .= " AND notification_type = ?";
            $params[] = $type;
        }
        
        if ($status) {
            $sql .= " AND status = ?";
            $params[] = $status;
        }
        
        $sql .= " ORDER BY created_at DESC LIMIT ?";
        $params[] = $limit;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'status' => 'success',
            'notifications' => $notifications,
            'count' => count($notifications)
        ]);
        
    }
    // Route: POST /mobile/passenger/notifications/{notification_id}/read
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && count($path_parts) >= 5 && 
             $path_parts[0] === 'mobile' && $path_parts[1] === 'passenger' && 
             $path_parts[2] === 'notifications' && $path_parts[4] === 'read') {
        
        $notificationId = $path_parts[3];
        
        $stmt = $pdo->prepare("UPDATE push_notifications SET status = 'read' WHERE id = ?");
        $stmt->execute([$notificationId]);
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Notification marked as read'
        ]);
        
    }
    else {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'Route not found'
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Internal server error: ' . $e->getMessage()
    ]);
}
?>
