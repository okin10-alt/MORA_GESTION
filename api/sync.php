<?php
// api/sync.php — Sincronización completa del estado de la app
// GET  /api/sync.php        → bajar todo el estado (reemplaza localStorage)
// POST /api/sync.php        → guardar estado completo (migración desde localStorage)
require_once __DIR__ . '/db.php';

$user = auth_required();
$pdo  = db();

// ── GET — cargar todo el estado ────────────────────────────
if (method() === 'GET') {

    $q = fn(string $sql, array $p=[]) => 
        (function() use ($pdo,$sql,$p) {
            $st=$pdo->prepare($sql); $st->execute($p); return $st->fetchAll();
        })();

    // Config como objeto key-value
    $cfgRows = $q('SELECT clave, valor FROM config');
    $config  = ['empresa'=>'Moradesign','moneda'=>'ARS'];
    foreach ($cfgRows as $r) $config[$r['clave']] = $r['valor'];
    $config['rolActual'] = $_SESSION['user_rol'];

    // Presupuestos — deserializar items
    $pptos = $q('SELECT * FROM presupuestos ORDER BY creado_en DESC');
    $pptos = array_map(function($p) {
        $p['items'] = $p['items_json'] ? json_decode($p['items_json'], true) : [];
        unset($p['items_json']);
        // pagos parciales se cargan abajo
        $p['pagosParciales'] = [];
        return $p;
    }, $pptos);

    // Pagos parciales → asociar a presupuesto
    $pagParciales = $q('SELECT * FROM pagos_parciales ORDER BY creado_en');
    foreach ($pagParciales as $pg) {
        foreach ($pptos as &$pto) {
            if ($pto['id'] === $pg['presupuesto_id']) {
                $pto['pagosParciales'][] = $pg;
            }
        }
    }

    // Archivos de proyectos y solicitudes
    $proyArchivos = $q('SELECT * FROM proyecto_archivos ORDER BY fecha');
    $solArchivos  = $q('SELECT * FROM solicitud_archivos ORDER BY fecha');

    // Proyectos → agregar archivos
    $proyectos = $q('SELECT * FROM proyectos ORDER BY creado_en DESC');
    foreach ($proyectos as &$pr) {
        $pr['files'] = array_values(array_filter($proyArchivos, fn($a) => $a['proyecto_id'] === $pr['id']));
        // mapear campos al formato JS esperado
        $pr['desc'] = $pr['desc_text'] ?? '';
        unset($pr['desc_text']);
    }

    // Solicitudes → agregar archivos
    $solicitudes = $q('SELECT * FROM solicitudes ORDER BY creado_en DESC');
    foreach ($solicitudes as &$sol) {
        $solFiles = array_values(array_filter($solArchivos, fn($a) => $a['solicitud_id'] === $sol['id']));
        // Archivos con origen='proyecto' → referencian proyecto_archivo_id, no duplican data_url
        $sol['files'] = array_map(function($a) use ($proyArchivos) {
            if ($a['origen'] === 'proyecto' && $a['proyecto_archivo_id']) {
                // Buscar el archivo original en proyectos
                $orig = array_filter($proyArchivos, fn($p) => $p['id'] === $a['proyecto_archivo_id']);
                if ($orig) {
                    $orig = array_values($orig)[0];
                    $a['dataUrl'] = $orig['data_url'];
                    $a['nombre']  = $a['nombre'] ?: $orig['nombre'];
                    $a['tamano']  = $a['tamano']  ?: $orig['tamano'];
                }
            }
            $a['dataUrl'] = $a['dataUrl'] ?? $a['data_url'] ?? '';
            return $a;
        }, $solFiles);
        $sol['proyId'] = $sol['proyecto_id'];
    }

    // Llamadas — solo del usuario actual (privado)
    $llamadas = $q('SELECT * FROM llamadas WHERE creado_por = ? ORDER BY creado_en DESC', [$user['id']]);

    // Usuarios — solo para admin
    $usuarios = [];
    if ($_SESSION['user_rol'] === 'admin') {
        $usuarios = $q('SELECT id, nombre, email, rol, modulos, status, creado_en FROM usuarios');
        $usuarios = array_map(function($u) {
            $u['modulos'] = $u['modulos'] ? json_decode($u['modulos'], true) : null;
            return $u;
        }, $usuarios);
    }

    // Counter de presupuestos
    $ctr = $pdo->query('SELECT valor FROM ppto_counter WHERE id=1')->fetchColumn();

    json_ok([
        'config'       => $config,
        'leads'        => $q('SELECT * FROM leads ORDER BY creado_en DESC'),
        'oportunidades'=> $q('SELECT * FROM oportunidades ORDER BY creado_en DESC'),
        'proyectos'    => $proyectos,
        'solicitudes'  => $solicitudes,
        'presupuestos' => $pptos,
        'cobros'       => $q('SELECT * FROM cobros ORDER BY fecha DESC'),
        'pagos'        => $q('SELECT * FROM pagos ORDER BY fecha DESC'),
        'gastos'       => $q('SELECT * FROM gastos ORDER BY fecha DESC'),
        'movBancarios' => $q('SELECT * FROM mov_bancarios ORDER BY fecha DESC'),
        'cheques'      => $q('SELECT * FROM cheques ORDER BY fecha_cobro DESC'),
        'empleados'    => $q('SELECT * FROM empleados ORDER BY nombre'),
        'sueldos'      => $q('SELECT * FROM sueldos ORDER BY creado_en DESC'),
        'retenciones'  => $q('SELECT * FROM retenciones ORDER BY fecha DESC'),
        'llamadas'     => $llamadas,
        'contactos'    => $q('SELECT * FROM leads ORDER BY creado_en DESC'), // alias
        'usuarios'     => $usuarios,
        'pptoCounter'  => (int)$ctr,
    ]);
}

// ── POST — migración única desde localStorage ──────────────
// Solo se usa una vez para importar datos existentes
if (method() === 'POST') {
    if ($user['rol'] !== 'admin') json_error('Solo el admin puede migrar datos', 403);

    $b   = body();
    $pdo = db();
    $imported = [];

    $insert = function(string $table, array $row) use ($pdo) {
        if (empty($row['id'])) $row['id'] = (function() {
            return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff),
                mt_rand(0,0x0fff)|0x4000,mt_rand(0,0x3fff)|0x8000,
                mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff));
        })();
        $cols = implode(',', array_map(fn($k)=>"`$k`", array_keys($row)));
        $vals = implode(',', array_fill(0, count($row), '?'));
        try {
            $pdo->prepare("INSERT IGNORE INTO `$table` ($cols) VALUES ($vals)")->execute(array_values($row));
        } catch (\Throwable $e) {
            // Ignorar duplicados silenciosamente
        }
        return $row['id'];
    };

    // Config
    if (!empty($b['config'])) {
        foreach ($b['config'] as $k => $v) {
            if (is_string($v)) {
                $pdo->prepare('INSERT INTO config (clave,valor) VALUES(?,?) ON DUPLICATE KEY UPDATE valor=?')
                    ->execute([$k,$v,$v]);
            }
        }
        $imported[] = 'config';
    }

    // Entidades simples
    $simple = [
        'leads'        => 'leads',
        'oportunidades'=> 'oportunidades',
        'cobros'       => 'cobros',
        'pagos'        => 'pagos',
        'gastos'       => 'gastos',
        'empleados'    => 'empleados',
        'retenciones'  => 'retenciones',
        'llamadas'     => 'llamadas',
    ];
    foreach ($simple as $key => $table) {
        if (!empty($b[$key]) && is_array($b[$key])) {
            foreach ($b[$key] as $row) {
                $row = array_filter($row, fn($v) => !is_array($v) && $v !== null);
                $insert($table, $row);
            }
            $imported[] = $key . ' (' . count($b[$key]) . ')';
        }
    }

    // Proyectos + archivos
    if (!empty($b['proyectos'])) {
        foreach ($b['proyectos'] as $p) {
            $files = $p['files'] ?? [];
            $p['desc_text'] = $p['desc'] ?? '';
            unset($p['files'], $p['desc'], $p['diseniosCompletados']);
            $p = array_filter($p, fn($v) => !is_array($v) && $v !== null);
            $pid = $insert('proyectos', $p);
            foreach ($files as $f) {
                $f['proyecto_id'] = $pid;
                $f['data_url']    = $f['dataUrl'] ?? $f['data_url'] ?? '';
                $f['subido_por']  = $user['id'];
                unset($f['dataUrl']);
                $f = array_filter($f, fn($v) => $v !== null);
                $insert('proyecto_archivos', $f);
            }
        }
        $imported[] = 'proyectos (' . count($b['proyectos']) . ')';
    }

    // Solicitudes + archivos
    if (!empty($b['solicitudes'])) {
        foreach ($b['solicitudes'] as $s) {
            $files = $s['files'] ?? [];
            $s['proyecto_id'] = $s['proyId'] ?? null;
            unset($s['files'], $s['proyId'], $s['requerimientos'], $s['entregables']);
            $s = array_filter($s, fn($v) => !is_array($v) && $v !== null);
            $sid = $insert('solicitudes', $s);
            foreach ($files as $f) {
                $f['solicitud_id'] = $sid;
                $f['data_url']     = $f['dataUrl'] ?? $f['data_url'] ?? '';
                $f['subido_por']   = $user['id'];
                unset($f['dataUrl']);
                $f = array_filter($f, fn($v) => $v !== null);
                $insert('solicitud_archivos', $f);
            }
        }
        $imported[] = 'solicitudes (' . count($b['solicitudes']) . ')';
    }

    // Presupuestos + pagos parciales
    if (!empty($b['presupuestos'])) {
        foreach ($b['presupuestos'] as $p) {
            $pagos = $p['pagosParciales'] ?? [];
            $p['items_json'] = json_encode($p['items'] ?? [], JSON_UNESCAPED_UNICODE);
            unset($p['items'], $p['pagosParciales']);
            $p = array_filter($p, fn($v) => !is_array($v) && $v !== null);
            $pid2 = $insert('presupuestos', $p);
            foreach ($pagos as $pg) {
                $pg['presupuesto_id'] = $pid2;
                $pg = array_filter($pg, fn($v) => !is_array($v) && $v !== null);
                $insert('pagos_parciales', $pg);
            }
        }
        $imported[] = 'presupuestos (' . count($b['presupuestos']) . ')';
    }

    // Counter presupuestos
    if (!empty($b['pptoCounter'])) {
        $pdo->prepare('UPDATE ppto_counter SET valor=? WHERE id=1')->execute([$b['pptoCounter']]);
        $imported[] = 'pptoCounter';
    }

    json_ok(['importado' => $imported]);
}

json_error('Método no permitido', 405);
