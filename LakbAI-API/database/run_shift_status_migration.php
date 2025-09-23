<?php
require_once __DIR__ . '/../config/db.php';

try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=lakbai_db', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Adding shift_status column to users table...\n";
    
    // Add shift_status column if it doesn't exist
    $sql = "ALTER TABLE `users` 
            ADD COLUMN IF NOT EXISTS `shift_status` ENUM('on_shift','off_shift','available','busy','offline') DEFAULT 'off_shift'";
    $pdo->exec($sql);
    echo "✅ Added shift_status column\n";
    
    // Add last_active column if it doesn't exist  
    $sql = "ALTER TABLE `users` 
            ADD COLUMN IF NOT EXISTS `last_active` TIMESTAMP NULL";
    $pdo->exec($sql);
    echo "✅ Added last_active column\n";
    
    // Add indexes for better performance
    $sql = "ALTER TABLE `users` 
            ADD INDEX IF NOT EXISTS `idx_shift_status` (`shift_status`),
            ADD INDEX IF NOT EXISTS `idx_last_active` (`last_active`)";
    $pdo->exec($sql);
    echo "✅ Added indexes\n";
    
    // Update existing drivers to have off_shift status
    $sql = "UPDATE `users` 
            SET `shift_status` = 'off_shift' 
            WHERE `user_type` = 'driver' AND `shift_status` IS NULL";
    $result = $pdo->exec($sql);
    echo "✅ Updated $result drivers with off_shift status\n";
    
    // Show current drivers
    $stmt = $pdo->query("SELECT id, first_name, last_name, user_type, shift_status FROM users WHERE user_type = 'driver'");
    $drivers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "\nCurrent drivers in database:\n";
    foreach ($drivers as $driver) {
        echo "- ID: {$driver['id']}, Name: {$driver['first_name']} {$driver['last_name']}, Status: {$driver['shift_status']}\n";
    }
    
    echo "\n✅ Migration completed successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
