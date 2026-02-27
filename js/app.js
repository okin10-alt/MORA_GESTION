/* ══════════════════════════════════════════════
   FORMA — Sistema de Gestión
   Lógica Principal de Módulos
   ══════════════════════════════════════════════ */

// ══════════════════════════════════════════════
// MÓDULO: DASHBOARD
// ══════════════════════════════════════════════
function renderDashboard() {
  const leads = DB.leads || [];
  const proyectos = DB.proyectos || [];
  const presupuestos = DB.presupuestos || [];
  const cobros = DB.cobros || [];
  
  // Estadísticas
  const leadsActivos = leads.filter(l => l.status !== 'perdido' && l.status !== 'convertido').length;
  const proyectosActivos = proyectos.filter(p => p.status !== 'cancelado' && p.status !== 'finalizado').length;
  const presupuestosEnviados = presupuestos.filter(p => p.status === 'enviado' || p.status === 'negociacion').length;
  
  const ingresosMes = cobros
    .filter(c => c.fecha && c.fecha.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((sum, c) => sum + parseFloat(c.monto || 0), 0);
  
  const html = `
    <div class="dash-header">
      <h1>Dashboard</h1>
      <p class="dash-date">Hoy: ${new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    
    <div class="dash-stats">
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--blue1);color:var(--blue6)">
          <i class="fas fa-funnel-dollar"></i>
        </div>
        <div class="stat-info">
          <div class="stat-label">Leads activos</div>
          <div class="stat-value">${leadsActivos}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--green1);color:var(--green6)">
          <i class="fas fa-project-diagram"></i>
        </div>
        <div class="stat-info">
          <div class="stat-label">Proyectos en curso</div>
          <div class="stat-value">${proyectosActivos}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--purple1);color:var(--purple6)">
          <i class="fas fa-file-invoice-dollar"></i>
        </div>
        <div class="stat-info">
          <div class="stat-label">Presupuestos pendientes</div>
          <div class="stat-value">${presupuestosEnviados}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--cyan1);color:var(--cyan6)">
          <i class="fas fa-coins"></i>
        </div>
        <div class="stat-info">
          <div class="stat-label">Ingresos del mes</div>
          <div class="stat-value">${pesos(ingresosMes)}</div>
        </div>
      </div>
    </div>
    
    <div class="dash-grid">
      <div class="dash-panel">
        <div class="panel-header">
          <h3><i class="fas fa-funnel-dollar"></i> Últimos leads</h3>
          <button class="btn-sm" onclick="go('leads')">Ver todos</button>
        </div>
        <div class="panel-body">
          ${renderUltimosLeads()}
        </div>
      </div>
      
      <div class="dash-panel">
        <div class="panel-header">
          <h3><i class="fas fa-tasks"></i> Actividad reciente</h3>
        </div>
        <div class="panel-body">
          ${renderActividadReciente()}
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('content').innerHTML = html;
}

function renderUltimosLeads() {
  const leads = (DB.leads || []).slice(-5).reverse();
  
  if (leads.length === 0) {
    return '<div class="empty-state"><i class="fas fa-inbox"></i><p>No hay leads registrados</p></div>';
  }
  
  return leads.map(l => `
    <div class="list-item">
      <div class="list-item-main">
        <strong>${l.nom} ${l.ape}</strong>
        <span class="badge ${l.status === 'convertido' ? 'bg-green' : l.status === 'perdido' ? 'bg-red' : 'bg-blue'}">${l.status}</span>
      </div>
      <div class="list-item-sub">${l.emp || '-'} • ${l.cat || '-'}</div>
    </div>
  `).join('');
}

function renderActividadReciente() {
  const timeline = (DB.timeline || []).slice(-10).reverse();
  
  if (timeline.length === 0) {
    return '<div class="empty-state"><i class="fas fa-clock"></i><p>No hay actividad registrada</p></div>';
  }
  
  return timeline.map(t => `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <div class="timeline-text">${t.desc}</div>
        <div class="timeline-meta">${t.fecha} • ${t.user || 'Sistema'}</div>
      </div>
    </div>
  `).join('');
}

// ══════════════════════════════════════════════
// MÓDULO: LEADS
// ══════════════════════════════════════════════
function renderLeads() {
  const leads = DB.leads || [];
  
  const html = `
    <div class="module-header">
      <div>
        <h1><i class="fas fa-funnel-dollar"></i> Leads</h1>
        <p>Gestión de oportunidades comerciales</p>
      </div>
      <button class="btn-primary" onclick="abrirModalLead()">
        <i class="fas fa-plus"></i> Nuevo Lead
      </button>
    </div>
    
    <div class="module-filters">
      <input type="text" id="filtro-lead" placeholder="Buscar por nombre, empresa..." onkeyup="filtrarLeads()">
      <select id="filtro-status" onchange="filtrarLeads()">
        <option value="">Todos los estados</option>
        <option value="nuevo">Nuevo</option>
        <option value="contactado">Contactado</option>
        <option value="calificado">Calificado</option>
        <option value="convertido">Convertido</option>
        <option value="perdido">Perdido</option>
      </select>
    </div>
    
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Empresa</th>
            <th>Contacto</th>
            <th>Categoría</th>
            <th>Score</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="tabla-leads">
          ${renderTablaLeads(leads)}
        </tbody>
      </table>
    </div>
  `;
  
  document.getElementById('content').innerHTML = html;
}

function renderTablaLeads(leads) {
  if (leads.length === 0) {
    return '<tr><td colspan="7" class="empty-state">No hay leads registrados</td></tr>';
  }
  
  return leads.map(l => `
    <tr>
      <td><strong>${l.nom} ${l.ape}</strong></td>
      <td>${l.emp || '-'}</td>
      <td>
        <div>${l.email || '-'}</div>
        <div class="text-muted">${l.tel || '-'}</div>
      </td>
      <td>${l.cat || '-'}</td>
      <td>
        <div class="score-badge score-${l.score >= 75 ? 'high' : l.score >= 50 ? 'med' : 'low'}">
          ${l.score || 0}
        </div>
      </td>
      <td>
        <span class="badge ${getStatusClass(l.status)}">${l.status || 'nuevo'}</span>
      </td>
      <td>
        <button class="btn-icon" onclick="verLead('${l.id}')" title="Ver detalle">
          <i class="fas fa-eye"></i>
        </button>
        <button class="btn-icon" onclick="editarLead('${l.id}')" title="Editar">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-icon" onclick="convertirLead('${l.id}')" title="Convertir a proyecto">
          <i class="fas fa-exchange-alt"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function filtrarLeads() {
  const texto = document.getElementById('filtro-lead').value.toLowerCase();
  const status = document.getElementById('filtro-status').value;
  
  let leads = DB.leads || [];
  
  if (texto) {
    leads = leads.filter(l => 
      (l.nom + ' ' + l.ape).toLowerCase().includes(texto) ||
      (l.emp || '').toLowerCase().includes(texto) ||
      (l.email || '').toLowerCase().includes(texto)
    );
  }
  
  if (status) {
    leads = leads.filter(l => l.status === status);
  }
  
  document.getElementById('tabla-leads').innerHTML = renderTablaLeads(leads);
}

function abrirModalLead(id = null) {
  const lead = id ? DB.leads.find(l => l.id === id) : null;
  const isEdit = !!lead;
  
  const modal = `
    <div class="modal-overlay" id="modal-lead" onclick="cerrarModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2>${isEdit ? 'Editar Lead' : 'Nuevo Lead'}</h2>
          <button class="modal-close" onclick="cerrarModal()">&times;</button>
        </div>
        <div class="modal-body">
          <form onsubmit="guardarLead(event, '${id || ''}')">
            <div class="form-grid">
              <div class="form-group">
                <label>Nombre *</label>
                <input type="text" id="lead-nom" value="${lead?.nom || ''}" required>
              </div>
              <div class="form-group">
                <label>Apellido *</label>
                <input type="text" id="lead-ape" value="${lead?.ape || ''}" required>
              </div>
              <div class="form-group">
                <label>Empresa</label>
                <input type="text" id="lead-emp" value="${lead?.emp || ''}">
              </div>
              <div class="form-group">
                <label>Cargo</label>
                <input type="text" id="lead-cargo" value="${lead?.cargo || ''}">
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" id="lead-email" value="${lead?.email || ''}">
              </div>
              <div class="form-group">
                <label>Teléfono</label>
                <input type="tel" id="lead-tel" value="${lead?.tel || ''}">
              </div>
              <div class="form-group">
                <label>Categoría</label>
                <select id="lead-cat">
                  <option value="">Seleccionar...</option>
                  <option ${lead?.cat === 'Oficina' ? 'selected' : ''}>Oficina</option>
                  <option ${lead?.cat === 'Comercio' ? 'selected' : ''}>Comercio</option>
                  <option ${lead?.cat === 'Hotelería' ? 'selected' : ''}>Hotelería</option>
                  <option ${lead?.cat === 'Educación' ? 'selected' : ''}>Educación</option>
                  <option ${lead?.cat === 'Vivienda' ? 'selected' : ''}>Vivienda</option>
                </select>
              </div>
              <div class="form-group">
                <label>Tipo</label>
                <select id="lead-tipo">
                  <option value="">Seleccionar...</option>
                  <option ${lead?.tipo === 'Equipamiento' ? 'selected' : ''}>Equipamiento</option>
                  <option ${lead?.tipo === 'Obra' ? 'selected' : ''}>Obra</option>
                  <option ${lead?.tipo === 'Integral' ? 'selected' : ''}>Integral</option>
                </select>
              </div>
              <div class="form-group">
                <label>Origen</label>
                <select id="lead-origen">
                  <option value="">Seleccionar...</option>
                  <option ${lead?.origen === 'web' ? 'selected' : ''}>Web</option>
                  <option ${lead?.origen === 'referido' ? 'selected' : ''}>Referido</option>
                  <option ${lead?.origen === 'evento' ? 'selected' : ''}>Evento</option>
                  <option ${lead?.origen === 'cold' ? 'selected' : ''}>Cold Call</option>
                </select>
              </div>
              <div class="form-group">
                <label>Score (0-100)</label>
                <input type="number" id="lead-score" min="0" max="100" value="${lead?.score || 50}">
              </div>
              <div class="form-group">
                <label>Presupuesto estimado</label>
                <input type="number" id="lead-ppto" value="${lead?.ppto || ''}">
              </div>
              <div class="form-group">
                <label>Estado</label>
                <select id="lead-status">
                  <option value="nuevo" ${lead?.status === 'nuevo' ? 'selected' : ''}>Nuevo</option>
                  <option value="contactado" ${lead?.status === 'contactado' ? 'selected' : ''}>Contactado</option>
                  <option value="calificado" ${lead?.status === 'calificado' ? 'selected' : ''}>Calificado</option>
                  <option value="convertido" ${lead?.status === 'convertido' ? 'selected' : ''}>Convertido</option>
                  <option value="perdido" ${lead?.status === 'perdido' ? 'selected' : ''}>Perdido</option>
                </select>
              </div>
              <div class="form-group full-width">
                <label>Notas</label>
                <textarea id="lead-notas" rows="3">${lead?.notas || ''}</textarea>
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" onclick="cerrarModal()">Cancelar</button>
              <button type="submit" class="btn-primary">${isEdit ? 'Guardar' : 'Crear'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modal);
}

function guardarLead(e, id) {
  e.preventDefault();
  
  const leadData = {
    nom: document.getElementById('lead-nom').value.trim(),
    ape: document.getElementById('lead-ape').value.trim(),
    emp: document.getElementById('lead-emp').value.trim(),
    cargo: document.getElementById('lead-cargo').value.trim(),
    email: document.getElementById('lead-email').value.trim(),
    tel: document.getElementById('lead-tel').value.trim(),
    cat: document.getElementById('lead-cat').value,
    tipo: document.getElementById('lead-tipo').value,
    origen: document.getElementById('lead-origen').value,
    score: parseInt(document.getElementById('lead-score').value) || 50,
    ppto: parseFloat(document.getElementById('lead-ppto').value) || 0,
    status: document.getElementById('lead-status').value,
    notas: document.getElementById('lead-notas').value.trim()
  };
  
  if (id) {
    // Editar
    const lead = DB.leads.find(l => l.id === id);
    Object.assign(lead, leadData);
    registrarTimeline('lead', id, `Lead actualizado: ${leadData.nom} ${leadData.ape}`);
  } else {
    // Crear
    const nuevoLead = {
      id: uid(),
      ...leadData,
      fecha: hoy(),
      area: 'ventas'
    };
    DB.leads.push(nuevoLead);
    registrarTimeline('lead', nuevoLead.id, `Nuevo lead creado: ${leadData.nom} ${leadData.ape}`);
  }
  
  guardar();
  cerrarModal();
  renderLeads();
}

function convertirLead(id) {
  const lead = DB.leads.find(l => l.id === id);
  if (!lead) return;
  
  if (!confirm(`¿Convertir lead "${lead.nom} ${lead.ape}" a proyecto?`)) return;
  
  // Crear proyecto desde lead
  const nuevoProyecto = {
    id: uid(),
    nom: `${lead.cat || 'Proyecto'} - ${lead.emp || lead.nom + ' ' + lead.ape}`,
    cli: `${lead.nom} ${lead.ape}`,
    emp: lead.emp || '',
    tel: lead.tel || '',
    email: lead.email || '',
    cat: lead.cat || '',
    tipo: lead.tipo || '',
    area: 'ventas',
    status: 'presupuestando',
    fecha: hoy(),
    desc: lead.notas || '',
    relev: '',
    creadoEn: hoy(),
    leadId: id
  };
  
  DB.proyectos.push(nuevoProyecto);
  
  // Actualizar lead
  lead.status = 'convertido';
  lead.proyectoId = nuevoProyecto.id;
  
  registrarTimeline('proyecto', nuevoProyecto.id, `Proyecto creado desde lead: ${lead.nom} ${lead.ape}`);
  
  guardar();
  alert('✅ Lead convertido a proyecto exitosamente');
  renderLeads();
}

// ══════════════════════════════════════════════
// MÓDULO: VENTAS
// ══════════════════════════════════════════════
function renderVentas() {
  const proyectos = (DB.proyectos || []).filter(p => p.area === 'ventas');
  
  const html = `
    <div class="module-header">
      <div>
        <h1><i class="fas fa-address-book"></i> Ventas</h1>
        <p>Proyectos en etapa comercial</p>
      </div>
    </div>
    
    <div class="module-filters">
      <input type="text" id="filtro-ventas" placeholder="Buscar..." onkeyup="filtrarVentas()">
      <select id="filtro-ventas-status" onchange="filtrarVentas()">
        <option value="">Todos los estados</option>
        <option value="presupuestando">Presupuestando</option>
        <option value="esperando">Esperando respuesta</option>
        <option value="negociacion">En negociación</option>
        <option value="ganado">Ganado</option>
        <option value="perdido">Perdido</option>
      </select>
    </div>
    
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Proyecto</th>
            <th>Cliente</th>
            <th>Categoría</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="tabla-ventas">
          ${renderTablaVentas(proyectos)}
        </tbody>
      </table>
    </div>
  `;
  
  document.getElementById('content').innerHTML = html;
}

function renderTablaVentas(proyectos) {
  if (proyectos.length === 0) {
    return '<tr><td colspan="6" class="empty-state">No hay proyectos en ventas</td></tr>';
  }
  
  return proyectos.map(p => `
    <tr>
      <td><strong>${p.nom}</strong></td>
      <td>
        <div>${p.cli}</div>
        <div class="text-muted">${p.emp || '-'}</div>
      </td>
      <td>${p.cat || '-'}</td>
      <td><span class="badge ${getStatusClass(p.status)}">${p.status}</span></td>
      <td>${formatFecha(p.fecha)}</td>
      <td>
        <button class="btn-icon" onclick="verProyecto('${p.id}')" title="Ver detalle">
          <i class="fas fa-eye"></i>
        </button>
        <button class="btn-icon" onclick="transferirProyecto('${p.id}')" title="Transferir">
          <i class="fas fa-share"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function filtrarVentas() {
  const texto = document.getElementById('filtro-ventas').value.toLowerCase();
  const status = document.getElementById('filtro-ventas-status').value;
  
  let proyectos = (DB.proyectos || []).filter(p => p.area === 'ventas');
  
  if (texto) {
    proyectos = proyectos.filter(p => 
      p.nom.toLowerCase().includes(texto) ||
      (p.cli || '').toLowerCase().includes(texto) ||
      (p.emp || '').toLowerCase().includes(texto)
    );
  }
  
  if (status) {
    proyectos = proyectos.filter(p => p.status === status);
  }
  
  document.getElementById('tabla-ventas').innerHTML = renderTablaVentas(proyectos);
}

function transferirProyecto(id) {
  const proyecto = DB.proyectos.find(p => p.id === id);
  if (!proyecto) return;
  
  const modal = `
    <div class="modal-overlay" id="modal-transferir" onclick="cerrarModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2>Transferir Proyecto</h2>
          <button class="modal-close" onclick="cerrarModal()">&times;</button>
        </div>
        <div class="modal-body">
          <form onsubmit="confirmarTransferencia(event, '${id}')">
            <div class="form-group">
              <label>Proyecto</label>
              <input type="text" value="${proyecto.nom}" disabled>
            </div>
            <div class="form-group">
              <label>Transferir a *</label>
              <select id="transferir-area" required>
                <option value="">Seleccionar área...</option>
                <option value="gestion">Gestión de Proyectos</option>
                <option value="diseno">Diseño</option>
              </select>
            </div>
            <div class="form-group">
              <label>Motivo</label>
              <textarea id="transferir-motivo" rows="3" placeholder="Opcional: agregar notas sobre la transferencia"></textarea>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" onclick="cerrarModal()">Cancelar</button>
              <button type="submit" class="btn-primary">Transferir</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modal);
}

function confirmarTransferencia(e, id) {
  e.preventDefault();
  
  const proyecto = DB.proyectos.find(p => p.id === id);
  const areaDestino = document.getElementById('transferir-area').value;
  const motivo = document.getElementById('transferir-motivo').value.trim();
  
  if (!areaDestino) return;
  
  const areaAnterior = proyecto.area;
  proyecto.area = areaDestino;
  
  // Registrar transferencia
  DB.transferencias = DB.transferencias || [];
  DB.transferencias.push({
    id: uid(),
    proyectoId: id,
    proyectoNom: proyecto.nom,
    de: areaAnterior,
    a: areaDestino,
    motivo: motivo,
    fecha: hoy(),
    user: CURRENT_USER.nombre
  });
  
  registrarTimeline('proyecto', id, `Proyecto transferido de ${areaAnterior} a ${areaDestino}`);
  
  guardar();
  cerrarModal();
  alert('✅ Proyecto transferido exitosamente');
  renderVentas();
}

// ══════════════════════════════════════════════
// MÓDULO: GESTIÓN DE PROYECTOS
// ══════════════════════════════════════════════
function renderGestion() {
  const proyectos = (DB.proyectos || []).filter(p => p.area === 'gestion');
  
  const html = `
    <div class="module-header">
      <div>
        <h1><i class="fas fa-project-diagram"></i> Gestión de Proyectos</h1>
        <p>Administración y seguimiento de proyectos</p>
      </div>
    </div>
    
    <div class="kanban-container">
      <div class="kanban-column">
        <div class="kanban-header">
          <h3>Planificación</h3>
          <span class="count">${proyectos.filter(p => p.status === 'planificacion').length}</span>
        </div>
        <div class="kanban-cards">
          ${renderKanbanCards(proyectos.filter(p => p.status === 'planificacion'))}
        </div>
      </div>
      
      <div class="kanban-column">
        <div class="kanban-header">
          <h3>En Ejecución</h3>
          <span class="count">${proyectos.filter(p => p.status === 'ejecucion').length}</span>
        </div>
        <div class="kanban-cards">
          ${renderKanbanCards(proyectos.filter(p => p.status === 'ejecucion'))}
        </div>
      </div>
      
      <div class="kanban-column">
        <div class="kanban-header">
          <h3>Revisión</h3>
          <span class="count">${proyectos.filter(p => p.status === 'revision').length}</span>
        </div>
        <div class="kanban-cards">
          ${renderKanbanCards(proyectos.filter(p => p.status === 'revision'))}
        </div>
      </div>
      
      <div class="kanban-column">
        <div class="kanban-header">
          <h3>Finalizado</h3>
          <span class="count">${proyectos.filter(p => p.status === 'finalizado').length}</span>
        </div>
        <div class="kanban-cards">
          ${renderKanbanCards(proyectos.filter(p => p.status === 'finalizado'))}
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('content').innerHTML = html;
}

function renderKanbanCards(proyectos) {
  if (proyectos.length === 0) {
    return '<div class="empty-kanban">Sin proyectos</div>';
  }
  
  return proyectos.map(p => `
    <div class="kanban-card" onclick="verProyecto('${p.id}')">
      <div class="kanban-card-title">${p.nom}</div>
      <div class="kanban-card-meta">${p.cli}</div>
      <div class="kanban-card-footer">
        <span class="badge bg-${p.cat === 'Oficina' ? 'blue' : p.cat === 'Comercio' ? 'green' : 'purple'}">${p.cat}</span>
        <span class="text-muted">${formatFecha(p.fecha)}</span>
      </div>
    </div>
  `).join('');
}

function verProyecto(id) {
  const proyecto = DB.proyectos.find(p => p.id === id);
  if (!proyecto) return;
  
  const html = `
    <div class="detail-header">
      <button class="btn-back" onclick="volverAtras('${proyecto.area === 'ventas' ? 'ventas' : 'gestion'}')">
        <i class="fas fa-arrow-left"></i> Volver
      </button>
      <h1>${proyecto.nom}</h1>
    </div>
    
    <div class="detail-grid">
      <div class="detail-main">
        <div class="card">
          <div class="card-header">
            <h3>Información General</h3>
            <button class="btn-sm" onclick="editarProyecto('${id}')">
              <i class="fas fa-edit"></i> Editar
            </button>
          </div>
          <div class="card-body">
            <div class="info-grid">
              <div class="info-item">
                <label>Cliente</label>
                <div>${proyecto.cli}</div>
              </div>
              <div class="info-item">
                <label>Empresa</label>
                <div>${proyecto.emp || '-'}</div>
              </div>
              <div class="info-item">
                <label>Categoría</label>
                <div>${proyecto.cat || '-'}</div>
              </div>
              <div class="info-item">
                <label>Tipo</label>
                <div>${proyecto.tipo || '-'}</div>
              </div>
              <div class="info-item">
                <label>Estado</label>
                <div><span class="badge ${getStatusClass(proyecto.status)}">${proyecto.status}</span></div>
              </div>
              <div class="info-item">
                <label>Área</label>
                <div>${proyecto.area}</div>
              </div>
              <div class="info-item full-width">
                <label>Descripción</label>
                <div>${proyecto.desc || '-'}</div>
              </div>
              <div class="info-item full-width">
                <label>Relevamiento</label>
                <div>${proyecto.relev || '-'}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">
            <h3>Actividad</h3>
          </div>
          <div class="card-body">
            ${renderTimelineProyecto(id)}
          </div>
        </div>
      </div>
      
      <div class="detail-sidebar">
        <div class="card">
          <div class="card-header">
            <h3>Contacto</h3>
          </div>
          <div class="card-body">
            <div class="contact-info">
              <div class="contact-item">
                <i class="fas fa-envelope"></i>
                <a href="mailto:${proyecto.email}">${proyecto.email || '-'}</a>
              </div>
              <div class="contact-item">
                <i class="fas fa-phone"></i>
                <a href="tel:${proyecto.tel}">${proyecto.tel || '-'}</a>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">
            <h3>Acciones Rápidas</h3>
          </div>
          <div class="card-body">
            <button class="btn-block" onclick="crearPresupuesto('${id}')">
              <i class="fas fa-file-invoice-dollar"></i> Crear Presupuesto
            </button>
            <button class="btn-block" onclick="transferirProyecto('${id}')">
              <i class="fas fa-share"></i> Transferir
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('content').innerHTML = html;
}

function renderTimelineProyecto(proyectoId) {
  const eventos = (DB.timeline || []).filter(t => t.refId === proyectoId).slice(-10).reverse();
  
  if (eventos.length === 0) {
    return '<div class="empty-state">Sin actividad registrada</div>';
  }
  
  return eventos.map(t => `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <div class="timeline-text">${t.desc}</div>
        <div class="timeline-meta">${t.fecha} • ${t.user || 'Sistema'}</div>
      </div>
    </div>
  `).join('');
}

// ══════════════════════════════════════════════
// MÓDULO: DISEÑO
// ══════════════════════════════════════════════
function renderDiseno() {
  const proyectos = (DB.proyectos || []).filter(p => p.area === 'diseno');
  const solicitudes = DB.solicitudes || [];
  
  const html = `
    <div class="module-header">
      <div>
        <h1><i class="fas fa-pen-nib"></i> Diseño</h1>
        <p>Proyectos y solicitudes de diseño</p>
      </div>
      <button class="btn-primary" onclick="abrirModalSolicitud()">
        <i class="fas fa-plus"></i> Nueva Solicitud
      </button>
    </div>
    
    <div class="tabs">
      <button class="tab active" onclick="cambiarTabDiseno('proyectos')">Proyectos (${proyectos.length})</button>
      <button class="tab" onclick="cambiarTabDiseno('solicitudes')">Solicitudes (${solicitudes.length})</button>
    </div>
    
    <div id="diseno-content">
      ${renderDisenoProyectos(proyectos)}
    </div>
  `;
  
  document.getElementById('content').innerHTML = html;
}

function cambiarTabDiseno(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  
  const content = document.getElementById('diseno-content');
  
  if (tab === 'proyectos') {
    const proyectos = (DB.proyectos || []).filter(p => p.area === 'diseno');
    content.innerHTML = renderDisenoProyectos(proyectos);
  } else {
    const solicitudes = DB.solicitudes || [];
    content.innerHTML = renderDisenoSolicitudes(solicitudes);
  }
}

function renderDisenoProyectos(proyectos) {
  if (proyectos.length === 0) {
    return '<div class="empty-state"><i class="fas fa-inbox"></i><p>No hay proyectos en diseño</p></div>';
  }
  
  return `
    <div class="cards-grid">
      ${proyectos.map(p => `
        <div class="project-card" onclick="verProyecto('${p.id}')">
          <div class="project-card-header">
            <h3>${p.nom}</h3>
            <span class="badge ${getStatusClass(p.status)}">${p.status}</span>
          </div>
          <div class="project-card-body">
            <div class="project-meta">
              <i class="fas fa-user"></i> ${p.cli}
            </div>
            <div class="project-meta">
              <i class="fas fa-tag"></i> ${p.cat || '-'}
            </div>
            <div class="project-meta">
              <i class="fas fa-calendar"></i> ${formatFecha(p.fecha)}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderDisenoSolicitudes(solicitudes) {
  if (solicitudes.length === 0) {
    return '<div class="empty-state"><i class="fas fa-inbox"></i><p>No hay solicitudes de diseño</p></div>';
  }
  
  return `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Solicitud</th>
            <th>Cliente</th>
            <th>Tipo</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${solicitudes.map(s => `
            <tr>
              <td><strong>${s.titulo}</strong></td>
              <td>${s.cliente}</td>
              <td>${s.tipo}</td>
              <td><span class="badge bg-${s.prioridad === 'alta' ? 'red' : s.prioridad === 'media' ? 'orange' : 'blue'}">${s.prioridad}</span></td>
              <td><span class="badge ${getStatusClass(s.status)}">${s.status}</span></td>
              <td>${formatFecha(s.fecha)}</td>
              <td>
                <button class="btn-icon" onclick="verSolicitud('${s.id}')">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="editarSolicitud('${s.id}')">
                  <i class="fas fa-edit"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function abrirModalSolicitud(id = null) {
  const solicitud = id ? DB.solicitudes.find(s => s.id === id) : null;
  const isEdit = !!solicitud;
  
  const modal = `
    <div class="modal-overlay" id="modal-solicitud" onclick="cerrarModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2>${isEdit ? 'Editar Solicitud' : 'Nueva Solicitud de Diseño'}</h2>
          <button class="modal-close" onclick="cerrarModal()">&times;</button>
        </div>
        <div class="modal-body">
          <form onsubmit="guardarSolicitud(event, '${id || ''}')">
            <div class="form-grid">
              <div class="form-group full-width">
                <label>Título *</label>
                <input type="text" id="sol-titulo" value="${solicitud?.titulo || ''}" required>
              </div>
              <div class="form-group">
                <label>Cliente *</label>
                <input type="text" id="sol-cliente" value="${solicitud?.cliente || ''}" required>
              </div>
              <div class="form-group">
                <label>Tipo *</label>
                <select id="sol-tipo" required>
                  <option value="">Seleccionar...</option>
                  <option ${solicitud?.tipo === 'Render' ? 'selected' : ''}>Render</option>
                  <option ${solicitud?.tipo === 'Plano' ? 'selected' : ''}>Plano</option>
                  <option ${solicitud?.tipo === '3D' ? 'selected' : ''}>3D</option>
                  <option ${solicitud?.tipo === 'Presentación' ? 'selected' : ''}>Presentación</option>
                </select>
              </div>
              <div class="form-group">
                <label>Prioridad</label>
                <select id="sol-prioridad">
                  <option value="baja" ${solicitud?.prioridad === 'baja' ? 'selected' : ''}>Baja</option>
                  <option value="media" ${solicitud?.prioridad === 'media' ? 'selected' : ''}>Media</option>
                  <option value="alta" ${solicitud?.prioridad === 'alta' ? 'selected' : ''}>Alta</option>
                </select>
              </div>
              <div class="form-group">
                <label>Estado</label>
                <select id="sol-status">
                  <option value="pendiente" ${solicitud?.status === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                  <option value="proceso" ${solicitud?.status === 'proceso' ? 'selected' : ''}>En Proceso</option>
                  <option value="revision" ${solicitud?.status === 'revision' ? 'selected' : ''}>Revisión</option>
                  <option value="completado" ${solicitud?.status === 'completado' ? 'selected' : ''}>Completado</option>
                </select>
              </div>
              <div class="form-group full-width">
                <label>Descripción</label>
                <textarea id="sol-desc" rows="4">${solicitud?.descripcion || ''}</textarea>
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" onclick="cerrarModal()">Cancelar</button>
              <button type="submit" class="btn-primary">${isEdit ? 'Guardar' : 'Crear'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modal);
}

function guardarSolicitud(e, id) {
  e.preventDefault();
  
  const solicitudData = {
    titulo: document.getElementById('sol-titulo').value.trim(),
    cliente: document.getElementById('sol-cliente').value.trim(),
    tipo: document.getElementById('sol-tipo').value,
    prioridad: document.getElementById('sol-prioridad').value,
    status: document.getElementById('sol-status').value,
    descripcion: document.getElementById('sol-desc').value.trim()
  };
  
  if (id) {
    const solicitud = DB.solicitudes.find(s => s.id === id);
    Object.assign(solicitud, solicitudData);
  } else {
    DB.solicitudes.push({
      id: uid(),
      ...solicitudData,
      fecha: hoy(),
      creadoPor: CURRENT_USER.nombre
    });
  }
  
  guardar();
  cerrarModal();
  renderDiseno();
}

// ══════════════════════════════════════════════
// MÓDULO: PRESUPUESTOS
// ══════════════════════════════════════════════
function renderPresupuestos() {
  const presupuestos = DB.presupuestos || [];
  
  const html = `
    <div class="module-header">
      <div>
        <h1><i class="fas fa-file-invoice-dollar"></i> Presupuestos</h1>
        <p>Gestión de cotizaciones y propuestas</p>
      </div>
      <button class="btn-primary" onclick="crearPresupuesto()">
        <i class="fas fa-plus"></i> Nuevo Presupuesto
      </button>
    </div>
    
    <div class="module-filters">
      <input type="text" id="filtro-ppto" placeholder="Buscar..." onkeyup="filtrarPresupuestos()">
      <select id="filtro-ppto-status" onchange="filtrarPresupuestos()">
        <option value="">Todos los estados</option>
        <option value="borrador">Borrador</option>
        <option value="enviado">Enviado</option>
        <option value="aprobado">Aprobado</option>
        <option value="rechazado">Rechazado</option>
      </select>
    </div>
    
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Nº Ppto</th>
            <th>Cliente</th>
            <th>Proyecto</th>
            <th>Monto</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="tabla-presupuestos">
          ${renderTablaPresupuestos(presupuestos)}
        </tbody>
      </table>
    </div>
  `;
  
  document.getElementById('content').innerHTML = html;
}

function renderTablaPresupuestos(presupuestos) {
  if (presupuestos.length === 0) {
    return '<tr><td colspan="7" class="empty-state">No hay presupuestos registrados</td></tr>';
  }
  
  return presupuestos.map(p => `
    <tr>
      <td><strong>#${p.numero}</strong></td>
      <td>${p.cliente}</td>
      <td>${p.proyecto}</td>
      <td><strong>${pesos(p.total)}</strong></td>
      <td><span class="badge ${getStatusClass(p.status)}">${p.status}</span></td>
      <td>${formatFecha(p.fecha)}</td>
      <td>
        <button class="btn-icon" onclick="verPresupuesto('${p.id}')">
          <i class="fas fa-eye"></i>
        </button>
        <button class="btn-icon" onclick="editarPresupuesto('${p.id}')">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-icon" onclick="descargarPresupuesto('${p.id}')">
          <i class="fas fa-download"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function filtrarPresupuestos() {
  const texto = document.getElementById('filtro-ppto').value.toLowerCase();
  const status = document.getElementById('filtro-ppto-status').value;
  
  let presupuestos = DB.presupuestos || [];
  
  if (texto) {
    presupuestos = presupuestos.filter(p => 
      p.numero.toString().includes(texto) ||
      p.cliente.toLowerCase().includes(texto) ||
      p.proyecto.toLowerCase().includes(texto)
    );
  }
  
  if (status) {
    presupuestos = presupuestos.filter(p => p.status === status);
  }
  
  document.getElementById('tabla-presupuestos').innerHTML = renderTablaPresupuestos(presupuestos);
}

function crearPresupuesto(proyectoId = null) {
  let proyecto = null;
  if (proyectoId) {
    proyecto = DB.proyectos.find(p => p.id === proyectoId);
  }
  
  const modal = `
    <div class="modal-overlay" id="modal-ppto" onclick="cerrarModal(event)">
      <div class="modal-content modal-lg" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2>Nuevo Presupuesto</h2>
          <button class="modal-close" onclick="cerrarModal()">&times;</button>
        </div>
        <div class="modal-body">
          <form onsubmit="guardarPresupuesto(event)">
            <div class="form-grid">
              <div class="form-group">
                <label>Nº Presupuesto</label>
                <input type="text" id="ppto-num" value="${DB.pptoCounter || 3829}" readonly>
              </div>
              <div class="form-group">
                <label>Fecha</label>
                <input type="date" id="ppto-fecha" value="${hoy()}" required>
              </div>
              <div class="form-group">
                <label>Cliente *</label>
                <input type="text" id="ppto-cliente" value="${proyecto?.cli || ''}" required>
              </div>
              <div class="form-group">
                <label>Proyecto *</label>
                <input type="text" id="ppto-proyecto" value="${proyecto?.nom || ''}" required>
              </div>
              <div class="form-group full-width">
                <label>Descripción</label>
                <textarea id="ppto-desc" rows="2">${proyecto?.desc || ''}</textarea>
              </div>
            </div>
            
            <div class="ppto-items-section">
              <div class="section-header">
                <h3>Items del Presupuesto</h3>
                <button type="button" class="btn-sm" onclick="agregarItemPpto()">
                  <i class="fas fa-plus"></i> Agregar Item
                </button>
              </div>
              <div id="ppto-items">
                <div class="ppto-item">
                  <input type="text" placeholder="Descripción" class="ppto-item-desc" required>
                  <input type="number" placeholder="Cantidad" class="ppto-item-cant" value="1" min="1" required>
                  <input type="number" placeholder="Precio Unit." class="ppto-item-precio" value="0" min="0" required>
                  <span class="ppto-item-subtotal">$0</span>
                  <button type="button" class="btn-icon" onclick="eliminarItemPpto(this)">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
            
            <div class="ppto-totales">
              <div class="total-row">
                <span>Subtotal:</span>
                <strong id="ppto-subtotal">$0</strong>
              </div>
              <div class="total-row">
                <span>IVA (21%):</span>
                <strong id="ppto-iva">$0</strong>
              </div>
              <div class="total-row total-final">
                <span>TOTAL:</span>
                <strong id="ppto-total">$0</strong>
              </div>
            </div>
            
            <div class="modal-actions">
              <button type="button" class="btn-secondary" onclick="cerrarModal()">Cancelar</button>
              <button type="submit" class="btn-primary">Guardar Presupuesto</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modal);
  calcularTotalesPpto();
}

function agregarItemPpto() {
  const itemsContainer = document.getElementById('ppto-items');
  const nuevoItem = document.createElement('div');
  nuevoItem.className = 'ppto-item';
  nuevoItem.innerHTML = `
    <input type="text" placeholder="Descripción" class="ppto-item-desc" required>
    <input type="number" placeholder="Cantidad" class="ppto-item-cant" value="1" min="1" required onchange="calcularTotalesPpto()">
    <input type="number" placeholder="Precio Unit." class="ppto-item-precio" value="0" min="0" required onchange="calcularTotalesPpto()">
    <span class="ppto-item-subtotal">$0</span>
    <button type="button" class="btn-icon" onclick="eliminarItemPpto(this)">
      <i class="fas fa-times"></i>
    </button>
  `;
  itemsContainer.appendChild(nuevoItem);
}

function eliminarItemPpto(btn) {
  btn.closest('.ppto-item').remove();
  calcularTotalesPpto();
}

function calcularTotalesPpto() {
  const items = document.querySelectorAll('.ppto-item');
  let subtotal = 0;
  
  items.forEach(item => {
    const cant = parseFloat(item.querySelector('.ppto-item-cant').value) || 0;
    const precio = parseFloat(item.querySelector('.ppto-item-precio').value) || 0;
    const itemSubtotal = cant * precio;
    
    item.querySelector('.ppto-item-subtotal').textContent = pesos(itemSubtotal);
    subtotal += itemSubtotal;
  });
  
  const iva = subtotal * 0.21;
  const total = subtotal + iva;
  
  document.getElementById('ppto-subtotal').textContent = pesos(subtotal);
  document.getElementById('ppto-iva').textContent = pesos(iva);
  document.getElementById('ppto-total').textContent = pesos(total);
}

function guardarPresupuesto(e) {
  e.preventDefault();
  
  const items = [];
  document.querySelectorAll('.ppto-item').forEach(item => {
    items.push({
      desc: item.querySelector('.ppto-item-desc').value,
      cant: parseFloat(item.querySelector('.ppto-item-cant').value),
      precio: parseFloat(item.querySelector('.ppto-item-precio').value)
    });
  });
  
  const subtotal = items.reduce((sum, i) => sum + (i.cant * i.precio), 0);
  const iva = subtotal * 0.21;
  const total = subtotal + iva;
  
  const nuevoPpto = {
    id: uid(),
    numero: DB.pptoCounter,
    fecha: document.getElementById('ppto-fecha').value,
    cliente: document.getElementById('ppto-cliente').value,
    proyecto: document.getElementById('ppto-proyecto').value,
    descripcion: document.getElementById('ppto-desc').value,
    items: items,
    subtotal: subtotal,
    iva: iva,
    total: total,
    status: 'borrador',
    creadoPor: CURRENT_USER.nombre,
    creadoEn: hoy()
  };
  
  DB.presupuestos.push(nuevoPpto);
  DB.pptoCounter++;
  
  registrarTimeline('presupuesto', nuevoPpto.id, `Presupuesto #${nuevoPpto.numero} creado`);
  
  guardar();
  cerrarModal();
  renderPresupuestos();
}

function descargarPresupuesto(id) {
  alert('Función de descarga PDF en desarrollo');
}

// ══════════════════════════════════════════════
// MÓDULO: CONTABLE
// ══════════════════════════════════════════════
function renderContable() {
  const html = `
    <div class="module-header">
      <div>
        <h1><i class="fas fa-coins"></i> Contable</h1>
        <p>Gestión de cobros y pagos</p>
      </div>
    </div>
    
    <div class="tabs">
      <button class="tab active" onclick="cambiarTabContable('cobros')">Cobros</button>
      <button class="tab" onclick="cambiarTabContable('pagos')">Pagos</button>
    </div>
    
    <div id="contable-content">
      ${renderCobros()}
    </div>
  `;
  
  document.getElementById('content').innerHTML = html;
}

function cambiarTabContable(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  
  const content = document.getElementById('contable-content');
  content.innerHTML = tab === 'cobros' ? renderCobros() : renderPagos();
}

function renderCobros() {
  const cobros = DB.cobros || [];
  
  return `
    <div class="module-actions">
      <button class="btn-primary" onclick="abrirModalCobro()">
        <i class="fas fa-plus"></i> Registrar Cobro
      </button>
    </div>
    
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Concepto</th>
            <th>Forma de Pago</th>
            <th>Monto</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${cobros.length === 0 ? '<tr><td colspan="6" class="empty-state">No hay cobros registrados</td></tr>' : cobros.map(c => `
            <tr>
              <td>${formatFecha(c.fecha)}</td>
              <td>${c.cliente}</td>
              <td>${c.concepto}</td>
              <td>${c.formaPago}</td>
              <td><strong>${pesos(c.monto)}</strong></td>
              <td>
                <button class="btn-icon" onclick="verCobro('${c.id}')">
                  <i class="fas fa-eye"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderPagos() {
  const pagos = DB.pagos || [];
  
  return `
    <div class="module-actions">
      <button class="btn-primary" onclick="abrirModalPago()">
        <i class="fas fa-plus"></i> Registrar Pago
      </button>
    </div>
    
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Proveedor</th>
            <th>Concepto</th>
            <th>Forma de Pago</th>
            <th>Monto</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${pagos.length === 0 ? '<tr><td colspan="6" class="empty-state">No hay pagos registrados</td></tr>' : pagos.map(p => `
            <tr>
              <td>${formatFecha(p.fecha)}</td>
              <td>${p.proveedor}</td>
              <td>${p.concepto}</td>
              <td>${p.formaPago}</td>
              <td><strong>${pesos(p.monto)}</strong></td>
              <td>
                <button class="btn-icon" onclick="verPago('${p.id}')">
                  <i class="fas fa-eye"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function abrirModalCobro(id = null) {
  const cobro = id ? DB.cobros.find(c => c.id === id) : null;
  
  const modal = `
    <div class="modal-overlay" id="modal-cobro" onclick="cerrarModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2>${cobro ? 'Ver Cobro' : 'Registrar Cobro'}</h2>
          <button class="modal-close" onclick="cerrarModal()">&times;</button>
        </div>
        <div class="modal-body">
          <form onsubmit="guardarCobro(event, '${id || ''}')">
            <div class="form-grid">
              <div class="form-group">
                <label>Fecha *</label>
                <input type="date" id="cobro-fecha" value="${cobro?.fecha || hoy()}" required>
              </div>
              <div class="form-group">
                <label>Cliente *</label>
                <input type="text" id="cobro-cliente" value="${cobro?.cliente || ''}" required>
              </div>
              <div class="form-group">
                <label>Monto *</label>
                <input type="number" id="cobro-monto" value="${cobro?.monto || ''}" min="0" required>
              </div>
              <div class="form-group">
                <label>Forma de Pago *</label>
                <select id="cobro-forma" required>
                  <option value="">Seleccionar...</option>
                  <option ${cobro?.formaPago === 'Efectivo' ? 'selected' : ''}>Efectivo</option>
                  <option ${cobro?.formaPago === 'Transferencia' ? 'selected' : ''}>Transferencia</option>
                  <option ${cobro?.formaPago === 'Cheque' ? 'selected' : ''}>Cheque</option>
                  <option ${cobro?.formaPago === 'Tarjeta' ? 'selected' : ''}>Tarjeta</option>
                </select>
              </div>
              <div class="form-group full-width">
                <label>Concepto *</label>
                <input type="text" id="cobro-concepto" value="${cobro?.concepto || ''}" required>
              </div>
              <div class="form-group full-width">
                <label>Observaciones</label>
                <textarea id="cobro-obs" rows="2">${cobro?.observaciones || ''}</textarea>
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" onclick="cerrarModal()">Cancelar</button>
              <button type="submit" class="btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modal);
}

function guardarCobro(e, id) {
  e.preventDefault();
  
  const cobroData = {
    fecha: document.getElementById('cobro-fecha').value,
    cliente: document.getElementById('cobro-cliente').value,
    monto: parseFloat(document.getElementById('cobro-monto').value),
    formaPago: document.getElementById('cobro-forma').value,
    concepto: document.getElementById('cobro-concepto').value,
    observaciones: document.getElementById('cobro-obs').value
  };
  
  if (id) {
    const cobro = DB.cobros.find(c => c.id === id);
    Object.assign(cobro, cobroData);
  } else {
    DB.cobros.push({
      id: uid(),
      ...cobroData,
      registradoPor: CURRENT_USER.nombre,
      registradoEn: hoy()
    });
  }
  
  guardar();
  cerrarModal();
  renderContable();
}

function abrirModalPago(id = null) {
  const pago = id ? DB.pagos.find(p => p.id === id) : null;
  
  const modal = `
    <div class="modal-overlay" id="modal-pago" onclick="cerrarModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2>${pago ? 'Ver Pago' : 'Registrar Pago'}</h2>
          <button class="modal-close" onclick="cerrarModal()">&times;</button>
        </div>
        <div class="modal-body">
          <form onsubmit="guardarPago(event, '${id || ''}')">
            <div class="form-grid">
              <div class="form-group">
                <label>Fecha *</label>
                <input type="date" id="pago-fecha" value="${pago?.fecha || hoy()}" required>
              </div>
              <div class="form-group">
                <label>Proveedor *</label>
                <input type="text" id="pago-proveedor" value="${pago?.proveedor || ''}" required>
              </div>
              <div class="form-group">
                <label>Monto *</label>
                <input type="number" id="pago-monto" value="${pago?.monto || ''}" min="0" required>
              </div>
              <div class="form-group">
                <label>Forma de Pago *</label>
                <select id="pago-forma" required>
                  <option value="">Seleccionar...</option>
                  <option ${pago?.formaPago === 'Efectivo' ? 'selected' : ''}>Efectivo</option>
                  <option ${pago?.formaPago === 'Transferencia' ? 'selected' : ''}>Transferencia</option>
                  <option ${pago?.formaPago === 'Cheque' ? 'selected' : ''}>Cheque</option>
                  <option ${pago?.formaPago === 'Tarjeta' ? 'selected' : ''}>Tarjeta</option>
                </select>
              </div>
              <div class="form-group full-width">
                <label>Concepto *</label>
                <input type="text" id="pago-concepto" value="${pago?.concepto || ''}" required>
              </div>
              <div class="form-group full-width">
                <label>Observaciones</label>
                <textarea id="pago-obs" rows="2">${pago?.observaciones || ''}</textarea>
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" onclick="cerrarModal()">Cancelar</button>
              <button type="submit" class="btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modal);
}

function guardarPago(e, id) {
  e.preventDefault();
  
  const pagoData = {
    fecha: document.getElementById('pago-fecha').value,
    proveedor: document.getElementById('pago-proveedor').value,
    monto: parseFloat(document.getElementById('pago-monto').value),
    formaPago: document.getElementById('pago-forma').value,
    concepto: document.getElementById('pago-concepto').value,
    observaciones: document.getElementById('pago-obs').value
  };
  
  if (id) {
    const pago = DB.pagos.find(p => p.id === id);
    Object.assign(pago, pagoData);
  } else {
    DB.pagos.push({
      id: uid(),
      ...pagoData,
      registradoPor: CURRENT_USER.nombre,
      registradoEn: hoy()
    });
  }
  
  guardar();
  cerrarModal();
  renderContable();
}

// ══════════════════════════════════════════════
// MÓDULO: ADMINISTRACIÓN (Gastos & RRHH)
// ══════════════════════════════════════════════
function renderAdministracion() {
  const html = `
    <div class="module-header">
      <div>
        <h1><i class="fas fa-briefcase"></i> Administración</h1>
        <p>Gastos operativos y recursos humanos</p>
      </div>
    </div>
    
    <div class="tabs">
      <button class="tab active" onclick="cambiarTabAdmin('gastos')">Gastos</button>
      <button class="tab" onclick="cambiarTabAdmin('rrhh')">RRHH</button>
    </div>
    
    <div id="admin-content">
      ${renderGastos()}
    </div>
  `;
  
  document.getElementById('content').innerHTML = html;
}

function cambiarTabAdmin(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  
  const content = document.getElementById('admin-content');
  content.innerHTML = tab === 'gastos' ? renderGastos() : renderRRHH();
}

function renderGastos() {
  const gastos = DB.gastos || [];
  
  return `
    <div class="module-actions">
      <button class="btn-primary" onclick="abrirModalGasto()">
        <i class="fas fa-plus"></i> Registrar Gasto
      </button>
    </div>
    
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Categoría</th>
            <th>Descripción</th>
            <th>Proveedor</th>
            <th>Monto</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${gastos.length === 0 ? '<tr><td colspan="6" class="empty-state">No hay gastos registrados</td></tr>' : gastos.map(g => `
            <tr>
              <td>${formatFecha(g.fecha)}</td>
              <td><span class="badge bg-blue">${g.categoria}</span></td>
              <td>${g.descripcion}</td>
              <td>${g.proveedor || '-'}</td>
              <td><strong>${pesos(g.monto)}</strong></td>
              <td>
                <button class="btn-icon" onclick="editarGasto('${g.id}')">
                  <i class="fas fa-edit"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderRRHH() {
  return `
    <div class="empty-state">
      <i class="fas fa-users"></i>
      <h3>Módulo en desarrollo</h3>
      <p>Gestión de recursos humanos, nóminas y licencias</p>
    </div>
  `;
}

function abrirModalGasto(id = null) {
  const gasto = id ? DB.gastos.find(g => g.id === id) : null;
  
  const modal = `
    <div class="modal-overlay" id="modal-gasto" onclick="cerrarModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2>${gasto ? 'Editar Gasto' : 'Registrar Gasto'}</h2>
          <button class="modal-close" onclick="cerrarModal()">&times;</button>
        </div>
        <div class="modal-body">
          <form onsubmit="guardarGasto(event, '${id || ''}')">
            <div class="form-grid">
              <div class="form-group">
                <label>Fecha *</label>
                <input type="date" id="gasto-fecha" value="${gasto?.fecha || hoy()}" required>
              </div>
              <div class="form-group">
                <label>Categoría *</label>
                <select id="gasto-cat" required>
                  <option value="">Seleccionar...</option>
                  <option ${gasto?.categoria === 'Alquiler' ? 'selected' : ''}>Alquiler</option>
                  <option ${gasto?.categoria === 'Servicios' ? 'selected' : ''}>Servicios</option>
                  <option ${gasto?.categoria === 'Impuestos' ? 'selected' : ''}>Impuestos</option>
                  <option ${gasto?.categoria === 'Honorarios' ? 'selected' : ''}>Honorarios</option>
                  <option ${gasto?.categoria === 'Sueldos' ? 'selected' : ''}>Sueldos</option>
                  <option ${gasto?.categoria === 'Otros' ? 'selected' : ''}>Otros</option>
                </select>
              </div>
              <div class="form-group">
                <label>Proveedor</label>
                <input type="text" id="gasto-prov" value="${gasto?.proveedor || ''}">
              </div>
              <div class="form-group">
                <label>Monto *</label>
                <input type="number" id="gasto-monto" value="${gasto?.monto || ''}" min="0" required>
              </div>
              <div class="form-group full-width">
                <label>Descripción *</label>
                <input type="text" id="gasto-desc" value="${gasto?.descripcion || ''}" required>
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" onclick="cerrarModal()">Cancelar</button>
              <button type="submit" class="btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modal);
}

function guardarGasto(e, id) {
  e.preventDefault();
  
  const gastoData = {
    fecha: document.getElementById('gasto-fecha').value,
    categoria: document.getElementById('gasto-cat').value,
    proveedor: document.getElementById('gasto-prov').value,
    monto: parseFloat(document.getElementById('gasto-monto').value),
    descripcion: document.getElementById('gasto-desc').value
  };
  
  if (id) {
    const gasto = DB.gastos.find(g => g.id === id);
    Object.assign(gasto, gastoData);
  } else {
    DB.gastos.push({
      id: uid(),
      ...gastoData,
      registradoPor: CURRENT_USER.nombre
    });
  }
  
  guardar();
  cerrarModal();
  renderAdministracion();
}

// ══════════════════════════════════════════════
// MÓDULO: FINANCIERO
// ══════════════════════════════════════════════
function renderFinanciero() {
  const cobros = DB.cobros || [];
  const pagos = DB.pagos || [];
  const gastos = DB.gastos || [];
  
  const totalCobros = cobros.reduce((sum, c) => sum + parseFloat(c.monto || 0), 0);
  const totalPagos = pagos.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);
  const totalGastos = gastos.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0);
  const saldo = totalCobros - totalPagos - totalGastos;
  
  const html = `
    <div class="module-header">
      <div>
        <h1><i class="fas fa-chart-line"></i> Financiero</h1>
        <p>Análisis financiero y reportes</p>
      </div>
    </div>
    
    <div class="dash-stats">
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--green1);color:var(--green6)">
          <i class="fas fa-arrow-down"></i>
        </div>
        <div class="stat-info">
          <div class="stat-label">Total Ingresos</div>
          <div class="stat-value">${pesos(totalCobros)}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--red1);color:var(--red6)">
          <i class="fas fa-arrow-up"></i>
        </div>
        <div class="stat-info">
          <div class="stat-label">Total Egresos</div>
          <div class="stat-value">${pesos(totalPagos + totalGastos)}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--blue1);color:var(--blue6)">
          <i class="fas fa-balance-scale"></i>
        </div>
        <div class="stat-info">
          <div class="stat-label">Saldo</div>
          <div class="stat-value" style="color:${saldo >= 0 ? 'var(--green6)' : 'var(--red6)'}">${pesos(saldo)}</div>
        </div>
      </div>
    </div>
    
    <div class="dash-panel">
      <div class="panel-header">
        <h3>Resumen Financiero</h3>
      </div>
      <div class="panel-body">
        <div class="empty-state">
          <i class="fas fa-chart-pie"></i>
          <h3>Reportes en desarrollo</h3>
          <p>Gráficos y análisis financiero detallado</p>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('content').innerHTML = html;
}

// ══════════════════════════════════════════════
// MÓDULO: USUARIOS
// ══════════════════════════════════════════════
function renderUsuarios() {
  const usuarios = DB.usuarios || [];
  
  const html = `
    <div class="module-header">
      <div>
        <h1><i class="fas fa-users-cog"></i> Usuarios</h1>
        <p>Administración de usuarios y permisos</p>
      </div>
      <button class="btn-primary" onclick="abrirModalUsuario()">
        <i class="fas fa-user-plus"></i> Nuevo Usuario
      </button>
    </div>
    
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Módulos</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${usuarios.map(u => `
            <tr>
              <td><strong>${u.nombre}</strong></td>
              <td>${u.email}</td>
              <td><span class="badge ${u.rol === 'admin' ? 'bg-purple' : 'bg-blue'}">${u.rol}</span></td>
              <td><span class="badge ${u.status === 'activo' ? 'bg-green' : u.status === 'inactivo' ? 'bg-red' : 'bg-orange'}">${u.status}</span></td>
              <td>${u.modulos?.length || 0} módulos</td>
              <td>
                <button class="btn-icon" onclick="editarUsuario('${u.id}')" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                ${u.id !== 'u-admin' ? `
                  <button class="btn-icon" onclick="toggleUsuarioStatus('${u.id}')" title="Activar/Desactivar">
                    <i class="fas fa-power-off"></i>
                  </button>
                ` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  document.getElementById('content').innerHTML = html;
}

function abrirModalUsuario(id = null) {
  const usuario = id ? DB.usuarios.find(u => u.id === id) : null;
  const isEdit = !!usuario;
  
  const modal = `
    <div class="modal-overlay" id="modal-usuario" onclick="cerrarModal(event)">
      <div class="modal-content modal-lg" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2>${isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
          <button class="modal-close" onclick="cerrarModal()">&times;</button>
        </div>
        <div class="modal-body">
          <form onsubmit="guardarUsuario(event, '${id || ''}')">
            <div class="form-grid">
              <div class="form-group">
                <label>Nombre completo *</label>
                <input type="text" id="usr-nombre" value="${usuario?.nombre || ''}" required>
              </div>
              <div class="form-group">
                <label>Email *</label>
                <input type="email" id="usr-email" value="${usuario?.email || ''}" required>
              </div>
              ${!isEdit ? `
                <div class="form-group">
                  <label>Contraseña *</label>
                  <input type="password" id="usr-pass" minlength="6" required>
                </div>
                <div class="form-group">
                  <label>Confirmar contraseña *</label>
                  <input type="password" id="usr-pass2" minlength="6" required>
                </div>
              ` : ''}
              <div class="form-group">
                <label>Rol *</label>
                <select id="usr-rol" required ${usuario?.id === 'u-admin' ? 'disabled' : ''}>
                  <option value="user" ${usuario?.rol === 'user' ? 'selected' : ''}>Usuario</option>
                  <option value="admin" ${usuario?.rol === 'admin' ? 'selected' : ''}>Administrador</option>
                </select>
              </div>
              <div class="form-group">
                <label>Estado *</label>
                <select id="usr-status" required ${usuario?.id === 'u-admin' ? 'disabled' : ''}>
                  <option value="activo" ${usuario?.status === 'activo' ? 'selected' : ''}>Activo</option>
                  <option value="inactivo" ${usuario?.status === 'inactivo' ? 'selected' : ''}>Inactivo</option>
                  <option value="pendiente" ${usuario?.status === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                </select>
              </div>
              <div class="form-group full-width">
                <label>Notas</label>
                <textarea id="usr-nota" rows="2">${usuario?.nota || ''}</textarea>
              </div>
            </div>
            
            <div class="permisos-section">
              <h3>Permisos de Módulos</h3>
              <div class="permisos-grid">
                ${MODULOS_ALL.map(m => `
                  <label class="checkbox-label">
                    <input type="checkbox" 
                           class="modulo-check" 
                           value="${m.id}" 
                           ${usuario?.modulos?.includes(m.id) ? 'checked' : ''}
                           ${usuario?.id === 'u-admin' && m.id === 'usuarios' ? 'disabled' : ''}>
                    <i class="fas ${m.icon}"></i> ${m.label}
                  </label>
                `).join('')}
              </div>
            </div>
            
            <div class="modal-actions">
              <button type="button" class="btn-secondary" onclick="cerrarModal()">Cancelar</button>
              <button type="submit" class="btn-primary">${isEdit ? 'Guardar' : 'Crear'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modal);
}

function guardarUsuario(e, id) {
  e.preventDefault();
  
  const nombre = document.getElementById('usr-nombre').value.trim();
  const email = document.getElementById('usr-email').value.trim();
  const rol = document.getElementById('usr-rol').value;
  const status = document.getElementById('usr-status').value;
  const nota = document.getElementById('usr-nota').value.trim();
  
  const modulosSeleccionados = Array.from(document.querySelectorAll('.modulo-check:checked')).map(cb => cb.value);
  
  // Admins siempre tienen acceso a usuarios
  if (rol === 'admin' && !modulosSeleccionados.includes('usuarios')) {
    modulosSeleccionados.push('usuarios');
  }
  
  if (id) {
    // Editar
    const usuario = DB.usuarios.find(u => u.id === id);
    usuario.nombre = nombre;
    usuario.email = email;
    if (id !== 'u-admin') {
      usuario.rol = rol;
      usuario.status = status;
    }
    usuario.nota = nota;
    usuario.modulos = modulosSeleccionados;
  } else {
    // Crear
    const pass = document.getElementById('usr-pass').value;
    const pass2 = document.getElementById('usr-pass2').value;
    
    if (pass !== pass2) {
      alert('Las contraseñas no coinciden');
      return;
    }
    
    if (DB.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      alert('Ya existe un usuario con este email');
      return;
    }
    
    DB.usuarios.push({
      id: uid(),
      nombre: nombre,
      email: email,
      passHash: btoa(pass),
      rol: rol,
      status: status,
      nota: nota,
      modulos: modulosSeleccionados,
      creadoEn: hoy()
    });
  }
  
  guardar();
  cerrarModal();
  renderUsuarios();
}

function editarUsuario(id) {
  abrirModalUsuario(id);
}

function toggleUsuarioStatus(id) {
  const usuario = DB.usuarios.find(u => u.id === id);
  if (!usuario || id === 'u-admin') return;
  
  usuario.status = usuario.status === 'activo' ? 'inactivo' : 'activo';
  guardar();
  renderUsuarios();
}

// ══════════════════════════════════════════════
// UTILIDADES GLOBALES
// ══════════════════════════════════════════════
function cerrarModal(event) {
  if (event && event.target !== event.currentTarget) return;
  
  const modales = document.querySelectorAll('.modal-overlay');
  modales.forEach(m => m.remove());
}

function getStatusClass(status) {
  const statusMap = {
    nuevo: 'bg-blue',
    contactado: 'bg-cyan',
    calificado: 'bg-purple',
    convertido: 'bg-green',
    perdido: 'bg-red',
    presupuestando: 'bg-orange',
    esperando: 'bg-yellow',
    negociacion: 'bg-purple',
    ganado: 'bg-green',
    planificacion: 'bg-blue',
    ejecucion: 'bg-cyan',
    revision: 'bg-orange',
    finalizado: 'bg-green',
    cancelado: 'bg-red',
    borrador: 'bg-gray',
    enviado: 'bg-blue',
    aprobado: 'bg-green',
    rechazado: 'bg-red',
    pendiente: 'bg-orange',
    proceso: 'bg-blue',
    completado: 'bg-green',
    activo: 'bg-green',
    inactivo: 'bg-red'
  };
  
  return statusMap[status] || 'bg-gray';
}

function formatFecha(fecha) {
  if (!fecha) return '-';
  const d = new Date(fecha + 'T00:00:00');
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function registrarTimeline(tipo, refId, descripcion) {
  DB.timeline = DB.timeline || [];
  DB.timeline.push({
    id: uid(),
    tipo: tipo,
    refId: refId,
    desc: descripcion,
    fecha: new Date().toLocaleString('es-AR'),
    user: CURRENT_USER?.nombre || 'Sistema'
  });
}
