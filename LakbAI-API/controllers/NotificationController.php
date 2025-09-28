<?php
class NotificationController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Create real-time notification tables if they don't exist
     */
    private function createNotificationTables() {
        try {
            // Create passenger subscriptions table
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS `passenger_route_subscriptions` (
                    `id` INT(11) NOT NULL AUTO_INCREMENT,
                    `passenger_id` INT(11) NOT NULL,
                    `route_id` INT(11) NOT NULL,
                    `checkpoint_id` INT(11) DEFAULT NULL,
                    `notification_preference` ENUM('all', 'arrival_only', 'departure_only') DEFAULT 'all',
                    `is_active` TINYINT(1) DEFAULT 1,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (`id`),
                    UNIQUE KEY `uk_passenger_route` (`passenger_id`, `route_id`),
                    INDEX `idx_route_id` (`route_id`),
                    INDEX `idx_checkpoint_id` (`checkpoint_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            // Create notification queue table
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS `notification_queue` (
                    `id` INT(11) NOT NULL AUTO_INCREMENT,
                    `recipient_id` INT(11) NOT NULL,
                    `recipient_type` ENUM('passenger', 'driver', 'admin') NOT NULL,
                    `notification_type` ENUM('arrival_estimate', 'location_update', 'route_change', 'emergency') NOT NULL,
                    `title` VARCHAR(200) NOT NULL,
                    `message` TEXT NOT NULL,
                    `data` JSON DEFAULT NULL,
                    `priority` ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
                    `sent_at` TIMESTAMP NULL DEFAULT NULL,
                    `read_at` TIMESTAMP NULL DEFAULT NULL,
                    `expires_at` TIMESTAMP NULL DEFAULT NULL,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (`id`),
                    INDEX `idx_recipient` (`recipient_id`, `recipient_type`),
                    INDEX `idx_sent_at` (`sent_at`),
                    INDEX `idx_notification_type` (`notification_type`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            // Create driver status tracking table
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS `driver_status_tracking` (
                    `id` INT(11) NOT NULL AUTO_INCREMENT,
                    `driver_id` INT(11) NOT NULL,
                    `jeepney_id` INT(11) DEFAULT NULL,
                    `route_id` INT(11) DEFAULT NULL,
                    `current_checkpoint_id` INT(11) DEFAULT NULL,
                    `current_checkpoint_name` VARCHAR(100),
                    `last_scan_timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    `next_checkpoint_eta` VARCHAR(50),
                    `passenger_count` INT(3) DEFAULT 0,
                    `status` ENUM('offline', 'available', 'in_transit', 'at_checkpoint', 'full') DEFAULT 'offline',
                    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (`id`),
                    UNIQUE KEY `uk_driver_status` (`driver_id`),
                    INDEX `idx_route_id` (`route_id`),
                    INDEX `idx_current_checkpoint` (`current_checkpoint_id`),
                    INDEX `idx_last_scan` (`last_scan_timestamp`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            return true;
        } catch (Exception $e) {
            error_log("Failed to create notification tables: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send arrival estimate notification to passengers
     */
    public function sendArrivalNotification($driverData, $checkpointData, $arrivalEstimate) {
        try {
            $this->createNotificationTables();

            // Update driver status
            $this->updateDriverStatus($driverData, $checkpointData, $arrivalEstimate);

            // Get all passengers subscribed to this route
            $stmt = $this->db->prepare("
                SELECT DISTINCT 
                    u.id as passenger_id,
                    u.first_name,
                    u.last_name,
                    u.email,
                    prs.notification_preference,
                    prs.checkpoint_id as preferred_checkpoint
                FROM passenger_route_subscriptions prs
                JOIN users u ON prs.passenger_id = u.id
                WHERE prs.route_id = ? AND prs.is_active = 1 AND u.user_type = 'passenger'
            ");
            $stmt->execute([$checkpointData['route_id']]);
            $passengers = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $notificationCount = 0;
            foreach ($passengers as $passenger) {
                // Create notification message
                $title = "Jeepney Update - {$driverData['jeepney_number']}";
                $message = "Driver {$driverData['driver_name']} is now at {$checkpointData['checkpoint_name']}. " .
                          "Estimated arrival at next checkpoint: {$arrivalEstimate['next_checkpoint_eta']}.";

                $notificationData = [
                    'driver_id' => $driverData['driver_id'],
                    'driver_name' => $driverData['driver_name'],
                    'jeepney_number' => $driverData['jeepney_number'],
                    'current_checkpoint' => $checkpointData['checkpoint_name'],
                    'route_name' => $checkpointData['route_name'],
                    'estimated_arrival' => $arrivalEstimate['next_checkpoint_eta'],
                    'timestamp' => date('c')
                ];

                // Queue notification
                $stmt = $this->db->prepare("
                    INSERT INTO notification_queue 
                    (recipient_id, recipient_type, notification_type, title, message, data, priority, expires_at) 
                    VALUES (?, 'passenger', 'location_update', ?, ?, ?, 'normal', DATE_ADD(NOW(), INTERVAL 1 HOUR))
                ");
                $stmt->execute([
                    $passenger['passenger_id'],
                    $title,
                    $message,
                    json_encode($notificationData)
                ]);

                $notificationCount++;
            }

            // Process notification queue (send notifications)
            $this->processNotificationQueue();

            return [
                "status" => "success",
                "message" => "Arrival notifications sent",
                "notifications_sent" => $notificationCount,
                "passengers_notified" => count($passengers)
            ];

        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to send arrival notifications: " . $e->getMessage()
            ];
        }
    }

    /**
     * Update driver status for real-time tracking
     */
    private function updateDriverStatus($driverData, $checkpointData, $arrivalEstimate) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO driver_status_tracking 
                (driver_id, route_id, current_checkpoint_id, current_checkpoint_name, next_checkpoint_eta, status, last_scan_timestamp) 
                VALUES (?, ?, ?, ?, ?, 'at_checkpoint', NOW())
                ON DUPLICATE KEY UPDATE
                    route_id = VALUES(route_id),
                    current_checkpoint_id = VALUES(current_checkpoint_id),
                    current_checkpoint_name = VALUES(current_checkpoint_name),
                    last_scan_timestamp = VALUES(last_scan_timestamp),
                    next_checkpoint_eta = VALUES(next_checkpoint_eta),
                    status = VALUES(status)
            ");
            $stmt->execute([
                $driverData['driver_id'],
                $checkpointData['route_id'],
                $checkpointData['checkpoint_id'],
                $checkpointData['checkpoint_name'],
                $arrivalEstimate['next_checkpoint_eta']
            ]);
        } catch (Exception $e) {
            error_log("Failed to update driver status: " . $e->getMessage());
        }
    }

    /**
     * Process notification queue and send notifications
     */
    private function processNotificationQueue() {
        try {
            // Get pending notifications
            $stmt = $this->db->prepare("
                SELECT * FROM notification_queue 
                WHERE sent_at IS NULL AND (expires_at IS NULL OR expires_at > NOW())
                ORDER BY priority DESC, created_at ASC
                LIMIT 100
            ");
            $stmt->execute();
            $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($notifications as $notification) {
                // In a real implementation, this would send push notifications
                // For now, we'll just mark them as sent and log them
                $this->markNotificationAsSent($notification['id']);
                
                error_log("NOTIFICATION SENT: {$notification['title']} to user {$notification['recipient_id']}");
            }

        } catch (Exception $e) {
            error_log("Failed to process notification queue: " . $e->getMessage());
        }
    }

    /**
     * Mark notification as sent
     */
    private function markNotificationAsSent($notificationId) {
        try {
            $stmt = $this->db->prepare("UPDATE notification_queue SET sent_at = NOW() WHERE id = ?");
            $stmt->execute([$notificationId]);
        } catch (Exception $e) {
            error_log("Failed to mark notification as sent: " . $e->getMessage());
        }
    }

    /**
     * Subscribe passenger to route notifications
     */
    public function subscribeToRoute($passengerId, $routeId, $checkpointId = null, $preference = 'all') {
        try {
            $this->createNotificationTables();

            $stmt = $this->db->prepare("
                INSERT INTO passenger_route_subscriptions 
                (passenger_id, route_id, checkpoint_id, notification_preference) 
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    checkpoint_id = VALUES(checkpoint_id),
                    notification_preference = VALUES(notification_preference),
                    is_active = 1,
                    updated_at = CURRENT_TIMESTAMP
            ");
            $stmt->execute([$passengerId, $routeId, $checkpointId, $preference]);

            return [
                "status" => "success",
                "message" => "Successfully subscribed to route notifications"
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to subscribe to route: " . $e->getMessage()
            ];
        }
    }

    /**
     * Unsubscribe passenger from route notifications
     */
    public function unsubscribeFromRoute($passengerId, $routeId) {
        try {
            $stmt = $this->db->prepare("
                UPDATE passenger_route_subscriptions 
                SET is_active = 0 
                WHERE passenger_id = ? AND route_id = ?
            ");
            $stmt->execute([$passengerId, $routeId]);

            return [
                "status" => "success",
                "message" => "Successfully unsubscribed from route notifications"
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to unsubscribe from route: " . $e->getMessage()
            ];
        }
    }

    /**
     * Get passenger's notification history
     */
    public function getPassengerNotifications($passengerId, $limit = 20) {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    id,
                    notification_type,
                    title,
                    message,
                    data,
                    priority,
                    sent_at,
                    read_at,
                    created_at
                FROM notification_queue 
                WHERE recipient_id = ? AND recipient_type = 'passenger'
                ORDER BY created_at DESC
                LIMIT ?
            ");
            $stmt->execute([$passengerId, $limit]);
            $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Parse JSON data
            foreach ($notifications as &$notification) {
                $notification['data'] = json_decode($notification['data'], true);
            }

            return [
                "status" => "success",
                "notifications" => $notifications,
                "count" => count($notifications)
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to get notifications: " . $e->getMessage()
            ];
        }
    }

    /**
     * Get real-time driver locations for passengers
     */
    public function getDriverLocationsForPassengers($routeId) {
        try {
            // First try to get from driver_status_tracking table
            // Include drivers who are on_shift OR recently scanned (within last 15 minutes) to handle endpoint scans
            $stmt = $this->db->prepare("
                SELECT 
                    dst.driver_id,
                    u.first_name,
                    u.last_name,
                    j.jeepney_number,
                    j.plate_number,
                    dst.current_checkpoint_name as current_location,
                    dst.next_checkpoint_eta,
                    dst.passenger_count,
                    dst.status,
                    u.shift_status,
                    dst.last_scan_timestamp as last_updated,
                    TIMESTAMPDIFF(MINUTE, dst.last_scan_timestamp, NOW()) as minutes_since_update,
                    r.route_name
                FROM driver_status_tracking dst
                JOIN users u ON dst.driver_id = u.id
                JOIN jeepneys j ON dst.driver_id = j.driver_id
                JOIN routes r ON dst.route_id = r.id
                WHERE dst.route_id = ? 
                AND dst.status != 'offline'
                AND (
                    u.shift_status = 'on_shift' 
                    OR TIMESTAMPDIFF(MINUTE, dst.last_scan_timestamp, NOW()) <= 15
                )
                ORDER BY dst.last_scan_timestamp DESC
            ");
            $stmt->execute([$routeId]);
            $drivers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // If no drivers found in driver_status_tracking, try drivers table
            if (empty($drivers)) {
                $stmt = $this->db->prepare("
                    SELECT 
                        d.user_id as driver_id,
                        u.first_name,
                        u.last_name,
                        j.jeepney_number,
                        j.plate_number,
                        d.current_location,
                        NULL as next_checkpoint_eta,
                        0 as passenger_count,
                        u.shift_status as status,
                        d.updated_at as last_updated,
                        TIMESTAMPDIFF(MINUTE, d.updated_at, NOW()) as minutes_since_update,
                        r.route_name
                    FROM drivers d
                    JOIN users u ON d.user_id = u.id
                    JOIN jeepneys j ON d.user_id = j.driver_id
                    JOIN routes r ON j.route_id = r.id
                    WHERE r.id = ? AND u.shift_status = 'on_shift' AND d.current_location IS NOT NULL
                    ORDER BY d.updated_at DESC
                ");
                $stmt->execute([$routeId]);
                $drivers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }

            // Add real-time status
            foreach ($drivers as &$driver) {
                $minutesSinceUpdate = $driver['minutes_since_update'];
                if ($minutesSinceUpdate <= 5) {
                    $driver['real_time_status'] = 'live';
                    $driver['status_color'] = '#16A34A'; // Green
                } elseif ($minutesSinceUpdate <= 15) {
                    $driver['real_time_status'] = 'recent';
                    $driver['status_color'] = '#F59E0B'; // Yellow
                } else {
                    $driver['real_time_status'] = 'stale';
                    $driver['status_color'] = '#DC2626'; // Red
                }

                // Format last update time
                $lastUpdateField = isset($driver['last_scan_timestamp']) ? 'last_scan_timestamp' : 'last_updated';
                $driver['last_update_formatted'] = date('g:i A', strtotime($driver[$lastUpdateField]));
            }

            return [
                "status" => "success",
                "route_id" => $routeId,
                "active_drivers" => count($drivers),
                "driver_locations" => $drivers, // Changed from "drivers" to "driver_locations" to match mobile app expectation
                "last_updated" => date('c')
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to get driver locations: " . $e->getMessage()
            ];
        }
    }

    /**
     * Handle multiple drivers conflict resolution
     */
    public function handleMultipleDriversAtCheckpoint($checkpointId) {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    dst.*,
                    u.first_name,
                    u.last_name,
                    j.jeepney_number
                FROM driver_status_tracking dst
                JOIN users u ON dst.driver_id = u.id
                JOIN jeepneys j ON dst.driver_id = j.driver_id
                WHERE dst.current_checkpoint_id = ? 
                AND dst.status IN ('at_checkpoint', 'in_transit')
                AND dst.last_scan_timestamp >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
                ORDER BY dst.last_scan_timestamp ASC
            ");
            $stmt->execute([$checkpointId]);
            $driversAtCheckpoint = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (count($driversAtCheckpoint) > 1) {
                // Multiple drivers detected - organize by arrival order
                $organizationData = [
                    "checkpoint_id" => $checkpointId,
                    "drivers_count" => count($driversAtCheckpoint),
                    "drivers" => []
                ];

                foreach ($driversAtCheckpoint as $index => $driver) {
                    $organizationData['drivers'][] = [
                        "position" => $index + 1,
                        "driver_id" => $driver['driver_id'],
                        "driver_name" => $driver['first_name'] . ' ' . $driver['last_name'],
                        "jeepney_number" => $driver['jeepney_number'],
                        "arrival_time" => $driver['last_scan_timestamp'],
                        "estimated_departure" => date('Y-m-d H:i:s', strtotime($driver['last_scan_timestamp'] . ' +' . (($index + 1) * 5) . ' minutes'))
                    ];
                }

                return [
                    "status" => "success",
                    "conflict_detected" => true,
                    "organization" => $organizationData
                ];
            }

            return [
                "status" => "success",
                "conflict_detected" => false,
                "message" => "No conflicts detected"
            ];

        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to handle driver conflicts: " . $e->getMessage()
            ];
        }
    }

    /**
     * Mark notification as read
     */
    public function markNotificationAsRead($notificationId, $userId) {
        try {
            $stmt = $this->db->prepare("
                UPDATE notification_queue 
                SET read_at = NOW() 
                WHERE id = ? AND recipient_id = ?
            ");
            $stmt->execute([$notificationId, $userId]);

            return [
                "status" => "success",
                "message" => "Notification marked as read"
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to mark notification as read: " . $e->getMessage()
            ];
        }
    }
}
?>
