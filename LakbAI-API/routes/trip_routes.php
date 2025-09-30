<?php
require_once __DIR__ . '/../controllers/TripController.php';
require_once __DIR__ . '/../config/db.php';

// Create TripController instance
$tripController = new TripController($pdo);

// Book a trip
if ($_SERVER['REQUEST_METHOD'] === 'POST' && strpos($_SERVER['REQUEST_URI'], '/api/mobile/passenger/book-trip') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $result = $tripController->bookTrip($input);
    
    header('Content-Type: application/json');
    echo json_encode($result);
    exit;
}

// Get active trips for a passenger
if ($_SERVER['REQUEST_METHOD'] === 'GET' && strpos($_SERVER['REQUEST_URI'], '/api/mobile/passenger/active-trips') !== false) {
    $passengerId = $_GET['passenger_id'] ?? null;
    
    if (!$passengerId) {
        header('Content-Type: application/json');
        echo json_encode([
            "status" => "error",
            "message" => "Passenger ID is required"
        ]);
        exit;
    }
    
    $result = $tripController->getActiveTrips($passengerId);
    
    header('Content-Type: application/json');
    echo json_encode($result);
    exit;
}

// Clear active trips for a passenger (debug function)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && strpos($_SERVER['REQUEST_URI'], '/api/mobile/passenger/clear-trips') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    $passengerId = $input['passenger_id'] ?? null;
    
    if (!$passengerId) {
        header('Content-Type: application/json');
        echo json_encode([
            "status" => "error",
            "message" => "Passenger ID is required"
        ]);
        exit;
    }
    
    $result = $tripController->clearActiveTrips($passengerId);
    
    header('Content-Type: application/json');
    echo json_encode($result);
    exit;
}
?>
