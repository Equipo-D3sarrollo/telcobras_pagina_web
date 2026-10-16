<?php
declare(strict_types=1);

function leerEnv(string $key, ?string $default = null): ?string
{
    $value = getenv($key);
    if ($value === false || $value === '') {
        return $default;
    }
    return $value;
}

function conectarBD(): PDO
{
    $host = leerEnv('DB_HOST', '127.0.0.1');
    $port = leerEnv('DB_PORT', '3306');
    $name = leerEnv('DB_NAME', 'telcobras');
    $user = leerEnv('DB_USER', 'root');
    $pass = leerEnv('DB_PASS', '');
    $charset = leerEnv('DB_CHARSET', 'utf8mb4');

    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', $host, $port, $name, $charset);

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_STRINGIFY_FETCHES => false,
    ];

    try {
        return new PDO($dsn, $user, $pass, $options);
    } catch (PDOException $e) {
        error_log('Error de conexion a la base de datos: ' . $e->getMessage());
        http_response_code(500);
        throw new RuntimeException('No se pudo conectar a la base de datos.');
    }
}

if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    header('Content-Type: application/json; charset=utf-8');

    try {
        $pdo = conectarBD();

        $stmt = $pdo->prepare('SELECT id, nombre, correo FROM solicitudes WHERE id = :id');
        $stmt->execute([':id' => 1]);
        $fila = $stmt->fetch();

        echo json_encode([
            'estado' => 'conexion_ok',
            'fila' => $fila ?: null,
        ], JSON_UNESCAPED_UNICODE);
    } catch (Throwable $e) {
        echo json_encode(['estado' => 'error', 'detalle' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
}
