<?php
class Jeepney {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getAllJeepneys() {
        try {
            $stmt = $this->pdo->query("SELECT * FROM jeepneys ORDER BY id DESC");
            return ['status'=>'success','jeepneys'=>$stmt->fetchAll(PDO::FETCH_ASSOC)];
        } catch (PDOException $e) {
            return ['status'=>'error','message'=>$e->getMessage()];
        }
    }

    public function getJeepneyById($id) {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM jeepneys WHERE id=?");
            $stmt->execute([$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                return ['status'=>'success','jeepney'=>$row];
            }
            return ['status'=>'error','message'=>'Jeepney not found'];
        } catch (PDOException $e) {
            return ['status'=>'error','message'=>$e->getMessage()];
        }
    }

    public function createJeepney($data) {
        if (!isset($data['plate_number'], $data['capacity'], $data['route'])) {
            return ['status'=>'error','message'=>'Missing required fields'];
        }
        try {
            $stmt = $this->pdo->prepare(
                "INSERT INTO jeepneys (plate_number, capacity, route, driver_id) VALUES (?, ?, ?, ?)"
            );
            $stmt->execute([
                $data['plate_number'],
                $data['capacity'],
                $data['route'],
                $data['driver_id'] ?? null
            ]);
            return ['status'=>'success','message'=>'Jeepney created'];
        } catch (PDOException $e) {
            return ['status'=>'error','message'=>'DB error: '.$e->getMessage()];
        }
    }

    public function updateJeepney($id, $data) {
        try {
            $stmt = $this->pdo->prepare(
                "UPDATE jeepneys SET plate_number=?, capacity=?, route=?, driver_id=? WHERE id=?"
            );
            $stmt->execute([
                $data['plate_number'],
                $data['capacity'],
                $data['route'],
                $data['driver_id'] ?? null,
                $id
            ]);
            if ($stmt->rowCount() > 0) {
                return ['status'=>'success','message'=>'Jeepney updated'];
            }
            return ['status'=>'error','message'=>'No jeepney updated'];
        } catch (PDOException $e) {
            return ['status'=>'error','message'=>'DB error: '.$e->getMessage()];
        }
    }

    public function deleteJeepney($id) {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM jeepneys WHERE id=?");
            $stmt->execute([$id]);
            if ($stmt->rowCount() > 0) {
                return ['status'=>'success','message'=>'Jeepney deleted'];
            }
            return ['status'=>'error','message'=>'Jeepney not found'];
        } catch (PDOException $e) {
            return ['status'=>'error','message'=>'DB error: '.$e->getMessage()];
        }
    }
}
