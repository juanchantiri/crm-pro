<?php
// /api/controllers/NoteController.php

require_once 'config/Database.php';
require_once 'models/Note.php';

class NoteController {
    private $db;
    private $note;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
        $this->note = new Note($this->db);
    }

    public function processRequest($method, $id) {
        switch ($method) {
            case 'GET':
                // Para las notas, necesitamos saber DE QUÉ cliente las estamos pidiendo.
                // Lo leeremos de la URL así: /api/notes?client_id=1
                $client_id = isset($_GET['client_id']) ? $_GET['client_id'] : null;
                
                if ($client_id) {
                    $this->getNotesByClient($client_id);
                } else {
                    http_response_code(400); // 400 Bad Request
                    echo json_encode(["error" => "Se requiere el parámetro 'client_id' para buscar notas."]);
                }
                break;
            case 'POST':
                $this->createNote();
                break;
            default:
                http_response_code(405);
                echo json_encode(["error" => "Método HTTP no soportado"]);
                break;
        }
    }

    private function getNotesByClient($client_id) {
        $user_id_temporal = $_SESSION['user_id'];
        
        $stmt = $this->note->getAllByClient($client_id, $user_id_temporal);
        $num = $stmt->rowCount();

        if ($num > 0) {
            $notes_arr = array();
            $notes_arr["data"] = array();

            while ($row = $stmt->fetch()) {
                array_push($notes_arr["data"], $row);
            }

            http_response_code(200);
            echo json_encode($notes_arr);
        } else {
            http_response_code(200);
            echo json_encode(["data" => [], "mensaje" => "Este cliente aún no tiene notas en su historial."]);
        }
    }

    private function createNote() {
        $data = json_decode(file_get_contents("php://input"));

        // Validamos que venga el ID del cliente al que le asignamos la nota, y el texto
        if (!empty($data->client_id) && !empty($data->contenido)) {
            
            $this->note->user_id = $_SESSION['user_id']; 
            $this->note->client_id = $data->client_id;
            $this->note->contenido = $data->contenido;

            if ($this->note->create()) {
                http_response_code(201);
                echo json_encode(["status" => "success", "mensaje" => "Nota agregada al historial del cliente."]);
            } else {
                http_response_code(503);
                echo json_encode(["status" => "error", "error" => "No se pudo guardar la nota en la base de datos."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "error" => "Datos incompletos. Se requiere client_id y contenido."]);
        }
    }
}