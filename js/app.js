
    if (window.pdfjsLib) {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
  

/* ══════════════════════════════════════════════
   FORMA — Base de Datos (localStorage)
   ══════════════════════════════════════════════ */

// Constantes
const DB_KEY = 'forma_v3';
const AUTH_KEY = 'forma_auth';

// Variables globales
let DB;
let CURRENT_USER = null;

// Módulos disponibles
const MODULOS_ALL = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-bar' },
  { id: 'leads', label: 'Leads', icon: 'fa-funnel-dollar' },
  { id: 'ventas', label: 'Ventas', icon: 'fa-address-book' },
  { id: 'gestion', label: 'Gestión', icon: 'fa-project-diagram' },
  { id: 'diseno', label: 'Diseño', icon: 'fa-pen-nib' },
  { id: 'presupuestos', label: 'Presupuestos', icon: 'fa-file-invoice-dollar' },
  { id: 'contable', label: 'Contable', icon: 'fa-coins' },
  { id: 'financiero', label: 'Financiero', icon: 'fa-chart-line' }
];

// ══════════════════════════════════════════════
// INICIALIZAR BASE DE DATOS
// ══════════════════════════════════════════════
function initDB() {
  return {
    config: { empresa: 'Moradesign', moneda: 'ARS' },
    llamadas: [],
    contactos: [],
    pptoCounter: 0,
    retenciones: [],
    sueldos: [],
    empleados: [],
    leads: [
      {
        id: 'l1',
        nom: 'Carlos',
        ape: 'Méndez',
        emp: 'Grupo Inversiones SA',
        cargo: 'Gerente',
        tel: '+54 9 388 4112233',
        email: 'carlos@grupoinv.com',
        origen: 'referido',
        cat: 'Oficina',
        tipo: 'Equipamiento',
        score: 75,
        ppto: 1500000,
        notas: 'Interesado en equipar 2 plantas. Urgente para marzo.',
        loc: 'San Salvador de Jujuy',
        prov: 'Jujuy',
        status: 'Contactado',
        area: 'ventas',
        fecha: hoy()
      }
    ],
    proyectos: [
      {
        id: 'p1',
        nom: 'Oficina Norandina - Sala Reuniones',
        cli: 'Andrés Cazón',
        emp: 'ERG Norandina',
        cuit: '30-00000000-0',
        tel: '+54 9 388 1234567',
        email: 'a.cazon@erg.com',
        cat: 'Oficina',
        tipo: 'Equipamiento',
        area: 'gestion',
        status: 'presupuestando',
        fecha: '2025-03-30',
        desc: 'Sala de reuniones 120m2.',
        relev: 'Espacio 120m2, alt 2.8m.',
        creadoEn: hoy()
      }
    ],
    solicitudes: [],
    timeline: [],
    transferencias: [],
    presupuestos: [],
    oportunidades: [],
    cobros: [],
    pagos: [],
    pptoCounter: 3829,
    gastos: [],
    movBancarios: [],
    cheques: [],
    usuarios: [
      {
        id: 'u-admin',
        nombre: 'Admin Sistema',
        email: 'admin@forma.com',
        passHash: btoa('admin1234'),
        status: 'activo',
        rol: 'admin',
        nota: 'Administrador principal',
        modulos: ['dashboard', 'leads', 'ventas', 'gestion', 'diseno', 'presupuestos', 'contable', 'financiero', 'usuarios'],
        creadoEn: new Date().toLocaleDateString('es-AR')
      }
    ]
  };
}

// ══════════════════════════════════════════════
// CARGAR BASE DE DATOS
// ══════════════════════════════════════════════
function cargarDB() {
  try {
    DB = JSON.parse(localStorage.getItem(DB_KEY)) || initDB();
  } catch (e) {
    DB = initDB();
  }

  // Asegurar arrays existen
  ['leads', 'proyectos', 'solicitudes', 'timeline', 'transferencias', 'presupuestos', 'cobros', 'pagos', 'usuarios', 'gastos', 'movBancarios', 'cheques'].forEach(k => {
    if (!Array.isArray(DB[k])) DB[k] = [];
  });

  if (!DB.pptoCounter) DB.pptoCounter = 3829;

  // Siempre garantizar que el admin existe (por si habia datos viejos en localStorage)
  if (!DB.usuarios.some(u => u.id === 'u-admin')) {
    DB.usuarios.push({
      id: 'u-admin', nombre: 'Admin Sistema', email: 'admin@forma.com',
      passHash: btoa('admin1234'), status: 'activo', rol: 'admin',
      nota: 'Administrador principal',
      modulos: ['dashboard','leads','ventas','gestion','diseno','presupuestos','contable','financiero','usuarios'],
      creadoEn: new Date().toLocaleDateString('es-AR')
    });
    localStorage.setItem('forma_v3', JSON.stringify(DB));
  }
}

// ══════════════════════════════════════════════
// GUARDAR BASE DE DATOS
// ══════════════════════════════════════════════
function guardar() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(DB));
  } catch (e) {
    console.error('Error al guardar en localStorage:', e);
    alert('Error al guardar datos. El localStorage puede estar lleno.');
  }
}

// ══════════════════════════════════════════════
// UTILIDADES
// ══════════════════════════════════════════════
function hoy() {
  return new Date().toISOString().split('T')[0];
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function pesos(n) {
  return '$' + parseFloat(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ══════════════════════════════════════════════
// INICIALIZACIÓN AL CARGAR
// ══════════════════════════════════════════════
// DOMContentLoaded manejado por api.js (iniciarApp)
// document.addEventListener('DOMContentLoaded', function() {
//   cargarDB();
//   verificarAuth();
//   setTimeout(actualizarBadgeGestion, 500);
// });

/* ══════════════════════════════════════════════
   FORMA — Sistema de Autenticación
   ══════════════════════════════════════════════ */

// ══════════════════════════════════════════════
// VERIFICAR AUTENTICACIÓN
// ══════════════════════════════════════════════
function verificarAuth() {
  // AUTH DESACTIVADO TEMPORALMENTE - acceso directo
  CURRENT_USER = { id:'admin', nombre:'Admin Sistema', email:'admin@forma.com', rol:'admin', 
    modulos:['dashboard','leads','ventas','gestion','diseno','presupuestos','contable','financiero','usuarios'] };
  mostrarApp();
}

function mostrarAuth() {
  document.getElementById('auth-screen').classList.remove('hidden');
  document.querySelector('.app').style.display = 'none';
}

// ══════════════════════════════════════════════
// MOSTRAR APLICACIÓN
// ══════════════════════════════════════════════
function mostrarApp() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.querySelector('.app').style.display = 'flex';
  
  // Actualizar info del usuario en sidebar
  actualizarSidebarUser();
  
  // Mostrar/ocultar módulos según permisos
  actualizarModulosVisibles();
  
  // Ir al dashboard
  if (typeof go === 'function') {
    go('dashboard');
  } else {
    // Temporal: mostrar mensaje básico
    document.getElementById('content').innerHTML = '<div style="padding:40px;text-align:center"><h2>✅ Sesión iniciada correctamente</h2><p>Usuario: ' + CURRENT_USER.nombre + '</p><p style="color:var(--ink3);margin-top:20px">Los módulos se cargarán cuando completes los archivos JS completos.</p></div>';
  }
}

// ══════════════════════════════════════════════
// ACTUALIZAR INFO USUARIO EN SIDEBAR
// ══════════════════════════════════════════════
function actualizarSidebarUser() {
  const iniciales = CURRENT_USER.nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const colores = ['#2952d9', '#1a7a4a', '#6d3cbf', '#0e7490', '#b55800'];
  const color = colores[CURRENT_USER.nombre.charCodeAt(0) % colores.length];
  
  document.getElementById('sb-avatar').textContent = iniciales;
  document.getElementById('sb-avatar').style.background = color;
  document.getElementById('sb-uname').textContent = CURRENT_USER.nombre;
  
  const rolTexto = CURRENT_USER.rol === 'admin' ? 'Acceso total' : 'Usuario';
  document.getElementById('sb-urole').textContent = rolTexto;
}

// ══════════════════════════════════════════════
// ACTUALIZAR MÓDULOS VISIBLES
// ══════════════════════════════════════════════
function actualizarModulosVisibles() {
  const modulos = CURRENT_USER.modulos || [];
  const esAdmin = modulos.includes('usuarios');
  
  // Mostrar/ocultar sección admin
  if (esAdmin) {
    document.getElementById('nav-financiero').style.display = 'flex';
    document.getElementById('nav-usuarios').style.display = 'flex';
  } else {
    document.getElementById('nav-financiero').style.display = 'none';
    document.getElementById('nav-usuarios').style.display = 'none';
  }
  
  // Ocultar módulos no permitidos
  MODULOS_ALL.forEach(mod => {
    const navItem = document.getElementById('nav-' + mod.id);
    if (navItem) {
      navItem.style.display = modulos.includes(mod.id) ? 'flex' : 'none';
    }
  });
}

// ══════════════════════════════════════════════
// CAMBIAR TAB AUTH (Login/Registro)
// ══════════════════════════════════════════════
function switchAuthTab(tab) {
  // Actualizar tabs
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-registro').classList.toggle('active', tab === 'registro');
  
  // Mostrar/ocultar formularios
  document.getElementById('auth-login').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('auth-registro').style.display = tab === 'registro' ? 'block' : 'none';
  
  // Limpiar mensajes
  document.getElementById('auth-login-msg').style.display = 'none';
  document.getElementById('auth-reg-msg').style.display = 'none';
}

// ══════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════
function doLogin() {
  const email = document.getElementById('au-email').value.trim();
  const pass = document.getElementById('au-pass').value;
  const msgEl = document.getElementById('auth-login-msg');
  
  // Validar campos
  if (!email || !pass) {
    mostrarMensaje(msgEl, 'Completá todos los campos', 'err');
    return;
  }
  
  // Buscar usuario
  const user = DB.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    mostrarMensaje(msgEl, 'Usuario no encontrado', 'err');
    return;
  }
  
  // Verificar contraseña
  if (atob(user.passHash) !== pass) {
    mostrarMensaje(msgEl, 'Contraseña incorrecta', 'err');
    return;
  }
  
  // Verificar estado
  if (user.status !== 'activo') {
    mostrarMensaje(msgEl, 'Usuario inactivo. Contactá al administrador.', 'err');
    return;
  }
  
  // Login exitoso
  localStorage.setItem(AUTH_KEY, JSON.stringify({ userId: user.id }));
  CURRENT_USER = user;
  
  mostrarMensaje(msgEl, '¡Bienvenido/a!', 'ok');
  
  setTimeout(() => {
    mostrarApp();
  }, 800);
}

// ══════════════════════════════════════════════
// REGISTRO
// ══════════════════════════════════════════════
function doRegistro() {
  const nombre = document.getElementById('au-rnom').value.trim();
  const email = document.getElementById('au-remail').value.trim();
  const pass = document.getElementById('au-rpass').value;
  const pass2 = document.getElementById('au-rpass2').value;
  const msgEl = document.getElementById('auth-reg-msg');
  
  // Validaciones
  if (!nombre || !email || !pass || !pass2) {
    mostrarMensaje(msgEl, 'Completá todos los campos', 'err');
    return;
  }
  
  if (pass.length < 6) {
    mostrarMensaje(msgEl, 'La contraseña debe tener mínimo 6 caracteres', 'err');
    return;
  }
  
  if (pass !== pass2) {
    mostrarMensaje(msgEl, 'Las contraseñas no coinciden', 'err');
    return;
  }
  
  // Verificar si el email ya existe
  if (DB.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    mostrarMensaje(msgEl, 'Este email ya está registrado', 'err');
    return;
  }
  
  // Crear nuevo usuario
  const nuevoUsuario = {
    id: uid(),
    nombre: nombre,
    email: email,
    passHash: btoa(pass),
    status: 'pendiente',
    rol: 'user',
    nota: 'Registro desde web',
    modulos: ['dashboard'],
    creadoEn: new Date().toLocaleDateString('es-AR')
  };
  
  DB.usuarios.push(nuevoUsuario);
  guardar();
  
  mostrarMensaje(msgEl, '✅ Solicitud enviada. Un administrador debe activar tu cuenta.', 'ok');
  
  // Limpiar formulario
  document.getElementById('au-rnom').value = '';
  document.getElementById('au-remail').value = '';
  document.getElementById('au-rpass').value = '';
  document.getElementById('au-rpass2').value = '';
  
  // Cambiar a tab login después de 2 segundos
  setTimeout(() => {
    switchAuthTab('login');
  }, 2500);
}

// ══════════════════════════════════════════════
// LOGOUT
// ══════════════════════════════════════════════
function doLogout() {
  if (!confirm('¿Cerrar sesión?')) return;
  
  localStorage.removeItem(AUTH_KEY);
  CURRENT_USER = null;
  
  // Limpiar formularios
  document.getElementById('au-email').value = '';
  document.getElementById('au-pass').value = '';
  
  mostrarAuth();
  switchAuthTab('login');
}

// ══════════════════════════════════════════════
// MOSTRAR MENSAJE
// ══════════════════════════════════════════════
function mostrarMensaje(elemento, texto, tipo) {
  elemento.textContent = texto;
  elemento.className = 'auth-msg ' + tipo;
  elemento.style.display = 'block';
  
  if (tipo === 'err') {
    setTimeout(() => {
      elemento.style.display = 'none';
    }, 4000);
  }
}

/* ══════════════════════════════════════════════
   FORMA — Sistema de Navegación
   ══════════════════════════════════════════════ */

// Variable global del módulo actual
let modulo = 'dashboard';
let searchQ = '';

// ══════════════════════════════════════════════
// NAVEGAR A MÓDULO
// ══════════════════════════════════════════════
function go(m) {
  modulo = m;
  
  // Actualizar nav activo
  document.querySelectorAll('.sb-item').forEach(item => item.classList.remove('active'));
  const navItem = document.getElementById('nav-' + m);
  if (navItem) navItem.classList.add('active');
  
  // Limpiar búsqueda
  searchQ = '';
  document.getElementById('search-q').value = '';
  
  // Renderizar módulo
  renderModulo();
}

// ══════════════════════════════════════════════
// RENDERIZAR MÓDULO ACTUAL
// ══════════════════════════════════════════════
function renderModulo() {
  // Llamar a la función específica de app.js según el módulo activo
  const modulosFn = {
    dashboard,
    leads,
    ventas,
    gestion,
    diseno,
    presupuestos,
    contable,
    financiero,
    usuarios
  };

  const fn = modulosFn[modulo];
  if (typeof fn === 'function') {
    fn();
  } else {
    // Fallback si el módulo no existe
    c(`<div style="padding:60px 40px;text-align:center">
      <div style="font-size:48px;margin-bottom:12px">🔍</div>
      <h3>Módulo no encontrado: ${modulo}</h3>
    </div>`);
  }
}

// ══════════════════════════════════════════════
// UTILIDADES TOPBAR
// ══════════════════════════════════════════════
function titulo(t) {
  document.getElementById('topbar-title').textContent = t;
}

function actions(html) {
  document.getElementById('topbar-actions').innerHTML = html;
}

function c(html) {
  document.getElementById('content').innerHTML = html;
}

// ══════════════════════════════════════════════
// BÚSQUEDA
// ══════════════════════════════════════════════
function buscar(q) {
  searchQ = q.toLowerCase();
  renderModulo();
}

// ══════════════════════════════════════════════
// MODALES (funciones básicas)
// ══════════════════════════════════════════════
function abrir(modalId) {
  document.getElementById(modalId).classList.add('open');
}

function cerrar(modalId) {
  document.getElementById(modalId).classList.remove('open');
}

/* ══════════════════════════════════════════════
   FORMA — Aplicación Principal
   Lógica completa de todos los módulos
   ══════════════════════════════════════════════ */

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

function diseno() {
  titulo('Diseño');
  actions(`
    <button class="btn btn-secondary btn-sm" onclick="toggleArchivoDisenos()" id="btn-archivo-dis">
      <i class="fa fa-archive"></i> ${window.verArchivoDisenos?'Ver Activos':'Archivo Completados'}
    </button>
    <button class="btn btn-primary" onclick="nuevaSolicitud()"><i class="fa fa-plus"></i> Nueva Solicitud</button>
  `);
  if (!window.verArchivoDisenos) window.verArchivoDisenos = false;
  // Separar activos de completados
  const activos    = DB.solicitudes.filter(s => s.status !== 'completado');
  const archivados = DB.solicitudes.filter(s => s.status === 'completado');
  const items = (window.verArchivoDisenos ? archivados : activos).filter(s =>
    !searchQ ||
    (s.brief||'').toLowerCase().includes(searchQ) ||
    getProy(s.proyId)?.nom?.toLowerCase().includes(searchQ)
  );

  if (!items.length) {
    c(`<div class="empty"><i class="fa fa-pen-nib"></i><p>Sin solicitudes de diseño.</p><button class="btn btn-primary" onclick="nuevaSolicitud()"><i class="fa fa-plus"></i> Nueva Solicitud</button></div>`);
    return;
  }

  const PRIOR_BADGE = { Alta:'b-red', Media:'b-amber', Baja:'b-gray' };
  const EST_BADGE   = { pendiente:'b-gray', 'En proceso':'b-blue', completado:'b-green' };
  const EST_LABEL   = { pendiente:'Pendiente', 'En proceso':'En proceso', completado:'Completado' };

  c(`<div class="cards-grid">${items.map(s => {
    const p = getProy(s.proyId);
    const tieneArchivos = (s.files||[]).length > 0;
    const pBadge  = PRIOR_BADGE[s.prioridad] || 'b-gray';
    const eBadge  = EST_BADGE[s.status] || 'b-gray';
    const eLabel  = EST_LABEL[s.status] || s.status;
    const fechaDisp = s.fecha ? s.fecha.split('-').reverse().join('/') : '';
    return `
    <div class="card" onclick="verDetalleSolicitud('${s.id}')" style="cursor:pointer;padding:0;overflow:hidden">
      <div style="padding:16px 16px 12px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <span class="badge ${eBadge}">${eLabel}</span>
            <span class="badge b-purple">${s.tipo||'—'}</span>
            ${s.prioridad ? `<span class="badge ${pBadge}">${s.prioridad}</span>` : ''}
          </div>
        </div>
        <div class="card-name">${p?.nom || 'Sin proyecto'}</div>
        <div class="card-sub">${p?.cli || ''}</div>
        <div class="card-info" style="margin-top:10px">
          ${s.brief ? `<div class="card-row" style="font-size:12px;color:var(--ink3)"><i class="fa fa-align-left"></i>${s.brief.slice(0,70)}${s.brief.length>70?'…':''}</div>` : ''}
          ${fechaDisp ? `<div class="card-row"><i class="fa fa-calendar" style="color:var(--ink3)"></i>Entrega: ${fechaDisp}</div>` : ''}
          ${s.responsable ? `<div class="card-row"><i class="fa fa-user" style="color:var(--ink3)"></i>${s.responsable}</div>` : ''}
        </div>
      </div>
      ${tieneArchivos ? `
      <div style="background:#fff3cd;border-top:1px solid #ffc107;padding:7px 16px;font-size:11px;color:#856404;display:flex;align-items:center;gap:6px">
        <i class="fa fa-exclamation-triangle"></i>
        <span>${(s.files||[]).length} archivo${(s.files||[]).length>1?'s':''} · Se eliminan en 60 días</span>
      </div>` : ''}
    </div>`;
  }).join('')}</div>`);
}

// ── NUEVA SOLICITUD ──
function nuevaSolicitud() {
  editDisId = null;
  document.getElementById('m-dis-title').textContent = 'Nueva Solicitud de Diseño';
  document.getElementById('dis-btn-label').textContent = 'Crear Solicitud';
  document.getElementById('dis-delete-btn').style.display = 'none';
  ['d-brief','d-descripcion','d-requerimientos','d-entregables','d-referencias'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('d-fecha').value = '';
  document.getElementById('d-tipo').value = 'Logo';
  document.getElementById('d-prioridad').value = 'Media';
  document.getElementById('d-responsable').value = 'Equipo de Diseño';
  llenarSelectProyectosD();
  abrir('m-diseno');
}

function nuevaSolicitudPara(proyId) {
  cerrar('m-detalle');
  nuevaSolicitud();
  setTimeout(() => { document.getElementById('d-proy').value = proyId; }, 80);
}

// ── VER DETALLE ──
function verDetalleSolicitud(id) {
  const s = DB.solicitudes.find(x => x.id === id);
  if (!s) return;
  disSolSeleccionada = s;
  renderDetalleSolicitud();
  abrir('m-dis-detalle');
}

// compatibilidad con código viejo
function verSolicitud(id) { verDetalleSolicitud(id); }

function renderDetalleSolicitud() {
  const s = disSolSeleccionada;
  if (!s) return;
  const p = getProy(s.proyId);
  const PRIOR_BADGE = { Alta:'b-red', Media:'b-amber', Baja:'b-gray' };
  const EST_BADGE   = { pendiente:'b-gray', 'En proceso':'b-blue', completado:'b-green' };
  const EST_LABEL   = { pendiente:'Pendiente', 'En proceso':'En proceso', completado:'Completado' };
  const fechaDisp = s.fecha ? s.fecha.split('-').reverse().join('/') : '—';

  document.getElementById('m-dis-det-title').textContent = `Solicitud #${s.id?.slice(-8)||'—'}`;
  document.getElementById('m-dis-det-sub').textContent   = `${p?.nom||'Sin proyecto'} · ${p?.cli||''}`;

  const reqs = Array.isArray(s.requerimientos) ? s.requerimientos.filter(Boolean) : [];
  const ents = Array.isArray(s.entregables)    ? s.entregables.filter(Boolean)    : [];
  const archivos = s.files || [];

  document.getElementById('dis-detalle-body').innerHTML = `
    <!-- Header -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid var(--border)">
      <div style="padding:18px 22px;border-right:1px solid var(--border)">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--ink3);margin-bottom:8px">Proyecto</div>
        <div style="font-size:16px;font-weight:700">${p?.nom||'Sin proyecto'}</div>
        <div style="font-size:12px;color:var(--ink3);margin-top:3px">${p?.cli||''}</div>
      </div>
      <div style="padding:18px 22px">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--ink3);margin-bottom:8px">Detalles</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          <span class="badge b-purple">${s.tipo||'—'}</span>
          <span class="badge ${EST_BADGE[s.status]||'b-gray'}">${EST_LABEL[s.status]||s.status}</span>
          ${s.prioridad ? `<span class="badge ${PRIOR_BADGE[s.prioridad]||'b-gray'}">${s.prioridad}</span>` : ''}
        </div>
      </div>
    </div>

    <!-- Fechas y responsable -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;border-bottom:1px solid var(--border);background:var(--surface2)">
      ${[
        ['Creado', s.creadoEn||'—'],
        ['Entrega', fechaDisp],
        ['Responsable', s.responsable||'Equipo de Diseño']
      ].map(([lbl,val]) => `
        <div style="padding:12px 20px;border-right:1px solid var(--border)">
          <div style="font-size:10px;color:var(--ink3);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">${lbl}</div>
          <div style="font-size:13px;font-weight:600">${val}</div>
        </div>`).join('')}
    </div>

    <!-- Brief -->
    ${s.brief ? `
    <div style="padding:18px 22px;border-bottom:1px solid var(--border)">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--ink3);margin-bottom:8px"><i class="fa fa-align-left" style="margin-right:5px"></i>Brief</div>
      <div style="font-size:14px;line-height:1.6;color:var(--ink2)">${s.brief}</div>
    </div>` : ''}

    <!-- Descripción -->
    ${s.descripcionCompleta ? `
    <div style="padding:18px 22px;border-bottom:1px solid var(--border)">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--ink3);margin-bottom:8px"><i class="fa fa-file-alt" style="margin-right:5px"></i>Descripción completa</div>
      <div style="font-size:13px;line-height:1.7;color:var(--ink2)">${s.descripcionCompleta}</div>
    </div>` : ''}

    <!-- Requerimientos -->
    ${reqs.length ? `
    <div style="padding:18px 22px;border-bottom:1px solid var(--border)">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--ink3);margin-bottom:10px"><i class="fa fa-check-square" style="margin-right:5px"></i>Requerimientos</div>
      <ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:5px">
        ${reqs.map(r => `<li style="font-size:13px;color:var(--ink2)">${r}</li>`).join('')}
      </ul>
    </div>` : ''}

    <!-- Entregables -->
    ${ents.length ? `
    <div style="padding:18px 22px;border-bottom:1px solid var(--border);background:var(--accent-lt)">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--accent);margin-bottom:10px"><i class="fa fa-box" style="margin-right:5px"></i>Entregables</div>
      <ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:5px;border-left:3px solid var(--accent);padding-left:14px;list-style:none">
        ${ents.map(e => `<li style="font-size:13px;color:var(--ink2)"><i class="fa fa-check" style="color:var(--accent);margin-right:6px;font-size:10px"></i>${e}</li>`).join('')}
      </ul>
    </div>` : ''}

    <!-- Referencias -->
    ${s.referencias ? `
    <div style="padding:18px 22px;border-bottom:1px solid var(--border);background:var(--amber-lt)">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--amber);margin-bottom:8px"><i class="fa fa-images" style="margin-right:5px"></i>Referencias visuales</div>
      <div style="font-size:13px;line-height:1.6;color:var(--ink2)">${s.referencias}</div>
    </div>` : ''}

    <!-- Archivos -->
    <div style="padding:18px 22px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--ink3);margin-bottom:10px"><i class="fa fa-paperclip" style="margin-right:5px"></i>Archivos adjuntos</div>
      ${archivos.length ? `
        <div style="display:flex;flex-direction:column;gap:0;border:1px solid var(--border);border-radius:var(--r);overflow:hidden">
          ${archivos.map((a,i) => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:${i<archivos.length-1?'1px solid var(--border)':'none'};background:var(--surface)">
            <div style="display:flex;align-items:center;gap:10px">
              <i class="fa fa-file" style="color:var(--ink3);font-size:16px"></i>
              <div>
                <div style="font-size:13px;font-weight:500">${a.nombre||a.name||'Archivo'}</div>
                <div style="font-size:11px;color:var(--ink4)">${((a.tamano||a.size||0)/1024/1024).toFixed(2)} MB</div>
              </div>
            </div>
          </div>`).join('')}
        </div>
        <div style="margin-top:10px;padding:8px 12px;background:#fff3cd;border:1px solid #ffc107;border-radius:var(--r);font-size:11px;color:#856404;display:flex;gap:8px;align-items:center">
          <i class="fa fa-exclamation-triangle"></i>
          <span>Los archivos se eliminan automáticamente a los 60 días para optimizar almacenamiento.</span>
        </div>
      ` : `
        <div style="text-align:center;padding:24px;color:var(--ink4)">
          <i class="fa fa-folder-open" style="font-size:28px;margin-bottom:8px;display:block;opacity:.3"></i>
          <div style="font-size:12px">Sin archivos adjuntos</div>
          <button class="btn btn-secondary btn-sm" onclick="abrirSubirArchivos()" style="margin-top:10px"><i class="fa fa-upload"></i> Subir archivos</button>
        </div>
      `}
    </div>`;
}

// ── EDITAR SOLICITUD ──
function editarSolicitudDesde() {
  const s = disSolSeleccionada;
  if (!s) return;
  editDisId = s.id;
  document.getElementById('m-dis-title').textContent = 'Editar Solicitud';
  document.getElementById('dis-btn-label').textContent = 'Guardar Cambios';
  document.getElementById('dis-delete-btn').style.display = 'block';
  llenarSelectProyectosD();
  setTimeout(() => {
    document.getElementById('d-proy').value = s.proyId || '';
    document.getElementById('d-tipo').value = s.tipo || 'Logo';
    document.getElementById('d-prioridad').value = s.prioridad || 'Media';
    document.getElementById('d-fecha').value = s.fecha || '';
    document.getElementById('d-responsable').value = s.responsable || 'Equipo de Diseño';
    document.getElementById('d-brief').value = s.brief || '';
    document.getElementById('d-descripcion').value = s.descripcionCompleta || '';
    document.getElementById('d-requerimientos').value = (s.requerimientos||[]).join(', ');
    document.getElementById('d-entregables').value = (s.entregables||[]).join(', ');
    document.getElementById('d-referencias').value = s.referencias || '';
  }, 50);
  cerrar('m-dis-detalle');
  abrir('m-diseno');
}

function llenarSelectProyectosD() {
  const sel = document.getElementById('d-proy');
  sel.innerHTML = '<option value="">— Seleccionar proyecto —</option>' +
    DB.proyectos.map(p => `<option value="${p.id}">${p.nom} (${p.cli||''})</option>`).join('');
}

function guardarDiseno() {
  const proyId = document.getElementById('d-proy').value;
  if (!proyId) { alert('Seleccioná un proyecto'); return; }
  const brief = v('d-brief');
  if (!brief) { alert('El brief es obligatorio'); return; }
  const fecha = v('d-fecha');
  if (!fecha) { alert('La fecha de entrega es obligatoria'); return; }

  const reqs = v('d-requerimientos').split(',').map(x=>x.trim()).filter(Boolean);
  const ents = v('d-entregables').split(',').map(x=>x.trim()).filter(Boolean);

  const data = {
    proyId,
    tipo:               document.getElementById('d-tipo').value,
    prioridad:          document.getElementById('d-prioridad').value,
    fecha,
    responsable:        v('d-responsable') || 'Equipo de Diseño',
    brief,
    descripcionCompleta: v('d-descripcion'),
    requerimientos:     reqs,
    entregables:        ents,
    referencias:        v('d-referencias'),
    status:             editDisId ? (DB.solicitudes.find(x=>x.id===editDisId)?.status || 'pendiente') : 'pendiente'
  };

  if (editDisId) {
    const i = DB.solicitudes.findIndex(x => x.id === editDisId);
    if (i >= 0) {
      DB.solicitudes[i] = { ...DB.solicitudes[i], ...data };
      disSolSeleccionada = DB.solicitudes[i];
    }
  } else {
    const nueva = { ...data, id: 'sol-'+Date.now(), creadoEn: hoy(), files: [] };
    DB.solicitudes.push(nueva);
    disSolSeleccionada = nueva;
  }
  guardar();
  cerrar('m-diseno');
  go(modulo);
}

function eliminarSolicitud() {
  if (!confirm('¿Eliminar esta solicitud? Esta acción no se puede deshacer.')) return;
  DB.solicitudes = DB.solicitudes.filter(x => x.id !== editDisId);
  guardar();
  cerrar('m-diseno');
  go(modulo);
}

// ── CAMBIAR ESTADO ──
function abrirCambiarEstado() {
  const s = disSolSeleccionada;
  if (!s) return;
  const p = getProy(s.proyId);
  document.getElementById('dis-est-nombre').textContent = p?.nom || '—';
  const badgeEl = document.getElementById('dis-est-actual');
  const EST_BADGE = { pendiente:'b-gray', 'En proceso':'b-blue', completado:'b-green' };
  badgeEl.className = `badge ${EST_BADGE[s.status]||'b-gray'}`;
  badgeEl.textContent = s.status;
  document.getElementById('dis-nuevo-estado').value = s.status;
  abrir('m-dis-estado');
}

function guardarEstadoSolicitud() {
  const nuevoEstado = document.getElementById('dis-nuevo-estado').value;
  const s = disSolSeleccionada;
  if (!s) return;
  const i = DB.solicitudes.findIndex(x => x.id === s.id);
  if (i >= 0) { DB.solicitudes[i].status = nuevoEstado; disSolSeleccionada = DB.solicitudes[i]; }

  // ── TRAZABILIDAD: si se marca completado, notificar en proyecto ──
  if (nuevoEstado === 'completado' && s.proyId) {
    const pi = DB.proyectos.findIndex(x => x.id === s.proyId);
    if (pi >= 0) {
      if (!DB.proyectos[pi].diseniosCompletados) DB.proyectos[pi].diseniosCompletados = [];
      DB.proyectos[pi].diseniosCompletados.push({
        solId: s.id,
        tipo: s.tipo || '—',
        brief: s.brief || '',
        fechaCompletado: new Date().toISOString().slice(0,10)
      });
    }
  }

  guardar();
  cerrar('m-dis-estado');
  renderDetalleSolicitud();
  go(modulo);
}

// ── SUBIR ARCHIVOS ──
function abrirSubirArchivos() {
  const s = disSolSeleccionada;
  if (!s) return;
  const p = getProy(s.proyId);
  document.getElementById('dis-arch-sub').textContent = `${p?.nom||'—'} · ${s.tipo||''}`;
  renderDisArchivos();
  abrir('m-dis-archivos');
}

function renderDisArchivos() {
  const s = disSolSeleccionada;
  if (!s) return;
  const archivos = s.files || [];
  document.getElementById('dis-arch-count').textContent = `Archivos adjuntos (${archivos.length})`;
  document.getElementById('dis-arch-lista').innerHTML = archivos.length
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
          <button onclick="disEliminarArchivo(${i})" style="color:var(--red);padding:4px 8px;border-radius:var(--r)" title="Eliminar"><i class="fa fa-trash"></i></button>
        </div>
      </div>`).join('')
    : '<div style="text-align:center;padding:20px;color:var(--ink4);font-size:12px">Sin archivos adjuntos</div>';
}

function disAgregarArchivos(files) {
  const s = disSolSeleccionada;
  if (!s || !files || files.length === 0) return;
  if (!s.files) s.files = [];
  Array.from(files).forEach(f => {
    s.files.push({
      nombre: f.name,
      tamano: f.size,
      tipo: f.type,
      fecha: new Date().toISOString()
    });
  });
  const i = DB.solicitudes.findIndex(x => x.id === s.id);
  if (i >= 0) DB.solicitudes[i] = s;
  guardar();
  renderDisArchivos();
  renderDetalleSolicitud();
  document.getElementById('dis-file-input').value = '';
}

function disEliminarArchivo(idx) {
  const s = disSolSeleccionada;
  if (!s) return;
  s.files = (s.files||[]).filter((_,i) => i !== idx);
  const i = DB.solicitudes.findIndex(x => x.id === s.id);
  if (i >= 0) DB.solicitudes[i] = s;
  guardar();
  renderDisArchivos();
  renderDetalleSolicitud();
}

function disDrop(event) {
  event.preventDefault();
  document.getElementById('dis-dropzone').style.borderColor = 'var(--border)';
  const files = event.dataTransfer?.files;
  if (files) disAgregarArchivos(files);
}

// Alias legacy
function adjuntarArchivo() {}
function renderFiles() {}

// ══════════════════════════════════════════════════════
// PRESUPUESTOS — CRUD DEL MODAL
// ══════════════════════════════════════════════════════

function nuevoPpto() {
  editPptoId = null;
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
    c('<div class="empty"><i class="fa fa-lock"></i><p>Acceso denegado.</p></div>');
    return;
  }
  const pendientes = DB.usuarios.filter(u => u.status === 'pendiente');
  const activos = DB.usuarios.filter(u => u.status === 'activo');
  const inactivos = DB.usuarios.filter(u => u.status === 'inactivo');

  c(`
    ${pendientes.length ? `
    <div style="background:var(--amber-lt);border:1px solid var(--amber);border-radius:var(--r-lg);padding:14px 18px;margin-bottom:18px">
      <div style="font-size:12px;font-weight:700;color:var(--amber);margin-bottom:10px">
        <i class="fa fa-clock"></i> ${pendientes.length} usuario(s) esperando aprobación
      </div>
      ${pendientes.map(u => usrCard(u)).join('')}
    </div>` : ''}

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--ink2)">
        Usuarios activos (${activos.length})
      </div>
    </div>
    ${activos.map(u => usrCard(u)).join('')}

    ${inactivos.length ? `
    <div style="margin-top:20px">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--ink3);margin-bottom:10px">
        Inactivos (${inactivos.length})
      </div>
      ${inactivos.map(u => usrCard(u)).join('')}
    </div>` : ''}
  `);
}

function usrCard(u) {
  const ini = u.nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const colores = ['#2952d9', '#1a7a4a', '#6d3cbf', '#0e7490', '#b55800'];
  const col = colores[u.nombre.charCodeAt(0) % colores.length];
  const statusBadge = { activo: 'b-green', pendiente: 'b-amber', inactivo: 'b-red' }[u.status] || 'b-gray';
  const modsBadges = (u.modulos || []).filter(m => m !== 'usuarios')
    .map(m => { const mod = MODULOS_ALL.find(x => x.id === m); return mod ? `<span class="badge b-blue" style="font-size:9px">${mod.label}</span>` : ''; }).join(' ');
  return `<div class="usr-card">
    <div class="usr-avatar" style="background:${col}">${ini}</div>
    <div class="usr-info">
      <div class="usr-name">${u.nombre} ${u.id === CURRENT_USER?.id ? '<span style="font-size:10px;color:var(--ink3)">(vos)</span>' : ''}</div>
      <div class="usr-meta">${u.email} · <span class="badge ${statusBadge}" style="font-size:9px">${u.status}</span></div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">${modsBadges}</div>
      ${u.nota ? `<div style="font-size:11px;color:var(--ink3);margin-top:4px;font-style:italic">${u.nota}</div>` : ''}
    </div>
    <button class="btn btn-secondary btn-sm" onclick="editarUsuario('${u.id}')"><i class="fa fa-edit"></i> Editar</button>
  </div>`;
}

function editarUsuario(id) {
  editUsrId = id;
  const u = DB.usuarios.find(x => x.id === id);
  if (!u) return;
  const ini = u.nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const colores = ['#2952d9', '#1a7a4a', '#6d3cbf', '#0e7490', '#b55800'];
  const col = colores[u.nombre.charCodeAt(0) % colores.length];
  document.getElementById('m-usr-title').textContent = 'Editar: ' + u.nombre;
  document.getElementById('m-usr-avatar').textContent = ini;
  document.getElementById('m-usr-avatar').style.background = col;
  document.getElementById('m-usr-name').textContent = u.nombre;
  document.getElementById('m-usr-email').textContent = u.email;
  document.getElementById('m-usr-status').value = u.status;
  document.getElementById('m-usr-nota').value = u.nota || '';

  // Render módulos toggleables
  const grid = document.getElementById('m-usr-modulos');
  const usrMods = u.modulos || [];
  grid.innerHTML = MODULOS_ALL.map(m => `
    <div class="mod-toggle ${usrMods.includes(m.id) ? 'on' : 'off'}" id="tog-${m.id}"
      onclick="toggleModulo('${m.id}')">
      <i class="fa ${m.icon}" style="display:block;margin-bottom:4px;font-size:14px"></i>
      ${m.label}
    </div>`).join('');

  // Botón admin (módulo usuarios)
  const isAdmin = usrMods.includes('usuarios');
  grid.innerHTML += `<div class="mod-toggle ${isAdmin ? 'on' : 'off'}" id="tog-usuarios"
    onclick="toggleModulo('usuarios')">
    <i class="fa fa-users-cog" style="display:block;margin-bottom:4px;font-size:14px"></i>Admin
  </div>`;

  abrir('m-usuario');
}

function toggleModulo(modId) {
  const el = document.getElementById('tog-' + modId);
  if (!el) return;
  el.classList.toggle('on');
  el.classList.toggle('off');
}

function guardarUsuario() {
  const u = DB.usuarios.find(x => x.id === editUsrId);
  if (!u) return;
  u.status = document.getElementById('m-usr-status').value;
  u.nota = document.getElementById('m-usr-nota').value.trim();
  // Recoger módulos seleccionados
  const todosLosIds = [...MODULOS_ALL.map(m => m.id), 'usuarios'];
  u.modulos = todosLosIds.filter(id => {
    const el = document.getElementById('tog-' + id);
    return el && el.classList.contains('on');
  });
  // dashboard siempre incluido si está activo
  if (u.status === 'activo' && !u.modulos.includes('dashboard')) u.modulos.unshift('dashboard');
  guardar();
  cerrar('m-usuario');
  go('usuarios');
}

function eliminarUsuario() {
  if (editUsrId === CURRENT_USER?.id) { alert('No podés eliminar tu propia cuenta.'); return; }
  if (!confirm('¿Eliminar este usuario permanentemente?')) return;
  DB.usuarios = DB.usuarios.filter(x => x.id !== editUsrId);
  guardar();
  cerrar('m-usuario');
  go('usuarios');
}

// ═══════════════════════════════════════════════
// HELPERS VISUALES
// ═══════════════════════════════════════════════
function score(s) {
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
