<?php
// /api/Middlewares/SubscriptionMiddleware.php
class SubscriptionMiddleware {
    public static function checkAccess($pdo, $userId) {
        $stmt = $pdo->prepare("SELECT plan_actual, fecha_vencimiento_suscripcion FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            self::reject(401, 'Usuario no encontrado.');
        }

        if ($user['plan_actual'] !== 'free') {
            $vencimiento = strtotime($user['fecha_vencimiento_suscripcion']);
            if (!$vencimiento || $vencimiento < time()) {
                self::reject(402, 'Suscripción vencida. Actualiza tu método de pago.');
            }
        }
    }

    private static function reject($code, $message) {
        http_response_code($code);
        echo json_encode(['status' => 'error', 'message' => $message]);
        exit;
    }
}
?>