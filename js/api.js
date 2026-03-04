// FORMA — api.js
// Capa de comunicación con el backend PHP.
// Reemplaza localStorage: guardar() y cargar() ahora hablan con el servidor.

const API = '/api';

// ── Helpers HTTP ───────────────────────────────────────────
async function apiGet(endpoint) {
  const r = await fetch(`${API}/${endpoint}`, { credentials: 'include' });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'Error del servidor');
  return j.data;
}

async function apiPost(endpoint, body) {
  const r = await fetch(`${API}/${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'Error del servidor');
  return j.data;
}

async function apiPut(endpoint, body) {
  const r = await fetch(`${API}/${endpoint}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'Error del servidor');
  return j.data;
}

async function apiDelete(endpoint) {
  const r = await fetch(`${API}/${endpoint}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'Error del servidor');
  return j.data;
}

// ── Auth ───────────────────────────────────────────────────
async function apiLogin(email, password) {
  return apiPost('auth.php?action=login', { email, password });
}
async function apiLogout() {
  return apiGet('auth.php?action=logout');
}
async function apiMe() {
  return apiGet('auth.php?action=me');
}

// ── Cargar todo el estado desde el servidor ────────────────
// Reemplaza: DB = JSON.parse(localStorage.getItem(DB_KEY))
async function cargarDesdeServidor() {
  try {
    const data = await apiGet('sync.php');
    // Mezclar con la estructura base de DB
    Object.assign(DB, data);
    console.log('✅ Estado cargado desde servidor');
  } catch (e) {
    console.error('❌ Error cargando datos:', e.message);
    mostrarMensaje('Error al conectar con el servidor. Verificá tu conexión.', 'error');
  }
}

// ── Guardar ────────────────────────────────────────────────
// La función guardar() del core.js sigue funcionando para el estado local.
// Además, cada operación CRUD llama al endpoint correspondiente.
// Esta función hace un "flush" completo si algo falló.
async function guardarEnServidor(entidad, id, datos, metodo = 'POST') {
  const endpoint = `data.php?entity=${entidad}${id ? '&id='+id : ''}`;
  try {
    if (metodo === 'POST')   return await apiPost(endpoint, datos);
    if (metodo === 'PUT')    return await apiPut(endpoint, datos);
    if (metodo === 'DELETE') return await apiDelete(endpoint);
  } catch (e) {
    console.error(`Error guardando ${entidad}:`, e.message);
    mostrarMensaje(`Error al guardar. ${e.message}`, 'error');
    throw e;
  }
}

// ── CRUD helpers por entidad ───────────────────────────────
const CRUD = {
  crear:    (entidad, datos)    => guardarEnServidor(entidad, null, datos, 'POST'),
  actualizar:(entidad, id, datos)=> guardarEnServidor(entidad, id, datos, 'PUT'),
  eliminar: (entidad, id)       => guardarEnServidor(entidad, id, null, 'DELETE'),
};

// ── Migrar localStorage → servidor (usar una sola vez) ─────
async function migrarLocalStorageAServidor() {
  const key = 'forma_db'; // DB_KEY del core.js
  const raw = localStorage.getItem(key);
  if (!raw) { alert('No hay datos en localStorage para migrar.'); return; }

  if (!confirm('¿Migrar todos los datos locales al servidor? Esto solo se hace una vez.')) return;

  try {
    const datos = JSON.parse(raw);
    const result = await apiPost('sync.php', datos);
    console.log('Migración completa:', result.importado);
    alert('✅ Migración exitosa:\n' + result.importado.join('\n'));
    localStorage.removeItem(key);
    await cargarDesdeServidor();
    renderModulo();
  } catch (e) {
    alert('❌ Error en migración: ' + e.message);
  }
}

// ── Inicialización ─────────────────────────────────────────
// Se llama al arrancar la app en lugar de leer localStorage
async function iniciarApp() {
  try {
    // Verificar sesión activa
    const user = await apiMe();

    // Mostrar app
    DB.config = DB.config || {};
    DB.config.rolActual = user.rol;
    DB.config.usuarioActual = user;

    await cargarDesdeServidor();

    mostrarApp();
    actualizarSidebarUser();
    go('dashboard');

    // Si hay datos en localStorage, ofrecer migración
    if (localStorage.getItem('forma_db')) {
      setTimeout(() => {
        if (confirm('Se detectaron datos locales. ¿Migrarlos al servidor ahora?')) {
          migrarLocalStorageAServidor();
        }
      }, 1000);
    }

  } catch (e) {
    console.log('catch iniciarApp:', e.message);
    mostrarAuth();
    console.log('auth-screen display:', document.getElementById('auth-screen')?.style.display);
  }
}

// ── Override de doLogin para usar API ─────────────────────
// (reemplaza la función del core.js que usaba localStorage)
async function doLogin() {
  const email = document.getElementById('au-email')?.value?.trim();
  const pass  = document.getElementById('au-pass')?.value;
  const btn   = document.querySelector('.auth-btn');
  const err   = document.getElementById('au-error');

  if (!email || !pass) {
    if (err) err.textContent = 'Completá email y contraseña';
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = 'Ingresando...'; }
  if (err) err.textContent = '';

  try {
    const user = await apiLogin(email, pass);
    DB.config = DB.config || {};
    DB.config.rolActual = user.rol;
    DB.config.usuarioActual = user;
    await cargarDesdeServidor();
    mostrarApp();
    actualizarSidebarUser();
    go('dashboard');
  } catch (e) {
    if (err) err.textContent = e.message || 'Credenciales incorrectas';
    if (btn) { btn.disabled = false; btn.textContent = 'Ingresar'; }
  }
}

async function doLogout() {
  await apiLogout().catch(() => {});
  DB = initDB();
  mostrarAuth();
}

// ── Arrancar cuando el DOM esté listo ─────────────────────
document.addEventListener('DOMContentLoaded', () => {
  iniciarApp();
});
