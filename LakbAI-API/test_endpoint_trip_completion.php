<?php
require_once __DIR__ . '/config/db.php';

header('Content-Type: text/plain');

echo "🧪 Testing Endpoint Trip Completion Logic\n";
echo "==========================================\n\n";

try {
    // Test case: Passenger books SM Epza -> SM Dasmariñas (endpoint)
    echo "📋 Test Case: SM Epza -> SM Dasmariñas (Route 1 endpoint)\n";
    echo "--------------------------------------------------------\n";
    
    // 1. Check if there are any pending trips for this route
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
            u.last_name,
            j.vehicle_number
        FROM driver_earnings e
        JOIN users u ON e.passenger_id = u.id
        LEFT JOIN jeepneys j ON e.driver_id = j.driver_id
        WHERE e.destination LIKE 'SM Das%'
        AND e.counts_as_trip = 0
        AND e.created_at >= DATE_SUB(NOW(), INTERVAL 2 HOUR)
        ORDER BY e.created_at DESC
    ");
    $stmt->execute();
    $pendingTrips = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "📊 Found " . count($pendingTrips) . " pending trips to SM Dasmariñas:\n";
    foreach ($pendingTrips as $trip) {
        echo "  - Trip ID: {$trip['id']}, Passenger: {$trip['first_name']} {$trip['last_name']}, Driver: {$trip['vehicle_number']}, Created: {$trip['created_at']}\n";
    }
    
    // 2. Check route checkpoints for SM Dasmariñas
    echo "\n📍 Route Checkpoints for SM Dasmariñas:\n";
    $stmt = $pdo->prepare("
        SELECT 
            c.checkpoint_name,
            c.sequence_order,
            r.route_name
        FROM checkpoints c
        JOIN routes r ON c.route_id = r.id
        WHERE c.checkpoint_name LIKE 'SM Das%'
        ORDER BY c.sequence_order
    ");
    $stmt->execute();
    $checkpoints = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($checkpoints as $cp) {
        echo "  - {$cp['checkpoint_name']} (Route: {$cp['route_name']}, Sequence: {$cp['sequence_order']})\n";
    }
    
    // 3. Test the exact matching logic from CheckpointController
    echo "\n🔍 Testing Destination Matching Logic:\n";
    $testDestination = "SM Dasmariñas";
    $testCheckpoint = "SM Dasmariñas";
    
    echo "  - Test destination: {$testDestination}\n";
    echo "  - Test checkpoint: {$testCheckpoint}\n";
    echo "  - Exact match: " . ($testDestination === $testCheckpoint ? 'YES' : 'NO') . "\n";
    echo "  - LIKE 'SM Das%' match: " . ((strpos($testCheckpoint, 'SM Das') === 0 && strpos($testDestination, 'SM Das') === 0) ? 'YES' : 'NO') . "\n";
    
    // 4. Check if there are any drivers currently at SM Dasmariñas
    echo "\n🚗 Current Driver Locations:\n";
    $stmt = $pdo->prepare("
        SELECT 
            d.user_id,
            d.current_location,
            d.updated_at,
            u.first_name,
            u.last_name,
            j.vehicle_number
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        LEFT JOIN jeepneys j ON d.user_id = j.driver_id
        WHERE d.current_location LIKE 'SM Das%'
        ORDER BY d.updated_at DESC
    ");
    $stmt->execute();
    $driversAtDestination = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "  Found " . count($driversAtDestination) . " drivers at SM Dasmariñas:\n";
    foreach ($driversAtDestination as $driver) {
        echo "  - {$driver['first_name']} {$driver['last_name']} ({$driver['vehicle_number']}) - {$driver['current_location']} at {$driver['updated_at']}\n";
    }
    
    // 5. Simulate the completion logic
    if (!empty($pendingTrips) && !empty($driversAtDestination)) {
        echo "\n🎯 Simulating Trip Completion:\n";
        foreach ($pendingTrips as $trip) {
            foreach ($driversAtDestination as $driver) {
                if ($trip['driver_id'] == $driver['user_id']) {
                    echo "  ✅ Match found: Driver {$driver['first_name']} {$driver['last_name']} has passenger {$trip['first_name']} {$trip['last_name']} going to {$trip['destination']}\n";
                    
                    // Test the SQL query that would be used
                    $testStmt = $pdo->prepare("
                        SELECT COUNT(*) as match_count
                        FROM driver_earnings e
                        WHERE e.driver_id = ? 
                        AND (
                            e.destination = ? 
                            OR (? LIKE 'SM Das%' AND e.destination LIKE 'SM Das%')
                        )
                        AND e.counts_as_trip = 0
                        AND e.created_at >= DATE_SUB(NOW(), INTERVAL 2 HOUR)
                    ");
                    $testStmt->execute([
                        $driver['user_id'],
                        $driver['current_location'],
                        $driver['current_location']
                    ]);
                    $matchCount = $testStmt->fetchColumn();
                    echo "  📊 SQL query would match {$matchCount} trips for completion\n";
                }
            }
        }
    }
    
    echo "\n✅ Test completed successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Test failed: " . $e->getMessage() . "\n";
}
?>
