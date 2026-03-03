// FORMA — módulo: contable

  const totalCompra = precioUnitario * cantidad;
  const ivaCompra = totalCompra * porcIva;

  // 2. FLETE — IVA flete fijo 10.5% (transporte de carga)
  const flete = totalCompra * porcFlete;
  const seguroCompra = totalCompra * 0.009;       // 0.9% fijo
  const ivaFlete = (flete + seguroCompra) * 0.105; // 10.5% fijo
  const subtotalFlete = flete + seguroCompra + ivaFlete;

  // 3. SUBTOTAL (base para el margen)
  const subtotal = totalCompra + ivaCompra + subtotalFlete;

  // 4. MARGEN
  const margen = subtotal * porcMargen;

  // 5. PRECIO VENTA NETO
  const precioVentaNeto = subtotal + margen;

  // 6. IMPUESTOS VENTA
  const ivaVenta = precioVentaNeto * porcIva;
  const seguroVenta = precioVentaNeto * 0.008;    // 0.8% fijo
  const iibb = precioVentaNeto * 0.035;           // 3.5% fijo (IIBB)

  // 7. TOTAL FINAL
  const totalFinal = precioVentaNeto + ivaVenta + seguroVenta + iibb;
  const totalUnitario = cantidad > 0 ? totalFinal / cantidad : 0;

  return {
    totalCompra, ivaCompra,
    flete, seguroCompra, ivaFlete, subtotalFlete,
    subtotal, margen, precioVentaNeto,
    ivaVenta, seguroVenta, iibb,
    totalFinal, totalUnitario,
    // compatibilidad con calcItem() anterior
    costoConFlete: subtotal,
    precioNetoUnit: precioVentaNeto / (cantidad||1),
    ivaUnit: ivaVenta / (cantidad||1),
    iibbUnit: iibb / (cantidad||1),
    precioFinalUnit: totalFinal / (cantidad||1),
    totalLinea: totalFinal,
    costoTotal: totalCompra,
    fleteTotal: subtotalFlete,
    seguroTotal: seguroCompra,
    margenM: margen,
    margenTotal: margen,
    ivaVentasTotal: ivaVenta,
    ivaComprasTotal: ivaCompra,
    iibbTotal: iibb
  };
}

// Actualizar calcItem() para usar calcItemNew()
function calcItem(item) { return calcItemNew(item); }

function eliminarPptoId(id) {
  if (!confirm('¿Eliminar este presupuesto? Esta acción no se puede deshacer.')) return;
  DB.presupuestos = DB.presupuestos.filter(x => x.id !== id);
  guardar();
  go(modulo);
}


// ═══════════════════════════════════════════════
// CONTABLE
// ═══════════════════════════════════════════════
function bloqueHeader(num, titulo, color) {
  const gradients = {
    verde:  'linear-gradient(90deg,#0d7a5f,#1aab87)',
    rojo:   'linear-gradient(90deg,#b83a10,#e05a2b)',
    violeta:'linear-gradient(90deg,#5b3fa6,#8b5cf6)',
    azul:   'linear-gradient(90deg,#1e40af,#3b82f6)',
  };
  return `<div style="background:${gradients[color]||gradients.azul};border-radius:var(--r);padding:14px 20px;margin-bottom:14px;margin-top:8px">
    <span style="color:#fff;font-weight:800;font-size:13px;letter-spacing:1.5px;text-transform:uppercase">BLOQUE ${num}: ${titulo}</span>
  </div>`;
}

function contable() {
  titulo('Contabilidad');
  actions(`
    <button class="btn btn-secondary btn-sm" onclick="exportarCSVCont()"><i class="fa fa-file-csv"></i> CSV</button>
    <button class="btn btn-secondary btn-sm" onclick="exportarJSONCont()"><i class="fa fa-download"></i> Backup</button>
    <button class="btn btn-secondary btn-sm" onclick="importarDatosCont()"><i class="fa fa-upload"></i> Importar</button>
    <button class="btn btn-secondary btn-sm" onclick="exportarARCACont()"><i class="fa fa-file-alt"></i> ARCA</button>
  `);

  // ── Persistencia: cargar desde keys propias si existen ──
  ['cobros','pagos','gastos','sueldos','empleados','cheques'].forEach(k => {
    const saved = localStorage.getItem('contabilidad_' + k);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && (!DB[k] || DB[k].length === 0)) {
          DB[k] = parsed;
        }
      } catch(e) {}
    }
    if (!Array.isArray(DB[k])) DB[k] = [];
  });

  if (!DB.retenciones) DB.retenciones = [];

  const ivaVentas      = DB.cobros.reduce((s,c) => s+(parseFloat(c.iva)||0), 0);
  const ivaCompras     = DB.pagos.reduce((s,p)  => s+(parseFloat(p.iva)||0), 0);
  const ivaAPagar      = ivaVentas - ivaCompras;
  const totalCobrado   = DB.cobros.filter(c=>c.estado==='cobrado').reduce((s,c)=>s+(parseFloat(c.monto)||0),0);
  const totalPorCobrar = DB.cobros.filter(c=>c.estado==='pendiente').reduce((s,c)=>s+(parseFloat(c.monto)||0),0);
  const totalPagos     = DB.pagos.reduce((s,p)=>s+(parseFloat(p.monto)||0)+(parseFloat(p.iva)||0),0);
  const totalGastos    = DB.gastos.reduce((s,g)=>s+(parseFloat(g.monto)||0),0);
  const totalSueldos   = DB.sueldos.filter(s=>s.pagado).reduce((s,x)=>s+(parseFloat(x.neto)||0),0);
  const sueldosPend    = DB.sueldos.filter(s=>!s.pagado).reduce((s,x)=>s+(parseFloat(x.neto)||0),0);
  const empleadosActivos = DB.empleados.filter(e=>e.estado==='activo').length;
  const chequesPend    = DB.cheques.filter(c=>c.estado==='pendiente'&&c.tipo==='emitido').reduce((s,c)=>s+(parseFloat(c.monto)||0),0);

  c(`
  <!-- ══ BLOQUE 1: INGRESOS ══ -->
  ${bloqueHeader(1,'INGRESOS','verde')}

  ${renderSeccionCont('sec-presup','Presupuestos','fa-file-alt','var(--green-lt)','var(--green)',
    (DB.presupuestos||[]).length,
    `<button class="btn btn-primary btn-sm" onclick="go('presupuestos')"><i class="fa fa-plus"></i> Nuevo Presupuesto</button>`,
    renderResumenPresupuestos())}

  ${renderSeccionCont('sec-factcli','Facturas a Clientes','fa-file-invoice-dollar','var(--green-lt)','var(--green)',
    (DB.cobros||[]).filter(c=>!c.esRecibo&&c.tipo!=='recibo').length,
    `<button class="btn btn-primary btn-sm" onclick="abrirCobro(null)"><i class="fa fa-plus"></i> Nueva Factura</button>`,
    renderFacturasClientes())}

  ${renderSeccionCont('sec-recibos','Recibos de Cobro','fa-receipt','var(--green-lt)','var(--green)',
    (DB.cobros||[]).filter(c=>c.esRecibo||c.tipo==='recibo').length,
    `<button class="btn btn-primary btn-sm" onclick="abrirCobro(null)"><i class="fa fa-plus"></i> Nuevo Recibo</button>`,
    renderRecibosTabla())}

  <!-- ══ BLOQUE 2: EGRESOS ══ -->
  ${bloqueHeader(2,'EGRESOS','rojo')}

  ${renderSeccionCont('sec-pagos','Pagos y Proveedores','fa-hand-holding-usd','var(--red-lt)','var(--red)',
    DB.pagos.length,
    `<button class="btn btn-primary btn-sm" onclick="abrirPago(null)"><i class="fa fa-plus"></i> Registrar Pago</button>`,
    renderTablaPagos())}

  ${renderSeccionCont('sec-factprov','Facturas de Proveedores','fa-file-invoice','var(--red-lt)','var(--red)',
    (DB.pagos||[]).length,
    `<button class="btn btn-primary btn-sm" onclick="abrirPago(null)"><i class="fa fa-plus"></i> Registrar Factura</button>`,
    renderFacturasProveedores())}

  ${renderSeccionCont('sec-gastos-op','Gastos Operativos (incl. Sueldos)','fa-money-bill-wave','var(--red-lt)','var(--red)',
    (DB.gastos||[]).length + (DB.sueldos||[]).length,
    `<button class="btn btn-primary btn-sm" onclick="abrirGastoModal(null)"><i class="fa fa-plus"></i> Nuevo Gasto</button>`,
    renderGastosOperativos())}

  <!-- ══ BLOQUE 3: TESORERÍA ══ -->
  ${bloqueHeader(3,'TESORERÍA','violeta')}

  ${renderSeccionCont('sec-retenciones','Retenciones AFIP','fa-landmark','var(--purple-lt)','var(--purple)',
    (DB.retenciones||[]).length,
    `<button class="btn btn-primary btn-sm" onclick="abrirRetencion(null)"><i class="fa fa-plus"></i> Nueva Retención</button>`,
    renderRetenciones())}

  ${renderSeccionCont('sec-cheques','Cheques','fa-money-check','var(--purple-lt)','var(--purple)',
    (DB.cheques||[]).length,
    `<button class="btn btn-primary btn-sm" onclick="abrirCheque(null)"><i class="fa fa-plus"></i> Nuevo cheque</button>`,
    renderTablaCheques())}

  <!-- ══ BLOQUE 4: ANÁLISIS ══ -->
  ${bloqueHeader(4,'ANÁLISIS','azul')}

  ${renderSeccionCont('sec-ctacte','Cuenta Corriente Clientes','fa-users','var(--blue-lt)','var(--blue)',
    Object.keys((()=>{const r={};(DB.cobros||[]).forEach(c=>{if(c.cliente)r[c.cuit||c.cliente]=1});return r})()).length,
    `<button class="btn btn-secondary btn-sm" onclick="go('contable')">↻ Actualizar</button>`,
    renderCtaCteClientes())}

  ${renderSeccionCont('sec-iva','Posición IVA / ARCA','fa-university','var(--blue-lt)','var(--blue)', 0,
    `<button class="btn btn-secondary btn-sm" onclick="exportarARCACont()"><i class="fa fa-file-alt"></i> ARCA .txt</button>`,
    `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding:18px">
      <div style="padding:14px;background:var(--red-lt);border-radius:var(--r);text-align:center">
        <div style="font-size:10px;color:var(--red);font-weight:700;text-transform:uppercase;margin-bottom:6px">IVA Ventas</div>
        <div style="font-size:20px;font-weight:800;color:var(--red)">${pesos(ivaVentas)}</div>
        <div style="font-size:10px;color:var(--ink3);margin-top:3px">Débito fiscal</div>
      </div>
      <div style="padding:14px;background:var(--green-lt);border-radius:var(--r);text-align:center">
        <div style="font-size:10px;color:var(--green);font-weight:700;text-transform:uppercase;margin-bottom:6px">IVA Compras</div>
        <div style="font-size:20px;font-weight:800;color:var(--green)">${pesos(ivaCompras)}</div>
        <div style="font-size:10px;color:var(--ink3);margin-top:3px">Crédito fiscal</div>
      </div>
      <div style="padding:14px;background:var(--amber-lt);border-radius:var(--r);text-align:center">
        <div style="font-size:10px;color:var(--amber);font-weight:700;text-transform:uppercase;margin-bottom:6px">Saldo IVA</div>
        <div style="font-size:20px;font-weight:800;color:${ivaAPagar>=0?'var(--amber)':'var(--green)'}">
          ${pesos(Math.abs(ivaAPagar))}
        </div>
        <div style="font-size:10px;color:var(--ink3);margin-top:3px">${ivaAPagar>=0?'A pagar a AFIP':'Saldo a favor'}</div>
      </div>
    </div>`)}

  ${renderSeccionCont('sec-empleados','Empleados','fa-id-badge','var(--blue-lt)','var(--blue)',
    (DB.empleados||[]).length,
    `<button class="btn btn-primary btn-sm" onclick="abrirEmpleado(null)"><i class="fa fa-plus"></i> Nuevo empleado</button>`,
    renderTablaEmpleados())}

  ${renderSeccionCont('sec-sueldos','Liquidación de Sueldos','fa-users','var(--blue-lt)','var(--blue)',
    (DB.sueldos||[]).length,
    `<button class="btn btn-primary btn-sm" onclick="abrirSueldo(null)"><i class="fa fa-plus"></i> Nueva liquidación</button>`,
    renderTablaSueldos())}

  <!-- Resumen del sistema -->
  <div style="margin-top:24px;border:1px dashed var(--border);border-radius:var(--r);padding:20px;background:var(--surface)">
    <div style="font-weight:700;margin-bottom:12px;font-size:13px">📊 Resumen del Sistema</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:12px">
      <div>
        <div style="font-weight:700;color:var(--green);margin-bottom:6px;text-transform:uppercase;font-size:11px">INGRESOS</div>
        <div style="color:var(--ink2)">✅ ${(DB.presupuestos||[]).length} presupuestos cargados</div>
        <div style="color:var(--ink2)">✅ ${(DB.cobros||[]).filter(c=>!c.esRecibo).length} facturas a clientes · Total: ${pesos(totalCobrado+totalPorCobrar)}</div>
        <div style="color:var(--ink2)">✅ ${(DB.cobros||[]).filter(c=>c.esRecibo).length} recibos de cobro · Cobrado: ${pesos(totalCobrado)}</div>
      </div>
      <div>
        <div style="font-weight:700;color:var(--red);margin-bottom:6px;text-transform:uppercase;font-size:11px">EGRESOS</div>
        <div style="color:var(--ink2)">✅ ${DB.pagos.length} pagos a proveedores · Total: ${pesos(totalPagos)}</div>
        <div style="color:var(--ink2)">✅ ${DB.gastos.length} gastos operativos · Total: ${pesos(totalGastos)}</div>
        <div style="color:var(--ink2)">✅ ${DB.sueldos.filter(s=>s.pagado).length} sueldos pagados · ${pesos(totalSueldos)}</div>
      </div>
    </div>
  </div>

  `);
}

// ── Persistencia automática por entidad ──
function guardarContabilidad(key) {
  try { localStorage.setItem('contabilidad_' + key, JSON.stringify(DB[key]||[])); } catch(e) {}
}

// ── Sección colapsable genérica ──
function renderSeccionCont(id, label, icon, bgColor, color, count, btnHtml, bodyHtml) {
  return `<div style="border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;margin-bottom:14px">
    <div onclick="toggleSeccionCont('${id}')" style="display:flex;justify-content:space-between;align-items:center;padding:14px 18px;background:var(--surface);cursor:pointer;user-select:none">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:28px;height:28px;border-radius:50%;background:${bgColor};color:${color};display:flex;align-items:center;justify-content:center;font-size:12px"><i class="fa ${icon}"></i></div>
        <span style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px">${label}</span>
        <span class="badge b-gray">${count}</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px" onclick="event.stopPropagation()">
        ${btnHtml}
        <i class="fa fa-chevron-down" id="${id}-ico" style="color:var(--ink4);font-size:11px;transition:.25s;cursor:pointer" onclick="toggleSeccionCont('${id}')"></i>
      </div>
    </div>
    <div id="${id}" style="display:none;border-top:1px solid var(--border)">${bodyHtml}</div>
  </div>`;
}

// ── Tablas ──
function renderTablaCobros() {
  if (!DB.cobros.length) return '<div class="empty"><i class="fa fa-hand-holding-usd"></i><p>Sin cobros registrados</p></div>';
  const sorted = [...DB.cobros].sort((a,b) => (b.fecha||'').localeCompare(a.fecha||''));
  return `<div class="tbl-wrap" style="border:none;border-radius:0"><table>
    <thead><tr><th>Fecha</th><th>Cliente</th><th>Medio</th><th>Tipo</th><th style="text-align:right">Monto</th><th style="text-align:right">IVA</th><th style="text-align:right">Total</th><th>Estado</th><th></th></tr></thead>
    <tbody>${sorted.map(c => {
      const tot = (parseFloat(c.monto)||0)+(parseFloat(c.iva)||0);
      return `<tr>
        <td style="font-size:11px;color:var(--ink3);white-space:nowrap">${c.fecha||'—'}</td>
        <td style="font-size:13px;font-weight:600">${c.cliente||'—'}<div style="font-size:11px;color:var(--ink3);font-weight:400">${c.concepto||''}</div></td>
        <td><span class="badge b-gray">${c.medio||'—'}</span></td>
        <td><span class="badge b-gray">${c.tipo||'total'}</span></td>
        <td style="text-align:right;font-size:12px">${pesos(c.monto||0)}</td>
        <td style="text-align:right;font-size:12px;color:var(--ink3)">${pesos(c.iva||0)}</td>
        <td style="text-align:right;font-weight:700;color:var(--green)">${pesos(tot)}</td>
        <td>${c.estado==='cobrado'?'<span class="badge b-green">Cobrado</span>':'<span class="badge b-amber">Pendiente</span>'}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-sm" onclick="abrirCobro('${c.id}')" style="margin-right:4px"><i class="fa fa-edit"></i></button>
          <button class="btn btn-sm" style="color:var(--red)" onclick="eliminarCobroCont('${c.id}')"><i class="fa fa-trash"></i></button>
        </td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

function renderTablaPagos() {
  if (!DB.pagos.length) return '<div class="empty"><i class="fa fa-money-bill-wave"></i><p>Sin pagos registrados</p></div>';
  const sorted = [...DB.pagos].sort((a,b) => (b.fecha||'').localeCompare(a.fecha||''));
  return `<div class="tbl-wrap" style="border:none;border-radius:0"><table>
    <thead><tr><th>Fecha</th><th>Proveedor</th><th>Concepto</th><th>Comprobante</th><th>Medio</th><th style="text-align:right">Monto</th><th style="text-align:right">IVA</th><th style="text-align:right">Total</th><th></th></tr></thead>
    <tbody>${sorted.map(p => {
      const tot = (parseFloat(p.monto)||0)+(parseFloat(p.iva)||0);
      return `<tr>
        <td style="font-size:11px;color:var(--ink3);white-space:nowrap">${p.fecha||'—'}</td>
        <td style="font-size:13px;font-weight:600">${p.proveedor||'—'}</td>
        <td style="font-size:12px;color:var(--ink3)">${p.concepto||'—'}</td>
        <td style="font-size:11px;color:var(--ink3)">${p.comprobante||'—'}</td>
        <td><span class="badge b-gray">${p.medio||'—'}</span></td>
        <td style="text-align:right;font-size:12px">${pesos(p.monto||0)}</td>
        <td style="text-align:right;font-size:12px;color:var(--ink3)">${pesos(p.iva||0)}</td>
        <td style="text-align:right;font-weight:700;color:var(--red)">${pesos(tot)}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-sm" onclick="abrirPago('${p.id}')" style="margin-right:4px"><i class="fa fa-edit"></i></button>
          <button class="btn btn-sm" style="color:var(--red)" onclick="eliminarPagoCont('${p.id}')"><i class="fa fa-trash"></i></button>
        </td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

const CAT_ICONS = {
  servicios:'⚡', sueldos:'👥', impuestos:'🏛️', bancario:'🏦',
  marketing:'📣', oficina:'🖥️', materiales:'📦', honorarios:'💼',
  alquiler:'🏠', transporte:'🚗', comidas:'🍽️', otros:'📌'
};
const CAT_COLORS = {
  servicios:'var(--blue)', sueldos:'var(--teal)', impuestos:'var(--amber)',
  bancario:'var(--ink2)', marketing:'var(--purple)', oficina:'var(--ink2)',
  materiales:'var(--green)', honorarios:'var(--accent)', alquiler:'var(--orange)',
  transporte:'var(--ink3)', comidas:'var(--ink3)', otros:'var(--ink4)'
};

function renderTablaGastos() {
  if (!DB.gastos.length) return '<div class="empty"><i class="fa fa-receipt"></i><p>Sin gastos registrados</p></div>';
  const sorted = [...DB.gastos].sort((a,b) => (b.fecha||'').localeCompare(a.fecha||''));
  return `<div class="tbl-wrap" style="border:none;border-radius:0"><table>
    <thead><tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th>Tipo</th><th>Responsable</th><th>Medio</th><th style="text-align:right">Monto</th><th></th></tr></thead>
    <tbody>${sorted.map(g => {
      const ic = (CAT_ICONS||{})[g.categoria]||'📌';
      const col = (CAT_COLORS||{})[g.categoria]||'var(--ink4)';
      return `<tr>
        <td style="font-size:11px;color:var(--ink3);white-space:nowrap">${g.fecha||'—'}</td>
        <td style="font-size:13px;font-weight:600">${g.concepto||'—'}</td>
        <td><span style="font-size:11px;color:${col};font-weight:600">${ic} ${g.categoria||'—'}</span></td>
        <td><span class="badge ${g.tipo==='fijo'?'b-blue':'b-gray'}">${g.tipo||'variable'}</span></td>
        <td style="font-size:12px;color:var(--ink3)">${g.responsable||'—'}</td>
        <td><span class="badge b-gray">${g.medio||'—'}</span></td>
        <td style="text-align:right;font-weight:700;color:var(--purple)">${pesos(g.monto||0)}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-sm" onclick="abrirGastoModal('${g.id}')" style="margin-right:4px"><i class="fa fa-edit"></i></button>
          <button class="btn btn-sm" style="color:var(--red)" onclick="eliminarGastoCont('${g.id}')"><i class="fa fa-trash"></i></button>
        </td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

function renderTablaEmpleados() {
  const emp = DB.empleados||[];
  if (!emp.length) return '<div class="empty"><i class="fa fa-id-badge"></i><p>Sin empleados registrados</p></div>';
  return `<div class="tbl-wrap" style="border:none;border-radius:0"><table>
    <thead><tr><th>Nombre</th><th>Puesto</th><th>Departamento</th><th>Ingreso</th><th style="text-align:right">Salario</th><th>Email</th><th>Estado</th><th></th></tr></thead>
    <tbody>${emp.map(e => `<tr>
      <td style="font-size:13px;font-weight:600">${e.nombre||'—'}</td>
      <td style="font-size:12px">${e.puesto||'—'}</td>
      <td style="font-size:12px;color:var(--ink3)">${e.departamento||'—'}</td>
      <td style="font-size:11px;color:var(--ink3)">${e.fechaIngreso||'—'}</td>
      <td style="text-align:right;font-weight:700;color:var(--teal)">${pesos(e.salario||0)}</td>
      <td style="font-size:11px;color:var(--ink3)">${e.email||'—'}</td>
      <td>${e.estado==='activo'?'<span class="badge b-green">Activo</span>':'<span class="badge b-gray">Inactivo</span>'}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-sm" onclick="abrirEmpleado('${e.id}')" style="margin-right:4px"><i class="fa fa-edit"></i></button>
        <button class="btn btn-sm" style="color:var(--red)" onclick="eliminarEmpleadoCont('${e.id}')"><i class="fa fa-trash"></i></button>
      </td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

function renderTablaSueldos() {
  const sue = DB.sueldos||[];
  if (!sue.length) return '<div class="empty"><i class="fa fa-users"></i><p>Sin liquidaciones registradas</p></div>';
  const sorted = [...sue].sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''));
  return `<div class="tbl-wrap" style="border:none;border-radius:0"><table>
    <thead><tr><th>Empleado</th><th>Período</th><th>Tipo</th><th style="text-align:right">Básico</th><th style="text-align:right">Bonos</th><th style="text-align:right">Deduc.</th><th style="text-align:right">Aportes 17%</th><th style="text-align:right">Neto</th><th>Pagado</th><th></th></tr></thead>
    <tbody>${sorted.map(s => `<tr>
      <td style="font-size:13px;font-weight:600">${s.empleado||'—'}</td>
      <td style="font-size:12px;color:var(--ink3)">${s.periodo||'—'}</td>
      <td><span class="badge b-gray">${s.tipo||'sueldo'}</span></td>
      <td style="text-align:right;font-size:12px">${pesos(s.basico||0)}</td>
      <td style="text-align:right;font-size:12px;color:var(--green)">${pesos(s.bonos||0)}</td>
      <td style="text-align:right;font-size:12px;color:var(--red)">${pesos(s.deducciones||0)}</td>
      <td style="text-align:right;font-size:12px;color:var(--amber)">${pesos(s.aportes||0)}</td>
      <td style="text-align:right;font-weight:700;color:var(--accent)">${pesos(s.neto||0)}</td>
      <td>${s.pagado?'<span class="badge b-green">Pagado</span>':'<span class="badge b-amber">Pendiente</span>'}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-sm" onclick="abrirSueldo('${s.id}')" style="margin-right:4px"><i class="fa fa-edit"></i></button>
        <button class="btn btn-sm" style="color:var(--red)" onclick="eliminarSueldoCont('${s.id}')"><i class="fa fa-trash"></i></button>
      </td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

function renderTablaCheques() {
  const che = DB.cheques||[];
  if (!che.length) return '<div class="empty"><i class="fa fa-money-check"></i><p>Sin cheques registrados</p></div>';
  return `<div class="tbl-wrap" style="border:none;border-radius:0"><table>
    <thead><tr><th>N°</th><th>Tipo</th><th>Beneficiario</th><th>Banco</th><th>Emisión</th><th>Cobro</th><th style="text-align:right">Monto</th><th>Estado</th><th></th></tr></thead>
    <tbody>${che.map(ch => {
      const bEst = {pendiente:'<span class="badge b-amber">Pendiente</span>',cobrado:'<span class="badge b-green">Cobrado</span>',depositado:'<span class="badge b-green">Depositado</span>',rechazado:'<span class="badge b-red">Rechazado</span>',cancelado:'<span class="badge b-gray">Cancelado</span>'}[ch.estado]||'<span class="badge b-gray">—</span>';
      return `<tr>
        <td style="font-size:12px;font-weight:600">${ch.numero||'—'}</td>
        <td>${ch.tipo==='recibido'?'<span class="badge b-green">Recibido</span>':'<span class="badge b-red">Emitido</span>'}</td>
        <td style="font-size:12px">${ch.beneficiario||ch.titular||'—'}</td>
        <td style="font-size:11px;color:var(--ink3)">${ch.banco||'—'}</td>
        <td style="font-size:11px;color:var(--ink3)">${ch.fecha_emision||ch.fechaEmision||'—'}</td>
        <td style="font-size:11px;color:var(--ink3)">${ch.fecha_cobro||ch.fechaCobro||ch.fechaVencimiento||'—'}</td>
        <td style="text-align:right;font-weight:700;color:${ch.tipo==='recibido'?'var(--green)':'var(--red)'}">${pesos(ch.monto||0)}</td>
        <td>${bEst}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-sm" onclick="abrirCheque('${ch.id}')" style="margin-right:4px"><i class="fa fa-edit"></i></button>
          <button class="btn btn-sm" style="color:var(--red)" onclick="eliminarChequeCont('${ch.id}')"><i class="fa fa-trash"></i></button>
        </td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

// ── CRUD COBROS ──
let editCobroId = null;
function abrirCobro(id) {
  editCobroId = id;
  const co = id ? (DB.cobros||[]).find(x=>x.id===id) : null;
  document.getElementById('m-cobro-title').textContent = co ? 'Editar cobro' : 'Nuevo cobro';
  setV('cobro-cliente', co?.cliente||'');
  setV('cobro-concepto', co?.concepto||'');
  setV('cobro-monto', co?.monto||'');
  setV('cobro-iva', co?.iva||'');
  setV('cobro-fecha', co?.fecha||fiDate());
  document.getElementById('cobro-medio').value = co?.medio||'Transferencia';
  document.getElementById('cobro-tipo').value = co?.tipo||'total';
  document.getElementById('cobro-estado').value = co?.estado||'cobrado';
  setV('cobro-cuenta', co?.cuenta||'');
  document.getElementById('cobro-delete-btn').style.display = co ? 'inline-flex' : 'none';
  abrir('m-cobro');
}
function guardarCobroNuevo() {
  const cliente = v('cobro-cliente');
  const montoNum = parseFloat(v('cobro-monto'))||0;
  const fechaVal = v('cobro-fecha');
  if (!cliente || !montoNum || !fechaVal) { alert('Completá cliente, monto y fecha'); return; }
  // IVA automático 21% si está vacío
  const ivaInput = v('cobro-iva');
  const ivaNum = ivaInput ? parseFloat(ivaInput)||0 : montoNum * 0.21;
  const data = {
    cliente, concepto: v('cobro-concepto'),
    monto: montoNum, iva: ivaNum,
    fecha: fechaVal,
    medio: document.getElementById('cobro-medio').value,
    tipo: document.getElementById('cobro-tipo').value,
    estado: document.getElementById('cobro-estado').value,
    cuenta: v('cobro-cuenta')
  };
  if (!DB.cobros) DB.cobros = [];
  if (editCobroId) {
    const i = DB.cobros.findIndex(x=>x.id===editCobroId);
    if (i>=0) DB.cobros[i] = {...DB.cobros[i], ...data};
  } else {
    DB.cobros.push({...data, id: 'co'+Date.now()});
  }
  guardar(); guardarContabilidad('cobros'); cerrar('m-cobro'); go(modulo);
}
function eliminarCobroCont(id) {
  if (!confirm('¿Estás seguro de eliminar este cobro?')) return;
  DB.cobros = (DB.cobros||[]).filter(x=>x.id!==id);
  guardar(); guardarContabilidad('cobros'); go(modulo);
}

// ── CRUD PAGOS ──
let editPagoId = null;
function abrirPago(id) {
  editPagoId = id;
  if (!DB.pagos) DB.pagos = [];
  const p = id ? DB.pagos.find(x=>x.id===id) : null;
  document.getElementById('m-pago-title').textContent = p ? 'Editar pago' : 'Nuevo pago';
  setV('pago-proveedor', p?.proveedor||'');
  setV('pago-concepto', p?.concepto||'');
  setV('pago-monto', p?.monto||'');
  setV('pago-iva', p?.iva||'');
  setV('pago-fecha', p?.fecha||fiDate());
  document.getElementById('pago-medio').value = p?.medio||'Transferencia';
  setV('pago-comprobante', p?.comprobante||'');
  setV('pago-cuenta', p?.cuenta||'');
  document.getElementById('pago-delete-btn').style.display = p ? 'inline-flex' : 'none';
  abrir('m-pago');
}
function guardarPago() {
  const proveedor = v('pago-proveedor');
  const concepto = v('pago-concepto');
  const montoNum = parseFloat(v('pago-monto'))||0;
  const fechaVal = v('pago-fecha');
  if (!proveedor || !concepto || !montoNum || !fechaVal) { alert('Completá proveedor, concepto, monto y fecha'); return; }
  const ivaInput = v('pago-iva');
  const ivaNum = ivaInput ? parseFloat(ivaInput)||0 : montoNum * 0.21;
  const data = {
    proveedor, concepto, monto: montoNum, iva: ivaNum,
    fecha: fechaVal,
    medio: document.getElementById('pago-medio').value,
    comprobante: v('pago-comprobante'), cuenta: v('pago-cuenta')
  };
  if (!DB.pagos) DB.pagos = [];
  if (editPagoId) {
    const i = DB.pagos.findIndex(x=>x.id===editPagoId);
    if (i>=0) DB.pagos[i] = {...DB.pagos[i], ...data};
  } else {
    DB.pagos.push({...data, id: 'pa'+Date.now()});
  }
  guardar(); guardarContabilidad('pagos'); cerrar('m-pago'); go(modulo);
}
function eliminarPagoCont(id) {
  if (!confirm('¿Estás seguro de eliminar este pago?')) return;
  DB.pagos = (DB.pagos||[]).filter(x=>x.id!==id);
  guardar(); guardarContabilidad('pagos'); go(modulo);
}

// ── CRUD GASTOS (contable) ──
editGastoId = null;
function abrirGastoModal(id) {
  editGastoId = id;
  const g = id ? (DB.gastos||[]).find(x=>x.id===id) : null;
  const titleEl = document.getElementById('m-gasto-title');
  if (titleEl) titleEl.textContent = g ? 'Editar gasto' : 'Nuevo gasto';
  setV('g-fecha', g?.fecha||fiDate());
  setV('g-concepto', g?.concepto||'');
  setV('g-monto', g?.monto||'');
  setV('g-responsable', g?.responsable||''); setV('g-resp', g?.responsable||'');
  setV('g-notas', g?.notas||'');
  const catEl = document.getElementById('g-categoria') || document.getElementById('g-cat');
  if (catEl) catEl.value = g?.categoria||'otros';
  const tipoEl = document.getElementById('g-tipo');
  if (tipoEl) tipoEl.value = g?.tipo||'variable';
  const medioEl = document.getElementById('g-medio');
  if (medioEl) medioEl.value = g?.medio||'transferencia';
  const delBtn = document.getElementById('g-delete-btn');
  if (delBtn) delBtn.style.display = g ? 'inline-flex' : 'none';
  abrir('m-gasto');
}
function eliminarGastoCont(id) {
  if (!confirm('¿Estás seguro de eliminar este gasto?')) return;
  DB.gastos = (DB.gastos||[]).filter(x=>x.id!==id);
  guardar(); guardarContabilidad('gastos'); go(modulo);
}

// ── CRUD EMPLEADOS ──
let editEmpleadoId = null;
function abrirEmpleado(id) {
  if (!DB.empleados) DB.empleados = [];
  editEmpleadoId = id;
  const e = id ? DB.empleados.find(x=>x.id===id) : null;
  document.getElementById('m-empleado-title').textContent = e ? 'Editar empleado' : 'Nuevo empleado';
  setV('emp-nombre', e?.nombre||'');
  setV('emp-puesto', e?.puesto||'');
  setV('emp-departamento', e?.departamento||'');
  setV('emp-ingreso', e?.fechaIngreso||fiDate());
  setV('emp-salario', e?.salario||'');
  setV('emp-email', e?.email||'');
  setV('emp-telefono', e?.telefono||'');
  document.getElementById('emp-estado').value = e?.estado||'activo';
  document.getElementById('emp-delete-btn').style.display = e ? 'inline-flex' : 'none';
  abrir('m-empleado');
}
function guardarEmpleado() {
  const nombre = v('emp-nombre'), puesto = v('emp-puesto');
  if (!nombre || !puesto) { alert('Completá nombre y puesto'); return; }
  if (!DB.empleados) DB.empleados = [];
  const data = {
    nombre, puesto, departamento: v('emp-departamento'),
    fechaIngreso: v('emp-ingreso'), salario: parseFloat(v('emp-salario'))||0,
    email: v('emp-email'), telefono: v('emp-telefono'),
    estado: document.getElementById('emp-estado').value
  };
  if (editEmpleadoId) {
    const i = DB.empleados.findIndex(x=>x.id===editEmpleadoId);
    if (i>=0) DB.empleados[i] = {...DB.empleados[i], ...data};
  } else {
    DB.empleados.push({...data, id: 'emp'+Date.now()});
  }
  guardar(); guardarContabilidad('empleados'); cerrar('m-empleado'); go(modulo);
}
function eliminarEmpleadoCont(id) {
  if (!confirm('¿Estás seguro de eliminar este empleado?')) return;
  DB.empleados = (DB.empleados||[]).filter(x=>x.id!==id);
  guardar(); guardarContabilidad('empleados'); go(modulo);
}

// ── CRUD SUELDOS ──
let editSueldoId = null;
function abrirSueldo(id) {
  if (!DB.sueldos) DB.sueldos = [];
  if (!DB.empleados) DB.empleados = [];
  editSueldoId = id;
  const s = id ? DB.sueldos.find(x=>x.id===id) : null;
  document.getElementById('m-sueldo-title').textContent = s ? 'Editar liquidación' : 'Nueva liquidación';
  const empSel = document.getElementById('sue-empleado');
  empSel.innerHTML = '<option value="">— Seleccionar empleado —</option>' +
    DB.empleados.map(e=>`<option value="${e.id}" ${s?.empleadoId===e.id?'selected':''}>${e.nombre}</option>`).join('');
  setV('sue-periodo', s?.periodo||'');
  setV('sue-basico', s?.basico||'');
  setV('sue-bonos', s?.bonos||'');
  setV('sue-deducciones', s?.deducciones||'');
  setV('sue-aportes', s?.aportes||'');
  document.getElementById('sue-tipo').value = s?.tipo||'sueldo';
  document.getElementById('sue-pagado').value = s?.pagado ? 'true' : 'false';
  setV('sue-fecha', s?.fecha||fiDate());
  calcularSueldo();
  document.getElementById('sue-delete-btn').style.display = s ? 'inline-flex' : 'none';
  abrir('m-sueldo');
}
function calcularSueldo() {
  const basico = parseFloat(v('sue-basico'))||0;
  const bonos = parseFloat(v('sue-bonos'))||0;
  const dedu = parseFloat(v('sue-deducciones'))||0;
  const aportesRaw = v('sue-aportes');
  const aportes = (aportesRaw && parseFloat(aportesRaw) !== 0) ? parseFloat(aportesRaw)||0 : basico * 0.17;
  // Auto-rellenar aportes si estaba vacío
  if (!aportesRaw && basico > 0) setV('sue-aportes', aportes.toFixed(2));
  const neto = basico + bonos - dedu - aportes;
  const netoEl = document.getElementById('sue-neto');
  if (netoEl) netoEl.textContent = pesos(neto);
}
function guardarSueldo() {
  const empId = document.getElementById('sue-empleado').value;
  const basico = parseFloat(v('sue-basico'))||0;
  if (!empId || !basico) { alert('Seleccioná empleado e ingresá el sueldo básico'); return; }
  const emp = DB.empleados.find(x=>x.id===empId);
  const bonos = parseFloat(v('sue-bonos'))||0;
  const dedu = parseFloat(v('sue-deducciones'))||0;
  const aportesRaw = v('sue-aportes');
  const aportes = (aportesRaw && parseFloat(aportesRaw) !== 0) ? parseFloat(aportesRaw)||0 : basico * 0.17;
  const neto = basico + bonos - dedu - aportes;
  if (!DB.sueldos) DB.sueldos = [];
  const data = {
    empleadoId: empId, empleado: emp?.nombre||'—',
    periodo: v('sue-periodo'), basico, bonos, deducciones: dedu,
    aportes, neto, fecha: v('sue-fecha'),
    tipo: document.getElementById('sue-tipo').value,
    pagado: document.getElementById('sue-pagado').value === 'true'
  };
  if (editSueldoId) {
    const i = DB.sueldos.findIndex(x=>x.id===editSueldoId);
    if (i>=0) DB.sueldos[i] = {...DB.sueldos[i], ...data};
  } else {
    DB.sueldos.push({...data, id: 's'+Date.now()});
  }
  guardar(); guardarContabilidad('sueldos'); cerrar('m-sueldo'); go(modulo);
}
function eliminarSueldoCont(id) {
  if (!confirm('¿Estás seguro de eliminar esta liquidación?')) return;
  DB.sueldos = (DB.sueldos||[]).filter(x=>x.id!==id);
  guardar(); guardarContabilidad('sueldos'); go(modulo);
}

// ── Eliminar cheque desde contable ──
function eliminarChequeCont(id) {
  if (!confirm('¿Estás seguro de eliminar este cheque?')) return;
  DB.cheques = (DB.cheques||[]).filter(x=>x.id!==id);
  guardar(); guardarContabilidad('cheques'); go(modulo);
}

// ── Helper setV ──
function setV(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val != null ? val : '';
}

function toggleSeccionCont(id) {
  const el = document.getElementById(id);
  const ico = document.getElementById(id + '-ico');
  if (!el) return;
  const open = el.style.display !== 'none';
  el.style.display = open ? 'none' : 'block';
  if (ico) ico.style.transform = open ? 'rotate(0deg)' : 'rotate(180deg)';
}

// ── Compat. legacy ──
function registrarCobro(pptoId) { editCobroId = null; abrirCobro(null); }
function guardarCobro() { guardarCobroNuevo(); }
function eliminarCobro(id) { eliminarCobroCont(id); }
function eliminarPago(id) { eliminarPagoCont(id); }
function eliminarGasto(id) { eliminarGastoCont(id); }
function eliminarEmpleado(id) { eliminarEmpleadoCont(id); }
function eliminarSueldo(id) { eliminarSueldoCont(id); }

function abrirPopupPorCobrar() {
  const aprobados = DB.presupuestos.filter(p => p.status === 'aprobado');
  let totalPend = 0;
  const rows = aprobados.map(p => {
    const cobrado = DB.cobros.filter(c => c.pptoId === p.id).reduce((s, c) => s + (parseFloat(c.monto) || 0), 0);
    const pendiente = (p.totalFinal || 0) - cobrado;
    if (pendiente <= 0) return '';
    totalPend += pendiente;
    const pctCob = p.totalFinal ? Math.min(100, (cobrado / p.totalFinal) * 100) : 0;
    return `<tr onclick="cerrar('m-porcobrar');go('contable')" style="cursor:pointer">
      <td><div style="font-weight:700;font-size:12px">${p.numero}</div><div style="font-size:11px;color:var(--ink3)">${p.proyNom||''}</div></td>
      <td style="font-size:13px">${p.cliente}</td>
      <td style="font-weight:600;color:var(--green)">${pesos(p.totalFinal)}</td>
      <td style="font-weight:700;color:var(--red)">${pesos(pendiente)}</td>
      <td><div style="display:flex;align-items:center;gap:6px">
        <div style="width:60px;height:6px;background:var(--border);border-radius:3px;overflow:hidden">
          <div style="width:${pctCob.toFixed(0)}%;height:100%;background:${pctCob>=100?'var(--green)':pctCob>50?'var(--accent)':'var(--amber)'}"></div>
        </div>
        <span style="font-size:10px;color:var(--ink3)">${pctCob.toFixed(0)}%</span>
      </div></td>
    </tr>`;
  }).filter(Boolean).join('');
  const body = document.getElementById('popup-porcobrar-body');
  if (!rows) {
    body.innerHTML = '<div class="empty"><i class="fa fa-check-circle" style="color:var(--green)"></i><p style="color:var(--green);font-weight:600">¡Todo cobrado!</p></div>';
  } else {
    body.innerHTML = `<div style="padding:16px 0 0"><table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:var(--surface2)">
        <th style="padding:8px 14px;font-size:10px;font-weight:700;text-transform:uppercase;color:var(--ink3);border-bottom:1px solid var(--border)">N° Ppto.</th>
        <th style="padding:8px 14px;font-size:10px;font-weight:700;text-transform:uppercase;color:var(--ink3);border-bottom:1px solid var(--border)">Cliente</th>
        <th style="padding:8px 14px;font-size:10px;font-weight:700;text-transform:uppercase;color:var(--ink3);border-bottom:1px solid var(--border)">Total</th>
        <th style="padding:8px 14px;font-size:10px;font-weight:700;text-transform:uppercase;color:var(--ink3);border-bottom:1px solid var(--border)">Pendiente</th>
        <th style="padding:8px 14px;font-size:10px;font-weight:700;text-transform:uppercase;color:var(--ink3);border-bottom:1px solid var(--border)">Avance</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="padding:14px 14px 0;display:flex;justify-content:flex-end;border-top:2px solid var(--ink);margin-top:8px">
      <div style="font-size:15px;font-weight:800;color:var(--red)">Total pendiente: ${pesos(totalPend)}</div>
    </div></div>`;
  }
  abrir('m-porcobrar');
}

// ── EXPORTACIONES ──
function exportarCSVCont() {
  const ivaV = DB.cobros.reduce((s,c)=>s+(parseFloat(c.iva)||0),0);
  const ivaC = DB.pagos.reduce((s,p)=>s+(parseFloat(p.iva)||0),0);
  const ivaP = ivaV - ivaC;
  const totCob = DB.cobros.filter(c=>c.estado==='cobrado').reduce((s,c)=>s+(parseFloat(c.monto)||0),0);
  const totPorCob = DB.cobros.filter(c=>c.estado==='pendiente').reduce((s,c)=>s+(parseFloat(c.monto)||0),0);
  const totPag = DB.pagos.reduce((s,p)=>s+(parseFloat(p.monto)||0)+(parseFloat(p.iva)||0),0);
  const totGas = DB.gastos.reduce((s,g)=>s+(parseFloat(g.monto)||0),0);
  const totSue = (DB.sueldos||[]).filter(s=>s.pagado).reduce((s,x)=>s+(parseFloat(x.neto)||0),0);

  let csv = '';
  csv += 'COBROS Y FACTURACION\n';
  csv += 'Fecha,Cliente,Monto,IVA,Total,Medio,Tipo,Estado\n';
  DB.cobros.forEach(c => {
    const tot = (parseFloat(c.monto)||0)+(parseFloat(c.iva)||0);
    csv += `${c.fecha||''},"${c.cliente||''}",${c.monto||0},${c.iva||0},${tot},${c.medio||''},${c.tipo||''},${c.estado||''}\n`;
  });
  csv += '\nPAGOS Y PROVEEDORES\n';
  csv += 'Fecha,Proveedor,Concepto,Monto,IVA,Total,Medio,Comprobante\n';
  DB.pagos.forEach(p => {
    const tot = (parseFloat(p.monto)||0)+(parseFloat(p.iva)||0);
    csv += `${p.fecha||''},"${p.proveedor||''}","${p.concepto||''}",${p.monto||0},${p.iva||0},${tot},${p.medio||''},"${p.comprobante||''}"\n`;
  });
  csv += '\nGASTOS GENERALES\n';
  csv += 'Fecha,Concepto,Categoria,Tipo,Responsable,Monto,Medio,Notas\n';
  DB.gastos.forEach(g => {
    csv += `${g.fecha||''},"${g.concepto||''}",${g.categoria||''},${g.tipo||''},"${g.responsable||''}",${g.monto||0},${g.medio||''},"${g.notas||''}"\n`;
  });
  csv += '\nSUELDOS Y LIQUIDACIONES\n';
  csv += 'Fecha,Empleado,Periodo,Basico,Bonos,Deducciones,Aportes,Neto,Tipo,Pagado\n';
  (DB.sueldos||[]).forEach(s => {
    csv += `${s.fecha||''},"${s.empleado||''}","${s.periodo||''}",${s.basico||0},${s.bonos||0},${s.deducciones||0},${s.aportes||0},${s.neto||0},${s.tipo||''},${s.pagado?'SI':'NO'}\n`;
  });
  csv += '\nEMPLEADOS\n';
  csv += 'Nombre,Puesto,Departamento,Fecha Ingreso,Salario,Email,Telefono,Estado\n';
  (DB.empleados||[]).forEach(e => {
    csv += `"${e.nombre||''}","${e.puesto||''}","${e.departamento||''}",${e.fechaIngreso||''},${e.salario||0},"${e.email||''}","${e.telefono||''}",${e.estado||''}\n`;
  });
  csv += '\nCHEQUES\n';
  csv += 'Tipo,Numero,Beneficiario,Monto,Fecha Emision,Fecha Cobro,Banco,Estado,Notas\n';
  (DB.cheques||[]).forEach(c => {
    csv += `${c.tipo||''},"${c.numero||''}","${c.beneficiario||c.titular||''}",${c.monto||0},${c.fecha_emision||c.fechaEmision||''},${c.fecha_cobro||c.fechaCobro||c.fechaVencimiento||''},"${c.banco||''}",${c.estado||''},"${c.notas||''}"\n`;
  });
  csv += '\nRESUMEN IVA ARCA\n';
  csv += 'Concepto,Monto\n';
  csv += `IVA Debito Fiscal (Ventas),${ivaV}\n`;
  csv += `IVA Credito Fiscal (Compras),${ivaC}\n`;
  csv += `Saldo IVA a Pagar,${ivaP}\n`;
  csv += '\nRESUMEN GENERAL\n';
  csv += 'Concepto,Monto\n';
  csv += `Total Cobrado,${totCob}\n`;
  csv += `Total Por Cobrar,${totPorCob}\n`;
  csv += `Total Pagos,${totPag}\n`;
  csv += `Total Gastos,${totGas}\n`;
  csv += `Total Sueldos Pagados,${totSue}\n`;

  const fecha = new Date().toISOString().split('T')[0];
  const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `FORMA_Contabilidad_${fecha}.csv`; a.click();
}

function exportarJSONCont() {
  const datos = {
    cobros: DB.cobros, pagos: DB.pagos, gastos: DB.gastos,
    sueldos: DB.sueldos||[], empleados: DB.empleados||[],
    cheques: DB.cheques||[], exportadoEl: new Date().toISOString()
  };
  const fecha = new Date().toISOString().split('T')[0];
  const blob = new Blob([JSON.stringify(datos,null,2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `FORMA_Contabilidad_Backup_${fecha}.json`; a.click();
}

function importarDatosCont() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const datos = JSON.parse(ev.target.result);
        if (datos.cobros) { DB.cobros = datos.cobros; guardarContabilidad('cobros'); }
        if (datos.pagos) { DB.pagos = datos.pagos; guardarContabilidad('pagos'); }
        if (datos.gastos) { DB.gastos = datos.gastos; guardarContabilidad('gastos'); }
        if (datos.sueldos) { DB.sueldos = datos.sueldos; guardarContabilidad('sueldos'); }
        if (datos.empleados) { DB.empleados = datos.empleados; guardarContabilidad('empleados'); }
        if (datos.cheques) { DB.cheques = datos.cheques; guardarContabilidad('cheques'); }
        guardar();
        alert('✅ Datos importados correctamente.');
        go(modulo);
      } catch(err) { alert('❌ Error al importar: ' + err.message); }
    };
    reader.readAsText(file);
  };
  input.click();
}

function exportarARCACont() {
  const ivaV = DB.cobros.reduce((s,c)=>s+(parseFloat(c.iva)||0),0);
  const ivaC = DB.pagos.reduce((s,p)=>s+(parseFloat(p.iva)||0),0);
  const ivaP = ivaV - ivaC;
  const totCob = DB.cobros.filter(c=>c.estado==='cobrado').reduce((s,c)=>s+(parseFloat(c.monto)||0),0);
  const totPag = DB.pagos.reduce((s,p)=>s+(parseFloat(p.monto)||0)+(parseFloat(p.iva)||0),0);
  const hoyStr = new Date().toLocaleDateString('es-AR',{day:'numeric',month:'long',year:'numeric'});
  const periodo = new Date().toLocaleDateString('es-AR',{month:'long',year:'numeric'});
  let txt = '';
  txt += '═══════════════════════════════════════════\n';
  txt += '   REPORTE IVA PARA ARCA - FORMA DESIGN   \n';
  txt += '═══════════════════════════════════════════\n';
  txt += `Fecha de generación: ${hoyStr}\n`;
  txt += `Período: ${periodo}\n\n`;
  txt += '───────────────────────────────────────────\n';
  txt += '              RESUMEN IVA                  \n';
  txt += '───────────────────────────────────────────\n\n';
  txt += `IVA Débito Fiscal (Ventas)....... ${pesos(ivaV)}\n`;
  txt += `IVA Crédito Fiscal (Compras)..... ${pesos(ivaC)}\n`;
  txt += '─'.repeat(43) + '\n';
  txt += `SALDO IVA ${ivaP>=0?'A PAGAR':'A FAVOR'}........... ${pesos(Math.abs(ivaP))}\n\n`;
  txt += '───────────────────────────────────────────\n';
  txt += '   DETALLE DE VENTAS (IVA DÉBITO)         \n';
  txt += '───────────────────────────────────────────\n\n';
  DB.cobros.forEach(c => {
    txt += `${c.fecha||'—'} | ${(c.cliente||'').padEnd(28)} | ${pesos(parseFloat(c.monto)||0).padStart(14)} | IVA: ${pesos(parseFloat(c.iva)||0).padStart(11)}\n`;
  });
  txt += '\n───────────────────────────────────────────\n';
  txt += '   DETALLE DE COMPRAS (IVA CRÉDITO)       \n';
  txt += '───────────────────────────────────────────\n\n';
  DB.pagos.forEach(p => {
    txt += `${p.fecha||'—'} | ${(p.proveedor||'').padEnd(28)} | ${pesos(parseFloat(p.monto)||0).padStart(14)} | IVA: ${pesos(parseFloat(p.iva)||0).padStart(11)}\n`;
  });
  txt += '\n═══════════════════════════════════════════\n';
  txt += `         TOTAL COBRADO: ${pesos(totCob)}         \n`;
  txt += `         TOTAL PAGADO:  ${pesos(totPag)}          \n`;
  txt += '═══════════════════════════════════════════\n';
  const fecha = new Date().toISOString().split('T')[0];
  const blob = new Blob([txt], {type:'text/plain;charset=utf-8;'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `ARCA_IVA_${fecha}.txt`; a.click();
}

// Compat. aliases
function exportarCSV() { exportarCSVCont(); }
function exportarJSON() { exportarJSONCont(); }
function exportarARCA() { exportarARCACont(); }
function importarDatosContable() { importarDatosCont(); }

// Aliases para módulo contable (mismo co// ═══════════════════════════════════════════════
// FINANCIERO
// ═══════════════════════════════════════════════
// ── CUENTAS BANCARIAS CONFIGURADAS ──
const CUENTAS_BANCO = [
  { id: '0956091974-2', tipo: 'CC_DOLARES', moneda: 'USD', titular: 'MORADESIGN S.R.L', label: 'CC USD' },