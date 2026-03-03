// FORMA — módulo: presupuestos

  pptoItems = [];
  document.getElementById('m-ppto-title').textContent = 'Nuevo Presupuesto';
  // Generar número
  if (!DB.pptoCounter) DB.pptoCounter = 3829;
  DB.pptoCounter++;
  guardar();
  document.getElementById('m-ppto-num').textContent = 'N° ' + String(DB.pptoCounter).padStart(4,'0');
  // Limpiar campos
  const hoy = new Date().toISOString().split('T')[0];
  document.getElementById('pp-fecha').value = hoy;
  document.getElementById('pp-cliente').value = '';
  document.getElementById('pp-cuit').value = '';
  document.getElementById('pp-dto').value = '0';
  document.getElementById('pp-status').value = 'borrador';
  document.getElementById('pp-notas').value = '';
  document.getElementById('ppto-delete-btn').style.display = 'none';
  // Cargar select de proyectos
  _cargarSelectProyectosPpto(null);
  renderPptoItems();
  recalcPpto();
  abrir('m-presupuesto');
}

function nuevoPptoParaProy(proyId) {
  // Navegar al módulo presupuestos primero, luego abrir modal con proyecto referenciado
  cerrar('m-detalle');
  go('presupuestos');
  setTimeout(() => {
    nuevoPpto();
    const sel = document.getElementById('pp-proyecto');
    if (sel) {
      sel.value = proyId;
      autoFillClientePpto();
    }
  }, 80);
}

function editarPpto(id) {
  const p = DB.presupuestos.find(x => x.id === id);
  if (!p) return;
  editPptoId = id;
  pptoItems = JSON.parse(JSON.stringify(p.items || []));
  document.getElementById('m-ppto-title').textContent = 'Editar Presupuesto';
  document.getElementById('m-ppto-num').textContent = p.numero || '';
  // Cargar select de proyectos
  _cargarSelectProyectosPpto(p.proyId || null);
  // Campos
  document.getElementById('pp-cliente').value = p.cliente || '';
  document.getElementById('pp-cuit').value = p.cuit || '';
  // Fecha: convertir DD/MM/YYYY a YYYY-MM-DD para el input date
  if (p.fecha) {
    const partes = p.fecha.split('/');
    document.getElementById('pp-fecha').value = partes.length === 3
      ? `${partes[2]}-${partes[1].padStart(2,'0')}-${partes[0].padStart(2,'0')}`
      : p.fecha;
  }
  document.getElementById('pp-status').value = p.status || 'borrador';
  document.getElementById('pp-dto').value = p.dto || '0';
  document.getElementById('pp-notas').value = p.notas || '';
  document.getElementById('ppto-delete-btn').style.display = 'inline-flex';
  renderPptoItems();
  recalcPpto();
  abrir('m-presupuesto');
}

function _cargarSelectProyectosPpto(selectedId) {
  const sel = document.getElementById('pp-proyecto');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Sin proyecto —</option>' +
    DB.proyectos.filter(p => p.status !== 'cancelado').map(p =>
      `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${p.nom}${p.cli ? ' — ' + p.cli : ''}</option>`
    ).join('');
}

function autoFillClientePpto() {
  const proyId = document.getElementById('pp-proyecto').value;
  if (!proyId) return;
  const proy = DB.proyectos.find(x => x.id === proyId);
  if (!proy) return;
  if (proy.cli) document.getElementById('pp-cliente').value = proy.cli;
  // Buscar CUIT del contacto asociado si existe
  const contacto = DB.leads.find(l =>
    (l.nombreCompleto || l.nom + ' ' + l.ape).trim().toLowerCase() === (proy.cli||'').toLowerCase()
  );
  if (contacto && contacto.cuit) document.getElementById('pp-cuit').value = contacto.cuit;
}

function guardarPpto() {
  const numero = document.getElementById('m-ppto-num').textContent.replace('N° ','').trim();
  const proyId  = document.getElementById('pp-proyecto').value;
  const proy    = DB.proyectos.find(x => x.id === proyId);
  const fechaRaw = document.getElementById('pp-fecha').value;
  const fecha = fechaRaw
    ? fechaRaw.split('-').reverse().join('/')
    : new Date().toLocaleDateString('es-AR');

  // Calcular totales
  let totalCompra=0, totalFlete=0, totalMargen=0, totalIvaV=0, totalIibb=0, totalFinal=0;
  pptoItems.filter(i=>i.tipo==='item').forEach(item => {
    const c = calcItem(item);
    totalCompra += c.totalCompra || 0;
    totalFlete  += c.subtotalFlete || 0;
    totalMargen += c.margen || 0;
    totalIvaV   += c.ivaVentasTotal || 0;
    totalIibb   += c.iibbTotal || 0;
    totalFinal  += c.totalFinal || 0;
  });
  const dto = parseFloat(document.getElementById('pp-dto').value) || 0;
  const descuento = totalFinal * (dto / 100);
  totalFinal = totalFinal - descuento;
  const gananciaPct = totalCompra > 0 ? ((totalMargen / totalCompra) * 100) : 0;

  const data = {
    id:        editPptoId || nid(),
    numero:    numero,
    proyId:    proyId || null,
    proyNom:   proy ? proy.nom : '',
    cliente:   v('pp-cliente'),
    cuit:      v('pp-cuit'),
    fecha:     fecha,
    status:    document.getElementById('pp-status').value,
    factura:   document.getElementById('pp-factura').value,
    dto:       String(dto),
    notas:     v('pp-notas'),
    items:     JSON.parse(JSON.stringify(pptoItems)),
    totalFinal:  totalFinal,
    gananciaPct: gananciaPct,
    pagosParciales: editPptoId
      ? (DB.presupuestos.find(x=>x.id===editPptoId)?.pagosParciales || [])
      : []
  };

  const pid = editPptoId || ppto.id;
  if (editPptoId) {
    const idx = DB.presupuestos.findIndex(x => x.id === editPptoId);
    if (idx !== -1) DB.presupuestos[idx] = data;
  } else {
    DB.presupuestos.push(data);
  }
  guardar();
  cerrar('m-presupuesto');
  // Abrir detalle inmediatamente con las 3 áreas visibles
  if (pid) {
    setTimeout(() => { abrirDetallePpto(pid); }, 80);
  } else {
    go(modulo);
  }
}

function eliminarPpto() {
  if (!editPptoId) return;
  if (!confirm('¿Eliminar este presupuesto? Esta acción no se puede deshacer.')) return;
  DB.presupuestos = DB.presupuestos.filter(x => x.id !== editPptoId);
  guardar();
  cerrar('m-presupuesto');
  go(modulo);
}

function renderPptoItems() {
  const tbody = document.getElementById('ppto-items-body');
  if (!tbody) return;
  if (!pptoItems.length) {
    tbody.innerHTML = '<tr><td colspan="13" style="text-align:center;padding:20px;color:var(--ink4)">Sin ítems. Agregá una sección o un ítem.</td></tr>';
    return;
  }
  tbody.innerHTML = pptoItems.map((item, idx) => {
    if (item.tipo === 'seccion') {
      return `<tr style="background:var(--ink);color:#fff">
        <td style="padding:8px 10px;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.5px" colspan="12">▸ ${item.nombre||'Sección'}</td>
        <td style="padding:8px 10px;text-align:center">
          <button onclick="pptoItems.splice(${idx},1);renderPptoItems();recalcPpto()" style="background:none;border:none;color:#fff;cursor:pointer;opacity:.6"><i class="fa fa-trash"></i></button>
        </td>
      </tr>`;
    }
    const c = calcItem(item);
    const inp = 'border:1px solid #d1d5db;border-radius:5px;padding:7px 8px;font-size:13px;background:#fffbea;box-sizing:border-box';
    return `<tr style="vertical-align:middle">
      <td style="padding:10px 8px;color:var(--ink3);font-size:12px;text-align:center">${idx+1}</td>
      <td style="padding:10px 8px"><input value="${item.desc||''}" onchange="pptoItems[${idx}].desc=this.value" style="${inp};width:100%;min-width:180px"></td>
      <td style="padding:10px 8px"><input type="number" value="${item.costo||0}" onchange="pptoItems[${idx}].costo=+this.value;renderPptoItems();recalcPpto()" style="${inp};width:110px;text-align:right"></td>
      <td style="padding:10px 8px"><input type="number" value="${item.flete||20}" onchange="pptoItems[${idx}].flete=+this.value;renderPptoItems();recalcPpto()" style="${inp};width:62px;text-align:center"></td>
      <td style="padding:10px 8px"><input type="number" value="${item.margen||35}" onchange="pptoItems[${idx}].margen=+this.value;renderPptoItems();recalcPpto()" style="${inp};width:62px;text-align:center"></td>
      <td style="padding:10px 8px"><input type="number" value="${item.cant||1}" min="1" onchange="pptoItems[${idx}].cant=+this.value;renderPptoItems();recalcPpto()" style="${inp};width:58px;text-align:center"></td>
      <td style="padding:10px 8px;text-align:right;font-size:13px;color:var(--ink3)">${pesos(c.subtotalFlete||0)}</td>
      <td style="padding:10px 8px;text-align:right;font-size:13px">${pesos(c.precioVentaNeto||0)}</td>
      <td style="padding:10px 8px"><input type="number" value="${item.iva!=null?item.iva:21}" step="0.5" onchange="pptoItems[${idx}].iva=+this.value;renderPptoItems();recalcPpto()" style="${inp};width:62px;text-align:center"></td>
      <td style="padding:10px 8px;font-size:13px;text-align:center;color:var(--ink3)">3.5%</td>
      <td style="padding:10px 8px;text-align:right;font-size:13px;font-weight:600;color:var(--accent)">${pesos(c.precioFinalUnit||0)}</td>
      <td style="padding:10px 8px;text-align:right;font-size:14px;font-weight:700;color:var(--green)">${pesos(c.totalLinea||0)}</td>
      <td style="padding:10px 8px;text-align:center">
        <button onclick="pptoItems.splice(${idx},1);renderPptoItems();recalcPpto()" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:16px"><i class="fa fa-times"></i></button>
      </td>
    </tr>`;
  }).join('');
}

function agregarItem() {
  pptoItems.push({ tipo:'item', desc:'', costo:0, flete:0.08, margen:0.30, cant:1, iva:0.21 });
  renderPptoItems();
  recalcPpto();
}

function agregarSeccion() {
  pptoItems.push({ tipo:'seccion', nombre:'Nueva sección' });
  renderPptoItems();
}

function recalcPpto() {
  let totalCompra=0, totalFlete=0, totalSeguro=0, totalMargen=0;
  let totalIvaC=0, totalIvaV=0, totalIibb=0, totalNeto=0, totalFinal=0;
  pptoItems.filter(i=>i.tipo==='item').forEach(item => {
    const c = calcItem(item);
    totalCompra += c.totalCompra || 0;
    totalFlete  += c.flete || 0;
    totalSeguro += c.seguroCompra || 0;
    totalMargen += c.margen || 0;
    totalIvaC   += c.ivaCompra || 0;
    totalNeto   += (c.precioNetoUnit || 0) * (parseInt(item.cant)||1);
    totalIvaV   += c.ivaVentasTotal || 0;
    totalIibb   += c.iibbTotal || 0;
    totalFinal  += c.totalFinal || 0;
  });
  const dto = parseFloat(document.getElementById('pp-dto')?.value) || 0;
  const descuento = totalFinal * (dto/100);
  const totalConDto = totalFinal - descuento;
  const gananciaPct = totalCompra > 0 ? (totalMargen/totalCompra)*100 : 0;
  const roi = totalCompra > 0 ? ((totalConDto - totalCompra) / totalCompra)*100 : 0;
  const ivaAPagar = totalIvaV - totalIvaC;

  const set = (id, val) => { const el=document.getElementById(id); if(el) el.textContent=val; };
  set('r-compra', pesos(totalCompra));
  set('r-flete', pesos(totalFlete));
  set('r-seguro', pesos(totalSeguro));
  set('r-margen', pesos(totalMargen));
  set('r-iva-compras', pesos(totalIvaC));
  set('r-subtotal', pesos(totalNeto));
  set('r-iva-ventas', pesos(totalIvaV));
  set('r-iibb', pesos(totalIibb));
  set('r-iva-pagar', pesos(Math.max(0, ivaAPagar)));
  set('r-dto', dto > 0 ? '-' + pesos(descuento) : '$0');
  set('r-total', pesos(totalConDto));
  set('r-ganancia-pct', gananciaPct.toFixed(1) + '%');
  set('r-ganancia-val', pesos(totalMargen));
  set('r-roi', roi.toFixed(1) + '%');
  set('r-roi-val', pesos(totalConDto - totalCompra));
  set('r-iva-arca', pesos(Math.max(0, ivaAPagar)));
  set('r-iva-arca-val', 'IVA ventas - IVA compras');
}

// ══════════════════════════════════════════════════════
// PRESUPUESTOS
// ══════════════════════════════════════════════════════
function presupuestos() {
  titulo('Presupuestos');
  actions(`<button class="btn btn-primary" onclick="nuevoPpto()"><i class="fa fa-plus"></i> Nuevo Presupuesto</button>`);

  // Filtro de estado activo (guardado en variable global)
  if (typeof pptoFiltro === 'undefined') window.pptoFiltro = 'todos';

  const todos = DB.presupuestos;
  const filtrados = pptoFiltro === 'todos'
    ? todos.filter(p => !searchQ || (p.cliente+p.numero+(p.proyNom||'')).toLowerCase().includes(searchQ))
    : todos.filter(p => p.status === pptoFiltro && (!searchQ || (p.cliente+p.numero+(p.proyNom||'')).toLowerCase().includes(searchQ)));

  // Stats por estado
  const stats = { total: todos.length, borrador: 0, enviado: 0, aprobado: 0, rechazado: 0 };
  const vals  = { borrador: 0, enviado: 0, aprobado: 0, rechazado: 0 };
  todos.forEach(p => { if (stats[p.status]!==undefined) { stats[p.status]++; vals[p.status]+=(p.totalFinal||0); } });

  // Cards de presupuesto
  const cardsHTML = filtrados.length
    ? filtrados.map(p => {
        const montoPagado = (p.pagosParciales||[]).reduce((s,x)=>s+(parseFloat(x.monto)||0),0);
        const pct = p.totalFinal > 0 ? Math.min(100, (montoPagado/p.totalFinal)*100) : 0;
        const badgeClr = {borrador:'var(--ink3)',enviado:'#2952d9',aprobado:'#1a7a4a',rechazado:'#c0281e'}[p.status]||'var(--ink3)';
        const badgeBg  = {borrador:'var(--surface2)',enviado:'#eef1fd',aprobado:'#e8f5ee',rechazado:'#fdecea'}[p.status]||'var(--surface2)';
        const labelSt  = {borrador:'Borrador',enviado:'Enviado',aprobado:'Aprobado',rechazado:'Rechazado'}[p.status]||p.status;
        return `
        <div onclick="abrirDetallePpto('${p.id}')" style="border:1px solid var(--border);border-radius:var(--r-lg);padding:18px 20px;cursor:pointer;background:var(--surface);transition:all .18s;position:relative"
          onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 20px rgba(0,0,0,.08)'"
          onmouseout="this.style.transform='';this.style.boxShadow=''">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
            <div>
              <div style="font-size:11px;font-weight:700;font-family:monospace;color:var(--ink3);letter-spacing:.5px">${p.numero||'—'}</div>
              <div style="font-size:15px;font-weight:700;color:var(--ink);margin-top:3px">${p.cliente||'Sin cliente'}</div>
              ${p.proyNom?`<div style="font-size:11px;color:var(--ink3);margin-top:1px">${p.proyNom}</div>`:''}
            </div>
            <span style="font-size:10px;font-weight:700;padding:4px 10px;border-radius:20px;background:${badgeBg};color:${badgeClr}">${labelSt}</span>
          </div>
          <div style="font-size:22px;font-weight:800;color:var(--green);margin-bottom:12px">${pesos(p.totalFinal||0)}</div>
          ${pct > 0 ? `
          <div style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--ink3);margin-bottom:4px">
              <span>Cobrado: ${pesos(montoPagado)}</span><span>${pct.toFixed(0)}%</span>
            </div>
            <div style="height:5px;background:var(--border);border-radius:3px;overflow:hidden">
              <div style="height:100%;width:${pct.toFixed(1)}%;background:${pct>=100?'var(--green)':pct>50?'var(--accent)':'var(--amber)'}"></div>
            </div>
          </div>` : ''}
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
            <div style="font-size:11px;color:var(--ink3)">
              <i class="fa fa-calendar" style="margin-right:4px"></i>${p.fecha||'—'}
              ${p.gananciaPct!=null?`<span style="margin-left:10px;color:var(--green);font-weight:600">${pct2((p.gananciaPct||0))} margen</span>`:''}
            </div>
            <div style="display:flex;gap:6px" onclick="event.stopPropagation()">
              <button class="btn btn-sm" onclick="editarPpto('${p.id}')" title="Editar"><i class="fa fa-edit"></i></button>
              ${p.status!=='aprobado'?`<button class="btn btn-sm" style="color:var(--green)" onclick="aprobarPpto('${p.id}')" title="Aprobar"><i class="fa fa-check"></i></button>`:''}
              <button class="btn btn-sm" style="color:var(--red)" onclick="event.stopPropagation();eliminarPptoId('${p.id}')" title="Eliminar"><i class="fa fa-trash"></i></button>
            </div>
          </div>
        </div>`;
      }).join('')
    : `<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--ink4)">
         <i class="fa fa-file-alt" style="font-size:32px;margin-bottom:12px;display:block;opacity:.3"></i>
         Sin presupuestos${pptoFiltro!=='todos'?' con estado "'+pptoFiltro+'"':''}.
       </div>`;

  c(`
  <!-- STATS -->
  <div class="stats-row" style="grid-template-columns:repeat(5,1fr);margin-bottom:18px">
    <div class="stat-card" onclick="pptoFiltro='todos';go(modulo)" style="cursor:pointer${pptoFiltro==='todos'?';border:2px solid var(--ink)':''}" >
      <div class="stat-label">Total</div>
      <div class="stat-value" style="font-size:22px;font-weight:800">${stats.total}</div>
      <div class="stat-sub">presupuestos</div>
    </div>
    <div class="stat-card" onclick="pptoFiltro='borrador';go(modulo)" style="cursor:pointer${pptoFiltro==='borrador'?';border:2px solid var(--ink3)':''}">
      <div class="stat-label" style="color:var(--ink3)">Borrador</div>
      <div class="stat-value" style="font-size:22px;font-weight:800;color:var(--ink3)">${stats.borrador}</div>
      <div class="stat-sub">${pesos(vals.borrador)}</div>
    </div>
    <div class="stat-card" onclick="pptoFiltro='enviado';go(modulo)" style="cursor:pointer${pptoFiltro==='enviado'?';border:2px solid #2952d9':''}">
      <div class="stat-label" style="color:#2952d9">Enviado</div>
      <div class="stat-value" style="font-size:22px;font-weight:800;color:#2952d9">${stats.enviado}</div>
      <div class="stat-sub">${pesos(vals.enviado)}</div>
    </div>
    <div class="stat-card" onclick="pptoFiltro='aprobado';go(modulo)" style="cursor:pointer${pptoFiltro==='aprobado'?';border:2px solid #1a7a4a':''}">
      <div class="stat-label" style="color:#1a7a4a">Aprobado</div>
      <div class="stat-value" style="font-size:22px;font-weight:800;color:#1a7a4a">${stats.aprobado}</div>
      <div class="stat-sub">${pesos(vals.aprobado)}</div>
    </div>
    <div class="stat-card" onclick="pptoFiltro='rechazado';go(modulo)" style="cursor:pointer${pptoFiltro==='rechazado'?';border:2px solid #c0281e':''}">
      <div class="stat-label" style="color:#c0281e">Rechazado</div>
      <div class="stat-value" style="font-size:22px;font-weight:800;color:#c0281e">${stats.rechazado}</div>
      <div class="stat-sub">${pesos(vals.rechazado)}</div>
    </div>
  </div>

  <!-- FILTROS -->
  <div style="display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap">
    ${['todos','borrador','enviado','aprobado','rechazado'].map(f => {
      const lbl = {todos:'Todos',borrador:'Borrador',enviado:'Enviado',aprobado:'Aprobado',rechazado:'Rechazado'}[f];
      const active = pptoFiltro === f;
      return `<button onclick="pptoFiltro='${f}';go(modulo)" class="btn btn-sm ${active?'btn-primary':'btn-secondary'}">${lbl}${f!=='todos'?` (${stats[f]||0})`:` (${stats.total})`}</button>`;
    }).join('')}
  </div>

  <!-- GRID DE CARDS -->
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">
    ${cardsHTML}
  </div>
  `);
}

function pct2(val) {
  return (val*100).toFixed(1) + '%';
}

// ── MODAL DETALLE CON TABS PRESENTACIÓN / ANÁLISIS / PAGOS ──
// ── MODAL DETALLE CON TABS PRESENTACIÓN / ANÁLISIS / PAGOS ──
let pptoDetalle = null;
let pptoVistaTab = 'cliente';
let pptoAnalisisItems = [];
let pptoAnalisisModoEdicion = false;
let pptoClienteEdit = false;

function abrirDetallePpto(id) {
  pptoDetalle = DB.presupuestos.find(x => x.id === id);
  if (!pptoDetalle) return;
  pptoVistaTab = 'cliente';
  pptoAnalisisItems = JSON.parse(JSON.stringify(pptoDetalle.items || []));
  pptoClienteEdit = false;
  renderDetallePpto();
  abrir('m-ppto-detalle');
}

function renderDetallePpto() {
  const p = pptoDetalle;
  if (!p) return;

  const badgeClr = {borrador:'#6b7280',enviado:'#2952d9',aprobado:'#1a7a4a',rechazado:'#c0281e',facturado:'#7c3aed'}[p.status]||'#6b7280';
  const badgeBg  = {borrador:'#f3f4f6',enviado:'#eef1fd',aprobado:'#e8f5ee',rechazado:'#fdecea',facturado:'#f3e8ff'}[p.status]||'#f3f4f6';
  const labelSt  = {borrador:'Borrador',enviado:'Enviado',aprobado:'Aprobado',rechazado:'Rechazado',facturado:'Facturado'}[p.status]||p.status;
  const montoPagado = (p.pagosParciales||[]).reduce((s,x)=>s+(parseFloat(x.monto)||0),0);
  const saldoPend = (p.totalFinal||0) - montoPagado;
  const pctPago = p.totalFinal > 0 ? Math.min(100,(montoPagado/p.totalFinal)*100) : 0;

  const tabs = [
    { id:'cliente',      label:'📋 Datos del Cliente' },
    { id:'presentacion', label:'📄 Presentación' },
    { id:'analisis',     label:'📊 Cotizador' },
    { id:'pagos',        label:`💰 Pagos (${(p.pagosParciales||[]).length})` },
  ];

  const tabsHTML = tabs.map(t =>
    '<button onclick="pptoVistaTab=\'' + t.id + '\';renderDetallePpto()"' +
    ' style="flex:1;padding:14px 8px;border:none;border-radius:0;' +
    'background:' + (pptoVistaTab===t.id?'#1c1c1a':'#2d2d2b') + ';' +
    'color:' + (pptoVistaTab===t.id?'#fff':'#9a9a96') + ';' +
    'font-weight:' + (pptoVistaTab===t.id?'700':'500') + ';' +
    'font-size:13px;cursor:pointer;transition:.15s;border-bottom:' + (pptoVistaTab===t.id?'3px solid #2952d9':'3px solid transparent') + '">' +
    t.label + '</button>'
  ).join('');

  let bodyHTML = '';
  if (pptoVistaTab === 'cliente')      bodyHTML = renderVistaCliente(p);
  else if (pptoVistaTab === 'presentacion') bodyHTML = renderVistaFactura(p);
  else if (pptoVistaTab === 'analisis')     bodyHTML = renderVistaAnalisis(p);
  else bodyHTML = renderVistaPagos(p, montoPagado, saldoPend, pctPago);

  const el = document.getElementById('ppto-detalle-body');
  if (!el) return;
  el.innerHTML =
    '<div style="display:flex;flex-direction:column;height:100%;background:var(--bg)">' +

    '<!-- HEADER -->' +
    '<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 20px;background:var(--surface2);border-bottom:1px solid var(--border);flex-shrink:0">' +
      '<div style="display:flex;align-items:center;gap:12px">' +
        '<div style="font-size:17px;font-weight:800;font-family:monospace;color:var(--ink)">Presupuesto ' + (p.numero||'—') + '</div>' +
        '<span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:' + badgeBg + ';color:' + badgeClr + '">' + labelSt + '</span>' +
        (p.cliente ? '<span style="font-size:12px;color:var(--ink3)">' + p.cliente + (p.proyNom?' · '+p.proyNom:'') + '</span>' : '') +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<select onchange="cambiarEstadoPpto(\'' + p.id + '\',this.value)" style="font-size:12px;padding:4px 8px;border:1px solid var(--border);border-radius:6px;background:var(--surface)">' +
          ['borrador','enviado','aprobado','rechazado','facturado'].map(s =>
            '<option value="' + s + '"' + (p.status===s?' selected':'') + '>' + {borrador:'Borrador',enviado:'Enviado',aprobado:'Aprobado',rechazado:'Rechazado',facturado:'Facturado'}[s] + '</option>'
          ).join('') +
        '</select>' +
        '<button onclick="cerrar(\'m-ppto-detalle\')" style="background:none;border:none;cursor:pointer;color:var(--ink3);font-size:22px;line-height:1;padding:2px 6px">&times;</button>' +
      '</div>' +
    '</div>' +

    '<!-- TABS -->' +
    '<div style="display:flex;flex-shrink:0;background:#2d2d2b">' + tabsHTML + '</div>' +

    '<!-- CONTENIDO -->' +
    '<div style="flex:1;overflow-y:auto;background:' + (pptoVistaTab==='presentacion'?'#f5f5f2':'var(--bg)') + '">' +
      bodyHTML +
    '</div>' +

    '<!-- FOOTER -->' +
    '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 20px;background:var(--surface2);border-top:1px solid var(--border);flex-shrink:0;gap:8px">' +
      '<div style="display:flex;gap:8px">' +
        '<button class="btn btn-secondary" style="border-color:var(--green);color:var(--green)" onclick="abrirRegistroPago(\'' + p.id + '\')">' +
          '<i class="fa fa-coins"></i> Registrar Pago' +
        '</button>' +
        '<button class="btn btn-secondary" onclick="window.print()">' +
          '<i class="fa fa-print"></i> Imprimir' +
        '</button>' +
      '</div>' +
      '<div style="display:flex;gap:8px">' +
        '<button class="btn btn-primary" onclick="guardarTodosPpto()" style="gap:6px">' +
          '<i class="fa fa-save"></i> Guardar cambios' +
        '</button>' +
        '<button class="btn btn-danger" onclick="if(confirm(\'¿Eliminar este presupuesto?\')){eliminarPptoId(\'' + p.id + '\');cerrar(\'m-ppto-detalle\')}">' +
          '<i class="fa fa-trash"></i>' +
        '</button>' +
        '<button class="btn btn-secondary" onclick="cerrar(\'m-ppto-detalle\')">Cerrar</button>' +
      '</div>' +
    '</div>' +

    '</div>';
}

// ── NUEVA: Vista Datos del Cliente (editable inline) ──
function renderVistaCliente(p) {
  const proyOpts = DB.proyectos.map(pr =>
    '<option value="' + pr.id + '"' + (p.proyId===pr.id?' selected':'') + '>' + pr.nom + (pr.cli?' — '+pr.cli:'') + '</option>'
  ).join('');

  return '<div style="max-width:680px;margin:0 auto;padding:28px 24px">' +
    '<div style="font-size:14px;font-weight:700;color:#2952d9;margin-bottom:20px"><i class="fa fa-user"></i> Datos del Cliente y Presupuesto</div>' +

    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">' +

      '<div class="field"><label>Cliente *</label>' +
      '<input id="pd-cliente" value="' + esc(p.cliente||'') + '" placeholder="Nombre del cliente" oninput="pptoDetalle.cliente=this.value"></div>' +

      '<div class="field"><label>CUIT</label>' +
      '<input id="pd-cuit" value="' + esc(p.cuit||'') + '" placeholder="30-00000000-0" oninput="pptoDetalle.cuit=this.value"></div>' +

      '<div class="field"><label>Proyecto vinculado</label>' +
      '<select id="pd-proyecto" onchange="pptoDetalle.proyId=this.value;const pr=DB.proyectos.find(x=>x.id===this.value);pptoDetalle.proyNom=pr?pr.nom:\'\'"><option value="">— Sin proyecto —</option>' + proyOpts + '</select></div>' +

      '<div class="field"><label>Fecha</label>' +
      '<input id="pd-fecha" type="date" value="' + (p.fecha ? p.fecha.split('/').reverse().join('-') : '') + '" oninput="pptoDetalle.fecha=this.value.split(\'-\').reverse().join(\'/\')"></div>' +

      '<div class="field"><label>Vencimiento</label>' +
      '<input id="pd-vencimiento" type="date" value="' + (p.vencimiento ? p.vencimiento.split('/').reverse().join('-') : '') + '" oninput="pptoDetalle.vencimiento=this.value.split(\'-\').reverse().join(\'/\')"></div>' +

      '<div class="field"><label>Estado</label>' +
      '<select id="pd-status" onchange="pptoDetalle.status=this.value">' +
        ['borrador','enviado','aprobado','rechazado','facturado'].map(s =>
          '<option value="' + s + '"' + (p.status===s?' selected':'') + '>' + {borrador:'Borrador',enviado:'Enviado',aprobado:'Aprobado',rechazado:'Rechazado',facturado:'Facturado'}[s] + '</option>'
        ).join('') +
      '</select></div>' +

      '<div class="field"><label>Tipo de comprobante</label>' +
      '<select id="pd-factura" onchange="pptoDetalle.factura=this.value">' +
        ['Presupuesto','Factura A','Factura B','Factura C','Remito'].map(f =>
          '<option' + (p.factura===f?' selected':'') + '>' + f + '</option>'
        ).join('') +
      '</select></div>' +

      '<div class="field"><label>Descuento global (%)</label>' +
      '<input id="pd-dto" type="number" value="' + (p.dto||0) + '" min="0" max="100" step="0.5" oninput="pptoDetalle.dto=this.value"></div>' +

    '</div>' +

    '<div class="field" style="margin-top:16px"><label>Notas / condiciones de pago</label>' +
    '<textarea id="pd-notas" rows="3" style="width:100%;resize:vertical" oninput="pptoDetalle.notas=this.value" placeholder="Validez del presupuesto, condiciones de entrega, forma de pago...">' + esc(p.notas||'') + '</textarea></div>' +

    '</div>';
}

function esc(s) { return String(s||'').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function renderItemsEditorCliente(p) {
  const items = pptoAnalisisItems || p.items || [];
  if (!items.length) return '<div style="text-align:center;padding:20px;color:var(--ink4);font-size:13px">Sin ítems. Agregá el primero.</div>';

  let html = '<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden">';
  items.forEach((item, idx) => {
    const isSec = item.tipo === 'seccion';
    if (isSec) {
      html += '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#1c1c1a">' +
        '<input value="' + esc(item.desc||'') + '" placeholder="Nombre de sección" oninput="pptoAnalisisItems[' + idx + '].desc=this.value" style="flex:1;background:transparent;border:none;color:#fff;font-weight:700;font-size:13px">' +
        '<button onclick="moverItemDetalle(' + idx + ',-1)" style="background:none;border:none;cursor:pointer;color:#9a9a96;padding:2px 5px" title="Subir"><i class="fa fa-chevron-up"></i></button>' +
        '<button onclick="moverItemDetalle(' + idx + ',1)" style="background:none;border:none;cursor:pointer;color:#9a9a96;padding:2px 5px" title="Bajar"><i class="fa fa-chevron-down"></i></button>' +
        '<button onclick="eliminarItemDetalle(' + idx + ')" style="background:none;border:none;cursor:pointer;color:#e87171;padding:2px 5px"><i class="fa fa-times"></i></button>' +
        '</div>';
    } else {
      const c = calcItemNew(item);
      html += '<div style="display:grid;grid-template-columns:1fr 60px 120px 90px 70px 40px;gap:6px;align-items:center;padding:8px 12px;border-bottom:1px solid var(--border);background:var(--surface)">' +
        '<input value="' + esc(item.desc||'') + '" placeholder="Descripción del ítem" oninput="pptoAnalisisItems[' + idx + '].desc=this.value" style="font-size:13px;padding:5px 8px;border:1px solid var(--border);border-radius:5px;width:100%">' +
        '<input type="number" value="' + (item.cant||1) + '" min="1" step="1" oninput="pptoAnalisisItems[' + idx + '].cant=+this.value;renderDetallePpto()" style="font-size:13px;padding:5px;text-align:center;border:1px solid var(--border);border-radius:5px;width:100%">' +
        '<input type="number" value="' + (item.costo||0) + '" min="0" step="100" placeholder="P. unitario" oninput="pptoAnalisisItems[' + idx + '].costo=+this.value;renderDetallePpto()" style="font-size:13px;padding:5px 8px;border:1px solid var(--border);border-radius:5px;width:100%">' +
        '<div style="font-size:12px;font-weight:700;color:var(--green);text-align:right;padding-right:4px">' + pesos(c.totalFinal) + '</div>' +
        '<div style="display:flex;flex-direction:column;align-items:center;gap:2px">' +
          '<button onclick="moverItemDetalle(' + idx + ',-1)" style="background:none;border:none;cursor:pointer;color:var(--ink3);padding:1px 4px;font-size:11px"><i class="fa fa-chevron-up"></i></button>' +
          '<button onclick="moverItemDetalle(' + idx + ',1)" style="background:none;border:none;cursor:pointer;color:var(--ink3);padding:1px 4px;font-size:11px"><i class="fa fa-chevron-down"></i></button>' +
        '</div>' +
        '<button onclick="eliminarItemDetalle(' + idx + ')" style="background:none;border:none;cursor:pointer;color:var(--red);padding:4px"><i class="fa fa-trash"></i></button>' +
        '</div>';
    }
  });
  html += '</div>';

  // Encabezado de columnas
  const header = '<div style="display:grid;grid-template-columns:1fr 60px 120px 90px 70px 40px;gap:6px;padding:6px 12px;background:var(--surface2);font-size:10px;font-weight:700;text-transform:uppercase;color:var(--ink3);letter-spacing:.5px">' +
    '<span>Descripción</span><span style="text-align:center">Cant.</span><span>P.Unit.</span><span style="text-align:right">Total</span><span></span><span></span>' +
    '</div>';

  return header + html +
    '<div style="display:flex;gap:8px;margin-top:10px">' +
      '<button class="btn btn-secondary btn-sm" onclick="agregarItemDetalle()"><i class="fa fa-plus"></i> Ítem</button>' +
      '<button class="btn btn-secondary btn-sm" onclick="agregarSeccionDetalle()"><i class="fa fa-minus"></i> Sección</button>' +
    '</div>';
}

function agregarItemDetalle() {
  pptoAnalisisItems.push({ id: nid(), tipo:'item', desc:'', cant:1, costo:0, iva:21, flete:20, margen:35 });
  renderDetallePpto();
}

function agregarSeccionDetalle() {
  pptoAnalisisItems.push({ id: nid(), tipo:'seccion', desc:'Nueva sección' });
  renderDetallePpto();
}

function eliminarItemDetalle(idx) {
  pptoAnalisisItems.splice(idx, 1);
  renderDetallePpto();
}

function moverItemDetalle(idx, dir) {
  const arr = pptoAnalisisItems;
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= arr.length) return;
  [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
  renderDetallePpto();
}

// ── VISTA FACTURA (Presentación para cliente) ──
function renderVistaFactura(p) {
  const items = (pptoAnalisisItems||p.items||[]).filter(i => i.tipo === 'item');
  let itemsHTML = '';
  (pptoAnalisisItems||p.items||[]).forEach(item => {
    if (item.tipo === 'seccion') {
      itemsHTML += '<tr><td colspan="4" style="background:#1c1c1a;color:#fff;padding:7px 14px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase">' + esc(item.desc||'') + '</td></tr>';
    } else {
      const c = calcItemNew(item);
      itemsHTML += '<tr>' +
        '<td style="padding:10px 14px;border-bottom:1px solid #e8e8e4;font-size:13px">' + esc(item.desc||'—') + '</td>' +
        '<td style="padding:10px 14px;border-bottom:1px solid #e8e8e4;text-align:center;font-size:13px">' + (item.cant||1) + '</td>' +
        '<td style="padding:10px 14px;border-bottom:1px solid #e8e8e4;text-align:right;font-size:13px">' + pesos(c.totalFinal/(item.cant||1)) + '</td>' +
        '<td style="padding:10px 14px;border-bottom:1px solid #e8e8e4;text-align:right;font-size:13px;font-weight:700">' + pesos(c.totalFinal) + '</td>' +
        '</tr>';
    }
  });

  const dto = parseFloat(p.dto||0)/100;
  let subNeto=0, ivaV=0, iibbT=0;
  items.forEach(i => { const c=calcItemNew(i); subNeto+=c.precioVentaNeto; ivaV+=c.ivaVenta; iibbT+=c.iibb; });
  const bruto = subNeto + ivaV + iibbT;
  const descuento = bruto * dto;
  const total = bruto - descuento;

  const empNom = DB.config?.empresa || 'MORADESIGN';
  const empCuit = DB.config?.cuit || '30-71234567-8';
  const empDir = DB.config?.direccion || 'Buenos Aires, Argentina';

  return '<div id="factura-container" style="max-width:720px;margin:0 auto;font-family:\'DM Sans\',sans-serif;padding:40px 32px">' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px">' +
      '<div>' +
        '<div style="font-size:32px;font-weight:900;letter-spacing:-2px;color:#1c1c1a">' + empNom + '</div>' +
        '<div style="font-size:10px;color:#9a9a96;letter-spacing:3px;text-transform:uppercase;margin-top:4px">DISEÑO DE INTERIORES</div>' +
        '<div style="margin-top:10px;font-size:11px;color:#6b6b67;line-height:1.6">' + empNom + '<br>CUIT: ' + empCuit + '<br>' + empDir + '</div>' +
      '</div>' +
      '<div style="text-align:right">' +
        '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9a9a96">' + (p.factura||'PRESUPUESTO') + '</div>' +
        '<div style="font-size:28px;font-weight:900;color:#2952d9;margin-top:4px;letter-spacing:-1px">' + (p.numero||'001') + '</div>' +
        '<div style="font-size:12px;color:#6b6b67;margin-top:6px">Fecha: ' + (p.fecha||'—') + '</div>' +
        (p.vencimiento ? '<div style="font-size:11px;color:#c0281e;margin-top:2px">Vence: ' + p.vencimiento + '</div>' : '') +
      '</div>' +
    '</div>' +

    '<div style="background:#f7f7f4;border-radius:10px;padding:20px 24px;margin-bottom:32px">' +
      '<div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9a9a96;margin-bottom:8px">CLIENTE</div>' +
      '<div style="font-size:19px;font-weight:800;color:#1c1c1a">' + esc(p.cliente||'Sin cliente') + '</div>' +
      (p.cuit ? '<div style="font-size:12px;color:#6b6b67;margin-top:3px">CUIT: ' + esc(p.cuit) + '</div>' : '') +
      (p.proyNom ? '<div style="font-size:12px;color:#6b6b67;margin-top:2px">Proyecto: ' + esc(p.proyNom) + '</div>' : '') +
    '</div>' +

    '<table style="width:100%;border-collapse:collapse;margin-bottom:24px">' +
      '<thead><tr style="border-bottom:2px solid #1c1c1a">' +
        '<th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b6b67">Descripción</th>' +
        '<th style="padding:10px 14px;text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b6b67">Cant.</th>' +
        '<th style="padding:10px 14px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b6b67">P. Unit.</th>' +
        '<th style="padding:10px 14px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b6b67">Total</th>' +
      '</tr></thead>' +
      '<tbody>' + itemsHTML + '</tbody>' +
    '</table>' +

    '<div style="display:flex;justify-content:flex-end">' +
      '<div style="min-width:280px">' +
        '<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #e8e8e4"><span style="font-size:13px;color:#6b6b67">Subtotal:</span><span style="font-size:13px">' + pesos(subNeto) + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #e8e8e4"><span style="font-size:13px;color:#6b6b67">IVA:</span><span style="font-size:13px">' + pesos(ivaV) + '</span></div>' +
        (iibbT > 0 ? '<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #e8e8e4"><span style="font-size:13px;color:#6b6b67">IIBB:</span><span style="font-size:13px">' + pesos(iibbT) + '</span></div>' : '') +
        (descuento > 0 ? '<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #e8e8e4"><span style="font-size:13px;color:#c0281e">Descuento (' + p.dto + '%):</span><span style="font-size:13px;color:#c0281e">-' + pesos(descuento) + '</span></div>' : '') +
        '<div style="display:flex;justify-content:space-between;padding:12px 0;border-top:2px solid #1c1c1a;margin-top:4px"><span style="font-size:15px;font-weight:800">TOTAL:</span><span style="font-size:18px;font-weight:900;color:#2952d9">' + pesos(total) + '</span></div>' +
      '</div>' +
    '</div>' +

    (p.notas ? '<div style="margin-top:28px;padding:16px 20px;background:#f7f7f4;border-radius:8px;font-size:12px;color:#6b6b67;line-height:1.7"><strong style="color:#1c1c1a">Notas:</strong><br>' + esc(p.notas) + '</div>' : '') +

    '</div>';
}

// ── VISTA ANÁLISIS (Cotizador interno) ──
function renderVistaAnalisis(p) {
  const items = (pptoAnalisisItems||p.items||[]).filter(i => i.tipo === 'item');

  let tCompra=0, tIvaC=0, tFlete=0, tSegC=0, tIvaFlete=0, tMargen=0, tPVN=0, tIvaV=0, tIibb=0, tSegV=0, tFinal=0;
  items.forEach(i => {
    const c = calcItemNew(i);
    tCompra    += c.totalCompra;
    tIvaC      += c.ivaCompra;
    tFlete     += c.flete;
    tSegC      += c.seguroCompra;
    tIvaFlete  += c.ivaFlete;
    tMargen    += c.margen;
    tPVN       += c.precioVentaNeto;
    tIvaV      += c.ivaVenta;
    tIibb      += c.iibb;
    tSegV      += c.seguroVenta;
    tFinal     += c.totalFinal;
  });

  const costoTotal  = tCompra + tIvaC + tFlete + tSegC + tIvaFlete;
  const ganancia    = tMargen;
  const pctGanancia = costoTotal > 0 ? ((ganancia / costoTotal) * 100).toFixed(1) : '0.0';
  const roi         = costoTotal > 0 ? (ganancia / costoTotal).toFixed(2) : '0.00';

  const rowsHTML = items.map((item, idx) => {
    const c = calcItemNew(item);
    return '<tr>' +
      '<td style="padding:7px 10px;border-bottom:1px solid #e8e8e4;font-size:13px;min-width:160px">' +
        '<input value="' + esc(item.desc||'') + '" oninput="pptoAnalisisItems.find((x,i)=>i===' + idx + '&&(x.desc=this.value))" style="width:100%;border:none;background:transparent;font-size:13px;padding:0">' +
      '</td>' +
      '<td style="padding:7px 6px;border-bottom:1px solid #e8e8e4;text-align:center">' +
        '<input type="number" value="' + (item.cant||1) + '" min="1" step="1" oninput="pptoAnalisisItems[' + idx + '].cant=+this.value;renderDetallePpto()" style="width:52px;text-align:center;background:#fffbea;border:1px solid #d1c95e;border-radius:4px;padding:4px;font-size:13px">' +
      '</td>' +
      '<td style="padding:7px 6px;border-bottom:1px solid #e8e8e4;text-align:right">' +
        '<input type="number" value="' + (item.costo||0) + '" min="0" step="100" oninput="pptoAnalisisItems[' + idx + '].costo=+this.value;renderDetallePpto()" style="width:90px;text-align:right;background:#fffbea;border:1px solid #d1c95e;border-radius:4px;padding:4px;font-size:13px">' +
      '</td>' +
      '<td style="padding:7px 6px;border-bottom:1px solid #e8e8e4;text-align:right;background:#eef3fb;font-size:13px">' + pesos(c.totalCompra) + '</td>' +
      '<td style="padding:7px 6px;border-bottom:1px solid #e8e8e4;text-align:center;background:#eef3fb">' +
        '<input type="number" value="' + (item.iva||21) + '" min="0" max="105" oninput="pptoAnalisisItems[' + idx + '].iva=+this.value;renderDetallePpto()" style="width:46px;text-align:center;background:#fffbea;border:1px solid #d1c95e;border-radius:4px;padding:4px;font-size:13px">' +
      '</td>' +
      '<td style="padding:7px 6px;border-bottom:1px solid #e8e8e4;text-align:right;background:#eef3fb;font-size:13px">' + pesos(c.ivaCompra) + '</td>' +
      '<td style="padding:7px 6px;border-bottom:1px solid #e8e8e4;text-align:center;background:#fef6e4">' +
        '<input type="number" value="' + (item.flete||20) + '" min="0" max="100" oninput="pptoAnalisisItems[' + idx + '].flete=+this.value;renderDetallePpto()" style="width:46px;text-align:center;background:#fffbea;border:1px solid #d1c95e;border-radius:4px;padding:4px;font-size:13px">' +
      '</td>' +
      '<td style="padding:7px 6px;border-bottom:1px solid #e8e8e4;text-align:right;background:#fef6e4;font-size:13px">' + pesos(c.flete) + '</td>' +
      '<td style="padding:7px 6px;border-bottom:1px solid #e8e8e4;text-align:right;background:#fef6e4;font-size:13px">' + pesos(c.seguroCompra) + '</td>' +
      '<td style="padding:7px 6px;border-bottom:1px solid #e8e8e4;text-align:right;background:#fef6e4;font-size:13px">' + pesos(c.ivaFlete) + '</td>' +
      '<td style="padding:7px 6px;border-bottom:1px solid #e8e8e4;text-align:center;background:#edfaf1">' +
        '<input type="number" value="' + (item.margen||35) + '" min="0" max="1000" oninput="pptoAnalisisItems[' + idx + '].margen=+this.value;renderDetallePpto()" style="width:52px;text-align:center;background:#fffbea;border:1px solid #d1c95e;border-radius:4px;padding:4px;font-size:13px">' +
      '</td>' +
      '<td style="padding:7px 6px;border-bottom:1px solid #e8e8e4;text-align:right;background:#edfaf1;font-size:13px;font-weight:700;color:#1a7a4a">' + pesos(c.margen) + '</td>' +
      '<td style="padding:7px 6px;border-bottom:1px solid #e8e8e4;text-align:right;background:#edfaf1;font-size:12px;font-weight:700;color:#2952d9">' + pesos(c.totalFinal) + '</td>' +
      '</tr>';
  }).join('');

  const totalesRow = '<tr style="background:#f5f5f2;font-weight:700">' +
    '<td colspan="3" style="padding:10px;font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:#6b6b67">TOTALES:</td>' +
    '<td style="padding:10px 6px;text-align:right;background:#ddeaf7;font-size:13px">' + pesos(tCompra) + '</td>' +
    '<td style="padding:10px 6px;text-align:right;background:#ddeaf7;font-size:13px"></td>' +
    '<td style="padding:10px 6px;text-align:right;background:#ddeaf7;font-size:13px">' + pesos(tIvaC) + '</td>' +
    '<td colspan="4" style="padding:10px 6px;text-align:right;background:#fdeec5;font-size:13px">' + pesos(tFlete+tSegC+tIvaFlete) + '</td>' +
    '<td style="padding:10px 6px;background:#c8f0d6"></td>' +
    '<td style="padding:10px 6px;text-align:right;background:#c8f0d6;font-size:13px;color:#1a7a4a">' + pesos(tMargen) + '</td>' +
    '<td style="padding:10px 6px;text-align:right;background:#c8f0d6;font-size:13px;font-weight:900;color:#2952d9">' + pesos(tFinal) + '</td>' +
    '</tr>';

  const desgloseHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:24px">' +
    '<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:22px 26px">' +
      '<div style="font-size:14px;font-weight:700;color:#2952d9;margin-bottom:16px">Desglose de Costos</div>' +
      [
        ['Total Compra:', pesos(tCompra), false],
        ['IVA Compra (' + (items[0]?.iva||21) + '%):', pesos(tIvaC), false],
        ['Flete + Seguro:', pesos(tFlete+tSegC+tIvaFlete), false],
        ['Margen de Utilidad:', pesos(ganancia), 'green'],
        ['IVA Venta:', pesos(tIvaV), false],
        ['IIBB (3.5%):', pesos(tIibb), false],
        ['Seguro Venta (0.8%):', pesos(tSegV), false],
      ].map(([k,v,accent]) =>
        '<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--border)">' +
          '<span style="font-size:13px;color:' + (accent==='green'?'#1a7a4a':'var(--ink2)') + ';font-weight:' + (accent?'700':'400') + '">' + k + '</span>' +
          '<span style="font-size:13px;color:' + (accent==='green'?'#1a7a4a':'var(--ink)') + ';font-weight:' + (accent?'700':'400') + '">' + v + '</span>' +
        '</div>'
      ).join('') +
      '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><span style="font-size:13px;font-weight:700">Costo Total:</span><span style="font-size:13px;font-weight:700;color:#c0281e">' + pesos(costoTotal) + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:10px 0 4px"><span style="font-size:13px;font-weight:700;color:#1a7a4a">Ganancia:</span><span style="font-size:13px;font-weight:700;color:#1a7a4a">' + pesos(ganancia) + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:4px 0"><span style="font-size:12px;color:var(--ink3)">% Ganancia:</span><span style="font-size:12px;color:var(--ink3)">' + pctGanancia + '%</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:4px 0"><span style="font-size:12px;color:var(--ink3)">ROI:</span><span style="font-size:12px;color:var(--ink3)">' + roi + '</span></div>' +
    '</div>' +
    '<div style="background:var(--surface);border:2px solid #2952d9;border-radius:var(--r-lg);padding:22px 26px;display:flex;flex-direction:column;justify-content:center">' +
      '<div style="font-size:14px;font-weight:700;color:#2952d9;margin-bottom:24px">Total del Presupuesto</div>' +
      '<div style="display:flex;align-items:baseline;gap:16px">' +
        '<span style="font-size:28px;font-weight:900;color:#2952d9">TOTAL:</span>' +
        '<span style="font-size:32px;font-weight:900;color:#1a7a4a">' + pesos(tFinal) + '</span>' +
      '</div>' +
      '<div style="margin-top:12px;font-size:12px;color:var(--ink3)">Ganancia: ' + pctGanancia + '% · ROI: ' + roi + '</div>' +
    '</div>' +
  '</div>';

  return '<div style="padding:20px 24px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
      '<div style="font-size:14px;font-weight:700;color:#2952d9">📊 Cotizador — todos los campos son editables en tiempo real</div>' +
      '<button class="btn btn-secondary btn-sm" onclick="agregarItemDetalle()"><i class="fa fa-plus"></i> Agregar ítem</button>' +
    '</div>' +
    '<div style="overflow-x:auto;border:1px solid #e0e0da;border-radius:8px">' +
      '<table style="width:100%;border-collapse:collapse;min-width:1000px;background:#fff">' +
        '<thead><tr style="background:#f0f0ec">' +
          '<th style="padding:10px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;color:#6b6b67;border-bottom:2px solid #e0e0da;min-width:160px">Descripción</th>' +
          '<th style="padding:10px 6px;text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;color:#6b6b67;border-bottom:2px solid #e0e0da">Cant.</th>' +
          '<th style="padding:10px 6px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;color:#6b6b67;border-bottom:2px solid #e0e0da">P. Unit.</th>' +
          '<th style="padding:10px 6px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;color:#2952d9;border-bottom:2px solid #e0e0da;background:#eef3fb">Total<br>Compra</th>' +
          '<th style="padding:10px 6px;text-align:center;font-size:10px;font-weight:700;text-transform:uppercase;color:#2952d9;border-bottom:2px solid #e0e0da;background:#eef3fb">IVA %</th>' +
          '<th style="padding:10px 6px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;color:#2952d9;border-bottom:2px solid #e0e0da;background:#eef3fb">IVA $</th>' +
          '<th style="padding:10px 6px;text-align:center;font-size:10px;font-weight:700;text-transform:uppercase;color:#b45309;border-bottom:2px solid #e0e0da;background:#fef6e4" title="El flete incluye IVA 10.5%">Flete%</th>' +
          '<th style="padding:10px 6px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;color:#b45309;border-bottom:2px solid #e0e0da;background:#fef6e4">Flete</th>' +
          '<th style="padding:10px 6px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;color:#b45309;border-bottom:2px solid #e0e0da;background:#fef6e4">Seg.<br>Cta</th>' +
          '<th style="padding:10px 6px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;color:#b45309;border-bottom:2px solid #e0e0da;background:#fef6e4">IVA<br>Flete</th>' +
          '<th style="padding:10px 6px;text-align:center;font-size:10px;font-weight:700;text-transform:uppercase;color:#1a7a4a;border-bottom:2px solid #e0e0da;background:#edfaf1">Margen%</th>' +
          '<th style="padding:10px 6px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;color:#1a7a4a;border-bottom:2px solid #e0e0da;background:#edfaf1">Margen $</th>' +
          '<th style="padding:10px 6px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;color:#2952d9;border-bottom:2px solid #e0e0da;background:#edfaf1">Total<br>Final</th>' +
        '</tr></thead>' +
        '<tbody>' + rowsHTML + '</tbody>' +
        '<tfoot>' + totalesRow + '</tfoot>' +
      '</table>' +
    '</div>' +
    desgloseHTML +
  '</div>';
}


function renderVistaPagos(p, montoPagado, saldoPend, pct) {
  const pagos = p.pagosParciales || [];
  const rowsHTML = pagos.length
    ? pagos.map(pg => `<tr>
        <td style=\"padding:10px 14px;font-size:12px\">${pg.fecha||'—'}</td>
        <td style=\"padding:10px 14px;font-size:13px;font-weight:700;color:var(--green)\">${pesos(pg.monto)}</td>
        <td style=\"padding:10px 14px\"><span class=\"badge b-gray\">${pg.medio||'—'}</span></td>
        <td style=\"padding:10px 14px;font-size:12px;color:var(--ink3)\">${pg.notas||'—'}</td>
        <td style=\"padding:10px 14px\">
          <button class=\"btn btn-sm\" style=\"color:var(--red)\" onclick=\"eliminarPagoParcial('${p.id}','${pg.id}')\"><i class=\"fa fa-trash\"></i></button>
        </td>
      </tr>`).join('')
    : `<tr><td colspan=\"5\" style=\"text-align:center;padding:28px;color:var(--ink4)\">Sin pagos registrados</td></tr>`;

  return `
  <!-- Resumen cobro -->
  <div style=\"display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px\">
    <div style=\"background:var(--green-lt);border-radius:10px;padding:18px;text-align:center\">
      <div style=\"font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--green);margin-bottom:6px\">Total presupuesto</div>
      <div style=\"font-size:22px;font-weight:800;color:var(--green)\">${pesos(p.totalFinal||0)}</div>
    </div>
    <div style=\"background:var(--accent-lt);border-radius:10px;padding:18px;text-align:center\">
      <div style=\"font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--accent);margin-bottom:6px\">Monto cobrado</div>
      <div style=\"font-size:22px;font-weight:800;color:var(--accent)\">${pesos(montoPagado)}</div>
    </div>
    <div style=\"background:var(--amber-lt);border-radius:10px;padding:18px;text-align:center\">
      <div style=\"font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--amber);margin-bottom:6px\">Saldo pendiente</div>
      <div style=\"font-size:22px;font-weight:800;color:var(--amber)\">${pesos(saldoPend)}</div>
    </div>
  </div>

  <!-- Barra de progreso -->
  <div style=\"margin-bottom:24px\">
    <div style=\"display:flex;justify-content:space-between;font-size:12px;color:var(--ink3);margin-bottom:6px\">
      <span>Progreso de cobro</span><span style=\"font-weight:700;color:${pct>=100?'var(--green)':pct>50?'var(--accent)':'var(--amber)'}\">${pct.toFixed(1)}% cobrado</span>
    </div>
    <div style=\"height:10px;background:var(--border);border-radius:5px;overflow:hidden\">
      <div style=\"height:100%;width:${pct.toFixed(1)}%;background:${pct>=100?'var(--green)':pct>50?'var(--accent)':'var(--amber)'};transition:width .3s\"></div>
    </div>
  </div>

  <!-- Historial -->
  <div style=\"display:flex;justify-content:space-between;align-items:center;margin-bottom:12px\">
    <div style=\"font-size:13px;font-weight:700\">Historial de pagos</div>
    ${saldoPend > 0
      ? `<button class=\"btn btn-primary btn-sm\" onclick=\"abrirNuevoPagoParcial()\"><i class=\"fa fa-plus\"></i> Registrar pago</button>`
      : `<span style=\"font-size:12px;color:var(--green);font-weight:700\"><i class=\"fa fa-check-circle\"></i> Totalmente cobrado</span>`}
  </div>
  <div class=\"tbl-wrap\" style=\"border-radius:var(--r)\">
    <table><thead><tr><th>Fecha</th><th>Monto</th><th>Medio</th><th>Notas</th><th></th></tr></thead>
    <tbody>${rowsHTML}</tbody></table>
  </div>

  <!-- Form nuevo pago (oculto) -->
  <div id=\"form-nuevo-pago\" style=\"display:none;margin-top:20px;padding:20px;background:var(--surface2);border-radius:10px;border:1px solid var(--border)\">
    <div style=\"font-size:13px;font-weight:700;margin-bottom:14px\"><i class=\"fa fa-plus-circle\" style=\"color:var(--green)\"></i> Nuevo pago</div>
    <div style=\"display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px\">
      <div class=\"field\"><label>Monto *</label><input type=\"number\" id=\"pago-monto-nuevo\" placeholder=\"0\" min=\"0\" max=\"${saldoPend}\"></div>
      <div class=\"field\"><label>Medio de pago</label>
        <select id=\"pago-medio-nuevo\">
          <option>Efectivo</option><option>Transferencia</option><option>Cheque</option><option>Tarjeta</option><option>Mercado Pago</option>
        </select>
      </div>
      <div class=\"field\"><label>Notas</label><input id=\"pago-notas-nuevo\" placeholder=\"Adelanto, cuota, etc.\"></div>
    </div>
    <div style=\"display:flex;gap:8px;justify-content:flex-end\">
      <button class=\"btn btn-secondary btn-sm\" onclick=\"document.getElementById('form-nuevo-pago').style.display='none'\">Cancelar</button>
      <button class=\"btn btn-primary btn-sm\" onclick=\"registrarPagoParcial('${p.id}')\"><i class=\"fa fa-check\"></i> Registrar pago</button>
    </div>
  </div>`;
}

function abrirNuevoPagoParcial() {
  const el = document.getElementById('form-nuevo-pago');
  if (el) { el.style.display = 'block'; document.getElementById('pago-monto-nuevo').focus(); }
}

function registrarPagoParcial(pptoId) {
  const montoEl = document.getElementById('pago-monto-nuevo');
  const medioEl = document.getElementById('pago-medio-nuevo');
  const notasEl = document.getElementById('pago-notas-nuevo');
  const montoNum = parseFloat(montoEl?.value)||0;
  if (!montoNum || montoNum <= 0) { alert('Ingresá un monto válido'); return; }

  const p = DB.presupuestos.find(x => x.id === pptoId);
  if (!p) return;
  const montoPagadoActual = (p.pagosParciales||[]).reduce((s,x)=>s+(parseFloat(x.monto)||0),0);
  const saldoRestante = (p.totalFinal||0) - montoPagadoActual;
  if (montoNum > saldoRestante + 0.01) { alert(`El monto excede el saldo restante (${pesos(saldoRestante)})`); return; }

  const nuevoPago = {
    id: 'pago'+Date.now(),
    fecha: fiDate().split('-').reverse().join('/'),
    monto: montoNum,
    medio: medioEl?.value || 'Efectivo',
    notas: notasEl?.value || ''
  };

  if (!p.pagosParciales) p.pagosParciales = [];
  p.pagosParciales.push(nuevoPago);
  p.montoPagado = montoPagadoActual + montoNum;

  // Integración con Contabilidad: agregar cobro en DB.cobros
  if (!DB.cobros) DB.cobros = [];
  const esPagoTotal = p.montoPagado >= (p.totalFinal||0) - 0.01;
  DB.cobros.push({
    id: 'co'+Date.now(),
    pptoId: pptoId,
    cliente: p.cliente || '—',
    concepto: `Presupuesto ${p.numero||''}`,
    monto: montoNum,
    iva: 0,
    fecha: fiDate().split('-').reverse().join('/'),
    tipo: esPagoTotal ? 'total' : 'parcial',
    medio: medioEl?.value || 'Efectivo',
    estado: 'cobrado',
    cuenta: ''
  });
  guardarContabilidad('cobros');

  guardar();
  pptoDetalle = p;
  montoEl.value = ''; if (notasEl) notasEl.value = '';
  pptoVistaTab = 'pagos';
  renderDetallePpto();
}

function eliminarPagoParcial(pptoId, pagoId) {
  if (!confirm('¿Eliminar este pago del historial?')) return;
  const p = DB.presupuestos.find(x => x.id === pptoId);
  if (!p) return;
  const pago = (p.pagosParciales||[]).find(x=>x.id===pagoId);
  if (pago) {
    p.pagosParciales = p.pagosParciales.filter(x=>x.id!==pagoId);
    p.montoPagado = Math.max(0, (p.montoPagado||0) - (pago.monto||0));
    // Eliminar cobro vinculado si existe
    DB.cobros = (DB.cobros||[]).filter(c => !(c.pptoId===pptoId && Math.abs(c.monto-pago.monto)<0.01));
    guardarContabilidad('cobros');
    guardar();
    pptoDetalle = p;
    renderDetallePpto();
  }
}

function cambiarEstadoPpto(id, nuevoEstado) {
  const p = DB.presupuestos.find(x => x.id === id);
  if (!p) return;
  p.status = nuevoEstado;
  if (nuevoEstado === 'aprobado' && p.proyId) {
    const proy = DB.proyectos.find(x=>x.id===p.proyId);
    if (proy) proy.status = 'aprobado';
  }
  guardar();
  pptoDetalle = p;
  renderDetallePpto();
}

// ── Guardar TODOS los cambios del presupuesto ──
function guardarTodosPpto() {
  if (!pptoDetalle) return;

  // 1. Sincronizar items editados
  pptoDetalle.items = JSON.parse(JSON.stringify(pptoAnalisisItems));

  // 2. Recalcular totales
  let tFinal=0, tCompra=0, tFlete=0, tIvaC=0, tMargen=0;
  pptoAnalisisItems.filter(i=>i.tipo==='item').forEach(i => {
    const c = calcItemNew(i);
    Object.assign(i, c);
    tFinal   += c.totalFinal;
    tCompra  += c.totalCompra;
    tFlete   += c.subtotalFlete;
    tIvaC    += c.ivaCompra;
    tMargen  += c.margen;
  });
  pptoDetalle.items = JSON.parse(JSON.stringify(pptoAnalisisItems));

  const dto = parseFloat(pptoDetalle.dto||0)/100;
  pptoDetalle.totalFinal = tFinal * (1 - dto);

  const costo = tCompra + tFlete + tIvaC;
  pptoDetalle.gananciaPct = costo > 0 ? tMargen/costo : 0;

  // 3. Guardar en DB
  const idx = DB.presupuestos.findIndex(x=>x.id===pptoDetalle.id);
  if (idx >= 0) DB.presupuestos[idx] = {...DB.presupuestos[idx], ...pptoDetalle};
  else DB.presupuestos.push(pptoDetalle);

  guardar();
  renderDetallePpto();

  // Feedback visual
  setTimeout(() => {
    const el = document.getElementById('ppto-detalle-body');
    if (el) {
      el.style.outline = '2px solid var(--green)';
      setTimeout(() => el.style.outline = '', 700);
    }
  }, 50);
}



// ── calcItemNew: fórmulas exactas del mapa ──
function calcItemNew(item) {
  const cantidad = parseInt(item.cant) || 1;
  const precioUnitario = parseFloat(item.costo) || 0;
  const porcIva = parseFloat(item.iva) !== undefined ? parseFloat(item.iva) : 0.21;
  const porcFlete = parseFloat(item.flete) || 0;
  const porcMargen = parseFloat(item.margen) || 0;

  // 1. COMPRA