// =====================================================
// ROUTER
// =====================================================

const VIEWS = {
  'dashboard':      { title: 'Dashboard',                    render: renderDashboard },
  'nueva-solicitud':{ title: 'Nueva Solicitud de Traspaso',  render: renderNuevaSolicitud },
  'autorizacion':   { title: 'Autorización de Traspasos',    render: renderAutorizacion },
  'recepcion':      { title: 'Recepción de Material',        render: renderRecepcion },
  'historial':      { title: 'Historial de Movimientos',     render: renderHistorial },
  'devolucion':     { title: 'Nueva Devolución',             render: renderDevolucion },
  'empresas':       { title: 'Empresas',                     render: renderEmpresas },
  'centros-costo':  { title: 'Centros de Costo',             render: renderCentrosCosto },
  'insumos':        { title: 'Catálogo de Insumos',          render: renderInsumos },
  'usuarios':       { title: 'Gestión de Usuarios',          render: renderUsuarios },
};

let currentView = 'dashboard';

function navigate(view) {
  if (!VIEWS[view]) return;

  // Verificar permiso de rol
  if (typeof canAccessView === 'function' && !canAccessView(view)) {
    document.getElementById('content').innerHTML = `
      <div class="card" style="max-width:500px;margin:60px auto">
        <div class="card-body" style="text-align:center;padding:40px">
          <div style="font-size:40px;margin-bottom:12px">🔒</div>
          <div style="font-size:16px;font-weight:700;margin-bottom:8px">Acceso restringido</div>
          <div style="font-size:13px;color:#888">No tienes permisos para acceder a esta sección.</div>
        </div>
      </div>`;
    return;
  }

  currentView = view;

  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.view === view);
  });

  document.getElementById('page-title').textContent    = VIEWS[view].title;
  document.getElementById('content').innerHTML         = '';
  VIEWS[view].render();
  updateBadges();
}

function updateBadges() {
  const user = getUser();
  let pendAuth = 0;
  if (user) {
    if (user.rol === 'residente') {
      pendAuth = S.traspasos.filter(t => t.status === 'pendiente').length;
    } else if (user.rol === 'control_obra') {
      pendAuth = S.traspasos.filter(t => t.status === 'pre_autorizado').length;
    } else if (user.rol === 'administrador') {
      pendAuth = S.traspasos.filter(t => t.status === 'pendiente' || t.status === 'pre_autorizado').length;
    }
  }
  const pendRec  = S.traspasos.filter(t => t.status === 'autorizado').length;

  const ba = document.getElementById('badge-auth');
  const br = document.getElementById('badge-rec');
  if (ba) ba.textContent = pendAuth > 0 ? pendAuth : '';
  if (br) br.textContent = pendRec  > 0 ? pendRec  : '';
}

// Bind nav links
document.querySelectorAll('.nav-link').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    navigate(a.dataset.view);
  });
});

// Boot
document.addEventListener('DOMContentLoaded', () => {
  if (typeof fetchState === 'function') {
    fetchState()
      .then(() => {
        navigate('dashboard');
      })
      .catch(err => {
        console.error('Error al iniciar la aplicación desde el backend, usando valores locales:', err);
        navigate('dashboard');
      });
  } else {
    navigate('dashboard');
  }
});
