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

        // Check if driver is already assigned to another jeepney
        if ($sanitizedData['driver_id']) {
            $existingJeepneyStmt = $this->db->prepare("
                SELECT j.id, j.jeepney_number, u.first_name, u.last_name 
                FROM jeepneys j 
                LEFT JOIN users u ON j.driver_id = u.id 
                WHERE j.driver_id = ? AND j.status = 'active'
            ");
            $existingJeepneyStmt->execute([$sanitizedData['driver_id']]);
            $existingJeepney = $existingJeepneyStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existingJeepney) {
                return [
                    "status" => "error", 
                    "message" => "Driver is already assigned to jeepney '{$existingJeepney['jeepney_number']}'. Please unassign the driver from the current jeepney first.",
                    "conflict_data" => [
                        "existing_jeepney_id" => $existingJeepney['id'],
                        "existing_jeepney_number" => $existingJeepney['jeepney_number'],
                        "driver_name" => $existingJeepney['first_name'] . ' ' . $existingJeepney['last_name']
                    ]
                ];
            }
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
            $checkStmt = $this->db->prepare("SELECT id, driver_id FROM jeepneys WHERE id = ?");
            $checkStmt->execute([$jeepneyId]);
            $existingJeepney = $checkStmt->fetch();
            
            if (!$existingJeepney) {
                return [
                    "status" => "error",
                    "message" => "No jeepney found with that ID"
                ];
            }

            // Check if new driver is already assigned to another jeepney (only if driver is being changed)
            if ($sanitizedData['driver_id'] && $sanitizedData['driver_id'] != $existingJeepney['driver_id']) {
                $conflictStmt = $this->db->prepare("
                    SELECT j.id, j.jeepney_number, u.first_name, u.last_name 
                    FROM jeepneys j 
                    LEFT JOIN users u ON j.driver_id = u.id 
                    WHERE j.driver_id = ? AND j.id != ? AND j.status = 'active'
                ");
                $conflictStmt->execute([$sanitizedData['driver_id'], $jeepneyId]);
                $conflictJeepney = $conflictStmt->fetch(PDO::FETCH_ASSOC);
                
                if ($conflictJeepney) {
                    return [
                        "status" => "error", 
                        "message" => "Driver is already assigned to jeepney '{$conflictJeepney['jeepney_number']}'. Please unassign the driver from the current jeepney first.",
                        "conflict_data" => [
                            "existing_jeepney_id" => $conflictJeepney['id'],
                            "existing_jeepney_number" => $conflictJeepney['jeepney_number'],
                            "driver_name" => $conflictJeepney['first_name'] . ' ' . $conflictJeepney['last_name']
                        ]
                    ];
                }
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

    /**
     * Unassign driver from jeepney
     */
    public function unassignDriver($jeepneyId) {
        try {
            // Check if jeepney exists and has a driver
            $checkStmt = $this->db->prepare("
                SELECT j.id, j.jeepney_number, j.driver_id, u.first_name, u.last_name 
                FROM jeepneys j 
                LEFT JOIN users u ON j.driver_id = u.id 
                WHERE j.id = ?
            ");
            $checkStmt->execute([$jeepneyId]);
            $jeepney = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$jeepney) {
                return [
                    "status" => "error",
                    "message" => "Jeepney not found"
                ];
            }
            
            if (!$jeepney['driver_id']) {
                return [
                    "status" => "error",
                    "message" => "No driver assigned to this jeepney"
                ];
            }
            
            // Unassign the driver
            $updateStmt = $this->db->prepare("UPDATE jeepneys SET driver_id = NULL WHERE id = ?");
            $updateStmt->execute([$jeepneyId]);
            
            return [
                "status" => "success",
                "message" => "Driver unassigned successfully",
                "unassigned_driver" => [
                    "driver_id" => $jeepney['driver_id'],
                    "driver_name" => $jeepney['first_name'] . ' ' . $jeepney['last_name'],
                    "jeepney_number" => $jeepney['jeepney_number']
                ]
            ];
            
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to unassign driver: " . $e->getMessage()
            ];
        }
    }

    /**
     * Reassign driver from one jeepney to another
     */
    public function reassignDriver($fromJeepneyId, $toJeepneyId, $driverId) {
        try {
            // Start transaction
            $this->db->beginTransaction();
            
            // Check if from jeepney exists and has the driver
            $fromStmt = $this->db->prepare("SELECT id, jeepney_number, driver_id FROM jeepneys WHERE id = ?");
            $fromStmt->execute([$fromJeepneyId]);
            $fromJeepney = $fromStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$fromJeepney) {
                $this->db->rollBack();
                return ["status" => "error", "message" => "Source jeepney not found"];
            }
            
            if ($fromJeepney['driver_id'] != $driverId) {
                $this->db->rollBack();
                return ["status" => "error", "message" => "Driver is not assigned to the source jeepney"];
            }
            
            // Check if to jeepney exists and is available
            $toStmt = $this->db->prepare("SELECT id, jeepney_number, driver_id FROM jeepneys WHERE id = ?");
            $toStmt->execute([$toJeepneyId]);
            $toJeepney = $toStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$toJeepney) {
                $this->db->rollBack();
                return ["status" => "error", "message" => "Destination jeepney not found"];
            }
            
            if ($toJeepney['driver_id']) {
                $this->db->rollBack();
                return ["status" => "error", "message" => "Destination jeepney already has a driver assigned"];
            }
            
            // Unassign from source jeepney
            $unassignStmt = $this->db->prepare("UPDATE jeepneys SET driver_id = NULL WHERE id = ?");
            $unassignStmt->execute([$fromJeepneyId]);
            
            // Assign to destination jeepney
            $assignStmt = $this->db->prepare("UPDATE jeepneys SET driver_id = ? WHERE id = ?");
            $assignStmt->execute([$driverId, $toJeepneyId]);
            
            // Commit transaction
            $this->db->commit();
            
            return [
                "status" => "success",
                "message" => "Driver reassigned successfully",
                "reassignment" => [
                    "driver_id" => $driverId,
                    "from_jeepney" => $fromJeepney['jeepney_number'],
                    "to_jeepney" => $toJeepney['jeepney_number']
                ]
            ];
            
        } catch (Exception $e) {
            $this->db->rollBack();
            return [
                "status" => "error",
                "message" => "Failed to reassign driver: " . $e->getMessage()
            ];
        }
    }
}
