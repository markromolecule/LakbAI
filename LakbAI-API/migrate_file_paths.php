<?php
/**
 * File Path Migration Script
 * Updates existing file paths from old structure to new structure
 */

require_once __DIR__ . '/bootstrap/app.php';

try {
    // Get database connection
    $pdo = $app->get('PDO');
    
    echo "Starting file path migration...\n";
    
    // Update discount document paths from uploads/discounts/ to uploads/
    $updateQuery = "UPDATE `users` 
                    SET `discount_document_path` = REPLACE(`discount_document_path`, 'uploads/discounts/', 'uploads/')
                    WHERE `discount_document_path` LIKE 'uploads/discounts/%'";
    
    $stmt = $pdo->prepare($updateQuery);
    $result = $stmt->execute();
    $affectedRows = $stmt->rowCount();
    
    echo "Updated $affectedRows discount document paths\n";
    
    // Show the results of the migration
    $selectQuery = "SELECT 
                        id, 
                        username, 
                        discount_document_path,
                        discount_document_name
                    FROM `users` 
                    WHERE `discount_document_path` IS NOT NULL 
                    AND `discount_document_path` != ''";
    
    $stmt = $pdo->prepare($selectQuery);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "\nUpdated file paths:\n";
    foreach ($users as $user) {
        echo "User ID: {$user['id']}, Username: {$user['username']}, Path: {$user['discount_document_path']}\n";
    }
    
    // Count how many records were updated
    $countQuery = "SELECT 
                        COUNT(*) as total_discount_documents,
                        SUM(CASE WHEN discount_document_path LIKE 'uploads/%' THEN 1 ELSE 0 END) as updated_paths,
                        SUM(CASE WHEN discount_document_path LIKE 'uploads/discounts/%' THEN 1 ELSE 0 END) as old_paths_remaining
                    FROM `users` 
                    WHERE `discount_document_path` IS NOT NULL";
    
    $stmt = $pdo->prepare($countQuery);
    $stmt->execute();
    $counts = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "\nMigration Summary:\n";
    echo "Total discount documents: {$counts['total_discount_documents']}\n";
    echo "Updated paths: {$counts['updated_paths']}\n";
    echo "Old paths remaining: {$counts['old_paths_remaining']}\n";
    
    echo "\nMigration completed successfully!\n";
    
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
?>
