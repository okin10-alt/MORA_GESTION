// FORMA — módulo: financiero

  { id: '0956091975-5', tipo: 'CC_PESOS',   moneda: 'ARS', titular: 'MORADESIGN S.R.L', label: 'CC ARS' },
  { id: '0942161811-5', tipo: 'CC_PESOS',   moneda: 'ARS', titular: 'MORADESIGN S.R.L', label: 'CC ARS 2' },
  { id: '0940324325-6', tipo: 'CA_PESOS',   moneda: 'ARS', titular: 'CECILIA MORALES',  label: 'CA ARS' },
  { id: '0940762212-7', tipo: 'CC_PESOS',   moneda: 'ARS', titular: 'CECILIA MORALES',  label: 'CC ARS' },
];
const CAT_BANCO_ICONS = {
  operacion: '💳', servicios: '⚡', sueldos: '👥',
  impuestos: '🏛️', bancario: '🏦', marketing: '📣',
  oficina: '🖥️', otros: '📌'
};
let tabCuentaActiva = 'todas';
let movBancariosFiltrados = [];
let movBackup = null;

function financiero() {
  titulo('Análisis Financiero');
  actions('');

  const movs = DB.movBancarios || [];
  const ahora = new Date();
  const hace30 = new Date(ahora); hace30.setDate(ahora.getDate() - 30);

  // ── Calcular saldo actual (último movimiento de cada cuenta) ──
  const saldoPorCuenta = {};
  CUENTAS_BANCO.forEach(cu => {
    const mc = movs.filter(m => m.numero_cuenta === cu.id)
                   .sort((a, b) => {
                     // Parsear DD/MM/YYYY a Date para ordenar
                     const toDate = s => { const [d,mo,y] = (s||'').split('/'); return new Date(y,mo-1,d); };
                     return toDate(a.fecha) - toDate(b.fecha);
                   });
    if (mc.length) saldoPorCuenta[cu.id] = parseFloat(mc[mc.length - 1].saldo) || 0;
  });
  const saldoTotalARS = CUENTAS_BANCO.filter(cu => cu.moneda === 'ARS').reduce((s, cu) => s + (saldoPorCuenta[cu.id] || 0), 0);
  const saldoTotalUSD = CUENTAS_BANCO.filter(cu => cu.moneda === 'USD').reduce((s, cu) => s + (saldoPorCuenta[cu.id] || 0), 0);

  // ── Ingresos/egresos últimos 60 días ──
  const toDate = s => { const [d,mo,y] = (s||'').split('/'); return new Date(y, mo-1, d); };
  const movs30 = movs.filter(m => toDate(m.fecha) >= hace30);
  const ingresos30 = movs30.reduce((s, m) => s + (parseFloat(m.credito) || 0), 0);
  const egresos30  = movs30.reduce((s, m) => s + (parseFloat(m.debito)  || 0), 0);
  const flujo30    = ingresos30 - egresos30;

  // ── Total créditos/débitos histórico ──
  const totalCreditos = movs.reduce((s, m) => s + (parseFloat(m.credito) || 0), 0);
  const totalDebitos  = movs.reduce((s, m) => s + (parseFloat(m.debito)  || 0), 0);

  // ── Por cobrar: cobros con estado pendiente ──
  const porCobrar = (DB.cobros || [])
    .filter(c => c.estado === 'pendiente')
    .reduce((s, c) => s + (parseFloat(c.monto) || 0), 0);

  // ── Proyección: saldo actual ARS + cobros pendientes ──
  const proyeccion = saldoTotalARS + porCobrar;

  // ── Render ──
  c(`
  <!-- TÍTULO -->
  <div style="margin-bottom:20px">
    <div style="font-size:11px;color:var(--ink3);letter-spacing:.5px">Acceso exclusivo gerencia · Datos bancarios y proyecciones</div>
  </div>

  <!-- SECCIÓN 1: MOVIMIENTOS BANCARIOS -->
  <div style="border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;margin-bottom:18px">
    <div onclick="toggleFinSec('fin-movs')"
      style="display:flex;justify-content:space-between;align-items:center;padding:14px 18px;background:var(--surface);cursor:pointer;user-select:none">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:32px;height:32px;border-radius:50%;background:var(--teal-lt);color:var(--teal);display:flex;align-items:center;justify-content:center;font-size:14px">
          <i class="fa fa-university"></i>
        </div>
        <div>
          <div style="font-size:13px;font-weight:700">Movimientos Bancarios</div>
          <div style="font-size:11px;color:var(--ink3);margin-top:1px">${movs.length} movimientos registrados</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="badge b-gray">${movs.length}</span>
        <i class="fa fa-chevron-down" id="fin-movs-ico" style="color:var(--ink4);font-size:11px;transition:.25s"></i>
      </div>
    </div>
    <div id="fin-movs" style="border-top:1px solid var(--border)">
      <!-- Botones de acción -->
      <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <button class="btn btn-primary btn-sm" onclick="abrirModalPegarExtracto()">
          <i class="fa fa-paste"></i> Pegar extracto
        </button>
        <label class="btn btn-secondary btn-sm" style="cursor:pointer">
          <i class="fa fa-file-upload"></i> Archivo
          <input type="file" accept=".csv,.txt" style="display:none" onchange="importarArchivoBancario(this)">
        </label>
        ${movBackup !== null ? `<button class="btn btn-sm" style="background:var(--amber-lt);color:var(--amber)" onclick="deshacerImportacion()">
          <i class="fa fa-undo"></i> Deshacer
        </button>` : ''}
        ${movs.length ? `<button class="btn btn-sm" style="background:var(--red-lt);color:var(--red)" onclick="limpiarMovimientos()">
          <i class="fa fa-trash"></i> Limpiar
        </button>` : ''}
        <span style="font-size:11px;color:var(--ink4);margin-left:auto">${movs.length ? `Última importación: ${movs[movs.length-1]?.fecha_importacion || '—'}` : 'Sin movimientos'}</span>
      </div>

      <!-- Tabs de cuentas -->
      <div style="display:flex;border-bottom:1px solid var(--border);background:var(--surface2);overflow-x:auto">
        ${renderTabsCuentas(movs)}
      </div>

      <!-- Tabla de movimientos -->
      <div id="fin-movs-tabla">
        ${renderTablaMovimientos(movs, tabCuentaActiva)}
      </div>
    </div>
  </div>

  <!-- SECCIÓN 2: STATS PRINCIPALES -->
  <div class="stats-row" style="grid-template-columns:repeat(5,1fr)">
    <div class="stat-card">
      <div class="stat-icon" style="background:${saldoTotalARS >= 0 ? 'var(--green-lt)' : 'var(--red-lt)'};color:${saldoTotalARS >= 0 ? 'var(--green)' : 'var(--red)'}"><i class="fa fa-university"></i></div>
      <div class="stat-label">Saldo ARS</div>
      <div class="stat-value" style="font-size:16px;color:${saldoTotalARS >= 0 ? 'var(--green)' : 'var(--red)'}">
        ${movs.length ? pesos(saldoTotalARS) : '<span style="color:var(--ink4);font-size:13px">Sin datos</span>'}
      </div>
      <div class="stat-sub">${CUENTAS_BANCO.filter(cu=>cu.moneda==='ARS').length} cuentas</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:var(--teal-lt);color:var(--teal)"><i class="fa fa-dollar-sign"></i></div>
      <div class="stat-label">Saldo USD</div>
      <div class="stat-value" style="font-size:16px;color:var(--teal)">
        ${movs.filter(m=>m.moneda==='USD').length ? 'USD ' + parseFloat(saldoTotalUSD||0).toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2}) : '<span style=\"color:var(--ink4);font-size:13px\">Sin datos</span>'}
      </div>
      <div class="stat-sub">${CUENTAS_BANCO.filter(cu=>cu.moneda==='USD').length} cuenta</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:var(--green-lt);color:var(--green)"><i class="fa fa-arrow-down"></i></div>
      <div class="stat-label">Ingresos 30d</div>
      <div class="stat-value" style="font-size:16px;color:var(--green)">${pesos(ingresos30)}</div>
      <div class="stat-sub">${movs30.filter(m=>parseFloat(m.credito)>0).length} acreditaciones</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:var(--amber-lt);color:var(--amber)"><i class="fa fa-clock"></i></div>
      <div class="stat-label">Por cobrar</div>
      <div class="stat-value" style="font-size:16px;color:var(--amber)">${pesos(porCobrar)}</div>
      <div class="stat-sub">Cobros pendientes</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:${proyeccion>=0?'var(--teal-lt)':'var(--red-lt)'};color:${proyeccion>=0?'var(--teal)':'var(--red)'}"><i class="fa fa-chart-line"></i></div>
      <div class="stat-label">Proyección</div>
      <div class="stat-value" style="font-size:16px;color:${proyeccion>=0?'var(--teal)':'var(--red)'}">
        ${movs.length || porCobrar ? pesos(proyeccion) : '<span style=\"color:var(--ink4);font-size:13px\">Sin datos</span>'}
      </div>
      <div class="stat-sub">Saldo + por cobrar</div>
    </div>
  </div>

  <!-- SECCIÓN 3: ANÁLISIS ÚLTIMOS 30 DÍAS -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:18px">
    <div style="padding:20px;background:var(--green-lt);border-radius:var(--r-lg);border:1px solid var(--green)">
      <div style="font-size:11px;color:var(--green);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:6px">💚 Ingresos últimos 60 días</div>
      <div style="font-size:22px;font-weight:800;color:var(--green)">${pesos(ingresos30)}</div>
      <div style="font-size:11px;color:var(--green);opacity:.7;margin-top:4px">${movs30.filter(m=>parseFloat(m.credito)>0).length} acreditaciones</div>
    </div>
    <div style="padding:20px;background:var(--red-lt);border-radius:var(--r-lg);border:1px solid var(--red)">
      <div style="font-size:11px;color:var(--red);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:6px">💔 Egresos últimos 60 días</div>
      <div style="font-size:22px;font-weight:800;color:var(--red)">${pesos(egresos30)}</div>
      <div style="font-size:11px;color:var(--red);opacity:.7;margin-top:4px">${movs30.filter(m=>parseFloat(m.debito)>0).length} débitos</div>
    </div>
    <div style="padding:20px;background:${flujo30>=0?'var(--green-lt)':'var(--amber-lt)'};border-radius:var(--r-lg);border:1px solid ${flujo30>=0?'var(--green)':'var(--amber)'}">
      <div style="font-size:11px;color:${flujo30>=0?'var(--green)':'var(--amber)'};text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:6px">📊 Flujo neto 60 días</div>
      <div style="font-size:22px;font-weight:800;color:${flujo30>=0?'var(--green)':'var(--amber)'}">${flujo30>=0?'+':''}${pesos(flujo30)}</div>
      <div style="font-size:11px;color:${flujo30>=0?'var(--green)':'var(--amber)'};opacity:.7;margin-top:4px">${flujo30>=0?'Flujo positivo ✓':'Flujo negativo ⚠'}</div>
    </div>
  </div>

  <!-- SECCIÓN 5: GASTOS BANCARIOS -->
  <div style="border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;margin-bottom:18px">
    <div onclick="toggleFinSec('fin-gastos')"
      style="display:flex;justify-content:space-between;align-items:center;padding:14px 18px;background:var(--surface2);cursor:pointer;user-select:none">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:32px;height:32px;border-radius:50%;background:var(--red-lt);color:var(--red);display:flex;align-items:center;justify-content:center;font-size:14px">
          <i class="fa fa-credit-card"></i>
        </div>
        <div>
          <div style="font-size:13px;font-weight:700">Gastos bancarios por categoría</div>
          <div style="font-size:11px;color:var(--ink3);margin-top:1px">Débitos agrupados según tipo de egreso</div>
        </div>
      </div>
      <i class="fa fa-chevron-down" id="fin-gastos-ico" style="color:var(--ink4);font-size:11px;transition:.25s;transform:rotate(0deg)"></i>
    </div>
    <div id="fin-gastos" style="display:none;border-top:1px solid var(--border)">
      ${renderGastosBancarios(DB.movBancarios || [])}
    </div>
  </div>

  <!-- SECCIÓN 4: COBROS Y CHEQUES -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px">
    <!-- Cobros pendientes -->
    <div style="border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden">
      <div style="padding:12px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--ink2)">Cobros pendientes</div>
        <span class="badge b-amber">${DB.cobros ? DB.cobros.length : 0}</span>
      </div>
      <table style="width:100%">
        <thead><tr style="background:var(--surface2)">
          <th style="padding:8px 14px;font-size:10px;color:var(--ink3);font-weight:700;text-align:left;border-bottom:1px solid var(--border)">Concepto</th>
          <th style="padding:8px 14px;font-size:10px;color:var(--ink3);font-weight:700;text-align:left;border-bottom:1px solid var(--border)">Fecha</th>
          <th style="padding:8px 14px;font-size:10px;color:var(--ink3);font-weight:700;text-align:right;border-bottom:1px solid var(--border)">Monto</th>
        </tr></thead>
        <tbody>
        ${(DB.cobros||[]).slice(-8).reverse().map(co => {
          const pp = DB.presupuestos.find(p => p.id === co.pptoId);
          return `<tr style="cursor:default">
            <td style="padding:9px 14px;font-size:12px;border-bottom:1px solid var(--border)">
              <div style="font-weight:600">${co.concepto}</div>
              <div style="font-size:10px;color:var(--ink3)">${pp?.numero||'—'} · ${pp?.cliente||''}</div>
            </td>
            <td style="padding:9px 14px;font-size:11px;color:var(--ink3);border-bottom:1px solid var(--border)">${co.fecha||'—'}</td>
            <td style="padding:9px 14px;font-size:13px;font-weight:700;color:var(--green);text-align:right;border-bottom:1px solid var(--border)">${pesos(co.monto)}</td>
          </tr>`;
        }).join('') || '<tr><td colspan="3" style="padding:20px;text-align:center;color:var(--ink4)">Sin cobros registrados</td></tr>'}
        </tbody>
      </table>
    </div>

    <!-- Cheques -->
    <div style="border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden">
      <div style="padding:12px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--ink2)">Cheques</div>
        <div style="display:flex;gap:6px">
          <span class="badge b-red">${(DB.cheques||[]).filter(c=>c.tipo==='emitido').length} emitidos</span>
          <span class="badge b-green">${(DB.cheques||[]).filter(c=>c.tipo==='recibido').length} recibidos</span>
        </div>
      </div>
      ${(DB.cheques||[]).length ? `<table style="width:100%">
        <thead><tr style="background:var(--surface2)">
          <th style="padding:8px 14px;font-size:10px;color:var(--ink3);font-weight:700;text-align:left;border-bottom:1px solid var(--border)">Banco / Titular</th>
          <th style="padding:8px 14px;font-size:10px;color:var(--ink3);font-weight:700;text-align:left;border-bottom:1px solid var(--border)">Cobro</th>
          <th style="padding:8px 14px;font-size:10px;color:var(--ink3);font-weight:700;text-align:right;border-bottom:1px solid var(--border)">Monto</th>
        </tr></thead>
        <tbody>
        ${(DB.cheques||[]).slice(-8).reverse().map(ch => {
          const bTipo = ch.tipo === 'emitido'
            ? '<span class="badge b-red">Emitido</span>'
            : '<span class="badge b-green">Recibido</span>';
          const bEst = {
            pendiente: '<span class="badge b-amber">Pendiente</span>',
            cobrado: '<span class="badge b-green">Cobrado</span>',
            depositado: '<span class="badge b-green">Depositado</span>',
            rechazado: '<span class="badge b-red">Rechazado</span>',
          }[ch.estado] || '<span class="badge b-gray">' + ch.estado + '</span>';
          return `<tr>
            <td style="padding:9px 14px;font-size:12px;border-bottom:1px solid var(--border)">
              <div style="font-weight:600">${ch.banco}</div>
              <div style="font-size:10px;color:var(--ink3)">${ch.titular||''} · N°${ch.numero}</div>
            </td>
            <td style="padding:9px 14px;font-size:11px;color:var(--ink3);border-bottom:1px solid var(--border)">
              <div>${ch.fecha_cobro||'—'}</div>
              <div style="margin-top:2px">${bEst}</div>
            </td>
            <td style="padding:9px 14px;text-align:right;border-bottom:1px solid var(--border)">
              <div style="font-size:13px;font-weight:700;color:${ch.tipo==='recibido'?'var(--green)':'var(--red)'}">${pesos(ch.monto)}</div>
              <div style="margin-top:3px">${bTipo}</div>
            </td>
          </tr>`;
        }).join('')}
        </tbody>
      </table>` : `<div class="empty"><i class="fa fa-file-alt"></i><p>Sin cheques registrados</p><button class="btn btn-primary btn-sm" onclick="abrirCheque(null)"><i class="fa fa-plus"></i> Nuevo cheque</button></div>`}
    </div>
  </div>`);
}

function renderGastosBancarios(movs) {
  const debitos = movs.filter(m => parseFloat(m.debito) > 0);
  if (!debitos.length) return `<div class="empty"><i class="fa fa-credit-card"></i><p>Sin gastos bancarios registrados. Importá movimientos para ver el análisis.</p></div>`;

  // Clasificar por categoría basándose en concepto
  const PALABRAS_CLAVE = {
    sueldos:    ['sueldo','haberes','salario','remuner'],
    impuestos:  ['afip','arba','iibb','iva','impuesto','monotributo','autónomo'],
    bancario:   ['comisión','mantenimiento','extracto','impuesto debito','iva debito','tarjeta'],
    servicios:  ['edesur','edenor','metrogas','aysa','telecom','claro','movistar','internet','luz','gas','agua'],
    marketing:  ['meta ','facebook','google ads','publicidad','marketing'],
    oficina:    ['alquiler','expensas','mercaderia','papelería','insumo'],
    operacion:  ['transferencia','pago','débito','compra'],
    otros:      [],
  };

  const categorizado = {};
  Object.keys(PALABRAS_CLAVE).forEach(cat => { categorizado[cat] = []; });

  debitos.forEach(m => {
    const texto = (m.concepto || '').toLowerCase();
    let asignado = false;
    for (const [cat, palabras] of Object.entries(PALABRAS_CLAVE)) {
      if (cat === 'otros' || !palabras.length) continue;
      if (palabras.some(p => texto.includes(p))) {
        categorizado[cat].push(m);
        asignado = true;
        break;
      }
    }
    if (!asignado) categorizado.otros.push(m);
  });

  let totalGeneral = 0;
  let html = '<table style="width:100%"><tbody>';

  Object.entries(categorizado).forEach(([cat, items]) => {
    if (!items.length) return;
    const subtotal = items.reduce((s, m) => s + (parseFloat(m.debito) || 0), 0);
    totalGeneral += subtotal;
    const icon = CAT_BANCO_ICONS[cat] || '📌';
    const catLabel = { sueldos:'Sueldos y haberes', impuestos:'Impuestos y cargas', bancario:'Gastos bancarios', servicios:'Servicios', marketing:'Marketing', oficina:'Oficina y alquiler', operacion:'Operaciones', otros:'Otros' }[cat] || cat;

    html += `<tr style="background:var(--surface2)">
      <td colspan="4" style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--ink2)">
        ${icon} ${catLabel}
      </td>
      <td style="padding:10px 16px;text-align:right;font-size:12px;font-weight:700;color:var(--red)">${pesos(subtotal)}</td>
    </tr>`;

    items.slice(0, 5).forEach(m => {
      html += `<tr style="border-bottom:1px solid var(--border)">
        <td style="padding:8px 16px 8px 28px;font-size:11px;color:var(--ink3)">${m.fecha}</td>
        <td style="padding:8px 16px;font-size:12px" colspan="3">${m.concepto}</td>
        <td style="padding:8px 16px;text-align:right;font-size:12px;font-weight:600;color:var(--red)">${pesos(m.debito)}</td>
      </tr>`;
    });

    if (items.length > 5) {
      html += `<tr><td colspan="5" style="padding:6px 28px;font-size:11px;color:var(--ink4)">+ ${items.length - 5} movimiento(s) más en esta categoría</td></tr>`;
    }
  });

  html += `<tr style="background:var(--accent-lt)">
    <td colspan="4" style="padding:14px 16px;font-size:14px;font-weight:800;color:var(--accent)">Total egresos clasificados</td>
    <td style="padding:14px 16px;text-align:right;font-size:18px;font-weight:800;color:var(--red)">${pesos(totalGeneral)}</td>
  </tr>`;

  return html + '</tbody></table>';
}


function renderTabsCuentas(movs) {
  const grupos = [
    { label: '📊 Todas', id: 'todas', cuentas: [] },
    { label: '🏢 MORADESIGN', id: 'mora', titular: 'MORADESIGN S.R.L', color: 'var(--accent)' },
    { label: '👤 CECILIA', id: 'cec', titular: 'CECILIA MORALES', color: 'var(--purple)' },
  ];
  let html = '';
  grupos.forEach(g => {
    const isActive = tabCuentaActiva === g.id;
    if (g.id === 'todas') {
      html += `<div onclick="cambiarTabCuenta('todas')" style="padding:12px 16px;font-size:11px;font-weight:${isActive?700:400};color:${isActive?'var(--accent)':'var(--ink3)'};cursor:pointer;border-bottom:3px solid ${isActive?'var(--accent)':'transparent'};white-space:nowrap;transition:.15s">
        ${g.label} <span style="font-size:10px;color:var(--ink4)">(${movs.length})</span>
      </div>
      <div style="width:1px;background:var(--border);margin:8px 0"></div>`;
    } else {
      const cuentasGrupo = CUENTAS_BANCO.filter(c => c.titular === g.titular);
      html += `<div style="display:flex;flex-direction:column;padding:0">
        <div style="padding:6px 16px 2px;font-size:9px;font-weight:700;color:${g.color};text-transform:uppercase;letter-spacing:.8px">${g.label}</div>
        <div style="display:flex">
          ${cuentasGrupo.map(c => {
            const isTabActive = tabCuentaActiva === c.id;
            const cnt = movs.filter(m => m.numero_cuenta === c.id).length;
            return `<div onclick="cambiarTabCuenta('${c.id}')" style="padding:4px 14px 10px;font-size:12px;font-weight:${isTabActive?700:500};color:${isTabActive?g.color:'var(--ink1)'};cursor:pointer;border-bottom:3px solid ${isTabActive?g.color:'transparent'};white-space:nowrap;transition:.15s">
              ${c.label} <span style="color:var(--ink2);font-weight:400">${c.moneda}</span>
              <div style="font-size:11px;color:var(--ink2);margin-top:2px;letter-spacing:.2px">${c.id}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div style="width:1px;background:var(--border);margin:8px 0"></div>`;
    }
  });
  return html;
}

function renderTablaMovimientos(movs, tab) {
  const filtrados = tab === 'todas' ? movs : movs.filter(m => m.numero_cuenta === tab);
  if (!filtrados.length) return `<div class="empty"><i class="fa fa-university"></i><p>Sin movimientos${tab !== 'todas' ? ' en esta cuenta' : ''}. Importá un extracto bancario.</p></div>`;
  const ordenados = [...filtrados].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 100);
  return `<div class="tbl-wrap" style="border:none;border-radius:0"><table>
    <thead><tr>
      <th>Fecha</th><th>Concepto</th><th style="text-align:right">Débito</th><th style="text-align:right">Crédito</th><th style="text-align:right">Saldo</th><th>Cuenta</th>
    </tr></thead>
    <tbody>${ordenados.map(m => {
      const deb = parseFloat(m.debito) || 0;
      const cre = parseFloat(m.credito) || 0;
      const sal = parseFloat(m.saldo) || 0;
      const cuenta = CUENTAS_BANCO.find(c => c.id === m.numero_cuenta);
      const esDolar = cuenta?.moneda === 'USD';
      const fmt = v => esDolar ? `USD ${v.toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2})}` : pesos(v);
      return `<tr>
        <td style="font-size:11px;color:var(--ink3);white-space:nowrap">${m.fecha}</td>
        <td style="font-size:12px;max-width:300px">${m.concepto}</td>
        <td style="text-align:right;font-weight:${deb>0?600:400};color:${deb>0?'var(--red)':'var(--ink4)'}">${deb>0?fmt(deb):'—'}</td>
        <td style="text-align:right;font-weight:${cre>0?600:400};color:${cre>0?'var(--green)':'var(--ink4)'}">${cre>0?fmt(cre):'—'}</td>
        <td style="text-align:right;font-size:12px;font-weight:600">${fmt(sal)}</td>
        <td><span class="badge ${esDolar?'b-teal':'b-blue'}" style="font-size:9px">${cuenta?.label||m.numero_cuenta}</span></td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

function cambiarTabCuenta(id) {
  tabCuentaActiva = id;
  const movs = DB.movBancarios || [];
  document.getElementById('fin-movs-tabla').innerHTML = renderTablaMovimientos(movs, id);
  // Actualizar estilos de tabs
  financiero();
}

function toggleFinSec(id) {
  const el = document.getElementById(id);
  const ico = document.getElementById(id + '-ico');
  if (!el) return;
  const open = el.style.display !== 'none';
  el.style.display = open ? 'none' : 'block';
  if (ico) ico.style.transform = open ? 'rotate(0deg)' : 'rotate(180deg)';
}

function abrirModalPegarExtracto() {
  abrir('m-extracto');
}

// ═══════════════════════════════════════════════════════════
// IMPORTACIÓN DE EXTRACTOS — PDF + TEXTO
// ═══════════════════════════════════════════════════════════

// Estado temporal del parseo PDF
let _pdfMovsParsed = [];
let _modoExtracto  = 'pdf'; // 'pdf' | 'txt'

function extTab(modo) {
  _modoExtracto = modo;
  document.getElementById('ext-panel-pdf').style.display = modo === 'pdf' ? '' : 'none';
  document.getElementById('ext-panel-txt').style.display = modo === 'txt' ? '' : 'none';
  document.getElementById('ext-tab-pdf').style.background = modo === 'pdf' ? 'var(--accent)' : 'var(--surface)';
  document.getElementById('ext-tab-pdf').style.color      = modo === 'pdf' ? '#fff' : 'var(--ink2)';
  document.getElementById('ext-tab-txt').style.background = modo === 'txt' ? 'var(--accent)' : 'var(--surface)';
  document.getElementById('ext-tab-txt').style.color      = modo === 'txt' ? '#fff' : 'var(--ink2)';
}

// ── Parser PDF (pdf.js) ──────────────────────────────────
const _COL_REF   = 255;
const _COL_DEB   = 320;
const _COL_CRED  = 410;
const _COL_SALDO = 490;  // saldo real en x≈494.97, umbral bajado para capturarlo

function _parseNumArg(s) {
  if (!s) return null;
  const c = s.trim().replace(/\./g, '').replace(',', '.');
  const n = parseFloat(c);
  return isNaN(n) ? null : n;
}

function _esNumeroArg(s) {
  return /^-?\d{1,3}(\.\d{3})*,\d{2}$/.test(s.trim());
}

function _clasificarX(x) {
  if (x >= _COL_SALDO) return 'saldo';
  if (x >= _COL_CRED)  return 'credito';
  if (x >= _COL_DEB)   return 'debito';
  if (x >= _COL_REF)   return 'referencia';
  return 'desc';
}

function _agruparLineas(items, tol = 3) {
  const lines = {};
  for (const item of items) {
    const y = Math.round(item.transform[5] / tol) * tol;
    if (!lines[y]) lines[y] = [];
    lines[y].push(item);
  }
  for (const y of Object.keys(lines))
    lines[y].sort((a, b) => a.transform[4] - b.transform[4]);
  return lines;
}

// Normalizar número de cuenta: "4-200-0940324325-6" → "0940324325-6"
function _normalizarCuenta(raw) {
  if (!raw) return raw;
  // Banco Macro: X-YYY-NNNNNNNNN-D → queda NNNNNNNNN-D
  const m = raw.match(/(\d{10}-\d)$/);
  return m ? m[1] : raw.replace(/^\d+-\d+-/, '');
}

async function importarPDFExtracto(file) {
  if (!file || file.type !== 'application/pdf') {
    alert('Seleccioná un archivo PDF válido'); return;
  }
  if (!window.pdfjsLib) {
    alert('Error: pdf.js no está cargado. Verificá la conexión a internet.'); return;
  }

  const status  = document.getElementById('ext-pdf-status');
  const preview = document.getElementById('ext-pdf-preview');
  const msg     = document.getElementById('ext-pdf-msg');
  status.style.display  = 'block';
  preview.style.display = 'none';
  msg.textContent       = 'Leyendo PDF...';

  try {
    const buffer  = await file.arrayBuffer();
    const pdf     = await pdfjsLib.getDocument({ data: buffer }).promise;
    const movs    = [];
    const cuentas = {};
    let cuentaActual = null;

    for (let p = 1; p <= pdf.numPages; p++) {
      msg.textContent = `Procesando página ${p} de ${pdf.numPages}...`;
      const page    = await pdf.getPage(p);
      const content = await page.getTextContent();
      const items   = content.items;
      const texto   = items.map(i => i.str).join(' ');

      // Detectar número de cuenta activa en la página
      const mCA = texto.match(/CAJA DE AHORRO EN PESOS NRO\.:\s*([\d\-]+)/);
      if (mCA) {
        const norm = _normalizarCuenta(mCA[1].trim());
        cuentaActual = norm;
        if (!cuentas[norm]) cuentas[norm] = { tipo: 'CA_PESOS', moneda: 'ARS' };
      }
      const mCC = texto.match(/CUENTA CORRIENTE EN PESOS NRO\.:\s*([\d\-]+)/);
      if (mCC) {
        const norm = _normalizarCuenta(mCC[1].trim());
        cuentaActual = norm;
        if (!cuentas[norm]) cuentas[norm] = { tipo: 'CC_PESOS', moneda: 'ARS' };
      }

      const lines = _agruparLineas(items);
      const ys    = Object.keys(lines).sort((a, b) => b - a); // mayor Y primero = arriba a abajo (pdf.js: Y=0 abajo, primer mov tiene mayor Y)

      for (const y of ys) {
        const palabras = lines[y];
        const primera  = palabras[0].str.trim();
        if (!/^\d{2}\/\d{2}\/\d{2}$/.test(primera)) continue;

        const [d, mo, yy] = primera.split('/');
        const fechaDDMMYYYY = `${d}/${mo}/20${yy}`;

        const descP = [], refP = [];
        let debito = null, credito = null, saldo = null;

        for (const w of palabras.slice(1)) {
          const x   = w.transform[4];
          const txt = w.str.trim();
          if (!txt) continue;
          const zona = _clasificarX(x);
          if (zona === 'desc') {
            descP.push(txt);
          } else if (zona === 'referencia') {
            if (_esNumeroArg(txt) && x >= _COL_DEB) debito = _parseNumArg(txt);
            else refP.push(txt);
          } else if (zona === 'debito') {
            if (_esNumeroArg(txt)) debito  = _parseNumArg(txt);
            else refP.push(txt);
          } else if (zona === 'credito') {
            if (_esNumeroArg(txt)) credito = _parseNumArg(txt);
          } else if (zona === 'saldo') {
            const n = _parseNumArg(txt);
            if (n !== null) saldo = n;
          }
        }

        const concepto = descP.join(' ').trim();
        if (!concepto) continue;

        // Buscar la cuenta en CUENTAS_BANCO por id normalizado
        const cuentaInfo = CUENTAS_BANCO.find(c => c.id === cuentaActual);

        movs.push({
          id:                uid(),
          fecha:             fechaDDMMYYYY,
          concepto,
          referencia:        refP.join(' ').trim() || null,
          debito:            debito || 0,
          credito:           credito || 0,
          saldo:             saldo !== null ? saldo : 0,
          tipo_cuenta:       cuentaInfo?.tipo  || 'CC_PESOS',
          moneda:            cuentaInfo?.moneda || 'ARS',
          numero_cuenta:     cuentaActual,
          fecha_importacion: ahora(),
          origen:            'pdf',
        });
      }
    }

    _pdfMovsParsed = movs;

    // Mostrar preview
    msg.textContent = 'Listo';
    const resumen = document.getElementById('ext-pdf-resumen');
    const tbody   = document.getElementById('ext-pdf-tbody');
    resumen.textContent = `${movs.length} movimientos detectados en ${Object.keys(cuentas).length} cuenta(s)`;
    tbody.innerHTML = movs.slice(0, 50).map(m => `
      <tr style="border-bottom:1px solid var(--border)">
        <td style="padding:5px 8px;white-space:nowrap">${m.fecha}</td>
        <td style="padding:5px 8px;color:var(--ink2)">${m.concepto.substring(0,40)}</td>
        <td style="padding:5px 8px;text-align:right;color:var(--red)">${m.debito  ? '$' + m.debito.toLocaleString('es-AR')  : '—'}</td>
        <td style="padding:5px 8px;text-align:right;color:var(--green)">${m.credito ? '$' + m.credito.toLocaleString('es-AR') : '—'}</td>
        <td style="padding:5px 8px;text-align:right;font-weight:600;color:${m.saldo < 0 ? 'var(--red)' : 'var(--ink1)'}">${'$' + m.saldo.toLocaleString('es-AR')}</td>
      </tr>`).join('') + (movs.length > 50 ? `<tr><td colspan="5" style="padding:8px;text-align:center;color:var(--ink4);font-size:11px">... y ${movs.length - 50} más</td></tr>` : '');
    status.style.display  = 'none';
    preview.style.display = 'block';

  } catch (err) {
    msg.textContent = 'Error al procesar el PDF: ' + err.message;
    console.error(err);
  }
}

// ── Confirmar importación (botón principal) ──────────────
function confirmarImportarExtracto() {
  if (_modoExtracto === 'pdf') {
    _guardarMovimientosImportados(_pdfMovsParsed);
  } else {
    procesarExtractoPegado();
  }
}

function _guardarMovimientosImportados(candidatos) {
  if (!candidatos.length) { alert('No hay movimientos para importar. Subí un PDF primero.'); return; }

  const existentes = DB.movBancarios || [];
  let duplicados = 0;
  const nuevos = candidatos.filter(nuevoMov => {
    const existe = existentes.some(e =>
      e.fecha    === nuevoMov.fecha &&
      e.concepto === nuevoMov.concepto &&
      e.saldo    === nuevoMov.saldo
    );
    if (existe) { duplicados++; return false; }
    return true;
  });

  if (!nuevos.length) {
    alert(`⚠️ Los ${candidatos.length} movimientos ya existen (${duplicados} duplicados omitidos).`);
    return;
  }

  movBackup = [...existentes];
  DB.movBancarios = [...existentes, ...nuevos];
  guardar();
  _pdfMovsParsed = [];
  cerrar('m-extracto');
  // Reset dropzone
  const drop = document.getElementById('ext-pdf-drop');
  if (drop) drop.style.borderColor = 'var(--border)';
  const preview = document.getElementById('ext-pdf-preview');
  if (preview) preview.style.display = 'none';
  const fileInput = document.getElementById('ext-pdf-file');
  if (fileInput) fileInput.value = '';

  alert(`✅ Importados ${nuevos.length} movimiento(s) bancario(s).${duplicados ? `\n⚠ ${duplicados} duplicado(s) omitido(s).` : ''}`);
  financiero();
}

// ── Importación por texto (mantiene compatibilidad) ──────
function procesarExtractoPegado() {
  const texto = document.getElementById('extracto-texto').value.trim();
  const cuentaId = document.getElementById('extracto-cuenta').value;
  if (!texto || !cuentaId) { alert('Seleccioná una cuenta y pegá el texto del extracto'); return; }

  const cuenta = CUENTAS_BANCO.find(c => c.id === cuentaId);
  const candidatos = parsearTextoExtracto(texto, cuenta);

  if (!candidatos.length) {
    alert('No se encontraron movimientos válidos.\nVerificá el formato: DD/MM/YYYY  CONCEPTO  DEBITO  CREDITO  SALDO');
    return;
  }
  _guardarMovimientosImportados(candidatos);
}

function parsearTextoExtracto(texto, cuenta) {
  const lineas = texto.split('\n').filter(l => l.trim());
  const movs = [];
  // Regex exacto del extracto Banco Macro: DD/MM/YYYY  CONCEPTO  DEBITO  CREDITO  SALDO
  const RE = /^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)$/;

  const parseMonto = s => parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;

  lineas.forEach((linea, i) => {
    const m = linea.trim().match(RE);
    if (!m) return;

    const fecha = m[1]; // Mantener DD/MM/YYYY como en el original
    const concepto = m[2].trim();
    const debito  = parseMonto(m[3]);
    const credito = parseMonto(m[4]);
    const saldo   = parseMonto(m[5]);

    movs.push({
      id: Date.now() + i,
      fecha,
      concepto,
      debito,
      credito,
      saldo,
      tipo_cuenta: cuenta.tipo,
      moneda: cuenta.moneda,
      numero_cuenta: cuenta.id,
      fecha_importacion: ahora()
    });
  });
  return movs;
}

function importarArchivoBancario(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const texto = e.target.result;
    document.getElementById('extracto-texto').value = texto;
    abrir('m-extracto');
  };
  reader.readAsText(file, 'UTF-8');
  input.value = '';
}

function deshacerImportacion() {
  if (movBackup === null) { alert('No hay importación para deshacer.'); return; }
  if (!confirm('¿Deshacer la última importación?')) return;
  DB.movBancarios = [...movBackup];
  movBackup = null;
  guardar();
  alert('✅ Importación deshecha correctamente.');
  financiero();
}

function limpiarMovimientos() {
  if (!confirm('¿Eliminar TODOS los movimientos bancarios? Podrás deshacer esta acción.')) return;
  movBackup = [...(DB.movBancarios || [])];
  DB.movBancarios = [];
  guardar();
  alert('✅ Movimientos eliminados. Usá "Deshacer" para recuperarlos.');
  financiero();
}

// ── Cheques CRUD ──
editChequeId = null;
function abrirCheque(id) {
  editChequeId = id;
  const ch = id ? (DB.cheques||[]).find(x => x.id === id) : null;
  document.getElementById('m-cheque-title').textContent = ch ? 'Editar cheque' : 'Nuevo cheque';
  document.getElementById('ch-numero').value = ch?.numero || '';
  document.getElementById('ch-tipo').value = ch?.tipo || 'recibido';
  document.getElementById('ch-banco').value = ch?.banco || '';
  document.getElementById('ch-titular').value = ch?.titular || '';
  document.getElementById('ch-monto').value = ch?.monto || '';
  document.getElementById('ch-emision').value = ch?.fecha_emision || fiDate();
  document.getElementById('ch-cobro').value = ch?.fecha_cobro || '';
  document.getElementById('ch-estado').value = ch?.estado || 'pendiente';
  document.getElementById('ch-beneficiario').value = ch?.beneficiario || '';
  document.getElementById('ch-notas').value = ch?.notas || '';
  document.getElementById('ch-delete-btn').style.display = ch ? 'inline-flex' : 'none';
  abrir('m-cheque');
}

function guardarCheque() {
  const numero = v('ch-numero');
  if (!numero) { alert('El número de cheque es obligatorio'); return; }
  const data = {
    numero, tipo: document.getElementById('ch-tipo').value,
    banco: v('ch-banco'), titular: v('ch-titular'),
    monto: parseFloat(v('ch-monto')) || 0,
    fecha_emision: v('ch-emision'), fecha_cobro: v('ch-cobro'),
    estado: document.getElementById('ch-estado').value,
    beneficiario: v('ch-beneficiario'), notas: v('ch-notas')
  };
  if (!DB.cheques) DB.cheques = [];
  if (editChequeId) {
    const i = DB.cheques.findIndex(x => x.id === editChequeId);
    if (i >= 0) DB.cheques[i] = { ...DB.cheques[i], ...data };
  } else {
    DB.cheques.push({ ...data, id: nid(), creadoEn: hoy() });
  }
  guardar();
  cerrar('m-cheque');
  financiero();
}

function eliminarCheque() {
  if (!confirm('¿Eliminar este cheque?')) return;
  DB.cheques = (DB.cheques||[]).filter(x => x.id !== editChequeId);
  guardar();
  cerrar('m-cheque');
  financiero();
}

// ═══════════════════════════════════════════════
// USUARIOS (ADMIN)
// ═══════════════════════════════════════════════
function usuarios() {
  titulo('Gestión de usuarios');
  if (!CURRENT_USER || !CURRENT_USER.modulos.includes('usuarios')) {