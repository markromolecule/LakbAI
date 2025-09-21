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

    /**
     * Generate QR code data for a checkpoint
     */
    public function generateCheckpointQR($checkpointId, $routeId) {
        try {
            // Get checkpoint and route data
            $stmt = $this->db->prepare("
                SELECT 
                    c.*,
                    r.route_name,
                    r.origin,
                    r.destination
                FROM checkpoints c
                JOIN routes r ON c.route_id = r.id
                WHERE c.id = ? AND c.route_id = ? AND c.status = 'active'
            ");
            $stmt->execute([$checkpointId, $routeId]);
            $checkpoint = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$checkpoint) {
                return [
                    "status" => "error",
                    "message" => "Checkpoint not found or inactive"
                ];
            }

            // Generate QR data with checkpoint and route information
            $qrData = [
                "type" => "route_checkpoint",
                "qrType" => "driver_scan",
                "checkpointId" => (string)$checkpoint['id'],
                "checkpointName" => $checkpoint['checkpoint_name'],
                "checkpointType" => $checkpoint['is_origin'] ? 'start' : ($checkpoint['is_destination'] ? 'end' : 'checkpoint'),
                "coordinates" => [
                    "latitude" => 0, // Default coordinates, can be updated later
                    "longitude" => 0
                ],
                "jeepneyNumber" => "", // Will be filled when driver scans
                "route" => $checkpoint['route_name'],
                "timestamp" => date('c'), // ISO 8601 format
                "adminId" => "system", // System generated
                "purpose" => "Driver location tracking and passenger notification",
                // Legacy fields for backward compatibility
                "checkpoint_id" => $checkpoint['id'],
                "checkpoint_name" => $checkpoint['checkpoint_name'],
                "route_id" => $checkpoint['route_id'],
                "route_name" => $checkpoint['route_name'],
                "sequence_order" => $checkpoint['sequence_order'],
                "fare_from_origin" => $checkpoint['fare_from_origin'],
                "is_origin" => (bool)$checkpoint['is_origin'],
                "is_destination" => (bool)$checkpoint['is_destination'],
                "generated_at" => date('c'),
                "expires_at" => date('c', strtotime('+30 days'))
            ];

            return [
                "status" => "success",
                "qr_data" => $qrData,
                "qr_string" => json_encode($qrData),
                "qr_url" => "https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&data=" . urlencode(json_encode($qrData))
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to generate QR code: " . $e->getMessage()
            ];
        }
    }

    /**
     * Bulk generate QR codes for all checkpoints of a route
     */
    public function generateRouteQRCodes($routeId) {
        try {
            // Get all active checkpoints for the route
            $stmt = $this->db->prepare("
                SELECT 
                    c.*,
                    r.route_name,
                    r.origin,
                    r.destination
                FROM checkpoints c
                JOIN routes r ON c.route_id = r.id
                WHERE c.route_id = ? AND c.status = 'active'
                ORDER BY c.sequence_order ASC
            ");
            $stmt->execute([$routeId]);
            $checkpoints = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($checkpoints)) {
                return [
                    "status" => "error",
                    "message" => "No active checkpoints found for this route"
                ];
            }

            $qrCodes = [];
            foreach ($checkpoints as $checkpoint) {
                $qrData = [
                    "type" => "route_checkpoint",
                    "checkpoint_id" => $checkpoint['id'],
                    "checkpoint_name" => $checkpoint['checkpoint_name'],
                    "route_id" => $checkpoint['route_id'],
                    "route_name" => $checkpoint['route_name'],
                    "sequence_order" => $checkpoint['sequence_order'],
                    "fare_from_origin" => $checkpoint['fare_from_origin'],
                    "is_origin" => (bool)$checkpoint['is_origin'],
                    "is_destination" => (bool)$checkpoint['is_destination'],
                    "coordinates" => [
                        "lat" => null,
                        "lng" => null
                    ],
                    "generated_at" => date('c'),
                    "expires_at" => date('c', strtotime('+30 days'))
                ];

                $qrCodes[] = [
                    "checkpoint" => $checkpoint,
                    "qr_data" => $qrData,
                    "qr_string" => json_encode($qrData),
                    "qr_url" => "https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&data=" . urlencode(json_encode($qrData))
                ];
            }

            return [
                "status" => "success",
                "route_name" => $checkpoints[0]['route_name'],
                "checkpoint_count" => count($qrCodes),
                "qr_codes" => $qrCodes
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to generate route QR codes: " . $e->getMessage()
            ];
        }
    }

    /**
     * Process driver checkpoint scan and update location
     */
    public function processDriverScan($driverId, $checkpointQrData, $scanTimestamp = null) {
        try {
            $scanTime = $scanTimestamp ?: date('Y-m-d H:i:s');

            // Validate QR data
            if (!isset($checkpointQrData['checkpoint_id']) || !isset($checkpointQrData['route_id'])) {
                return [
                    "status" => "error",
                    "message" => "Invalid QR code data"
                ];
            }

            // Verify checkpoint exists and is active
            $stmt = $this->db->prepare("
                SELECT 
                    c.*,
                    r.route_name,
                    r.origin,
                    r.destination
                FROM checkpoints c
                JOIN routes r ON c.route_id = r.id
                WHERE c.id = ? AND c.route_id = ? AND c.status = 'active'
            ");
            $stmt->execute([$checkpointQrData['checkpoint_id'], $checkpointQrData['route_id']]);
            $checkpoint = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$checkpoint) {
                return [
                    "status" => "error",
                    "message" => "Invalid or inactive checkpoint"
                ];
            }

            // Verify driver exists and get driver info
            $stmt = $this->db->prepare("
                SELECT 
                    u.id,
                    u.first_name,
                    u.last_name,
                    j.jeepney_number,
                    j.plate_number,
                    j.route_id as assigned_route_id,
                    r.route_name as assigned_route_name
                FROM users u
                LEFT JOIN jeepneys j ON u.id = j.driver_id
                LEFT JOIN routes r ON j.route_id = r.id
                WHERE u.id = ? AND u.user_type = 'driver'
            ");
            $stmt->execute([$driverId]);
            $driver = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$driver) {
                return [
                    "status" => "error",
                    "message" => "Driver not found"
                ];
            }

            // Check if driver is assigned to the correct route
            if ($driver['assigned_route_id'] && $driver['assigned_route_id'] != $checkpointQrData['route_id']) {
                return [
                    "status" => "warning",
                    "message" => "Warning: You are scanning a checkpoint on route '{$checkpoint['route_name']}' but you are assigned to route '{$driver['assigned_route_name']}'"
                ];
            }

            // Update driver's current location in the drivers table
            $stmt = $this->db->prepare("
                UPDATE drivers 
                SET current_location = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            ");
            $stmt->execute([$checkpoint['checkpoint_name'], $driverId]);

            // Log the scan event for tracking and analytics
            $this->logCheckpointScan($driverId, $checkpoint, $scanTime);

            // Calculate estimated arrival times for passengers
            $arrivalEstimate = $this->calculateArrivalEstimate($checkpoint);

            // Notify passengers about driver location update using the notification service
            $this->notifyPassengersWithService($driver, $checkpoint, $arrivalEstimate);

            return [
                "status" => "success",
                "message" => "Location updated successfully",
                "data" => [
                    "driver" => [
                        "id" => $driver['id'],
                        "name" => $driver['first_name'] . ' ' . $driver['last_name'],
                        "jeepney_number" => $driver['jeepney_number']
                    ],
                    "checkpoint" => [
                        "id" => $checkpoint['id'],
                        "name" => $checkpoint['checkpoint_name'],
                        "route" => $checkpoint['route_name'],
                        "sequence_order" => $checkpoint['sequence_order']
                    ],
                    "arrival_estimate" => $arrivalEstimate,
                    "scan_timestamp" => $scanTime
                ]
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to process driver scan: " . $e->getMessage()
            ];
        }
    }

    /**
     * Log checkpoint scan for analytics and tracking
     */
    private function logCheckpointScan($driverId, $checkpoint, $scanTime) {
        try {
            // Create checkpoint_scans table if it doesn't exist
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS `checkpoint_scans` (
                    `id` INT(11) NOT NULL AUTO_INCREMENT,
                    `driver_id` INT(11) NOT NULL,
                    `checkpoint_id` INT(11) NOT NULL,
                    `route_id` INT(11) NOT NULL,
                    `checkpoint_name` VARCHAR(100) NOT NULL,
                    `scan_timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (`id`),
                    INDEX `idx_driver_id` (`driver_id`),
                    INDEX `idx_checkpoint_id` (`checkpoint_id`),
                    INDEX `idx_scan_timestamp` (`scan_timestamp`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            $stmt = $this->db->prepare("
                INSERT INTO checkpoint_scans 
                (driver_id, checkpoint_id, route_id, checkpoint_name, scan_timestamp) 
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $driverId,
                $checkpoint['id'],
                $checkpoint['route_id'],
                $checkpoint['checkpoint_name'],
                $scanTime
            ]);

            // Also update driver_location_updates table for real-time monitoring
            $this->updateDriverLocationForMonitoring($driverId, $checkpoint, $scanTime);
        } catch (Exception $e) {
            // Log error but don't fail the main operation
            error_log("Failed to log checkpoint scan: " . $e->getMessage());
        }
    }

    /**
     * Update driver location for real-time monitoring
     */
    private function updateDriverLocationForMonitoring($driverId, $checkpoint, $scanTime) {
        try {
            // Create driver_location_updates table if it doesn't exist
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS `driver_location_updates` (
                    `id` INT(11) NOT NULL AUTO_INCREMENT,
                    `driver_id` INT(11) NOT NULL,
                    `checkpoint_name` VARCHAR(100) NOT NULL,
                    `estimated_arrival` VARCHAR(50) DEFAULT '5-7 mins',
                    `update_timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (`id`),
                    INDEX `idx_driver_id` (`driver_id`),
                    INDEX `idx_update_timestamp` (`update_timestamp`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            // Insert or update driver location
            $stmt = $this->db->prepare("
                INSERT INTO driver_location_updates 
                (driver_id, checkpoint_name, estimated_arrival, update_timestamp) 
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                checkpoint_name = VALUES(checkpoint_name),
                estimated_arrival = VALUES(estimated_arrival),
                update_timestamp = VALUES(update_timestamp)
            ");
            $stmt->execute([
                $driverId,
                $checkpoint['checkpoint_name'],
                '5-7 mins',
                $scanTime
            ]);
        } catch (Exception $e) {
            // Log error but don't fail the main operation
            error_log("Failed to update driver location for monitoring: " . $e->getMessage());
        }
    }

    /**
     * Calculate estimated arrival time for next checkpoints
     */
    private function calculateArrivalEstimate($currentCheckpoint) {
        // Simple estimation based on sequence order
        // In a real implementation, this would consider traffic, distance, etc.
        $baseTimePerCheckpoint = 3; // minutes per checkpoint
        $variationRange = 2; // ±2 minutes variation

        return [
            "next_checkpoint_eta" => "5-7 mins",
            "base_time" => $baseTimePerCheckpoint,
            "estimated_range" => [
                "min" => $baseTimePerCheckpoint - $variationRange,
                "max" => $baseTimePerCheckpoint + $variationRange
            ]
        ];
    }

    /**
     * Notify passengers about driver location update using the notification service
     */
    private function notifyPassengersWithService($driver, $checkpoint, $arrivalEstimate) {
        try {
            // Create driver_location_updates table if it doesn't exist (for backward compatibility)
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS `driver_location_updates` (
                    `id` INT(11) NOT NULL AUTO_INCREMENT,
                    `driver_id` INT(11) NOT NULL,
                    `driver_name` VARCHAR(200) NOT NULL,
                    `jeepney_number` VARCHAR(50),
                    `checkpoint_id` INT(11) NOT NULL,
                    `checkpoint_name` VARCHAR(100) NOT NULL,
                    `route_id` INT(11) NOT NULL,
                    `estimated_arrival` VARCHAR(50),
                    `update_timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    `notification_sent` TINYINT(1) DEFAULT 0,
                    PRIMARY KEY (`id`),
                    INDEX `idx_driver_id` (`driver_id`),
                    INDEX `idx_route_id` (`route_id`),
                    INDEX `idx_update_timestamp` (`update_timestamp`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            // Insert location update record for backward compatibility
            $stmt = $this->db->prepare("
                INSERT INTO driver_location_updates 
                (driver_id, driver_name, jeepney_number, checkpoint_id, checkpoint_name, route_id, estimated_arrival) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $driver['id'],
                $driver['first_name'] . ' ' . $driver['last_name'],
                $driver['jeepney_number'],
                $checkpoint['id'],
                $checkpoint['checkpoint_name'],
                $checkpoint['route_id'],
                $arrivalEstimate['next_checkpoint_eta']
            ]);

            // Use the new notification service for real-time notifications
            $notificationController = new NotificationController($this->db);
            
            $driverData = [
                'driver_id' => $driver['id'],
                'driver_name' => $driver['first_name'] . ' ' . $driver['last_name'],
                'jeepney_number' => $driver['jeepney_number']
            ];

            $checkpointData = [
                'checkpoint_id' => $checkpoint['id'],
                'checkpoint_name' => $checkpoint['checkpoint_name'],
                'route_id' => $checkpoint['route_id'],
                'route_name' => $checkpoint['route_name']
            ];

            $notificationResult = $notificationController->sendArrivalNotification($driverData, $checkpointData, $arrivalEstimate);
            
            // Log notification result
            error_log("NOTIFICATION SERVICE: " . json_encode($notificationResult));

        } catch (Exception $e) {
            error_log("Failed to notify passengers via service: " . $e->getMessage());
            // Fallback to simple logging
            error_log("FALLBACK NOTIFICATION: Driver {$driver['jeepney_number']} is now at {$checkpoint['checkpoint_name']}. Next jeep arrival: {$arrivalEstimate['next_checkpoint_eta']}");
        }
    }

    /**
     * Legacy notification method (kept for backward compatibility)
     */
    private function notifyPassengers($driver, $checkpoint, $arrivalEstimate) {
        $this->notifyPassengersWithService($driver, $checkpoint, $arrivalEstimate);
    }

    /**
     * Get real-time driver locations for a specific route
     */
    public function getDriverLocationsForRoute($routeId) {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    u.id as driver_id,
                    CONCAT(u.first_name, ' ', u.last_name) as driver_name,
                    j.jeepney_number,
                    j.plate_number,
                    u.shift_status,
                    dlu.checkpoint_name as last_scanned_checkpoint,
                    dlu.estimated_arrival,
                    dlu.update_timestamp as last_update,
                    TIMESTAMPDIFF(MINUTE, dlu.update_timestamp, NOW()) as minutes_since_update
                FROM users u
                JOIN jeepneys j ON u.id = j.driver_id
                LEFT JOIN (
                    SELECT 
                        driver_id,
                        checkpoint_name,
                        estimated_arrival,
                        update_timestamp,
                        ROW_NUMBER() OVER (PARTITION BY driver_id ORDER BY update_timestamp DESC) as rn
                    FROM driver_location_updates
                ) dlu ON u.id = dlu.driver_id AND dlu.rn = 1
                WHERE j.route_id = ? AND u.user_type = 'driver' AND j.status = 'active'
                ORDER BY dlu.update_timestamp DESC
            ");
            $stmt->execute([$routeId]);
            $locations = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Add status information
            foreach ($locations as &$location) {
                $minutesSinceUpdate = $location['minutes_since_update'];
                $shiftStatus = $location['shift_status'];
                
                // If driver is off shift, they are inactive regardless of location update time
                if ($shiftStatus === 'off_shift') {
                    $location['status'] = 'inactive';
                    $location['status_message'] = 'Driver is off shift';
                } elseif ($shiftStatus === 'on_shift') {
                    // Driver is on shift - check location update recency
                    if ($minutesSinceUpdate === null) {
                        $location['status'] = 'no_data';
                        $location['status_message'] = 'No location data available';
                    } elseif ($minutesSinceUpdate <= 5) {
                        $location['status'] = 'active';
                        $location['status_message'] = 'Recently updated';
                    } elseif ($minutesSinceUpdate <= 15) {
                        $location['status'] = 'stale';
                        $location['status_message'] = 'Location may be outdated';
                    } else {
                        $location['status'] = 'inactive';
                        $location['status_message'] = 'Driver may be offline';
                    }
                } else {
                    // Default case - driver not on shift
                    $location['status'] = 'inactive';
                    $location['status_message'] = 'Driver is not on shift';
                }
            }

            return [
                "status" => "success",
                "route_id" => $routeId,
                "active_drivers" => count($locations),
                "driver_locations" => $locations
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to get driver locations: " . $e->getMessage()
            ];
        }
    }
}
?>
