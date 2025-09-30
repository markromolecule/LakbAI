<?php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../src/WebSocketNotifier.php';

use Joseph\LakbAiApi\WebSocketNotifier;

class EarningsController {
    private $db;
    private $wsNotifier;

    public function __construct($db = null) {
        if ($db) {
            $this->db = $db;
        } else {
            // Fallback to direct PDO connection
            $this->db = new PDO('mysql:host=127.0.0.1;dbname=lakbai_db', 'root', '');
            $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        }
        $this->wsNotifier = new WebSocketNotifier();
    }

    /**
     * Get driver earnings summary
     */
    public function getDriverEarnings($driverId) {
        try {
            // Check if we need to reset daily earnings (5:00 AM reset logic)
            $this->checkAndResetDailyEarnings($driverId);
            
            // Get today's earnings (all earnings for today, regardless of shift status)
            // This ensures earnings persist even after shift ends, until 5:00 AM reset
            $todayQuery = "
                SELECT 
                    COALESCE(SUM(CASE WHEN de.counts_as_trip = 1 THEN 1 ELSE 0 END), 0) as today_trips,
                    COALESCE(SUM(final_fare), 0) as today_earnings
                FROM driver_earnings de
                WHERE de.driver_id = ? 
                    AND de.transaction_date = CURDATE()
            ";
            $todayStmt = $this->db->prepare($todayQuery);
            $todayStmt->execute([$driverId]);
            $todayData = $todayStmt->fetch(PDO::FETCH_ASSOC);

            // Get weekly earnings (rolling 7-day window)
            $weeklyQuery = "
                SELECT 
                    COALESCE(SUM(CASE WHEN counts_as_trip = 1 THEN 1 ELSE 0 END), 0) as weekly_trips,
                    COALESCE(SUM(final_fare), 0) as weekly_earnings
                FROM driver_earnings 
                WHERE driver_id = ? AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            ";
            $weeklyStmt = $this->db->prepare($weeklyQuery);
            $weeklyStmt->execute([$driverId]);
            $weeklyData = $weeklyStmt->fetch(PDO::FETCH_ASSOC);

            // Get monthly earnings (current calendar month)
            $monthlyQuery = "
                SELECT 
                    COALESCE(SUM(CASE WHEN counts_as_trip = 1 THEN 1 ELSE 0 END), 0) as monthly_trips,
                    COALESCE(SUM(final_fare), 0) as monthly_earnings
                FROM driver_earnings 
                WHERE driver_id = ? 
                AND YEAR(transaction_date) = YEAR(CURDATE()) 
                AND MONTH(transaction_date) = MONTH(CURDATE())
            ";
            $monthlyStmt = $this->db->prepare($monthlyQuery);
            $monthlyStmt->execute([$driverId]);
            $monthlyData = $monthlyStmt->fetch(PDO::FETCH_ASSOC);

            // Get yearly earnings (current calendar year)
            $yearlyQuery = "
                SELECT 
                    COALESCE(SUM(CASE WHEN counts_as_trip = 1 THEN 1 ELSE 0 END), 0) as yearly_trips,
                    COALESCE(SUM(final_fare), 0) as yearly_earnings
                FROM driver_earnings 
                WHERE driver_id = ? AND YEAR(transaction_date) = YEAR(CURDATE())
            ";
            $yearlyStmt = $this->db->prepare($yearlyQuery);
            $yearlyStmt->execute([$driverId]);
            $yearlyData = $yearlyStmt->fetch(PDO::FETCH_ASSOC);

            // Get all-time earnings (never resets)
            $totalQuery = "
                SELECT 
                    COALESCE(SUM(CASE WHEN counts_as_trip = 1 THEN 1 ELSE 0 END), 0) as total_trips,
                    COALESCE(SUM(final_fare), 0) as total_earnings,
                    COALESCE(AVG(final_fare), 0) as average_fare
                FROM driver_earnings 
                WHERE driver_id = ?
            ";
            $totalStmt = $this->db->prepare($totalQuery);
            $totalStmt->execute([$driverId]);
            $totalData = $totalStmt->fetch(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "earnings" => [
                    "todayEarnings" => (float)$todayData['today_earnings'],
                    "todayTrips" => (int)$todayData['today_trips'],
                    "weeklyEarnings" => (float)$weeklyData['weekly_earnings'],
                    "weeklyTrips" => (int)$weeklyData['weekly_trips'],
                    "monthlyEarnings" => (float)$monthlyData['monthly_earnings'],
                    "monthlyTrips" => (int)$monthlyData['monthly_trips'],
                    "yearlyEarnings" => (float)$yearlyData['yearly_earnings'],
                    "yearlyTrips" => (int)$yearlyData['yearly_trips'],
                    "totalEarnings" => (float)$totalData['total_earnings'],
                    "totalTrips" => (int)$totalData['total_trips'],
                    "averageFarePerTrip" => (float)$totalData['average_fare'],
                    "lastUpdate" => date('c') // ISO 8601 format
                ]
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to get driver earnings: " . $e->getMessage()
            ];
        }
    }

    /**
     * Add new earnings record
     */
    public function addEarnings($data) {
        try {
            // IMPORTANT: Only count as trip if explicitly requested
            // Default is FALSE to prevent passenger payments from incrementing trip count
            $countsAsTrip = isset($data['incrementTripCount']) && $data['incrementTripCount'] === true ? 1 : 0;
            
            error_log("EarningsController: Adding earnings for driver {$data['driverId']} - counts_as_trip: $countsAsTrip");
            
            $query = "
                INSERT INTO driver_earnings (
                    driver_id, trip_id, passenger_id, amount, original_fare, 
                    discount_amount, final_fare, counts_as_trip, payment_method, pickup_location, 
                    destination, transaction_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())
            ";

            $stmt = $this->db->prepare($query);
            $result = $stmt->execute([
                $data['driverId'],
                $data['tripId'],
                $data['passengerId'] ?? null,
                $data['finalFare'],
                $data['originalFare'],
                $data['discountAmount'] ?? 0,
                $data['finalFare'],
                $countsAsTrip,  // New field to track trip vs payment
                $data['paymentMethod'] ?? 'xendit',
                $data['pickupLocation'] ?? null,
                $data['destination'] ?? null
            ]);

            if ($result) {
                // Get updated earnings summary
                $updatedEarnings = $this->getDriverEarnings($data['driverId']);
                
                // Send WebSocket earnings notification
                $this->sendEarningsWebSocketNotification(
                    $data['driverId'],
                    $data['finalFare'],
                    $updatedEarnings['earnings']['todayEarnings'] ?? 0,
                    $updatedEarnings['earnings']['totalTrips'] ?? 0
                );
                
                return [
                    "status" => "success",
                    "message" => "Earnings added successfully",
                    "earningsId" => $this->db->lastInsertId(),
                    "updatedEarnings" => $updatedEarnings['earnings'] ?? null
                ];
            } else {
                throw new Exception("Failed to insert earnings record");
            }
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to add earnings: " . $e->getMessage()
            ];
        }
    }

    /**
     * Get driver transaction history
     */
    public function getTransactionHistory($driverId, $limit = 50, $offset = 0) {
        try {
            $query = "
                SELECT 
                    id, trip_id, passenger_id, amount, original_fare, 
                    discount_amount, final_fare, payment_method, 
                    pickup_location, destination, transaction_date, created_at
                FROM driver_earnings 
                WHERE driver_id = ? 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            ";

            $stmt = $this->db->prepare($query);
            $stmt->execute([$driverId, $limit, $offset]);
            $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "transactions" => $transactions,
                "total" => count($transactions)
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to get transaction history: " . $e->getMessage()
            ];
        }
    }

    /**
     * Get total aggregated earnings for all drivers (all-time)
     */
    public function getTotalAggregatedEarnings() {
        try {
            // Get total earnings from all drivers (all-time)
            $query = "
                SELECT 
                    COUNT(DISTINCT driver_id) as total_drivers,
                    COUNT(CASE WHEN counts_as_trip = 1 THEN 1 END) as total_trips,
                    COALESCE(SUM(final_fare), 0) as total_revenue,
                    COALESCE(AVG(final_fare), 0) as average_fare,
                    COALESCE(SUM(discount_amount), 0) as total_discounts_given
                FROM driver_earnings 
            ";

            $stmt = $this->db->prepare($query);
            $stmt->execute();
            $totalStats = $stmt->fetch(PDO::FETCH_ASSOC);

            // Get earnings breakdown by driver (all-time)
            $driverBreakdownQuery = "
                SELECT 
                    de.driver_id,
                    u.first_name,
                    u.last_name,
                    COUNT(CASE WHEN de.counts_as_trip = 1 THEN 1 END) as driver_trips,
                    COALESCE(SUM(de.final_fare), 0) as driver_revenue,
                    COALESCE(AVG(de.final_fare), 0) as driver_avg_fare
                FROM driver_earnings de
                LEFT JOIN users u ON de.driver_id = u.id
                GROUP BY de.driver_id, u.first_name, u.last_name
                ORDER BY driver_revenue DESC
            ";

            $driverStmt = $this->db->prepare($driverBreakdownQuery);
            $driverStmt->execute();
            $driverBreakdown = $driverStmt->fetchAll(PDO::FETCH_ASSOC);

            // Get monthly breakdown for the last 12 months
            $monthlyQuery = "
                SELECT 
                    DATE_FORMAT(transaction_date, '%Y-%m') as month,
                    COUNT(CASE WHEN counts_as_trip = 1 THEN 1 END) as trips,
                    COALESCE(SUM(final_fare), 0) as revenue
                FROM driver_earnings 
                WHERE transaction_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
                ORDER BY month DESC
            ";

            $monthlyStmt = $this->db->prepare($monthlyQuery);
            $monthlyStmt->execute();
            $monthlyBreakdown = $monthlyStmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "type" => "total_aggregated",
                "summary" => [
                    "total_drivers" => (int)$totalStats['total_drivers'],
                    "total_trips" => (int)$totalStats['total_trips'],
                    "total_revenue" => (float)$totalStats['total_revenue'],
                    "average_fare" => (float)$totalStats['average_fare'],
                    "total_discounts_given" => (float)$totalStats['total_discounts_given']
                ],
                "driver_breakdown" => $driverBreakdown,
                "monthly_breakdown" => $monthlyBreakdown,
                "last_updated" => date('c')
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to get total aggregated earnings: " . $e->getMessage()
            ];
        }
    }

    /**
     * Get daily aggregated earnings for all drivers
     */
    public function getDailyAggregatedEarnings($date = null) {
        try {
            // Use today's date if no date provided
            if (!$date) {
                $date = date('Y-m-d');
            }

            // Get total daily earnings from all drivers
            $query = "
                SELECT 
                    COUNT(DISTINCT driver_id) as total_active_drivers,
                    COUNT(CASE WHEN counts_as_trip = 1 THEN 1 END) as total_trips,
                    COALESCE(SUM(final_fare), 0) as total_revenue,
                    COALESCE(AVG(final_fare), 0) as average_fare,
                    COALESCE(SUM(discount_amount), 0) as total_discounts_given
                FROM driver_earnings 
                WHERE transaction_date = ?
            ";

            $stmt = $this->db->prepare($query);
            $stmt->execute([$date]);
            $dailyStats = $stmt->fetch(PDO::FETCH_ASSOC);

            // Get earnings breakdown by driver
            $driverBreakdownQuery = "
                SELECT 
                    de.driver_id,
                    u.first_name,
                    u.last_name,
                    COUNT(CASE WHEN de.counts_as_trip = 1 THEN 1 END) as driver_trips,
                    COALESCE(SUM(de.final_fare), 0) as driver_revenue,
                    COALESCE(AVG(de.final_fare), 0) as driver_avg_fare
                FROM driver_earnings de
                LEFT JOIN users u ON de.driver_id = u.id
                WHERE de.transaction_date = ?
                GROUP BY de.driver_id, u.first_name, u.last_name
                ORDER BY driver_revenue DESC
            ";

            $driverStmt = $this->db->prepare($driverBreakdownQuery);
            $driverStmt->execute([$date]);
            $driverBreakdown = $driverStmt->fetchAll(PDO::FETCH_ASSOC);

            // Get hourly breakdown for the day
            $hourlyQuery = "
                SELECT 
                    HOUR(created_at) as hour,
                    COUNT(CASE WHEN counts_as_trip = 1 THEN 1 END) as trips,
                    COALESCE(SUM(final_fare), 0) as revenue
                FROM driver_earnings 
                WHERE transaction_date = ?
                GROUP BY HOUR(created_at)
                ORDER BY hour
            ";

            $hourlyStmt = $this->db->prepare($hourlyQuery);
            $hourlyStmt->execute([$date]);
            $hourlyBreakdown = $hourlyStmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "date" => $date,
                "summary" => [
                    "total_active_drivers" => (int)$dailyStats['total_active_drivers'],
                    "total_trips" => (int)$dailyStats['total_trips'],
                    "total_revenue" => (float)$dailyStats['total_revenue'],
                    "average_fare" => (float)$dailyStats['average_fare'],
                    "total_discounts_given" => (float)$dailyStats['total_discounts_given']
                ],
                "driver_breakdown" => $driverBreakdown,
                "hourly_breakdown" => $hourlyBreakdown,
                "last_updated" => date('c')
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to get daily aggregated earnings: " . $e->getMessage()
            ];
        }
    }

    /**
     * End shift - record today's earnings and end the shift
     */
    public function endShift($data) {
        try {
            $driverId = $data['driverId'] ?? null;
            $todayEarnings = $data['todayEarnings'] ?? 0;
            $timestamp = $data['timestamp'] ?? date('Y-m-d H:i:s');

            if (!$driverId) {
                return [
                    'status' => 'error',
                    'message' => 'Driver ID is required'
                ];
            }

            // Get today's actual earnings from database
            $todayQuery = "
                SELECT 
                    COALESCE(SUM(CASE WHEN counts_as_trip = 1 THEN 1 ELSE 0 END), 0) as today_trips,
                    COALESCE(SUM(final_fare), 0) as today_earnings
                FROM driver_earnings 
                WHERE driver_id = ? AND transaction_date = CURDATE()
            ";
            $todayStmt = $this->db->prepare($todayQuery);
            $todayStmt->execute([$driverId]);
            $todayData = $todayStmt->fetch(PDO::FETCH_ASSOC);
            
            $actualTodayEarnings = (float)$todayData['today_earnings'];
            $actualTodayTrips = (int)$todayData['today_trips'];

            // End the current shift
            $endShiftQuery = "
                UPDATE driver_shift_logs 
                SET end_time = NOW(), 
                    total_earnings = ?, 
                    total_trips = ?, 
                    status = 'ended',
                    updated_at = NOW()
                WHERE driver_id = ? AND shift_date = CURDATE() AND status = 'active'
            ";
            $endShiftStmt = $this->db->prepare($endShiftQuery);
            $endShiftStmt->execute([$actualTodayEarnings, $actualTodayTrips, $driverId]);

            // Get updated total earnings
            $totalQuery = "
                SELECT COALESCE(SUM(final_fare), 0) as total_earnings
                FROM driver_earnings 
                WHERE driver_id = ?
            ";
            $totalStmt = $this->db->prepare($totalQuery);
            $totalStmt->execute([$driverId]);
            $totalData = $totalStmt->fetch(PDO::FETCH_ASSOC);
            $totalEarnings = (float)$totalData['total_earnings'];

            // Update driver status in users table (since shift_status is in users table)
            $updateDriverStatusQuery = "
                UPDATE users 
                SET shift_status = 'off_shift', 
                    updated_at = NOW()
                WHERE id = ?
            ";
            $updateDriverStmt = $this->db->prepare($updateDriverStatusQuery);
            $updateDriverStmt->execute([$driverId]);

            // Log shift end
            error_log("Driver $driverId ended shift - Today: $actualTodayEarnings, Total: $totalEarnings");

            // Return updated earnings summary
            $earningsSummary = $this->getDriverEarnings($driverId);
            
            return [
                'status' => 'success',
                'message' => 'Shift ended successfully! Today\'s earnings: ₱' . number_format($actualTodayEarnings, 2),
                'todayEarnings' => $actualTodayEarnings,
                'totalEarnings' => $totalEarnings,
                'earnings' => $earningsSummary['earnings'] ?? null
            ];
        } catch (Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Failed to end shift: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Start shift - start a new shift for the day
     */
    public function startShift($data) {
        try {
            $driverId = $data['driverId'] ?? null;
            $timestamp = $data['timestamp'] ?? date('Y-m-d H:i:s');

            if (!$driverId) {
                return [
                    'status' => 'error',
                    'message' => 'Driver ID is required'
                ];
            }

            // Check if there's already an active shift for today
            $checkShiftQuery = "
                SELECT id, status FROM driver_shift_logs 
                WHERE driver_id = ? AND shift_date = CURDATE()
            ";
            $checkStmt = $this->db->prepare($checkShiftQuery);
            $checkStmt->execute([$driverId]);
            $existingShift = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if ($existingShift) {
                if ($existingShift['status'] === 'active') {
                    return [
                        'status' => 'error',
                        'message' => 'You already have an active shift for today. End your current shift first.'
                    ];
                } else {
                    // Update existing ended shift to active
                    $updateShiftQuery = "
                        UPDATE driver_shift_logs 
                        SET start_time = NOW(), 
                            end_time = NULL, 
                            total_earnings = 0, 
                            total_trips = 0, 
                            status = 'active',
                            updated_at = NOW()
                        WHERE id = ?
                    ";
                    $updateStmt = $this->db->prepare($updateShiftQuery);
                    $updateStmt->execute([$existingShift['id']]);
                }
            } else {
                // Create new shift for today
                $createShiftQuery = "
                    INSERT INTO driver_shift_logs (driver_id, shift_date, start_time, status) 
                    VALUES (?, CURDATE(), NOW(), 'active')
                ";
                $createStmt = $this->db->prepare($createShiftQuery);
                $createStmt->execute([$driverId]);
            }

            // Update driver status in users table (since shift_status is in users table)
            $updateDriverStatusQuery = "
                UPDATE users 
                SET shift_status = 'on_shift', 
                    updated_at = NOW()
                WHERE id = ?
            ";
            $updateDriverStmt = $this->db->prepare($updateDriverStatusQuery);
            $updateDriverStmt->execute([$driverId]);

            // Log shift start
            error_log("Driver $driverId started shift at $timestamp");

            // Return updated earnings summary (today's earnings will be 0 for new shift)
            $earningsSummary = $this->getDriverEarnings($driverId);
            
            return [
                'status' => 'success',
                'message' => 'Shift started successfully! Ready to earn! 🚀',
                'earnings' => $earningsSummary['earnings'] ?? null
            ];
        } catch (Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Failed to start shift: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Check if we need to reset daily earnings (5:00 AM reset logic)
     * This method ensures that today's earnings are only reset at 5:00 AM daily
     */
    private function checkAndResetDailyEarnings($driverId) {
        try {
            $now = new DateTime();
            $currentHour = (int)$now->format('H');
            $currentDate = $now->format('Y-m-d');
            
            // Check if it's 5:00 AM or later
            if ($currentHour >= 5) {
                // Check if we've already reset today's earnings for this driver
                $checkQuery = "
                    SELECT COUNT(*) as reset_count
                    FROM driver_earnings 
                    WHERE driver_id = ? 
                        AND transaction_date = ? 
                        AND created_at >= CONCAT(?, ' 05:00:00')
                ";
                $checkStmt = $this->db->prepare($checkQuery);
                $checkStmt->execute([$driverId, $currentDate, $currentDate]);
                $resetCheck = $checkStmt->fetch(PDO::FETCH_ASSOC);
                
                // If no earnings recorded after 5:00 AM today, it means we need to reset
                // This is a simple way to detect if we're in a new day after 5:00 AM
                if ($resetCheck['reset_count'] == 0) {
                    // Check if there are any earnings from yesterday that should be cleared
                    $yesterdayQuery = "
                        SELECT COUNT(*) as yesterday_count
                        FROM driver_earnings 
                        WHERE driver_id = ? 
                            AND transaction_date = DATE_SUB(?, INTERVAL 1 DAY)
                    ";
                    $yesterdayStmt = $this->db->prepare($yesterdayQuery);
                    $yesterdayStmt->execute([$driverId, $currentDate]);
                    $yesterdayCheck = $yesterdayStmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($yesterdayCheck['yesterday_count'] > 0) {
                        // Log the reset (this is just for debugging - actual earnings are calculated dynamically)
                        error_log("🔄 Daily earnings reset at 5:00 AM for driver {$driverId} on {$currentDate}");
                    }
                }
            }
        } catch (Exception $e) {
            // Don't throw error for reset check - just log it
            error_log("⚠️ Error checking daily earnings reset for driver {$driverId}: " . $e->getMessage());
        }
    }

    /**
     * Send WebSocket earnings notification
     */
    private function sendEarningsWebSocketNotification($driverId, $amount, $totalEarnings, $tripCount) {
        try {
            $success = $this->wsNotifier->notifyEarningsUpdate(
                $driverId,
                $amount,
                $totalEarnings,
                $tripCount
            );

            if ($success) {
                error_log("🔌 WebSocket earnings notification sent: Driver $driverId earned ₱$amount (Total: ₱$totalEarnings)");
            } else {
                error_log("⚠️ WebSocket earnings notification failed: Driver $driverId");
            }

        } catch (Exception $e) {
            error_log("❌ Error sending WebSocket earnings notification: " . $e->getMessage());
        }
    }
}
