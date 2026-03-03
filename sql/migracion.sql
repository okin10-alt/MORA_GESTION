-- ============================================================
-- FORMA — Migración incremental
-- Solo agrega tablas y columnas que FALTAN.
-- NO modifica ni borra tablas existentes.
-- Ejecutar en phpMyAdmin sobre c2610699_gestion
-- ============================================================

SET NAMES utf8mb4;

-- ------------------------------------------------------------
-- 1. RENOMBRAR solicitudes_diseno → solicitudes
--    (si ya tiene datos, los conserva)
-- ------------------------------------------------------------
RENAME TABLE solicitudes_diseno TO solicitudes;

-- Agregar columna proyecto_id si no existe
ALTER TABLE solicitudes 
  ADD COLUMN IF NOT EXISTS proyecto_id VARCHAR(36) NULL AFTER id,
  ADD COLUMN IF NOT EXISTS creado_por  VARCHAR(36) NULL;

-- ------------------------------------------------------------
-- 2. CREAR tablas que faltan
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS oportunidades (
  id           VARCHAR(36)  PRIMARY KEY,
  lead_id      VARCHAR(36),
  titulo       VARCHAR(200),
  cliente      VARCHAR(150),
  empresa      VARCHAR(150),
  valor        DECIMAL(15,2) DEFAULT 0,
  etapa        VARCHAR(50)   DEFAULT 'prospecto',
  probabilidad INT           DEFAULT 0,
  fecha_cierre DATE,
  notas        TEXT,
  status       VARCHAR(50)   DEFAULT 'abierta',
  creado_en    DATETIME      DEFAULT CURRENT_TIMESTAMP,
  creado_por   VARCHAR(36)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS actividades_opp (
  id          VARCHAR(36) PRIMARY KEY,
  opp_id      VARCHAR(36) NOT NULL,
  tipo        VARCHAR(50),
  descripcion TEXT,
  fecha       DATE,
  creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS proyecto_archivos (
  id          VARCHAR(36) PRIMARY KEY,
  proyecto_id VARCHAR(36) NOT NULL,
  nombre      VARCHAR(255),
  tamano      BIGINT       DEFAULT 0,
  mime_type   VARCHAR(100),
  data_url    LONGTEXT,
  fecha       DATETIME     DEFAULT CURRENT_TIMESTAMP,
  subido_por  VARCHAR(36)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS solicitud_archivos (
  id                  VARCHAR(36) PRIMARY KEY,
  solicitud_id        VARCHAR(36) NOT NULL,
  nombre              VARCHAR(255),
  tamano              BIGINT      DEFAULT 0,
  mime_type           VARCHAR(100),
  data_url            LONGTEXT,
  fecha               DATETIME    DEFAULT CURRENT_TIMESTAMP,
  subido_por          VARCHAR(36),
  origen              ENUM('upload','proyecto') DEFAULT 'upload',
  proyecto_archivo_id VARCHAR(36)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ppto_counter (
  id    INT PRIMARY KEY DEFAULT 1,
  valor INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT IGNORE INTO ppto_counter VALUES (1, 0);

CREATE TABLE IF NOT EXISTS pagos_parciales (
  id             VARCHAR(36) PRIMARY KEY,
  presupuesto_id VARCHAR(36) NOT NULL,
  fecha          DATE,
  monto          DECIMAL(15,2),
  medio          VARCHAR(50),
  notas          TEXT,
  creado_en      DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS mov_bancarios (
  id          VARCHAR(36) PRIMARY KEY,
  fecha       DATE,
  descripcion VARCHAR(255),
  monto       DECIMAL(15,2),
  tipo        ENUM('debito','credito'),
  cuenta      VARCHAR(100),
  conciliado  TINYINT(1) DEFAULT 0,
  creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cheques (
  id            VARCHAR(36) PRIMARY KEY,
  numero        VARCHAR(50),
  banco         VARCHAR(100),
  monto         DECIMAL(15,2),
  fecha_emision DATE,
  fecha_cobro   DATE,
  librador      VARCHAR(150),
  beneficiario  VARCHAR(150),
  tipo          ENUM('emitido','recibido'),
  status        VARCHAR(50) DEFAULT 'pendiente',
  notas         TEXT,
  creado_en     DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS empleados (
  id            VARCHAR(36) PRIMARY KEY,
  nombre        VARCHAR(150),
  cargo         VARCHAR(100),
  email         VARCHAR(150),
  tel           VARCHAR(50),
  fecha_ingreso DATE,
  sueldo_base   DECIMAL(15,2) DEFAULT 0,
  status        ENUM('activo','inactivo') DEFAULT 'activo',
  creado_en     DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sueldos (
  id          VARCHAR(36) PRIMARY KEY,
  empleado_id VARCHAR(36),
  periodo     VARCHAR(20),
  sueldo_base DECIMAL(15,2),
  adicionales DECIMAL(15,2) DEFAULT 0,
  deducciones DECIMAL(15,2) DEFAULT 0,
  neto        DECIMAL(15,2),
  estado      ENUM('pendiente','pagado') DEFAULT 'pendiente',
  fecha_pago  DATE,
  notas       TEXT,
  creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS retenciones (
  id          VARCHAR(36) PRIMARY KEY,
  tipo        VARCHAR(100),
  proveedor   VARCHAR(150),
  cuit        VARCHAR(30),
  monto_base  DECIMAL(15,2),
  porcentaje  DECIMAL(5,2),
  monto       DECIMAL(15,2),
  fecha       DATE,
  numero_cert VARCHAR(50),
  notas       TEXT,
  creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS llamadas (
  id         VARCHAR(36) PRIMARY KEY,
  contacto   VARCHAR(150),
  empresa    VARCHAR(150),
  rubro      VARCHAR(50),
  resultado  VARCHAR(50),
  notas      TEXT,
  fecha_iso  DATE,
  creado_en  DATETIME DEFAULT CURRENT_TIMESTAMP,
  creado_por VARCHAR(36)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 3. COLUMNAS que pueden faltar en tablas existentes
-- ------------------------------------------------------------

-- presupuestos: agregar items_json si no existe
ALTER TABLE presupuestos
  ADD COLUMN IF NOT EXISTS items_json  LONGTEXT   NULL,
  ADD COLUMN IF NOT EXISTS proyecto_id VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS ganancia_pct DECIMAL(8,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vencimiento DATE NULL,
  ADD COLUMN IF NOT EXISTS factura     VARCHAR(50) DEFAULT 'Presupuesto',
  ADD COLUMN IF NOT EXISTS creado_por  VARCHAR(36) NULL;

-- proyectos: agregar columnas que puede necesitar
ALTER TABLE proyectos
  ADD COLUMN IF NOT EXISTS desc_text   TEXT NULL,
  ADD COLUMN IF NOT EXISTS area        VARCHAR(50) DEFAULT 'gestión',
  ADD COLUMN IF NOT EXISTS creado_por  VARCHAR(36) NULL;

-- leads: columnas de integración
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS creado_por  VARCHAR(36) NULL;

-- usuarios: columna modulos y ultimo_login
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS modulos     JSON NULL,
  ADD COLUMN IF NOT EXISTS ultimo_login DATETIME NULL,
  ADD COLUMN IF NOT EXISTS status      ENUM('activo','inactivo') DEFAULT 'activo';

-- config: asegurarse que tenga la estructura key-value
-- (si ya existe con otra estructura, no la toca)

-- ------------------------------------------------------------
-- 4. USUARIO ADMIN por defecto (si no existe)
-- pass: forma2024
-- ------------------------------------------------------------
INSERT IGNORE INTO usuarios (id, nombre, email, pass_hash, rol, status)
SELECT 'usr-admin-001', 'Administrador', 'admin@forma.app',
       '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSfc6Bm6W',
       'admin', 'activo'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE rol = 'admin' LIMIT 1);

-- ------------------------------------------------------------
-- 5. Config base (no pisa valores existentes)
-- ------------------------------------------------------------
INSERT IGNORE INTO config VALUES ('empresa',   'Moradesign');
INSERT IGNORE INTO config VALUES ('moneda',    'ARS');
INSERT IGNORE INTO config VALUES ('cuit',      '');
INSERT IGNORE INTO config VALUES ('direccion', '');

-- ¡Listo! Verificar que no haya errores arriba antes de continuar.
SELECT 'Migración completada' AS resultado;
