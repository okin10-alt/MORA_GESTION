/* ══════════════════════════════════════════════ FORMA — Sistema de Autenticación ══════════════════════════════════════════════ */

// ── Helpers internos ────────────────────────────────────── 
function _el(id) { return document.getElementById(id); }
function _setDisplay(id, val) { const el = _el(id); if (el) el.style.display = val; }

// ── Verificar autenticación al arrancar ─────────────────── 
function verificarAuth() {
  const authData = localStorage.getItem(AUTH_KEY);
  if (authData) {
    try {
      const { userId } = JSON.parse(authData);
      const user = DB.usuarios && DB.usuarios.find(u => u.id === userId);
      if (user && user.status === 'activo') {
        CURRENT_USER = user;
        mostrarApp();
        return;
      }
    } catch (e) {
      console.error('Error al verificar auth:', e);
    }
  }
  mostrarAuth();
}

// ── Mostrar pantalla de login ───────────────────────────── 
function mostrarAuth() {
  const authScreen = _el('auth-screen');
  if (authScreen) {
    authScreen.style.display = 'flex';
    authScreen.classList.remove('hidden');
  }
  const app = document.querySelector('.app');
  if (app) app.style.display = 'none';
}

// ── Mostrar aplicación ──────────────────────────────────── 
function mostrarApp() {
  const authScreen = _el('auth-screen');
  if (authScreen) {
    authScreen.style.display = 'none';
    authScreen.classList.add('hidden');
  }
  const app = document.querySelector('.app');
  if (app) app.style.display = 'flex';
  actualizarSidebarUser();
  actualizarModulosVisibles();
  if (typeof go === 'function') {
    // Respetar módulos asignados: ir al primero de la lista, nunca forzar dashboard
    const modulosAsignados = CURRENT_USER && CURRENT_USER.modulos && CURRENT_USER.modulos.length > 0
      ? CURRENT_USER.modulos
      : ['dashboard'];
    go(modulosAsignados[0]);
  }
}

// ── Actualizar info usuario en sidebar ──────────────────── 
function actualizarSidebarUser() {
  if (!CURRENT_USER) return;
  const iniciales = CURRENT_USER.nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const colores = ['#2952d9', '#1a7a4a', '#6d3cbf', '#0e7490', '#b55800'];
  const color = colores[CURRENT_USER.nombre.charCodeAt(0) % colores.length];
  const avatar = _el('sb-avatar');
  if (avatar) {
    avatar.textContent = iniciales;
    avatar.style.background = color;
  }
  const uname = _el('sb-uname');
  if (uname) uname.textContent = CURRENT_USER.nombre;
  const urole = _el('sb-urole');
  if (urole) urole.textContent = CURRENT_USER.rol === 'admin' ? 'Acceso total' : 'Usuario';
}

// ── Actualizar módulos visibles según permisos ──────────── 
function actualizarModulosVisibles() {
  if (!CURRENT_USER) return;
  const modulos = CURRENT_USER.modulos || [];
  const esAdmin = CURRENT_USER.rol === 'admin' || modulos.includes('usuarios');

  // Sección admin (si existe en el DOM)
  _setDisplay('sb-sec-admin', esAdmin ? 'block' : 'none');
  _setDisplay('nav-administracion', esAdmin ? 'flex' : 'none');
  _setDisplay('nav-financiero', esAdmin ? 'flex' : 'none');
  _setDisplay('nav-usuarios', esAdmin ? 'flex' : 'none');

  // Mostrar/ocultar cada módulo según permisos
  if (typeof MODULOS_ALL !== 'undefined') {
    MODULOS_ALL.forEach(mod => {
      const navItem = _el('nav-' + mod.id);
      if (navItem) {
        navItem.style.display = (esAdmin || modulos.includes(mod.id)) ? 'flex' : 'none';
      }
    });
  }
}

// ── Cambiar tab Auth (Login/Registro) ─────────────────────  
function switchAuthTab(tab) {
  const tabLogin = _el('tab-login');
  const tabReg = _el('tab-registro');
  const formLogin = _el('auth-login');
  const formReg = _el('auth-registro');
  if (tabLogin) tabLogin.classList.toggle('active', tab === 'login');
  if (tabReg) tabReg.classList.toggle('active', tab === 'registro');
  if (formLogin) formLogin.style.display = tab === 'login' ? 'block' : 'none';
  if (formReg) formReg.style.display = tab === 'registro' ? 'block' : 'none';
  const msgLogin = _el('auth-login-msg');
  const msgReg = _el('auth-reg-msg');
  if (msgLogin) msgLogin.style.display = 'none';
  if (msgReg) msgReg.style.display = 'none';
}

// ── Login ───────────────────────────────────────────────── 
function doLogin() {
  const emailEl = _el('au-email');
  const passEl = _el('au-pass');
  const msgEl = _el('auth-login-msg');
  const email = emailEl ? emailEl.value.trim() : '';
  const pass = passEl ? passEl.value : '';
  if (!email || !pass) {
    mostrarMensaje(msgEl, 'Completá todos los campos', 'err');
    return;
  }
  if (!DB || !DB.usuarios) {
    mostrarMensaje(msgEl, 'Error al cargar datos. Recargá la página.', 'err');
    return;
  }
  const user = DB.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    mostrarMensaje(msgEl, 'Usuario no encontrado', 'err');
    return;
  }
  let passCorrecta = false;
  try {
    passCorrecta = atob(user.passHash) === pass;
  } catch(e) {
    passCorrecta = user.passHash === pass;
  }
  if (!passCorrecta) {
    mostrarMensaje(msgEl, 'Contraseña incorrecta', 'err');
    return;
  }
  if (user.status !== 'activo') {
    mostrarMensaje(msgEl, 'Usuario inactivo. Contactá al administrador.', 'err');
    return;
  }
  localStorage.setItem(AUTH_KEY, JSON.stringify({ userId: user.id }));
  CURRENT_USER = user;
  mostrarMensaje(msgEl, '¡Bienvenido/a, ' + user.nombre + '!', 'ok');
  setTimeout(() => { mostrarApp(); }, 800);
}

// ── Registro ────────────────────────────────────────────── 
function doRegistro() {
  const nombre = (_el('au-rnom') || {}).value?.trim() || '';
  const email = (_el('au-remail') || {}).value?.trim() || '';
  const pass = (_el('au-rpass') || {}).value || '';
  const pass2 = (_el('au-rpass2') || {}).value || '';
  const msgEl = _el('auth-reg-msg');
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
  if (DB.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    mostrarMensaje(msgEl, 'Este email ya está registrado', 'err');
    return;
  }
  const nuevoUsuario = {
    id: uid(),
    nombre,
    email,
    passHash: btoa(pass),
    status: 'pendiente',
    rol: 'user',
    nota: 'Registro desde web',
    modulos: [],
    creadoEn: new Date().toLocaleDateString('es-AR')
  };
  DB.usuarios.push(nuevoUsuario);
  guardar();
  mostrarMensaje(msgEl, '✅ Solicitud enviada. Un administrador debe activar tu cuenta.', 'ok');
  ['au-rnom','au-remail','au-rpass','au-rpass2'].forEach(id => {
    const el = _el(id);
    if (el) el.value = '';
  });
  setTimeout(() => { switchAuthTab('login'); }, 2500);
}

// ── Logout ──────────────────────────────────────────────── 
function doLogout() {
  if (!confirm('¿Cerrar sesión?')) return;
  localStorage.removeItem(AUTH_KEY);
  CURRENT_USER = null;
  const emailEl = _el('au-email');
  const passEl = _el('au-pass');
  if (emailEl) emailEl.value = '';
  if (passEl) passEl.value = '';
  mostrarAuth();
  switchAuthTab('login');
}

// ── Mostrar mensaje ─────────────────────────────────────── 
function mostrarMensaje(elemento, texto, tipo) {
  if (!elemento) return;
  elemento.textContent = texto;
  elemento.className = 'auth-msg ' + tipo;
  elemento.style.display = 'block';
  if (tipo === 'err') {
    setTimeout(() => { elemento.style.display = 'none'; }, 4000);
  }
}
