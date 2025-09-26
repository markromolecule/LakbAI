<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=lakbai_db', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Adding coordinates to checkpoints table...\n";
    
    // Add coordinates columns if they don't exist
    try {
        $pdo->exec("ALTER TABLE checkpoints ADD COLUMN latitude DECIMAL(10, 8) DEFAULT NULL");
        echo "✅ Added latitude column\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
            echo "ℹ️ Latitude column already exists\n";
        } else {
            throw $e;
        }
    }
    
    try {
        $pdo->exec("ALTER TABLE checkpoints ADD COLUMN longitude DECIMAL(11, 8) DEFAULT NULL");
        echo "✅ Added longitude column\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
            echo "ℹ️ Longitude column already exists\n";
        } else {
            throw $e;
        }
    }
    
    // Update coordinates for Route 1: SM Epza → SM Dasmariñas
    $coordinates = [
        ['SM Epza', 1, 14.5995, 120.9842],
        ['Robinson Tejero', 1, 14.5800, 120.9800],
        ['Malabon', 1, 14.5700, 120.9700],
        ['Riverside', 1, 14.5600, 120.9600],
        ['Lancaster New City', 1, 14.5500, 120.9500],
        ['Pasong Camachile I', 1, 14.5400, 120.9400],
        ['Open Canal', 1, 14.5300, 120.9300],
        ['Santiago', 1, 14.5200, 120.9200],
        ['Bella Vista', 1, 14.5100, 120.9100],
        ['San Francisco', 1, 14.5000, 120.9000],
        ['Country Meadow', 1, 14.4900, 120.8900],
        ['Pabahay', 1, 14.4800, 120.8800],
        ['Monterey', 1, 14.4700, 120.8700],
        ['Langkaan', 1, 14.4600, 120.8600],
        ['Tierra Vista', 1, 14.4500, 120.8500],
        ['Robinson Dasmariñas', 1, 14.4400, 120.8400],
        ['SM Dasmariñas', 1, 14.3297, 120.9372],
    ];
    
    $stmt = $pdo->prepare("UPDATE checkpoints SET latitude = ?, longitude = ? WHERE checkpoint_name = ? AND route_id = ?");
    
    foreach ($coordinates as $coord) {
        $stmt->execute([$coord[2], $coord[3], $coord[0], $coord[1]]);
        echo "✅ Updated {$coord[0]} (Route {$coord[1]}): {$coord[2]}, {$coord[3]}\n";
    }
    
    // Update coordinates for Route 2: SM Dasmariñas → SM Epza (reverse order)
    $coordinates2 = [
        ['SM Dasmariñas', 2, 14.3297, 120.9372],
        ['Robinson Dasmariñas', 2, 14.4400, 120.8400],
        ['Tierra Vista', 2, 14.4500, 120.8500],
        ['Langkaan', 2, 14.4600, 120.8600],
        ['Monterey', 2, 14.4700, 120.8700],
        ['Pabahay', 2, 14.4800, 120.8800],
        ['Country Meadow', 2, 14.4900, 120.8900],
        ['San Francisco', 2, 14.5000, 120.9000],
        ['Bella Vista', 2, 14.5100, 120.9100],
        ['Santiago', 2, 14.5200, 120.9200],
        ['Open Canal', 2, 14.5300, 120.9300],
        ['Pasong Camachile I', 2, 14.5400, 120.9400],
        ['Lancaster New City', 2, 14.5500, 120.9500],
        ['Riverside', 2, 14.5600, 120.9600],
        ['Malabon', 2, 14.5700, 120.9700],
        ['Robinson Tejero', 2, 14.5800, 120.9800],
        ['SM Epza', 2, 14.5995, 120.9842],
    ];
    
    foreach ($coordinates2 as $coord) {
        $stmt->execute([$coord[2], $coord[3], $coord[0], $coord[1]]);
        echo "✅ Updated {$coord[0]} (Route {$coord[1]}): {$coord[2]}, {$coord[3]}\n";
    }
    
    // Add indexes for better performance
    try {
        $pdo->exec("CREATE INDEX idx_checkpoint_coordinates ON checkpoints (latitude, longitude)");
        echo "✅ Added coordinate index\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate key name') !== false) {
            echo "ℹ️ Coordinate index already exists\n";
        } else {
            throw $e;
        }
    }
    
    try {
        $pdo->exec("CREATE INDEX idx_checkpoint_name_coords ON checkpoints (checkpoint_name, latitude, longitude)");
        echo "✅ Added checkpoint name coordinate index\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate key name') !== false) {
            echo "ℹ️ Checkpoint name coordinate index already exists\n";
        } else {
            throw $e;
        }
    }
    
    echo "\nVerifying updates...\n";
    $stmt = $pdo->query("
        SELECT 
            c.id,
            c.checkpoint_name,
            c.route_id,
            r.route_name,
            c.sequence_order,
            c.latitude,
            c.longitude,
            c.is_origin,
            c.is_destination
        FROM checkpoints c
        JOIN routes r ON c.route_id = r.id
        WHERE c.status = 'active'
        ORDER BY c.route_id, c.sequence_order
    ");
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "- ID: {$row['id']}, Name: {$row['checkpoint_name']}, Route: {$row['route_name']}, Coords: {$row['latitude']}, {$row['longitude']}\n";
    }
    
    echo "\n✅ Checkpoint coordinates updated successfully!\n";

} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
