<?php
// ============================================================
// FORMA — Conexión PDO + helpers base
// ============================================================
require_once __DIR__ . '/config.php';

// Sesión segura
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', APP_ENV === 'production' ? 1 : 0);
ini_set('session.cookie_samesite', 'Strict');
session_start();

// CORS
header('Content-Type: application/json; charset=utf-8');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (APP_ENV === 'development' || $origin === ALLOWED_ORIGIN) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// Conexión PDO (singleton)
function db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    try {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch (PDOException $e) {
        json_error('Error de conexión a base de datos', 500);
    }
    return $pdo;
}

// Respuestas JSON
function json_ok($data = [], int $code = 200): void {
    http_response_code($code);
    echo json_encode(['ok' => true, 'data' => $data], JSON_UNESCAPED_UNICODE);
    exit;
}
function json_error(string $msg, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

// Leer body JSON del request
function body(): array {
    static $data = null;
    if ($data !== null) return $data;
    $raw = file_get_contents('php://input');
    $data = $raw ? (json_decode($raw, true) ?? []) : [];
    return $data;
}

// UUID v4 simple
function uuid(): string {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0,0xffff), mt_rand(0,0xffff),
        mt_rand(0,0xffff),
        mt_rand(0,0x0fff)|0x4000,
        mt_rand(0,0x3fff)|0x8000,
        mt_rand(0,0xffff), mt_rand(0,0xffff), mt_rand(0,0xffff)
    );
}

// Auth guard — requiere sesión activa
function auth_required(): array {
    if (empty($_SESSION['user_id'])) {
        json_error('No autenticado', 401);
    }
    return [
        'id'  => $_SESSION['user_id'],
        'rol' => $_SESSION['user_rol'] ?? 'operador',
    ];
}

// Auth guard — requiere rol admin
function admin_required(): void {
    $u = auth_required();
    if ($u['rol'] !== 'admin') {
        json_error('Permiso denegado', 403);
    }
}

// Método HTTP actual
function method(): string {
    return $_SERVER['REQUEST_METHOD'];
}
