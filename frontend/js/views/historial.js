// =====================================================
// VIEW – Historial
// =====================================================

function renderHistorial() {
  const all = filtrarPorEmpresa([...S.traspasos]).sort((a, b) => b.fechaSolicitud.localeCompare(a.fechaSolicitud));

  const empresasOpts = S.empresas.map(e => `<option value="${e.id}">${e.nombre}</option>`).join('');
  const ccOpts = S.centrosCosto.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
  const insumosOpts = S.insumos.map(i => `<option value="${i.id}">${i.clave || ''} - ${i.nombre}</option>`).join('');

  document.getElementById('content').innerHTML = `
  <div class="card">
    <div class="card-header" style="flex-wrap: wrap; gap: 10px;">
      <h3 id="hist-count">Historial de Movimientos (${all.length})</h3>
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
      ${renderHistorialTable(all)}
    </div>
  </div>`;
}

function filtrarHistorial() {
  const st = document.getElementById('fil-status').value;
  const tp = document.getElementById('fil-tipo').value;
  const emp = document.getElementById('fil-empresa').value;
  const cc = document.getElementById('fil-cc').value;
  const ins = document.getElementById('fil-insumo').value;

  let list = filtrarPorEmpresa([...S.traspasos]).sort((a, b) => b.fechaSolicitud.localeCompare(a.fechaSolicitud));
  
  if (st) list = list.filter(t => t.status === st);
  if (tp) list = list.filter(t => t.tipo === tp);
  if (emp) {
    list = list.filter(t => {
      const ccOri = S.centrosCosto.find(c => c.id === t.ccOrigen);
      const ccDes = S.centrosCosto.find(c => c.id === t.ccDestino);
      return (ccOri && String(ccOri.empresaId) === emp) || (ccDes && String(ccDes.empresaId) === emp);
    });
  }
  if (cc) list = list.filter(t => t.ccOrigen === cc || t.ccDestino === cc);
  if (ins) list = list.filter(t => t.items && t.items.some(i => String(i.insumoId) === ins));

  document.getElementById('hist-count').textContent = `Historial de Movimientos (${list.length})`;
  document.getElementById('hist-table').innerHTML = renderHistorialTable(list);
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
          <div style="display:flex;gap:6px">
            <button class="btn btn-secondary btn-sm" onclick="verDetalle('${t.id}')">Ver</button>
            <button class="btn btn-secondary btn-sm" onclick="imprimirTraspaso('${t.id}')">🖨</button>
            ${tienePendientesDevolucion(t)
              ? `<button class="btn btn-primary btn-sm" style="background:var(--blue);border-color:var(--blue)" onclick="iniciarDevolucion('${t.id}')" title="Devolver insumos pendientes">↩</button>`
              : ''}
          </div>
        </td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}
