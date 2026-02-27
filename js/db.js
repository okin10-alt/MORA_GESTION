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
  { id: 'administracion', label: 'Gastos & RRHH', icon: 'fa-briefcase' },
  { id: 'financiero', label: 'Financiero', icon: 'fa-chart-line' }
];

// ══════════════════════════════════════════════
// INICIALIZAR BASE DE DATOS
// ══════════════════════════════════════════════
function initDB() {
  return {
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
        modulos: ['dashboard', 'leads', 'ventas', 'gestion', 'diseno', 'presupuestos', 'contable', 'administracion', 'financiero', 'usuarios'],
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
});
