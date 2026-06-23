// =====================================================
// VIEW – Dashboard
// =====================================================

function renderDashboard() {
  const traspaFiltrados = filtrarPorEmpresa(S.traspasos);
  const total      = traspaFiltrados.length;
  
  const user = getUser();
  let pend = 0;
  if (user) {
    if (user.rol === 'residente') {
      pend = traspaFiltrados.filter(t => t.status === 'pendiente').length;
    } else if (user.rol === 'control_obra') {
      pend = traspaFiltrados.filter(t => t.status === 'pre_autorizado').length;
    } else {
      pend = traspaFiltrados.filter(t => t.status === 'pendiente' || t.status === 'pre_autorizado').length;
    }
  } else {
    pend = traspaFiltrados.filter(t => t.status === 'pendiente' || t.status === 'pre_autorizado').length;
  }

  const auth       = traspaFiltrados.filter(t => t.status === 'autorizado').length;
  const recibidos  = traspaFiltrados.filter(t => t.status === 'recibido').length;
  const rechazados = traspaFiltrados.filter(t => t.status === 'rechazado').length;
  const prestamos  = traspaFiltrados.filter(t => t.tipo === 'PRS').length;
  const obra       = traspaFiltrados.filter(t => t.tipo === 'TOB').length;
  const garantias  = traspaFiltrados.filter(t => t.tipo === 'GAR').length;

  const recent = [...traspaFiltrados]
    .sort((a, b) => b.fechaSolicitud.localeCompare(a.fechaSolicitud))
    .slice(0, 8);

  document.getElementById('content').innerHTML = `
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">Total Traspasos</div>
      <div class="stat-value">${total}</div>
      <div class="stat-sub">Todos los movimientos</div>
    </div>
    <div class="stat-card orange">
      <div class="stat-label">Pendientes Auth.</div>
      <div class="stat-value">${pend}</div>
      <div class="stat-sub">Esperando autorización</div>
    </div>
    <div class="stat-card blue">
      <div class="stat-label">Por Recibir</div>
      <div class="stat-value">${auth}</div>
      <div class="stat-sub">Autorizados en tránsito</div>
    </div>
    <div class="stat-card green">
      <div class="stat-label">Completados</div>
      <div class="stat-value">${recibidos}</div>
      <div class="stat-sub">Recibidos correctamente</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
    <div class="card">
      <div class="card-header"><h3>Por Tipo de Traspaso</h3></div>
      <div class="card-body">
        <div style="display:flex;gap:20px;align-items:center;padding:8px 0">
          <span class="badge badge-loan">Préstamo</span>
          <span style="font-size:24px;font-weight:800">${prestamos}</span>
          <span style="color:#aaa;font-size:12px">movimientos</span>
        </div>
        <div style="display:flex;gap:20px;align-items:center;padding:8px 0">
          <span class="badge badge-obra">Término de Obra</span>
          <span style="font-size:24px;font-weight:800">${obra}</span>
          <span style="color:#aaa;font-size:12px">movimientos</span>
        </div>
        <div style="display:flex;gap:20px;align-items:center;padding:8px 0">
          <span class="badge badge-loan" style="background:#e8f4f8;color:#0369a1;border:1px solid rgba(3,105,161,.25)">Garantía</span>
          <span style="font-size:24px;font-weight:800">${garantias}</span>
          <span style="color:#aaa;font-size:12px">movimientos</span>
        </div>
        ${rechazados > 0 ? `
        <div style="display:flex;gap:20px;align-items:center;padding:8px 0">
          <span class="badge badge-rejected">Rechazados</span>
          <span style="font-size:24px;font-weight:800;color:var(--red)">${rechazados}</span>
        </div>` : ''}
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3>Acciones Rápidas</h3></div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:10px">
        <button class="btn btn-primary w-full" onclick="navigate('nueva-solicitud')">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Nueva Solicitud de Traspaso
        </button>
        <button class="btn btn-secondary w-full" onclick="navigate('autorizacion')">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Ir a Autorización ${pend > 0 ? `(${pend} pendientes)` : ''}
        </button>
        <button class="btn btn-secondary w-full" onclick="navigate('recepcion')">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
          Ir a Recepción ${auth > 0 ? `(${auth} por recibir)` : ''}
        </button>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-header"><h3>Movimientos Recientes</h3></div>
    <div class="table-wrap">
      ${recent.length === 0
        ? '<div class="alert-empty">No hay movimientos registrados aún</div>'
        : `<table>
            <thead>
              <tr><th>Folio</th><th>Tipo</th><th>Empresa Origen</th><th>CC Origen</th><th>Empresa Destino</th><th>CC Destino</th><th>Fecha</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              ${recent.map(t => `
              <tr>
                <td><strong>${t.folio}</strong></td>
                <td>${tipoBadge(t.tipo)}</td>
                <td class="text-sm">${getEmpresa(t.empresaOrigen).nombre.split(' ')[0] || '—'}</td>
                <td class="text-sm">${getCC(t.ccOrigen).nombre}</td>
                <td class="text-sm">${getEmpresa(t.empresaDestino).nombre.split(' ')[0] || '—'}</td>
                <td class="text-sm">${getCC(t.ccDestino).nombre}</td>
                <td class="text-sm">${fmtDate(t.fechaSolicitud)}</td>
                <td>${statusBadge(t.status)}</td>
                <td><button class="btn btn-secondary btn-sm" onclick="verDetalle('${t.id}')">Ver</button></td>
              </tr>`).join('')}
            </tbody>
          </table>`
      }
    </div>
  </div>`;
}
