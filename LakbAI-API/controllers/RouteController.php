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
            // Select only the fields that exist in the current database
            $stmt = $this->db->prepare("SELECT id, route_name, origin, destination FROM routes ORDER BY route_name");
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
                
                // Always calculate fare_base from the first checkpoint (origin)
                if (!empty($route['checkpoints'])) {
                    // Get the fare from the first checkpoint (origin)
                    $firstCheckpoint = $route['checkpoints'][0];
                    $route['fare_base'] = $firstCheckpoint['fare_from_origin'] ?? '8.00';
                } else {
                    $route['fare_base'] = '8.00'; // Default fallback
                }
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

    /**
     * Update base fare for all routes
     */
    public function updateBaseFare($newFare) {
        try {
            // Update fare_from_origin for all origin checkpoints (is_origin = 1)
            $stmt = $this->db->prepare("UPDATE checkpoints SET fare_from_origin = ? WHERE is_origin = 1");
            $stmt->execute([$newFare]);
            $updated = $stmt->rowCount();

            return [
                "status" => "success",
                "message" => "Base fare updated successfully",
                "updated_checkpoints" => $updated,
                "new_fare" => $newFare
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to update base fare: " . $e->getMessage()
            ];
        }
    }
}
?>
