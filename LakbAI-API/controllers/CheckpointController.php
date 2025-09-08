<?php
class CheckpointController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Get all checkpoints for a specific route
     */
    public function getCheckpointsByRoute($routeId) {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    c.*,
                    r.route_name
                FROM checkpoints c
                JOIN routes r ON c.route_id = r.id
                WHERE c.route_id = ? AND c.status = 'active'
                ORDER BY c.sequence_order ASC
            ");
            $stmt->execute([$routeId]);
            $checkpoints = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "checkpoints" => $checkpoints,
                "count" => count($checkpoints)
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to fetch checkpoints: " . $e->getMessage()
            ];
        }
    }

    /**
     * Get all checkpoints
     */
    public function getAllCheckpoints() {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    c.*,
                    r.route_name
                FROM checkpoints c
                JOIN routes r ON c.route_id = r.id
                WHERE c.status = 'active'
                ORDER BY r.route_name, c.sequence_order ASC
            ");
            $stmt->execute();
            $checkpoints = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "checkpoints" => $checkpoints,
                "count" => count($checkpoints)
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to fetch checkpoints: " . $e->getMessage()
            ];
        }
    }

    /**
     * Get checkpoint by ID
     */
    public function getCheckpointById($id) {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    c.*,
                    r.route_name
                FROM checkpoints c
                JOIN routes r ON c.route_id = r.id
                WHERE c.id = ?
            ");
            $stmt->execute([$id]);
            $checkpoint = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($checkpoint) {
                return [
                    "status" => "success",
                    "checkpoint" => $checkpoint
                ];
            }

            return [
                "status" => "error",
                "message" => "Checkpoint not found"
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to get checkpoint: " . $e->getMessage()
            ];
        }
    }

    /**
     * Create new checkpoint
     */
    public function createCheckpoint($data) {
        // Sanitize input data
        $sanitizedData = [
            'route_id' => intval($data['route_id'] ?? 0),
            'checkpoint_name' => htmlspecialchars(strip_tags($data['checkpoint_name'] ?? '')),
            'sequence_order' => intval($data['sequence_order'] ?? 0),
            'fare_from_origin' => floatval($data['fare_from_origin'] ?? 8.00),
            'is_origin' => isset($data['is_origin']) ? (int)$data['is_origin'] : 0,
            'is_destination' => isset($data['is_destination']) ? (int)$data['is_destination'] : 0,
            'status' => htmlspecialchars(strip_tags($data['status'] ?? 'active'))
        ];

        // Validate required fields
        if (empty($sanitizedData['checkpoint_name']) || $sanitizedData['route_id'] <= 0) {
            return ["status" => "error", "message" => "Missing required fields"];
        }

        try {
            $stmt = $this->db->prepare("
                INSERT INTO checkpoints 
                (route_id, checkpoint_name, sequence_order, fare_from_origin, is_origin, is_destination, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $sanitizedData['route_id'],
                $sanitizedData['checkpoint_name'],
                $sanitizedData['sequence_order'],
                $sanitizedData['fare_from_origin'],
                $sanitizedData['is_origin'],
                $sanitizedData['is_destination'],
                $sanitizedData['status']
            ]);

            return [
                "status" => "success",
                "message" => "Checkpoint created successfully",
                "checkpoint_id" => $this->db->lastInsertId()
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to create checkpoint: " . $e->getMessage()
            ];
        }
    }

    /**
     * Update checkpoint
     */
    public function updateCheckpoint($id, $data) {
        // Sanitize input data
        $sanitizedData = [
            'checkpoint_name' => htmlspecialchars(strip_tags($data['checkpoint_name'] ?? '')),
            'sequence_order' => intval($data['sequence_order'] ?? 0),
            'fare_from_origin' => floatval($data['fare_from_origin'] ?? 8.00),
            'is_origin' => isset($data['is_origin']) ? (int)$data['is_origin'] : 0,
            'is_destination' => isset($data['is_destination']) ? (int)$data['is_destination'] : 0,
            'status' => htmlspecialchars(strip_tags($data['status'] ?? 'active'))
        ];

        // Validate required fields
        if (empty($sanitizedData['checkpoint_name'])) {
            return ["status" => "error", "message" => "Missing required fields"];
        }

        try {
            $stmt = $this->db->prepare("
                UPDATE checkpoints 
                SET checkpoint_name=?, sequence_order=?, fare_from_origin=?, is_origin=?, is_destination=?, status=?
                WHERE id=?
            ");
            $stmt->execute([
                $sanitizedData['checkpoint_name'],
                $sanitizedData['sequence_order'],
                $sanitizedData['fare_from_origin'],
                $sanitizedData['is_origin'],
                $sanitizedData['is_destination'],
                $sanitizedData['status'],
                $id
            ]);

            if ($stmt->rowCount() > 0) {
                return [
                    "status" => "success",
                    "message" => "Checkpoint updated successfully"
                ];
            }
            return [
                "status" => "error",
                "message" => "No checkpoint found with that ID"
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to update checkpoint: " . $e->getMessage()
            ];
        }
    }

    /**
     * Delete checkpoint
     */
    public function deleteCheckpoint($id) {
        try {
            $stmt = $this->db->prepare("DELETE FROM checkpoints WHERE id=?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() > 0) {
                return [
                    "status" => "success",
                    "message" => "Checkpoint deleted successfully"
                ];
            }
            return [
                "status" => "error",
                "message" => "No checkpoint found with that ID"
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to delete checkpoint: " . $e->getMessage()
            ];
        }
    }

    /**
     * Get fare between two checkpoints
     */
    public function getFareBetweenCheckpoints($fromCheckpointId, $toCheckpointId) {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    c1.checkpoint_name as from_checkpoint,
                    c2.checkpoint_name as to_checkpoint,
                    ABS(c2.fare_from_origin - c1.fare_from_origin) as fare
                FROM checkpoints c1
                JOIN checkpoints c2 ON c1.route_id = c2.route_id
                WHERE c1.id = ? AND c2.id = ?
            ");
            $stmt->execute([$fromCheckpointId, $toCheckpointId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($result) {
                return [
                    "status" => "success",
                    "fare_info" => $result
                ];
            }

            return [
                "status" => "error",
                "message" => "Checkpoints not found or not on same route"
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to calculate fare: " . $e->getMessage()
            ];
        }
    }
}
?>
