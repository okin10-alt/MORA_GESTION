// FORMA — módulo: dashboard

// ═══════════════════════════════════════════════
// VARIABLES GLOBALES DEL MÓDULO
// ═══════════════════════════════════════════════
let editLeadId = null, editProjId = null, editDisId = null, editPptoId = null;
let tlLeadId = null, cpPptoId = null;
let archivosTemp = [], pptoItems = [];
let editUsrId = null, editGastoId = null, editChequeId = null;

// ═══════════════════════════════════════════════
// NAVEGACIÓN Y RENDERIZADO
// ═══════════════════════════════════════════════

// Sobrescribir función go() desde navigation.js
window.go = function(m) {
  modulo = m;
  
  // Actualizar nav activo
  document.querySelectorAll('.sb-item').forEach(item => item.classList.remove('active'));
  const navItem = document.getElementById('nav-' + m);
  if (navItem) navItem.classList.add('active');
  
  // Limpiar búsqueda
  searchQ = '';
  const searchInput = document.getElementById('search-q');
  if (searchInput) searchInput.value = '';
  
  // Renderizar módulo correspondiente
  switch(m) {
    case 'dashboard': dashboard(); break;
    case 'leads': leads(); break;
    case 'ventas': ventas(); break;
      case 'agente': agenteVentas(); break;
    case 'gestion': gestion(); break;
    case 'diseno': diseno(); break;
    case 'presupuestos': presupuestos(); break;
    case 'contable': contable(); break;
    case 'financiero': financiero(); break;
    case 'usuarios': usuarios(); break;
    default: c('<div class="empty"><i class="fa fa-info-circle"></i><p>Módulo no implementado</p></div>');
  }
};

// Sobrescribir renderModulo desde navigation.js
window.renderModulo = go;

// ═══════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════
function dashboard() {
  titulo('Dashboard');
  actions('');

  // ── STATS FILA 1: MÉTRICAS PRINCIPALES ──
  const lA = DB.leads.length;
  const pA = DB.proyectos.filter(p => !['cancelado','aprobado'].includes(p.status)).length;
  const pptoEnv = DB.presupuestos.filter(p => p.status === 'enviado').length;

  // Saldo bancario: último movimiento
  const saldoBancario = DB.movBancarios && DB.movBancarios.length > 0
    ? (DB.movBancarios[DB.movBancarios.length - 1].saldo || 0)
    : 0;

  // Por cobrar: cobros pendientes
  const cobrosPendientes = (DB.cobros||[]).filter(c => (c.estado||'').toLowerCase() === 'pendiente');
  const totalPendiente = cobrosPendientes.reduce((s, c) => s + (parseFloat(c.monto)||0), 0);

  // ── STATS FILA 2: FLUJO MENSUAL ──
  const hoyD = new Date();
  const mesActual = hoyD.getMonth();
  const anioActual = hoyD.getFullYear();

  const movsMes = (DB.movBancarios||[]).filter(m => {
    // Parsear DD/MM/YYYY
    const partes = (m.fecha||'').split('/');
    if (partes.length < 3) return false;
    const d = new Date(partes[2], partes[1] - 1, partes[0]);
    return d.getMonth() === mesActual && d.getFullYear() === anioActual;
  });
  const creditosMes = movsMes.reduce((s, m) => s + (parseFloat(m.credito)||0), 0);
  const debitosMes  = movsMes.reduce((s, m) => s + (parseFloat(m.debito)||0), 0);
  const flujoNeto   = creditosMes - debitosMes;

  const gastosMes = (DB.gastos||[]).filter(g => {
    const d = new Date(g.fecha||'');
    return d.getMonth() === mesActual && d.getFullYear() === anioActual;
  });
  const totalGastosMes = gastosMes.reduce((s, g) => s + (parseFloat(g.monto)||0), 0);

  const cobrosCobrados = (DB.cobros||[]).filter(c => (c.estado||'').toLowerCase() === 'cobrado');
  const totalCobrado = cobrosCobrados.reduce((s, c) => s + (parseFloat(c.monto)||0), 0);

  // Por pagar: pagos con estado pendiente
  const pagosPendientes = (DB.pagos||[]).filter(p => (p.estado||'').toLowerCase() === 'pendiente');
  const totalPorPagar   = pagosPendientes.reduce((s, p) => s + (parseFloat(p.monto)||0), 0);

  // ── ALERTAS INTELIGENTES ──
  const alertas = [];
  if (saldoBancario < 0) {
    alertas.push({ tipo: 'red', msg: `⚠️ Cuenta en descubierto: ${pesos(saldoBancario)}` });
  }
  if (flujoNeto < 0 && (DB.movBancarios||[]).length > 0) {
    alertas.push({ tipo: 'amber', msg: `📊 Flujo negativo este mes: ${pesos(flujoNeto)}` });
  }
  if (totalPendiente > 0 && (saldoBancario === 0 || totalPendiente > saldoBancario * 0.5)) {
    alertas.push({ tipo: 'blue', msg: `💰 Tenés ${pesos(totalPendiente)} por cobrar` });
  }
  // Alertas adicionales: presupuestos sin respuesta y cobros vencidos
  DB.presupuestos.filter(p => p.status === 'enviado').forEach(p => {
    const d = new Date(p.fechaISO || p.fecha || '');
    const dias = Math.floor((hoyD - d) / 86400000);
    if (dias > 15) alertas.push({ tipo: 'amber', msg: `Ppto ${p.numero} enviado hace ${dias} días sin respuesta — ${p.cliente}` });
  });
  (DB.cobros||[]).filter(c => c.vence && new Date(c.vence) < hoyD && (c.estado||'') !== 'cobrado')
    .forEach(c => alertas.push({ tipo: 'red', msg: `Cobro vencido: ${pesos(c.monto)} — ${c.concepto||''}` }));

  // ── RENDER ──
  const saldoColor = saldoBancario >= 0 ? 'var(--green)' : 'var(--red)';
  const saldoBg    = saldoBancario >= 0 ? 'var(--green-lt)' : 'var(--red-lt)';
  const flujoColor = flujoNeto >= 0 ? 'var(--teal)' : 'var(--red)';
  const flujoBg    = flujoNeto >= 0 ? 'var(--teal-lt)' : 'var(--red-lt)';

  c(`
  <!-- FILA 1: Stats principales -->
  <div class="stats-row" style="margin-bottom:14px">
    <div class="stat-card">
      <div class="stat-icon" style="background:var(--accent-lt);color:var(--accent)"><i class="fa fa-funnel-dollar"></i></div>
      <div class="stat-label">Contactos activos</div>
      <div class="stat-value">${lA}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:var(--teal-lt);color:var(--teal)"><i class="fa fa-project-diagram"></i></div>
      <div class="stat-label">Proyectos activos</div>
      <div class="stat-value">${pA}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:var(--amber-lt);color:var(--amber)"><i class="fa fa-file-invoice-dollar"></i></div>
      <div class="stat-label">Ppto. enviados</div>
      <div class="stat-value">${pptoEnv}</div>
    </div>
    <div class="stat-card" onclick="go('contabilidad')" style="cursor:pointer" title="Ver movimientos bancarios">
      <div class="stat-icon" style="background:${saldoBg};color:${saldoColor}"><i class="fa fa-university"></i></div>
      <div class="stat-label">Saldo bancario <i class="fa fa-external-link-alt" style="font-size:9px;margin-left:4px"></i></div>
      <div class="stat-value" style="font-size:18px;color:${saldoColor}">${pesos(saldoBancario)}</div>
      <div style="font-size:10px;color:var(--ink3);margin-top:4px">${(DB.movBancarios||[]).length} movimientos</div>
    </div>
    <div class="stat-card" onclick="go('cobros')" style="cursor:pointer;border-color:${totalPendiente>0?'var(--red)':'var(--border)'};transition:.15s" title="Ver cobros pendientes">
      <div class="stat-icon" style="background:var(--red-lt);color:var(--red)"><i class="fa fa-clock"></i></div>
      <div class="stat-label" style="color:var(--red)">Por cobrar <i class="fa fa-external-link-alt" style="font-size:9px;margin-left:4px"></i></div>
      <div class="stat-value" style="font-size:18px;color:var(--red)">${pesos(totalPendiente)}</div>
      <div style="font-size:10px;color:var(--ink3);margin-top:4px">${cobrosPendientes.length} cobro${cobrosPendientes.length!==1?'s':''} · Click para ver detalle</div>
    </div>
    <div class="stat-card" onclick="go('contable')" style="cursor:pointer;border-color:${totalPorPagar>0?'var(--amber)':'var(--border)'};transition:.15s" title="Ver pagos pendientes">
      <div class="stat-icon" style="background:var(--amber-lt);color:var(--amber)"><i class="fa fa-file-invoice-dollar"></i></div>
      <div class="stat-label" style="color:var(--amber)">Por pagar</div>
      <div class="stat-value" style="font-size:18px;color:var(--amber)">${pesos(totalPorPagar)}</div>
      <div style="font-size:10px;color:var(--ink3);margin-top:4px">${pagosPendientes.length} pago${pagosPendientes.length!==1?'s':''} pendiente${pagosPendientes.length!==1?'s':''}</div>
    </div>
  </div>

  <!-- FILA 2: Análisis de flujo mensual -->
  <div class="stats-row" style="margin-bottom:${alertas.length?'14px':'20px'}">
    <div class="stat-card">
      <div class="stat-icon" style="background:var(--green-lt);color:var(--green)"><i class="fa fa-arrow-circle-down"></i></div>
      <div class="stat-label">Ingresos este mes</div>
      <div class="stat-value" style="font-size:18px;color:var(--green)">${pesos(creditosMes)}</div>
      <div style="font-size:10px;color:var(--ink3);margin-top:4px">${movsMes.filter(m=>parseFloat(m.credito||0)>0).length} movimientos</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:var(--red-lt);color:var(--red)"><i class="fa fa-arrow-circle-up"></i></div>
      <div class="stat-label">Egresos este mes</div>
      <div class="stat-value" style="font-size:18px;color:var(--red)">${pesos(debitosMes)}</div>
      <div style="font-size:10px;color:var(--ink3);margin-top:4px">Débitos bancarios</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:var(--amber-lt);color:var(--amber)"><i class="fa fa-receipt"></i></div>
      <div class="stat-label">Gastos registrados</div>
      <div class="stat-value" style="font-size:18px;color:var(--amber)">${pesos(totalGastosMes)}</div>
      <div style="font-size:10px;color:var(--ink3);margin-top:4px">${gastosMes.length} gastos totales</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:${flujoBg};color:${flujoColor}"><i class="fa fa-balance-scale"></i></div>
      <div class="stat-label">Flujo neto mensual</div>
      <div class="stat-value" style="font-size:18px;color:${flujoColor}">${pesos(flujoNeto)}</div>
      <div style="font-size:10px;color:${flujoColor};margin-top:4px">${flujoNeto>=0?'Positivo ✓':'Negativo ✗'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:var(--purple-lt);color:var(--purple)"><i class="fa fa-check-circle"></i></div>
      <div class="stat-label">Cobros realizados</div>
      <div class="stat-value" style="font-size:18px;color:var(--purple)">${pesos(totalCobrado)}</div>
      <div style="font-size:10px;color:var(--ink3);margin-top:4px">${cobrosCobrados.length} cobro${cobrosCobrados.length!==1?'s':''}</div>
    </div>
  </div>

  <!-- ALERTAS -->
  ${alertas.length ? `
  <div style="margin-bottom:20px">
    ${alertas.map(a => `
    <div style="background:var(--${a.tipo}-lt);border:1px solid var(--${a.tipo});border-left-width:3px;color:var(--${a.tipo});padding:10px 14px;border-radius:var(--r);margin-bottom:8px;display:flex;align-items:center;gap:10px">
      <i class="fa fa-exclamation-triangle"></i><span>${a.msg}</span>
    </div>`).join('')}
  </div>` : ''}

  <!-- GRID: 2 tablas -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
    <!-- Últimos presupuestos -->
    <div class="tbl-wrap">
      <div style="padding:14px 18px;border-bottom:1px solid var(--border);font-size:12px;font-weight:700">Últimos presupuestos</div>
      <table>
        <thead><tr><th>N°</th><th>Cliente</th><th>Total</th><th>Estado</th></tr></thead>
        <tbody>
        ${DB.presupuestos.slice(-5).reverse().map(p => `
          <tr onclick="editarPpto('${p.id}')" style="cursor:pointer">
            <td style="font-weight:700;font-family:monospace">${p.numero||'—'}</td>
            <td style="font-size:12px">${p.cliente||'—'}</td>
            <td style="font-weight:600;color:var(--green)">${pesos(p.totalFinal||0)}</td>
            <td>${bPptoStatus(p.status)}</td>
          </tr>`).join('') ||
          '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--ink4)">Sin presupuestos</td></tr>'}
        </tbody>
      </table>
    </div>

    <!-- Proyectos activos -->
    <div class="tbl-wrap">
      <div style="padding:14px 18px;border-bottom:1px solid var(--border);font-size:12px;font-weight:700">Proyectos activos</div>
      <table>
        <thead><tr><th>Proyecto</th><th>Estado</th></tr></thead>
        <tbody>
        ${DB.proyectos.filter(p => p.status !== 'cancelado').slice(-5).reverse().map(p => `
          <tr onclick="verProyecto('${p.id}')" style="cursor:pointer">
            <td>
              <div style="font-weight:600;font-size:12px">${p.nom||'—'}</div>
              <div style="font-size:11px;color:var(--ink3)">${p.cli||''}</div>
            </td>
            <td>${bStatus(p.status)}</td>
          </tr>`).join('') ||
          '<tr><td colspan="2" style="text-align:center;padding:20px;color:var(--ink4)">Sin proyectos</td></tr>'}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Movimientos bancarios -->
  ${(DB.movBancarios||[]).length > 0 ? `
  <div class="tbl-wrap">
    <div style="padding:14px 18px;border-bottom:1px solid var(--border);font-size:12px;font-weight:700;display:flex;justify-content:space-between;align-items:center">
      <span>Últimos movimientos bancarios</span>
      <button onclick="go('contabilidad')" style="font-size:11px;padding:4px 10px;border:1px solid var(--border);border-radius:var(--r);background:var(--surface);color:var(--ink2);cursor:pointer">
        Ver todos <i class="fa fa-arrow-right"></i>
      </button>
    </div>
    <table>
      <thead><tr><th>Fecha</th><th>Concepto</th><th>Débito</th><th>Crédito</th><th>Saldo</th></tr></thead>
      <tbody>
      ${(DB.movBancarios||[]).slice(-10).reverse().map(m => `
        <tr>
          <td style="font-size:11px;white-space:nowrap">${m.fecha||'—'}</td>
          <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px">${m.concepto||'—'}</td>
          <td style="color:var(--red);font-weight:${parseFloat(m.debito||0)>0?600:400}">${parseFloat(m.debito||0)>0?pesos(parseFloat(m.debito)):'-'}</td>
          <td style="color:var(--green);font-weight:${parseFloat(m.credito||0)>0?600:400}">${parseFloat(m.credito||0)>0?pesos(parseFloat(m.credito)):'-'}</td>
          <td style="font-weight:700;color:${parseFloat(m.saldo||0)>=0?'var(--teal)':'var(--red)'}">${pesos(parseFloat(m.saldo||0))}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}
  `);
}
// ═══════════════════════════════════════════════
// VENTAS — PIPELINE
// ═══════════════════════════════════════════════
// ══════════════════════════════════════════════════════
// VENTAS — CRM PIPELINE
// ══════════════════════════════════════════════════════

// Etapas del pipeline de ventas
const ETAPAS_VENTAS = [
  { id: 'prospecto',      label: 'Prospecto',           color: '#6b7280', icon: 'fa-user-plus' },
  { id: 'contactado',     label: 'Contactado',          color: '#3b82f6', icon: 'fa-phone' },
  { id: 'presentacion',   label: 'Presentación enviada',color: '#8b5cf6', icon: 'fa-paper-plane' },
  { id: 'visita',         label: 'Visita agendada',     color: '#f59e0b', icon: 'fa-calendar-check' },
  { id: 'relevamiento',   label: 'Relevamiento',        color: '#06b6d4', icon: 'fa-ruler-combined' },
  { id: 'propuesta',      label: 'Propuesta enviada',   color: '#10b981', icon: 'fa-file-invoice-dollar' },
  { id: 'cerrado',        label: 'Cerrado ✓',           color: '#059669', icon: 'fa-trophy' },
  { id: 'perdido',        label: 'Perdido',             color: '#ef4444', icon: 'fa-times-circle' },
];

let editOppId = null;

function ventas() {
  titulo('Ventas — Pipeline CRM');