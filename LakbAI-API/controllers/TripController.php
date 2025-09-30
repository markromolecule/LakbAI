<?php
require_once __DIR__ . '/../src/WebSocketNotifier.php';

use Joseph\LakbAiApi\WebSocketNotifier;

class TripController {
    private $db;
    private $wsNotifier;

    public function __construct($db) {
        $this->db = $db;
        $this->wsNotifier = new WebSocketNotifier();
    }

    /**
     * Book a trip for a passenger
     */
    public function bookTrip($data) {
        try {
            $tripId = 'trip_' . time() . '_' . uniqid();
            
            $stmt = $this->db->prepare("
                INSERT INTO active_trips (
                    trip_id, passenger_id, driver_id, route_id, 
                    pickup_location, destination, fare, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'booked')
            ");
            
            $result = $stmt->execute([
                $tripId,
                $data['passenger_id'],
                $data['driver_id'],
                $data['route_id'],
                $data['pickup_location'],
                $data['destination'],
                $data['fare']
            ]);

            if ($result) {
                error_log("✅ Trip booked: $tripId for passenger {$data['passenger_id']} with driver {$data['driver_id']}");
                
                return [
                    "status" => "success",
                    "message" => "Trip booked successfully",
                    "data" => [
                        "trip_id" => $tripId,
                        "fare" => $data['fare']
                    ]
                ];
            } else {
                throw new Exception("Failed to book trip");
            }

        } catch (Exception $e) {
            error_log("❌ Error booking trip: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Failed to book trip: " . $e->getMessage()
            ];
        }
    }

    /**
     * Complete a trip when driver reaches destination
     */
    public function completeTrip($driverId, $checkpointName) {
        try {
            // Find active trips for this driver with matching destination
            $stmt = $this->db->prepare("
                SELECT 
                    t.*,
                    u.first_name,
                    u.last_name,
                    u.email
                FROM active_trips t
                JOIN users u ON t.passenger_id = u.id
                WHERE t.driver_id = ? 
                AND t.status IN ('booked', 'in_progress')
                AND (
                    t.destination = ? 
                    OR (? LIKE 'SM Das%' AND t.destination LIKE 'SM Das%')
                    OR (? LIKE 'Robinson Das%' AND t.destination LIKE 'Robinson Das%')
                    OR (? LIKE 'SM Epza%' AND t.destination LIKE 'SM Epza%')
                    OR (? LIKE 'Lancaster%' AND t.destination LIKE 'Lancaster%')
                    OR (? LIKE 'Monterey%' AND t.destination LIKE 'Monterey%')
                )
                AND t.booked_at >= DATE_SUB(NOW(), INTERVAL 4 HOUR)
                ORDER BY t.booked_at DESC
            ");
            
            $stmt->execute([
                $driverId,
                $checkpointName,
                $checkpointName,
                $checkpointName,
                $checkpointName,
                $checkpointName,
                $checkpointName
            ]);
            
            $activeTrips = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            error_log("🏁 Found " . count($activeTrips) . " active trips to complete for driver $driverId at $checkpointName");
            
            $completedCount = 0;
            foreach ($activeTrips as $trip) {
                try {
                    // Update trip status to completed
                    $updateStmt = $this->db->prepare("
                        UPDATE active_trips 
                        SET status = 'completed', completed_at = NOW()
                        WHERE trip_id = ?
                    ");
                    $updateStmt->execute([$trip['trip_id']]);
                    
                    $completedCount++;
                    error_log("✅ Completed trip {$trip['trip_id']} for passenger {$trip['first_name']} {$trip['last_name']}");
                    
                    // Send WebSocket trip completion notification
                    $this->sendTripCompletionNotification($trip);
                    
                } catch (Exception $e) {
                    error_log("❌ Failed to complete trip {$trip['trip_id']}: " . $e->getMessage());
                }
            }
            
            error_log("🏁 Successfully completed {$completedCount} trips at destination");
            
            return [
                "status" => "success",
                "message" => "Completed {$completedCount} trips",
                "completed_count" => $completedCount
            ];

        } catch (Exception $e) {
            error_log("❌ Error completing trips: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Failed to complete trips: " . $e->getMessage()
            ];
        }
    }

    /**
     * Get active trips for a passenger
     */
    public function getActiveTrips($passengerId) {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    t.*,
                    u.first_name as driver_name,
                    u.last_name as driver_last_name,
                    j.jeepney_number
                FROM active_trips t
                JOIN users u ON t.driver_id = u.id
                LEFT JOIN jeepneys j ON u.id = j.driver_id
                WHERE t.passenger_id = ? 
                AND t.status IN ('booked', 'in_progress')
                ORDER BY t.booked_at DESC
            ");
            
            $stmt->execute([$passengerId]);
            $trips = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                "status" => "success",
                "data" => $trips
            ];

        } catch (Exception $e) {
            error_log("❌ Error getting active trips: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Failed to get active trips: " . $e->getMessage()
            ];
        }
    }

    /**
     * Clear all active trips for a passenger (debug function)
     */
    public function clearActiveTrips($passengerId) {
        try {
            $stmt = $this->db->prepare("
                UPDATE active_trips 
                SET status = 'cancelled', completed_at = NOW()
                WHERE passenger_id = ? 
                AND status IN ('booked', 'in_progress')
            ");
            
            $result = $stmt->execute([$passengerId]);
            $affectedRows = $stmt->rowCount();
            
            error_log("🧹 Cleared {$affectedRows} active trips for passenger $passengerId");
            
            return [
                "status" => "success",
                "message" => "Cleared {$affectedRows} active trips",
                "cleared_count" => $affectedRows
            ];

        } catch (Exception $e) {
            error_log("❌ Error clearing active trips: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Failed to clear active trips: " . $e->getMessage()
            ];
        }
    }

    /**
     * Send trip completion notification via WebSocket
     */
    private function sendTripCompletionNotification($trip) {
        try {
            $success = $this->wsNotifier->notifyTripCompleted(
                $trip['trip_id'],
                $trip['driver_id'],
                $trip['route_id'],
                $trip['passenger_id'],
                $trip['fare']
            );

            if ($success) {
                error_log("🔌 WebSocket trip completion notification sent: Trip {$trip['trip_id']}");
            } else {
                error_log("⚠️ WebSocket trip completion notification failed: Trip {$trip['trip_id']}");
            }

        } catch (Exception $e) {
            error_log("❌ Error sending WebSocket trip completion notification: " . $e->getMessage());
        }
    }
}
?>
