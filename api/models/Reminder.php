<?php
// /api/models/Reminder.php

class Reminder {
    private $conn;
    private $table_name = "reminders";

    public $id;
    public $client_id;
    public $user_id;
    public $titulo;
    public $descripcion;
    public $fecha_vencimiento;
    public $estado;
    public $creado_en;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Método 1: OBTENER TODOS los recordatorios PENDIENTES de un usuario
    // (Ideal para mostrar en el Panel de Inicio o Dashboard cuando el profesional entra al sistema)
    public function getPendingByUser($user_id) {
        $query = "SELECT r.*, c.nombre AS cliente_nombre, c.apellido AS cliente_apellido 
                  FROM " . $this->table_name . " r
                  JOIN clients c ON r.client_id = c.id
                  WHERE r.user_id = :user_id AND r.estado = 'pendiente' 
                  ORDER BY r.fecha_vencimiento ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $user_id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt;
    }

    // Método 2: CREAR un nuevo recordatorio
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET client_id=:client_id, user_id=:user_id, titulo=:titulo, descripcion=:descripcion, fecha_vencimiento=:fecha_vencimiento";

        $stmt = $this->conn->prepare($query);

        // Sanitización
        $this->titulo = htmlspecialchars(strip_tags($this->titulo));
        $this->descripcion = htmlspecialchars(strip_tags($this->descripcion));
        // Validamos que la fecha tenga formato correcto (YYYY-MM-DD HH:MM:SS)
        $this->fecha_vencimiento = htmlspecialchars(strip_tags($this->fecha_vencimiento));

        $stmt->bindParam(":client_id", $this->client_id);
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":titulo", $this->titulo);
        $stmt->bindParam(":descripcion", $this->descripcion);
        $stmt->bindParam(":fecha_vencimiento", $this->fecha_vencimiento);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}