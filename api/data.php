<?php
// api/data.php — API REST para todas las entidades
// GET    /api/data.php?entity=leads          → listar
// GET    /api/data.php?entity=leads&id=xxx   → uno
// POST   /api/data.php?entity=leads          → crear
// PUT    /api/data.php?entity=leads&id=xxx   → actualizar
// DELETE /api/data.php?entity=leads&id=xxx   → eliminar
require_once __DIR__ . '/db.php';

$user   = auth_required();
$entity = $_GET['entity'] ?? '';
$id     = $_GET['id'] ?? '';
$method = method();

// ── Entidades permitidas y sus tablas ──────────────────────
// shared = todos ven y editan | private = solo el dueño
$entities = [
    'leads'              => ['table' => 'leads',             'shared' => true],
    'oportunidades'      => ['table' => 'oportunidades',     'shared' => true],
    'actividades_opp'    => ['table' => 'actividades_opp',   'shared' => true],
    'proyectos'          => ['table' => 'proyectos',         'shared' => true],
    'proyecto_archivos'  => ['table' => 'proyecto_archivos', 'shared' => true],
    'solicitudes'        => ['table' => 'solicitudes',       'shared' => true],
    'solicitud_archivos' => ['table' => 'solicitud_archivos','shared' => true],
    'presupuestos'       => ['table' => 'presupuestos',      'shared' => true],
    'pagos_parciales'    => ['table' => 'pagos_parciales',   'shared' => true],
    'cobros'             => ['table' => 'cobros',            'shared' => true],
    'pagos'              => ['table' => 'pagos',             'shared' => true],
    'gastos'             => ['table' => 'gastos',            'shared' => true],
    'mov_bancarios'      => ['table' => 'mov_bancarios',     'shared' => true],
    'cheques'            => ['table' => 'cheques',           'shared' => true],
    'empleados'          => ['table' => 'empleados',         'shared' => true],
    'sueldos'            => ['table' => 'sueldos',           'shared' => true],
    'retenciones'        => ['table' => 'retenciones',       'shared' => true],
    'llamadas'           => ['table' => 'llamadas',          'shared' => false], // privado por usuario
    'usuarios'           => ['table' => 'usuarios',          'shared' => true,  'admin_only' => true],
    'config'             => ['table' => 'config',            'shared' => true,  'admin_only' => true],
];

if (!isset($entities[$entity])) json_error("Entidad '$entity' no válida", 404);

$cfg   = $entities[$entity];
$table = $cfg['table'];

// Verificar permisos de admin
if (!empty($cfg['admin_only']) && $user['rol'] !== 'admin') {
    json_error('Permiso denegado', 403);
}

// ── GET — listar o uno ─────────────────────────────────────
if ($method === 'GET') {
    if ($id) {
        $st = db()->prepare("SELECT * FROM `$table` WHERE id = ?");
        $st->execute([$id]);
        $row = $st->fetch();
        if (!$row) json_error('No encontrado', 404);
        json_ok(decode_json_fields($row, $entity));
    }

    // Listar — si es privado, filtrar por usuario
    $where  = '';
    $params = [];

    if (!$cfg['shared']) {
        $where  = ' WHERE creado_por = ?';
        $params = [$user['id']];
    }

    // Filtros opcionales por query param
    if (!empty($_GET['proyecto_id'])) {
        $col    = in_array($entity, ['solicitudes']) ? 'proyecto_id' : 'proyecto_id';
        $where  = $where ? "$where AND $col = ?" : " WHERE $col = ?";
        $params[] = $_GET['proyecto_id'];
    }
    if (!empty($_GET['solicitud_id'])) {
        $where  = $where ? "$where AND solicitud_id = ?" : ' WHERE solicitud_id = ?';
        $params[] = $_GET['solicitud_id'];
    }
    if (!empty($_GET['presupuesto_id'])) {
        $where  = $where ? "$where AND presupuesto_id = ?" : ' WHERE presupuesto_id = ?';
        $params[] = $_GET['presupuesto_id'];
    }

    $order = 'ORDER BY ' . (column_exists($table, 'creado_en') ? 'creado_en DESC' : 'id DESC');
    $st = db()->prepare("SELECT * FROM `$table`$where $order");
    $st->execute($params);
    $rows = $st->fetchAll();
    json_ok(array_map(fn($r) => decode_json_fields($r, $entity), $rows));
}

// ── POST — crear ───────────────────────────────────────────
if ($method === 'POST') {
    $b = body();

    // Entidades especiales
    if ($entity === 'config') {
        admin_required();
        foreach ($b as $k => $v) {
            db()->prepare('INSERT INTO config (clave, valor) VALUES (?,?) ON DUPLICATE KEY UPDATE valor=?')
               ->execute([$k, $v, $v]);
        }
        json_ok(['mensaje' => 'Config guardada']);
    }

    if ($entity === 'usuarios') {
        admin_required();
        $pass = $b['password'] ?? 'forma2024';
        $b['pass_hash'] = password_hash($pass, PASSWORD_DEFAULT);
        unset($b['password']);
    }

    $b['id'] = $b['id'] ?? uuid();
    if (column_exists($table, 'creado_por') && empty($b['creado_por'])) {
        $b['creado_por'] = $user['id'];
    }
    if (column_exists($table, 'creado_en') && empty($b['creado_en'])) {
        $b['creado_en'] = date('Y-m-d H:i:s');
    }

    // Serializar campos JSON
    $b = encode_json_fields($b, $entity);

    insert_row($table, $b);
    json_ok(['id' => $b['id']], 201);
}

// ── PUT — actualizar ───────────────────────────────────────
if ($method === 'PUT') {
    if (!$id) json_error('ID requerido');
    $b = body();
    unset($b['id'], $b['creado_en'], $b['creado_por']);

    if ($entity === 'config') {
        admin_required();
        foreach ($b as $k => $v) {
            db()->prepare('UPDATE config SET valor=? WHERE clave=?')->execute([$v, $k]);
        }
        json_ok(['mensaje' => 'Config actualizada']);
    }

    if ($entity === 'usuarios') {
        admin_required();
        if (!empty($b['password'])) {
            $b['pass_hash'] = password_hash($b['password'], PASSWORD_DEFAULT);
        }
        unset($b['password']);
    }

    $b = encode_json_fields($b, $entity);
    update_row($table, $id, $b);
    json_ok(['id' => $id]);
}

// ── DELETE ─────────────────────────────────────────────────
if ($method === 'DELETE') {
    if (!$id) json_error('ID requerido');

    // Solo admin puede eliminar usuarios
    if ($entity === 'usuarios') admin_required();

    $st = db()->prepare("DELETE FROM `$table` WHERE id = ?");
    $st->execute([$id]);
    json_ok(['eliminado' => $id]);
}

json_error('Método no permitido', 405);

// ──────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────

function insert_row(string $table, array $data): void {
    $cols = implode(',', array_map(fn($k) => "`$k`", array_keys($data)));
    $vals = implode(',', array_fill(0, count($data), '?'));
    db()->prepare("INSERT INTO `$table` ($cols) VALUES ($vals)")->execute(array_values($data));
}

function update_row(string $table, string $id, array $data): void {
    if (!$data) return;
    $set = implode(',', array_map(fn($k) => "`$k`=?", array_keys($data)));
    $vals = array_values($data);
    $vals[] = $id;
    db()->prepare("UPDATE `$table` SET $set WHERE id=?")->execute($vals);
}

// Campos que se guardan como JSON en la BD
function json_fields(string $entity): array {
    return match($entity) {
        'presupuestos' => ['items_json'],
        'usuarios'     => ['modulos'],
        default        => [],
    };
}

function encode_json_fields(array $row, string $entity): array {
    // items -> items_json para presupuestos
    if ($entity === 'presupuestos' && isset($row['items'])) {
        $row['items_json'] = json_encode($row['items'], JSON_UNESCAPED_UNICODE);
        unset($row['items']);
    }
    if ($entity === 'usuarios' && isset($row['modulos']) && is_array($row['modulos'])) {
        $row['modulos'] = json_encode($row['modulos']);
    }
    return $row;
}

function decode_json_fields(array $row, string $entity): array {
    if ($entity === 'presupuestos' && isset($row['items_json'])) {
        $row['items'] = $row['items_json'] ? json_decode($row['items_json'], true) : [];
        unset($row['items_json']);
    }
    if ($entity === 'usuarios') {
        if (isset($row['pass_hash'])) unset($row['pass_hash']); // nunca exponer hash
        if (isset($row['modulos']) && $row['modulos']) {
            $row['modulos'] = json_decode($row['modulos'], true);
        }
    }
    if ($entity === 'config') {
        // config es key-value, no hay campos JSON
    }
    return $row;
}

function column_exists(string $table, string $col): bool {
    static $cache = [];
    $key = "$table.$col";
    if (isset($cache[$key])) return $cache[$key];
    try {
        $st = db()->prepare("SHOW COLUMNS FROM `$table` LIKE ?");
        $st->execute([$col]);
        $cache[$key] = (bool)$st->fetch();
    } catch (\Throwable) {
        $cache[$key] = false;
    }
    return $cache[$key];
}
