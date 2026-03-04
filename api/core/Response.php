<?php

declare(strict_types=1);

namespace Api\Core;

class Response
{
    public static function json(int $statusCode, string $message, array|object $data = []): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=UTF-8');
        
        echo json_encode([
            'status'  => $statusCode >= 200 && $statusCode < 300 ? 'success' : 'error',
            'message' => $message,
            'data'    => $data
        ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        exit;
    }

    public static function error(int $statusCode, string $message, array $errors = []): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=UTF-8');
        
        echo json_encode([
            'status'  => 'error',
            'message' => $message,
            'errors'  => $errors
        ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        exit;
    }
}