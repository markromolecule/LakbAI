<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=lakbai_db', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Updating checkpoint names for Route 1 (SM Epza → SM Dasmariñas)...\n";
    
    // Update checkpoint names
    $updates = [
        [1, 'SM Epza'],
        [2, 'Robinson Tejero'],
        [3, 'Robinson Pala-pala'],
        [4, 'Riverside'],
        [5, 'Lancaster New City'],
        [6, 'Pasong Camachile I'],
        [7, 'Open Canal'],
        [8, 'Santiago'],
        [9, 'Bella Vista'],
        [10, 'San Francisco'],
        [11, 'SM Dasmariñas']
    ];
    
    foreach ($updates as $update) {
        $stmt = $pdo->prepare("UPDATE checkpoints SET checkpoint_name = ? WHERE id = ? AND route_id = 1");
        $stmt->execute([$update[1], $update[0]]);
        echo "✅ Updated checkpoint {$update[0]} to '{$update[1]}'\n";
    }
    
    // Set origin and destination flags
    $stmt = $pdo->prepare("UPDATE checkpoints SET is_origin = 1 WHERE id = 1 AND route_id = 1");
    $stmt->execute();
    echo "✅ Set SM Epza as origin\n";
    
    $stmt = $pdo->prepare("UPDATE checkpoints SET is_destination = 1 WHERE id = 11 AND route_id = 1");
    $stmt->execute();
    echo "✅ Set SM Dasmariñas as destination\n";
    
    echo "\nVerifying updates...\n";
    $stmt = $pdo->query("SELECT id, checkpoint_name, sequence_order, is_origin, is_destination FROM checkpoints WHERE route_id = 1 ORDER BY sequence_order");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "- ID: {$row['id']}, Name: {$row['checkpoint_name']}, Order: {$row['sequence_order']}, Origin: {$row['is_origin']}, Destination: {$row['is_destination']}\n";
    }
    
    echo "\n✅ Checkpoint names updated successfully!\n";

} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
