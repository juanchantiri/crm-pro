<?php
// /api/models/Note.php

class Note {
    // 1. Conexión y nombre de tabla
    private $conn;
    private $table_name = "notes";

    // 2. Propiedades que mapean las columnas de MySQL
    public $id;
    public $client_id;
    public $user_id;
    public $contenido;
    public $creado_en;

    // 3. Constructor
    public function __construct($db) {
        $this->conn = $db;
    }

    // 4. Método para OBTENER todas las notas de un CLIENTE ESPECÍFICO
    public function getAllByClient($client_id, $user_id) {
        // SEGURIDAD MULTI-TENANT: Siempre filtramos por client_id Y user_id
        // para asegurar que un usuario no pueda ver notas de clientes de otro usuario
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE client_id = :client_id AND user_id = :user_id 
                  ORDER BY creado_en DESC";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":client_id", $client_id, PDO::PARAM_INT);
        $stmt->bindParam(":user_id", $user_id, PDO::PARAM_INT);

        $stmt->execute();

        return $stmt;
    }

    // 5. Método para CREAR una nueva nota
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET client_id=:client_id, user_id=:user_id, contenido=:contenido";

        $stmt = $this->conn->prepare($query);

        // Sanitización vital: Limpiamos el texto para evitar XSS (Inyección JS)
        // Ya que los usuarios suelen pegar textos de emails o WhatsApp acá
        $this->contenido = htmlspecialchars(strip_tags($this->contenido));

        // Vinculamos valores
        $stmt->bindParam(":client_id", $this->client_id);
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":contenido", $this->contenido);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}