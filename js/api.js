// FORMA — api.js
// Capa de comunicación con el backend PHP (helpers para uso futuro).
// El arranque y autenticación son manejados por db.js y auth.js.

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

// ── CRUD helpers por entidad ───────────────────────────────
const CRUD = {
  crear:      (entidad, datos)     => apiPost(`data.php?entity=${entidad}`, datos),
  actualizar: (entidad, id, datos) => apiPut(`data.php?entity=${entidad}&id=${id}`, datos),
  eliminar:   (entidad, id)        => apiDelete(`data.php?entity=${entidad}&id=${id}`),
};

// ── Nota ───────────────────────────────────────────────────
// El arranque de la app lo maneja db.js (DOMContentLoaded → cargarDB + verificarAuth).
// El login/logout lo maneja auth.js (doLogin, doLogout, verificarAuth).
// Este archivo no registra ningún DOMContentLoaded para evitar conflictos.
