<?php

require_once __DIR__ . '/../controllers/EarningsController.php';

/**
 * Earnings API Routes
 */

$earningsController = new EarningsController();

// Route: GET /api/earnings/driver/{id}
if ($method === 'GET' && preg_match('/^\/api\/earnings\/driver\/(\d+)$/', $path, $matches)) {
    $driverId = $matches[1];
    $result = $earningsController->getDriverEarnings($driverId);
    echo json_encode($result);
    exit;
}

// Route: POST /api/earnings/add
if ($method === 'POST' && $path === '/api/earnings/add') {
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

// Route: GET /api/earnings/transactions/{driverId}
if ($method === 'GET' && preg_match('/^\/api\/earnings\/transactions\/(\d+)$/', $path, $matches)) {
    $driverId = $matches[1];
    $limit = $_GET['limit'] ?? 50;
    $offset = $_GET['offset'] ?? 0;
    
    $result = $earningsController->getTransactionHistory($driverId, $limit, $offset);
    echo json_encode($result);
    exit;
}
