# FORMA — Guía de instalación en Donweb cPanel
# ════════════════════════════════════════════

## PASO 1 — Crear la base de datos en cPanel

1. Entrar a cPanel → "Bases de datos MySQL"
2. Crear base de datos:     forma_db      (quedará como usuario_forma_db)
3. Crear usuario de BD:     forma_user    (quedará como usuario_forma_user)
4. Asignar usuario a BD con TODOS LOS PRIVILEGIOS
5. Anotar los 3 datos:
   - Nombre BD:    tuusuario_forma_db
   - Usuario BD:   tuusuario_forma_user
   - Contraseña:   la que elegiste

## PASO 2 — Crear subdominio en cPanel

1. cPanel → "Subdominios"
2. Subdominio: forma
3. Dominio:    tudominio.com.ar
4. Directorio: /public_html/forma  (cPanel lo completa solo)
5. Clic en "Crear"

## PASO 3 — Subir archivos por FTP

Conectarse con FileZilla u otro cliente FTP:
- Host:     ftp.tudominio.com.ar  (o la IP del servidor)
- Usuario:  tu usuario de cPanel
- Puerto:   21

Subir TODA la carpeta forma/ a:
  /public_html/forma/

La estructura en el servidor debe quedar:
  /public_html/forma/
    ├── index.html
    ├── .htaccess
    ├── css/
    │   └── styles.css
    ├── js/
    │   ├── core.js
    │   ├── dashboard.js
    │   ├── ventas.js
    │   ├── leads.js
    │   ├── gestion.js
    │   ├── diseno.js
    │   ├── presupuestos.js
    │   ├── contable.js
    │   ├── financiero.js
    │   ├── usuarios.js
    │   ├── agente.js
    │   ├── extra.js
    │   └── api.js
    ├── api/
    │   ├── config.php   ← COMPLETAR CREDENCIALES
    │   ├── db.php
    │   ├── auth.php
    │   ├── data.php
    │   └── sync.php
    └── sql/
        └── forma_schema.sql

## PASO 4 — Editar api/config.php

Abrir api/config.php y completar:

  define('DB_HOST', 'localhost');
  define('DB_NAME', 'tuusuario_forma_db');    ← dato del paso 1
  define('DB_USER', 'tuusuario_forma_user');  ← dato del paso 1
  define('DB_PASS', 'tu_contraseña');         ← dato del paso 1
  define('ALLOWED_ORIGIN', 'https://forma.tudominio.com.ar');

También cambiar SESSION_SECRET por cualquier texto largo aleatorio.

## PASO 5 — Importar el schema SQL

1. cPanel → phpMyAdmin
2. Seleccionar la BD: tuusuario_forma_db
3. Pestaña "Importar"
4. Seleccionar el archivo: sql/forma_schema.sql
5. Clic en "Continuar"

Verificar que se crearon las tablas (deben aparecer ~18 tablas).

## PASO 6 — Primer acceso

Abrir en el navegador: https://forma.tudominio.com.ar

Credenciales iniciales:
  Email:      admin@forma.app
  Contraseña: forma2024

⚠️  CAMBIAR LA CONTRASEÑA INMEDIATAMENTE en Usuarios → tu perfil.

## PASO 7 — Migrar datos existentes (si usabas la versión anterior)

Si tenés datos en localStorage del index.html anterior:
1. Abrir la consola del navegador (F12 → Console)
2. Ejecutar:  migrarLocalStorageAServidor()
3. Confirmar la migración
4. Los datos se copian al servidor y se borra el localStorage

Esto se hace UNA SOLA VEZ.

## PASO 8 — Crear usuarios del equipo

1. Ingresar como admin
2. Ir a Usuarios → Nuevo usuario
3. Asignar rol:
   - admin:    acceso total
   - operador: crear y editar
   - visor:    solo lectura

## PROBLEMAS COMUNES

Error "No autenticado":
→ Verificar que config.php tiene las credenciales correctas
→ Verificar que el schema SQL fue importado

Error de conexión a BD:
→ El nombre de BD y usuario deben incluir el prefijo de cPanel (tuusuario_)
→ Verificar que el usuario tiene privilegios sobre la BD

Los archivos no cargan (404):
→ Verificar que .htaccess está en la raíz
→ Verificar que mod_rewrite está activo (Donweb lo tiene por defecto)

Los archivos adjuntos no se ven:
→ La BD almacena archivos como base64 en LONGTEXT
→ Si los archivos son muy grandes, aumentar max_allowed_packet en MySQL
→ En cPanel → phpMyAdmin → ejecutar:
   SET GLOBAL max_allowed_packet=67108864;

## NOTAS DE SEGURIDAD

- La carpeta sql/ puede eliminarse del servidor una vez importado el schema
- El archivo api/config.php contiene credenciales — nunca exponerlo
- Activar SSL en cPanel si no está activado (Let's Encrypt gratuito)
