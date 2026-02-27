📄 ARCHIVO 4: js/auth.js (COMPLETO)
Copiá todo esto y pegalo en tu archivo js/auth.js:

/* ══════════════════════════════════════════════
   FORMA — Sistema de Autenticación
   ══════════════════════════════════════════════ */

// ══════════════════════════════════════════════
// VERIFICAR AUTENTICACIÓN
// ══════════════════════════════════════════════
function verificarAuth() {
  const authData = localStorage.getItem(AUTH_KEY);
  
  if (authData) {
    try {
      const { userId } = JSON.parse(authData);
      const user = DB.usuarios.find(u => u.id === userId);
      
      if (user && user.status === 'activo') {
        CURRENT_USER = user;
        mostrarApp();
        return;
      }
    } catch (e) {
      console.error('Error al verificar auth:', e);
    }
  }
  
  // Si no hay sesión válida, mostrar pantalla de login
  mostrarAuth();
}

// ══════════════════════════════════════════════
// MOSTRAR PANTALLA DE AUTH
// ══════════════════════════════════════════════
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
    document.getElementById('sb-sec-admin').style.display = 'block';
    document.getElementById('nav-administracion').style.display = 'flex';
    document.getElementById('nav-financiero').style.display = 'flex';
    document.getElementById('nav-usuarios').style.display = 'flex';
  } else {
    document.getElementById('sb-sec-admin').style.display = 'none';
    document.getElementById('nav-administracion').style.display = 'none';
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
