// FORMA — módulo: usuarios

    c('<div class="empty"><i class="fa fa-lock"></i><p>Acceso denegado.</p></div>');
    return;
  }
  const pendientes = DB.usuarios.filter(u => u.status === 'pendiente');
  const activos = DB.usuarios.filter(u => u.status === 'activo');
  const inactivos = DB.usuarios.filter(u => u.status === 'inactivo');

  c(`
    ${pendientes.length ? `
    <div style="background:var(--amber-lt);border:1px solid var(--amber);border-radius:var(--r-lg);padding:14px 18px;margin-bottom:18px">
      <div style="font-size:12px;font-weight:700;color:var(--amber);margin-bottom:10px">
        <i class="fa fa-clock"></i> ${pendientes.length} usuario(s) esperando aprobacióhn
      </div>
      ${pendientes.map(u => usrCard(u)).join('')}
    </div>` : ''}

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--ink2)">
        Usuarios activos (${activos.length})
      </div>
    </div>
    ${activos.map(u => usrCard(u)).join('')}

    ${inactivos.length ? `
    <div style="margin-top:20px">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--ink3);margin-bottom:10px">
        Inactivos (${inactivos.length})
      </div>
      ${inactivos.map(u => usrCard(u)).join('')}
    </div>` : ''}
  `);
}

function usrCard(u) {
  const ini = u.nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const colores = ['#2952d9', '#1a7a4a', '#6d3cbf', '#0e7490', '#b55800'];
  const col = colores[u.nombre.charCodeAt(0) % colores.length];
  const statusBadge = { activo: 'b-green', pendiente: 'b-amber', inactivo: 'b-red' }[u.status] || 'b-gray';
  const modsBadges = (u.modulos || []).filter(m => m !== 'usuarios')
    .map(m => { const mod = MODULOS_ALL.find(x => x.id === m); return mod ? `<span class="badge b-blue" style="font-size:9px">${mod.label}</span>` : ''; }).join(' ');
  return `<div class="usr-card">
    <div class="usr-avatar" style="background:${col}">${ini}</div>
    <div class="usr-info">
      <div class="usr-name">${u.nombre} ${u.id === CURRENT_USER?.id ? '<span style="font-size:10px;color:var(--ink3)">(vos)</span>' : ''}</div>
      <div class="usr-meta">${u.email} · <span class="badge ${statusBadge}" style="font-size:9px">${u.status}</span></div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">${modsBadges}</div>
      ${u.nota ? `<div style="font-size:11px;color:var(--ink3);margin-top:4px;font-style:italic">${u.nota}</div>` : ''}
    </div>
    <button class="btn btn-secondary btn-sm" onclick="editarUsuario('${u.id}')"><i class="fa fa-edit"></i> Editar</button>
  </div>`;
}

function editarUsuario(id) {
  editUsrId = id;
  const u = DB.usuarios.find(x => x.id === id);
  if (!u) return;
  const ini = u.nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const colores = ['#2952d9', '#1a7a4a', '#6d3cbf', '#0e7490', '#b55800'];
  const col = colores[u.nombre.charCodeAt(0) % colores.length];
  document.getElementById('m-usr-title').textContent = 'Editar: ' + u.nombre;
  document.getElementById('m-usr-avatar').textContent = ini;
  document.getElementById('m-usr-avatar').style.background = col;
  document.getElementById('m-usr-name').textContent = u.nombre;
  document.getElementById('m-usr-email').textContent = u.email;
  document.getElementById('m-usr-status').value = u.status;
  document.getElementById('m-usr-nota').value = u.nota || '';

  // Render módulos toggleables
  const grid = document.getElementById('m-usr-modulos');
  const usrMods = u.modulos || [];
  grid.innerHTML = MODULOS_ALL.map(m => `
    <div class="mod-toggle ${usrMods.includes(m.id) ? 'on' : 'off'}" id="tog-${m.id}"
      onclick="toggleModulo('${m.id}')">
      <i class="fa ${m.icon}" style="display:block;margin-bottom:4px;font-size:14px"></i>
      ${m.label}
    </div>`).join('');

  // Botón admin (módulo usuarios)
  const isAdmin = usrMods.includes('usuarios');
  grid.innerHTML += `<div class="mod-toggle ${isAdmin ? 'on' : 'off'}" id="tog-usuarios"
    onclick="toggleModulo('usuarios')">
    <i class="fa fa-users-cog" style="display:block;margin-bottom:4px;font-size:14px"></i>Admin
  </div>`;

  abrir('m-usuario');
}

function toggleModulo(modId) {
  const el = document.getElementById('tog-' + modId);
  if (!el) return;
  el.classList.toggle('on');
  el.classList.toggle('off');
}

function guardarUsuario() {
  const u = DB.usuarios.find(x => x.id === editUsrId);
  if (!u) return;
  u.status = document.getElementById('m-usr-status').value;
  u.nota = document.getElementById('m-usr-nota').value.trim();
  // Recoger módulos seleccionados
  const todosLosIds = [...MODULOS_ALL.map(m => m.id), 'usuarios'];
  u.modulos = todosLosIds.filter(id => {
    const el = document.getElementById('tog-' + id);
    return el && el.classList.contains('on');
  });
  guardar();
  cerrar('m-usuario');
  go('usuarios');
}

function eliminarUsuario() {
  if (editUsrId === CURRENT_USER?.id) { alert('No podés eliminar tu propia cuenta.'); return; }
  if (!confirm('¿Eliminar este usuario permanentemente?')) return;
  DB.usuarios = DB.usuarios.filter(x => x.id !== editUsrId);
  guardar();
  cerrar('m-usuario');
  go('usuarios');
}

// ═══════════════════════════════════════════════
// HELPERS VISUALES
// ═══════════════════════════════════════════════
function score(s) {
