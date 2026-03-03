// FORMA — módulo: extra

  if (!p) return;
  p.status = 'aprobado';
  guardar(); go(modulo);
}

function enviarPorWhatsApp(id) {
  const p = (DB.presupuestos||[]).find(x=>x.id===id);
  if (!p) return;
  const tel = (p.clienteTel||'').replace(/\D/g,'');
  const msg = encodeURIComponent('Hola '+(p.clienteNombre||p.cliente||'')+', presupuesto N°'+(p.numero||id)+' por $'+(parseFloat(p.total)||0).toLocaleString('es-AR')+'. Quedo a disposición.');
  if (tel) window.open('https://wa.me/549'+tel+'?text='+msg,'_blank');
  else alert('Sin teléfono de contacto.');
}

function abrirRegistroPago(pptoId) {
  abrirCobro(null, pptoId);
}

function guardarGasto() {
  const desc  = document.getElementById('g-concepto')?.value?.trim();
  const monto = parseFloat(document.getElementById('g-monto')?.value)||0;
  const fecha = document.getElementById('g-fecha')?.value || new Date().toISOString().slice(0,10);
  const cat   = (document.getElementById('g-categoria')||document.getElementById('g-cat'))?.value || 'otros';
  const tipo  = document.getElementById('g-tipo')?.value || 'variable';
  const medio = document.getElementById('g-medio')?.value || 'transferencia';
  const resp  = (document.getElementById('g-responsable')||document.getElementById('g-resp'))?.value?.trim() || '';
  const notas = document.getElementById('g-notas')?.value?.trim() || '';
  if (!desc || !monto) { alert('Completá concepto y monto'); return; }
  if (!DB.gastos) DB.gastos = [];
  const id = window.editGastoId;
  if (id) {
    const i = DB.gastos.findIndex(x=>x.id===id);
    if (i>=0) DB.gastos[i] = {...DB.gastos[i], concepto:desc, monto, fecha, categoria:cat, tipo, medio, responsable:resp, notas};
  } else {
    DB.gastos.push({ id:'g'+Date.now(), concepto:desc, monto, fecha, categoria:cat, tipo, medio, responsable:resp, notas });
  }
  guardar(); guardarContabilidad('gastos'); cerrar('m-gasto'); go(modulo);
}

// ── Lookup entidad por CUIT o nombre (cruce de datos) ──
function lookupEntidad(query) {
  const q = (query||'').toLowerCase().replace(/[-\s]/g,'');
  if (!q) return null;
  return (DB.contactos||[]).find(e =>
    (e.cuit||'').replace(/[-\s]/g,'').includes(q) ||
    (e.nombre||'').toLowerCase().includes(query.toLowerCase()) ||
    (e.razonSocial||'').toLowerCase().includes(query.toLowerCase())
  ) || null;
}

function autocompletarCUIT(nId, cId) {
  const e = lookupEntidad(document.getElementById(nId)?.value||'');
  if (e && document.getElementById(cId)) document.getElementById(cId).value = e.cuit||'';
}

function autocompletarNombre(cId, nId) {
  const e = lookupEntidad(document.getElementById(cId)?.value||'');
  if (!e) return;
  if (document.getElementById(nId)) document.getElementById(nId).value = e.nombre||e.razonSocial||'';
  if (document.getElementById('fac-condicion-iva')) document.getElementById('fac-condicion-iva').value = e.condicionIva||'';
}

// ── Cuenta Corriente automática (generada de cobros/pagos) ──
function renderCtaCteClientes() {
  const cobros = DB.cobros||[];
  if (!cobros.length) return '<div class="empty"><i class="fa fa-users" style="font-size:28px;margin-bottom:8px"></i><p>Se genera automáticamente de Facturas y Cobros.</p></div>';
  const cl = {};
  cobros.forEach(co => {
    const k = co.cuit||co.cliente||'sin-cliente';
    if (!cl[k]) cl[k] = { nombre:co.cliente||'Sin nombre', cuit:co.cuit||'', movs:[] };
    const esDebe = !co.esRecibo && co.tipo!=='recibo' && co.tipoDoc!=='recibo';
    cl[k].movs.push({
      fecha:co.fecha, tipo:esDebe?'Factura':'Cobro',
      comp:co.nroFactura||co.nroRecibo||co.comprobante||co.id,
      debe:esDebe?(parseFloat(co.monto)||0)+(parseFloat(co.iva)||0):0,
      haber:!esDebe?parseFloat(co.monto)||0:0
    });
  });
  return Object.entries(cl).map(([k,d]) => {
    let s = 0;
    const rows = d.movs.sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||'')).map(m => {
      s += m.debe - m.haber;
      return `<tr style="font-size:12px">
        <td style="padding:5px 8px;color:var(--ink3)">${m.fecha||'—'}</td>
        <td style="padding:5px 8px">${m.tipo}</td>
        <td style="padding:5px 8px;color:var(--ink3);font-size:11px">${m.comp}</td>
        <td style="padding:5px 8px;text-align:right;color:var(--red)">${m.debe?pesos(m.debe):''}</td>
        <td style="padding:5px 8px;text-align:right;color:var(--green)">${m.haber?pesos(m.haber):''}</td>
        <td style="padding:5px 8px;text-align:right;font-weight:700;color:${s>0?'var(--amber)':'var(--green)'}">${pesos(s)}</td>
      </tr>`;
    });
    return `<div style="border:1px solid var(--border);border-radius:var(--r);margin-bottom:10px;overflow:hidden">
      <div onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'"
        style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--surface-2);cursor:pointer">
        <div>
          <span style="font-weight:700">${d.nombre}</span>
          <span style="font-size:11px;color:var(--ink3);margin-left:8px">CUIT: ${d.cuit||'—'}</span>
        </div>
        <span style="font-weight:700;color:${s>0?'var(--amber)':'var(--green)'}">
          ${s>0?'Debe: ':'Saldo 0 '}${pesos(Math.abs(s))}
        </span>
      </div>
      <div style="display:none">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:var(--surface-2);font-size:11px;color:var(--ink3)">
            <th style="padding:5px 8px;text-align:left">Fecha</th>
            <th style="padding:5px 8px;text-align:left">Tipo</th>
            <th style="padding:5px 8px;text-align:left">Comprobante</th>
            <th style="padding:5px 8px;text-align:right">Debe</th>
            <th style="padding:5px 8px;text-align:right">Haber</th>
            <th style="padding:5px 8px;text-align:right">Saldo</th>
          </tr></thead>
          <tbody>${rows.join('')}</tbody>
        </table>
      </div>
    </div>`;
  }).join('');
}

// ── Facturas a Clientes ──
function renderFacturasClientes() {
  const fs = [...(DB.cobros||[])].sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''));
  if (!fs.length) return '<div class="empty"><i class="fa fa-file-invoice-dollar" style="font-size:28px;margin-bottom:8px"></i><p>Sin facturas</p><button onclick="abrirCobro(null)" class="btn btn-primary btn-sm" style="margin-top:8px"><i class="fa fa-plus"></i> Nueva Factura</button></div>';
  const total = fs.reduce((s,f)=>s+(parseFloat(f.monto)||0)+(parseFloat(f.iva)||0), 0);
  return `<div style="padding:10px 16px;background:var(--blue-lt);border-bottom:1px solid var(--border);font-size:13px">
    <strong>Total facturado:</strong> <span style="color:var(--blue);font-weight:700">${pesos(total)}</span>
    <span style="color:var(--ink3);margin-left:12px">${fs.length} facturas</span>
  </div>
  <div class="tbl-wrap" style="border:none;border-radius:0"><table>
    <thead><tr>
      <th>N° Factura</th><th>Fecha</th><th>Cliente</th><th>CUIT</th>
      <th style="text-align:right">Total</th><th>Entidad Emisora</th><th>Estado</th><th></th>
    </tr></thead>
    <tbody>${fs.map(f => {
      const tot = (parseFloat(f.monto)||0)+(parseFloat(f.iva)||0);
      const est = f.estado||'pendiente';
      const ec  = {cobrado:'var(--green)',pendiente:'var(--amber)',emitida:'var(--blue)',parcialmente_cobrada:'var(--amber)'}[est.toLowerCase()]||'var(--ink3)';
      return `<tr>
        <td style="font-weight:600;font-size:12px">${f.nroFactura||f.comprobante||f.id}</td>
        <td style="font-size:12px;color:var(--ink3)">${f.fecha||'—'}</td>
        <td style="font-weight:600">${f.cliente||'—'}<div style="font-size:11px;color:var(--ink3)">${f.concepto||''}</div></td>
        <td style="font-size:11px;color:var(--ink3)">${f.cuit||'—'}</td>
        <td style="text-align:right;font-weight:700;color:var(--blue)">${pesos(tot)}</td>
        <td><span class="badge b-gray" style="font-size:10px">${f.entidad||'Moradesign'}</span></td>
        <td><span style="font-size:11px;font-weight:700;color:${ec};text-transform:uppercase">${est}</span></td>
        <td><button onclick="abrirCobro('${f.id}')" style="background:none;border:none;cursor:pointer;color:var(--ink3)">✏️</button></td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

// ── Recibos de Cobro ──
function renderRecibosTabla() {
  const rs = [...(DB.cobros||[]).filter(c=>c.esRecibo||c.tipoDoc==='recibo'||c.tipo==='recibo')].sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''));
  if (!rs.length) return '<div class="empty"><i class="fa fa-receipt" style="font-size:28px;margin-bottom:8px"></i><p>Sin recibos registrados</p></div>';
  return `<div class="tbl-wrap" style="border:none;border-radius:0"><table>
    <thead><tr><th>N° Recibo</th><th>Fecha</th><th>Cliente</th><th>Factura Ref.</th><th style="text-align:right">Monto</th><th>Método</th><th>Estado</th></tr></thead>
    <tbody>${rs.map(r=>`<tr>
      <td style="font-weight:600;font-size:12px">${r.nroRecibo||r.id}</td>
      <td style="font-size:12px;color:var(--ink3)">${r.fecha||'—'}</td>
      <td style="font-weight:600">${r.cliente||'—'}</td>
      <td style="font-size:11px;color:var(--ink3)">${r.facturaRef||r.nroFactura||'—'}</td>
      <td style="text-align:right;font-weight:700;color:var(--green)">${pesos(r.monto||0)}</td>
      <td><span class="badge b-gray">${r.medio||'—'}</span></td>
      <td><span class="badge ${r.estado==='cobrado'?'b-green':'b-amber'}">${r.estado||'pendiente'}</span></td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

// ── Retenciones AFIP ──
function renderRetenciones() {
  if (!DB.retenciones) DB.retenciones = [];
  const rs = [...DB.retenciones].sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''));
  if (!rs.length) return `<div class="empty"><i class="fa fa-landmark" style="font-size:28px;margin-bottom:8px"></i><p>Sin retenciones</p><button onclick="abrirRetencion(null)" class="btn btn-primary btn-sm" style="margin-top:8px"><i class="fa fa-plus"></i> Nueva Retención</button></div>`;
  const tG = rs.filter(r=>r.tipo==='gcias').reduce((s,r)=>s+(parseFloat(r.monto)||0),0);
  const tI = rs.filter(r=>r.tipo==='iibb').reduce((s,r)=>s+(parseFloat(r.monto)||0),0);
  return `
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:16px">
    <div style="background:var(--amber-lt);border-radius:var(--r);padding:14px;text-align:center">
      <div style="font-size:11px;font-weight:700;color:var(--amber);margin-bottom:4px;text-transform:uppercase">Ret. Ganancias</div>
      <div style="font-size:22px;font-weight:800;color:var(--amber)">${pesos(tG)}</div>
    </div>
    <div style="background:var(--purple-lt);border-radius:var(--r);padding:14px;text-align:center">
      <div style="font-size:11px;font-weight:700;color:var(--purple);margin-bottom:4px;text-transform:uppercase">Ret. IIBB</div>
      <div style="font-size:22px;font-weight:800;color:var(--purple)">${pesos(tI)}</div>
    </div>
  </div>
  <div class="tbl-wrap" style="border:none;border-radius:0"><table>
    <thead><tr><th>Fecha</th><th>Agente Retención</th><th>CUIT</th><th>N° Certificado</th><th>Tipo</th><th style="text-align:right">Monto</th><th></th></tr></thead>
    <tbody>${rs.map(r=>`<tr>
      <td style="font-size:12px;color:var(--ink3)">${r.fecha||'—'}</td>
      <td style="font-weight:600">${r.agente||'—'}</td>
      <td style="font-size:11px;color:var(--ink3)">${r.cuit||'—'}</td>
      <td style="font-size:12px">${r.nroCert||'—'}</td>
      <td><span class="badge ${r.tipo==='gcias'?'b-amber':'b-purple'}" style="text-transform:uppercase">${r.tipo==='gcias'?'Ganancias':'IIBB'}</span></td>
      <td style="text-align:right;font-weight:700">${pesos(r.monto||0)}</td>
      <td><button onclick="eliminarRetencion('${r.id}')" style="background:none;border:none;cursor:pointer;color:var(--red)">✕</button></td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

function abrirRetencion(id) {
  const r = id ? (DB.retenciones||[]).find(x=>x.id===id) : null;
  document.getElementById('m-retencion-body').innerHTML = `
    <div class="modal-header"><h3>${r?'Editar':'Nueva'} Retención AFIP</h3></div>
    <div class="modal-body"><div class="form-grid">
      <div class="field"><label>Tipo</label>
        <select id="ret-tipo">
          <option value="gcias" ${r?.tipo==='gcias'?'selected':''}>Ganancias</option>
          <option value="iibb"  ${r?.tipo==='iibb' ?'selected':''}>IIBB</option>
        </select></div>
      <div class="field"><label>Fecha</label><input type="date" id="ret-fecha" value="${r?.fecha||new Date().toISOString().slice(0,10)}"></div>
      <div class="field"><label>Agente de Retención</label>
        <input id="ret-agente" value="${r?.agente||''}" placeholder="Nombre del agente"
          oninput="autocompletarCUIT('ret-agente','ret-cuit')"></div>
      <div class="field"><label>CUIT Agente</label>
        <input id="ret-cuit" value="${r?.cuit||''}" placeholder="30-00000000-0"
          oninput="autocompletarNombre('ret-cuit','ret-agente')"></div>
      <div class="field"><label>N° Certificado</label>
        <input id="ret-cert" value="${r?.nroCert||''}" placeholder="RET-2024-00001"></div>
      <div class="field"><label>Monto Retenido</label>
        <input type="number" id="ret-monto" value="${r?.monto||''}" placeholder="0.00"></div>
      <div class="field full"><label>Observaciones</label>
        <input id="ret-obs" value="${r?.obs||''}" placeholder="Opcional"></div>
    </div></div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="cerrar('m-retencion')">Cancelar</button>
      <button class="btn btn-primary" onclick="guardarRetencion('${r?.id||''}')"><i class="fa fa-check"></i> Guardar</button>
    </div>`;
  abrir('m-retencion');
}

function guardarRetencion(id) {
  const data = {
    tipo:    document.getElementById('ret-tipo')?.value,
    fecha:   document.getElementById('ret-fecha')?.value,
    agente:  document.getElementById('ret-agente')?.value?.trim(),
    cuit:    document.getElementById('ret-cuit')?.value?.trim(),
    nroCert: document.getElementById('ret-cert')?.value?.trim(),
    monto:   parseFloat(document.getElementById('ret-monto')?.value)||0,
    obs:     document.getElementById('ret-obs')?.value?.trim(),
  };
  if (!data.agente || !data.monto) { alert('Completá agente y monto'); return; }
  if (!DB.retenciones) DB.retenciones = [];
  if (id) {
    const i = DB.retenciones.findIndex(x=>x.id===id);
    if (i>=0) DB.retenciones[i] = {...DB.retenciones[i], ...data};
  } else {
    DB.retenciones.push({...data, id:'ret'+Date.now()});
  }
  guardar(); cerrar('m-retencion'); go(modulo);
}

function eliminarRetencion(id) {
  if (!confirm('¿Eliminar esta retención?')) return;
  DB.retenciones = (DB.retenciones||[]).filter(x=>x.id!==id);
  guardar(); go(modulo);
}

// ── Facturas de Proveedores ──
function renderFacturasProveedores() {
  const ps = [...(DB.pagos||[])].sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''));
  if (!ps.length) return '<div class="empty"><i class="fa fa-file-invoice" style="font-size:28px;margin-bottom:8px"></i><p>Sin facturas de proveedores</p><button onclick="abrirPago(null)" class="btn btn-primary btn-sm" style="margin-top:8px"><i class="fa fa-plus"></i> Registrar Factura</button></div>';
  const total = ps.reduce((s,p)=>s+(parseFloat(p.monto)||0)+(parseFloat(p.iva)||0), 0);
  return `<div style="padding:10px 16px;background:var(--red-lt);border-bottom:1px solid var(--border);font-size:13px">
    <strong>Total:</strong> <span style="color:var(--red);font-weight:700">${pesos(total)}</span>
    <span style="color:var(--ink3);margin-left:12px">${ps.length} facturas</span>
  </div>
  <div class="tbl-wrap" style="border:none;border-radius:0"><table>
    <thead><tr><th>N° Factura</th><th>Fecha</th><th>Proveedor</th><th>CUIT</th><th>Concepto</th>
      <th style="text-align:right">Neto</th><th style="text-align:right">IVA</th>
      <th style="text-align:right">Total</th><th>Estado</th>
    </tr></thead>
    <tbody>${ps.map(p => {
      const tot = (parseFloat(p.monto)||0)+(parseFloat(p.iva)||0);
      return `<tr>
        <td style="font-weight:600;font-size:12px">${p.nroFactura||p.comprobante||p.id}</td>
        <td style="font-size:12px;color:var(--ink3)">${p.fecha||'—'}</td>
        <td style="font-weight:600">${p.proveedor||p.cliente||'—'}</td>
        <td style="font-size:11px;color:var(--ink3)">${p.cuit||'—'}</td>
        <td style="font-size:12px;color:var(--ink3)">${p.concepto||'—'}</td>
        <td style="text-align:right;font-size:12px">${pesos(p.monto||0)}</td>
        <td style="text-align:right;font-size:12px;color:var(--ink3)">${pesos(p.iva||0)}</td>
        <td style="text-align:right;font-weight:700;color:var(--red)">${pesos(tot)}</td>
        <td><span class="badge ${p.estado==='pagado'?'b-green':'b-amber'}">${p.estado||'pendiente'}</span></td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

// ── Gastos Operativos + Sueldos integrado ──
function renderGastosOperativos() {
  const gs = [...(DB.gastos||[])].sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''));
  const ss = (DB.sueldos||[]).filter(s=>s.pagado);
  const tG = gs.reduce((s,g)=>s+(parseFloat(g.monto)||0), 0);
  const tS = ss.reduce((s,x)=>s+(parseFloat(x.neto)||0), 0);
  return `
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;padding:16px">
    <div style="background:var(--purple-lt);border-radius:var(--r);padding:12px;text-align:center">
      <div style="font-size:11px;font-weight:700;color:var(--purple);margin-bottom:4px;text-transform:uppercase">Gastos Gral</div>
      <div style="font-size:18px;font-weight:800;color:var(--purple)">${pesos(tG)}</div>
      <div style="font-size:11px;color:var(--ink3)">${gs.length} registros</div>
    </div>
    <div style="background:var(--teal-lt);border-radius:var(--r);padding:12px;text-align:center">
      <div style="font-size:11px;font-weight:700;color:var(--teal);margin-bottom:4px;text-transform:uppercase">Sueldos</div>
      <div style="font-size:18px;font-weight:800;color:var(--teal)">${pesos(tS)}</div>
      <div style="font-size:11px;color:var(--ink3)">${ss.length} liquidaciones</div>
    </div>
    <div style="background:var(--red-lt);border-radius:var(--r);padding:12px;text-align:center">
      <div style="font-size:11px;font-weight:700;color:var(--red);margin-bottom:4px;text-transform:uppercase">Total Egresos Op.</div>
      <div style="font-size:18px;font-weight:800;color:var(--red)">${pesos(tG+tS)}</div>
    </div>
  </div>
  ${renderTablaGastos()}`;
}


function renderResumenPresupuestos() {
  const ps = (DB.presupuestos||[]).sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')).slice(0,10);
  if (!ps.length) return `<div class="empty"><i class="fa fa-file-alt" style="font-size:28px;margin-bottom:8px"></i><p>Sin presupuestos</p><button onclick="go('presupuestos')" class="btn btn-primary btn-sm" style="margin-top:8px">Ir a Presupuestos</button></div>`;
  const stats = {borrador:0,enviado:0,aprobado:0,facturado:0};
  (DB.presupuestos||[]).forEach(p => { if(stats[p.status]!==undefined) stats[p.status]++; });
  return `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:14px;border-bottom:1px solid var(--border)">
    ${Object.entries(stats).map(([k,v])=>`<div style="text-align:center;padding:10px;background:var(--surface-2);border-radius:var(--r)">
      <div style="font-size:18px;font-weight:800">${v}</div>
      <div style="font-size:11px;color:var(--ink3);text-transform:capitalize">${k}</div>
    </div>`).join('')}
  </div>
  <div class="tbl-wrap" style="border:none;border-radius:0"><table>
    <thead><tr><th>N°</th><th>Fecha</th><th>Cliente</th><th>CUIT</th><th style="text-align:right">Total</th><th>Estado</th></tr></thead>
    <tbody>${ps.map(p=>`<tr style="cursor:pointer" onclick="go('presupuestos')">
      <td style="font-weight:600;font-size:12px">${p.numero||p.id}</td>
      <td style="font-size:12px;color:var(--ink3)">${p.fecha||'—'}</td>
      <td style="font-weight:600">${p.clienteNombre||p.cliente||'—'}</td>
      <td style="font-size:11px;color:var(--ink3)">${p.clienteCuit||'—'}</td>
      <td style="text-align:right;font-weight:700;color:var(--green)">${pesos(p.total||0)}</td>
      <td>${bStatusPpto(p.status)}</td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}


function toggleArchivoProyectos() {
  window.verArchivoProyectos = !window.verArchivoProyectos;
  go('gestion');
}


function toggleArchivoDisenos() {
  window.verArchivoDisenos = !window.verArchivoDisenos;
  go('diseno');
}


function descargarArchivo(nombre, dataUrl) {
  if (!dataUrl) {
    alert('Este archivo no tiene datos guardados para descargar. Los archivos deben subirse con contenido base64.');
    return;
  }
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}


function bStatusPpto(s) {
  const map = {
    borrador:   ['b-gray',   'Borrador'],
    enviado:    ['b-blue',   'Enviado'],
    aprobado:   ['b-green',  'Aprobado'],
    rechazado:  ['b-red',    'Rechazado'],
    facturado:  ['b-purple', 'Facturado'],
  };
  const [cls, lbl] = map[s] || ['b-gray', s||'—'];
  return `<span class="badge ${cls}">${lbl}</span>`;
}
