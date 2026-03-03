// FORMA — módulo: core


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
document.addEventListener('DOMContentLoaded', function() {
  cargarDB();
  verificarAuth();
  setTimeout(actualizarBadgeGestion, 500);
});

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
