// =====================================================
// VIEW – Historial
// =====================================================

function renderHistorial() {
  const all = filtrarPorEmpresa([...S.traspasos]).sort((a, b) => b.fechaSolicitud.localeCompare(a.fechaSolicitud));

  document.getElementById('content').innerHTML = `
  <div class="card">
    <div class="card-header">
      <h3>Historial de Movimientos (${all.length})</h3>
      <div style="display:flex;gap:8px">
        <select id="fil-status" class="btn btn-secondary" style="height:32px" onchange="filtrarHistorial()">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="pre_autorizado">Pre-Autorizado</option>
          <option value="autorizado">Autorizado</option>
          <option value="recibido">Recibido</option>
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
  let list = filtrarPorEmpresa([...S.traspasos]).sort((a, b) => b.fechaSolicitud.localeCompare(a.fechaSolicitud));
  if (st) list = list.filter(t => t.status === st);
  if (tp) list = list.filter(t => t.tipo === tp);
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
        <td><strong>${t.folio}</strong></td>
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
            ${(t.tipo === 'PRS' || (t.tipo === 'GAR' && t.items.some(i => parseFloat(i.cantidad) >= 3))) && t.status === 'recibido' ? `<button class="btn btn-primary btn-sm" style="background:var(--blue);border-color:var(--blue)" onclick="iniciarDevolucion('${t.id}')" title="Devolver">↩</button>` : ''}
          </div>
        </td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}
