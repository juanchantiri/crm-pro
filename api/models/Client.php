<?php

declare(strict_types=1);

class Client
{
    private \PDO $conn;
    private string $table_name = "clients";

    public int $id;
    public int $user_id;
    public string $nombre;
    public string $apellido;
    public ?string $email = null;
    public ?string $telefono = null;
    public ?string $documento = null;
    public string $origen;
    public string $estado;
    
    // Agregamos tipado para mantener la seguridad de PHP 8
    public ?string $producto_interes = null;
    public ?string $monto_estimado = null; 

    public function __construct(\PDO $db)
    {
        $this->conn = $db;
    }

    // ¡ATENCIÓN AL CAMBIO!: Ahora retorna un 'array' en lugar de '\PDOStatement'
    public function getAllByUser(int $userId): array
    {
        // 1. Obtenemos los clientes
        $query = "SELECT * FROM {$this->table_name} WHERE user_id = :user_id ORDER BY creado_en DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $userId, \PDO::PARAM_INT);
        $stmt->execute();

        $clientes = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // 2. HIDRATACIÓN: Buscamos y anidamos las etiquetas para cada cliente
        foreach ($clientes as &$cliente) {
            $queryTags = "
                SELECT t.id, t.nombre, t.color_hex 
                FROM tags t 
                INNER JOIN client_tags ct ON t.id = ct.tag_id 
                WHERE ct.client_id = :client_id
            ";
            $stmtTags = $this->conn->prepare($queryTags);
            $stmtTags->bindParam(":client_id", $cliente['id'], \PDO::PARAM_INT);
            $stmtTags->execute();
            
            // Inyectamos el array de etiquetas dentro del registro del cliente
            $cliente['tags'] = $stmtTags->fetchAll(\PDO::FETCH_ASSOC);
        }

        return $clientes; // Retornamos el array ya procesado
    }

    public function create(): bool
    {
        // Agregamos los nuevos campos a la consulta SQL
        $query = "INSERT INTO {$this->table_name} 
                  (user_id, nombre, apellido, email, telefono, documento, origen, producto_interes, monto_estimado) 
                  VALUES (:user_id, :nombre, :apellido, :email, :telefono, :documento, :origen, :producto_interes, :monto_estimado)";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":user_id", $this->user_id, \PDO::PARAM_INT);
        $stmt->bindParam(":nombre", $this->nombre, \PDO::PARAM_STR);
        $stmt->bindParam(":apellido", $this->apellido, \PDO::PARAM_STR);
        $stmt->bindParam(":email", $this->email, \PDO::PARAM_STR);
        $stmt->bindParam(":telefono", $this->telefono, \PDO::PARAM_STR);
        $stmt->bindParam(":documento", $this->documento, \PDO::PARAM_STR);
        $stmt->bindParam(":origen", $this->origen, \PDO::PARAM_STR);
        
        // Vinculamos los nuevos Smart Fields
        $stmt->bindParam(":producto_interes", $this->producto_interes, \PDO::PARAM_STR);
        $stmt->bindParam(":monto_estimado", $this->monto_estimado, \PDO::PARAM_STR);

        return $stmt->execute();
    }

    public function updateStatus(): bool
    {
        $query = "UPDATE {$this->table_name} 
                  SET estado = :estado 
                  WHERE id = :id AND user_id = :user_id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":estado", $this->estado, \PDO::PARAM_STR);
        $stmt->bindParam(":id", $this->id, \PDO::PARAM_INT);
        $stmt->bindParam(":user_id", $this->user_id, \PDO::PARAM_INT);

        return $stmt->execute();
    }

    public function getById(int $id, int $userId): \PDOStatement
    {
        // LIMIT 1 optimiza la consulta porque sabemos que el ID es único
        $query = "SELECT * FROM {$this->table_name} 
                  WHERE id = :id AND user_id = :user_id 
                  LIMIT 1";
                  
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":id", $id, \PDO::PARAM_INT);
        $stmt->bindParam(":user_id", $userId, \PDO::PARAM_INT);
        $stmt->execute();

        return $stmt;
    }
}