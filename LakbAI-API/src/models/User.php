<?php

class User {
    private $conn;
    private $table_name = "users";

    // User properties including discount information
    public $id;
    public $username;
    public $email;
    public $password;
    public $first_name;
    public $last_name;
    public $phone_number;
    public $birthday;
    public $gender;
    public $house_number;
    public $street_name;
    public $barangay;
    public $city_municipality;
    public $province;
    public $postal_code;
    public $user_type;
    public $discount_type;
    public $discount_document_path;
    public $discount_document_name;
    public $discount_verified;
    public $is_verified;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Create user with discount information
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                SET username=?, email=?, password=?, first_name=?, last_name=?, 
                    phone_number=?, birthday=?, gender=?, house_number=?, street_name=?,
                    barangay=?, city_municipality=?, province=?, postal_code=?,
                    user_type=?, discount_type=?, discount_document_path=?, 
                    discount_document_name=?, discount_verified=0, is_verified=0, 
                    created_at=NOW(), updated_at=NOW()";

        $stmt = $this->conn->prepare($query);

        // Sanitize inputs
        $this->username = htmlspecialchars(strip_tags($this->username));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->first_name = htmlspecialchars(strip_tags($this->first_name));
        $this->last_name = htmlspecialchars(strip_tags($this->last_name));
        $this->phone_number = htmlspecialchars(strip_tags($this->phone_number));
        $this->house_number = htmlspecialchars(strip_tags($this->house_number));
        $this->street_name = htmlspecialchars(strip_tags($this->street_name));
        $this->barangay = htmlspecialchars(strip_tags($this->barangay));
        $this->city_municipality = htmlspecialchars(strip_tags($this->city_municipality));
        $this->province = htmlspecialchars(strip_tags($this->province));
        $this->postal_code = htmlspecialchars(strip_tags($this->postal_code));
        $this->user_type = htmlspecialchars(strip_tags($this->user_type));
        $this->discount_type = htmlspecialchars(strip_tags($this->discount_type));

        // Hash password
        $hashed_password = password_hash($this->password, PASSWORD_DEFAULT);

        $stmt->bind_param("sssssssssssssssss", 
            $this->username,
            $this->email,
            $hashed_password,
            $this->first_name,
            $this->last_name,
            $this->phone_number,
            $this->birthday,
            $this->gender,
            $this->house_number,
            $this->street_name,
            $this->barangay,
            $this->city_municipality,
            $this->province,
            $this->postal_code,
            $this->user_type,
            $this->discount_type,
            $this->discount_document_path,
            $this->discount_document_name
        );

        if($stmt->execute()) {
            $this->id = $this->conn->insert_id;
            return true;
        }

        return false;
    }

    // Get user by ID with discount info
    public function getById() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $this->id);
        $stmt->execute();

        $result = $stmt->get_result();
        if($result->num_rows > 0) {
            return $result->fetch_assoc();
        }

        return false;
    }

    // Get user by email for login purposes
    public function getByEmail() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE email = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("s", $this->email);
        $stmt->execute();

        $result = $stmt->get_result();
        if($result->num_rows > 0) {
            return $result->fetch_assoc();
        }

        return false;
    }
}
?>