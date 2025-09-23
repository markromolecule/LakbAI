<?php
class DriverController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Search drivers by name or license number
     */
    public function searchDrivers($query = '', $limit = 10) {
        try {
            $searchTerm = '%' . $query . '%';
            
            $stmt = $this->db->prepare("
                SELECT 
                    id,
                    first_name,
                    last_name,
                    phone_number,
                    email,
                    user_type
                FROM users 
                WHERE user_type = 'driver' 
                AND (
                    CONCAT(first_name, ' ', last_name) LIKE ? 
                    OR phone_number LIKE ?
                    OR email LIKE ?
                )
                AND is_verified = 1
                ORDER BY first_name, last_name
                LIMIT ?
            ");
            
            $stmt->execute([$searchTerm, $searchTerm, $searchTerm, $limit]);
            $drivers = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Format the response
            $formattedDrivers = array_map(function($driver) {
                return [
                    'id' => $driver['id'],
                    'name' => $driver['first_name'] . ' ' . $driver['last_name'],
                    'license_number' => 'N/A',
                    'phone' => $driver['phone_number'],
                    'email' => $driver['email'],
                    'license_status' => $driver['license_status'] ?? 'pending',
                    'shift_status' => $driver['shift_status'] ?? 'offline'
                ];
            }, $drivers);

            return [
                "status" => "success",
                "drivers" => $formattedDrivers,
                "count" => count($formattedDrivers)
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to search drivers: " . $e->getMessage()
            ];
        }
    }

    /**
     * Get all available drivers (not assigned to any jeepney)
     */
    public function getAvailableDrivers() {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    u.id,
                    u.first_name,
                    u.last_name,
                    u.phone_number,
                    u.email
                FROM users u
                LEFT JOIN jeepneys j ON u.id = j.driver_id
                WHERE u.user_type = 'driver' 
                AND u.is_verified = 1
                AND j.driver_id IS NULL
                ORDER BY u.first_name, u.last_name
            ");
            
            $stmt->execute();
            $drivers = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Format the response
            $formattedDrivers = array_map(function($driver) {
                return [
                    'id' => $driver['id'],
                    'name' => $driver['first_name'] . ' ' . $driver['last_name'],
                    'license_number' => 'N/A',
                    'phone' => $driver['phone_number'],
                    'email' => $driver['email'],
                    'license_status' => $driver['license_status'] ?? 'pending',
                    'shift_status' => $driver['shift_status'] ?? 'offline'
                ];
            }, $drivers);

            return [
                "status" => "success",
                "drivers" => $formattedDrivers,
                "count" => count($formattedDrivers)
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to get available drivers: " . $e->getMessage()
            ];
        }
    }

    /**
     * Get driver by ID
     */
    public function getDriverById($id) {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    id,
                    first_name,
                    last_name,
                    phone_number,
                    email,
                    user_type
                FROM users 
                WHERE id = ? AND user_type = 'driver'
            ");
            
            $stmt->execute([$id]);
            $driver = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($driver) {
                return [
                    "status" => "success",
                    "driver" => [
                        'id' => $driver['id'],
                        'name' => $driver['first_name'] . ' ' . $driver['last_name'],
                        'license_number' => 'N/A',
                        'phone' => $driver['phone_number'],
                        'email' => $driver['email'],
                        'license_status' => $driver['license_status'] ?? 'pending',
                        'shift_status' => $driver['shift_status'] ?? 'offline'
                    ]
                ];
            }

            return [
                "status" => "error",
                "message" => "Driver not found"
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to get driver: " . $e->getMessage()
            ];
        }
    }

    /**
     * Get driver with jeepney information for QR scanning
     */
    public function getDriverWithJeepney($id) {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    u.id,
                    u.first_name,
                    u.last_name,
                    u.phone_number,
                    u.email,
                    j.id as jeepney_id,
                    j.jeepney_number,
                    j.plate_number,
                    j.model,
                    j.capacity,
                    j.status as jeepney_status,
                    r.route_name,
                    r.origin,
                    r.destination
                FROM users u
                LEFT JOIN jeepneys j ON u.id = j.driver_id
                LEFT JOIN routes r ON j.route_id = r.id
                WHERE u.id = ? AND u.user_type = 'driver'
            ");
            
            $stmt->execute([$id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($result) {
                $driverInfo = [
                    'id' => $result['id'],
                    'name' => $result['first_name'] . ' ' . $result['last_name'],
                    'license' => 'N/A', // TODO: Add license table
                    'jeepneyNumber' => $result['jeepney_number'] ?: 'N/A',
                    'jeepneyModel' => $result['model'] ?: 'N/A',
                    'plateNumber' => $result['plate_number'] ?: 'N/A',
                    'route' => $result['route_name'] ?: 'No Route Assigned',
                    'contactNumber' => $result['phone_number'],
                    'currentLocation' => 'Unknown', // This would be updated from real-time tracking
                    'rating' => 4.8, // Mock data - would come from ratings table
                    'totalTrips' => 1247 // Mock data - would come from trips table
                ];

                return [
                    "status" => "success",
                    "driverInfo" => $driverInfo
                ];
            }

            return [
                "status" => "error",
                "message" => "Driver not found"
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to get driver info: " . $e->getMessage()
            ];
        }
    }

    /**
     * Get driver profile with assigned jeepney information
     */
    public function getDriverProfile($id) {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    u.id,
                    u.first_name,
                    u.last_name,
                    u.phone_number,
                    u.email,
                    u.user_type,
                    u.created_at,
                    d.drivers_license_verified,
                    d.license_status,
                    j.id as jeepney_id,
                    j.jeepney_number,
                    j.plate_number,
                    j.model,
                    j.capacity,
                    j.status as jeepney_status,
                    r.route_name,
                    r.origin,
                    r.destination
                FROM users u
                LEFT JOIN drivers d ON u.id = d.user_id
                LEFT JOIN jeepneys j ON u.id = j.driver_id
                LEFT JOIN routes r ON j.route_id = r.id
                WHERE u.id = ? AND u.user_type = 'driver'
            ");
            
            $stmt->execute([$id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($result) {
                $profile = [
                    'id' => $result['id'],
                    'name' => $result['first_name'] . ' ' . $result['last_name'],
                    'first_name' => $result['first_name'],
                    'last_name' => $result['last_name'],
                    'phone_number' => $result['phone_number'],
                    'email' => $result['email'],
                    'license_number' => 'N/A', // TODO: Add license table
                    'created_at' => $result['created_at'],
                    'drivers_license_verified' => (bool)$result['drivers_license_verified'],
                    'license_status' => $result['license_status'],
                    'is_verified' => (bool)$result['drivers_license_verified'] && $result['license_status'] === 'approved',
                    'assignedJeepney' => null
                ];

                // Add jeepney information if assigned
                if ($result['jeepney_id']) {
                    $profile['assignedJeepney'] = [
                        'id' => $result['jeepney_id'],
                        'jeepneyNumber' => $result['jeepney_number'],
                        'plateNumber' => $result['plate_number'],
                        'model' => $result['model'],
                        'capacity' => (int)$result['capacity'],
                        'status' => $result['jeepney_status'],
                        'route' => [
                            'name' => $result['route_name'],
                            'origin' => $result['origin'],
                            'destination' => $result['destination']
                        ]
                    ];
                }

                return [
                    "status" => "success",
                    "driverProfile" => $profile
                ];
            }

            return [
                "status" => "error",
                "message" => "Driver not found"
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to get driver profile: " . $e->getMessage()
            ];
        }
    }

    /**
     * Update driver route
     */
    public function updateDriverRoute($driverId, $routeId) {
        try {
            // Validate driver exists
            $driverStmt = $this->db->prepare("SELECT id FROM users WHERE id = ? AND user_type = 'driver'");
            $driverStmt->execute([$driverId]);
            $driver = $driverStmt->fetch();
            
            if (!$driver) {
                return [
                    "status" => "error",
                    "message" => "Driver not found"
                ];
            }
            
            // Validate route exists
            $routeStmt = $this->db->prepare("SELECT id, route_name FROM routes WHERE id = ?");
            $routeStmt->execute([$routeId]);
            $route = $routeStmt->fetch();
            
            if (!$route) {
                return [
                    "status" => "error",
                    "message" => "Route not found"
                ];
            }
            
            // Update jeepney route assignment
            $updateStmt = $this->db->prepare("UPDATE jeepneys SET route_id = ? WHERE driver_id = ?");
            $updateStmt->execute([$routeId, $driverId]);
            
            if ($updateStmt->rowCount() > 0) {
                return [
                    "status" => "success",
                    "message" => "Driver route updated successfully",
                    "route_name" => $route['route_name']
                ];
            } else {
                return [
                    "status" => "error",
                    "message" => "No jeepney assigned to this driver"
                ];
            }
            
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to update driver route: " . $e->getMessage()
            ];
        }
    }

    /**
     * Get all drivers with pagination
     */
    public function getAllDrivers($page = 1, $limit = 10) {
        try {
            $offset = ($page - 1) * $limit;
            
            // Get total count
            $countStmt = $this->db->prepare("SELECT COUNT(*) as total FROM users WHERE user_type = 'driver'");
            $countStmt->execute();
            $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // Get paginated results with real shift status from users table
            $stmt = $this->db->prepare("
                SELECT 
                    u.id,
                    u.first_name,
                    u.last_name,
                    u.phone_number,
                    u.email,
                    u.created_at,
                    u.shift_status,
                    u.updated_at as last_active
                FROM users u
                WHERE u.user_type = 'driver'
                ORDER BY u.first_name, u.last_name
                LIMIT ? OFFSET ?
            ");
            
            $stmt->execute([$limit, $offset]);
            $drivers = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Format the response
            $formattedDrivers = array_map(function($driver) {
                return [
                    'id' => $driver['id'],
                    'name' => $driver['first_name'] . ' ' . $driver['last_name'],
                    'license_number' => 'N/A',
                    'phone' => $driver['phone_number'],
                    'email' => $driver['email'],
                    'license_status' => 'pending',
                    'shift_status' => $driver['shift_status'] ?: 'off_shift',
                    'current_location' => null, // Not available in users table
                    'last_active' => $driver['last_active'] ?: $driver['created_at'],
                    'created_at' => $driver['created_at']
                ];
            }, $drivers);

            return [
                "status" => "success",
                "drivers" => $formattedDrivers,
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
                "message" => "Failed to get drivers: " . $e->getMessage()
            ];
        }
    }
}
?>
