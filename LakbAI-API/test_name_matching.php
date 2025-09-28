<?php
header('Content-Type: text/plain');

echo "🧪 Testing Name Matching Logic\n";
echo "==============================\n\n";

// Test cases for endpoint destination matching
$testCases = [
    ['driver' => 'SM Dasmariñas', 'passenger' => 'SM Dasmariñas'],
    ['driver' => 'SM Dasma', 'passenger' => 'SM Dasmariñas'],
    ['driver' => 'SM Dasmariñas', 'passenger' => 'SM Dasma'],
    ['driver' => 'SM Dasmariñas', 'passenger' => 'SM Dasmariñas'],
];

foreach ($testCases as $i => $test) {
    echo "Test Case " . ($i + 1) . ":\n";
    echo "  Driver Location: '{$test['driver']}'\n";
    echo "  Passenger Destination: '{$test['passenger']}'\n";
    
    // Test exact match
    $exactMatch = $test['driver'] === $test['passenger'];
    echo "  Exact Match: " . ($exactMatch ? 'YES' : 'NO') . "\n";
    
    // Test normalized match (like in LocationTrackingService)
    $normalizeLocation = function($loc) {
        $normalized = strtolower(trim($loc));
        $normalized = str_replace('sm dasmariñas', 'sm dasmarinas', $normalized);
        $normalized = str_replace('sm das', 'sm dasmarinas', $normalized);
        $normalized = str_replace('sm dasma', 'sm dasmarinas', $normalized);
        return $normalized;
    };
    
    $normalizedDriver = $normalizeLocation($test['driver']);
    $normalizedPassenger = $normalizeLocation($test['passenger']);
    $normalizedMatch = $normalizedDriver === $normalizedPassenger;
    
    echo "  Normalized Match: " . ($normalizedMatch ? 'YES' : 'NO') . "\n";
    echo "  Normalized Driver: '{$normalizedDriver}'\n";
    echo "  Normalized Passenger: '{$normalizedPassenger}'\n";
    echo "\n";
}

echo "✅ Name matching test completed!\n";
?>
