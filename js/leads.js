// FORMA — módulo: leads

function procesarNombre(nombreOriginal) {
  const limpiar = s => s.replace(/[🩷💓❤️💕💖✨💗💚💜💞🌹🦋😉😁🩰🌿☺️😎]/g, '').trim();
  const nombreLimpio = limpiar(nombreOriginal);
  const palabrasEmpresa = ['srl','s.r.l','s.a.s','sa','laboratorio','ferreteria','estudio','inmobiliaria',
    'cooperativa','hospital','dist','distribuidora','amoblamientos','muebles','pastas','color',
    'shop','design','interiores','group','home','sillas','comercial'];
  const esEmpresa = palabrasEmpresa.some(p => nombreLimpio.toLowerCase().includes(p));
  const puestosMap = {
    'arquitecto':'Arquitecto','arquitecta':'Arquitecta','arq.':'Arquitecto',
    'contador':'Contador','contadora':'Contadora','cliente':'Cliente',
    'clienta':'Cliente','gerente':'Gerente','compras':'Compras','tesorería':'Tesorería',
    'instalador':'Instalador','limpieza':'Limpieza'
  };
  let puestoDetectado = '', nombreSinPuesto = nombreLimpio;
  for (const [clave, valor] of Object.entries(puestosMap)) {
    if (nombreLimpio.toLowerCase().includes(clave)) {
      puestoDetectado = valor;
      nombreSinPuesto = nombreLimpio.replace(new RegExp(clave,'gi'),'').replace(/[-]/g,'').trim();
      break;
    }
  }
  if (esEmpresa) return { nombre: '', empresa: nombreSinPuesto, puesto: puestoDetectado };
  return { nombre: nombreSinPuesto, empresa: '', puesto: puestoDetectado };
}

function categorizarContacto(nombreOriginal, empresa) {
  const texto = (nombreOriginal + ' ' + (empresa||'')).toLowerCase();
  if (texto.includes('hospital') || texto.includes('laboratorio') || texto.includes('estudio juridico')) return 'Institución';
  if (texto.includes('ferreteria') || texto.includes('color') || texto.includes('dist') ||
      texto.includes('distribuidora') || texto.includes('comercial')) return 'Proveedores';
  if (texto.includes('arquitect') || texto.includes('diseño') || texto.includes('design') ||
      texto.includes('muebles') || texto.includes('amoblamiento')) return 'Profesional';
  if (texto.includes('shop') || empresa) return 'Empresa';
  return 'Particular';
}

// ── BADGE STATUS LEAD ──
function bStatusLead(s) {
  const m = { 'Pendiente':'b-gray','Contactado':'b-blue','Visita Agendada':'b-amber',
    'En seguimiento':'b-purple','Activo':'b-green','Cerrado':'b-gray' };
  return m[s] || 'b-gray';
}

// ── FILTRO ACTIVO POR CATEGORÍA ──
let crmCatFilter = 'Todos';

// ── VISTA PRINCIPAL ──
function leads() {
  titulo('CRM — Contactos');

  const cats = ['Todos','Particular','Empresa','Profesional','Proveedores','Institución'];
  const catEmoji = { Todos:'📋',Particular:'👤',Empresa:'🏢',Profesional:'👔',Proveedores:'🏪','Institución':'🏛️' };

  const filtradoPorCat = crmCatFilter === 'Todos'
    ? DB.leads
    : DB.leads.filter(l => l.cat === crmCatFilter);

  const items = filtradoPorCat.filter(l =>
    !searchQ || (
      (l.nom||'') + (l.ape||'') + (l.emp||'') + (l.tel||'') + (l.email||'')
    ).toLowerCase().includes(searchQ)
  );

  actions(`
    <button class="btn btn-primary" onclick="nuevoLead()"><i class="fa fa-plus"></i> Nuevo Contacto</button>
    <button class="btn btn-secondary" onclick="abrirImportarCRM()"><i class="fa fa-file-excel"></i> Importar</button>
  `);

  // Pills de categoría
  const pillsHtml = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
      ${cats.map(cat => {
        const count = cat === 'Todos' ? DB.leads.length : DB.leads.filter(l => l.cat === cat).length;
        const activo = crmCatFilter === cat;
        return `<button onclick="crmSetCat('${cat}')" style="
          display:inline-flex;align-items:center;gap:5px;padding:6px 14px;
          border-radius:20px;border:2px solid ${activo ? 'var(--accent)':'var(--border)'};
          background:${activo ? 'var(--accent-lt)':'var(--surface)'};
          color:${activo ? 'var(--accent)':'var(--ink2)'};
          font-size:12px;font-weight:${activo?'700':'500'};cursor:pointer;transition:.15s">
          ${catEmoji[cat]} ${cat} <span style="opacity:.6">(${count})</span>
        </button>`;
      }).join('')}
    </div>`;

  // Tabla
  const tbodyHtml = items.length
    ? items.map(l => {
        const nombre = l.nom ? `${l.nom}${l.ape?' '+l.ape:''}` : (l.emp || '—');
        const tieneOpVenta = DB.solicitudes && false; // placeholder para futuro
        return `<tr onclick="verLead('${l.id}')" style="cursor:pointer">
          <td>
            <div style="font-weight:600">${nombre}</div>
            <div style="font-size:11px;color:var(--ink3)">${l.tel||''}</div>
          </td>
          <td style="font-size:12px;color:var(--ink2)">${l.email||'—'}</td>
          <td style="font-size:12px;font-family:monospace">${l.cuit||'—'}</td>
          <td style="font-size:12px">${l.loc||'—'}</td>
          <td style="font-size:12px">${l.emp||'—'}</td>
          <td style="font-size:12px">${l.cargo||'—'}</td>
          <td><span class="badge b-gray">${l.origen||'—'}</span></td>
          <td><span class="badge b-gray" style="font-size:10px">${l.cat||'—'}</span></td>
          <td><span class="badge ${bStatusLead(l.status)}">${l.status||'—'}</span></td>
          <td onclick="event.stopPropagation()">
            <button class="btn btn-secondary btn-sm" onclick="editarLead('${l.id}')"><i class="fa fa-edit"></i></button>
          </td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="10" style="text-align:center;padding:32px;color:var(--ink4)">
        <i class="fa fa-users" style="font-size:22px;display:block;margin-bottom:8px;opacity:.3"></i>
        Sin contactos${crmCatFilter !== 'Todos' ? ' en esta categoría' : ''}.
      </td></tr>`;

  c(`
    ${pillsHtml}
    ${items.length !== DB.leads.length
      ? `<div style="font-size:11px;color:var(--ink3);margin-bottom:10px">
          Mostrando ${items.length} de ${DB.leads.length} contactos
        </div>` : ''}
    <div class="tbl-wrap">
      <table>
        <thead><tr>
          <th>Nombre</th><th>Email</th><th>CUIT/CUIL</th><th>Dirección</th>
          <th>Empresa</th><th>Puesto</th><th>Origen</th><th>Categoría</th><th>Estado</th><th></th>
        </tr></thead>
        <tbody>${tbodyHtml}</tbody>
      </table>
    </div>`);
}

function crmSetCat(cat) {
  crmCatFilter = cat;
  go(modulo);
}

// ── CRUD ──
function nuevoLead() {
  editLeadId = null;
  document.getElementById('m-lead-title').textContent = 'Nuevo Contacto';
  document.getElementById('lead-delete-btn').style.display = 'none';
  document.getElementById('lead-btn-label').textContent = 'Guardar Contacto';
  ['l-nom','l-tel','l-email','l-loc','l-emp','l-cargo','l-cuit','l-cbu','l-alias','l-banco','l-notas']
    .forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('l-origen').value = 'WhatsApp';
  document.getElementById('l-cat').value   = 'Particular';
  document.getElementById('l-status').value = 'Pendiente';
  abrir('m-lead');
}

function editarLead(id) {
  editLeadId = id;
  const l = DB.leads.find(x => x.id === id);
  if (!l) return;
  const nombre = l.nom || l.nombreCompleto || '';
  document.getElementById('m-lead-title').textContent = `Editar: ${nombre}`;
  document.getElementById('lead-delete-btn').style.display = 'block';
  document.getElementById('lead-btn-label').textContent = 'Guardar Cambios';
  document.getElementById('l-nom').value    = nombre;
  document.getElementById('l-tel').value    = l.tel || l.telefono || '';
  document.getElementById('l-email').value  = l.email || '';
  document.getElementById('l-loc').value    = l.loc || l.direccion || '';
  document.getElementById('l-emp').value    = l.emp || l.empresa || '';
  document.getElementById('l-cargo').value  = l.cargo || l.puesto || '';
  document.getElementById('l-cuit').value   = l.cuit || '';
  document.getElementById('l-cbu').value    = l.cbu || '';
  document.getElementById('l-alias').value  = l.alias || '';
  document.getElementById('l-banco').value  = l.banco || '';
  document.getElementById('l-notas').value  = l.notas || '';
  document.getElementById('l-origen').value = l.origen || 'WhatsApp';
  document.getElementById('l-cat').value    = l.cat || l.categoria || 'Particular';
  document.getElementById('l-status').value = l.status || l.estado || 'Pendiente';
  abrir('m-lead');
}

function guardarLead() {
  const nom = v('l-nom');
  const emp = v('l-emp');
  if (!nom && !emp) { alert('El nombre o empresa es obligatorio'); return; }
  const status = document.getElementById('l-status').value;
  const data = {
    nom, ape: '', emp, cargo: v('l-cargo'), tel: v('l-tel'),
    email: v('l-email'), loc: v('l-loc'),
    // compatibilidad con nuevo esquema del mapa
    nombreCompleto: nom, telefono: v('l-tel'), email: v('l-email'),
    direccion: v('l-loc'), empresa: emp, puesto: v('l-cargo'),
    origen: document.getElementById('l-origen').value,
    cat: document.getElementById('l-cat').value,
    categoria: document.getElementById('l-cat').value,
    status, estado: status,
    cuit: v('l-cuit'), cbu: v('l-cbu'), alias: v('l-alias'), banco: v('l-banco'),
    notas: v('l-notas')
  };
  if (editLeadId) {
    const i = DB.leads.findIndex(x => x.id === editLeadId);
    if (i >= 0) DB.leads[i] = { ...DB.leads[i], ...data };
  } else {
    DB.leads.push({ ...data, id: uid(), fecha: hoy() });
  }
  guardar(); cerrar('m-lead'); go(modulo);
}

function eliminarContacto() {
  if (!editLeadId) return;
  const l = DB.leads.find(x => x.id === editLeadId);
  if (!l) return;
  const nom = l.nom || l.nombreCompleto || 'este contacto';
  if (!confirm(`¿Eliminar a ${nom}? Se eliminará también su historial de actividades.`)) return;
  DB.leads = DB.leads.filter(x => x.id !== editLeadId);
  DB.timeline = DB.timeline.filter(t => t.leadId !== editLeadId);
  guardar(); cerrar('m-lead'); go(modulo);
}

// ── VER DETALLE (con modal m-detalle) ──
function verLead(id) {
  const l = DB.leads.find(x => x.id === id);
  if (!l) return;
  const tl = DB.timeline.filter(t => t.leadId === id);
  const proyAsoc = DB.proyectos.filter(p => p.cli === (l.nom||l.nombreCompleto) || p.leadId === id);
  const nombre = l.nom || l.nombreCompleto || l.emp || 'Contacto';

  document.getElementById('det-title').textContent = nombre;
  document.getElementById('det-sub').textContent = [l.emp||'', l.cat||'', l.status||''].filter(Boolean).join(' · ');
  document.getElementById('det-edit-btn').onclick = () => { cerrar('m-detalle'); editarLead(id); };

  // Datos bancarios — solo mostrar si hay alguno
  const tieneBanco = l.cuit || l.cbu || l.alias || l.banco;
  const bancoHtml = tieneBanco ? `
    <div style="background:var(--surface2);border-radius:var(--r);padding:14px;margin-bottom:14px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--ink3);margin-bottom:10px">
        <i class="fa fa-university" style="margin-right:5px"></i>Datos Bancarios
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
        ${l.cuit ? drow('CUIT/CUIL', `<span style="font-family:monospace">${l.cuit}</span>`) : ''}
        ${l.banco ? drow('Banco', l.banco) : ''}
        ${l.cbu ? `<div style="grid-column:1/-1">${drow('CBU', `<span style="font-family:monospace;font-size:11px">${l.cbu}</span>`)}</div>` : ''}
        ${l.alias ? drow('Alias', `<strong>${l.alias}</strong>`) : ''}
      </div>
    </div>` : '';

  document.getElementById('det-body').innerHTML = `
    <div class="dtabs">
      <div class="dtab active" onclick="dtab(this,'di')"><i class="fa fa-info-circle"></i> Información</div>
      <div class="dtab" onclick="dtab(this,'dt')"><i class="fa fa-clock"></i> Timeline (${tl.length})</div>
    </div>
    <div style="padding:18px">

      <!-- TAB INFO -->
      <div id="di">
        <!-- Datos de contacto -->
        <div style="background:var(--surface2);border-radius:var(--r);padding:14px;margin-bottom:14px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--ink3);margin-bottom:10px">
            <i class="fa fa-address-card" style="margin-right:5px"></i>Datos de Contacto
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
            ${drow('<i class="fa fa-phone" style="color:var(--ink3)"></i> Teléfono', l.tel||l.telefono||'—')}
            ${drow('<i class="fa fa-envelope" style="color:var(--ink3)"></i> Email', l.email||'—')}
            ${drow('<i class="fa fa-map-marker-alt" style="color:var(--ink3)"></i> Dirección', l.loc||l.direccion||'—')}
            ${drow('<i class="fa fa-building" style="color:var(--ink3)"></i> Empresa', l.emp||l.empresa||'—')}
            ${drow('<i class="fa fa-id-badge" style="color:var(--ink3)"></i> Puesto', l.cargo||l.puesto||'—')}
            ${drow('<i class="fa fa-tag" style="color:var(--ink3)"></i> Origen', `<span class="badge b-gray">${l.origen||'—'}</span>`)}
            ${drow('<i class="fa fa-layer-group" style="color:var(--ink3)"></i> Categoría', l.cat||l.categoria||'—')}
            ${drow('<i class="fa fa-calendar" style="color:var(--ink3)"></i> Fecha', l.fecha||'—')}
          </div>
        </div>

        ${bancoHtml}

        <!-- Cambiar estado -->
        <div style="background:var(--surface2);border-radius:var(--r);padding:14px;margin-bottom:14px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--ink3);margin-bottom:10px">
            <i class="fa fa-exchange-alt" style="margin-right:5px"></i>Estado Actual
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <span class="badge ${bStatusLead(l.status||l.estado)}" style="font-size:12px;padding:6px 12px">${l.status||l.estado||'Pendiente'}</span>
            <span style="color:var(--ink3);font-size:12px">→ Cambiar a:</span>
            <select id="sel-s-${id}" style="font-size:12px;padding:6px 10px;border:1px solid var(--border);border-radius:var(--r);background:var(--surface)">
              ${['Pendiente','Contactado','Visita Agendada','En seguimiento','Activo','Cerrado']
                .map(s => `<option${(l.status||l.estado)===s?' selected':''}>${s}</option>`).join('')}
            </select>
            <button class="btn btn-secondary btn-sm" onclick="actualizarStatusLead('${id}')">Actualizar</button>
          </div>
          <div style="font-size:11px;color:var(--ink3);margin-top:8px;line-height:1.5">
            ⭐ <strong>Visita Agendada</strong> crea un proyecto automáticamente
          </div>
        </div>

        <!-- Proyectos asociados -->
        ${proyAsoc.length ? `
        <div style="background:var(--surface2);border-radius:var(--r);padding:14px;margin-bottom:14px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--ink3);margin-bottom:10px">
            <i class="fa fa-project-diagram" style="margin-right:5px"></i>Proyectos Asociados (${proyAsoc.length})
          </div>
          ${proyAsoc.map(p => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:13px;font-weight:500">${p.nom}</span>
            ${bStatus(p.status)}
          </div>`).join('')}
        </div>` : ''}

        <!-- Notas -->
        ${(l.notas||'') ? `
        <div>
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--ink3);margin-bottom:6px">
            <i class="fa fa-sticky-note" style="margin-right:5px"></i>Notas
          </div>
          <div style="padding:12px;background:var(--amber-lt);border-radius:var(--r);font-size:13px;line-height:1.6;color:var(--amber)">
            ${l.notas}
          </div>
        </div>` : ''}

        <!-- Acciones -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;padding-top:14px;border-top:1px solid var(--border)">
          <button class="btn btn-accent btn-sm" onclick="crearProyectoDesdeContactoCRM('${id}')">
            <i class="fa fa-project-diagram"></i> Crear Proyecto
          </button>
          <button class="btn btn-secondary btn-sm" onclick="cerrar('m-detalle');nuevoTL('${id}')">
            <i class="fa fa-plus"></i> Registrar Actividad
          </button>
        </div>
      </div>

      <!-- TAB TIMELINE -->
      <div id="dt" style="display:none">
        <button class="btn btn-primary btn-sm" style="margin-bottom:14px" onclick="cerrar('m-detalle');nuevoTL('${id}')">
          <i class="fa fa-plus"></i> Nueva Actividad
        </button>
        <div class="tl">
          ${tl.length
            ? tl.slice().reverse().map(tlItem).join('')
            : '<div class="empty"><i class="fa fa-history"></i><p>Sin actividad registrada.</p></div>'}
        </div>
      </div>
    </div>`;

  abrir('m-detalle');
}

// ── ACTUALIZAR STATUS CON INTEGRACIONES ──
function actualizarStatusLead(id) {
  const l = DB.leads.find(x => x.id === id);
  const sel = document.getElementById('sel-s-' + id);
  if (!l || !sel) return;
  const nuevoStatus = sel.value;
  const i = DB.leads.findIndex(x => x.id === id);
  if (i >= 0) { DB.leads[i].status = nuevoStatus; DB.leads[i].estado = nuevoStatus; }

  // Integración: "Visita Agendada" → crear proyecto automático
  if (nuevoStatus === 'Visita Agendada') {
    const nombre = l.nom || l.nombreCompleto || l.emp || '';
    const existeProyecto = DB.proyectos.some(p =>
      p.cli === nombre || p.leadId === id
    );
    if (!existeProyecto) {
      const proyecto = {
        id: uid(), nom: `Proyecto: ${nombre} — ${l.cat||'Diseño'}`,
        cli: nombre, emp: l.emp||l.empresa||'', tel: l.tel||l.telefono||'',
        email: l.email||'', cat: l.cat||l.categoria||'Hogar',
        tipo: 'Diseño integral', area: 'gestion', status: 'relevamiento',
        fecha: '', desc: l.notas||'', relev: '', creadoEn: hoy(),
        leadId: id, files: []
      };
      DB.proyectos.push(proyecto);
      if (!DB.retenciones) DB.retenciones = [];
  if (!DB.transferencias) DB.transferencias = [];
      DB.transferencias.push({ id: uid(), proyId: proyecto.id, de: 'crm', a: 'gestion',
        nota: `Creado desde CRM — Visita Agendada: ${nombre}`, fecha: hoy() });
      DB.timeline.push({ id: uid(), leadId: id, tipo: 'reunion',
        nota: `Visita agendada. Proyecto "${proyecto.nom}" creado automáticamente.`,
        fecha: hoy(), prox: 'Confirmar fecha de visita', creadoEn: ahora() });
      guardar();
      alert(`✅ Visita agendada.\nProyecto "${proyecto.nom}" creado automáticamente en Gestión de Proyectos.`);
      cerrar('m-detalle'); go(modulo); return;
    } else {
      DB.timeline.push({ id: uid(), leadId: id, tipo: 'reunion',
        nota: 'Visita agendada — el contacto ya tiene proyecto(s) asociado(s).',
        fecha: hoy(), prox: 'Confirmar fecha', creadoEn: ahora() });
    }
  }
  guardar();
  // Re-abrir el modal actualizado
  verLead(id);
}

// ── CREAR PROYECTO MANUAL DESDE DETALLE ──
function crearProyectoDesdeContactoCRM(id) {
  const l = DB.leads.find(x => x.id === id);
  if (!l) return;
  const nombre = l.nom || l.nombreCompleto || l.emp || '';
  const proyExist = DB.proyectos.filter(p => p.cli === nombre || p.leadId === id);
  if (proyExist.length > 0) {
    if (!confirm(`⚠️ Este contacto ya tiene ${proyExist.length} proyecto(s):\n${proyExist.map(p=>'• '+p.nom).join('\n')}\n\n¿Crear uno nuevo de todas formas?`)) return;
  }
  const proyecto = {
    id: uid(), nom: `Proyecto: ${nombre} — ${l.cat||'Diseño'}`,
    cli: nombre, emp: l.emp||l.empresa||'', tel: l.tel||l.telefono||'',
    email: l.email||'', cat: l.cat||l.categoria||'Hogar',
    tipo: 'Diseño integral', area: 'gestion', status: 'relevamiento',
    fecha: '', desc: l.notas||'', relev: '', creadoEn: hoy(),
    leadId: id, files: []
  };
  DB.proyectos.push(proyecto);
  // Actualizar estado a "En seguimiento"
  const i = DB.leads.findIndex(x => x.id === id);
  if (i >= 0) { DB.leads[i].status = 'En seguimiento'; DB.leads[i].estado = 'En seguimiento'; }
  DB.timeline.push({ id: uid(), leadId: id, tipo: 'nota',
    nota: `Proyecto creado: "${proyecto.nom}". Estado actualizado a "En seguimiento".`,
    fecha: hoy(), prox: '', creadoEn: ahora() });
  guardar();
  cerrar('m-detalle');
  alert(`✅ Proyecto "${proyecto.nom}" creado.\nEstado actualizado a "En seguimiento".`);
  go(modulo);
}

// Alias compatibilidad
function leadAGestion(id) { crearProyectoDesdeContactoCRM(id); }
function cambiarStatusLead(id) { actualizarStatusLead(id); }
function crearProyectoDeLead(l) {
  const p = { id:uid(), nom:`Proyecto: ${l.nom||l.nombreCompleto||''} — ${l.cat||''}`,
    cli:l.nom||l.nombreCompleto||'', emp:l.emp||'', tel:l.tel||'',
    email:l.email||'', cat:l.cat||'', tipo:l.tipo||'Equipamiento',
    area:'gestion', status:'relevamiento', fecha:'', desc:l.notas||'',
    relev:'', creadoEn:hoy(), files:[] };
  DB.proyectos.push(p);
  if (!DB.transferencias) DB.transferencias = [];
  DB.transferencias.push({ id:uid(), proyId:p.id, de:'crm', a:'gestion',
    nota:`Lead convertido: ${l.nom||''}`, fecha:hoy() });
}

// ── IMPORTAR CSV/EXCEL ──
function abrirImportarCRM() {
  document.getElementById('crm-imp-step').value = '1';
  document.getElementById('crm-imp-step1').style.display = 'block';
  document.getElementById('crm-imp-step2').style.display = 'none';
  document.getElementById('crm-imp-file-input').value = '';
  abrir('m-importar');
}

function crmImportarCSV(files) {
  const file = files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const text = e.target.result;
    const lineas = text.split('\n').filter(l => l.trim());
    const nuevos = [];
    for (let i = 1; i < lineas.length; i++) {
      const campos = lineas[i].split('\t');
      if (campos.length < 2) continue;
      const telefonoFormateado = campos[1]?.trim() || '';
      const nombreOriginal = campos[2]?.trim() || campos[0]?.trim() || '';
      if (!nombreOriginal) continue;
      const { nombre, empresa, puesto } = procesarNombre(nombreOriginal);
      const cat = categorizarContacto(nombreOriginal, empresa);
      nuevos.push({
        id: uid(), nom: nombre||nombreOriginal, ape:'', emp: empresa, cargo: puesto,
        nombreCompleto: nombre||nombreOriginal, telefono: telefonoFormateado,
        tel: telefonoFormateado, email:'', loc:'', direccion:'',
        empresa, puesto, origen:'WhatsApp', cat, categoria: cat,
        status:'Pendiente', estado:'Pendiente', notas:'', fecha:hoy(),
        cuit:'', cbu:'', alias:'', banco:''
      });
    }
    if (!nuevos.length) { alert('No se encontraron contactos válidos en el archivo.'); return; }
    DB.leads.push(...nuevos);
    guardar(); cerrar('m-importar'); go(modulo);
    alert(`✅ ${nuevos.length} contactos importados exitosamente.`);
  };
  reader.readAsText(file);
}

// ── TIMELINE ──
function nuevoTL(leadId) {
  tlLeadId = leadId;
  document.getElementById('tl-nota').value = '';
  document.getElementById('tl-prox').value = '';
  document.getElementById('tl-fecha').value = fiDate();
  abrir('m-timeline');
}

function guardarTL() {
  DB.timeline.push({
    id: uid(), leadId: tlLeadId,
    tipo: document.getElementById('tl-tipo').value,
    nota: v('tl-nota'), fecha: v('tl-fecha'),
    prox: v('tl-prox'), creadoEn: ahora()
  });
  guardar(); cerrar('m-timeline'); verLead(tlLeadId);
}

function tlItem(t) {
  const icons  = { llamada:'fa-phone', reunion:'fa-handshake', email:'fa-envelope', whatsapp:'fa-comment', nota:'fa-sticky-note' };
  const colors = { llamada:'var(--accent)', reunion:'var(--green)', email:'var(--teal)', whatsapp:'#25d366', nota:'var(--amber)' };
  const col = colors[t.tipo] || 'var(--ink3)';
  const ico = icons[t.tipo] || 'fa-circle';
  return `
    <div class="tl-item">
      <div class="tl-dot" style="background:${col}"><i class="fa ${ico}" style="font-size:10px;color:#fff"></i></div>
      <div class="tl-body" style="border-left:3px solid ${col};padding-left:10px;margin-left:2px">
        <div class="tl-title">${t.tipo.charAt(0).toUpperCase()+t.tipo.slice(1)}</div>
        <div class="tl-meta">${t.fecha}${t.prox ? ' · Próximo: ' + t.prox : ''}</div>
        ${t.nota ? `<div class="tl-note">${t.nota}</div>` : ''}
        ${t.creadoEn ? `<div style="font-size:10px;color:var(--ink4);margin-top:4px">${t.creadoEn}</div>` : ''}
      </div>
    </div>`;
}
// ═══════════════════════════════════════════════
// GESTIÓN DE PROYECTOS
// ═══════════════════════════════════════════════
let proySeleccionado = null; // proyecto abierto en detalle/archivos
