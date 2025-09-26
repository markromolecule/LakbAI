<?php
// Update database with real checkpoint coordinates
require_once __DIR__ . '/../config/db.php';

$coordinates = [
    'SM Epza' => ['latitude' => 14.409629181477962, 'longitude' => 120.8584739239211],
    'Robinson Tejero' => ['latitude' => 14.396361587038916, 'longitude' => 120.86440599975052],
    'Malabon' => ['latitude' => 14.382509562201045, 'longitude' => 120.87634530641748],
    'Riverside' => ['latitude' => 14.371008762977079, 'longitude' => 120.88894636603828],
    'Lancaster New City' => ['latitude' => 14.368944220372283, 'longitude' => 120.89043948162315],
    'Pasong Camachile I' => ['latitude' => 14.362784771928764, 'longitude' => 120.89522178154438],
    'Open Canal' => ['latitude' => 14.35597283700001, 'longitude' => 120.89917993041003],
    'Santiago' => ['latitude' => 14.338339967573228, 'longitude' => 120.90836777424107],
    'Bella Vista' => ['latitude' => 14.334492325278166, 'longitude' => 120.90943687747456],
    'San Francisco' => ['latitude' => 14.318158880567536, 'longitude' => 120.9153688438684],
    'Country Meadow' => ['latitude' => 14.30612462380255, 'longitude' => 120.92167276378188],
    'Pabahay' => ['latitude' => 14.301797544185217, 'longitude' => 120.92297040415359],
    'Monterey' => ['latitude' => 14.29226340041011, 'longitude' => 120.92381733064333],
    'Langkaan' => ['latitude' => 14.29370584510167, 'longitude' => 120.93736803267231],
    'Tierra Vista' => ['latitude' => 14.296129726839375, 'longitude' => 120.94490055477397],
    'Robinson Dasmariñas' => ['latitude' => 14.301262844509864, 'longitude' => 120.95323789530529],
    'SM Dasmariñas' => ['latitude' => 14.300629147336467, 'longitude' => 120.9562685950263],
];

try {
    // Use the PDO connection from the config
    global $pdo;
    
    echo "Updating checkpoint coordinates with real data...\n";
    
    $updated = 0;
    $notFound = 0;
    
    foreach ($coordinates as $checkpointName => $coords) {
        $stmt = $pdo->prepare("UPDATE checkpoints SET latitude = ?, longitude = ? WHERE checkpoint_name = ?");
        $result = $stmt->execute([$coords['latitude'], $coords['longitude'], $checkpointName]);
        
        if ($stmt->rowCount() > 0) {
            echo "✅ Updated: $checkpointName - Lat: {$coords['latitude']}, Lng: {$coords['longitude']}\n";
            $updated++;
        } else {
            echo "❌ Not found: $checkpointName\n";
            $notFound++;
        }
    }
    
    echo "\n📊 Summary:\n";
    echo "Updated: $updated checkpoints\n";
    echo "Not found: $notFound checkpoints\n";
    
    // Verify the updates
    echo "\n🔍 Verifying updates...\n";
    $stmt = $pdo->query("SELECT checkpoint_name, latitude, longitude FROM checkpoints WHERE latitude IS NOT NULL AND longitude IS NOT NULL ORDER BY checkpoint_name");
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($results as $row) {
        echo "📍 {$row['checkpoint_name']}: {$row['latitude']}, {$row['longitude']}\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
