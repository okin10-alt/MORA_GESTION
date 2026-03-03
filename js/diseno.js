// FORMA — módulo: diseno


function diseno() {
  titulo('Diseño');
  actions(`
    <button class="btn btn-secondary btn-sm" onclick="toggleArchivoDisenos()" id="btn-archivo-dis">
      <i class="fa fa-archive"></i> ${window.verArchivoDisenos?'Ver Activos':'Archivo Completados'}
    </button>
    <button class="btn btn-primary" onclick="nuevaSolicitud()"><i class="fa fa-plus"></i> Nueva Solicitud</button>
  `);
  if (!window.verArchivoDisenos) window.verArchivoDisenos = false;
  // Separar activos de completados
  const activos    = DB.solicitudes.filter(s => s.status !== 'completado');
  const archivados = DB.solicitudes.filter(s => s.status === 'completado');
  const items = (window.verArchivoDisenos ? archivados : activos).filter(s =>
    !searchQ ||
    (s.brief||'').toLowerCase().includes(searchQ) ||
    getProy(s.proyId)?.nom?.toLowerCase().includes(searchQ)
  );

  if (!items.length) {
    c(`<div class="empty"><i class="fa fa-pen-nib"></i><p>Sin solicitudes de diseño.</p><button class="btn btn-primary" onclick="nuevaSolicitud()"><i class="fa fa-plus"></i> Nueva Solicitud</button></div>`);
    return;
  }

  const PRIOR_BADGE = { Alta:'b-red', Media:'b-amber', Baja:'b-gray' };
  const EST_BADGE   = { pendiente:'b-gray', 'En proceso':'b-blue', completado:'b-green' };
  const EST_LABEL   = { pendiente:'Pendiente', 'En proceso':'En proceso', completado:'Completado' };

  c(`<div class="cards-grid">${items.map(s => {
    const p = getProy(s.proyId);
    const tieneArchivos = (s.files||[]).length > 0;
    const pBadge  = PRIOR_BADGE[s.prioridad] || 'b-gray';
    const eBadge  = EST_BADGE[s.status] || 'b-gray';
    const eLabel  = EST_LABEL[s.status] || s.status;
    const fechaDisp = s.fecha ? s.fecha.split('-').reverse().join('/') : '';
    return `
    <div class="card" onclick="verDetalleSolicitud('${s.id}')" style="cursor:pointer;padding:0;overflow:hidden">
      <div style="padding:16px 16px 12px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <span class="badge ${eBadge}">${eLabel}</span>
            <span class="badge b-purple">${s.tipo||'—'}</span>
            ${s.prioridad ? `<span class="badge ${pBadge}">${s.prioridad}</span>` : ''}
          </div>
        </div>
        <div class="card-name">${p?.nom || 'Sin proyecto'}</div>
        <div class="card-sub">${p?.cli || ''}</div>
        <div class="card-info" style="margin-top:10px">
          ${s.brief ? `<div class="card-row" style="font-size:12px;color:var(--ink3)"><i class="fa fa-align-left"></i>${s.brief.slice(0,70)}${s.brief.length>70?'…':''}</div>` : ''}
          ${fechaDisp ? `<div class="card-row"><i class="fa fa-calendar" style="color:var(--ink3)"></i>Entrega: ${fechaDisp}</div>` : ''}
          ${s.responsable ? `<div class="card-row"><i class="fa fa-user" style="color:var(--ink3)"></i>${s.responsable}</div>` : ''}
        </div>
      </div>
      ${tieneArchivos ? `
      <div style="background:#fff3cd;border-top:1px solid #ffc107;padding:7px 16px;font-size:11px;color:#856404;display:flex;align-items:center;gap:6px">
        <i class="fa fa-exclamation-triangle"></i>
        <span>${(s.files||[]).length} archivo${(s.files||[]).length>1?'s':''} · Se eliminan en 60 días</span>
      </div>` : ''}
    </div>`;
  }).join('')}</div>`);
}

// ── NUEVA SOLICITUD ──
function nuevaSolicitud() {
  editDisId = null;
  document.getElementById('m-dis-title').textContent = 'Nueva Solicitud de Diseño';
  document.getElementById('dis-btn-label').textContent = 'Crear Solicitud';
  document.getElementById('dis-delete-btn').style.display = 'none';
  ['d-brief','d-descripcion','d-requerimientos','d-entregables','d-referencias'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('d-fecha').value = '';
  document.getElementById('d-tipo').value = 'Logo';
  document.getElementById('d-prioridad').value = 'Media';
  document.getElementById('d-responsable').value = 'Equipo de Diseño';
  llenarSelectProyectosD();
  abrir('m-diseno');
}

function nuevaSolicitudPara(proyId) {
  cerrar('m-detalle');
  nuevaSolicitud();
  setTimeout(() => { document.getElementById('d-proy').value = proyId; }, 80);
}

// ── VER DETALLE ──
function verDetalleSolicitud(id) {
  const s = DB.solicitudes.find(x => x.id === id);
  if (!s) return;
  disSolSeleccionada = s;
  renderDetalleSolicitud();
  abrir('m-dis-detalle');
}

// compatibilidad con código viejo
function verSolicitud(id) { verDetalleSolicitud(id); }

function renderDetalleSolicitud() {
  const s = disSolSeleccionada;
  if (!s) return;
  const p = getProy(s.proyId);
  const PRIOR_BADGE = { Alta:'b-red', Media:'b-amber', Baja:'b-gray' };
  const EST_BADGE   = { pendiente:'b-gray', 'En proceso':'b-blue', completado:'b-green' };
  const EST_LABEL   = { pendiente:'Pendiente', 'En proceso':'En proceso', completado:'Completado' };
  const fechaDisp = s.fecha ? s.fecha.split('-').reverse().join('/') : '—';

  document.getElementById('m-dis-det-title').textContent = `Solicitud #${s.id?.slice(-8)||'—'}`;
  document.getElementById('m-dis-det-sub').textContent   = `${p?.nom||'Sin proyecto'} · ${p?.cli||''}`;

  const reqs = Array.isArray(s.requerimientos) ? s.requerimientos.filter(Boolean) : [];
  const ents = Array.isArray(s.entregables)    ? s.entregables.filter(Boolean)    : [];
  const archivos = s.files || [];

  document.getElementById('dis-detalle-body').innerHTML = `
    <!-- Header -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid var(--border)">
      <div style="padding:18px 22px;border-right:1px solid var(--border)">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--ink3);margin-bottom:8px">Proyecto</div>
        <div style="font-size:16px;font-weight:700">${p?.nom||'Sin proyecto'}</div>
        <div style="font-size:12px;color:var(--ink3);margin-top:3px">${p?.cli||''}</div>
      </div>
      <div style="padding:18px 22px">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--ink3);margin-bottom:8px">Detalles</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          <span class="badge b-purple">${s.tipo||'—'}</span>
          <span class="badge ${EST_BADGE[s.status]||'b-gray'}">${EST_LABEL[s.status]||s.status}</span>
          ${s.prioridad ? `<span class="badge ${PRIOR_BADGE[s.prioridad]||'b-gray'}">${s.prioridad}</span>` : ''}
        </div>
      </div>
    </div>

    <!-- Fechas y responsable -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;border-bottom:1px solid var(--border);background:var(--surface2)">
      ${[
        ['Creado', s.creadoEn||'—'],
        ['Entrega', fechaDisp],
        ['Responsable', s.responsable||'Equipo de Diseño']
      ].map(([lbl,val]) => `
        <div style="padding:12px 20px;border-right:1px solid var(--border)">
          <div style="font-size:10px;color:var(--ink3);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">${lbl}</div>
          <div style="font-size:13px;font-weight:600">${val}</div>
        </div>`).join('')}
    </div>

    <!-- Brief -->
    ${s.brief ? `
    <div style="padding:18px 22px;border-bottom:1px solid var(--border)">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--ink3);margin-bottom:8px"><i class="fa fa-align-left" style="margin-right:5px"></i>Brief</div>
      <div style="font-size:14px;line-height:1.6;color:var(--ink2)">${s.brief}</div>
    </div>` : ''}

    <!-- Descripción -->
    ${s.descripcionCompleta ? `
    <div style="padding:18px 22px;border-bottom:1px solid var(--border)">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--ink3);margin-bottom:8px"><i class="fa fa-file-alt" style="margin-right:5px"></i>Descripción completa</div>
      <div style="font-size:13px;line-height:1.7;color:var(--ink2)">${s.descripcionCompleta}</div>
    </div>` : ''}

    <!-- Requerimientos -->
    ${reqs.length ? `
    <div style="padding:18px 22px;border-bottom:1px solid var(--border)">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--ink3);margin-bottom:10px"><i class="fa fa-check-square" style="margin-right:5px"></i>Requerimientos</div>
      <ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:5px">
        ${reqs.map(r => `<li style="font-size:13px;color:var(--ink2)">${r}</li>`).join('')}
      </ul>
    </div>` : ''}

    <!-- Entregables -->
    ${ents.length ? `
    <div style="padding:18px 22px;border-bottom:1px solid var(--border);background:var(--accent-lt)">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--accent);margin-bottom:10px"><i class="fa fa-box" style="margin-right:5px"></i>Entregables</div>
      <ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:5px;border-left:3px solid var(--accent);padding-left:14px;list-style:none">
        ${ents.map(e => `<li style="font-size:13px;color:var(--ink2)"><i class="fa fa-check" style="color:var(--accent);margin-right:6px;font-size:10px"></i>${e}</li>`).join('')}
      </ul>
    </div>` : ''}

    <!-- Referencias -->
    ${s.referencias ? `
    <div style="padding:18px 22px;border-bottom:1px solid var(--border);background:var(--amber-lt)">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--amber);margin-bottom:8px"><i class="fa fa-images" style="margin-right:5px"></i>Referencias visuales</div>
      <div style="font-size:13px;line-height:1.6;color:var(--ink2)">${s.referencias}</div>
    </div>` : ''}

    <!-- Archivos -->
    <div style="padding:18px 22px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--ink3);margin-bottom:10px"><i class="fa fa-paperclip" style="margin-right:5px"></i>Archivos adjuntos</div>
      ${archivos.length ? `
        <div style="display:flex;flex-direction:column;gap:0;border:1px solid var(--border);border-radius:var(--r);overflow:hidden">
          ${archivos.map((a,i) => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:${i<archivos.length-1?'1px solid var(--border)':'none'};background:var(--surface)">
            <div style="display:flex;align-items:center;gap:10px">
              <i class="fa fa-file" style="color:var(--ink3);font-size:16px"></i>
              <div>
                <div style="font-size:13px;font-weight:500">${a.nombre||a.name||'Archivo'}</div>
                <div style="font-size:11px;color:var(--ink4)">${((a.tamano||a.size||0)/1024/1024).toFixed(2)} MB</div>
              </div>
            </div>
          </div>`).join('')}
        </div>
        <div style="margin-top:10px;padding:8px 12px;background:#fff3cd;border:1px solid #ffc107;border-radius:var(--r);font-size:11px;color:#856404;display:flex;gap:8px;align-items:center">
          <i class="fa fa-exclamation-triangle"></i>
          <span>Los archivos se eliminan automáticamente a los 60 días para optimizar almacenamiento.</span>
        </div>
      ` : `
        <div style="text-align:center;padding:24px;color:var(--ink4)">
          <i class="fa fa-folder-open" style="font-size:28px;margin-bottom:8px;display:block;opacity:.3"></i>
          <div style="font-size:12px">Sin archivos adjuntos</div>
          <button class="btn btn-secondary btn-sm" onclick="abrirSubirArchivos()" style="margin-top:10px"><i class="fa fa-upload"></i> Subir archivos</button>
        </div>
      `}
    </div>`;
}

// ── EDITAR SOLICITUD ──
function editarSolicitudDesde() {
  const s = disSolSeleccionada;
  if (!s) return;
  editDisId = s.id;
  document.getElementById('m-dis-title').textContent = 'Editar Solicitud';
  document.getElementById('dis-btn-label').textContent = 'Guardar Cambios';
  document.getElementById('dis-delete-btn').style.display = 'block';
  llenarSelectProyectosD();
  setTimeout(() => {
    document.getElementById('d-proy').value = s.proyId || '';
    document.getElementById('d-tipo').value = s.tipo || 'Logo';
    document.getElementById('d-prioridad').value = s.prioridad || 'Media';
    document.getElementById('d-fecha').value = s.fecha || '';
    document.getElementById('d-responsable').value = s.responsable || 'Equipo de Diseño';
    document.getElementById('d-brief').value = s.brief || '';
    document.getElementById('d-descripcion').value = s.descripcionCompleta || '';
    document.getElementById('d-requerimientos').value = (s.requerimientos||[]).join(', ');
    document.getElementById('d-entregables').value = (s.entregables||[]).join(', ');
    document.getElementById('d-referencias').value = s.referencias || '';
  }, 50);
  cerrar('m-dis-detalle');
  abrir('m-diseno');
}

function llenarSelectProyectosD() {
  const sel = document.getElementById('d-proy');
  sel.innerHTML = '<option value="">— Seleccionar proyecto —</option>' +
    DB.proyectos.map(p => `<option value="${p.id}">${p.nom} (${p.cli||''})</option>`).join('');
}

function guardarDiseno() {
  const proyId = document.getElementById('d-proy').value;
  if (!proyId) { alert('Seleccioná un proyecto'); return; }
  const brief = v('d-brief');
  if (!brief) { alert('El brief es obligatorio'); return; }
  const fecha = v('d-fecha');
  if (!fecha) { alert('La fecha de entrega es obligatoria'); return; }

  const reqs = v('d-requerimientos').split(',').map(x=>x.trim()).filter(Boolean);
  const ents = v('d-entregables').split(',').map(x=>x.trim()).filter(Boolean);

  const data = {
    proyId,
    tipo:               document.getElementById('d-tipo').value,
    prioridad:          document.getElementById('d-prioridad').value,
    fecha,
    responsable:        v('d-responsable') || 'Equipo de Diseño',
    brief,
    descripcionCompleta: v('d-descripcion'),
    requerimientos:     reqs,
    entregables:        ents,
    referencias:        v('d-referencias'),
    status:             editDisId ? (DB.solicitudes.find(x=>x.id===editDisId)?.status || 'pendiente') : 'pendiente'
  };

  if (editDisId) {
    const i = DB.solicitudes.findIndex(x => x.id === editDisId);
    if (i >= 0) {
      DB.solicitudes[i] = { ...DB.solicitudes[i], ...data };
      disSolSeleccionada = DB.solicitudes[i];
    }
  } else {
    const nueva = { ...data, id: 'sol-'+Date.now(), creadoEn: hoy(), files: [] };
    DB.solicitudes.push(nueva);
    disSolSeleccionada = nueva;
  }
  guardar();
  cerrar('m-diseno');
  go(modulo);
}

function eliminarSolicitud() {
  if (!confirm('¿Eliminar esta solicitud? Esta acción no se puede deshacer.')) return;
  DB.solicitudes = DB.solicitudes.filter(x => x.id !== editDisId);
  guardar();
  cerrar('m-diseno');
  go(modulo);
}

// ── CAMBIAR ESTADO ──
function abrirCambiarEstado() {
  const s = disSolSeleccionada;
  if (!s) return;
  const p = getProy(s.proyId);
  document.getElementById('dis-est-nombre').textContent = p?.nom || '—';
  const badgeEl = document.getElementById('dis-est-actual');
  const EST_BADGE = { pendiente:'b-gray', 'En proceso':'b-blue', completado:'b-green' };
  badgeEl.className = `badge ${EST_BADGE[s.status]||'b-gray'}`;
  badgeEl.textContent = s.status;
  document.getElementById('dis-nuevo-estado').value = s.status;
  abrir('m-dis-estado');
}

function guardarEstadoSolicitud() {
  const nuevoEstado = document.getElementById('dis-nuevo-estado').value;
  const s = disSolSeleccionada;
  if (!s) return;
  const i = DB.solicitudes.findIndex(x => x.id === s.id);
  if (i >= 0) { DB.solicitudes[i].status = nuevoEstado; disSolSeleccionada = DB.solicitudes[i]; }

  // ── TRAZABILIDAD: si se marca completado, notificar en proyecto ──
  if (nuevoEstado === 'completado' && s.proyId) {
    const pi = DB.proyectos.findIndex(x => x.id === s.proyId);
    if (pi >= 0) {
      if (!DB.proyectos[pi].diseniosCompletados) DB.proyectos[pi].diseniosCompletados = [];
      DB.proyectos[pi].diseniosCompletados.push({
        solId: s.id,
        tipo: s.tipo || '—',
        brief: s.brief || '',
        fechaCompletado: new Date().toISOString().slice(0,10)
      });
    }
  }

  guardar();
  cerrar('m-dis-estado');
  renderDetalleSolicitud();
  go(modulo);
}

// ── SUBIR ARCHIVOS ──
function abrirSubirArchivos() {
  const s = disSolSeleccionada;
  if (!s) return;
  const p = getProy(s.proyId);
  document.getElementById('dis-arch-sub').textContent = `${p?.nom||'—'} · ${s.tipo||''}`;
  renderDisArchivos();
  abrir('m-dis-archivos');
}

function renderDisArchivos() {
  const s = disSolSeleccionada;
  if (!s) return;
  const archivos = s.files || [];
  document.getElementById('dis-arch-count').textContent = `Archivos adjuntos (${archivos.length})`;
  document.getElementById('dis-arch-lista').innerHTML = archivos.length
    ? archivos.map((a,i) => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:${i<archivos.length-1?'1px solid var(--border)':'none'};background:var(--surface)">
        <div style="display:flex;align-items:center;gap:10px">
          <i class="fa fa-file" style="color:var(--ink3);font-size:16px"></i>
          <div>
            <div style="font-size:13px;font-weight:500">${a.nombre||a.name||'Archivo'}</div>
            <div style="font-size:11px;color:var(--ink4)">${((a.tamano||a.size||0)/1024/1024).toFixed(2)} MB · ${a.fecha?new Date(a.fecha).toLocaleDateString('es-AR'):''}</div>
          </div>
        </div>
        <div style="display:flex;gap:6px">
          <button onclick="descargarArchivo('${a.nombre||a.name||'archivo'}','${a.dataUrl||''}')" style="color:var(--blue);padding:4px 8px;border-radius:var(--r)" title="Descargar"><i class="fa fa-download"></i></button>
          <button onclick="disEliminarArchivo(${i})" style="color:var(--red);padding:4px 8px;border-radius:var(--r)" title="Eliminar"><i class="fa fa-trash"></i></button>
        </div>
      </div>`).join('')
    : '<div style="text-align:center;padding:20px;color:var(--ink4);font-size:12px">Sin archivos adjuntos</div>';
}

function disAgregarArchivos(files) {
  const s = disSolSeleccionada;
  if (!s || !files || files.length === 0) return;
  if (!s.files) s.files = [];
  Array.from(files).forEach(f => {
    s.files.push({
      nombre: f.name,
      tamano: f.size,
      tipo: f.type,
      fecha: new Date().toISOString()
    });
  });
  const i = DB.solicitudes.findIndex(x => x.id === s.id);
  if (i >= 0) DB.solicitudes[i] = s;
  guardar();
  renderDisArchivos();
  renderDetalleSolicitud();
  document.getElementById('dis-file-input').value = '';
}

function disEliminarArchivo(idx) {
  const s = disSolSeleccionada;
  if (!s) return;
  s.files = (s.files||[]).filter((_,i) => i !== idx);
  const i = DB.solicitudes.findIndex(x => x.id === s.id);
  if (i >= 0) DB.solicitudes[i] = s;
  guardar();
  renderDisArchivos();
  renderDetalleSolicitud();
}

function disDrop(event) {
  event.preventDefault();
  document.getElementById('dis-dropzone').style.borderColor = 'var(--border)';
  const files = event.dataTransfer?.files;
  if (files) disAgregarArchivos(files);
}

// Alias legacy
function adjuntarArchivo() {}
function renderFiles() {}

// ══════════════════════════════════════════════════════
// PRESUPUESTOS — CRUD DEL MODAL
// ══════════════════════════════════════════════════════

function nuevoPpto() {
  editPptoId = null;