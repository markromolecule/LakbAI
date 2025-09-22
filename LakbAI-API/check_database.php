<?php
/**
 * Database Structure Checker
 * Access: http://localhost:8000/LakbAI/LakbAI-API/check_database.php
 */

header('Content-Type: text/html; charset=utf-8');

echo "<h1>🔍 LakbAI Database Structure Check</h1>";
echo "<style>
    body { font-family: monospace; margin: 20px; }
    .success { color: green; font-weight: bold; }
    .error { color: red; font-weight: bold; }
    .warning { color: orange; font-weight: bold; }
    table { border-collapse: collapse; width: 100%; margin: 10px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .code { background: #f5f5f5; padding: 10px; border-radius: 5px; margin: 10px 0; }
</style>";

try {
    // Database connection
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=lakbai_db', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<div class='success'>✅ Connected to database successfully</div>";
    
    // 1. Check database existence
    echo "<h2>1. Database Information</h2>";
    $stmt = $pdo->query("SELECT DATABASE() as current_db");
    $db = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "<p><strong>Current Database:</strong> " . $db['current_db'] . "</p>";
    
    // 2. Check if driver_earnings table exists
    echo "<h2>2. Table Check</h2>";
    $stmt = $pdo->query("SHOW TABLES LIKE 'driver_earnings'");
    $tableExists = $stmt->rowCount() > 0;
    
    if ($tableExists) {
        echo "<div class='success'>✅ driver_earnings table exists</div>";
    } else {
        echo "<div class='error'>❌ driver_earnings table NOT found</div>";
        echo "<div class='code'>
        CREATE TABLE driver_earnings (<br>
        &nbsp;&nbsp;id INT AUTO_INCREMENT PRIMARY KEY,<br>
        &nbsp;&nbsp;driver_id INT NOT NULL,<br>
        &nbsp;&nbsp;trip_id VARCHAR(255),<br>
        &nbsp;&nbsp;passenger_id VARCHAR(255),<br>
        &nbsp;&nbsp;amount DECIMAL(10,2) NOT NULL,<br>
        &nbsp;&nbsp;original_fare DECIMAL(10,2),<br>
        &nbsp;&nbsp;discount_amount DECIMAL(10,2) DEFAULT 0,<br>
        &nbsp;&nbsp;final_fare DECIMAL(10,2) NOT NULL,<br>
        &nbsp;&nbsp;counts_as_trip TINYINT(1) NOT NULL DEFAULT 0,<br>
        &nbsp;&nbsp;payment_method VARCHAR(50),<br>
        &nbsp;&nbsp;pickup_location VARCHAR(255),<br>
        &nbsp;&nbsp;destination VARCHAR(255),<br>
        &nbsp;&nbsp;transaction_date DATE,<br>
        &nbsp;&nbsp;created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP<br>
        );
        </div>";
        exit;
    }
    
    // 3. Check table structure
    echo "<h2>3. Table Structure</h2>";
    $stmt = $pdo->query("DESCRIBE driver_earnings");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<table>";
    echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>";
    
    $hasCountsAsTrip = false;
    foreach ($columns as $column) {
        $highlight = '';
        if ($column['Field'] === 'counts_as_trip') {
            $hasCountsAsTrip = true;
            $highlight = 'style="background-color: #d4edda;"';
        }
        
        echo "<tr $highlight>";
        echo "<td>" . $column['Field'] . "</td>";
        echo "<td>" . $column['Type'] . "</td>";
        echo "<td>" . $column['Null'] . "</td>";
        echo "<td>" . $column['Key'] . "</td>";
        echo "<td>" . $column['Default'] . "</td>";
        echo "<td>" . $column['Extra'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // 4. Check for counts_as_trip column
    echo "<h2>4. Critical Column Check</h2>";
    if ($hasCountsAsTrip) {
        echo "<div class='success'>✅ counts_as_trip column exists!</div>";
    } else {
        echo "<div class='error'>❌ counts_as_trip column MISSING!</div>";
        echo "<p><strong>This is why trip counting doesn't work!</strong></p>";
        echo "<div class='code'>
        <strong>Run this SQL to fix:</strong><br><br>
        ALTER TABLE driver_earnings<br>
        ADD COLUMN counts_as_trip TINYINT(1) NOT NULL DEFAULT 0<br>
        COMMENT 'Whether this earnings record should count as a completed trip (1) or just payment (0)'<br>
        AFTER final_fare;<br><br>
        
        UPDATE driver_earnings SET counts_as_trip = 1 WHERE counts_as_trip = 0;<br><br>
        
        CREATE INDEX idx_driver_trip_count ON driver_earnings (driver_id, counts_as_trip, transaction_date);
        </div>";
    }
    
    // 5. Check existing data
    echo "<h2>5. Data Analysis</h2>";
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM driver_earnings");
    $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    echo "<p><strong>Total earnings records:</strong> $total</p>";
    
    if ($total > 0) {
        echo "<h3>Recent Records:</h3>";
        $stmt = $pdo->query("
            SELECT 
                id, 
                driver_id, 
                trip_id, 
                passenger_id, 
                final_fare, 
                " . ($hasCountsAsTrip ? "counts_as_trip," : "'N/A' as counts_as_trip,") . "
                created_at 
            FROM driver_earnings 
            ORDER BY created_at DESC 
            LIMIT 5
        ");
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<table>";
        echo "<tr><th>ID</th><th>Driver ID</th><th>Trip ID</th><th>Passenger ID</th><th>Final Fare</th><th>Counts as Trip</th><th>Created</th></tr>";
        foreach ($records as $record) {
            echo "<tr>";
            echo "<td>" . $record['id'] . "</td>";
            echo "<td>" . $record['driver_id'] . "</td>";
            echo "<td>" . $record['trip_id'] . "</td>";
            echo "<td>" . $record['passenger_id'] . "</td>";
            echo "<td>₱" . $record['final_fare'] . "</td>";
            echo "<td>" . $record['counts_as_trip'] . "</td>";
            echo "<td>" . $record['created_at'] . "</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        if ($hasCountsAsTrip) {
            echo "<h3>Trip vs Payment Breakdown:</h3>";
            $stmt = $pdo->query("
                SELECT 
                    counts_as_trip,
                    COUNT(*) as count,
                    CASE 
                        WHEN counts_as_trip = 1 THEN 'Trip Completions'
                        ELSE 'Payments Only'
                    END as type
                FROM driver_earnings 
                GROUP BY counts_as_trip
            ");
            $breakdown = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo "<table>";
            echo "<tr><th>Type</th><th>Count</th></tr>";
            foreach ($breakdown as $row) {
                echo "<tr>";
                echo "<td>" . $row['type'] . "</td>";
                echo "<td>" . $row['count'] . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        }
    }
    
    // 6. Check driver data
    echo "<h2>6. Driver Data Check</h2>";
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users WHERE user_type = 'driver'");
    $driverCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "<p><strong>Total drivers:</strong> $driverCount</p>";
    
    if ($driverCount > 0) {
        // Check for driver ID 16 specifically (from logs)
        $stmt = $pdo->query("SELECT id, first_name, last_name, email FROM users WHERE id = 16 AND user_type = 'driver'");
        $driver16 = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($driver16) {
            echo "<div class='success'>✅ Driver ID 16 found: " . $driver16['first_name'] . " " . $driver16['last_name'] . " (" . $driver16['email'] . ")</div>";
        } else {
            echo "<div class='warning'>⚠️ Driver ID 16 not found (check your driver login)</div>";
        }
        
        echo "<h3>Recent Drivers:</h3>";
        $stmt = $pdo->query("SELECT id, first_name, last_name, email, created_at FROM users WHERE user_type = 'driver' ORDER BY created_at DESC LIMIT 5");
        $drivers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<table>";
        echo "<tr><th>ID</th><th>Name</th><th>Email</th><th>Created</th></tr>";
        foreach ($drivers as $driver) {
            $highlight = ($driver['id'] == 16) ? 'style="background-color: #d4edda;"' : '';
            echo "<tr $highlight>";
            echo "<td>" . $driver['id'] . "</td>";
            echo "<td>" . $driver['first_name'] . " " . $driver['last_name'] . "</td>";
            echo "<td>" . $driver['email'] . "</td>";
            echo "<td>" . $driver['created_at'] . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
    
    // 7. Summary
    echo "<h2>7. Summary</h2>";
    if ($hasCountsAsTrip && $driverCount > 0) {
        echo "<div class='success'>🎉 Database structure looks good! Trip counting should work.</div>";
        echo "<p><strong>Next steps:</strong></p>";
        echo "<ul>";
        echo "<li>✅ Database structure is correct</li>";
        echo "<li>🔍 Check QR code scanning logs in the mobile app</li>";
        echo "<li>🔍 Verify the QR code format matches expected structure</li>";
        echo "</ul>";
    } else {
        echo "<div class='error'>⚠️ Issues found that need to be fixed:</div>";
        echo "<ul>";
        if (!$hasCountsAsTrip) {
            echo "<li>❌ Missing counts_as_trip column - this is critical for trip counting</li>";
        }
        if ($driverCount == 0) {
            echo "<li>❌ No drivers found in database</li>";
        }
        echo "</ul>";
    }
    
} catch (Exception $e) {
    echo "<div class='error'>❌ Database connection failed: " . $e->getMessage() . "</div>";
    echo "<p><strong>Common fixes:</strong></p>";
    echo "<ul>";
    echo "<li>Make sure XAMPP MySQL is running</li>";
    echo "<li>Check if database 'lakbai_db' exists</li>";
    echo "<li>Verify MySQL username/password (usually root with no password for XAMPP)</li>";
    echo "</ul>";
}
?>
