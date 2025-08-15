<?php

class AuthController {
    private $conn;

    public function __construct($dbConn) {
        $this->conn = $dbConn;
    }


    public function register($data) {
        $required = ['full_name','age','birthday','gender','address','email','password'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return ["status"=>"error","message"=>"$field is required"];
            }
        }

        $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);
        $userType = isset($data['user_type']) ? $data['user_type'] : 'passenger';

        $stmt = $this->conn->prepare("
            INSERT INTO users (full_name, age, birthday, address, email, password, user_type, gender)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->bind_param(
            "ssssssss",
            $data['full_name'],
            $data['age'],
            $data['birthday'],
            $data['address'],
            $data['email'],
            $hashedPassword,
            $userType,
            $data['gender']
        );

        if ($stmt->execute()) {
            return ["status"=>"success","message"=>"User registered successfully"];
        } else {
            return ["status"=>"error","message"=>$stmt->error];
        }
    }


    public function login($data) {
        if (empty($data['email']) || empty($data['password'])) {
            return ["status"=>"error","message"=>"Email and password required"];
        }

        $stmt = $this->conn->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->bind_param("s",$data['email']);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            return ["status"=>"error","message"=>"User not found"];
        }

        $user = $result->fetch_assoc();
        if (password_verify($data['password'], $user['password'])) {
            unset($user['password']);
            return ["status"=>"success","message"=>"Login successful","user"=>$user];
        } else {
            return ["status"=>"error","message"=>"Incorrect password"];
        }
    }


}
