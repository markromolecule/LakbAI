<?php
class JeepneyController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getAll() {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    j.*,
                    u.first_name,
                    u.last_name,
                    u.phone_number,
                    r.route_name
                FROM jeepneys j
                LEFT JOIN users u ON j.driver_id = u.id
                LEFT JOIN routes r ON j.route_id = r.id
                ORDER BY j.id DESC
            ");
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
            'jeepney_number' => htmlspecialchars(strip_tags($data['jeepney_number'] ?? '')),
            'plate_number' => htmlspecialchars(strip_tags($data['plate_number'] ?? '')),
            'model' => htmlspecialchars(strip_tags($data['model'] ?? '')),
            'route_id' => isset($data['route_id']) ? intval($data['route_id']) : null,
            'capacity' => intval($data['capacity'] ?? 0),
            'status' => htmlspecialchars(strip_tags($data['status'] ?? 'active')),
            'driver_id' => isset($data['driver_id']) ? intval($data['driver_id']) : null
        ];

        // Validate required fields
        if (empty($sanitizedData['plate_number']) || empty($sanitizedData['route_id']) || $sanitizedData['capacity'] <= 0) {
            return ["status" => "error", "message" => "Missing or invalid required fields"];
        }

        try {
            // Auto-generate jeepney_number if not provided
            if (empty($sanitizedData['jeepney_number'])) {
                $nextStmt = $this->db->query("SELECT LPAD(COALESCE(MAX(id)+1,1),3,'0') AS seq FROM jeepneys");
                $seq = $nextStmt->fetch(PDO::FETCH_ASSOC)['seq'] ?? '001';
                $sanitizedData['jeepney_number'] = 'LKB-' . $seq;
            }

            $stmt = $this->db->prepare("INSERT INTO jeepneys (jeepney_number, plate_number, model, capacity, route_id, status, driver_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $sanitizedData['jeepney_number'],
                $sanitizedData['plate_number'],
                $sanitizedData['model'],
                $sanitizedData['capacity'],
                $sanitizedData['route_id'],
                $sanitizedData['status'],
                $sanitizedData['driver_id']
            ]);

            return [
                "status" => "success",
                "message" => "Jeepney added successfully",
                "jeepney_id" => $this->db->lastInsertId()
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
            $stmt = $this->db->prepare("UPDATE jeepneys SET plate_number=?, route_id=?, capacity=?, status=?, driver_id=? WHERE id=?");
            $stmt->execute([
                $sanitizedData['plate_number'],
                $sanitizedData['route_id'],
                $sanitizedData['capacity'],
                $sanitizedData['status'],
                $sanitizedData['driver_id'],
                $jeepneyId
            ]);

            if ($stmt->rowCount() > 0) {
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
            $stmt = $this->db->prepare("
                SELECT 
                    j.*,
                    u.first_name,
                    u.last_name,
                    u.phone_number,
                    r.route_name
                FROM jeepneys j
                LEFT JOIN users u ON j.driver_id = u.id
                LEFT JOIN routes r ON j.route_id = r.id
                WHERE j.id = ?
            ");
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
            'jeepney_number' => htmlspecialchars(strip_tags($data['jeepney_number'] ?? '')),
            'plate_number' => htmlspecialchars(strip_tags($data['plate_number'] ?? '')),
            'model' => htmlspecialchars(strip_tags($data['model'] ?? '')),
            'route_id' => isset($data['route_id']) ? intval($data['route_id']) : null,
            'capacity' => intval($data['capacity'] ?? 0),
            'status' => htmlspecialchars(strip_tags($data['status'] ?? 'active')),
            'driver_id' => isset($data['driver_id']) ? intval($data['driver_id']) : null
        ];

        // Validate required fields
        if (empty($sanitizedData['plate_number']) || empty($sanitizedData['route_id']) || $sanitizedData['capacity'] <= 0) {
            return ["status" => "error", "message" => "Missing or invalid required fields"];
        }

        try {
            // Auto-generate jeepney_number if not provided
            if (empty($sanitizedData['jeepney_number'])) {
                $nextStmt = $this->db->query("SELECT LPAD(COALESCE(MAX(id)+1,1),3,'0') AS seq FROM jeepneys");
                $seq = $nextStmt->fetch(PDO::FETCH_ASSOC)['seq'] ?? '001';
                $sanitizedData['jeepney_number'] = 'LKB-' . $seq;
            }

            $stmt = $this->db->prepare("INSERT INTO jeepneys (jeepney_number, plate_number, model, capacity, route_id, status, driver_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $sanitizedData['jeepney_number'],
                $sanitizedData['plate_number'],
                $sanitizedData['model'],
                $sanitizedData['capacity'],
                $sanitizedData['route_id'],
                $sanitizedData['status'],
                $sanitizedData['driver_id']
            ]);

            return [
                "status" => "success",
                "message" => "Jeepney added successfully",
                "jeepney_id" => $this->db->lastInsertId()
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to create jeepney: " . $e->getMessage()
            ];
        }
    }

    public function updateJeepney($id, $data) {
        // Ensure ID is an integer
        $jeepneyId = intval($id);
        
        // Sanitize input data
        $sanitizedData = [
            'plate_number' => htmlspecialchars(strip_tags($data['plate_number'] ?? '')),
            'model' => htmlspecialchars(strip_tags($data['model'] ?? '')),
            'route_id' => isset($data['route']) ? intval($data['route']) : null,
            'capacity' => intval($data['capacity'] ?? 0),
            'status' => htmlspecialchars(strip_tags($data['status'] ?? 'active')),
            'driver_id' => isset($data['driver_id']) ? intval($data['driver_id']) : null
        ];

        // Validate required fields
        if (empty($sanitizedData['plate_number']) || $sanitizedData['capacity'] <= 0) {
            return ["status" => "error", "message" => "Missing or invalid required fields"];
        }

        try {
            // First check if jeepney exists
            $checkStmt = $this->db->prepare("SELECT id FROM jeepneys WHERE id = ?");
            $checkStmt->execute([$jeepneyId]);
            $existingJeepney = $checkStmt->fetch();
            
            if (!$existingJeepney) {
                return [
                    "status" => "error",
                    "message" => "No jeepney found with that ID"
                ];
            }
            
            $stmt = $this->db->prepare("UPDATE jeepneys SET plate_number=?, model=?, route_id=?, capacity=?, status=?, driver_id=? WHERE id=?");
            $stmt->execute([
                $sanitizedData['plate_number'],
                $sanitizedData['model'],
                $sanitizedData['route_id'],
                $sanitizedData['capacity'],
                $sanitizedData['status'],
                $sanitizedData['driver_id'],
                $jeepneyId
            ]);

            return [
                "status" => "success",
                "message" => "Jeepney updated successfully"
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

            if ($stmt->rowCount() > 0) {
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
            
            // Get paginated results with driver and route information
            $stmt = $this->db->prepare("
                SELECT 
                    j.*,
                    u.first_name,
                    u.last_name,
                    u.phone_number,
                    r.route_name
                FROM jeepneys j
                LEFT JOIN users u ON j.driver_id = u.id
                LEFT JOIN routes r ON j.route_id = r.id
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
