<?php
class JeepneyController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getAll() {
        try {
            $stmt = $this->db->prepare("SELECT * FROM jeepneys ORDER BY id DESC");
            $stmt->execute();
            $jeepneys = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "jeepneys" => $jeepneys
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to fetch jeepneys: " . $e->getMessage()
            ];
        }
    }

    public function create($data) {
        // Sanitize input data
        $sanitizedData = [
            'plate_number' => htmlspecialchars(strip_tags($data['plate_number'] ?? '')),
            'route' => htmlspecialchars(strip_tags($data['route'] ?? '')),
            'capacity' => intval($data['capacity'] ?? 0),
            'status' => htmlspecialchars(strip_tags($data['status'] ?? 'active')),
            'driver_id' => isset($data['driver_id']) ? intval($data['driver_id']) : null
        ];

        // Validate required fields
        if (empty($sanitizedData['plate_number']) || empty($sanitizedData['route']) || $sanitizedData['capacity'] <= 0) {
            return ["status" => "error", "message" => "Missing or invalid required fields"];
        }

        try {
            $stmt = $this->db->prepare("INSERT INTO jeepneys (plate_number, route, capacity, status, driver_id) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $sanitizedData['plate_number'],
                $sanitizedData['route'],
                $sanitizedData['capacity'],
                $sanitizedData['status'],
                $sanitizedData['driver_id']
            ]);

            return [
                "status" => "success",
                "message" => "Jeepney added successfully",
                "jeepney_id" => $this->db->insert_id
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to create jeepney: " . $e->getMessage()
            ];
        }
    }

    public function update($id, $data) {
        // Sanitize input data
        $sanitizedData = [
            'plate_number' => htmlspecialchars(strip_tags($data['plate_number'] ?? '')),
            'route' => htmlspecialchars(strip_tags($data['route'] ?? '')),
            'capacity' => intval($data['capacity'] ?? 0),
            'status' => htmlspecialchars(strip_tags($data['status'] ?? 'active')),
            'driver_id' => isset($data['driver_id']) ? intval($data['driver_id']) : null
        ];

        // Validate required fields
        if (empty($sanitizedData['plate_number']) || empty($sanitizedData['route']) || $sanitizedData['capacity'] <= 0) {
            return ["status" => "error", "message" => "Missing or invalid required fields"];
        }

        try {
            $stmt = $this->db->prepare("UPDATE jeepneys SET plate_number=?, route=?, capacity=?, status=?, driver_id=? WHERE id=?");
            $stmt->execute([
                $sanitizedData['plate_number'],
                $sanitizedData['route'],
                $sanitizedData['capacity'],
                $sanitizedData['status'],
                $sanitizedData['driver_id'],
                $id
            ]);

            if ($stmt->affected_rows > 0) {
                return [
                    "status" => "success",
                    "message" => "Jeepney updated successfully"
                ];
            }
            return [
                "status" => "error",
                "message" => "No jeepney found with that ID"
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to update jeepney: " . $e->getMessage()
            ];
        }
    }

    public function delete($id) {
        try {
            $stmt = $this->db->prepare("DELETE FROM jeepneys WHERE id=?");
            $stmt->execute([$id]);

            return [
                "status" => "success",
                "message" => "Jeepney deleted successfully"
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to delete jeepney: " . $e->getMessage()
            ];
        }
    }

    // Add missing methods that routes expect
    public function getJeepneyById($id) {
        try {
            $stmt = $this->db->prepare("SELECT * FROM jeepneys WHERE id = ?");
            $stmt->execute([$id]);
            $jeepney = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($jeepney) {
                return ["status" => "success", "jeepney" => $jeepney];
            }
            return ["status" => "error", "message" => "Jeepney not found"];
        } catch (Exception $e) {
            return ["status" => "error", "message" => "Failed to fetch jeepney: " . $e->getMessage()];
        }
    }

    public function createJeepney($data) {
        // Sanitize input data
        $sanitizedData = [
            'plate_number' => htmlspecialchars(strip_tags($data['plate_number'] ?? '')),
            'route' => htmlspecialchars(strip_tags($data['route'] ?? '')),
            'capacity' => intval($data['capacity'] ?? 0),
            'status' => htmlspecialchars(strip_tags($data['status'] ?? 'active')),
            'driver_id' => isset($data['driver_id']) ? intval($data['driver_id']) : null
        ];

        // Validate required fields
        if (empty($sanitizedData['plate_number']) || empty($sanitizedData['route']) || $sanitizedData['capacity'] <= 0) {
            return ["status" => "error", "message" => "Missing or invalid required fields"];
        }

        try {
            $stmt = $this->db->prepare("INSERT INTO jeepneys (plate_number, route, capacity, status, driver_id) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $sanitizedData['plate_number'],
                $sanitizedData['route'],
                $sanitizedData['capacity'],
                $sanitizedData['status'],
                $sanitizedData['driver_id']
            ]);

            return [
                "status" => "success",
                "message" => "Jeepney added successfully",
                "jeepney_id" => $this->db->insert_id
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to create jeepney: " . $e->getMessage()
            ];
        }
    }

    public function updateJeepney($id, $data) {
        // Sanitize input data
        $sanitizedData = [
            'plate_number' => htmlspecialchars(strip_tags($data['plate_number'] ?? '')),
            'route' => htmlspecialchars(strip_tags($data['route'] ?? '')),
            'capacity' => intval($data['capacity'] ?? 0),
            'status' => htmlspecialchars(strip_tags($data['status'] ?? 'active')),
            'driver_id' => isset($data['driver_id']) ? intval($data['driver_id']) : null
        ];

        // Validate required fields
        if (empty($sanitizedData['plate_number']) || empty($sanitizedData['route']) || $sanitizedData['capacity'] <= 0) {
            return ["status" => "error", "message" => "Missing or invalid required fields"];
        }

        try {
            $stmt = $this->db->prepare("UPDATE jeepneys SET plate_number=?, route=?, capacity=?, status=?, driver_id=? WHERE id=?");
            $stmt->execute([
                $sanitizedData['plate_number'],
                $sanitizedData['route'],
                $sanitizedData['capacity'],
                $sanitizedData['status'],
                $sanitizedData['driver_id'],
                $id
            ]);

            if ($stmt->affected_rows > 0) {
                return [
                    "status" => "success",
                    "message" => "Jeepney updated successfully"
                ];
            }
            return [
                "status" => "error",
                "message" => "No jeepney found with that ID"
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to update jeepney: " . $e->getMessage()
            ];
        }
    }

    public function deleteJeepney($id) {
        try {
            $stmt = $this->db->prepare("DELETE FROM jeepneys WHERE id=?");
            $stmt->execute([$id]);

            if ($stmt->affected_rows > 0) {
                return [
                    "status" => "success",
                    "message" => "Jeepney deleted successfully"
                ];
            }
            return [
                "status" => "error",
                "message" => "No jeepney found with that ID"
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to delete jeepney: " . $e->getMessage()
            ];
        }
    }

    public function getAllJeepneys() {
        return $this->getAll(); // Alias to existing method
    }

    public function getJeepneys($page = 1, $limit = 10) {
        try {
            $offset = ($page - 1) * $limit;
            
            // Get total count
            $countStmt = $this->db->prepare("SELECT COUNT(*) as total FROM jeepneys");
            $countStmt->execute();
            $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // Get paginated results with driver information
            $stmt = $this->db->prepare("
                SELECT 
                    j.*,
                    u.first_name,
                    u.last_name,
                    u.phone_number,
                    u.drivers_license_name
                FROM jeepneys j
                LEFT JOIN users u ON j.driver_id = u.id
                ORDER BY j.id DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([$limit, $offset]);
            $jeepneys = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "jeepneys" => $jeepneys,
                "pagination" => [
                    "current_page" => $page,
                    "per_page" => $limit,
                    "total" => $total,
                    "total_pages" => ceil($total / $limit)
                ]
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to fetch jeepneys: " . $e->getMessage()
            ];
        }
    }
}
