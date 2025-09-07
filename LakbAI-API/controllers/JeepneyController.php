<?php
class JeepneyController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getAll() {
        try {
            $stmt = $this->db->prepare("SELECT * FROM jeepneys ORDER BY id DESC");
            $stmt->execute();
            $jeepneys = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "jeepneys" => $jeepneys
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to fetch jeepneys: " . $e->getMessage()
            ];
        }
    }

    public function create($data) {
        try {
            $stmt = $this->db->prepare("INSERT INTO jeepneys (plate_number, route, capacity, status) VALUES (?, ?, ?, ?)");
            $stmt->execute([
                $data['plate_number'],
                $data['route'],
                $data['capacity'],
                $data['status'] ?? 'active'
            ]);

            return [
                "status" => "success",
                "message" => "Jeepney added successfully"
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to create jeepney: " . $e->getMessage()
            ];
        }
    }

    public function update($id, $data) {
        try {
            $stmt = $this->db->prepare("UPDATE jeepneys SET plate_number=?, route=?, capacity=?, status=? WHERE id=?");
            $stmt->execute([
                $data['plate_number'],
                $data['route'],
                $data['capacity'],
                $data['status'],
                $id
            ]);

            return [
                "status" => "success",
                "message" => "Jeepney updated successfully"
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to update jeepney: " . $e->getMessage()
            ];
        }
    }

    public function delete($id) {
        try {
            $stmt = $this->db->prepare("DELETE FROM jeepneys WHERE id=?");
            $stmt->execute([$id]);

            return [
                "status" => "success",
                "message" => "Jeepney deleted successfully"
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to delete jeepney: " . $e->getMessage()
            ];
        }
    }
}
