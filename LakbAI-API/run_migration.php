<?php
/**
 * Simple migration runner to add counts_as_trip field
 * Access directly: http://localhost:8000/LakbAI/LakbAI-API/run_migration.php
 */

header('Content-Type: text/plain; charset=utf-8');

echo "🚀 LakbAI Database Migration - Adding counts_as_trip field\n";
echo "========================================================\n\n";

try {
    // Create PDO connection
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=lakbai_db', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "✅ Connected to database successfully\n\n";

    // Check if column already exists
    $stmt = $pdo->query("SHOW COLUMNS FROM driver_earnings LIKE 'counts_as_trip'");
    $columnExists = $stmt->rowCount() > 0;

    if ($columnExists) {
        echo "⚠️  Column 'counts_as_trip' already exists!\n";
        echo "✅ Migration is already complete.\n\n";
    } else {
        echo "📝 Adding 'counts_as_trip' column...\n";
        
        // Add the column
        $pdo->exec("ALTER TABLE driver_earnings 
                   ADD COLUMN counts_as_trip TINYINT(1) NOT NULL DEFAULT 0 
                   COMMENT 'Whether this earnings record should count as a completed trip (1) or just payment (0)'
                   AFTER final_fare");
        
        echo "✅ Column added successfully\n";

        // Update existing records to count as trips (to maintain current trip counts)
        $stmt = $pdo->prepare("UPDATE driver_earnings SET counts_as_trip = 1 WHERE counts_as_trip = 0");
        $stmt->execute();
        $updatedRows = $stmt->rowCount();
        
        echo "✅ Updated $updatedRows existing records to count as trips\n";

        // Create index for performance
        try {
            $pdo->exec("CREATE INDEX idx_driver_trip_count ON driver_earnings (driver_id, counts_as_trip, transaction_date)");
            echo "✅ Created performance index\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate key name') !== false) {
                echo "⚠️  Index already exists\n";
            } else {
                throw $e;
            }
        }
    }

    // Show current table structure
    echo "\n📊 Updated Table Structure:\n";
    echo "==========================\n";
    $stmt = $pdo->query("DESCRIBE driver_earnings");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $column) {
        $highlighted = $column['Field'] === 'counts_as_trip' ? ' <-- NEW FIELD' : '';
        echo sprintf("%-20s %-20s %-10s %s\n", 
            $column['Field'], 
            $column['Type'], 
            $column['Null'], 
            $highlighted
        );
    }

    // Show stats
    echo "\n📈 Current Statistics:\n";
    echo "=====================\n";
    $stmt = $pdo->query("SELECT 
        COUNT(*) as total_records,
        SUM(counts_as_trip) as trip_records,
        SUM(CASE WHEN counts_as_trip = 0 THEN 1 ELSE 0 END) as payment_only_records
        FROM driver_earnings");
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);

    echo "Total earnings records: {$stats['total_records']}\n";
    echo "Records that count as trips: {$stats['trip_records']}\n";
    echo "Payment-only records: {$stats['payment_only_records']}\n";

    echo "\n🎉 Migration completed successfully!\n";
    echo "📱 Now test a passenger payment to verify earnings update correctly.\n";

} catch (Exception $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    echo "\nPossible solutions:\n";
    echo "1. Make sure XAMPP MySQL is running\n";
    echo "2. Check database credentials\n";
    echo "3. Run this in phpMyAdmin:\n\n";
    echo "ALTER TABLE driver_earnings ADD COLUMN counts_as_trip TINYINT(1) NOT NULL DEFAULT 0 AFTER final_fare;\n";
    echo "UPDATE driver_earnings SET counts_as_trip = 1 WHERE counts_as_trip = 0;\n";
}
?>
