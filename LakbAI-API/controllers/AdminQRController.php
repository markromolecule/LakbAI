<?php
/**
 * Admin QR Controller
 * 
 * Handles all operations related to admin-generated location QR codes
 * including creation, management, validation, and tracking.
 */

class AdminQRController {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->initializeTables();
    }

    /**
     * Create necessary database tables if they don't exist
     */
    private function initializeTables() {
        $queries = [
            // Locations table
            "CREATE TABLE IF NOT EXISTS admin_locations (
                id VARCHAR(255) PRIMARY KEY,
                location_name VARCHAR(255) NOT NULL,
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                category ENUM('terminal', 'checkpoint', 'stop', 'landmark') DEFAULT 'stop',
                expected_passenger_volume ENUM('low', 'medium', 'high') DEFAULT 'medium',
                time_restrictions TEXT,
                notes TEXT,
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                created_by VARCHAR(255)
            )",
            
            // QR scan logs table
            "CREATE TABLE IF NOT EXISTS qr_scan_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                driver_id VARCHAR(255) NOT NULL,
                location_id VARCHAR(255) NOT NULL,
                jeepney_number VARCHAR(50),
                scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                coordinates_lat DECIMAL(10, 8),
                coordinates_lng DECIMAL(11, 8),
                notifications_sent INT DEFAULT 0,
                conflict_detected BOOLEAN DEFAULT FALSE,
                INDEX idx_driver_scans (driver_id, scanned_at),
                INDEX idx_location_scans (location_id, scanned_at),
                FOREIGN KEY (location_id) REFERENCES admin_locations(id) ON DELETE CASCADE
            )",
            
            // Driver location tracking
            "CREATE TABLE IF NOT EXISTS driver_current_locations (
                driver_id VARCHAR(255) PRIMARY KEY,
                current_location_id VARCHAR(255),
                current_location_name VARCHAR(255),
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                jeepney_number VARCHAR(50),
                route VARCHAR(255),
                FOREIGN KEY (current_location_id) REFERENCES admin_locations(id) ON DELETE SET NULL
            )"
        ];

        foreach ($queries as $query) {
            $this->db->exec($query);
        }

        // Insert predefined locations if table is empty
        $count = $this->db->query("SELECT COUNT(*) FROM admin_locations")->fetchColumn();
        if ($count == 0) {
            $this->insertPredefinedLocations();
        }
    }

    /**
     * Insert predefined locations for Cebu jeepney routes
     */
    private function insertPredefinedLocations() {
        $locations = [
            [
                'id' => 'terminal_robinson_galleria',
                'location_name' => 'Robinson Galleria Cebu',
                'latitude' => 10.3157,
                'longitude' => 123.9054,
                'category' => 'terminal',
                'expected_passenger_volume' => 'high',
                'notes' => 'Main terminal with high passenger traffic'
            ],
            [
                'id' => 'terminal_ayala_center',
                'location_name' => 'Ayala Center Cebu',
                'latitude' => 10.3181,
                'longitude' => 123.9068,
                'category' => 'terminal',
                'expected_passenger_volume' => 'high',
                'notes' => 'Central business district terminal'
            ],
            [
                'id' => 'stop_sm_city_cebu',
                'location_name' => 'SM City Cebu',
                'latitude' => 10.3089,
                'longitude' => 123.8914,
                'category' => 'stop',
                'expected_passenger_volume' => 'high',
                'notes' => 'Major shopping center'
            ],
            [
                'id' => 'checkpoint_colon_street',
                'location_name' => 'Colon Street',
                'latitude' => 10.2952,
                'longitude' => 123.9019,
                'category' => 'checkpoint',
                'expected_passenger_volume' => 'medium',
                'notes' => 'Historic downtown area'
            ],
            [
                'id' => 'stop_usc_main',
                'location_name' => 'University of San Carlos - Main Campus',
                'latitude' => 10.2921,
                'longitude' => 123.9019,
                'category' => 'stop',
                'expected_passenger_volume' => 'high',
                'time_restrictions' => 'Peak hours: 7-9 AM, 4-6 PM',
                'notes' => 'University with heavy student traffic'
            ],
            [
                'id' => 'stop_it_park',
                'location_name' => 'Cebu IT Park',
                'latitude' => 10.3270,
                'longitude' => 123.9070,
                'category' => 'stop',
                'expected_passenger_volume' => 'high',
                'time_restrictions' => 'Business hours: 8 AM - 6 PM',
                'notes' => 'Business district with office workers'
            ]
        ];

        $stmt = $this->db->prepare("
            INSERT INTO admin_locations (id, location_name, latitude, longitude, category, expected_passenger_volume, time_restrictions, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'system')
        ");

        foreach ($locations as $location) {
            $stmt->execute([
                $location['id'],
                $location['location_name'],
                $location['latitude'],
                $location['longitude'],
                $location['category'],
                $location['expected_passenger_volume'],
                $location['time_restrictions'] ?? null,
                $location['notes']
            ]);
        }
    }

    /**
     * Get all locations
     */
    public function getAllLocations() {
        $stmt = $this->db->query("SELECT * FROM admin_locations ORDER BY location_name");
        $locations = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return json_encode([
            'success' => true,
            'data' => $locations,
            'count' => count($locations)
        ]);
    }

    /**
     * Get only active locations
     */
    public function getActiveLocations() {
        $stmt = $this->db->query("SELECT * FROM admin_locations WHERE active = TRUE ORDER BY location_name");
        $locations = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return json_encode([
            'success' => true,
            'data' => $locations,
            'count' => count($locations)
        ]);
    }

    /**
     * Get location by ID
     */
    public function getLocationById($locationId) {
        $stmt = $this->db->prepare("SELECT * FROM admin_locations WHERE id = ?");
        $stmt->execute([$locationId]);
        $location = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$location) {
            http_response_code(404);
            return json_encode([
                'success' => false,
                'error' => 'Location not found'
            ]);
        }

        return json_encode([
            'success' => true,
            'data' => $location
        ]);
    }

    /**
     * Generate QR code for a specific location
     */
    public function generateLocationQR($locationId, $adminId = 'admin_001') {
        $stmt = $this->db->prepare("SELECT * FROM admin_locations WHERE id = ? AND active = TRUE");
        $stmt->execute([$locationId]);
        $location = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$location) {
            http_response_code(404);
            return json_encode([
                'success' => false,
                'error' => 'Location not found or inactive'
            ]);
        }

        $qrData = [
            'type' => 'admin_location',
            'locationId' => $location['id'],
            'locationName' => $location['location_name'],
            'coordinates' => [
                'latitude' => (float)$location['latitude'],
                'longitude' => (float)$location['longitude']
            ],
            'timestamp' => date('c'),
            'adminId' => $adminId,
            'category' => $location['category'],
            'metadata' => [
                'expectedPassengerVolume' => $location['expected_passenger_volume'],
                'timeRestrictions' => $location['time_restrictions'],
                'notes' => $location['notes']
            ]
        ];

        $qrString = json_encode($qrData);
        $qrImageUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" . urlencode($qrString);

        return json_encode([
            'success' => true,
            'data' => [
                'locationId' => $locationId,
                'locationName' => $location['location_name'],
                'qrData' => $qrString,
                'qrImageUrl' => $qrImageUrl,
                'coordinates' => $qrData['coordinates'],
                'category' => $location['category']
            ]
        ]);
    }

    /**
     * Generate QR codes for all active locations
     */
    public function generateBatchQRs($adminId = 'admin_001') {
        $stmt = $this->db->query("SELECT * FROM admin_locations WHERE active = TRUE ORDER BY location_name");
        $locations = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $batch = [
            'batchId' => 'batch_' . time(),
            'generatedAt' => date('c'),
            'adminId' => $adminId,
            'locations' => []
        ];

        foreach ($locations as $location) {
            $qrData = [
                'type' => 'admin_location',
                'locationId' => $location['id'],
                'locationName' => $location['location_name'],
                'coordinates' => [
                    'latitude' => (float)$location['latitude'],
                    'longitude' => (float)$location['longitude']
                ],
                'timestamp' => date('c'),
                'adminId' => $adminId,
                'category' => $location['category'],
                'metadata' => [
                    'expectedPassengerVolume' => $location['expected_passenger_volume'],
                    'timeRestrictions' => $location['time_restrictions'],
                    'notes' => $location['notes']
                ]
            ];

            $qrString = json_encode($qrData);
            $qrImageUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" . urlencode($qrString);

            $batch['locations'][] = [
                'locationId' => $location['id'],
                'locationName' => $location['location_name'],
                'category' => $location['category'],
                'qrData' => $qrString,
                'qrImageUrl' => $qrImageUrl,
                'printUrl' => "https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&data=" . urlencode($qrString)
            ];
        }

        return json_encode([
            'success' => true,
            'data' => $batch
        ]);
    }

    /**
     * Log driver scan event
     */
    public function logDriverScan($data) {
        $requiredFields = ['driverId', 'locationId', 'jeepneyNumber'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                http_response_code(400);
                return json_encode([
                    'success' => false,
                    'error' => "Missing required field: $field"
                ]);
            }
        }

        // Check if location exists
        $stmt = $this->db->prepare("SELECT * FROM admin_locations WHERE id = ?");
        $stmt->execute([$data['locationId']]);
        $location = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$location) {
            http_response_code(404);
            return json_encode([
                'success' => false,
                'error' => 'Location not found'
            ]);
        }

        // Check for conflicts (other drivers at same location recently)
        $conflictCheck = $this->checkLocationConflicts($data['locationId'], $data['driverId']);

        // Log the scan
        $stmt = $this->db->prepare("
            INSERT INTO qr_scan_logs (driver_id, location_id, jeepney_number, coordinates_lat, coordinates_lng, conflict_detected)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $data['driverId'],
            $data['locationId'],
            $data['jeepneyNumber'],
            $data['coordinates']['latitude'] ?? $location['latitude'],
            $data['coordinates']['longitude'] ?? $location['longitude'],
            $conflictCheck['hasConflict']
        ]);

        // Update driver's current location
        $this->updateDriverCurrentLocation($data['driverId'], $data['locationId'], $location['location_name'], $data['jeepneyNumber'], $data['route'] ?? null);

        // Simulate sending notifications (in real implementation, this would trigger push notifications)
        $notificationsSent = $this->simulatePassengerNotifications($location);

        // Update notifications count in log
        $logId = $this->db->lastInsertId();
        $stmt = $this->db->prepare("UPDATE qr_scan_logs SET notifications_sent = ? WHERE id = ?");
        $stmt->execute([$notificationsSent, $logId]);

        return json_encode([
            'success' => true,
            'data' => [
                'logId' => $logId,
                'locationName' => $location['location_name'],
                'notificationsSent' => $notificationsSent,
                'conflictDetected' => $conflictCheck['hasConflict'],
                'conflictInfo' => $conflictCheck['hasConflict'] ? $conflictCheck : null
            ]
        ]);
    }

    /**
     * Check for location conflicts
     */
    private function checkLocationConflicts($locationId, $driverId) {
        // Check for other drivers at this location in the last 10 minutes
        $stmt = $this->db->prepare("
            SELECT dcl.driver_id, dcl.jeepney_number, dcl.route, dcl.last_updated
            FROM driver_current_locations dcl
            WHERE dcl.current_location_id = ? 
            AND dcl.driver_id != ? 
            AND dcl.last_updated > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
        ");
        
        $stmt->execute([$locationId, $driverId]);
        $conflictingDrivers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'hasConflict' => count($conflictingDrivers) > 0,
            'conflictingDrivers' => $conflictingDrivers,
            'conflictCount' => count($conflictingDrivers)
        ];
    }

    /**
     * Update driver's current location
     */
    private function updateDriverCurrentLocation($driverId, $locationId, $locationName, $jeepneyNumber, $route) {
        $stmt = $this->db->prepare("
            INSERT INTO driver_current_locations (driver_id, current_location_id, current_location_name, jeepney_number, route)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            current_location_id = VALUES(current_location_id),
            current_location_name = VALUES(current_location_name),
            last_updated = CURRENT_TIMESTAMP,
            jeepney_number = VALUES(jeepney_number),
            route = VALUES(route)
        ");

        $stmt->execute([$driverId, $locationId, $locationName, $jeepneyNumber, $route]);
    }

    /**
     * Simulate passenger notifications
     */
    private function simulatePassengerNotifications($location) {
        // Mock notification count based on location passenger volume and time of day
        $baseCount = [
            'low' => 5,
            'medium' => 12,
            'high' => 25
        ];

        $count = $baseCount[$location['expected_passenger_volume']] ?? 10;
        
        // Adjust based on time of day (more passengers during peak hours)
        $hour = (int)date('H');
        if (($hour >= 7 && $hour <= 9) || ($hour >= 17 && $hour <= 19)) {
            $count = (int)($count * 1.5); // 50% more during peak hours
        } elseif ($hour >= 22 || $hour <= 5) {
            $count = (int)($count * 0.3); // 70% less during night hours
        }

        return $count;
    }

    /**
     * Validate QR code data
     */
    public function validateQRCode($data) {
        if (!isset($data['qrData'])) {
            http_response_code(400);
            return json_encode([
                'success' => false,
                'error' => 'QR data required'
            ]);
        }

        try {
            $qrData = json_decode($data['qrData'], true);
            
            if (!$qrData || $qrData['type'] !== 'admin_location') {
                return json_encode([
                    'success' => false,
                    'valid' => false,
                    'error' => 'Not a valid admin location QR code'
                ]);
            }

            $requiredFields = ['locationId', 'locationName', 'timestamp'];
            foreach ($requiredFields as $field) {
                if (!isset($qrData[$field])) {
                    return json_encode([
                        'success' => false,
                        'valid' => false,
                        'error' => "Missing required field: $field"
                    ]);
                }
            }

            // Check if location exists in database
            $stmt = $this->db->prepare("SELECT * FROM admin_locations WHERE id = ?");
            $stmt->execute([$qrData['locationId']]);
            $location = $stmt->fetch(PDO::FETCH_ASSOC);

            return json_encode([
                'success' => true,
                'valid' => true,
                'data' => $qrData,
                'locationExists' => $location !== false,
                'locationActive' => $location ? (bool)$location['active'] : false
            ]);

        } catch (Exception $e) {
            return json_encode([
                'success' => false,
                'valid' => false,
                'error' => 'Invalid JSON format'
            ]);
        }
    }

    /**
     * Create new location
     */
    public function createLocation($data) {
        $requiredFields = ['locationName'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                http_response_code(400);
                return json_encode([
                    'success' => false,
                    'error' => "Missing required field: $field"
                ]);
            }
        }

        $locationId = 'custom_' . strtolower(str_replace(' ', '_', $data['locationName'])) . '_' . time();
        
        $stmt = $this->db->prepare("
            INSERT INTO admin_locations (id, location_name, latitude, longitude, category, expected_passenger_volume, time_restrictions, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $locationId,
            $data['locationName'],
            $data['coordinates']['latitude'] ?? null,
            $data['coordinates']['longitude'] ?? null,
            $data['category'] ?? 'stop',
            $data['metadata']['expectedPassengerVolume'] ?? 'medium',
            $data['metadata']['timeRestrictions'] ?? null,
            $data['metadata']['notes'] ?? null,
            $data['adminId'] ?? 'admin_001'
        ]);

        return json_encode([
            'success' => true,
            'data' => [
                'locationId' => $locationId,
                'message' => 'Location created successfully'
            ]
        ]);
    }

    /**
     * Update location
     */
    public function updateLocation($locationId, $data) {
        $stmt = $this->db->prepare("SELECT * FROM admin_locations WHERE id = ?");
        $stmt->execute([$locationId]);
        $location = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$location) {
            http_response_code(404);
            return json_encode([
                'success' => false,
                'error' => 'Location not found'
            ]);
        }

        $updateFields = [];
        $params = [];
        
        if (isset($data['locationName'])) {
            $updateFields[] = 'location_name = ?';
            $params[] = $data['locationName'];
        }
        
        if (isset($data['coordinates']['latitude'])) {
            $updateFields[] = 'latitude = ?';
            $params[] = $data['coordinates']['latitude'];
        }
        
        if (isset($data['coordinates']['longitude'])) {
            $updateFields[] = 'longitude = ?';
            $params[] = $data['coordinates']['longitude'];
        }
        
        if (isset($data['category'])) {
            $updateFields[] = 'category = ?';
            $params[] = $data['category'];
        }
        
        if (isset($data['active'])) {
            $updateFields[] = 'active = ?';
            $params[] = $data['active'];
        }

        if (empty($updateFields)) {
            http_response_code(400);
            return json_encode([
                'success' => false,
                'error' => 'No valid fields to update'
            ]);
        }

        $params[] = $locationId;
        $sql = "UPDATE admin_locations SET " . implode(', ', $updateFields) . " WHERE id = ?";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return json_encode([
            'success' => true,
            'message' => 'Location updated successfully'
        ]);
    }

    /**
     * Delete location
     */
    public function deleteLocation($locationId) {
        $stmt = $this->db->prepare("SELECT * FROM admin_locations WHERE id = ?");
        $stmt->execute([$locationId]);
        $location = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$location) {
            http_response_code(404);
            return json_encode([
                'success' => false,
                'error' => 'Location not found'
            ]);
        }

        // Soft delete by setting active = false
        $stmt = $this->db->prepare("UPDATE admin_locations SET active = FALSE WHERE id = ?");
        $stmt->execute([$locationId]);

        return json_encode([
            'success' => true,
            'message' => 'Location deactivated successfully'
        ]);
    }
}
?>
