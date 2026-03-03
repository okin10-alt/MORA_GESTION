-- ============================================================
-- FORMA — Schema MySQL
-- Ejecutar en cPanel > phpMyAdmin sobre la BD creada
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '-03:00';

-- ------------------------------------------------------------
-- USUARIOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id          VARCHAR(36)  PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  pass_hash   VARCHAR(255) NOT NULL,
  rol         ENUM('admin','operador','visor') DEFAULT 'operador',
  modulos     JSON,
  status      ENUM('activo','inactivo') DEFAULT 'activo',
  creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP,
  ultimo_login DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- LEADS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
  id          VARCHAR(36)  PRIMARY KEY,
  nom         VARCHAR(100),
  ape         VARCHAR(100),
  emp         VARCHAR(150),
  cargo       VARCHAR(100),
  tel         VARCHAR(50),
  email       VARCHAR(150),
  origen      VARCHAR(50),
  cat         VARCHAR(50),
  tipo        VARCHAR(50),
  score       INT DEFAULT 0,
  ppto        DECIMAL(15,2) DEFAULT 0,
  notas       TEXT,
  loc         VARCHAR(100),
  prov        VARCHAR(100),
  status      VARCHAR(50) DEFAULT 'nuevo',
  area        VARCHAR(50),
  fecha       DATE,
  creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP,
  creado_por  VARCHAR(36),
  FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- OPORTUNIDADES (CRM Ventas)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS oportunidades (
  id          VARCHAR(36)  PRIMARY KEY,
  lead_id     VARCHAR(36),
  titulo      VARCHAR(200),
  cliente     VARCHAR(150),
  empresa     VARCHAR(150),
  valor       DECIMAL(15,2) DEFAULT 0,
  etapa       VARCHAR(50) DEFAULT 'prospecto',
  probabilidad INT DEFAULT 0,
  fecha_cierre DATE,
  notas       TEXT,
  status      VARCHAR(50) DEFAULT 'abierta',
  creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP,
  creado_por  VARCHAR(36),
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
  FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS actividades_opp (
  id          VARCHAR(36) PRIMARY KEY,
  opp_id      VARCHAR(36) NOT NULL,
  tipo        VARCHAR(50),
  descripcion TEXT,
  fecha       DATE,
  creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (opp_id) REFERENCES oportunidades(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- PROYECTOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proyectos (
  id          VARCHAR(36)  PRIMARY KEY,
  nom         VARCHAR(200) NOT NULL,
  cli         VARCHAR(150),
  emp         VARCHAR(150),
  cuit        VARCHAR(30),
  tel         VARCHAR(50),
  email       VARCHAR(150),
  cat         VARCHAR(50),
  tipo        VARCHAR(50),
  area        VARCHAR(50) DEFAULT 'gestión',
  status      VARCHAR(50) DEFAULT 'activo',
  fecha       DATE,
  desc_text   TEXT,
  relev       TEXT,
  creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP,
  creado_por  VARCHAR(36),
  FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS proyecto_archivos (
  id          VARCHAR(36) PRIMARY KEY,
  proyecto_id VARCHAR(36) NOT NULL,
  nombre      VARCHAR(255),
  tamano      BIGINT DEFAULT 0,
  mime_type   VARCHAR(100),
  data_url    LONGTEXT,
  fecha       DATETIME DEFAULT CURRENT_TIMESTAMP,
  subido_por  VARCHAR(36),
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
  FOREIGN KEY (subido_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- SOLICITUDES DE DISEÑO
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS solicitudes (
  id                  VARCHAR(36) PRIMARY KEY,
  proyecto_id         VARCHAR(36),
  tipo                VARCHAR(100),
  prioridad           VARCHAR(50) DEFAULT 'Media',
  responsable         VARCHAR(100),
  brief               TEXT,
  descripcion_completa TEXT,
  referencias         TEXT,
  fecha               DATE,
  status              VARCHAR(50) DEFAULT 'pendiente',
  creado_en           DATETIME DEFAULT CURRENT_TIMESTAMP,
  creado_por          VARCHAR(36),
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE SET NULL,
  FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS solicitud_archivos (
  id            VARCHAR(36) PRIMARY KEY,
  solicitud_id  VARCHAR(36) NOT NULL,
  nombre        VARCHAR(255),
  tamano        BIGINT DEFAULT 0,
  mime_type     VARCHAR(100),
  data_url      LONGTEXT,
  fecha         DATETIME DEFAULT CURRENT_TIMESTAMP,
  subido_por    VARCHAR(36),
  -- origen: indica si vino de proyecto (no duplica data)
  origen        ENUM('upload','proyecto') DEFAULT 'upload',
  proyecto_archivo_id VARCHAR(36),
  FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- PRESUPUESTOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS presupuestos (
  id            VARCHAR(36) PRIMARY KEY,
  numero        VARCHAR(20),
  proyecto_id   VARCHAR(36),
  proyecto_nom  VARCHAR(200),
  cliente       VARCHAR(150),
  cuit          VARCHAR(30),
  fecha         DATE,
  vencimiento   DATE,
  status        ENUM('borrador','enviado','aprobado','rechazado','facturado') DEFAULT 'borrador',
  factura       VARCHAR(50) DEFAULT 'Presupuesto',
  dto           DECIMAL(5,2) DEFAULT 0,
  notas         TEXT,
  total_final   DECIMAL(15,2) DEFAULT 0,
  ganancia_pct  DECIMAL(8,4) DEFAULT 0,
  items_json    LONGTEXT,
  creado_en     DATETIME DEFAULT CURRENT_TIMESTAMP,
  creado_por    VARCHAR(36),
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE SET NULL,
  FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ppto_counter (
  id    INT PRIMARY KEY DEFAULT 1,
  valor INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT IGNORE INTO ppto_counter VALUES (1, 0);

CREATE TABLE IF NOT EXISTS pagos_parciales (
  id            VARCHAR(36) PRIMARY KEY,
  presupuesto_id VARCHAR(36) NOT NULL,
  fecha         DATE,
  monto         DECIMAL(15,2),
  medio         VARCHAR(50),
  notas         TEXT,
  creado_en     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- CONTABILIDAD
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cobros (
  id          VARCHAR(36) PRIMARY KEY,
  presupuesto_id VARCHAR(36),
  cliente     VARCHAR(150),
  concepto    VARCHAR(255),
  monto       DECIMAL(15,2),
  iva         DECIMAL(15,2) DEFAULT 0,
  fecha       DATE,
  tipo        VARCHAR(50),
  medio       VARCHAR(50),
  estado      VARCHAR(50) DEFAULT 'pendiente',
  cuenta      VARCHAR(100),
  creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pagos (
  id          VARCHAR(36) PRIMARY KEY,
  proveedor   VARCHAR(150),
  concepto    VARCHAR(255),
  monto       DECIMAL(15,2),
  iva         DECIMAL(15,2) DEFAULT 0,
  fecha       DATE,
  tipo        VARCHAR(50),
  medio       VARCHAR(50),
  estado      VARCHAR(50) DEFAULT 'pendiente',
  cuenta      VARCHAR(100),
  creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS gastos (
  id          VARCHAR(36) PRIMARY KEY,
  categoria   VARCHAR(100),
  concepto    VARCHAR(255),
  monto       DECIMAL(15,2),
  fecha       DATE,
  responsable VARCHAR(100),
  medio       VARCHAR(50),
  estado      VARCHAR(50) DEFAULT 'pendiente',
  notas       TEXT,
  creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP
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
  id          VARCHAR(36) PRIMARY KEY,
  numero      VARCHAR(50),
  banco       VARCHAR(100),
  monto       DECIMAL(15,2),
  fecha_emision DATE,
  fecha_cobro  DATE,
  librador    VARCHAR(150),
  beneficiario VARCHAR(150),
  tipo        ENUM('emitido','recibido'),
  status      VARCHAR(50) DEFAULT 'pendiente',
  notas       TEXT,
  creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS empleados (
  id          VARCHAR(36) PRIMARY KEY,
  nombre      VARCHAR(150),
  cargo       VARCHAR(100),
  email       VARCHAR(150),
  tel         VARCHAR(50),
  fecha_ingreso DATE,
  sueldo_base DECIMAL(15,2) DEFAULT 0,
  status      ENUM('activo','inactivo') DEFAULT 'activo',
  creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP
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
  creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE SET NULL
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

-- ------------------------------------------------------------
-- LLAMADAS (Agente de Ventas)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS llamadas (
  id          VARCHAR(36) PRIMARY KEY,
  contacto    VARCHAR(150),
  empresa     VARCHAR(150),
  rubro       VARCHAR(50),
  resultado   VARCHAR(50),
  notas       TEXT,
  fecha_iso   DATE,
  creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP,
  creado_por  VARCHAR(36),
  FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- CONFIGURACIÓN DE LA EMPRESA (compartida)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS config (
  clave   VARCHAR(100) PRIMARY KEY,
  valor   TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO config VALUES
  ('empresa',   'Moradesign'),
  ('moneda',    'ARS'),
  ('cuit',      ''),
  ('direccion', ''),
  ('tel',       ''),
  ('email',     '');

-- ------------------------------------------------------------
-- USUARIO ADMIN POR DEFECTO
-- pass: forma2024 (cambiar después del primer login)
-- hash generado con password_hash('forma2024', PASSWORD_DEFAULT)
-- ------------------------------------------------------------
INSERT IGNORE INTO usuarios (id, nombre, email, pass_hash, rol, status) VALUES
  ('usr-admin-001', 'Administrador', 'admin@forma.app',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSfc6Bm6W',
   'admin', 'activo');
