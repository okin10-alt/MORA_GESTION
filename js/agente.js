// FORMA — módulo: agente

  const n = parseInt(s) || 0;
  const col = n >= 70 ? 'var(--green)' : n >= 40 ? 'var(--amber)' : 'var(--red)';
  return `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:${col}"><span style="width:8px;height:8px;border-radius:50%;background:${col};display:inline-block"></span>${n}</span>`;
}

function bArea(a) {
  const m = { ventas: ['b-blue', 'Ventas'], gestion: ['b-teal', 'Gestión'], diseno: ['b-purple', 'Diseño'], admin: ['b-amber', 'Admin'] };
  const [cls, lbl] = m[a] || ['b-gray', a];
  return `<span class="badge ${cls}">${lbl}</span>`;
}

function bStatus(s) {
  const m = {
    'relevamiento': ['b-amber', 'Relevamiento'], 'en-proceso': ['b-blue', 'En proceso'],
    'esperando-diseno': ['b-gray', 'Esp. Diseño'], 'en-diseno': ['b-purple', 'En Diseño'],
    'diseno-entregado': ['b-teal', 'Diseño listo'], 'presupuestando': ['b-amber', 'Presupuestando'],
    'presupuesto-enviado': ['b-blue', 'Ppto. enviado'], 'aprobado': ['b-green', 'Aprobado'],
    'cancelado': ['b-red', 'Cancelado']
  };
  const [cls, lbl] = m[s] || ['b-gray', s];
  return `<span class="badge ${cls}">${lbl}</span>`;
}

function bStatusDis(s) {
  return { 'pendiente': 'b-amber', 'en-proceso': 'b-blue', 'entregado': 'b-teal', 'con-modificaciones': 'b-amber', 'aprobado': 'b-green' }[s] || 'b-gray';
}

function bPptoStatus(s) {
  const m = { 'borrador': ['b-gray', 'Borrador'], 'enviado': ['b-blue', 'Enviado'], 'aprobado': ['b-green', 'Aprobado'], 'rechazado': ['b-red', 'Rechazado'] };
  const [cls, lbl] = m[s] || ['b-gray', s];
  return `<span class="badge ${cls}">${lbl}</span>`;
}

function getProy(id) {
  return DB.proyectos.find(x => x.id === id);
}

function drow(label, val) {
  return `<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--ink3);margin-bottom:3px">${label}</div><div style="font-size:13px">${val}</div></div>`;
}

function dtab(el, tabId) {
  el.parentElement.querySelectorAll('.dtab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  ['di', 'dt', 'dp', 'dh', 'dpp', 'ds'].forEach(id => {
    const t = document.getElementById(id);
    if (t) t.style.display = id === tabId ? 'block' : 'none';
  });
}

// ═══════════════════════════════════════════════
// UTILIDADES GLOBALES
// ═══════════════════════════════════════════════
function v(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function nid() {
  return 'x' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function pct(n) {
  return ((n || 0) * 100).toFixed(1) + '%';
}

function fiDate() {
  return new Date().toISOString().split('T')[0];
}

function actualizarBadgeGestion() {
  const badge = document.getElementById('badge-gestion');
  if (!badge) return;
  const pendientes = (DB.proyectos || []).filter(p => p.esTransferido && !p.transferidoVisto).length;
  badge.style.display = pendientes > 0 ? 'block' : 'none';
}

function ahora() {
  const now = new Date();
  return now.toLocaleDateString('es-AR') + ' ' + now.toLocaleTimeString('es-AR').slice(0, 5);
}

// ═══════════════════════════════════════════════
// VISTA CLIENTE — PRESUPUESTO IMPRIMIBLE (compat)
// ═══════════════════════════════════════════════
function verVistaCliente() {
  // Guardar primero para tener datos frescos
  guardarPpto();
  const num = document.getElementById('m-ppto-num').textContent;
  // Buscar en DB el presupuesto recién guardado
  const p = DB.presupuestos.find(x=>x.numero===num) || {
    numero: num,
    cliente: v('pp-cliente'),
    cuit: v('pp-cuit'),
    fecha: document.getElementById('pp-fecha').value?.split('-').reverse().join('/'),
    factura: document.getElementById('pp-factura').value,
    notas: v('pp-notas'),
    dto: v('pp-dto'),
    items: JSON.parse(JSON.stringify(pptoItems))
  };
  const html = renderVistaFactura(p);
  document.getElementById('vista-cliente-body').innerHTML = html;
  cerrar('m-presupuesto');
  abrir('m-vista-cliente');
}

function _verVistaCliente_old() {
  const num = document.getElementById('m-ppto-num').textContent;
  const cliente = v('pp-cliente') || '—';
  const cuit = v('pp-cuit') || '';
  const fecha = document.getElementById('pp-fecha').value?.split('-').reverse().join('/') || '';
  const factura = document.getElementById('pp-factura').value;
  const notas = v('pp-notas');
  const dto = parseFloat(v('pp-dto')) || 0;

  // Calcular totales actuales
  let subtotal = 0, ivaVentas = 0, iibb = 0;
  pptoItems.filter(i => i.tipo === 'item').forEach(item => {
    const c = calcItem(item);
    subtotal += c.precioNetoUnit * (parseInt(item.cant) || 1);
    ivaVentas += c.ivaVentasTotal;
    iibb += c.iibbTotal;
  });
  const totalBruto = subtotal + ivaVentas + iibb;
  const descuento = totalBruto * (dto / 100);
  const total = totalBruto - descuento;

  // Construir tabla de ítems (solo descripción y precio al cliente)
  let itemsHTML = '';
  let seccionActual = '';
  pptoItems.forEach(item => {
    if (item.tipo === 'seccion') {
      seccionActual = item.nombre;
      itemsHTML += `<tr><td colspan="4" style="background:#1c1c1a;color:#fff;padding:8px 14px;font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase">▸ ${item.nombre}</td></tr>`;
    } else {
      const c = calcItem(item);
      itemsHTML += `<tr>
        <td style="padding:10px 14px;border-bottom:1px solid #e6e6e2;font-size:13px">${item.desc || 'Sin descripción'}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e6e6e2;text-align:center;font-size:13px">${item.cant || 1}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e6e6e2;text-align:right;font-size:13px">${pesos(c.precioFinalUnit)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e6e6e2;text-align:right;font-size:13px;font-weight:700">${pesos(c.totalLinea)}</td>
      </tr>`;
    }
  });

  document.getElementById('vista-cliente-body').innerHTML = `
    <div style="max-width:720px;margin:0 auto;font-family:'DM Sans',sans-serif">
      <!-- Encabezado -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid #1c1c1a">
        <div>
          <div style="font-size:28px;font-weight:800;letter-spacing:-1px;color:#1c1c1a">FORMA</div>
          <div style="font-size:11px;color:#8a8a86;letter-spacing:2px;text-transform:uppercase;margin-top:2px">Sistema de Gestión Integral</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:22px;font-weight:800;color:#2952d9">${num}</div>
          <div style="font-size:11px;color:#8a8a86;margin-top:3px">Presupuesto · Factura ${factura}</div>
          <div style="font-size:12px;color:#4c4c49;margin-top:2px">${fecha}</div>
        </div>
      </div>

      <!-- Datos cliente -->
      <div style="background:#f4f4f1;border-radius:10px;padding:18px 22px;margin-bottom:28px">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#8a8a86;margin-bottom:8px">Presupuesto para</div>
        <div style="font-size:17px;font-weight:700;color:#1c1c1a">${cliente}</div>
        ${cuit ? `<div style="font-size:12px;color:#8a8a86;margin-top:3px">CUIT: ${cuit}</div>` : ''}
      </div>

      <!-- Tabla de ítems -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <thead>
          <tr style="background:#1c1c1a">
            <th style="padding:10px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.6);text-align:left">Descripción</th>
            <th style="padding:10px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.6);text-align:center;width:60px">Cant.</th>
            <th style="padding:10px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.6);text-align:right;width:130px">P. Unit.</th>
            <th style="padding:10px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.6);text-align:right;width:130px">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHTML}</tbody>
      </table>

      <!-- Totales -->
      <div style="display:flex;justify-content:flex-end">
        <div style="width:280px">
          <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #e6e6e2;font-size:12px">
            <span style="color:#8a8a86">Subtotal neto</span><span style="font-weight:600">${pesos(subtotal)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #e6e6e2;font-size:12px">
            <span style="color:#8a8a86">IVA</span><span style="font-weight:600">${pesos(ivaVentas)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #e6e6e2;font-size:12px">
            <span style="color:#8a8a86">IIBB (3.5%)</span><span style="font-weight:600">${pesos(iibb)}</span>
          </div>
          ${dto > 0 ? `<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #e6e6e2;font-size:12px">
            <span style="color:#c0281e">Descuento (${dto}%)</span><span style="font-weight:600;color:#c0281e">-${pesos(descuento)}</span>
          </div>` : ''}
          <div style="display:flex;justify-content:space-between;padding:12px 16px;background:#1c1c1a;border-radius:8px;margin-top:8px">
            <span style="color:#fff;font-weight:700;font-size:14px">TOTAL</span>
            <span style="color:#fff;font-weight:800;font-size:18px">${pesos(total)}</span>
          </div>
        </div>
      </div>

      ${notas ? `<div style="margin-top:28px;padding:16px;background:#f4f4f1;border-radius:8px;border-left:3px solid #2952d9">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#8a8a86;margin-bottom:6px">Condiciones y notas</div>
        <div style="font-size:13px;color:#4c4c49">${notas}</div>
      </div>` : ''}

      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e6e6e2;font-size:10px;color:#8a8a86;text-align:center">
        Este presupuesto tiene una validez de 15 días desde la fecha de emisión.
      </div>
    </div>`;

  abrir('m-vista-cliente');
}

console.log('✅ FORMA app.js cargado completamente');
console.log('📦 Módulos disponibles:', MODULOS_ALL.map(m => m.label).join(', '));
console.log('🚀 Sistema 100% funcional');


// ═══════════════════════════════════════════════════════════
// MÓDULO AGENTE DE VENTAS — FORMA
// Vista agente: carga llamadas en tiempo real
// Vista admin: dashboard de rendimiento y métricas
// ═══════════════════════════════════════════════════════════

// ── Constantes ───────────────────────────────────────────
const RUBROS = [
  { id: 'abogado',    label: 'Abogado',           icon: '⚖️' },
  { id: 'medico',     label: 'Médico',             icon: '🏥' },
  { id: 'dentista',   label: 'Dentista',           icon: '🦷' },
  { id: 'comercio',   label: 'Comercio minorista', icon: '🏪' },
  { id: 'emp_pub',    label: 'Empresa pública',    icon: '🏛️' },
  { id: 'emp_priv',   label: 'Empresa privada',    icon: '🏢' },
  { id: 'otro',       label: 'Otro',               icon: '📋' },
];

const RESULTADOS = [
  { id: 'no_contesto',  label: 'No contestó',             color: 'var(--ink4)',    bg: 'var(--surface2)', icon: 'fa-phone-slash' },
  { id: 'no_interes',   label: 'No le interesó',          color: 'var(--red)',     bg: 'var(--red-lt)',   icon: 'fa-times-circle' },
  { id: 'mas_info',     label: 'Quiere más info',         color: 'var(--amber)',   bg: 'var(--amber-lt)', icon: 'fa-info-circle' },
  { id: 'visita',       label: 'Visita agendada',         color: 'var(--green)',   bg: 'var(--green-lt)', icon: 'fa-calendar-check' },
];

// ── Módulo principal ─────────────────────────────────────
function renderFilaLlamada(l) {
  const res = RESULTADOS.find(r => r.id === l.resultado) || RESULTADOS[0];
  const rub = RUBROS.find(r => r.id === l.rubro) || RUBROS[RUBROS.length-1];
  const fecha = l.fechaISO ? new Date(l.fechaISO + 'T12:00:00').toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit' }) : '—';
  const empresaHtml = l.empresa ? '<div style="font-size:10px;color:var(--ink3)">' + l.empresa + '</div>' : '';
  return '<tr style="border-bottom:1px solid var(--border)">' +
    '<td style="padding:9px 14px;color:var(--ink3)">' + fecha + '</td>' +
    '<td style="padding:9px 14px"><div style="font-weight:600;color:var(--ink1)">' + (l.contacto || '—') + '</div>' + empresaHtml + '</td>' +
    '<td style="padding:9px 14px;color:var(--ink2)">' + rub.icon + ' ' + rub.label + '</td>' +
    '<td style="padding:9px 14px"><span style="display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:12px;font-size:11px;font-weight:600;background:' + res.bg + ';color:' + res.color + '"><i class="fa ' + res.icon + '" style="font-size:10px"></i> ' + res.label + '</span></td>' +
    '<td style="padding:9px 14px;text-align:center"><button class="btn btn-secondary btn-sm" onclick="verLlamada(\'' + l.id + '\')" style="padding:3px 8px;font-size:11px"><i class="fa fa-eye"></i></button></td>' +
    '</tr>';
}

function renderBarraDia(d, maxDia) {
  const pct = d.total ? Math.round((d.total/maxDia)*100) : 0;
  const visitaBar = d.visitas ? '<div style="position:absolute;bottom:0;width:100%;height:' + Math.round((d.visitas/d.total)*100) + '%;background:var(--green)"></div>' : '';
  return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:default" title="' + d.label + ': ' + d.total + ' llamadas, ' + d.visitas + ' visitas">' +
    '<div style="width:100%;background:var(--border);border-radius:3px 3px 0 0;flex:1;display:flex;flex-direction:column;justify-content:flex-end;overflow:hidden;position:relative">' +
    '<div style="width:100%;height:' + pct + '%;background:var(--accent-lt);transition:.3s;position:relative">' + visitaBar + '</div>' +
    '</div>' +
    '<div style="font-size:9px;color:var(--ink4);white-space:nowrap;transform:rotate(-45deg);transform-origin:top left;margin-top:4px;margin-left:4px">' + d.label + '</div>' +
    '</div>';
}

function renderRubroItem(r) {
  const bg = r.tasa >= 20 ? 'var(--green)' : r.tasa >= 10 ? 'var(--amber)' : 'var(--accent)';
  return '<div style="margin-bottom:14px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">' +
    '<div style="font-size:12px;font-weight:600">' + r.icon + ' ' + r.label + '</div>' +
    '<div style="font-size:11px;color:var(--ink3)">' + r.visitas + ' visita' + (r.visitas !== 1 ? 's' : '') + ' / ' + r.total + ' llamadas</div>' +
    '</div>' +
    '<div style="background:var(--surface2);border-radius:4px;height:6px;overflow:hidden">' +
    '<div style="height:100%;width:' + r.tasa + '%;background:' + bg + ';border-radius:4px;transition:.4s"></div>' +
    '</div>' +
    '<div style="font-size:10px;color:var(--ink3);margin-top:3px">' + r.tasa + '% de conversión</div>' +
    '</div>';
}

function agenteVentas() {
  titulo('Agente de Ventas');

  const esAdmin = DB.config?.rolActual === 'admin';

  actions(`
    ${esAdmin ? `
      <button class="btn btn-secondary" onclick="agenteVentas()" style="margin-right:6px">
        <i class="fa fa-chart-bar"></i> Dashboard
      </button>
    ` : ''}
    <button class="btn btn-primary" onclick="abrirModalLlamada()">
      <i class="fa fa-phone"></i> Registrar llamada
    </button>
  `);

  const llamadas = DB.llamadas || [];

  const hoy = new Date();
  const hace30 = new Date(hoy); hace30.setDate(hoy.getDate() - 30);

  const llamadas30  = llamadas.filter(l => new Date(l.fechaISO) >= hace30);
  const total       = llamadas30.length;
  const noContesto  = llamadas30.filter(l => l.resultado === 'no_contesto').length;
  const noInteres   = llamadas30.filter(l => l.resultado === 'no_interes').length;
  const masInfo     = llamadas30.filter(l => l.resultado === 'mas_info').length;
  const visitas     = llamadas30.filter(l => l.resultado === 'visita').length;
  const contactadas = total - noContesto;
  const tasaContacto   = total ? Math.round((contactadas / total) * 100) : 0;
  const tasaConversion = contactadas ? Math.round((visitas / contactadas) * 100) : 0;
  const tasaVisita     = total ? Math.round((visitas / total) * 100) : 0;

  const porRubro = RUBROS.map(r => {
    const ls = llamadas30.filter(l => l.rubro === r.id);
    const v  = ls.filter(l => l.resultado === 'visita').length;
    return { ...r, total: ls.length, visitas: v, tasa: ls.length ? Math.round((v/ls.length)*100) : 0 };
  }).filter(r => r.total > 0).sort((a,b) => b.visitas - a.visitas);

  const dias14 = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const ls = llamadas.filter(l => l.fechaISO === key);
    dias14.push({
      label: d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' }),
      total: ls.length,
      visitas: ls.filter(l => l.resultado === 'visita').length,
      info: ls.filter(l => l.resultado === 'mas_info').length,
    });
  }
  const maxDia = Math.max(...dias14.map(d => d.total), 1);

  const ultimas = [...llamadas].sort((a,b) => new Date(b.creadoEn) - new Date(a.creadoEn)).slice(0, 50);

  // HTML pre-computado para evitar anidamiento excesivo de template literals
  const htmlStats = statCard('fa-phone', 'Llamadas (30d)', total, '', 'var(--accent-lt)', 'var(--accent)') +
    statCard('fa-user-check', 'Contactadas', contactadas, tasaContacto + '% del total', 'var(--teal-lt)', 'var(--teal)') +
    statCard('fa-info-circle', 'Con interés', masInfo, (contactadas ? Math.round(masInfo/contactadas*100) : 0) + '% de contactadas', 'var(--amber-lt)', 'var(--amber)') +
    statCard('fa-calendar-check', 'Visitas agendadas', visitas, tasaVisita + '% del total', 'var(--green-lt)', 'var(--green)') +
    statCard('fa-chart-line', 'Conversión', tasaConversion + '%', 'contacto → visita', visitas > 0 ? 'var(--green-lt)' : 'var(--surface2)', visitas > 0 ? 'var(--green)' : 'var(--ink3)');

  const htmlBarras = dias14.map(d => renderBarraDia(d, maxDia)).join('');

  const htmlRubros = porRubro.length
    ? porRubro.map(r => renderRubroItem(r)).join('')
    : '<div style="text-align:center;padding:24px;color:var(--ink4);font-size:12px">Sin datos aún</div>';

  const htmlUltimas = ultimas.length
    ? '<div style="overflow-y:auto;max-height:400px">' +
        '<table style="width:100%;border-collapse:collapse;font-size:12px">' +
        '<thead style="background:var(--surface2);position:sticky;top:0"><tr>' +
        '<th style="padding:8px 14px;text-align:left;color:var(--ink3);font-weight:600">Fecha</th>' +
        '<th style="padding:8px 14px;text-align:left;color:var(--ink3);font-weight:600">Contacto</th>' +
        '<th style="padding:8px 14px;text-align:left;color:var(--ink3);font-weight:600">Rubro</th>' +
        '<th style="padding:8px 14px;text-align:left;color:var(--ink3);font-weight:600">Resultado</th>' +
        '<th style="padding:8px 14px;text-align:center;color:var(--ink3);font-weight:600"></th>' +
        '</tr></thead>' +
        '<tbody>' + ultimas.map(l => renderFilaLlamada(l)).join('') + '</tbody>' +
        '</table></div>'
    : '<div style="padding:48px 24px;text-align:center">' +
        '<div style="font-size:32px;margin-bottom:12px">📞</div>' +
        '<div style="font-size:14px;font-weight:600;color:var(--ink2);margin-bottom:6px">Sin llamadas registradas</div>' +
        '<div style="font-size:12px;color:var(--ink4);margin-bottom:16px">Registrá tu primera llamada para empezar a ver métricas</div>' +
        '<button class="btn btn-primary" onclick="abrirModalLlamada()"><i class="fa fa-phone"></i> Registrar llamada</button>' +
        '</div>';

  c(`
  <!-- STATS PRINCIPALES -->
  <div class="stats-row" style="grid-template-columns:repeat(5,1fr);margin-bottom:20px">
    ${htmlStats}
  </div>

  <!-- EMBUDO + ACTIVIDAD -->
  <div style="display:grid;grid-template-columns:1fr 1.6fr;gap:16px;margin-bottom:16px">

    <!-- Embudo de conversión -->
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:20px">
      <div style="font-size:13px;font-weight:700;margin-bottom:16px">Embudo de conversión</div>
      ${renderEmbudo([
        { label: 'Llamadas realizadas', valor: total,       color: 'var(--accent)', pct: 100 },
        { label: 'Contactadas',         valor: contactadas, color: 'var(--teal)',   pct: total ? Math.round(contactadas/total*100) : 0 },
        { label: 'Con interés',         valor: masInfo,     color: 'var(--amber)',  pct: total ? Math.round(masInfo/total*100) : 0 },
        { label: 'Visitas agendadas',   valor: visitas,     color: 'var(--green)',  pct: total ? Math.round(visitas/total*100) : 0 },
      ])}
    </div>

    <!-- Actividad últimos 14 días -->
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:20px">
      <div style="font-size:13px;font-weight:700;margin-bottom:16px">Actividad — últimos 14 días</div>
      <div style="display:flex;align-items:flex-end;gap:4px;height:100px">
        ${htmlBarras}
      </div>
      <div style="display:flex;gap:14px;margin-top:28px;font-size:11px">
        <div style="display:flex;align-items:center;gap:5px"><div style="width:10px;height:10px;border-radius:2px;background:var(--accent-lt)"></div> Llamadas</div>
        <div style="display:flex;align-items:center;gap:5px"><div style="width:10px;height:10px;border-radius:2px;background:var(--green)"></div> Visitas</div>
      </div>
    </div>
  </div>

  <!-- RENDIMIENTO POR RUBRO + ÚLTIMAS LLAMADAS -->
  <div style="display:grid;grid-template-columns:1fr 1.8fr;gap:16px">

    <!-- Por rubro -->
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:20px">
      <div style="font-size:13px;font-weight:700;margin-bottom:14px">Rendimiento por rubro</div>
      ${htmlRubros}
    </div>

    <!-- Últimas llamadas -->
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden">
      <div style="padding:16px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <div style="font-size:13px;font-weight:700">Últimas llamadas</div>
        <span class="badge b-gray">${llamadas.length}</span>
      </div>
      ${htmlUltimas}
    </div>
  </div>

  `);
}

// ── Helpers render ────────────────────────────────────────
function statCard(icon, label, valor, sub, bg, color) {
  return `
    <div class="stat-card">
      <div class="stat-icon" style="background:${bg};color:${color}"><i class="fa ${icon}"></i></div>
      <div class="stat-label">${label}</div>
      <div class="stat-value" style="color:${color}">${valor}</div>
      ${sub ? `<div class="stat-sub">${sub}</div>` : ''}
    </div>`;
}

function renderEmbudo(pasos) {
  return pasos.map((p, i) => `
    <div style="margin-bottom:${i < pasos.length-1 ? '10px' : '0'}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <div style="font-size:12px;color:var(--ink2)">${p.label}</div>
        <div style="font-size:12px;font-weight:700;color:${p.color}">${p.valor} <span style="font-size:10px;font-weight:400;color:var(--ink4)">(${p.pct}%)</span></div>
      </div>
      <div style="background:var(--surface2);border-radius:4px;height:8px;overflow:hidden">
        <div style="height:100%;width:${p.pct}%;background:${p.color};border-radius:4px;transition:.5s"></div>
      </div>
    </div>
  `).join('');
}

// ── Estado del modal ──────────────────────────────────────
let _rubroSel = null;
let _resultSel = null;

function abrirModalLlamada() {
  _rubroSel = null;
  _resultSel = null;
  abrir('m-llamada');
  // Reset campos después de abrir para que existan en el DOM
  setTimeout(() => {
    const lc = document.getElementById('ll-contacto');
    const le = document.getElementById('ll-empresa');
    const ln = document.getElementById('ll-notas');
    if (lc) lc.value = '';
    if (le) le.value = '';
    if (ln) ln.value = '';
    document.querySelectorAll('.rubro-pill').forEach(el => {
      el.style.background = 'var(--surface2)';
      el.style.borderColor = 'var(--border)';
      el.style.color = 'var(--ink2)';
    });
    RESULTADOS.forEach(r => {
      const el = document.getElementById(`res-label-${r.id}`);
      if (el) { el.style.background = 'var(--surface2)'; el.style.borderColor = 'var(--border)'; }
    });
  }, 50);
}

function selRubro(id) {
  _rubroSel = id;
  document.querySelectorAll('.rubro-pill').forEach(el => {
    const activo = el.dataset.rubro === id;
    el.style.background   = activo ? 'var(--accent-lt)' : 'var(--surface2)';
    el.style.borderColor  = activo ? 'var(--accent)'    : 'var(--border)';
    el.style.color        = activo ? 'var(--accent)'    : 'var(--ink2)';
  });
}

function selResultado(id) {
  _resultSel = id;
  const res = RESULTADOS.find(r => r.id === id);
  RESULTADOS.forEach(r => {
    const el = document.getElementById(`res-label-${r.id}`);
    if (!el) return;
    const activo = r.id === id;
    el.style.background  = activo ? res.bg  : 'var(--surface2)';
    el.style.borderColor = activo ? res.color : 'var(--border)';
  });
}

function guardarLlamada() {
  const contacto = document.getElementById('ll-contacto').value.trim();
  if (!_rubroSel)  { alert('Seleccioná un rubro'); return; }
  if (!_resultSel) { alert('Seleccioná el resultado de la llamada'); return; }

  if (!DB.llamadas) DB.llamadas = [];

  const hoyISO = new Date().toISOString().split('T')[0];

  DB.llamadas.push({
    id:         uid(),
    fechaISO:   hoyISO,
    creadoEn:   new Date().toISOString(),
    contacto:   contacto || 'Sin nombre',
    empresa:    document.getElementById('ll-empresa').value.trim() || null,
    rubro:      _rubroSel,
    resultado:  _resultSel,
    notas:      document.getElementById('ll-notas').value.trim() || null,
  });

  guardar();
  cerrar('m-llamada');
  agenteVentas();
}

function verLlamada(id) {
  const l = (DB.llamadas || []).find(x => x.id === id);
  if (!l) return;
  const res = RESULTADOS.find(r => r.id === l.resultado) || RESULTADOS[0];
  const rub = RUBROS.find(r => r.id === l.rubro) || RUBROS[RUBROS.length-1];
  const fecha = l.fechaISO ? new Date(l.fechaISO + 'T12:00:00').toLocaleDateString('es-AR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' }) : '—';
  alert(`📞 ${l.contacto || 'Sin nombre'}${l.empresa ? '\n🏢 ' + l.empresa : ''}\n📅 ${fecha}\n${rub.icon} ${rub.label}\n\n${res.label}${l.notas ? '\n\n📝 ' + l.notas : ''}`);
}




// ════════════════════════════════════════════════════════
// DEPURACIÓN + MÓDULOS FIGMA CONTABILIDAD
// ════════════════════════════════════════════════════════

// ── Funciones que faltaban (onclick sin definir) ──
function aprobarPpto(id) {
  const p = (DB.presupuestos||[]).find(x=>x.id===id);