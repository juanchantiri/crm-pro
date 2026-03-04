<?php
require_once 'Models/TagModel.php';

class TagController {
    private $pdo;
    private $tagModel;

    public function __construct() {
        // Conexión autónoma a la base de datos (Adaptada a tu XAMPP local)
        $host = 'localhost';
        $db   = 'db_crm';
        $user = 'root';
        $pass = ''; // Por defecto en XAMPP es vacío

        try {
            $this->pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Instanciamos el modelo pasándole la conexión exitosa
            $this->tagModel = new TagModel($this->pdo);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Error de conexión a BD.']);
            exit;
        }
    }

    // Método para GET /tags
    public function getAll($userId) {
        $tags = $this->tagModel->getTagsByUser($userId);
        http_response_code(200);
        echo json_encode(['status' => 'success', 'data' => $tags]);
    }

    // Método para POST /clients/{id}/tags
    public function assignToClient($userId, $clientId) {
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['nombre']) || empty($data['color_hex'])) {
            http_response_code(422);
            echo json_encode(['status' => 'error', 'message' => 'El nombre y el color son obligatorios.']);
            return;
        }

        $success = $this->tagModel->assignTagToClient($userId, $clientId, trim($data['nombre']), $data['color_hex']);

        if ($success) {
            http_response_code(201);
            echo json_encode(['status' => 'success', 'message' => 'Etiqueta asignada con éxito.']);
        } else {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Error al guardar etiqueta.']);
        }
    }
}
?>