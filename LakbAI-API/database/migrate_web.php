<?php
/**
 * Web-based migration script to add counts_as_trip field
 * Access this via: http://localhost:8000/LakbAI/LakbAI-API/database/migrate_web.php
 */

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>LakbAI Database Migration</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>🚀 LakbAI Database Migration</h1>
    <p>Adding <code>counts_as_trip</code> field to driver_earnings table...</p>

<?php
try {
    // Use the same connection method as the API
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=lakbai_db', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "<div class='success'>✅ Connected to database successfully</div>\n";

    // Check if column already exists
    $stmt = $pdo->query("SHOW COLUMNS FROM driver_earnings LIKE 'counts_as_trip'");
    $columnExists = $stmt->rowCount() > 0;

    if ($columnExists) {
        echo "<div class='warning'>⚠️ Column 'counts_as_trip' already exists!</div>\n";
    } else {
        echo "<div>📝 Adding 'counts_as_trip' column...</div>\n";
        
        // Add the column
        $pdo->exec("ALTER TABLE driver_earnings 
                   ADD COLUMN counts_as_trip TINYINT(1) NOT NULL DEFAULT 0 
                   COMMENT 'Whether this earnings record should count as a completed trip (1) or just payment (0)'
                   AFTER final_fare");
        
        echo "<div class='success'>✅ Column added successfully</div>\n";
    }

    // Update existing records to count as trips (to maintain current trip counts)
    $stmt = $pdo->prepare("UPDATE driver_earnings SET counts_as_trip = 1 WHERE counts_as_trip = 0");
    $stmt->execute();
    $updatedRows = $stmt->rowCount();
    
    echo "<div class='success'>✅ Updated $updatedRows existing records to count as trips</div>\n";

    // Create index for performance
    try {
        $pdo->exec("CREATE INDEX idx_driver_trip_count ON driver_earnings (driver_id, counts_as_trip, transaction_date)");
        echo "<div class='success'>✅ Created performance index</div>\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate key name') !== false) {
            echo "<div class='warning'>⚠️ Index already exists</div>\n";
        } else {
            throw $e;
        }
    }

    // Show current table structure
    echo "<h3>📊 Current Table Structure:</h3>\n";
    echo "<pre>\n";
    $stmt = $pdo->query("DESCRIBE driver_earnings");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $column) {
        echo sprintf("%-20s %-20s %-10s %-10s %-20s %s\n", 
            $column['Field'], 
            $column['Type'], 
            $column['Null'], 
            $column['Key'], 
            $column['Default'], 
            $column['Extra']
        );
    }
    echo "</pre>\n";

    // Show stats
    $stmt = $pdo->query("SELECT 
        COUNT(*) as total_records,
        SUM(counts_as_trip) as trip_records,
        SUM(CASE WHEN counts_as_trip = 0 THEN 1 ELSE 0 END) as payment_only_records
        FROM driver_earnings");
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);

    echo "<h3>📈 Current Statistics:</h3>\n";
    echo "<ul>\n";
    echo "<li>Total earnings records: {$stats['total_records']}</li>\n";
    echo "<li>Records that count as trips: {$stats['trip_records']}</li>\n";
    echo "<li>Payment-only records: {$stats['payment_only_records']}</li>\n";
    echo "</ul>\n";

    echo "<div class='success'><h2>🎉 Migration completed successfully!</h2></div>\n";
    echo "<p><strong>Next steps:</strong> Test a passenger payment to verify trip count doesn't increment.</p>\n";

} catch (Exception $e) {
    echo "<div class='error'>❌ Migration failed: " . htmlspecialchars($e->getMessage()) . "</div>\n";
}
?>

</body>
</html>
