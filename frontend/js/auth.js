// =====================================================
// AUTH – Gestión de sesión por sessionStorage
// =====================================================

// Mapeo de roles a etiquetas legibles
const ROL_LABELS = {
  almacenista:   'Monitor de control',
  cordinador:    'Cordinador',
  control_obra:  'Control de Obra',
  residente:     'Residente',
  administrador: 'Administrador'
};

// Vistas permitidas por rol
const ROL_VIEWS = {
  almacenista:   ['dashboard', 'nueva-solicitud', 'recepcion', 'historial', 'historial-proceso', 'inventario', 'devolucion'],
  cordinador:    ['autorizacion'],
  control_obra:  ['dashboard', 'autorizacion', 'historial', 'historial-proceso', 'inventario', 'devolucion'],
  residente:     ['dashboard', 'autorizacion', 'recepcion', 'historial', 'historial-proceso', 'inventario', 'devolucion'],
  administrador: ['dashboard', 'nueva-solicitud', 'autorizacion', 'recepcion', 'historial', 'historial-proceso', 'inventario', 'devolucion',
                  'empresas', 'centros-costo', 'insumos', 'usuarios']
};

function getUser() {
  try {
    const raw = sessionStorage.getItem('gu_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function setUser(user) {
  sessionStorage.setItem('gu_user', JSON.stringify(user));
}

function logout() {
  sessionStorage.removeItem('gu_user');
  sessionStorage.removeItem('gu_token');
  window.location.href = 'login.html';
}

function hasRole(roles) {
  const user = getUser();
  if (!user) return false;
  return roles.includes(user.rol);
}

// Returns the empresa_id of the current user, or null if admin/residente (sees everything)
function getUserEmpresaId() {
  const user = getUser();
  if (!user) return null;
  if (user.rol === 'administrador' || user.rol === 'residente') return null; // admin/residente sees all
  return user.empresa_id || null;
}

// Returns the cc_ids of the current user as an array, or null if admin/residente
function getUserCcIds() {
  const user = getUser();
  if (!user) return null;
  if (user.rol === 'administrador' || user.rol === 'residente') return null; // admin/residente sees all
  if (!user.cc_ids) return [];
  return String(user.cc_ids).split(',').map(c => c.trim()).filter(Boolean);
}

function canAccessView(view) {
  const user = getUser();
  if (!user) return false;
  const allowed = ROL_VIEWS[user.rol] || [];
  return allowed.includes(view);
}

// Redirigir a login si no hay sesión activa
(function checkSession() {
  if (!getUser()) {
    window.location.href = 'login.html';
  }
})();

// Poblar info de usuario en el topbar
document.addEventListener('DOMContentLoaded', () => {
  const user = getUser();
  if (!user) return;

  // Nombre y rol en topbar
  const topbarRight = document.getElementById('topbar-user');
  if (topbarRight) {
    topbarRight.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px">
        <div style="text-align:right;line-height:1.3">
          <div style="font-size:13px;font-weight:700;color:#111">${user.nombre}</div>
          <div style="font-size:10px;font-weight:600;color:#61a60e;text-transform:uppercase;letter-spacing:.5px">
            ${ROL_LABELS[user.rol] || user.rol}
          </div>
        </div>
        <div style="width:34px;height:34px;background:#61a60e;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:800">
          ${user.nombre.charAt(0).toUpperCase()}
        </div>
        <button onclick="logout()" title="Cerrar sesión"
          style="background:none;border:1px solid #ddd;border-radius:6px;padding:6px 8px;cursor:pointer;color:#888;display:flex;align-items:center;transition:all .15s"
          onmouseover="this.style.background='#f5f5f5';this.style.color='#c0392b'"
          onmouseout="this.style.background='none';this.style.color='#888'">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
        </button>
      </div>`;
  }

  // Filtrar nav links según rol
  const allowed = ROL_VIEWS[user.rol] || [];
  document.querySelectorAll('.nav-link[data-view]').forEach(link => {
    const view = link.dataset.view;
    if (!allowed.includes(view)) {
      link.style.display = 'none';
    }
  });

  // Ocultar secciones del nav que queden vacías
  document.querySelectorAll('#sidebar nav').forEach(nav => {
    const sections = nav.querySelectorAll('.nav-section');
    sections.forEach(section => {
      // Obtener todos los links que siguen a esta sección hasta la siguiente
      let next = section.nextElementSibling;
      let hasVisible = false;
      while (next && !next.classList.contains('nav-section')) {
        if (next.style.display !== 'none' && next.classList.contains('nav-link')) {
          hasVisible = true;
        }
        next = next.nextElementSibling;
      }
      if (!hasVisible) section.style.display = 'none';
    });
  });
});

// Interceptor global de fetch para inyectar token de sesión en la cabecera Authorization
const originalFetch = window.fetch;
window.fetch = function (url, options) {
  options = options || {};
  
  // No inyectar token si la petición es al login o a las APIs públicas
  const isUrlString = typeof url === 'string';
  const isPublicApi = isUrlString && (url.includes('/api/auth/login') || url.includes('/api/public/'));
  
  if (isPublicApi) {
    return originalFetch(url, options);
  }

  options.headers = options.headers || {};
  const token = sessionStorage.getItem('gu_token');
  if (token) {
    if (options.headers instanceof Headers) {
      options.headers.set('Authorization', 'Bearer ' + token);
    } else if (Array.isArray(options.headers)) {
      options.headers.push(['Authorization', 'Bearer ' + token]);
    } else {
      options.headers['Authorization'] = 'Bearer ' + token;
    }
  }

  return originalFetch(url, options).then(response => {
    // Si el backend responde 401 Unauthorized, redirigir automáticamente al login
    if (response.status === 401) {
      sessionStorage.removeItem('gu_user');
      sessionStorage.removeItem('gu_token');
      window.location.href = 'login.html';
    }
    return response;
  });
};

