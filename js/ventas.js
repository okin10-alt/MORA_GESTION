// FORMA — módulo: ventas

  actions(`
    <button class="btn btn-primary" onclick="nuevaOportunidad()"><i class="fa fa-plus"></i> Nueva Oportunidad</button>
    <button class="btn btn-secondary" onclick="ventasVista('lista')" id="btn-vista-lista" style="margin-left:6px"><i class="fa fa-list"></i></button>
    <button class="btn btn-secondary" onclick="ventasVista('kanban')" id="btn-vista-kanban"><i class="fa fa-columns"></i></button>
  `);

  if (typeof ventasVistaActual === 'undefined') window.ventasVistaActual = 'kanban';

  // Oportunidades = leads con etapa de ventas
  const opps = (DB.oportunidades || []).filter(o =>
    !searchQ || (o.nombre + o.empresa + o.contacto).toLowerCase().includes(searchQ)
  );

  // Stats rápidas
  const totalValor = opps.filter(o => o.etapa !== 'perdido').reduce((s, o) => s + (parseFloat(o.valor)||0), 0);
  const cerradas   = opps.filter(o => o.etapa === 'cerrado');
  const valorCerrado = cerradas.reduce((s, o) => s + (parseFloat(o.valor)||0), 0);
  const tasa = opps.length > 0 ? Math.round((cerradas.length / opps.length) * 100) : 0;
  const hoy = new Date().toISOString().split('T')[0];
  const vencenHoy = opps.filter(o => o.proximaAccion === hoy && o.etapa !== 'cerrado' && o.etapa !== 'perdido').length;

  const statsHTML = `
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px">
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px 16px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--ink3);letter-spacing:.8px">Pipeline activo</div>
      <div style="font-size:22px;font-weight:800;color:var(--accent);margin-top:4px">${pesos(totalValor)}</div>
      <div style="font-size:11px;color:var(--ink3);margin-top:2px">${opps.filter(o=>o.etapa!=='cerrado'&&o.etapa!=='perdido').length} oportunidades</div>
    </div>
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px 16px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--ink3);letter-spacing:.8px">Cerradas</div>
      <div style="font-size:22px;font-weight:800;color:var(--green);margin-top:4px">${pesos(valorCerrado)}</div>
      <div style="font-size:11px;color:var(--ink3);margin-top:2px">${cerradas.length} ventas ganadas</div>
    </div>
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px 16px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--ink3);letter-spacing:.8px">Tasa de cierre</div>
      <div style="font-size:22px;font-weight:800;color:${tasa>=30?'var(--green)':tasa>=15?'var(--amber)':'var(--red)'};margin-top:4px">${tasa}%</div>
      <div style="font-size:11px;color:var(--ink3);margin-top:2px">de ${opps.length} oportunidades</div>
    </div>
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px 16px;${vencenHoy>0?'border-color:var(--amber)':''}">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--ink3);letter-spacing:.8px">Seguimientos hoy</div>
      <div style="font-size:22px;font-weight:800;color:${vencenHoy>0?'var(--amber)':'var(--ink)'};margin-top:4px">${vencenHoy}</div>
      <div style="font-size:11px;color:var(--ink3);margin-top:2px">${vencenHoy>0?'⚠️ Pendientes hoy':'Todo al día'}</div>
    </div>
  </div>`;

  if (ventasVistaActual === 'kanban') {
    // Vista Kanban
    const etapasActivas = ETAPAS_VENTAS.filter(e => e.id !== 'perdido' || opps.some(o => o.etapa === 'perdido'));
    const kanbanHTML = `
    <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:12px;min-height:400px">
      ${etapasActivas.map(et => {
        const cards = opps.filter(o => o.etapa === et.id);
        const valorCol = cards.reduce((s, o) => s + (parseFloat(o.valor)||0), 0);
        return `
        <div style="min-width:220px;max-width:240px;flex-shrink:0">
          <div style="background:${et.color}18;border:1px solid ${et.color}40;border-radius:var(--r-lg);padding:10px 12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-size:11px;font-weight:700;color:${et.color};text-transform:uppercase;letter-spacing:.5px"><i class="fa ${et.icon}" style="margin-right:5px"></i>${et.label}</div>
              ${valorCol > 0 ? `<div style="font-size:10px;color:var(--ink3);margin-top:1px">${pesos(valorCol)}</div>` : ''}
            </div>
            <span style="background:${et.color};color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px">${cards.length}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${cards.length ? cards.map(o => oppCard(o, et)).join('') : `
            <div style="border:2px dashed var(--border);border-radius:var(--r);padding:20px 12px;text-align:center;color:var(--ink4);font-size:11px">
              Sin oportunidades
            </div>`}
          </div>
        </div>`;
      }).join('')}
    </div>`;
    c(statsHTML + kanbanHTML);
  } else {
    // Vista lista
    const listaHTML = `
    <div class="tbl-wrap">
      <table>
        <thead><tr>
          <th>Oportunidad</th><th>Contacto</th><th>Etapa</th><th>Valor est.</th><th>Próx. acción</th><th></th>
        </tr></thead>
        <tbody>
          ${opps.length ? opps.sort((a,b) => {
            const ord = ETAPAS_VENTAS.map(e=>e.id);
            return ord.indexOf(a.etapa) - ord.indexOf(b.etapa);
          }).map(o => {
            const et = ETAPAS_VENTAS.find(e => e.id === o.etapa) || ETAPAS_VENTAS[0];
            const vencida = o.proximaAccion && o.proximaAccion < hoy && o.etapa !== 'cerrado' && o.etapa !== 'perdido';
            return `<tr onclick="verOportunidad('${o.id}')" style="cursor:pointer">
              <td><div style="font-weight:700">${o.nombre||'Sin nombre'}</div><div style="font-size:11px;color:var(--ink3)">${o.empresa||''}</div></td>
              <td style="font-size:13px">${o.contacto||'—'}</td>
              <td><span style="font-size:10px;font-weight:700;padding:3px 9px;border-radius:20px;background:${et.color}18;color:${et.color}">${et.label}</span></td>
              <td style="font-weight:700;color:var(--green)">${o.valor ? pesos(o.valor) : '—'}</td>
              <td style="font-size:12px;color:${vencida?'var(--red)':'var(--ink3)'};font-weight:${vencida?'700':'400'}">${o.proximaAccion||'—'}${vencida?' ⚠️':''}</td>
              <td onclick="event.stopPropagation()" style="display:flex;gap:4px">
                <button class="btn btn-sm" onclick="editarOportunidad('${o.id}')"><i class="fa fa-edit"></i></button>
                <button class="btn btn-sm" style="color:var(--red)" onclick="eliminarOportunidad('${o.id}')"><i class="fa fa-trash"></i></button>
              </td>
            </tr>`;
          }).join('') : `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--ink4)">Sin oportunidades. Creá la primera.</td></tr>`}
        </tbody>
      </table>
    </div>`;
    c(statsHTML + listaHTML);
  }
}

function ventasVista(v) {
  window.ventasVistaActual = v;
  go('ventas');
}

function oppCard(o, et) {
  const hoy = new Date().toISOString().split('T')[0];
  const vencida = o.proximaAccion && o.proximaAccion < hoy;
  const actividades = o.actividades || [];
  const ultimaAct = actividades[actividades.length - 1];
  return `
  <div onclick="verOportunidad('${o.id}')" style="background:var(--surface);border:1px solid ${vencida?'var(--amber)':'var(--border)'};border-radius:var(--r);padding:12px;cursor:pointer;transition:all .15s"
    onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,.08)';this.style.transform='translateY(-1px)'"
    onmouseout="this.style.boxShadow='';this.style.transform=''">
    <div style="font-size:13px;font-weight:700;color:var(--ink);margin-bottom:3px;line-height:1.3">${o.nombre||'Sin nombre'}</div>
    ${o.empresa ? `<div style="font-size:11px;color:var(--ink3);margin-bottom:6px">${o.empresa}</div>` : ''}
    ${o.contacto ? `<div style="font-size:11px;color:var(--ink2);margin-bottom:4px"><i class="fa fa-user" style="margin-right:4px;opacity:.5"></i>${o.contacto}</div>` : ''}
    ${o.valor ? `<div style="font-size:14px;font-weight:800;color:var(--green);margin-bottom:6px">${pesos(o.valor)}</div>` : ''}
    ${o.proximaAccion ? `
    <div style="font-size:10px;padding:3px 7px;border-radius:4px;background:${vencida?'#fef3c7':'var(--surface2)'};color:${vencida?'#92400e':'var(--ink3)'};display:inline-block;margin-bottom:6px">
      <i class="fa fa-${vencida?'exclamation-triangle':'clock'}" style="margin-right:3px"></i>${o.proximaAccion}
    </div>` : ''}
    ${ultimaAct ? `<div style="font-size:10px;color:var(--ink4);border-top:1px solid var(--border);padding-top:5px;margin-top:5px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis"><i class="fa fa-comment-alt" style="margin-right:3px"></i>${ultimaAct.nota||'—'}</div>` : ''}
    <div style="display:flex;justify-content:flex-end;gap:4px;margin-top:6px" onclick="event.stopPropagation()">
      <button class="btn btn-sm" onclick="editarOportunidad('${o.id}')" title="Editar"><i class="fa fa-edit"></i></button>
      <button class="btn btn-sm" onclick="registrarActividad('${o.id}')" title="Registrar actividad" style="color:var(--accent)"><i class="fa fa-comment-plus"></i></button>
    </div>
  </div>`;
}

function nuevaOportunidad() {
  editOppId = null;
  document.getElementById('opp-title').textContent = 'Nueva Oportunidad';
  document.getElementById('opp-delete-btn').style.display = 'none';
  // Limpiar campos
  ['opp-nombre','opp-empresa','opp-contacto','opp-tel','opp-email','opp-valor','opp-notas','opp-prox-accion'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('opp-etapa').value = 'prospecto';
  document.getElementById('opp-actividades-body').innerHTML = '<div style="padding:12px;text-align:center;color:var(--ink4);font-size:12px">Sin actividades aún</div>';
  abrir('m-oportunidad');
}

function editarOportunidad(id) {
  const o = (DB.oportunidades || []).find(x => x.id === id);
  if (!o) return;
  editOppId = id;
  document.getElementById('opp-title').textContent = 'Editar Oportunidad';
  document.getElementById('opp-delete-btn').style.display = 'inline-flex';
  document.getElementById('opp-nombre').value = o.nombre || '';
  document.getElementById('opp-empresa').value = o.empresa || '';
  document.getElementById('opp-contacto').value = o.contacto || '';
  document.getElementById('opp-tel').value = o.tel || '';
  document.getElementById('opp-email').value = o.email || '';
  document.getElementById('opp-valor').value = o.valor || '';
  document.getElementById('opp-etapa').value = o.etapa || 'prospecto';
  document.getElementById('opp-notas').value = o.notas || '';
  document.getElementById('opp-prox-accion').value = o.proximaAccion || '';
  renderActividadesOpp(o.actividades || []);
  abrir('m-oportunidad');
}

function verOportunidad(id) {
  editarOportunidad(id);
}

function guardarOportunidad() {
  if (!DB.oportunidades) DB.oportunidades = [];
  const data = {
    id:            editOppId || nid(),
    nombre:        v('opp-nombre'),
    empresa:       v('opp-empresa'),
    contacto:      v('opp-contacto'),
    tel:           v('opp-tel'),
    email:         v('opp-email'),
    valor:         parseFloat(document.getElementById('opp-valor').value) || 0,
    etapa:         document.getElementById('opp-etapa').value,
    notas:         v('opp-notas'),
    proximaAccion: document.getElementById('opp-prox-accion').value,
    actividades:   editOppId ? ((DB.oportunidades.find(x=>x.id===editOppId)||{}).actividades||[]) : [],
    creadoEn:      editOppId ? ((DB.oportunidades.find(x=>x.id===editOppId)||{}).creadoEn||ahora()) : ahora(),
  };

  if (!data.nombre) { alert('El nombre de la oportunidad es obligatorio.'); return; }

  if (editOppId) {
    const idx = DB.oportunidades.findIndex(x => x.id === editOppId);
    if (idx !== -1) DB.oportunidades[idx] = data;
  } else {
    DB.oportunidades.push(data);
  }
  guardar();
  cerrar('m-oportunidad');
  go('ventas');
}

function eliminarOportunidad(id) {
  if (!confirm('¿Eliminar esta oportunidad?')) return;
  DB.oportunidades = (DB.oportunidades || []).filter(x => x.id !== id);
  guardar();
  cerrar('m-oportunidad');
  go('ventas');
}

function registrarActividad(id) {
  editarOportunidad(id);
  setTimeout(() => {
    const el = document.getElementById('opp-act-nota');
    if (el) {
      // Scroll dentro del contenedor padre (overflow:hidden no permite scrollIntoView)
      const col = document.getElementById('opp-col-actividades');
      if (col) col.scrollTop = 0;
      el.focus();
      el.style.borderColor = 'var(--accent)';
      el.style.boxShadow = '0 0 0 3px var(--accent-lt)';
      setTimeout(() => { el.style.borderColor = ''; el.style.boxShadow = ''; }, 2000);
    }
  }, 300);
}

function guardarActividadOpp() {
  if (!editOppId) return;
  const nota  = v('opp-act-nota');
  const tipo  = document.getElementById('opp-act-tipo').value;
  const fecha = document.getElementById('opp-act-fecha').value || new Date().toISOString().split('T')[0];
  if (!nota.trim()) { alert('Escribí una nota antes de guardar.'); return; }

  const opp = (DB.oportunidades || []).find(x => x.id === editOppId);
  if (!opp) return;
  if (!opp.actividades) opp.actividades = [];
  opp.actividades.push({ id: nid(), tipo, fecha, nota });
  guardar();

  // Limpiar campos y re-render
  document.getElementById('opp-act-nota').value = '';
  renderActividadesOpp(opp.actividades);
}

function eliminarActividadOpp(actId) {
  if (!editOppId) return;
  const opp = (DB.oportunidades || []).find(x => x.id === editOppId);
  if (!opp) return;
  opp.actividades = (opp.actividades || []).filter(a => a.id !== actId);
  guardar();
  renderActividadesOpp(opp.actividades);
}

function renderActividadesOpp(actividades) {
  const body = document.getElementById('opp-actividades-body');
  if (!body) return;
  if (!actividades || !actividades.length) {
    body.innerHTML = '<div style="padding:12px;text-align:center;color:var(--ink4);font-size:12px">Sin actividades registradas</div>';
    return;
  }
  const iconos = { llamada:'fa-phone', reunion:'fa-handshake', email:'fa-envelope', whatsapp:'fa-whatsapp', nota:'fa-sticky-note', visita:'fa-map-marker-alt' };
  body.innerHTML = [...actividades].reverse().map(a => `
  <div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
    <div style="width:28px;height:28px;border-radius:50%;background:var(--accent-lt);display:flex;align-items:center;justify-content:center;flex-shrink:0">
      <i class="fa ${iconos[a.tipo]||'fa-circle'}" style="font-size:11px;color:var(--accent)"></i>
    </div>
    <div style="flex:1;min-width:0">
      <div style="font-size:11px;color:var(--ink3);margin-bottom:2px">${a.fecha} · <span style="text-transform:capitalize">${a.tipo}</span></div>
      <div style="font-size:13px;color:var(--ink)">${a.nota}</div>
    </div>
    <button onclick="eliminarActividadOpp('${a.id}')" style="background:none;border:none;color:var(--ink4);cursor:pointer;flex-shrink:0;padding:0"><i class="fa fa-times" style="font-size:11px"></i></button>
  </div>`).join('');
}

function moverOportunidadEtapa(id, nuevaEtapa) {
  const opp = (DB.oportunidades || []).find(x => x.id === id);
  if (!opp) return;
  opp.etapa = nuevaEtapa;
  guardar();
  go('ventas');
}

function ventasCrearDesdeContacto(leadId) {
  // Crear oportunidad precargada desde un contacto del CRM
  const lead = (DB.leads || []).find(x => x.id === leadId);
  nuevaOportunidad();
  if (lead) {
    setTimeout(() => {
      document.getElementById('opp-nombre').value = `Proyecto ${lead.nom||''} ${lead.ape||''}`.trim();
      document.getElementById('opp-empresa').value = lead.emp || '';
      document.getElementById('opp-contacto').value = `${lead.nom||''} ${lead.ape||''}`.trim();
      document.getElementById('opp-tel').value = lead.tel || '';
      document.getElementById('opp-email').value = lead.email || '';
    }, 50);
  }
}

function transferirAGestion(oppId) {
  if (!oppId) { alert('Guardá la oportunidad primero.'); return; }
  const opp = (DB.oportunidades || []).find(x => x.id === oppId);
  if (!opp) return;

  if (!confirm(`¿Transferir "${opp.nombre}" a Gestión?\nSe creará un proyecto nuevo con todos sus datos.`)) return;

  // Crear proyecto en Gestión con todos los datos del prospecto
  if (!DB.proyectos) DB.proyectos = [];
  const proyId = nid();
  DB.proyectos.push({
    id:       proyId,
    nom:      opp.nombre,
    cli:      opp.contacto || opp.empresa || '',
    emp:      opp.empresa || '',
    tel:      opp.tel || '',
    email:    opp.email || '',
    cuit:     '',
    cat:      'Oficina',
    tipo:     'Diseño integral',
    area:     'gestion',
    status:   'relevamiento',
    fecha:    '',
    desc:     opp.notas || '',
    relev:    '',
    archivos: [],
    creadoEn: ahora(),
    // Referencia a la oportunidad de origen
    oppId:    oppId,
    oppNom:   opp.nombre,
    // Flag para mostrar badge en Gestión
    esTransferido: true,
  });

  // Registrar actividad en la oportunidad
  if (!opp.actividades) opp.actividades = [];
  opp.actividades.push({
    id:    nid(),
    tipo:  'nota',
    fecha: new Date().toISOString().split('T')[0],
    nota:  `✅ Transferido a Gestión — proyecto creado (${opp.empresa || opp.contacto || 'sin empresa'})`,
  });

  // Marcar como transferido pero dejar activa
  opp.transferidoAGestion = true;
  opp.proyId = proyId;

  guardar();
  actualizarBadgeGestion();
  cerrar('m-oportunidad');
  go('ventas');

  // Feedback visual
  setTimeout(() => {
    const banner = document.createElement('div');
    banner.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#059669;color:#fff;padding:12px 24px;border-radius:8px;font-weight:700;font-size:14px;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.2)';
    banner.innerHTML = '<i class="fa fa-check" style="margin-right:8px"></i>Prospecto transferido a Gestión';
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 3000);
  }, 100);
}

// ═══════════════════════════════════════════════
// CRM — GESTIÓN DE CONTACTOS
// ═══════════════════════════════════════════════

// ── PROCESAMIENTO INTELIGENTE DE NOMBRES ──