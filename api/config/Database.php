<?php

class Database {
    // Credenciales de la base de datos (Ajustalas a tu entorno local)
    private $host = "localhost";
    private $db_name = "db_crm";
    private $username = "root"; 
    private $password = ""; 
    
    private $conn;
    
    // Propiedad estática que guardará la única instancia de esta clase
    private static $instance = null;

    // 1. Constructor privado: Evita que se use "new Database()" desde fuera
    private function __construct() {}

    // 2. Método estático para obtener la instancia (Singleton)
    public static function getInstance() {
        if (self::$instance == null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    // 3. Método para establecer y devolver la conexión PDO
    public function getConnection() {
        // Si ya hay una conexión activa, la reutilizamos
        if ($this->conn != null) {
            return $this->conn;
        }

        try {
            // DSN (Data Source Name)
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            
            // Instanciamos PDO
            $this->conn = new PDO($dsn, $this->username, $this->password);
            
            // Configuramos PDO para que lance excepciones (errores) de forma clara
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Configuramos para que por defecto nos devuelva arrays asociativos (ideal para JSON)
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
        } catch(PDOException $exception) {
            // En producción, esto debería guardarse en un log, no mostrarse en pantalla
            die(json_encode(["error" => "Error de conexión a la Base de Datos: " . $exception->getMessage()]));
        }

        return $this->conn;
    }
}