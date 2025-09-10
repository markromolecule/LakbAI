<?php

require_once __DIR__ . '/../src/providers/AppServiceProvider.php';

class DiscountController {
    private $appProvider;
    private $db;

    public function __construct($dbConnection) {
        $this->appProvider = new AppServiceProvider($dbConnection);
        $this->db = $dbConnection;
    }

    /**
     * Get discount status for a specific user
     */
    public function getUserDiscountStatus($userId) {
        try {
            $query = "SELECT 
                        discount_applied, 
                        discount_status, 
                        discount_type, 
                        discount_amount,
                        discount_file_path,
                        discount_document_path,
                        discount_verified
                      FROM users 
                      WHERE id = ?";
            
            $stmt = $this->db->prepare($query);
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                return $this->errorResponse('User not found');
            }
            
            $discountData = $result->fetch_assoc();
            
            return [
                'status' => 'success',
                'data' => [
                    'discount_applied' => (bool)$discountData['discount_applied'],
                    'discount_status' => $discountData['discount_status'],
                    'discount_type' => $discountData['discount_type'],
                    'discount_amount' => $discountData['discount_amount'] ? (float)$discountData['discount_amount'] : null,
                    'discount_file_path' => $discountData['discount_file_path'] ?: $discountData['discount_document_path'],
                    'discount_verified' => (bool)$discountData['discount_verified']
                ]
            ];
        } catch (Exception $e) {
            return $this->errorResponse('Database error: ' . $e->getMessage());
        }
    }

    /**
     * Get static discount percentage based on discount type
     */
    private function getStaticDiscountPercentage($discountType) {
        $discountRates = [
            'Student' => 20,
            'Senior Citizen' => 30,
            'PWD' => 20
        ];
        
        return $discountRates[$discountType] ?? 20; // Default to 20% if type not found
    }

    /**
     * Update discount status (approve/decline) - Admin only
     */
    public function updateDiscountStatus($userId, $status, $discountAmount = null, $rejectionReason = null) {
        try {
            // Validate status
            if (!in_array($status, ['approved', 'rejected', 'pending'])) {
                return $this->errorResponse('Invalid status. Must be approved, rejected, or pending');
            }

            // Start transaction
            $this->db->autocommit(false);

            // Get user's discount type to determine static percentage
            $userQuery = "SELECT discount_type FROM users WHERE id = ?";
            $userStmt = $this->db->prepare($userQuery);
            $userStmt->bind_param("i", $userId);
            $userStmt->execute();
            $userResult = $userStmt->get_result();
            
            if ($userResult->num_rows === 0) {
                throw new Exception('User not found');
            }
            
            $userData = $userResult->fetch_assoc();
            $staticDiscountAmount = $this->getStaticDiscountPercentage($userData['discount_type']);

            // Update discount status
            $query = "UPDATE users SET 
                        discount_status = ?,
                        discount_amount = ?,
                        discount_verified = ?
                      WHERE id = ?";
            
            $discountVerified = ($status === 'approved') ? 1 : 0;
            $amount = ($status === 'approved') ? $staticDiscountAmount : null; // Use static percentage
            
            $stmt = $this->db->prepare($query);
            $stmt->bind_param("sdii", $status, $amount, $discountVerified, $userId);
            
            if (!$stmt->execute()) {
                throw new Exception('Failed to update discount status');
            }

            // If rejected, optionally log rejection reason (you can create a separate table for this)
            if ($status === 'rejected' && $rejectionReason) {
                // For now, we'll just log it - you could create a rejection_logs table
                error_log("Discount rejected for user $userId: $rejectionReason");
            }

            $this->db->commit();
            
            return [
                'status' => 'success',
                'message' => 'Discount status updated successfully',
                'data' => [
                    'user_id' => $userId,
                    'discount_status' => $status,
                    'discount_amount' => $amount,
                    'discount_verified' => $discountVerified,
                    'discount_type' => $userData['discount_type'],
                    'static_percentage' => $staticDiscountAmount
                ]
            ];
        } catch (Exception $e) {
            $this->db->rollback();
            return $this->errorResponse('Failed to update discount status: ' . $e->getMessage());
        } finally {
            $this->db->autocommit(true);
        }
    }

    /**
     * Get all pending discount applications for admin review
     */
    public function getPendingDiscountApplications() {
        try {
            $query = "SELECT 
                        id, username, email, first_name, last_name, phone_number,
                        user_type, discount_type, discount_applied, discount_status,
                        discount_file_path, created_at
                      FROM users 
                      WHERE discount_applied = 1 AND discount_status = 'pending'
                      ORDER BY created_at ASC";
            
            $result = $this->db->query($query);
            $applications = [];
            
            while ($row = $result->fetch_assoc()) {
                $applications[] = [
                    'id' => (int)$row['id'],
                    'username' => $row['username'],
                    'email' => $row['email'],
                    'first_name' => $row['first_name'],
                    'last_name' => $row['last_name'],
                    'phone_number' => $row['phone_number'],
                    'user_type' => $row['user_type'],
                    'discount_type' => $row['discount_type'],
                    'discount_applied' => (bool)$row['discount_applied'],
                    'discount_status' => $row['discount_status'],
                    'discount_file_path' => $row['discount_file_path'],
                    'created_at' => $row['created_at']
                ];
            }
            
            return [
                'status' => 'success',
                'data' => $applications,
                'count' => count($applications)
            ];
        } catch (Exception $e) {
            return $this->errorResponse('Database error: ' . $e->getMessage());
        }
    }

    /**
     * Get detailed user information for discount review
     */
    public function getUserDetailsForReview($userId) {
        try {
            $query = "SELECT 
                        id, username, email, first_name, last_name, phone_number,
                        house_number, street_name, barangay, city_municipality,
                        province, postal_code, birthday, gender, user_type,
                        discount_type, discount_applied, discount_status,
                        discount_file_path, discount_document_path, discount_document_name,
                        discount_amount, discount_verified,
                        is_verified, created_at, updated_at
                      FROM users 
                      WHERE id = ?";
            
            $stmt = $this->db->prepare($query);
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                return $this->errorResponse('User not found');
            }
            
            $user = $result->fetch_assoc();
            
            // Format the response
            return [
                'status' => 'success',
                'data' => [
                    'id' => (int)$user['id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'first_name' => $user['first_name'],
                    'last_name' => $user['last_name'],
                    'phone_number' => $user['phone_number'],
                    'address' => [
                        'house_number' => $user['house_number'],
                        'street_name' => $user['street_name'],
                        'barangay' => $user['barangay'],
                        'city_municipality' => $user['city_municipality'],
                        'province' => $user['province'],
                        'postal_code' => $user['postal_code']
                    ],
                    'birthday' => $user['birthday'],
                    'gender' => $user['gender'],
                    'user_type' => $user['user_type'],
                    'discount' => [
                        'type' => $user['discount_type'],
                        'applied' => (bool)$user['discount_applied'],
                        'status' => $user['discount_status'],
                        'amount' => $user['discount_amount'] ? (float)$user['discount_amount'] : null,
                        'file_path' => $user['discount_file_path'] ?: $user['discount_document_path'],
                        'file_name' => $user['discount_document_name'],
                        'verified' => (bool)$user['discount_verified']
                    ],
                    'is_verified' => (bool)$user['is_verified'],
                    'created_at' => $user['created_at'],
                    'updated_at' => $user['updated_at']
                ]
            ];
        } catch (Exception $e) {
            return $this->errorResponse('Database error: ' . $e->getMessage());
        }
    }

    /**
     * Submit a new discount application with document
     */
    public function submitDiscountApplication($userId, $discountType, $documentPath, $documentName) {
        try {
            // Validate input
            if (empty($userId) || empty($discountType) || empty($documentPath)) {
                return $this->errorResponse('Missing required fields: user_id, discount_type, and document_path are required');
            }

            // Validate discount type
            $validDiscountTypes = ['Student', 'PWD', 'Senior Citizen'];
            if (!in_array($discountType, $validDiscountTypes)) {
                return $this->errorResponse('Invalid discount type. Must be one of: ' . implode(', ', $validDiscountTypes));
            }

            // Check if user exists
            $userQuery = "SELECT id, discount_applied, discount_status FROM users WHERE id = ?";
            $userStmt = $this->db->prepare($userQuery);
            $userStmt->bind_param("i", $userId);
            $userStmt->execute();
            $userResult = $userStmt->get_result();
            
            if ($userResult->num_rows === 0) {
                return $this->errorResponse('User not found');
            }

            $userData = $userResult->fetch_assoc();

            // Check if user already has a pending or approved application
            if ($userData['discount_applied'] && in_array($userData['discount_status'], ['pending', 'approved'])) {
                return $this->errorResponse('User already has a ' . $userData['discount_status'] . ' discount application');
            }

            // Start transaction
            $this->db->autocommit(false);

            // Update user record with discount application
            $updateQuery = "UPDATE users SET 
                              discount_type = ?,
                              discount_applied = 1,
                              discount_status = 'pending',
                              discount_file_path = ?,
                              discount_document_path = ?,
                              discount_document_name = ?,
                              discount_verified = 0,
                              discount_amount = NULL,
                              updated_at = CURRENT_TIMESTAMP
                            WHERE id = ?";
            
            $stmt = $this->db->prepare($updateQuery);
            $stmt->bind_param("ssssi", $discountType, $documentPath, $documentPath, $documentName, $userId);
            
            if (!$stmt->execute()) {
                throw new Exception('Failed to submit discount application');
            }

            $this->db->commit();
            
            return [
                'status' => 'success',
                'message' => 'Discount application submitted successfully',
                'data' => [
                    'user_id' => $userId,
                    'discount_type' => $discountType,
                    'discount_status' => 'pending',
                    'document_path' => $documentPath,
                    'document_name' => $documentName,
                    'submitted_at' => date('Y-m-d H:i:s')
                ]
            ];
        } catch (Exception $e) {
            $this->db->rollback();
            return $this->errorResponse('Failed to submit discount application: ' . $e->getMessage());
        } finally {
            $this->db->autocommit(true);
        }
    }

    /**
     * Helper method to return error response
     */
    private function errorResponse($message) {
        return [
            'status' => 'error',
            'message' => $message
        ];
    }
}
