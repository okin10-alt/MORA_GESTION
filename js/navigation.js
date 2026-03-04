/* ══════════════════════════════════════════════
   FORMA — Sistema de Navegación
══════════════════════════════════════════════ */

// ══════════════════════════════════════════════
// NAVEGACIÓN PRINCIPAL
// ══════════════════════════════════════════════
function go(modulo) {
  // Verificar que el usuario tenga acceso
  if (!CURRENT_USER) {
    mostrarAuth();
    return;
  }
  if (!CURRENT_USER.modulos.includes(modulo) && modulo !== 'usuarios') {
    alert('No tenés acceso a este módulo');
    return;
  }
  // Verificar módulo usuarios requiere permiso especial
  if (modulo === 'usuarios' && !CURRENT_USER.modulos.includes('usuarios')) {
    alert('No tenés acceso a este módulo');
    return;
  }

  // Actualizar nav activo
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  const navItem = document.getElementById('nav-' + modulo);
  if (navItem) {
    navItem.classList.add('active');
  }

  // Cargar módulo
  switch (modulo) {
    case 'dashboard':      renderDashboard();      break;
    case 'leads':          renderLeads();          break;
    case 'ventas':         renderVentas();         break;
    case 'gestion':        renderGestion();        break;
    case 'diseno':         renderDiseno();         break;
    case 'presupuestos':   renderPresupuestos();   break;
    case 'contable':       renderContable();       break;
    case 'administracion': renderAdministracion(); break;
    case 'financiero':     renderFinanciero();     break;
    case 'usuarios':       renderUsuarios();       break;
    case 'agente':         renderAgente();         break;
    case 'manual':         renderManual();         break;
    default:               renderDashboard();
  }
}

// ══════════════════════════════════════════════
// TOGGLE SIDEBAR (Mobile)
// ══════════════════════════════════════════════
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const app = document.querySelector('.app');
  sidebar.classList.toggle('open');
  app.classList.toggle('sidebar-open');
}

// Cerrar sidebar al hacer click fuera (mobile)
document.addEventListener('click', function(e) {
  const sidebar = document.querySelector('.sidebar');
  const toggleBtn = document.querySelector('.sidebar-toggle');
  if (window.innerWidth <= 768 && sidebar.classList.contains('open') &&
      !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
    toggleSidebar();
  }
});

// ══════════════════════════════════════════════
// TOGGLE MENÚ USUARIO
// ══════════════════════════════════════════════
function toggleUserMenu() {
  const menu = document.getElementById('sb-umenu');
  menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

// Cerrar menú usuario al hacer click fuera
document.addEventListener('click', function(e) {
  const userBlock = document.querySelector('.sb-user');
  const menu = document.getElementById('sb-umenu');
  if (!userBlock.contains(e.target) && menu.style.display === 'block') {
    menu.style.display = 'none';
  }
});

// ══════════════════════════════════════════════
// UTILIDADES DE NAVEGACIÓN
// ══════════════════════════════════════════════
function volverAtras(moduloDestino) {
  if (moduloDestino) {
    go(moduloDestino);
  } else {
    const navActivo = document.querySelector('.nav-item.active');
    if (navActivo) {
      const moduloId = navActivo.id.replace('nav-', '');
      go(moduloId);
    } else {
      go('dashboard');
    }
  }
}

function scrollToTop() {
  const content = document.getElementById('content');
  if (content) {
    content.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// ══════════════════════════════════════════════
// BREADCRUMBS (opcional)
// ══════════════════════════════════════════════
function actualizarBreadcrumb(items) {
  // Placeholder para futuras mejoras
}

// ══════════════════════════════════════════════
// DETECCIÓN DE CAMBIOS NO GUARDADOS
// ══════════════════════════════════════════════
let cambiosSinGuardar = false;
function marcarCambiosSinGuardar()  { cambiosSinGuardar = true; }
function limpiarCambiosSinGuardar() { cambiosSinGuardar = false; }
function verificarCambiosSinGuardar() {
  if (cambiosSinGuardar) {
    return confirm('Tenés cambios sin guardar. ¿Querés salir igualmente?');
  }
  return true;
}

// Sobrescribir go para verificar cambios
const goOriginal = go;
go = function(modulo) {
  if (verificarCambiosSinGuardar()) {
    limpiarCambiosSinGuardar();
    goOriginal(modulo);
  }
};
