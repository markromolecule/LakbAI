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
                    drivers_license_name,
                    email,
                    user_type,
                    license_status,
                    shift_status
                FROM users 
                WHERE user_type = 'driver' 
                AND (
                    CONCAT(first_name, ' ', last_name) LIKE ? 
                    OR drivers_license_name LIKE ?
                    OR phone_number LIKE ?
                    OR email LIKE ?
                )
                AND is_verified = 1
                ORDER BY first_name, last_name
                LIMIT ?
            ");
            
            $stmt->execute([$searchTerm, $searchTerm, $searchTerm, $searchTerm, $limit]);
            $drivers = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Format the response
            $formattedDrivers = array_map(function($driver) {
                return [
                    'id' => $driver['id'],
                    'name' => $driver['first_name'] . ' ' . $driver['last_name'],
                    'license_number' => $driver['drivers_license_name'] ?? 'N/A',
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
                    u.drivers_license_name,
                    u.email,
                    u.license_status,
                    u.shift_status
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
                    'license_number' => $driver['drivers_license_name'] ?? 'N/A',
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
                    drivers_license_name,
                    email,
                    user_type,
                    license_status,
                    shift_status
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
                        'license_number' => $driver['drivers_license_name'] ?? 'N/A',
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
     * Get all drivers with pagination
     */
    public function getAllDrivers($page = 1, $limit = 10) {
        try {
            $offset = ($page - 1) * $limit;
            
            // Get total count
            $countStmt = $this->db->prepare("SELECT COUNT(*) as total FROM users WHERE user_type = 'driver'");
            $countStmt->execute();
            $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // Get paginated results
            $stmt = $this->db->prepare("
                SELECT 
                    id,
                    first_name,
                    last_name,
                    phone_number,
                    drivers_license_name,
                    email,
                    license_status,
                    shift_status,
                    created_at
                FROM users 
                WHERE user_type = 'driver'
                ORDER BY first_name, last_name
                LIMIT ? OFFSET ?
            ");
            
            $stmt->execute([$limit, $offset]);
            $drivers = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Format the response
            $formattedDrivers = array_map(function($driver) {
                return [
                    'id' => $driver['id'],
                    'name' => $driver['first_name'] . ' ' . $driver['last_name'],
                    'license_number' => $driver['drivers_license_name'] ?? 'N/A',
                    'phone' => $driver['phone_number'],
                    'email' => $driver['email'],
                    'license_status' => $driver['license_status'] ?? 'pending',
                    'shift_status' => $driver['shift_status'] ?? 'offline',
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
