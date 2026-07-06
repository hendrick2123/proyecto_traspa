// =====================================================
// VIEW – Historial
// =====================================================

let historialPage = 1;
const historialLimit = 25;
let historialTotal = 0;

let filterEmpresa = '';
let filterCc = '';
let filterInsumo = '';
let filterStatus = '';
let filterTipo = '';

function renderHistorial() {
  historialPage = 1;
  filterEmpresa = '';
  filterCc = '';
  filterInsumo = '';
  filterStatus = '';
  filterTipo = '';

  const empresasOpts = S.empresas.map(e => `<option value="${e.id}">${e.nombre}</option>`).join('');
  const groups = {};
  S.centrosCosto.forEach(cc => {
    const dev = S.desarrollos ? S.desarrollos.find(d => d.id === cc.empresaId) : null;
    const devNombre = dev ? dev.nombre : cc.empresaId;
    if (!groups[cc.empresaId]) groups[cc.empresaId] = { label: devNombre, items: [] };
    groups[cc.empresaId].items.push(cc);
  });
  const ccOpts = Object.values(groups).map(g => {
    const inner = g.items.map(c => {
      const num = String(c.id).substring(0, 3);
      return '<option value="' + c.id + '">' + num + ' - ' + c.nombre + '</option>';
    }).join('');
    return '<optgroup label="' + g.label + '">' + inner + '</optgroup>';
  }).join('');
  const insumosOpts = S.insumos.map(i => `<option value="${i.id}">${i.clave || ''} - ${i.nombre}</option>`).join('');

  document.getElementById('content').innerHTML = `
  <div class="card">
    <div class="card-header" style="flex-wrap: wrap; gap: 10px;">
      <h3 id="hist-count">Historial de Movimientos (Cargando...)</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <select id="fil-empresa" class="btn btn-secondary" style="height:32px" onchange="filtrarHistorial()">
          <option value="">Todas las empresas</option>
          ${empresasOpts}
        </select>
        <select id="fil-cc" class="btn btn-secondary" style="height:32px" onchange="filtrarHistorial()">
          <option value="">Todos los CC</option>
          ${ccOpts}
        </select>
        <select id="fil-insumo" class="btn btn-secondary" style="height:32px; max-width: 200px;" onchange="filtrarHistorial()">
          <option value="">Todos los insumos</option>
          ${insumosOpts}
        </select>
        <select id="fil-status" class="btn btn-secondary" style="height:32px" onchange="filtrarHistorial()">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="pre_autorizado">Pre-Autorizado</option>
          <option value="autorizado">Autorizado</option>
          <option value="recibido">Recibido</option>
          <option value="devuelto_parcial">Dev. Parcial</option>
          <option value="devuelto_total">Dev. Total</option>
          <option value="rechazado">Rechazado</option>
        </select>
        <select id="fil-tipo" class="btn btn-secondary" style="height:32px" onchange="filtrarHistorial()">
          <option value="">Todos los tipos</option>
          <option value="PRS">Préstamo</option>
          <option value="TOB">Término de Obra</option>
          <option value="GAR">Garantía</option>
        </select>
      </div>
    </div>
    <div class="table-wrap" id="hist-table">
      <div style="text-align:center;padding:40px;color:#888;">Cargando datos...</div>
    </div>
    <div class="card-footer" id="hist-pagination" style="display:flex;justify-content:space-between;align-items:center;padding:12px 20px;border-top:1px solid #e2e8f0;background:#f8fafc">
    </div>
  </div>`;

  cargarHistorial();
}

function cargarHistorial() {
  const tableContainer = document.getElementById('hist-table');
  if (tableContainer) {
    tableContainer.innerHTML = `<div style="text-align:center;padding:40px;color:#888;">
      <div style="border:3px solid #f3f3f3;border-top:3px solid var(--green);border-radius:50%;width:30px;height:30px;animation:spin 1s linear infinite;margin:0 auto 10px"></div>
      Cargando...
    </div>`;
  }

  fetchTraspasosPaginated({
    page: historialPage,
    limit: historialLimit,
    status: filterStatus,
    tipo: filterTipo,
    empresa: filterEmpresa,
    cc: filterCc,
    insumo: filterInsumo
  })
  .then(data => {
    const list = data.traspasos || [];
    historialTotal = data.total || 0;

    // Sincronizar traspasos paginados en S.traspasos para que las funciones
    // de devolución (tieneDevolucionEnProceso, calcularPendientes) funcionen
    list.forEach(t => {
      const idx = S.traspasos.findIndex(x => x.id === t.id);
      if (idx >= 0) {
        S.traspasos[idx] = t; // actualizar con datos frescos del servidor
      } else {
        S.traspasos.push(t);  // agregar si no existe
      }
    });

    document.getElementById('hist-count').textContent = `Historial de Movimientos (${historialTotal})`;
    document.getElementById('hist-table').innerHTML = renderHistorialTable(list);
    renderPaginationControls();
  })
  .catch(err => {
    console.error(err);
    document.getElementById('hist-table').innerHTML = '<div class="alert alert-danger">Error al cargar datos del servidor</div>';
  });
}

function filtrarHistorial() {
  filterStatus = document.getElementById('fil-status').value;
  filterTipo = document.getElementById('fil-tipo').value;
  filterEmpresa = document.getElementById('fil-empresa').value;
  filterCc = document.getElementById('fil-cc').value;
  filterInsumo = document.getElementById('fil-insumo').value;
  
  historialPage = 1;
  cargarHistorial();
}

function cambiarPagina(nuevaPagina) {
  const totalPaginas = Math.ceil(historialTotal / historialLimit);
  if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
  historialPage = nuevaPagina;
  cargarHistorial();
}

function renderPaginationControls() {
  const paginationContainer = document.getElementById('hist-pagination');
  if (!paginationContainer) return;

  const totalPaginas = Math.ceil(historialTotal / historialLimit) || 1;
  const rangeInfo = historialTotal > 0
    ? `Mostrando ${(historialPage - 1) * historialLimit + 1} - ${Math.min(historialPage * historialLimit, historialTotal)} de ${historialTotal}`
    : `Mostrando 0 - 0 de 0`;

  paginationContainer.innerHTML = `
    <span style="font-size:12px;color:#64748b;font-weight:600">${rangeInfo}</span>
    <div style="display:flex;gap:6px;align-items:center">
      <button class="btn btn-secondary btn-sm" onclick="cambiarPagina(${historialPage - 1})" ${historialPage === 1 ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>
        Anterior
      </button>
      <span style="font-size:12px;font-weight:700;color:#334155;padding:0 8px">Página ${historialPage} de ${totalPaginas}</span>
      <button class="btn btn-secondary btn-sm" onclick="cambiarPagina(${historialPage + 1})" ${historialPage === totalPaginas ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>
        Siguiente
      </button>
    </div>
  `;
}

function renderHistorialTable(list) {
  if (list.length === 0) {
    return '<div class="empty-state"><p>Sin movimientos</p><span>No se encontraron registros con los filtros seleccionados</span></div>';
  }
  return `<table>
    <thead>
      <tr><th>Folio</th><th>Tipo</th><th>Origen</th><th>Destino</th><th>Solicitante</th><th>Fecha Sol.</th><th>Autorizó</th><th>Estado</th><th></th></tr>
    </thead>
    <tbody>
      ${list.map(t => `
      <tr>
        <td>
          <strong>${t.folio}</strong>
          ${t.folioOriginalRef ? `<div style="font-size:10px;color:#888">Ref: ${t.folioOriginalRef}</div>` : ''}
        </td>
        <td>${tipoBadge(t.tipo)}</td>
        <td class="text-sm">
          <div style="font-weight:600">${getCC(t.ccOrigen).nombre}</div>
          <div style="color:#888;font-size:11px">${getDesarrollo(getCC(t.ccOrigen).empresaId).nombre}</div>
        </td>
        <td class="text-sm">
          <div style="font-weight:600">${getCC(t.ccDestino).nombre}</div>
          <div style="color:#888;font-size:11px">${getDesarrollo(getCC(t.ccDestino).empresaId).nombre}</div>
        </td>
        <td class="text-sm">${t.solicitante}</td>
        <td class="text-sm">${fmtDate(t.fechaSolicitud)}</td>
        <td class="text-sm">${t.autorizador ? (t.autorizador2 ? `${t.autorizador} / ${t.autorizador2}` : t.autorizador) : '—'}</td>
        <td>${statusBadge(t.status)}</td>
        <td>
          <div style="display:flex;gap:6px;align-items:center">
            <button class="btn btn-secondary btn-sm" onclick="verDetalle('${t.id}')">Ver</button>
            <button class="btn btn-secondary btn-sm" onclick="imprimirTraspaso('${t.id}')">🖨</button>
            ${tienePendientesDevolucion(t)
              ? (tieneDevolucionEnProceso(t)
                ? (() => {
                    const info = getDevolucionEnProcesoInfo(t);
                    const label = info ? info.itemsEnProceso + ' de ' + info.totalItems : '';
                    return '<button class="btn btn-sm" style="background:#94a3b8;border-color:#94a3b8;color:#fff;cursor:not-allowed;opacity:0.7;font-size:10px" disabled title="Devolución en proceso – ' + label + ' insumos">⏳ ' + label + '</button>';
                  })()
                : '<button class="btn btn-primary btn-sm" style="background:var(--blue);border-color:var(--blue)" onclick="iniciarDevolucion(\'' + t.id + '\')" title="Devolver insumos pendientes">↩</button>')
              : ''
            }
          </div>
        </td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}
