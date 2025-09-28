<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

class SearchController {
    private $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Search routes dynamically from database
     */
    public function searchRoutes(string $query, int $limit = 20): array {
        try {
            $searchTerm = '%' . $query . '%';
            
            $sql = "
                SELECT 
                    r.id,
                    r.route_name,
                    r.origin,
                    r.destination,
                    COUNT(c.id) as checkpoint_count
                FROM routes r
                LEFT JOIN checkpoints c ON r.id = c.route_id
                WHERE (
                    r.route_name LIKE :query
                    OR r.origin LIKE :query
                    OR r.destination LIKE :query
                )
                GROUP BY r.id
                ORDER BY r.route_name ASC
                LIMIT :limit
            ";

            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':query', $searchTerm, PDO::PARAM_STR);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();

            $routes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'status' => 'success',
                'data' => $routes,
                'total' => count($routes),
                'query' => $query
            ];

        } catch (PDOException $e) {
            error_log("Search routes error: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Database search failed',
                'data' => []
            ];
        }
    }

    /**
     * Search fare matrix dynamically from database
     */
    public function searchFareMatrix(string $query, int $limit = 50): array {
        try {
            $searchTerm = '%' . $query . '%';
            
            $sql = "
                SELECT 
                    fm.id,
                    fm.fare_amount,
                    fm.status,
                    fm.created_at,
                    c1.checkpoint_name as from_checkpoint,
                    c2.checkpoint_name as to_checkpoint,
                    r.route_name,
                    r.origin,
                    r.destination
                FROM fare_matrix fm
                JOIN checkpoints c1 ON fm.from_checkpoint_id = c1.id
                JOIN checkpoints c2 ON fm.to_checkpoint_id = c2.id
                JOIN routes r ON fm.route_id = r.id
                WHERE fm.status = 'active'
                AND (
                    c1.checkpoint_name LIKE :query
                    OR c2.checkpoint_name LIKE :query
                    OR fm.fare_amount LIKE :query
                    OR r.route_name LIKE :query
                    OR r.origin LIKE :query
                    OR r.destination LIKE :query
                )
                ORDER BY fm.fare_amount ASC
                LIMIT :limit
            ";

            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':query', $searchTerm, PDO::PARAM_STR);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();

            $fares = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'status' => 'success',
                'data' => $fares,
                'total' => count($fares),
                'query' => $query
            ];

        } catch (PDOException $e) {
            error_log("Search fare matrix error: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Database search failed',
                'data' => []
            ];
        }
    }

    /**
     * Search checkpoints dynamically from database
     */
    public function searchCheckpoints(string $query, int $limit = 30): array {
        try {
            $searchTerm = '%' . $query . '%';
            
            $sql = "
                SELECT 
                    c.id,
                    c.checkpoint_name,
                    c.sequence_order,
                    c.is_origin,
                    c.is_destination,
                    r.route_name,
                    r.origin,
                    r.destination
                FROM checkpoints c
                JOIN routes r ON c.route_id = r.id
                WHERE r.status = 'active'
                AND (
                    c.checkpoint_name LIKE :query
                    OR r.route_name LIKE :query
                    OR r.origin LIKE :query
                    OR r.destination LIKE :query
                )
                ORDER BY c.sequence_order ASC
                LIMIT :limit
            ";

            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':query', $searchTerm, PDO::PARAM_STR);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();

            $checkpoints = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'status' => 'success',
                'data' => $checkpoints,
                'total' => count($checkpoints),
                'query' => $query
            ];

        } catch (PDOException $e) {
            error_log("Search checkpoints error: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Database search failed',
                'data' => []
            ];
        }
    }

    /**
     * Combined search across routes, fares, and checkpoints
     */
    public function searchAll(string $query, int $limit = 20): array {
        try {
            $routes = $this->searchRoutes($query, 10);
            $fares = $this->searchFareMatrix($query, 10);
            $checkpoints = $this->searchCheckpoints($query, 10);

            return [
                'status' => 'success',
                'data' => [
                    'routes' => $routes['data'] ?? [],
                    'fares' => $fares['data'] ?? [],
                    'checkpoints' => $checkpoints['data'] ?? []
                ],
                'totals' => [
                    'routes' => $routes['total'] ?? 0,
                    'fares' => $fares['total'] ?? 0,
                    'checkpoints' => $checkpoints['total'] ?? 0
                ],
                'query' => $query
            ];

        } catch (Exception $e) {
            error_log("Combined search error: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Search failed',
                'data' => []
            ];
        }
    }
}
?>
