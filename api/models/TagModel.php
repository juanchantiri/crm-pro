<?php
class TagModel {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    // NUEVO: Obtener todas las etiquetas creadas por este usuario
    public function getTagsByUser($userId) {
        $stmt = $this->pdo->prepare("SELECT * FROM tags WHERE user_id = ? ORDER BY nombre ASC");
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Asignar etiqueta al cliente (creándola si no existe)
    public function assignTagToClient($userId, $clientId, $nombre, $colorHex) {
        $stmt = $this->pdo->prepare("SELECT id FROM tags WHERE user_id = ? AND nombre = ?");
        $stmt->execute([$userId, $nombre]);
        $tagId = $stmt->fetchColumn();

        if (!$tagId) {
            $stmt = $this->pdo->prepare("INSERT INTO tags (user_id, nombre, color_hex) VALUES (?, ?, ?)");
            $stmt->execute([$userId, $nombre, $colorHex]);
            $tagId = $this->pdo->lastInsertId();
        }

        $stmt = $this->pdo->prepare("INSERT IGNORE INTO client_tags (client_id, tag_id) VALUES (?, ?)");
        return $stmt->execute([$clientId, $tagId]);
    }
}
?>