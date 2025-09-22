<?php

require_once __DIR__ . '/../config/db.php';

class EarningsController {
    private $db;

    public function __construct() {
        // Get PDO connection directly
        $this->db = new PDO('mysql:host=127.0.0.1;dbname=lakbai_db', 'root', '');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }

    /**
     * Get driver earnings summary
     */
    public function getDriverEarnings($driverId) {
        try {
            // Get today's earnings (only for current active shift)
            $todayQuery = "
                SELECT 
                    COALESCE(SUM(CASE WHEN de.counts_as_trip = 1 THEN 1 ELSE 0 END), 0) as today_trips,
                    COALESCE(SUM(final_fare), 0) as today_earnings
                FROM driver_earnings de
                INNER JOIN driver_shift_logs dsl ON de.driver_id = dsl.driver_id 
                    AND de.transaction_date = dsl.shift_date
                WHERE de.driver_id = ? 
                    AND dsl.shift_date = CURDATE() 
                    AND dsl.status = 'active'
                    AND de.created_at >= dsl.start_time
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
                    "monthlyEarnings" => (float)$monthlyData['monthly_earnings'],
                    "yearlyEarnings" => (float)$yearlyData['yearly_earnings'],
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
}
