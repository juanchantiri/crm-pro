<?php
require_once 'config/Database.php';
require_once 'models/User.php';

class AuthController {
    private $db;
    private $user;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
        $this->user = new User($this->db);
    }

    public function login() {
        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->email) && !empty($data->password)) {
            if ($this->user->findByEmail($data->email)) {
                // Verificamos si la contraseña coincide con el hash guardado
                if (password_verify($data->password, $this->user->password_hash)) {
                    
                    // Iniciamos la sesión de PHP
                    if (session_status() === PHP_SESSION_NONE) { session_start(); }
                    
                    $_SESSION['user_id'] = $this->user->id;
                    $_SESSION['nombre_negocio'] = $this->user->nombre_negocio;

                    http_response_code(200);
                    echo json_encode([
                        "status" => "success",
                        "mensaje" => "Login exitoso",
                        "user" => [
                            "id" => $this->user->id,
                            "nombre" => $this->user->nombre_negocio
                        ]
                    ]);
                } else {
                    http_response_code(401);
                    echo json_encode(["status" => "error", "error" => "Contraseña incorrecta"]);
                }
            } else {
                http_response_code(401);
                echo json_encode(["status" => "error", "error" => "El usuario no existe"]);
            }
        }
    }
}