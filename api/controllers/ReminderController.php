<?php
// /api/controllers/ReminderController.php

require_once 'config/Database.php';
require_once 'models/Reminder.php';

class ReminderController {
    private $db;
    private $reminder;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
        $this->reminder = new Reminder($this->db);
    }

    public function processRequest($method, $id) {
        switch ($method) {
            case 'GET':
                // Trae todos los recordatorios pendientes del usuario logueado
                $this->getPendingReminders();
                break;
            case 'POST':
                // Crea un nuevo recordatorio
                $this->createReminder();
                break;
            default:
                http_response_code(405);
                echo json_encode(["error" => "Método HTTP no soportado"]);
                break;
        }
    }

    private function getPendingReminders() {
        $user_id = $_SESSION['user_id']; // Magia Multi-Tenant
        $stmt = $this->reminder->getPendingByUser($user_id);
        $num = $stmt->rowCount();

        if ($num > 0) {
            $reminders_arr = array("data" => array());
            while ($row = $stmt->fetch()) {
                array_push($reminders_arr["data"], $row);
            }
            http_response_code(200);
            echo json_encode($reminders_arr);
        } else {
            http_response_code(200);
            // Mensaje amigable si el profesional no tiene tareas pendientes
            echo json_encode(["data" => [], "mensaje" => "No hay recordatorios pendientes. ¡Todo al día!"]);
        }
    }

    private function createReminder() {
        $data = json_decode(file_get_contents("php://input"));

        // Validamos los campos obligatorios
        if (!empty($data->client_id) && !empty($data->titulo) && !empty($data->fecha_vencimiento)) {
            
            $this->reminder->user_id = $_SESSION['user_id']; 
            $this->reminder->client_id = $data->client_id;
            $this->reminder->titulo = $data->titulo;
            $this->reminder->descripcion = $data->descripcion ?? null;
            $this->reminder->fecha_vencimiento = $data->fecha_vencimiento;

            if ($this->reminder->create()) {
                http_response_code(201);
                echo json_encode(["status" => "success", "mensaje" => "Recordatorio programado con éxito."]);
            } else {
                http_response_code(503);
                echo json_encode(["status" => "error", "error" => "No se pudo guardar el recordatorio."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "error" => "Faltan datos obligatorios (client_id, titulo, fecha_vencimiento)."]);
        }
    }
}