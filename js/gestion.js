// FORMA — módulo: gestion

function gestion() {
  titulo('Gestión de Proyectos');
  actions(`
    <button class="btn btn-secondary btn-sm" onclick="toggleArchivoProyectos()" id="btn-archivo-proy">
      <i class="fa fa-archive"></i> Archivo
    </button>
    <button class="btn btn-primary" onclick="nuevoProyecto()"><i class="fa fa-plus"></i> Nuevo Proyecto</button>
  `);
  if (!window.verArchivoProyectos) window.verArchivoProyectos = false;
  const estadosArchivo = ['completado','entregado','cancelado'];
  const proyBase = window.verArchivoProyectos
    ? DB.proyectos.filter(p => estadosArchivo.includes(p.status))
    : DB.proyectos.filter(p => !estadosArchivo.includes(p.status));
  const items = proyBase.filter(p =>
    !searchQ || (p.nom + p.cli + (p.emp||'')).toLowerCase().includes(searchQ)
  );

  // Badge: proyectos nuevos transferidos desde Ventas (aún no vistos)
  const transferidos = DB.proyectos.filter(p => p.esTransferido && !p.transferidoVisto);
  const bannerHTML = transferidos.length ? `
  <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);border-radius:var(--r-lg);padding:14px 20px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;gap:16px">
    <div style="display:flex;align-items:center;gap:12px">
      <div style="width:36px;height:36px;background:rgba(255,255,255,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <i class="fa fa-bell" style="color:#fff;font-size:16px"></i>
      </div>
      <div>
        <div style="color:#fff;font-weight:700;font-size:14px">
          ${transferidos.length === 1
            ? `Nuevo prospecto transferido desde Ventas`
            : `${transferidos.length} prospectos nuevos transferidos desde Ventas`}
        </div>
        <div style="color:rgba(255,255,255,.75);font-size:12px;margin-top:2px">
          ${transferidos.map(p => p.nom).join(' · ')}
        </div>
      </div>
    </div>
    <button onclick="marcarTransferidosVistos()" style="background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.4);color:#fff;border-radius:var(--r);padding:6px 14px;cursor:pointer;font-size:12px;font-weight:600;flex-shrink:0">
      Marcar como visto
    </button>
  </div>` : '';

  if (!items.length) {
    c(bannerHTML + `<div class="empty"><i class="fa fa-project-diagram"></i><p>Sin proyectos.</p><button class="btn btn-primary" onclick="nuevoProyecto()"><i class="fa fa-plus"></i> Nuevo Proyecto</button></div>`);
    return;
  }
  c(bannerHTML + `<div class="cards-grid">${items.map(proyCard).join('')}</div>`);
}

function marcarTransferidosVistos() {
  DB.proyectos.forEach(p => { if (p.esTransferido) p.transferidoVisto = true; });
  guardar();
  actualizarBadgeGestion();
  go('gestion');
}

// ── CARD DE PROYECTO ──
function proyCard(p) {
  const ppts = DB.presupuestos.filter(x => x.proyId === p.id);
  const sols = DB.solicitudes.filter(s => s.proyId === p.id);
  const enDiseno = sols.length > 0 || p.area === 'diseño';
  const tieneArchivos = (p.files||[]).length > 0;
    const diseniosOk = (p.diseniosCompletados||[]).length > 0;
  const fechaDisp = p.fecha ? p.fecha.split('-').reverse().join('/') : '';

  return `
  <div class="card" onclick="verProyecto('${p.id}')" style="cursor:pointer;padding:0;overflow:hidden">
    <div style="padding:16px 16px 12px">
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
        ${bStatus(p.status)} ${bArea(p.area)}
      </div>
      <div class="card-name">${p.nom}</div>
      <div class="card-sub">${p.cli}${p.emp ? ' · ' + p.emp : ''}</div>
      <div class="card-info" style="margin-top:10px">
        ${p.cat||p.tipo ? `<div class="card-row"><i class="fa fa-tag"></i>${[p.cat,p.tipo].filter(Boolean).join(' · ')}</div>` : ''}
        ${fechaDisp ? `<div class="card-row"><i class="fa fa-calendar"></i>Límite: ${fechaDisp}</div>` : ''}
        ${ppts.length ? `<div class="card-row"><i class="fa fa-file-invoice-dollar"></i>${ppts.length} presupuesto${ppts.length>1?'s':''}</div>` : ''}
        ${enDiseno ? `<div class="card-row" style="color:#9333ea;font-weight:600"><i class="fa fa-paint-brush"></i>En Diseño</div>` : ''}
      </div>
    </div>
    ${diseniosOk ? `
    <div style="background:var(--green-lt);border-top:1px solid var(--green);padding:7px 16px;font-size:11px;color:var(--green);display:flex;align-items:center;gap:6px">
      <i class="fa fa-check-circle"></i>
      <span>${(p.diseniosCompletados||[]).length} diseño${(p.diseniosCompletados||[]).length>1?'s':''} completado${(p.diseniosCompletados||[]).length>1?'s':''}</span>
    </div>` : ''}
    ${tieneArchivos ? `
    <div style="background:#fff3cd;border-top:1px solid #ffc107;padding:7px 16px;font-size:11px;color:#856404;display:flex;align-items:center;gap:6px">
      <i class="fa fa-exclamation-triangle"></i>
      <span>${(p.files||[]).length} archivo${(p.files||[]).length>1?'s':''} · Se eliminan en 60 días</span>
    </div>` : ''}
    <div class="card-foot" style="padding:10px 16px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border)">
      <span style="font-size:10px;color:var(--ink4)">${p.creadoEn||''}</span>
      <div style="display:flex;gap:6px" onclick="event.stopPropagation()">
        <button class="btn btn-sm btn-secondary" onclick="editarProyecto('${p.id}')" title="Editar"><i class="fa fa-edit"></i></button>
        ${!enDiseno ? `<button class="btn btn-sm" style="background:#f3e8ff;color:#9333ea;border:1px solid #e9d5ff" onclick="enviarADiseno('${p.id}')" title="Enviar a Diseño"><i class="fa fa-paint-brush"></i></button>` : ''}
        <button class="btn btn-sm btn-secondary" onclick="abrirArchivosProyecto('${p.id}')" title="Archivos"><i class="fa fa-upload"></i></button>
        <button class="btn btn-sm" style="color:var(--red)" onclick="eliminarProyectoCascada('${p.id}')" title="Eliminar"><i class="fa fa-trash"></i></button>
      </div>
    </div>
  </div>`;
}

// ── NUEVO PROYECTO ──
function nuevoProyecto() {
  editProjId = null;
  document.getElementById('m-proy-title').textContent = 'Nuevo Proyecto';
  document.getElementById('proy-delete-btn').style.display = 'none';
  document.getElementById('proy-btn-label').textContent = 'Guardar Proyecto';
  ['p-nom','p-cli','p-emp','p-cuit','p-tel','p-email','p-desc','p-relev']
    .forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('p-fecha').value = '';
  document.getElementById('p-cat').value  = 'Oficina';
  document.getElementById('p-tipo').value = 'Diseño integral';
  document.getElementById('p-area').value = 'gestion';
  document.getElementById('p-status').value = 'relevamiento';
  abrir('m-proyecto');
}

// ── EDITAR PROYECTO ──
function editarProyecto(id) {
  editProjId = id;
  const p = DB.proyectos.find(x => x.id === id);
  if (!p) return;
  document.getElementById('m-proy-title').textContent = `Editar: ${p.nom}`;
  document.getElementById('proy-delete-btn').style.display = 'block';
  document.getElementById('proy-btn-label').textContent = 'Guardar Cambios';
  ['nom','cli','emp','cuit','tel','email','desc','relev'].forEach(f => {
    const el = document.getElementById('p-' + f); if (el) el.value = p[f] || '';
  });
  document.getElementById('p-cat').value   = p.cat    || 'Oficina';
  document.getElementById('p-tipo').value  = p.tipo   || 'Diseño integral';
  document.getElementById('p-status').value= p.status || 'relevamiento';
  document.getElementById('p-area').value  = p.area   || 'gestion';
  document.getElementById('p-fecha').value = p.fecha  || '';
  abrir('m-proyecto');
}

// ── GUARDAR PROYECTO ──
function guardarProyecto() {
  const nom = v('p-nom');
  if (!nom) { alert('El nombre es obligatorio'); return; }
  const areaAnt  = editProjId ? DB.proyectos.find(x => x.id === editProjId)?.area : null;
  const areaNueva = document.getElementById('p-area').value;
  const newStatus = document.getElementById('p-status').value;

  const data = {
    nom, cli: v('p-cli'), emp: v('p-emp'), cuit: v('p-cuit'),
    tel: v('p-tel'), email: v('p-email'),
    cat:    document.getElementById('p-cat').value,
    tipo:   document.getElementById('p-tipo').value,
    status: newStatus,
    area:   areaNueva,
    fecha:  v('p-fecha'),
    desc:   v('p-desc'),
    relev:  v('p-relev')
  };

  if (editProjId) {
    const i = DB.proyectos.findIndex(x => x.id === editProjId);
    if (i >= 0) DB.proyectos[i] = { ...DB.proyectos[i], ...data };
    if (areaAnt && areaAnt !== areaNueva) {
      if (!DB.transferencias) DB.transferencias = [];
      DB.transferencias.push({ id: uid(), proyId: editProjId, de: areaAnt, a: areaNueva, nota: 'Transferido', fecha: hoy() });
    }
    // ── STATUS "presupuestar" → crear presupuesto automático ──
    if (newStatus === 'presupuestar') {
      const existePpto = DB.presupuestos.some(pp =>
        pp.proyId === editProjId ||
        (pp.cliente||'').toLowerCase() === data.cli.toLowerCase()
      );
      if (!existePpto) {
        const venc = new Date(); venc.setDate(venc.getDate() + 30);
        const autoPpto = {
          id: uid(), proyId: editProjId,
          numero: 'P-' + String((DB.pptoCounter||3829)+1).padStart(4,'0'),
          cliente: data.emp || data.cli,
          proyNom: nom, cuit: data.cuit || '',
          status: 'borrador', factura: 'B',
          fecha: hoy(), fechaISO: fiDate(),
          dto: '0', notas: 'Presupuesto generado automáticamente desde Gestión de Proyectos.',
          items: [], totalFinal: 0, gananciaPct: 0,
          compraTotal: 0, subtotal: 0, descuento: 0
        };
        DB.pptoCounter = (DB.pptoCounter||3829) + 1;
        DB.presupuestos.push(autoPpto);
        alert(`✅ Presupuesto creado automáticamente para ${data.emp || data.cli}.\nPodés editarlo desde el módulo Presupuestos.`);
      }
    }
  } else {
    DB.proyectos.push({ ...data, id: uid(), creadoEn: hoy(), files: [] });
  }
  guardar();
  cerrar('m-proyecto');
  go(modulo);
}

// ── ELIMINAR PROYECTO CON CASCADA ──
function eliminarProyectoCascada(id) {
  const p = DB.proyectos.find(x => x.id === id);
  if (!p) return;
  const nPpts = DB.presupuestos.filter(x => x.proyId === id).length;
  const nSols = DB.solicitudes.filter(s => s.proyId === id).length;
  const msg = `⚠️ ¿Eliminar el proyecto "${p.nom}"?\n\n` +
    (nPpts ? `• ${nPpts} presupuesto${nPpts>1?'s':''} asociado${nPpts>1?'s':''}\n` : '') +
    (nSols ? `• ${nSols} solicitud${nSols>1?'es':''} de diseño\n\n` : '\n') +
    'Esta acción no se puede deshacer.';
  if (!confirm(msg)) return;
  DB.proyectos    = DB.proyectos.filter(x => x.id !== id);
  DB.presupuestos = DB.presupuestos.filter(x => x.proyId !== id);
  DB.solicitudes  = DB.solicitudes.filter(s => s.proyId !== id);
  guardar();
  cerrar('m-proyecto');
  go(modulo);
}

// ── ENVIAR A DISEÑO ──
function enviarADiseno(id) {
  const p = DB.proyectos.find(x => x.id === id);
  if (!p) return;
  const existe = DB.solicitudes.some(s => s.proyId === id);
  if (existe) { alert('Ya existe una solicitud de diseño para este proyecto.'); return; }
  const sol = {
    id: 'sol-' + Date.now(),
    proyId: id,
    tipo: 'Otro',
    prioridad: 'Media',
    responsable: 'Equipo de Diseño',
    brief: p.desc || `Solicitud de diseño para ${p.nom}`,
    descripcionCompleta: '',
    requerimientos: [],
    entregables: [],
    referencias: '',
    fecha: p.fecha || '',
    status: 'pendiente',
    creadoEn: hoy(),
    files: JSON.parse(JSON.stringify(p.files || []))
  };
  DB.solicitudes.push(sol);
  // Actualizar área del proyecto a diseño
  const i = DB.proyectos.findIndex(x => x.id === id);
  if (i >= 0) DB.proyectos[i].area = 'diseño';
  guardar();
  alert(`✅ Solicitud de diseño creada para "${p.nom}".\nÁrea actualizada a Diseño.`);
  go(modulo);
}

// ── VER DETALLE PROYECTO ──
function verProyecto(id) {
  const p = DB.proyectos.find(x => x.id === id);
  if (!p) return;
  proySeleccionado = p;
  const trans = (DB.transferencias||[]).filter(t => t.proyId === id);
  const sols  = DB.solicitudes.filter(s => s.proyId === id);
  const ppts  = DB.presupuestos.filter(x => x.proyId === id);

  document.getElementById('det-title').textContent = p.nom;
  document.getElementById('det-sub').textContent   = `${p.cli} · ${p.cat||''} · ${p.tipo||''}`;
  document.getElementById('det-edit-btn').onclick  = () => { cerrar('m-detalle'); editarProyecto(id); };

  const stages = ['relevamiento','en-proceso','esperando-diseno','en-diseno','diseno-entregado','presupuestando','presupuesto-enviado','aprobado'];
  const ci = stages.indexOf(p.status);

  document.getElementById('det-body').innerHTML = `
    <!-- Status + área + flujo -->
    <div style="padding:14px 18px;border-bottom:1px solid var(--border);background:var(--surface2)">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
        ${bStatus(p.status)} ${bArea(p.area)}
        ${p.fecha ? `<span class="badge b-amber"><i class="fa fa-calendar"></i> ${p.fecha.split('-').reverse().join('/')}</span>` : ''}
      </div>
      <div class="flow">${stages.map((s,i) => `
        <div class="f-dot ${i<ci?'done':i===ci?'cur':''}" title="${s}">
          <i class="fa ${i<ci?'fa-check':'fa-circle'}" style="font-size:8px"></i>
        </div>${i<stages.length-1?`<div class="f-line ${i<ci?'done':''}"></div>`:''}`).join('')}
      </div>
    </div>

    <!-- Tabs -->
    <div class="dtabs">
      <div class="dtab active" onclick="dtab(this,'dp')">Datos</div>
      <div class="dtab" onclick="dtab(this,'dh')">Historial (${trans.length})</div>
      <div class="dtab" onclick="dtab(this,'dpp')">Presupuestos (${ppts.length})</div>
      ${sols.length?`<div class="dtab" onclick="dtab(this,'ds')">Diseño (${sols.length})</div>`:''}
    </div>

    <div style="padding:18px">
      <!-- Tab Datos -->
      <div id="dp">
        <!-- Sección Cliente -->
        <div style="background:var(--surface2);border-radius:var(--r);padding:14px;margin-bottom:14px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--ink3);margin-bottom:10px"><i class="fa fa-user" style="margin-right:5px"></i>Cliente</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
            ${drow('Nombre', p.cli||'—')}
            ${p.emp ? drow('Empresa', p.emp) : ''}
            ${p.cuit ? drow('CUIT', p.cuit) : ''}
            ${p.tel  ? drow('Teléfono', p.tel) : ''}
            ${p.email? drow('Email', p.email) : ''}
          </div>
        </div>
        <!-- Sección Detalles -->
        <div style="background:var(--surface2);border-radius:var(--r);padding:14px;margin-bottom:14px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--ink3);margin-bottom:10px"><i class="fa fa-info-circle" style="margin-right:5px"></i>Detalles</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
            ${drow('Categoría', p.cat||'—')}
            ${drow('Tipo', p.tipo||'—')}
            ${p.fecha ? drow('Fecha límite', p.fecha.split('-').reverse().join('/')) : ''}
          </div>
        </div>
        ${p.desc ? `
        <div style="margin-bottom:14px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--ink3);margin-bottom:6px"><i class="fa fa-align-left" style="margin-right:5px"></i>Descripción</div>
          <div style="padding:12px;background:var(--surface2);border-radius:var(--r);font-size:13px;line-height:1.6">${p.desc}</div>
        </div>` : ''}
        ${p.relev ? `
        <div style="margin-bottom:14px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--ink3);margin-bottom:6px"><i class="fa fa-search" style="margin-right:5px"></i>Relevamiento</div>
          <div style="padding:12px;background:var(--amber-lt);border-radius:var(--r);font-size:13px;line-height:1.6;color:var(--amber)">${p.relev}</div>
        </div>` : ''}
        <!-- Archivos -->
        ${(p.files||[]).length ? `
        <div style="margin-bottom:14px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--ink3);margin-bottom:6px"><i class="fa fa-paperclip" style="margin-right:5px"></i>Archivos (${(p.files||[]).length})</div>
          <div style="border:1px solid var(--border);border-radius:var(--r);overflow:hidden">
            ${(p.files||[]).slice(0,3).map((f,i) => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 14px;border-bottom:${i<Math.min((p.files||[]).length,3)-1?'1px solid var(--border)':'none'}">
              <div style="display:flex;align-items:center;gap:8px">
                <i class="fa fa-file" style="color:var(--ink3)"></i>
                <div>
                  <div style="font-size:12px;font-weight:500">${f.nombre||f.name||'Archivo'}</div>
                  <div style="font-size:10px;color:var(--ink4)">${((f.tamano||f.size||0)/1024/1024).toFixed(2)} MB</div>
                </div>
              </div>
            </div>`).join('')}
            ${(p.files||[]).length > 3 ? `<div style="padding:8px 14px;font-size:11px;color:var(--ink3);background:var(--surface2)">+${(p.files||[]).length-3} archivo${(p.files||[]).length-3>1?'s':''} más</div>` : ''}
          </div>
        </div>` : ''}
        <!-- Acciones -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
          <button class="btn btn-secondary btn-sm" onclick="cerrar('m-detalle');abrirArchivosProyecto('${id}')"><i class="fa fa-upload"></i> Archivos</button>
          <button class="btn btn-sm" style="background:#f3e8ff;color:#9333ea;border:1px solid #e9d5ff" onclick="cerrar('m-detalle');enviarADiseno('${id}')"><i class="fa fa-paint-brush"></i> Enviar a Diseño</button>
          <button class="btn btn-primary btn-sm" onclick="nuevoPptoParaProy('${id}')"><i class="fa fa-file-invoice-dollar"></i> Nuevo Presupuesto</button>
        </div>
      </div>

      <!-- Tab Historial -->
      <div id="dh" style="display:none">
        <div class="tl">${trans.length ? trans.map(t => `
          <div class="tl-item">
            <div class="tl-dot" style="background:var(--accent)"><i class="fa fa-exchange-alt" style="font-size:9px;color:#fff"></i></div>
            <div class="tl-body">
              <div class="tl-title">${t.de} → ${t.a}</div>
              <div class="tl-meta">${t.fecha}</div>
              ${t.nota ? `<div class="tl-note">${t.nota}</div>` : ''}
            </div>
          </div>`).join('') : '<div class="empty"><i class="fa fa-history"></i><p>Sin historial.</p></div>'}
        </div>
      </div>

      <!-- Tab Presupuestos -->
      <div id="dpp" style="display:none">
        ${ppts.length ? ppts.map(pp => `
        <div style="padding:12px;border:1px solid var(--border);border-radius:var(--r);margin-bottom:8px;cursor:pointer;background:var(--surface)"
          onclick="cerrar('m-detalle');editarPpto('${pp.id}')">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-weight:700;font-family:monospace">${pp.numero||'—'}</span>
            ${bPptoStatus(pp.status)}
          </div>
          <div style="font-size:12px;color:var(--ink3);margin-top:4px">
            Total: <strong style="color:var(--green)">${pesos(pp.totalFinal||0)}</strong>
            ${pp.gananciaPct!=null?` · Ganancia: ${pct(pp.gananciaPct)}`: ''}
          </div>
        </div>`).join('')
        : `<div class="empty"><i class="fa fa-file-invoice"></i><p>Sin presupuestos.</p>
           <button class="btn btn-primary btn-sm" onclick="nuevoPptoParaProy('${id}')">Crear presupuesto</button></div>`}
      </div>

      <!-- Tab Diseño -->
      ${sols.length ? `<div id="ds" style="display:none">
        ${sols.map(s => `
        <div style="padding:12px;border:1px solid var(--border);border-radius:var(--r);margin-bottom:8px;cursor:pointer;background:var(--surface)"
          onclick="cerrar('m-detalle');verDetalleSolicitud('${s.id}')">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-weight:600">${s.tipo||'—'}</span>
            <span class="badge ${s.status==='completado'?'b-green':s.status==='En proceso'?'b-blue':'b-gray'}">${s.status}</span>
          </div>
          <div style="font-size:12px;color:var(--ink2);margin-top:4px">${s.brief||''}</div>
          ${s.prioridad?`<div style="font-size:11px;color:var(--ink3);margin-top:3px">Prioridad: ${s.prioridad}</div>`:''}
        </div>`).join('')}
      </div>` : ''}
    </div>`;

  abrir('m-detalle');
}

// ── ARCHIVOS DEL PROYECTO (con drag & drop) ──
function abrirArchivosProyecto(id) {
  const p = DB.proyectos.find(x => x.id === id);
  if (!p) return;
  proySeleccionado = p;
  document.getElementById('proy-arch-sub').textContent = `${p.nom} · ${p.cli||''}`;
  renderArchivosProyecto();
  abrir('m-proy-archivos');
}

function renderArchivosProyecto() {
  const p = proySeleccionado;
  if (!p) return;
  const archivos = p.files || [];
  document.getElementById('proy-arch-count').textContent = `Archivos adjuntos (${archivos.length})`;
  document.getElementById('proy-arch-lista').innerHTML = archivos.length
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
          <button onclick="proyEliminarArchivo(${i})" style="color:var(--red);padding:4px 8px;border-radius:var(--r)" title="Eliminar"><i class="fa fa-trash"></i></button>
        </div>
      </div>`).join('')
    : '<div style="text-align:center;padding:20px;color:var(--ink4);font-size:12px">Sin archivos adjuntos</div>';
}

function proyAgregarArchivos(files) {
  const p = proySeleccionado;
  if (!p || !files || files.length === 0) return;
  if (!p.files) p.files = [];
  Array.from(files).forEach(f => {
    p.files.push({ nombre: f.name, tamano: f.size, tipo: f.type, fecha: new Date().toISOString() });
  });
  const i = DB.proyectos.findIndex(x => x.id === p.id);
  if (i >= 0) DB.proyectos[i] = p;
  guardar();
  renderArchivosProyecto();
  document.getElementById('proy-file-input').value = '';
}

function proyEliminarArchivo(idx) {
  const p = proySeleccionado;
  if (!p) return;
  p.files = (p.files||[]).filter((_,i) => i !== idx);
  const i = DB.proyectos.findIndex(x => x.id === p.id);
  if (i >= 0) DB.proyectos[i] = p;
  guardar();
  renderArchivosProyecto();
}

function proyDrop(event) {
  event.preventDefault();
  document.getElementById('proy-dropzone').style.borderColor = 'var(--border)';
  const files = event.dataTransfer?.files;
  if (files) proyAgregarArchivos(files);
}
// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
// DISEÑO
// ═══════════════════════════════════════════════
let disSolSeleccionada = null; // solicitud abierta en detalle