<?php
class FareMatrixController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Get fare between two checkpoints
     */
    public function getFareBetweenCheckpoints($fromCheckpointId, $toCheckpointId, $routeId = null) {
        try {
            // If route_id is not provided, try to determine it from checkpoints
            if (!$routeId) {
                // First, get all routes that contain both checkpoints
                $stmt = $this->db->prepare("
                    SELECT route_id FROM checkpoints 
                    WHERE id = ? OR id = ?
                    GROUP BY route_id
                    HAVING COUNT(DISTINCT id) = 2
                ");
                $stmt->execute([$fromCheckpointId, $toCheckpointId]);
                $possibleRoutes = $stmt->fetchAll(PDO::FETCH_COLUMN);
                
                if (empty($possibleRoutes)) {
                    return [
                        "status" => "error",
                        "message" => "Checkpoints are not on the same route"
                    ];
                }
                
                // If multiple routes, determine the correct one based on sequence order
                if (count($possibleRoutes) > 1) {
                    $stmt = $this->db->prepare("
                        SELECT route_id FROM checkpoints 
                        WHERE id = ? AND route_id IN (" . implode(',', $possibleRoutes) . ")
                    ");
                    $stmt->execute([$fromCheckpointId]);
                    $fromRoute = $stmt->fetchColumn();
                    
                    $stmt = $this->db->prepare("
                        SELECT route_id FROM checkpoints 
                        WHERE id = ? AND route_id IN (" . implode(',', $possibleRoutes) . ")
                    ");
                    $stmt->execute([$toCheckpointId]);
                    $toRoute = $stmt->fetchColumn();
                    
                    // Use the route where from_checkpoint has lower sequence_order than to_checkpoint
                    $stmt = $this->db->prepare("
                        SELECT c1.route_id 
                        FROM checkpoints c1 
                        JOIN checkpoints c2 ON c1.route_id = c2.route_id
                        WHERE c1.id = ? AND c2.id = ? 
                        AND c1.route_id IN (" . implode(',', $possibleRoutes) . ")
                        AND c1.sequence_order < c2.sequence_order
                        LIMIT 1
                    ");
                    $stmt->execute([$fromCheckpointId, $toCheckpointId]);
                    $routeId = $stmt->fetchColumn();
                    
                    // If no route found with from < to, use the first available route
                    if (!$routeId) {
                        $routeId = $possibleRoutes[0];
                    }
                } else {
                    $routeId = $possibleRoutes[0];
                }
            }

            // Try to get fare from fare_matrix table first
            $stmt = $this->db->prepare("
                SELECT 
                    fm.fare_amount,
                    fm.is_base_fare,
                    c1.checkpoint_name as from_checkpoint,
                    c2.checkpoint_name as to_checkpoint,
                    r.route_name
                FROM fare_matrix fm
                JOIN checkpoints c1 ON fm.from_checkpoint_id = c1.id
                JOIN checkpoints c2 ON fm.to_checkpoint_id = c2.id
                JOIN routes r ON fm.route_id = r.id
                WHERE fm.from_checkpoint_id = ? 
                AND fm.to_checkpoint_id = ? 
                AND fm.route_id = ?
                AND fm.status = 'active'
                AND (fm.expiry_date IS NULL OR fm.expiry_date >= CURRENT_DATE)
                AND fm.effective_date <= CURRENT_DATE
                ORDER BY fm.effective_date DESC
                LIMIT 1
            ");
            $stmt->execute([$fromCheckpointId, $toCheckpointId, $routeId]);
            $fareData = $stmt->fetch(PDO::FETCH_ASSOC);

            // If not found, try reverse direction (symmetric matrix)
            if (!$fareData) {
                $stmt = $this->db->prepare("
                    SELECT 
                        fm.fare_amount,
                        fm.is_base_fare,
                        c1.checkpoint_name as from_checkpoint,
                        c2.checkpoint_name as to_checkpoint,
                        r.route_name
                    FROM fare_matrix fm
                    JOIN checkpoints c1 ON fm.from_checkpoint_id = c1.id
                    JOIN checkpoints c2 ON fm.to_checkpoint_id = c2.id
                    JOIN routes r ON fm.route_id = r.id
                    WHERE fm.from_checkpoint_id = ? 
                    AND fm.to_checkpoint_id = ? 
                    AND fm.route_id = ?
                    AND fm.status = 'active'
                    AND (fm.expiry_date IS NULL OR fm.expiry_date >= CURRENT_DATE)
                    AND fm.effective_date <= CURRENT_DATE
                    ORDER BY fm.effective_date DESC
                    LIMIT 1
                ");
                $stmt->execute([$toCheckpointId, $fromCheckpointId, $routeId]);
                $fareData = $stmt->fetch(PDO::FETCH_ASSOC);
            }

            // If still not found, calculate based on sequence order (distance-based)
            if (!$fareData) {
                $stmt = $this->db->prepare("
                    SELECT 
                        c1.checkpoint_name as from_checkpoint,
                        c2.checkpoint_name as to_checkpoint,
                        r.route_name,
                        ABS(c2.sequence_order - c1.sequence_order) as distance_segments,
                        0 as is_base_fare
                    FROM checkpoints c1
                    JOIN checkpoints c2 ON c1.route_id = c2.route_id
                    JOIN routes r ON c1.route_id = r.id
                    WHERE c1.id = ? AND c2.id = ? AND c1.route_id = ?
                ");
                $stmt->execute([$fromCheckpointId, $toCheckpointId, $routeId]);
                $fareData = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($fareData) {
                    // Calculate fare based on tiered pricing system
                    $fareData['fare_amount'] = $this->calculateTieredFare($fareData['distance_segments']);
                }
            }

            // If still not found, return base fare
            if (!$fareData) {
                return [
                    "status" => "error",
                    "message" => "Unable to calculate fare between checkpoints"
                ];
            }

            return [
                "status" => "success",
                "fare_info" => [
                    "from_checkpoint_id" => $fromCheckpointId,
                    "to_checkpoint_id" => $toCheckpointId,
                    "from_checkpoint" => $fareData['from_checkpoint'],
                    "to_checkpoint" => $fareData['to_checkpoint'],
                    "fare_amount" => floatval($fareData['fare_amount']),
                    "route_name" => $fareData['route_name'],
                    "is_base_fare" => (bool)$fareData['is_base_fare'],
                    "calculation_method" => "dynamic_matrix"
                ]
            ];

        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to calculate fare: " . $e->getMessage()
            ];
        }
    }

    /**
     * Get complete fare matrix for a route
     */
    public function getFareMatrixForRoute($routeId) {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    fm.id,
                    fm.from_checkpoint_id,
                    c1.checkpoint_name as from_checkpoint,
                    fm.to_checkpoint_id,
                    c2.checkpoint_name as to_checkpoint,
                    fm.fare_amount,
                    fm.is_base_fare,
                    fm.effective_date,
                    fm.expiry_date,
                    fm.status
                FROM fare_matrix fm
                JOIN checkpoints c1 ON fm.from_checkpoint_id = c1.id
                JOIN checkpoints c2 ON fm.to_checkpoint_id = c2.id
                WHERE fm.route_id = ?
                AND fm.status = 'active'
                AND (fm.expiry_date IS NULL OR fm.expiry_date >= CURRENT_DATE)
                AND fm.effective_date <= CURRENT_DATE
                ORDER BY c1.sequence_order, c2.sequence_order
            ");
            $stmt->execute([$routeId]);
            $fareMatrix = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get route information
            $routeStmt = $this->db->prepare("SELECT * FROM routes WHERE id = ?");
            $routeStmt->execute([$routeId]);
            $route = $routeStmt->fetch(PDO::FETCH_ASSOC);

            // Get checkpoints for this route
            $checkpointStmt = $this->db->prepare("
                SELECT id, checkpoint_name, sequence_order, fare_from_origin, is_origin, is_destination
                FROM checkpoints 
                WHERE route_id = ? AND status = 'active'
                ORDER BY sequence_order ASC
            ");
            $checkpointStmt->execute([$routeId]);
            $checkpoints = $checkpointStmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "route" => $route,
                "checkpoints" => $checkpoints,
                "fare_matrix" => $fareMatrix,
                "matrix_size" => count($fareMatrix)
            ];

        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to get fare matrix: " . $e->getMessage()
            ];
        }
    }

    /**
     * Get fare matrix for all routes
     */
    public function getAllFareMatrices() {
        try {
            $stmt = $this->db->prepare("
                SELECT DISTINCT r.id, r.route_name, r.origin, r.destination
                FROM routes r
                JOIN fare_matrix fm ON r.id = fm.route_id
                WHERE fm.status = 'active'
                ORDER BY r.route_name
            ");
            $stmt->execute();
            $routes = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $fareMatrices = [];
            foreach ($routes as $route) {
                $matrixData = $this->getFareMatrixForRoute($route['id']);
                if ($matrixData['status'] === 'success') {
                    $fareMatrices[] = $matrixData;
                }
            }

            return [
                "status" => "success",
                "fare_matrices" => $fareMatrices,
                "total_routes" => count($fareMatrices)
            ];

        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to get all fare matrices: " . $e->getMessage()
            ];
        }
    }

    /**
     * Create or update fare matrix entry
     */
    public function createOrUpdateFareEntry($data) {
        try {
            // Sanitize input data
            $sanitizedData = [
                'from_checkpoint_id' => intval($data['from_checkpoint_id'] ?? 0),
                'to_checkpoint_id' => intval($data['to_checkpoint_id'] ?? 0),
                'fare_amount' => floatval($data['fare_amount'] ?? 13.00),
                'route_id' => intval($data['route_id'] ?? 0),
                'is_base_fare' => isset($data['is_base_fare']) ? (int)$data['is_base_fare'] : 0,
                'effective_date' => $data['effective_date'] ?? date('Y-m-d'),
                'expiry_date' => (!empty($data['expiry_date']) && $data['expiry_date'] !== '') ? $data['expiry_date'] : null,
                'status' => htmlspecialchars(strip_tags($data['status'] ?? 'active'))
            ];

            // Validate required fields
            if ($sanitizedData['from_checkpoint_id'] <= 0 || 
                $sanitizedData['to_checkpoint_id'] <= 0 || 
                $sanitizedData['route_id'] <= 0) {
                return ["status" => "error", "message" => "Missing required fields"];
            }

            // Check if entry already exists (find most recent active entry)
            $stmt = $this->db->prepare("
                SELECT id, effective_date FROM fare_matrix 
                WHERE from_checkpoint_id = ? 
                AND to_checkpoint_id = ? 
                AND route_id = ? 
                AND status = 'active'
                AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
                ORDER BY effective_date DESC
                LIMIT 1
            ");
            $stmt->execute([
                $sanitizedData['from_checkpoint_id'],
                $sanitizedData['to_checkpoint_id'],
                $sanitizedData['route_id']
            ]);
            $existingEntry = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($existingEntry) {
                // Check if the fare amount is actually different
                $stmt = $this->db->prepare("
                    SELECT fare_amount FROM fare_matrix WHERE id = ?
                ");
                $stmt->execute([$existingEntry['id']]);
                $currentFare = $stmt->fetchColumn();
                
                if ($currentFare == $sanitizedData['fare_amount']) {
                    // No change needed, just return success
                    return [
                        "status" => "success",
                        "message" => "Fare matrix entry unchanged (both directions)",
                        "fare_matrix_id" => $existingEntry['id']
                    ];
                }
                
                // Update existing entry
                $stmt = $this->db->prepare("
                    UPDATE fare_matrix 
                    SET fare_amount = ?, is_base_fare = ?, expiry_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                ");
                $stmt->execute([
                    $sanitizedData['fare_amount'],
                    $sanitizedData['is_base_fare'],
                    $sanitizedData['expiry_date'],
                    $sanitizedData['status'],
                    $existingEntry['id']
                ]);

                // Update corresponding fare in opposite route
                $this->updateOppositeRouteFare($sanitizedData);

                return [
                    "status" => "success",
                    "message" => "Fare matrix entry updated successfully (both directions)",
                    "fare_matrix_id" => $existingEntry['id']
                ];
            } else {
                // Create new entry
                $stmt = $this->db->prepare("
                    INSERT INTO fare_matrix 
                    (from_checkpoint_id, to_checkpoint_id, fare_amount, route_id, is_base_fare, effective_date, expiry_date, status) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $sanitizedData['from_checkpoint_id'],
                    $sanitizedData['to_checkpoint_id'],
                    $sanitizedData['fare_amount'],
                    $sanitizedData['route_id'],
                    $sanitizedData['is_base_fare'],
                    $sanitizedData['effective_date'],
                    $sanitizedData['expiry_date'],
                    $sanitizedData['status']
                ]);

                $fareMatrixId = $this->db->lastInsertId();

                // Create corresponding fare in opposite route
                $this->createOppositeRouteFare($sanitizedData);

                return [
                    "status" => "success",
                    "message" => "Fare matrix entry created successfully (both directions)",
                    "fare_matrix_id" => $fareMatrixId
                ];
            }

        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to create/update fare entry: " . $e->getMessage()
            ];
        }
    }

    /**
     * Bulk create fare matrix for a route
     */
    public function generateFareMatrixForRoute($routeId, $baseFare = 13.00) {
        try {
            // Get all checkpoints for the route
            $stmt = $this->db->prepare("
                SELECT id, sequence_order FROM checkpoints 
                WHERE route_id = ? AND status = 'active'
                ORDER BY sequence_order ASC
            ");
            $stmt->execute([$routeId]);
            $checkpoints = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($checkpoints)) {
                return [
                    "status" => "error",
                    "message" => "No active checkpoints found for this route"
                ];
            }

            // Clear existing fare matrix for this route
            $deleteStmt = $this->db->prepare("DELETE FROM fare_matrix WHERE route_id = ?");
            $deleteStmt->execute([$routeId]);

            $createdEntries = 0;
            $errors = [];

            // Generate fare matrix (symmetric like LRT-1)
            foreach ($checkpoints as $fromCheckpoint) {
                foreach ($checkpoints as $toCheckpoint) {
                    $fareAmount = $baseFare;
                    
                    if ($fromCheckpoint['sequence_order'] !== $toCheckpoint['sequence_order']) {
                        // Calculate fare based on distance using tiered pricing
                        $distance = abs($toCheckpoint['sequence_order'] - $fromCheckpoint['sequence_order']);
                        $fareAmount = $this->calculateTieredFare($distance);
                    }

                    $isBaseFare = ($fromCheckpoint['sequence_order'] === $toCheckpoint['sequence_order']) ? 1 : 0;

                    try {
                        $stmt = $this->db->prepare("
                            INSERT INTO fare_matrix 
                            (from_checkpoint_id, to_checkpoint_id, fare_amount, route_id, is_base_fare, effective_date) 
                            VALUES (?, ?, ?, ?, ?, CURRENT_DATE)
                        ");
                        $stmt->execute([
                            $fromCheckpoint['id'],
                            $toCheckpoint['id'],
                            $fareAmount,
                            $routeId,
                            $isBaseFare
                        ]);
                        $createdEntries++;
                    } catch (Exception $e) {
                        $errors[] = "Failed to create entry for checkpoint {$fromCheckpoint['id']} to {$toCheckpoint['id']}: " . $e->getMessage();
                    }
                }
            }

            return [
                "status" => "success",
                "message" => "Fare matrix generated successfully",
                "route_id" => $routeId,
                "created_entries" => $createdEntries,
                "total_possible_entries" => count($checkpoints) * count($checkpoints),
                "errors" => $errors
            ];

        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to generate fare matrix: " . $e->getMessage()
            ];
        }
    }

    /**
     * Get fare matrix history for audit trail
     */
    public function getFareMatrixHistory($fareMatrixId = null, $limit = 50) {
        try {
            $sql = "
                SELECT 
                    fmh.*,
                    c1.checkpoint_name as from_checkpoint,
                    c2.checkpoint_name as to_checkpoint,
                    r.route_name
                FROM fare_matrix_history fmh
                JOIN checkpoints c1 ON fmh.from_checkpoint_id = c1.id
                JOIN checkpoints c2 ON fmh.to_checkpoint_id = c2.id
                JOIN routes r ON fmh.route_id = r.id
            ";

            $params = [];
            if ($fareMatrixId) {
                $sql .= " WHERE fmh.fare_matrix_id = ?";
                $params[] = $fareMatrixId;
            }

            $sql .= " ORDER BY fmh.created_at DESC LIMIT ?";
            $params[] = $limit;

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "history" => $history,
                "count" => count($history)
            ];

        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to get fare matrix history: " . $e->getMessage()
            ];
        }
    }

    /**
     * Delete fare matrix entry
     */
    public function deleteFareEntry($fareMatrixId) {
        try {
            $stmt = $this->db->prepare("DELETE FROM fare_matrix WHERE id = ?");
            $stmt->execute([$fareMatrixId]);

            if ($stmt->rowCount() > 0) {
                return [
                    "status" => "success",
                    "message" => "Fare matrix entry deleted successfully"
                ];
            }

            return [
                "status" => "error",
                "message" => "No fare matrix entry found with that ID"
            ];

        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to delete fare entry: " . $e->getMessage()
            ];
        }
    }

    /**
     * Calculate tiered fare based on distance segments
     * Requirements:
     * - Base fare: ₱13.00
     * - SM Epza → Robinson Tejero (1 segment): ₱13.00
     * - SM Epza → Malabon (2 segments): ₱15.00
     * - Lancaster New City → SM Dasmariñas (12 segments): ₱30.00
     * - SM Epza → SM Dasmariñas (16 segments): ₱50.00
     */
    private function calculateTieredFare($distanceSegments) {
        $baseFare = 13.00;
        
        if ($distanceSegments == 0) {
            return $baseFare; // Same checkpoint
        }
        
        // Tiered pricing based on distance
        if ($distanceSegments <= 2) {
            // Short distance: ₱13.00-15.00
            if ($distanceSegments == 1) {
                return 13.00; // SM Epza → Robinson Tejero
            } else {
                return 15.00; // SM Epza → Malabon
            }
        } elseif ($distanceSegments <= 8) {
            // Medium distance: ₱15.00-30.00
            // Linear interpolation between ₱15.00 and ₱30.00
            $minFare = 15.00;
            $maxFare = 30.00;
            $minDistance = 2;
            $maxDistance = 12; // Lancaster New City → SM Dasmariñas
            
            if ($distanceSegments <= $maxDistance) {
                $fare = $minFare + (($distanceSegments - $minDistance) / ($maxDistance - $minDistance)) * ($maxFare - $minFare);
                return round($fare, 2);
            } else {
                return $maxFare;
            }
        } else {
            // Long distance: ₱30.00-50.00
            // Linear interpolation between ₱30.00 and ₱50.00
            $minFare = 30.00;
            $maxFare = 50.00;
            $minDistance = 12;
            $maxDistance = 16; // SM Epza → SM Dasmariñas
            
            $fare = $minFare + (($distanceSegments - $minDistance) / ($maxDistance - $minDistance)) * ($maxFare - $minFare);
            return round($fare, 2);
        }
    }

    /**
     * Clean up duplicate fare matrix entries (keep only the most recent active entry per route pair)
     */
    public function cleanupDuplicateEntries() {
        try {
            // Find and deactivate old entries, keeping only the most recent active entry per route pair
            $stmt = $this->db->prepare("
                UPDATE fare_matrix fm1
                SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
                WHERE fm1.status = 'active'
                AND EXISTS (
                    SELECT 1 FROM fare_matrix fm2
                    WHERE fm2.from_checkpoint_id = fm1.from_checkpoint_id
                    AND fm2.to_checkpoint_id = fm1.to_checkpoint_id
                    AND fm2.route_id = fm1.route_id
                    AND fm2.status = 'active'
                    AND fm2.effective_date > fm1.effective_date
                )
            ");
            $stmt->execute();
            
            $affectedRows = $stmt->rowCount();
            
            return [
                "status" => "success",
                "message" => "Cleaned up $affectedRows duplicate fare matrix entries",
                "affected_rows" => $affectedRows
            ];
            
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to cleanup duplicate entries: " . $e->getMessage()
            ];
        }
    }

    /**
     * Get fare matrix statistics
     */
    public function getFareMatrixStats() {
        try {
            // Total entries
            $stmt = $this->db->prepare("SELECT COUNT(*) as total_entries FROM fare_matrix WHERE status = 'active'");
            $stmt->execute();
            $totalEntries = $stmt->fetchColumn();

            // Entries by route
            $stmt = $this->db->prepare("
                SELECT 
                    r.route_name,
                    COUNT(fm.id) as entry_count,
                    MIN(fm.fare_amount) as min_fare,
                    MAX(fm.fare_amount) as max_fare,
                    AVG(fm.fare_amount) as avg_fare
                FROM fare_matrix fm
                JOIN routes r ON fm.route_id = r.id
                WHERE fm.status = 'active'
                GROUP BY r.id, r.route_name
            ");
            $stmt->execute();
            $routeStats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Base fare entries
            $stmt = $this->db->prepare("SELECT COUNT(*) as base_fare_count FROM fare_matrix WHERE is_base_fare = 1 AND status = 'active'");
            $stmt->execute();
            $baseFareCount = $stmt->fetchColumn();

            return [
                "status" => "success",
                "stats" => [
                    "total_entries" => $totalEntries,
                    "base_fare_entries" => $baseFareCount,
                    "route_statistics" => $routeStats
                ]
            ];

        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to get fare matrix statistics: " . $e->getMessage()
            ];
        }
    }

    /**
     * Update corresponding fare in opposite route
     */
    private function updateOppositeRouteFare($data) {
        try {
            // Get opposite route ID (1 <-> 2)
            $oppositeRouteId = ($data['route_id'] == 1) ? 2 : 1;
            
            // Get checkpoint names for current route
            $stmt = $this->db->prepare("
                SELECT checkpoint_name FROM checkpoints WHERE id = ?
            ");
            $stmt->execute([$data['from_checkpoint_id']]);
            $fromCheckpointName = $stmt->fetchColumn();
            
            $stmt->execute([$data['to_checkpoint_id']]);
            $toCheckpointName = $stmt->fetchColumn();
            
            // Debug: Log checkpoint names
            error_log("DEBUG: Updating opposite route. From: $fromCheckpointName, To: $toCheckpointName, Route: {$data['route_id']} -> $oppositeRouteId");
            
            // Find corresponding checkpoint IDs in opposite route
            $stmt = $this->db->prepare("
                SELECT id FROM checkpoints 
                WHERE route_id = ? AND checkpoint_name = ?
            ");
            $stmt->execute([$oppositeRouteId, $toCheckpointName]);
            $oppositeFromCheckpointId = $stmt->fetchColumn();
            
            $stmt->execute([$oppositeRouteId, $fromCheckpointName]);
            $oppositeToCheckpointId = $stmt->fetchColumn();
            
            // Debug: Log found checkpoint IDs
            error_log("DEBUG: Found opposite checkpoints. From: $oppositeFromCheckpointId, To: $oppositeToCheckpointId");
            
            if ($oppositeFromCheckpointId && $oppositeToCheckpointId) {
                // Update or create fare in opposite route (find most recent active entry)
                $stmt = $this->db->prepare("
                    SELECT id, effective_date FROM fare_matrix 
                    WHERE from_checkpoint_id = ? 
                    AND to_checkpoint_id = ? 
                    AND route_id = ? 
                    AND status = 'active'
                    AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
                    ORDER BY effective_date DESC
                    LIMIT 1
                ");
                $stmt->execute([
                    $oppositeFromCheckpointId,
                    $oppositeToCheckpointId,
                    $oppositeRouteId
                ]);
                $existingOppositeEntry = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($existingOppositeEntry) {
                    // Update existing opposite entry
                    $stmt = $this->db->prepare("
                        UPDATE fare_matrix 
                        SET fare_amount = ?, is_base_fare = ?, expiry_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    ");
                    $stmt->execute([
                        $data['fare_amount'],
                        $data['is_base_fare'],
                        $data['expiry_date'],
                        $data['status'],
                        $existingOppositeEntry['id']
                    ]);
                } else {
                    // Create new opposite entry
                    $stmt = $this->db->prepare("
                        INSERT INTO fare_matrix 
                        (from_checkpoint_id, to_checkpoint_id, fare_amount, route_id, is_base_fare, effective_date, expiry_date, status) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ");
                    $stmt->execute([
                        $oppositeFromCheckpointId,
                        $oppositeToCheckpointId,
                        $data['fare_amount'],
                        $oppositeRouteId,
                        $data['is_base_fare'],
                        $data['effective_date'],
                        $data['expiry_date'],
                        $data['status']
                    ]);
                }
            }
        } catch (Exception $e) {
            // Log error but don't fail the main operation
            error_log("Failed to update opposite route fare: " . $e->getMessage());
        }
    }

    /**
     * Create corresponding fare in opposite route
     */
    private function createOppositeRouteFare($data) {
        try {
            // Get opposite route ID (1 <-> 2)
            $oppositeRouteId = ($data['route_id'] == 1) ? 2 : 1;
            
            // Get checkpoint names for current route
            $stmt = $this->db->prepare("
                SELECT checkpoint_name FROM checkpoints WHERE id = ?
            ");
            $stmt->execute([$data['from_checkpoint_id']]);
            $fromCheckpointName = $stmt->fetchColumn();
            
            $stmt->execute([$data['to_checkpoint_id']]);
            $toCheckpointName = $stmt->fetchColumn();
            
            // Find corresponding checkpoint IDs in opposite route
            $stmt = $this->db->prepare("
                SELECT id FROM checkpoints 
                WHERE route_id = ? AND checkpoint_name = ?
            ");
            $stmt->execute([$oppositeRouteId, $toCheckpointName]);
            $oppositeFromCheckpointId = $stmt->fetchColumn();
            
            $stmt->execute([$oppositeRouteId, $fromCheckpointName]);
            $oppositeToCheckpointId = $stmt->fetchColumn();
            
            if ($oppositeFromCheckpointId && $oppositeToCheckpointId) {
                // Check if opposite entry already exists (find most recent active entry)
                $stmt = $this->db->prepare("
                    SELECT id, effective_date FROM fare_matrix 
                    WHERE from_checkpoint_id = ? 
                    AND to_checkpoint_id = ? 
                    AND route_id = ? 
                    AND status = 'active'
                    AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
                    ORDER BY effective_date DESC
                    LIMIT 1
                ");
                $stmt->execute([
                    $oppositeFromCheckpointId,
                    $oppositeToCheckpointId,
                    $oppositeRouteId
                ]);
                $existingOppositeEntry = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$existingOppositeEntry) {
                    // Create new opposite entry
                    $stmt = $this->db->prepare("
                        INSERT INTO fare_matrix 
                        (from_checkpoint_id, to_checkpoint_id, fare_amount, route_id, is_base_fare, effective_date, expiry_date, status) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ");
                    $stmt->execute([
                        $oppositeFromCheckpointId,
                        $oppositeToCheckpointId,
                        $data['fare_amount'],
                        $oppositeRouteId,
                        $data['is_base_fare'],
                        $data['effective_date'],
                        $data['expiry_date'],
                        $data['status']
                    ]);
                }
            }
        } catch (Exception $e) {
            // Log error but don't fail the main operation
            error_log("Failed to create opposite route fare: " . $e->getMessage());
        }
    }
}
?>
