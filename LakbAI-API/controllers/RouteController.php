<?php
class RouteController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Get all active routes
     */
    public function getAllRoutes() {
        try {
            $stmt = $this->db->prepare("SELECT * FROM routes ORDER BY route_name");
            $stmt->execute();
            $routes = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get checkpoints for each route
            foreach ($routes as &$route) {
                $checkpointStmt = $this->db->prepare("
                    SELECT checkpoint_name, sequence_order, fare_from_origin, is_origin, is_destination
                    FROM checkpoints 
                    WHERE route_id = ? AND status = 'active'
                    ORDER BY sequence_order ASC
                ");
                $checkpointStmt->execute([$route['id']]);
                $route['checkpoints'] = $checkpointStmt->fetchAll(PDO::FETCH_ASSOC);
            }

            return [
                "status" => "success",
                "routes" => $routes
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to fetch routes: " . $e->getMessage()
            ];
        }
    }

    /**
     * Get route by ID
     */
    public function getRouteById($id) {
        try {
            $stmt = $this->db->prepare("SELECT * FROM routes WHERE id = ?");
            $stmt->execute([$id]);
            $route = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($route) {
                return [
                    "status" => "success",
                    "route" => $route
                ];
            }

            return [
                "status" => "error",
                "message" => "Route not found"
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to get route: " . $e->getMessage()
            ];
        }
    }

    /**
     * Create new route
     */
    public function createRoute($data) {
        // Sanitize input data
        $sanitizedData = [
            'route_name' => htmlspecialchars(strip_tags($data['route_name'] ?? '')),
            'origin' => htmlspecialchars(strip_tags($data['origin'] ?? '')),
            'destination' => htmlspecialchars(strip_tags($data['destination'] ?? '')),
            'description' => htmlspecialchars(strip_tags($data['description'] ?? '')),
            'fare_base' => floatval($data['fare_base'] ?? 8.00),
            'status' => htmlspecialchars(strip_tags($data['status'] ?? 'active'))
        ];

        // Validate required fields
        if (empty($sanitizedData['route_name']) || empty($sanitizedData['origin']) || empty($sanitizedData['destination'])) {
            return ["status" => "error", "message" => "Missing required fields"];
        }

        try {
            $stmt = $this->db->prepare("INSERT INTO routes (route_name, origin, destination, description, fare_base, status) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $sanitizedData['route_name'],
                $sanitizedData['origin'],
                $sanitizedData['destination'],
                $sanitizedData['description'],
                $sanitizedData['fare_base'],
                $sanitizedData['status']
            ]);

            return [
                "status" => "success",
                "message" => "Route created successfully",
                "route_id" => $this->db->lastInsertId()
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to create route: " . $e->getMessage()
            ];
        }
    }

    /**
     * Update route
     */
    public function updateRoute($id, $data) {
        // Sanitize input data
        $sanitizedData = [
            'route_name' => htmlspecialchars(strip_tags($data['route_name'] ?? '')),
            'origin' => htmlspecialchars(strip_tags($data['origin'] ?? '')),
            'destination' => htmlspecialchars(strip_tags($data['destination'] ?? '')),
            'description' => htmlspecialchars(strip_tags($data['description'] ?? '')),
            'fare_base' => floatval($data['fare_base'] ?? 8.00),
            'status' => htmlspecialchars(strip_tags($data['status'] ?? 'active'))
        ];

        // Validate required fields
        if (empty($sanitizedData['route_name']) || empty($sanitizedData['origin']) || empty($sanitizedData['destination'])) {
            return ["status" => "error", "message" => "Missing required fields"];
        }

        try {
            $stmt = $this->db->prepare("UPDATE routes SET route_name=?, origin=?, destination=?, description=?, fare_base=?, status=? WHERE id=?");
            $stmt->execute([
                $sanitizedData['route_name'],
                $sanitizedData['origin'],
                $sanitizedData['destination'],
                $sanitizedData['description'],
                $sanitizedData['fare_base'],
                $sanitizedData['status'],
                $id
            ]);

            if ($stmt->rowCount() > 0) {
                return [
                    "status" => "success",
                    "message" => "Route updated successfully"
                ];
            }
            return [
                "status" => "error",
                "message" => "No route found with that ID"
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to update route: " . $e->getMessage()
            ];
        }
    }

    /**
     * Delete route
     */
    public function deleteRoute($id) {
        try {
            $stmt = $this->db->prepare("DELETE FROM routes WHERE id=?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() > 0) {
                return [
                    "status" => "success",
                    "message" => "Route deleted successfully"
                ];
            }
            return [
                "status" => "error",
                "message" => "No route found with that ID"
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to delete route: " . $e->getMessage()
            ];
        }
    }
}
?>
