<?php
require_once __DIR__ . '/config/db.php';

header('Content-Type: text/plain');

echo "🧪 Debug Endpoint Trip Completion\n";
echo "=================================\n\n";

try {
    // Test case: SM Epza -> SM Dasmariñas (endpoint)
    echo "📋 Test Case: SM Epza -> SM Dasmariñas (Route 1 endpoint)\n";
    echo "--------------------------------------------------------\n";
    
    // 1. Check route checkpoints for Route 1
    echo "📍 Route 1 Checkpoints:\n";
    $stmt = $pdo->prepare("
        SELECT 
            c.checkpoint_name,
            c.sequence_order,
            c.is_destination
        FROM checkpoints c
        WHERE c.route_id = 1
        ORDER BY c.sequence_order
    ");
    $stmt->execute();
    $route1Checkpoints = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($route1Checkpoints as $cp) {
        $isEndpoint = $cp['is_destination'] ? ' (ENDPOINT)' : '';
        echo "  - {$cp['checkpoint_name']} (Sequence: {$cp['sequence_order']}){$isEndpoint}\n";
    }
    
    // 2. Check if SM Dasmariñas is marked as destination in Route 1
    echo "\n🎯 SM Dasmariñas Analysis:\n";
    $stmt = $pdo->prepare("
        SELECT 
            checkpoint_name,
            sequence_order,
            is_destination,
            is_origin
        FROM checkpoints 
        WHERE route_id = 1 AND checkpoint_name LIKE 'SM Das%'
    ");
    $stmt->execute();
    $smDasmaCheckpoint = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($smDasmaCheckpoint) {
        echo "  - Checkpoint: {$smDasmaCheckpoint['checkpoint_name']}\n";
        echo "  - Sequence: {$smDasmaCheckpoint['sequence_order']}\n";
        echo "  - Is Destination: " . ($smDasmaCheckpoint['is_destination'] ? 'YES' : 'NO') . "\n";
        echo "  - Is Origin: " . ($smDasmaCheckpoint['is_origin'] ? 'YES' : 'NO') . "\n";
    } else {
        echo "  ❌ SM Dasmariñas not found in Route 1 checkpoints\n";
    }
    
    // 3. Check pending trips to SM Dasmariñas
    echo "\n🚗 Pending Trips to SM Dasmariñas:\n";
    $stmt = $pdo->prepare("
        SELECT 
            e.id,
            e.driver_id,
            e.passenger_id,
            e.pickup_location,
            e.destination,
            e.counts_as_trip,
            e.created_at,
            u.first_name,
            u.last_name
        FROM driver_earnings e
        JOIN users u ON e.passenger_id = u.id
        WHERE e.destination LIKE 'SM Das%'
        AND e.counts_as_trip = 0
        AND e.created_at >= DATE_SUB(NOW(), INTERVAL 2 HOUR)
        ORDER BY e.created_at DESC
    ");
    $stmt->execute();
    $pendingTrips = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "  Found " . count($pendingTrips) . " pending trips:\n";
    foreach ($pendingTrips as $trip) {
        echo "  - Trip ID: {$trip['id']}, Passenger: {$trip['first_name']} {$trip['last_name']}, Destination: {$trip['destination']}, Created: {$trip['created_at']}\n";
    }
    
    // 4. Check current driver locations
    echo "\n🚗 Current Driver Locations:\n";
    $stmt = $pdo->prepare("
        SELECT 
            d.user_id,
            d.current_location,
            d.updated_at,
            u.first_name,
            u.last_name
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        WHERE d.current_location LIKE 'SM Das%'
        ORDER BY d.updated_at DESC
    ");
    $stmt->execute();
    $driversAtDestination = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "  Found " . count($driversAtDestination) . " drivers at SM Dasmariñas:\n";
    foreach ($driversAtDestination as $driver) {
        echo "  - {$driver['first_name']} {$driver['last_name']} - {$driver['current_location']} at {$driver['updated_at']}\n";
    }
    
    echo "\n✅ Debug completed successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Debug failed: " . $e->getMessage() . "\n";
}
?>
