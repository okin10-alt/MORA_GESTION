<?php
// api/auth.php — POST /api/auth.php?action=login|logout|me
require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? '';

// ── LOGIN ──────────────────────────────────────────────────
if ($action === 'login' && method() === 'POST') {
    $b     = body();
    $email = trim($b['email'] ?? '');
    $pass  = $b['password'] ?? '';

    if (!$email || !$pass) json_error('Email y contraseña requeridos');

    $st = db()->prepare('SELECT * FROM usuarios WHERE email = ? AND status = "activo" LIMIT 1');
    $st->execute([$email]);
    $user = $st->fetch();

    if (!$user || !password_verify($pass, $user['pass_hash'])) {
        json_error('Credenciales incorrectas', 401);
    }

    // Registrar último login
    db()->prepare('UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?')->execute([$user['id']]);

    // Iniciar sesión
    session_regenerate_id(true);
    $_SESSION['user_id']     = $user['id'];
    $_SESSION['user_nombre'] = $user['nombre'];
    $_SESSION['user_email']  = $user['email'];
    $_SESSION['user_rol']    = $user['rol'];

    $modulos = $user['modulos'] ? json_decode($user['modulos'], true) : null;

    json_ok([
        'id'      => $user['id'],
        'nombre'  => $user['nombre'],
        'email'   => $user['email'],
        'rol'     => $user['rol'],
        'modulos' => $modulos,
    ]);
}

// ── LOGOUT ─────────────────────────────────────────────────
if ($action === 'logout') {
    session_destroy();
    json_ok(['mensaje' => 'Sesión cerrada']);
}

// ── ME (usuario actual) ────────────────────────────────────
if ($action === 'me') {
    if (empty($_SESSION['user_id'])) json_error('No autenticado', 401);

    $st = db()->prepare('SELECT id, nombre, email, rol, modulos FROM usuarios WHERE id = ?');
    $st->execute([$_SESSION['user_id']]);
    $user = $st->fetch();
    if (!$user) json_error('Usuario no encontrado', 404);

    $user['modulos'] = $user['modulos'] ? json_decode($user['modulos'], true) : null;
    json_ok($user);
}

// ── CAMBIAR CONTRASEÑA ─────────────────────────────────────
if ($action === 'change_password' && method() === 'POST') {
    $u    = auth_required();
    $b    = body();
    $old  = $b['old_password'] ?? '';
    $new  = $b['new_password'] ?? '';

    if (strlen($new) < 6) json_error('La contraseña debe tener al menos 6 caracteres');

    $st = db()->prepare('SELECT pass_hash FROM usuarios WHERE id = ?');
    $st->execute([$u['id']]);
    $row = $st->fetch();

    if (!$row || !password_verify($old, $row['pass_hash'])) {
        json_error('Contraseña actual incorrecta');
    }

    $hash = password_hash($new, PASSWORD_DEFAULT);
    db()->prepare('UPDATE usuarios SET pass_hash = ? WHERE id = ?')->execute([$hash, $u['id']]);
    json_ok(['mensaje' => 'Contraseña actualizada']);
}

json_error('Acción no válida', 404);
