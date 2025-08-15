<?php

abstract class BaseRepository {
    protected $conn;
    protected $table_name;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Find record by ID
     */
    public function findById($id) {
        $query = "SELECT * FROM {$this->table_name} WHERE id = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        
        $result = $stmt->get_result();
        return $result->num_rows > 0 ? $result->fetch_assoc() : null;
    }

    /**
     * Find all records with optional conditions
     */
    public function findAll($conditions = [], $limit = null, $offset = null) {
        $query = "SELECT * FROM {$this->table_name}";
        
        if (!empty($conditions)) {
            $query .= " WHERE " . implode(" AND ", array_keys($conditions));
        }
        
        if ($limit) {
            $query .= " LIMIT " . intval($limit);
            if ($offset) {
                $query .= " OFFSET " . intval($offset);
            }
        }
        
        $stmt = $this->conn->prepare($query);
        
        if (!empty($conditions)) {
            $types = str_repeat('s', count($conditions));
            $stmt->bind_param($types, ...array_values($conditions));
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        $records = [];
        while ($row = $result->fetch_assoc()) {
            $records[] = $row;
        }
        
        return $records;
    }

    /**
     * Delete record by ID
     */
    public function delete($id) {
        $query = "DELETE FROM {$this->table_name} WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $id);
        
        return $stmt->execute();
    }

    /**
     * Count records with optional conditions
     */
    public function count($conditions = []) {
        $query = "SELECT COUNT(*) as total FROM {$this->table_name}";
        
        if (!empty($conditions)) {
            $query .= " WHERE " . implode(" AND ", array_keys($conditions));
        }
        
        $stmt = $this->conn->prepare($query);
        
        if (!empty($conditions)) {
            $types = str_repeat('s', count($conditions));
            $stmt->bind_param($types, ...array_values($conditions));
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        
        return intval($row['total']);
    }
}
?>
