<?php
require_once __DIR__ . '/config/db.php';

header('Content-Type: text/plain');

echo "🧪 Simple Endpoint Test\n";
echo "======================\n\n";

try {
    // Test the exact matching logic
    $testCases = [
        ['checkpoint' => 'SM Dasmariñas', 'destination' => 'SM Dasmariñas'],
        ['checkpoint' => 'SM Dasma', 'destination' => 'SM Dasmariñas'],
        ['checkpoint' => 'SM Dasmariñas', 'destination' => 'SM Dasma'],
    ];
    
    foreach ($testCases as $i => $test) {
        echo "Test Case " . ($i + 1) . ":\n";
        echo "  Checkpoint: {$test['checkpoint']}\n";
        echo "  Destination: {$test['destination']}\n";
        
        // Test exact match
        $exactMatch = $test['checkpoint'] === $test['destination'];
        echo "  Exact match: " . ($exactMatch ? 'YES' : 'NO') . "\n";
        
        // Test LIKE match
        $likeMatch = (strpos($test['checkpoint'], 'SM Das') === 0 && strpos($test['destination'], 'SM Das') === 0);
        echo "  LIKE 'SM Das%' match: " . ($likeMatch ? 'YES' : 'NO') . "\n";
        
        // Test overall match (either exact or LIKE)
        $overallMatch = $exactMatch || $likeMatch;
        echo "  Overall match: " . ($overallMatch ? 'YES' : 'NO') . "\n";
        echo "\n";
    }
    
    echo "✅ Test completed successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Test failed: " . $e->getMessage() . "\n";
}
?>
