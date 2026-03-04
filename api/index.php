<?php
// /api/index.php

// 1. CONFIGURACIÓN BASE Y SEGURIDAD
session_start();

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS"); 
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. PARSEO INTELIGENTE DE LA URI
$requestMethod = $_SERVER["REQUEST_METHOD"];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uriSegments = explode('/', $uri);

$apiIndex = array_search('api', $uriSegments);
$recurso = $uriSegments[$apiIndex + 1] ?? null;
$id = isset($uriSegments[$apiIndex + 2]) ? (int)$uriSegments[$apiIndex + 2] : null;
$accion = $uriSegments[$apiIndex + 3] ?? null; 

// =========================================================================
// 3. RUTAS PÚBLICAS (No requieren token/sesión)
// =========================================================================
switch ($recurso) {
    case 'check-session':
        if ($requestMethod === 'GET') {
            if (isset($_SESSION['user_id'])) {
                // CORRECCIÓN: Usamos tu clase Database para conectarnos
                require_once 'config/Database.php';
                $db = Database::getInstance()->getConnection();

                $stmt = $db->prepare("SELECT nombre_negocio, plan_actual, fecha_vencimiento_suscripcion FROM users WHERE id = ?");
                $stmt->execute([$_SESSION['user_id']]);
                $userData = $stmt->fetch(PDO::FETCH_ASSOC);
                
                echo json_encode(["status" => "success", "data" => $userData]);
            } else {
                http_response_code(401);
                echo json_encode(["status" => "error", "message" => "No hay sesión"]);
            }
        }
        exit();

    case 'login':
        if ($requestMethod === 'POST') {
            require_once 'controllers/AuthController.php';
            (new AuthController())->login();
        }
        exit();

    case 'logout':
        session_destroy();
        echo json_encode(["status" => "success", "message" => "Sesión cerrada"]);
        exit();
}

// =========================================================================
// 4. MIDDLEWARE DE AUTENTICACIÓN Y SUSCRIPCIÓN GLOBAL
// =========================================================================
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Acceso denegado. No autorizado."]);
    exit();
}

$userId = $_SESSION['user_id']; 

// CORRECCIÓN: Obtenemos la conexión a la BD para el Middleware de Pagos
require_once 'config/Database.php';
$db = Database::getInstance()->getConnection();

require_once 'Middlewares/SubscriptionMiddleware.php';
SubscriptionMiddleware::checkAccess($db, $userId);

// =========================================================================
// 5. ENRUTADOR DE RECURSOS PRIVADOS (El núcleo del CRM)
// =========================================================================
switch ($recurso) {
    case 'clients':
        if ($id && $accion === 'tags' && $requestMethod === 'POST') {
            require_once 'controllers/TagController.php';
            (new TagController())->assignToClient($userId, $id);
            exit();
        }

        require_once 'controllers/ClientController.php';
        (new ClientController())->processRequest($requestMethod, $id, $accion); 
        break;

    case 'notes':
        require_once 'controllers/NoteController.php';
        (new NoteController())->processRequest($requestMethod, $id);
        break;

    case 'reminders':
        require_once 'controllers/ReminderController.php';
        (new ReminderController())->processRequest($requestMethod, $id);
        break;

    case 'tags':
        if ($requestMethod === 'GET') {
            require_once 'controllers/TagController.php';
            (new TagController())->getAll($userId);
        } else {
            http_response_code(405);
            echo json_encode(["status" => "error", "message" => "Método no permitido"]);
        }
        break;

    default:
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Recurso no encontrado: " . htmlspecialchars($recurso)]);
        break;
}
?>