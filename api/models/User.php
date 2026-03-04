<?php
class User {
    private $conn;
    private $table_name = "users";

    public $id;
    public $email;
    public $password_hash;
    public $nombre_negocio;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Buscar usuario por email para el login
    public function findByEmail($email) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE email = :email LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch();
            $this->id = $row['id'];
            $this->nombre_negocio = $row['nombre_negocio'];
            $this->password_hash = $row['password_hash'];
            return true;
        }
        return false;
    }
}