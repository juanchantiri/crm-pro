<?php

declare(strict_types=1);

require_once 'config/Database.php';
require_once 'models/Client.php';
require_once 'Core/Response.php';

use Api\Core\Response;

class ClientController
{
    private \PDO $db;
    private Client $client;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
        $this->client = new Client($this->db);
    }

    public function processRequest(string $method, ?int $id, ?string $accion = null): void
    {
        switch ($method) {
            case 'GET':
                $id ? $this->getClient($id) : $this->getAllClients();
                break;
            case 'POST':
                $this->createClient();
                break;
            case 'PUT':
                if ($id && $accion === 'status') {
                    $this->updateStatus($id);
                } else {
                    Response::error(400, "Ruta PUT no válida o falta ID.");
                }
                break;
            default:
                Response::error(405, "Método HTTP no soportado");
        }
    }

    private function getAllClients(): void
    {
        $userId = (int) $_SESSION['user_id'];
        
        // ¡CORRECCIÓN AQUÍ!: getAllByUser ahora devuelve el array directamente, ya hidratado con las etiquetas.
        $clients = $this->client->getAllByUser($userId);

        if (empty($clients)) {
            Response::json(200, "Aún no hay clientes registrados.", []);
        }

        Response::json(200, "Clientes obtenidos exitosamente", $clients);
    }

    private function createClient(): void
    {
        $data = json_decode(file_get_contents("php://input"), true);

        // Validación Estricta
        $errors = $this->validateClientData($data);
        if (!empty($errors)) {
            Response::error(422, "Error de validación", $errors);
        }

        // Asignación con tipado fuerte
        $this->client->user_id   = (int) $_SESSION['user_id'];
        $this->client->nombre    = trim($data['nombre']);
        $this->client->apellido  = trim($data['apellido']);
        $this->client->email     = $data['email'] ?? null;
        $this->client->telefono  = $data['telefono'] ?? null;
        $this->client->documento = $data['documento'] ?? null;
        $this->client->origen    = $data['origen'] ?? 'otro';
        $this->client->producto_interes = !empty($data['producto_interes']) ? (string)$data['producto_interes'] : null;
        $this->client->monto_estimado   = !empty($data['monto_estimado']) ? (string)$data['monto_estimado'] : null;

        if ($this->client->create()) {
            Response::json(201, "Cliente creado exitosamente.");
        }

        Response::error(503, "No se pudo crear el cliente en la base de datos.");
    }

    private function updateStatus(int $id): void
    {
        $data = json_decode(file_get_contents("php://input"), true);
        $nuevoEstado = $data['estado'] ?? '';

        $estadosValidos = ['nuevo', 'contactado', 'negociacion', 'cerrado', 'potencial', 'activo', 'inactivo'];
        
        if (!in_array($nuevoEstado, $estadosValidos, true)) {
            Response::error(400, "Estado no válido.");
        }

        $this->client->id = $id;
        $this->client->user_id = (int) $_SESSION['user_id'];
        $this->client->estado = $nuevoEstado;

        if ($this->client->updateStatus()) {
            Response::json(200, "Estado actualizado exitosamente.");
        }

        Response::error(503, "Error interno al actualizar la base de datos.");
    }

    // Capa de validación aislada
    private function validateClientData(?array $data): array
    {
        $errors = [];
        if (empty($data['nombre']) || strlen(trim($data['nombre'])) < 2) {
            $errors['nombre'] = 'El nombre es obligatorio y debe tener al menos 2 caracteres.';
        }
        if (empty($data['apellido'])) {
            $errors['apellido'] = 'El apellido es obligatorio.';
        }
        if (!empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'El formato del email no es válido.';
        }
        return $errors;
    }
    
    // Obtener un solo cliente por su ID (GET /clients/{id})
    private function getClient(int $id): void
    {
        $userId = (int) $_SESSION['user_id'];
        $stmt = $this->client->getById($id, $userId);
        
        $client = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$client) {
            // Falla rápido si no existe o si es de otra empresa (Multi-Tenant seguro)
            Response::error(404, "Cliente no encontrado o no tienes permisos.");
        }

        Response::json(200, "Detalle del cliente", $client);
    }
}