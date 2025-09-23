<?php
/**
 * Fare Matrix Setup Script
 * 
 * This script sets up the dynamic fare matrix system for LakbAI
 * Run this script to create the fare matrix tables and populate initial data
 */

require_once __DIR__ . '/../config/db.php';

try {
    echo "🚀 Starting Fare Matrix Setup...\n\n";
    
    // Read the SQL file
    $sqlFile = __DIR__ . '/create_fare_matrix_simple.sql';
    if (!file_exists($sqlFile)) {
        throw new Exception("SQL file not found: $sqlFile");
    }
    
    $sql = file_get_contents($sqlFile);
    if ($sql === false) {
        throw new Exception("Failed to read SQL file");
    }
    
    echo "📖 Reading SQL file...\n";
    
    // Split SQL into individual statements
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($stmt) {
            return !empty($stmt) && !preg_match('/^--/', $stmt);
        }
    );
    
    echo "📊 Found " . count($statements) . " SQL statements to execute\n\n";
    
    $executedCount = 0;
    $errorCount = 0;
    
    foreach ($statements as $index => $statement) {
        try {
            if (empty(trim($statement))) continue;
            
            echo "⚡ Executing statement " . ($index + 1) . "...\n";
            
            // Skip comments and empty statements
            if (preg_match('/^--/', $statement) || preg_match('/^\/\*/', $statement)) {
                continue;
            }
            
            $result = $pdo->exec($statement);
            $executedCount++;
            
            if (preg_match('/CREATE TABLE/i', $statement)) {
                echo "   ✅ Table created successfully\n";
            } elseif (preg_match('/INSERT INTO/i', $statement)) {
                echo "   ✅ Data inserted successfully\n";
            } elseif (preg_match('/CREATE VIEW/i', $statement)) {
                echo "   ✅ View created successfully\n";
            } elseif (preg_match('/CREATE FUNCTION/i', $statement)) {
                echo "   ✅ Function created successfully\n";
            } elseif (preg_match('/CREATE TRIGGER/i', $statement)) {
                echo "   ✅ Trigger created successfully\n";
            } elseif (preg_match('/CREATE PROCEDURE/i', $statement)) {
                echo "   ✅ Procedure created successfully\n";
            } else {
                echo "   ✅ Statement executed successfully\n";
            }
            
        } catch (Exception $e) {
            $errorCount++;
            echo "   ❌ Error: " . $e->getMessage() . "\n";
            
            // Continue with other statements even if one fails
            continue;
        }
    }
    
    echo "\n📈 Setup Summary:\n";
    echo "   ✅ Successfully executed: $executedCount statements\n";
    echo "   ❌ Errors encountered: $errorCount statements\n\n";
    
    // Test the fare matrix functionality
    echo "🧪 Testing Fare Matrix Functionality...\n\n";
    
    // Test 1: Check if tables exist
    echo "1. Checking if fare_matrix table exists...\n";
    $stmt = $pdo->query("SHOW TABLES LIKE 'fare_matrix'");
    if ($stmt->rowCount() > 0) {
        echo "   ✅ fare_matrix table exists\n";
    } else {
        echo "   ❌ fare_matrix table not found\n";
    }
    
    // Test 2: Check fare matrix entries
    echo "2. Checking fare matrix entries...\n";
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM fare_matrix WHERE status = 'active'");
    $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "   📊 Active fare matrix entries: $count\n";
    
    // Test 3: Test fare calculation function
    echo "3. Testing fare calculation function...\n";
    try {
        $stmt = $pdo->query("SELECT GetFareBetweenCheckpoints(1, 2, 1) as fare");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "   💰 Sample fare calculation (checkpoint 1 to 2): ₱" . $result['fare'] . "\n";
    } catch (Exception $e) {
        echo "   ❌ Fare calculation function error: " . $e->getMessage() . "\n";
    }
    
    // Test 4: Show sample fare matrix data
    echo "4. Sample fare matrix data:\n";
    $stmt = $pdo->query("
        SELECT 
            c1.checkpoint_name as from_checkpoint,
            c2.checkpoint_name as to_checkpoint,
            fm.fare_amount,
            fm.is_base_fare
        FROM fare_matrix fm
        JOIN checkpoints c1 ON fm.from_checkpoint_id = c1.id
        JOIN checkpoints c2 ON fm.to_checkpoint_id = c2.id
        WHERE fm.status = 'active'
        ORDER BY c1.sequence_order, c2.sequence_order
        LIMIT 10
    ");
    
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($results as $row) {
        $baseFareIndicator = $row['is_base_fare'] ? ' (Base)' : '';
        echo "   🚌 {$row['from_checkpoint']} → {$row['to_checkpoint']}: ₱{$row['fare_amount']}$baseFareIndicator\n";
    }
    
    echo "\n🎉 Fare Matrix Setup Complete!\n";
    echo "\n📋 Next Steps:\n";
    echo "   1. Test the API endpoints:\n";
    echo "      - GET /api/fare-matrix\n";
    echo "      - GET /api/fare-matrix/route/1\n";
    echo "      - GET /api/fare-matrix/fare/1/2\n";
    echo "   2. Generate fare matrices for all routes:\n";
    echo "      - POST /api/fare-matrix/generate/1\n";
    echo "      - POST /api/fare-matrix/generate/2\n";
    echo "   3. Test the mobile app fare calculation\n";
    echo "   4. Update fare amounts as needed through the admin panel\n\n";
    
} catch (Exception $e) {
    echo "❌ Setup failed: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
?>
