// =====================================================
// HISTORIAL POST-VENTA
// =====================================================

let _historialPostventaData = [];

async function renderHistorialPostventa() {
  const container = document.getElementById('content');
  container.innerHTML = `
    <div class="card">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
        <h3>📜 Historial Movimientos Post-Venta</h3>
        <div style="display:flex;gap:8px;align-items:center">
          <input type="text" id="hpv-search" placeholder="🔍 Buscar por insumo, OC, usuario..." oninput="_filterHistorialPostventa()" style="padding:6px 12px;border:1px solid #ddd;border-radius:6px;font-size:13px;width:240px">
          <button class="btn btn-secondary btn-sm" onclick="renderHistorialPostventa()">🔄 Actualizar</button>
        </div>
      </div>
      <div class="table-wrap" id="hpv-table-wrap">
        <div style="padding:40px;text-align:center;color:#888">Cargando historial...</div>
      </div>
    </div>`;

  const token = sessionStorage.getItem('gu_token');
  try {
    const res = await fetch(API_BASE + '/api/historial_postventa', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (data.status === 'success') {
      _historialPostventaData = data.data || [];
      _renderHistorialPostventaTable(_historialPostventaData);
    } else {
      document.getElementById('hpv-table-wrap').innerHTML = `<div style="padding:40px;text-align:center;color:red">Error: ${data.message}</div>`;
    }
  } catch (err) {
    console.error(err);
    document.getElementById('hpv-table-wrap').innerHTML = `<div style="padding:40px;text-align:center;color:red">Error de conexión al cargar el historial.</div>`;
  }
}

function _filterHistorialPostventa() {
  const query = (document.getElementById('hpv-search')?.value || '').toLowerCase().trim();
  if (!query) {
    _renderHistorialPostventaTable(_historialPostventaData);
    return;
  }
  const filtered = _historialPostventaData.filter(item => {
    const nombre = item.nombre_insumo || item.insumo_nombre || item.descripcion || '';
    const clave = item.clave || item.id_insumo || (item.id_insumo_pv ? `PV-${item.id_insumo_pv}` : '');
    return nombre.toLowerCase().includes(query) ||
           String(clave).toLowerCase().includes(query) ||
           (item.orden_compra || '').toLowerCase().includes(query) ||
           (item.usuario || '').toLowerCase().includes(query);
  });
  _renderHistorialPostventaTable(filtered);
}

function _renderHistorialPostventaTable(items) {
  const container = document.getElementById('hpv-table-wrap');
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:40px 20px;text-align:center">
        <div style="font-size:40px;margin-bottom:12px">📭</div>
        <p style="color:#888">No hay registros en el historial post-venta.</p>
      </div>`;
    return;
  }

  const rowsHtml = items.map(item => {
    const fecha = item.fecha_movimiento ? new Date(item.fecha_movimiento).toLocaleString('es-MX', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    }) : '—';

    const nombreInsumo = item.nombre_insumo || item.insumo_nombre || item.descripcion || '—';
    const claveInsumo = item.clave || (item.id_insumo_pv ? `PV-${item.id_insumo_pv}` : '');

    const cantAnt = item.cantidad_anterior !== undefined && item.cantidad_anterior !== null ? parseFloat(item.cantidad_anterior) : 0;
    const cantAgr = item.cantidad_agregada !== undefined && item.cantidad_agregada !== null ? parseFloat(item.cantidad_agregada) : 0;
    const salida = item.salida !== undefined && item.salida !== null ? parseFloat(item.salida) : 0;
    const cantTot = item.cantidad_total !== undefined && item.cantidad_total !== null ? parseFloat(item.cantidad_total) : 0;

    const addedBadge = cantAgr > 0 ? `<span style="color:var(--green);font-weight:700">+${cantAgr}</span>` : '0';
    const salidaBadge = salida > 0 ? `<span style="color:var(--red,#e74c3c);font-weight:700">-${salida}</span>` : '0';

    return `
      <tr>
        <td class="text-sm" style="white-space:nowrap">${fecha}</td>
        <td>
          <div style="font-weight:600">${nombreInsumo}</div>
          <div class="text-sm" style="font-family:monospace;color:#1e40af">${claveInsumo}</div>
        </td>
        <td class="text-sm" style="font-family:monospace;font-weight:600;color:#d97706">${item.orden_compra || '—'}</td>
        <td class="text-sm text-center" style="font-weight:600;color:#666">${cantAnt}</td>
        <td class="text-sm text-center">${addedBadge}</td>
        <td class="text-sm text-center">${salidaBadge}</td>
        <td class="text-sm text-center" style="font-weight:700;color:#111">${cantTot}</td>
        <td class="text-sm">${item.usuario || '—'}</td>
      </tr>`;
  }).join('');

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Fecha / Hora</th>
          <th>Insumo</th>
          <th>Orden de Compra</th>
          <th style="text-align:center">Cant. Anterior</th>
          <th style="text-align:center">Agregado</th>
          <th style="text-align:center">Salida</th>
          <th style="text-align:center">Cant. Total</th>
          <th>Usuario</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>`;
}
