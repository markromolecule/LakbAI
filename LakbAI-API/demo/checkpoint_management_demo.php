<?php
/**
 * Checkpoint Management System Demo
 * 
 * This script demonstrates the complete checkpoint management functionality:
 * 1. QR Code Generation for checkpoints
 * 2. Driver scanning simulation
 * 3. Real-time location updates
 * 4. Passenger notifications
 * 5. Multiple driver conflict handling
 */

// Include database configuration
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../controllers/CheckpointController.php';
require_once __DIR__ . '/../controllers/NotificationController.php';

header('Content-Type: application/json');

echo json_encode([
    "title" => "Checkpoint Management System Demo",
    "description" => "Demonstrating QR generation, driver scanning, and real-time notifications",
    "timestamp" => date('c'),
    "demo_sections" => [
        "1. QR Code Generation",
        "2. Driver Checkpoint Scanning",
        "3. Real-time Location Updates",
        "4. Passenger Notifications",
        "5. Multiple Driver Management"
    ]
], JSON_PRETTY_PRINT) . "\n\n";

try {
    $checkpointController = new CheckpointController($pdo);
    $notificationController = new NotificationController($pdo);

    echo "=== DEMO SECTION 1: QR CODE GENERATION ===\n";
    
    // Generate QR codes for Route 1 (SM Epza → SM Dasmariñas)
    echo "Generating QR codes for Route 1...\n";
    $qrResult = $checkpointController->generateRouteQRCodes(1);
    
    if ($qrResult['status'] === 'success') {
        echo "✅ Generated {$qrResult['checkpoint_count']} QR codes for {$qrResult['route_name']}\n";
        
        // Show sample QR code data
        if (!empty($qrResult['qr_codes'])) {
            $sampleQR = $qrResult['qr_codes'][0];
            echo "📱 Sample QR Code Data:\n";
            echo json_encode($sampleQR['qr_data'], JSON_PRETTY_PRINT) . "\n";
        }
    } else {
        echo "❌ Failed to generate QR codes: " . $qrResult['message'] . "\n";
    }

    echo "\n=== DEMO SECTION 2: DRIVER CHECKPOINT SCANNING ===\n";
    
    // Simulate driver scanning a checkpoint
    $driverId = 1; // Assuming driver with ID 1 exists
    $checkpointQrData = [
        "type" => "route_checkpoint",
        "checkpoint_id" => 2, // Robinson Tejero
        "checkpoint_name" => "Robinson Tejero",
        "route_id" => 1,
        "route_name" => "SM Epza → SM Dasmariñas",
        "sequence_order" => 2,
        "fare_from_origin" => 8.00,
        "is_origin" => false,
        "is_destination" => false,
        "generated_at" => date('c')
    ];

    echo "Simulating driver scan at Robinson Tejero...\n";
    $scanResult = $checkpointController->processDriverScan($driverId, $checkpointQrData);
    
    if ($scanResult['status'] === 'success') {
        echo "✅ Driver scan processed successfully\n";
        echo "📍 Location: " . $scanResult['data']['checkpoint']['name'] . "\n";
        echo "⏰ Estimated arrival: " . $scanResult['data']['arrival_estimate']['next_checkpoint_eta'] . "\n";
    } else {
        echo "❌ Driver scan failed: " . $scanResult['message'] . "\n";
    }

    echo "\n=== DEMO SECTION 3: REAL-TIME LOCATION UPDATES ===\n";
    
    // Get current driver locations for route
    echo "Fetching real-time driver locations for Route 1...\n";
    $locationsResult = $checkpointController->getDriverLocationsForRoute(1);
    
    if ($locationsResult['status'] === 'success') {
        echo "✅ Found {$locationsResult['active_drivers']} active drivers\n";
        
        foreach ($locationsResult['driver_locations'] as $driver) {
            echo "🚐 Driver: {$driver['driver_name']} ({$driver['jeepney_number']})\n";
            echo "   📍 Current: {$driver['current_location']}\n";
            echo "   ⏰ Last update: {$driver['minutes_since_update']} minutes ago\n";
            echo "   🟢 Status: {$driver['status_message']}\n\n";
        }
    } else {
        echo "❌ Failed to get driver locations: " . $locationsResult['message'] . "\n";
    }

    echo "\n=== DEMO SECTION 4: PASSENGER NOTIFICATIONS ===\n";
    
    // Subscribe a passenger to route notifications
    $passengerId = 1; // Assuming passenger with ID 1 exists
    echo "Subscribing passenger to route notifications...\n";
    
    $subscribeResult = $notificationController->subscribeToRoute($passengerId, 1, null, 'all');
    
    if ($subscribeResult['status'] === 'success') {
        echo "✅ Passenger subscribed to notifications\n";
    } else {
        echo "❌ Subscription failed: " . $subscribeResult['message'] . "\n";
    }
    
    // Send arrival notification
    $driverData = [
        'driver_id' => 1,
        'driver_name' => 'Juan Dela Cruz',
        'jeepney_number' => 'LKB-001'
    ];
    
    $checkpointData = [
        'checkpoint_id' => 2,
        'checkpoint_name' => 'Robinson Tejero',
        'route_id' => 1,
        'route_name' => 'SM Epza → SM Dasmariñas'
    ];
    
    $arrivalEstimate = [
        'next_checkpoint_eta' => '5-7 mins'
    ];
    
    echo "Sending arrival notification...\n";
    $notificationResult = $notificationController->sendArrivalNotification($driverData, $checkpointData, $arrivalEstimate);
    
    if ($notificationResult['status'] === 'success') {
        echo "✅ Notification sent to {$notificationResult['passengers_notified']} passengers\n";
    } else {
        echo "❌ Notification failed: " . $notificationResult['message'] . "\n";
    }

    echo "\n=== DEMO SECTION 5: MULTIPLE DRIVER MANAGEMENT ===\n";
    
    // Simulate multiple drivers at same checkpoint
    echo "Checking for multiple drivers at checkpoint conflicts...\n";
    $conflictResult = $notificationController->handleMultipleDriversAtCheckpoint(2);
    
    if ($conflictResult['status'] === 'success') {
        if ($conflictResult['conflict_detected']) {
            echo "⚠️ Multiple drivers detected at checkpoint!\n";
            echo "📊 Organization: " . json_encode($conflictResult['organization'], JSON_PRETTY_PRINT) . "\n";
        } else {
            echo "✅ No conflicts detected\n";
        }
    } else {
        echo "❌ Conflict check failed: " . $conflictResult['message'] . "\n";
    }

    echo "\n=== DEMO COMPLETED ===\n";
    echo "🎉 Checkpoint Management System demonstration completed successfully!\n";
    echo "📚 Check the API documentation for complete endpoint details.\n";

} catch (Exception $e) {
    echo "\n❌ DEMO ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}

echo "\n" . str_repeat("=", 60) . "\n";
echo "API ENDPOINTS SUMMARY:\n";
echo str_repeat("=", 60) . "\n";

$endpoints = [
    "QR Code Generation" => [
        "POST /api/admin/checkpoints/qr/generate/{checkpointId}?route_id={routeId}" => "Generate single checkpoint QR",
        "POST /api/admin/checkpoints/qr/route/{routeId}" => "Generate all QR codes for route"
    ],
    "Driver Scanning" => [
        "POST /api/mobile/driver/scan/checkpoint" => "Process driver checkpoint scan"
    ],
    "Location Updates" => [
        "GET /api/mobile/locations/route/{routeId}" => "Get real-time driver locations",
        "GET /api/mobile/passenger/real-time-drivers/{routeId}" => "Get driver locations for passengers"
    ],
    "Notifications" => [
        "POST /api/mobile/notifications/subscribe" => "Subscribe to route notifications",
        "POST /api/mobile/notifications/unsubscribe" => "Unsubscribe from notifications",
        "GET /api/mobile/notifications/history/{passengerId}" => "Get notification history",
        "PUT /api/mobile/notifications/read/{notificationId}" => "Mark notification as read"
    ],
    "Conflict Management" => [
        "GET /api/mobile/passenger/checkpoint-conflicts/{checkpointId}" => "Check multiple driver conflicts"
    ]
];

foreach ($endpoints as $category => $categoryEndpoints) {
    echo "\n{$category}:\n";
    foreach ($categoryEndpoints as $endpoint => $description) {
        echo "  {$endpoint}\n    → {$description}\n";
    }
}

echo "\n" . str_repeat("=", 60) . "\n";
echo "For complete API documentation, visit: /api/test\n";
echo "Demo script location: " . __FILE__ . "\n";
echo str_repeat("=", 60) . "\n";
?>
