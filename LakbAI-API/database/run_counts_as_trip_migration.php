<?php
/**
 * Run the counts_as_trip migration
 * This script adds the counts_as_trip field to the driver_earnings table
 */

// Include database configuration
require_once __DIR__ . '/../config/db.php';

try {
    // Create PDO connection
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=lakbai_db', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "🚀 Starting counts_as_trip migration...\n";

    // Read and execute the migration SQL
    $migrationSQL = file_get_contents(__DIR__ . '/add_counts_as_trip_field.sql');
    
    // Split the SQL into individual statements
    $statements = array_filter(array_map('trim', explode(';', $migrationSQL)));
    
    foreach ($statements as $statement) {
        if (empty($statement) || strpos($statement, '--') === 0) {
            continue; // Skip empty statements and comments
        }
        
        try {
            $pdo->exec($statement);
            echo "✅ Executed: " . substr($statement, 0, 50) . "...\n";
        } catch (PDOException $e) {
            // Ignore "column already exists" errors
            if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
                echo "⚠️  Column already exists, skipping...\n";
            } else {
                throw $e;
            }
        }
    }

    // Verify the migration
    $stmt = $pdo->query("DESCRIBE driver_earnings");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (in_array('counts_as_trip', $columns)) {
        echo "✅ Migration completed successfully!\n";
        echo "📊 The counts_as_trip field has been added to driver_earnings table.\n";
        
        // Show some stats
        $stmt = $pdo->query("SELECT COUNT(*) as total, SUM(counts_as_trip) as trips FROM driver_earnings");
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "📈 Current stats: {$stats['total']} total records, {$stats['trips']} count as trips\n";
    } else {
        echo "❌ Migration failed - counts_as_trip field not found\n";
    }

} catch (Exception $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}

echo "🎉 Migration complete!\n";
?>
