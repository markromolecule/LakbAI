<?php

require_once __DIR__ . '/BaseRepository.php';

class UserRepository extends BaseRepository {
    protected $table_name = "users";

    /**
     * Create a new user
     */
    public function create($userData) {
        $query = "INSERT INTO {$this->table_name} 
                SET username=?, email=?, password=?, first_name=?, last_name=?, 
                    phone_number=?, birthday=?, gender=?, house_number=?, street_name=?,
                    barangay=?, city_municipality=?, province=?, postal_code=?,
                    user_type=?, discount_type=?, discount_document_path=?, 
                    discount_document_name=?, discount_verified=0, is_verified=0, 
                    created_at=NOW(), updated_at=NOW()";

        $stmt = $this->conn->prepare($query);

        $stmt->bind_param("ssssssssssssssssss", 
            $userData['username'],
            $userData['email'],
            $userData['password'],
            $userData['first_name'],
            $userData['last_name'],
            $userData['phone_number'],
            $userData['birthday'],
            $userData['gender'],
            $userData['house_number'],
            $userData['street_name'],
            $userData['barangay'],
            $userData['city_municipality'],
            $userData['province'],
            $userData['postal_code'],
            $userData['user_type'],
            $userData['discount_type'],
            $userData['discount_document_path'],
            $userData['discount_document_name']
        );

        if ($stmt->execute()) {
            return $this->conn->insert_id;
        }

        return false;
    }

    /**
     * Update user data
     */
    public function update($id, $userData) {
        $setParts = [];
        $params = [];
        $types = "";

        foreach ($userData as $field => $value) {
            if ($field !== 'id' && $value !== null) {
                $setParts[] = "{$field} = ?";
                $params[] = $value;
                $types .= "s";
            }
        }

        if (empty($setParts)) {
            return false;
        }

        $setParts[] = "updated_at = NOW()";
        $params[] = $id;
        $types .= "i";

        $query = "UPDATE {$this->table_name} SET " . implode(", ", $setParts) . " WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param($types, ...$params);

        return $stmt->execute();
    }

    /**
     * Find user by email
     */
    public function findByEmail($email) {
        $query = "SELECT * FROM {$this->table_name} WHERE email = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("s", $email);
        $stmt->execute();
        
        $result = $stmt->get_result();
        return $result->num_rows > 0 ? $result->fetch_assoc() : null;
    }

    /**
     * Find user by username
     */
    public function findByUsername($username) {
        $query = "SELECT * FROM {$this->table_name} WHERE username = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("s", $username);
        $stmt->execute();
        
        $result = $stmt->get_result();
        return $result->num_rows > 0 ? $result->fetch_assoc() : null;
    }

    /**
     * Find user by phone number
     */
    public function findByPhone($phoneNumber) {
        $query = "SELECT * FROM {$this->table_name} WHERE phone_number = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("s", $phoneNumber);
        $stmt->execute();
        
        $result = $stmt->get_result();
        return $result->num_rows > 0 ? $result->fetch_assoc() : null;
    }

    /**
     * Check if email exists
     */
    public function emailExists($email) {
        return $this->findByEmail($email) !== null;
    }

    /**
     * Check if username exists
     */
    public function usernameExists($username) {
        return $this->findByUsername($username) !== null;
    }

    /**
     * Check if phone exists
     */
    public function phoneExists($phoneNumber) {
        return $this->findByPhone($phoneNumber) !== null;
    }

    /**
     * Get users by type
     */
    public function findByUserType($userType) {
        return $this->findAll(['user_type = ?' => $userType]);
    }

    /**
     * Get verified users
     */
    public function findVerifiedUsers() {
        return $this->findAll(['is_verified = ?' => 1]);
    }

    /**
     * Get users with discount
     */
    public function findUsersWithDiscount() {
        return $this->findAll(['discount_type IS NOT NULL AND discount_verified = ?' => 1]);
    }

    /**
     * Get all users with filtering and pagination (admin function)
     */
    public function getAllUsers($userType = null, $discountStatus = null, $page = 1, $limit = 10) {
        $conditions = [];
        $params = [];
        $types = "";

        if ($userType) {
            $conditions[] = "user_type = ?";
            $params[] = $userType;
            $types .= "s";
        }

        if ($discountStatus === 'pending') {
            $conditions[] = "discount_type IS NOT NULL AND discount_verified = 0";
        } elseif ($discountStatus === 'approved') {
            $conditions[] = "discount_type IS NOT NULL AND discount_verified = 1";
        } elseif ($discountStatus === 'none') {
            $conditions[] = "discount_type IS NULL";
        }

        $whereClause = empty($conditions) ? "" : "WHERE " . implode(" AND ", $conditions);
        $offset = ($page - 1) * $limit;

        $query = "SELECT * FROM {$this->table_name} {$whereClause} ORDER BY created_at DESC LIMIT {$limit} OFFSET {$offset}";
        $stmt = $this->conn->prepare($query);

        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }

        $stmt->execute();
        $result = $stmt->get_result();
        
        $users = [];
        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }

        return $users;
    }

    /**
     * Count users with filtering
     */
    public function countUsers($userType = null, $discountStatus = null) {
        $conditions = [];
        $params = [];
        $types = "";

        if ($userType) {
            $conditions[] = "user_type = ?";
            $params[] = $userType;
            $types .= "s";
        }

        if ($discountStatus === 'pending') {
            $conditions[] = "discount_type IS NOT NULL AND discount_verified = 0";
        } elseif ($discountStatus === 'approved') {
            $conditions[] = "discount_type IS NOT NULL AND discount_verified = 1";
        } elseif ($discountStatus === 'none') {
            $conditions[] = "discount_type IS NULL";
        }

        $whereClause = empty($conditions) ? "" : "WHERE " . implode(" AND ", $conditions);

        $query = "SELECT COUNT(*) as total FROM {$this->table_name} {$whereClause}";
        $stmt = $this->conn->prepare($query);

        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }

        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();

        return (int)$row['total'];
    }

    /**
     * Delete user
     */
    public function delete($userId) {
        $query = "DELETE FROM {$this->table_name} WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $userId);
        
        return $stmt->execute();
    }

    /**
     * Get users with pending discount applications
     */
    public function findUsersWithPendingDiscounts() {
        $query = "SELECT * FROM {$this->table_name} WHERE discount_type IS NOT NULL AND discount_verified = 0 ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $users = [];
        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }

        return $users;
    }

    /**
     * Get all users with discount applications (pending, approved, rejected)
     */
    public function findUsersWithDiscounts() {
        $query = "SELECT * FROM {$this->table_name} WHERE discount_type IS NOT NULL ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $users = [];
        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }

        return $users;
    }
}
?>
