<?php
require_once __DIR__ . '/config/db.php';

header('Content-Type: application/json');

try {
    // Test simple query
    $sql = "SELECT id, route_name, origin, destination FROM routes LIMIT 5";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $routes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => 'success',
        'data' => $routes,
        'count' => count($routes)
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
