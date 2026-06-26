// =====================================================
// VIEW – Historial de Proceso (Inventario CC 999)
// =====================================================

function renderHistorialProceso() {
  const content = document.getElementById('content');

  // 1. Filtrar solo traspasos relacionados con CC 999
  const traspasos999 = S.traspasos.filter(t => t.ccOrigen === '999' || t.ccDestino === '999');

  if (traspasos999.length === 0) {
    content.innerHTML = `
      <div class="empty-state">
        <div style="font-size:40px;margin-bottom:12px">📦</div>
        <p>No hay movimientos registrados para el CC 999</p>
        <span>Aún no se han realizado traspasos desde o hacia Saldos Iniciales.</span>
      </div>`;
    return;
  }

  // 2. Extraer cada insumo individual de cada traspaso
  let rows = [];
  traspasos999.forEach(t => {
    const ccOriObj = S.centrosCosto.find(c => c.id === t.ccOrigen);
    const ccDesObj = S.centrosCosto.find(c => c.id === t.ccDestino);
    const ccOriNombre = ccOriObj ? ccOriObj.nombre : t.ccOrigen;
    const ccDesNombre = ccDesObj ? ccDesObj.nombre : t.ccDestino;

    t.items.forEach((item, idx) => {
      const ins = getInsumo(item.insumoId);
      rows.push({
        fecha: t.fechaSolicitud || '',
        folio: t.folio,
        id: t.id,
        tipo: t.tipo,
        status: t.status,
        ccOrigen: t.ccOrigen,
        ccOrigenNombre: ccOriNombre,
        ccDestino: t.ccDestino,
        ccDestinoNombre: ccDesNombre,
        clave: ins ? ins.clave : item.insumoId,
        nombre: ins ? ins.nombre : (item.nombre || 'Desconocido'),
        unidad: ins ? ins.unidad : (item.unidad || 'Pza'),
        cantidad: item.cantidad || 0,
        precio: item.precio || 0,
        comentario: item.comentario || '',
        imagen: item.imagen || ''
      });
    });
  });

  // 3. Ordenar por fecha (más reciente primero)
  rows.sort((a, b) => {
    const dA = new Date(a.fecha);
    const dB = new Date(b.fecha);
    return dB - dA;
  });

  // 4. Renderizar
  let html = `
    <div style="margin-bottom:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <h2 style="font-size:18px;font-weight:800;color:var(--black);margin-bottom:4px">Inventario · CC 999</h2>
          <p style="font-size:12px;color:#888">Registro detallado de cada insumo movido desde o hacia Saldos Iniciales.</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <input type="text" id="hp-buscar" placeholder="Buscar por clave, nombre o comentario..." 
                 oninput="filtrarHistorialProceso()" 
                 style="border:1px solid var(--border);border-radius:6px;padding:7px 12px;font-size:12px;width:280px;font-family:'Montserrat',sans-serif">
          <button onclick="exportarExcel()" class="btn btn-secondary btn-sm" style="display:flex;align-items:center;gap:6px;padding:7px 12px;font-size:12px;font-weight:600">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Exportar a Excel
          </button>
          <span style="font-size:11px;font-weight:700;color:#888;white-space:nowrap">${rows.length} registros</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table id="hp-tabla">
          <thead>
            <tr>
              <th style="width:40px">#</th>
              <th>Fecha</th>
              <th>Folio</th>
              <th>Tipo</th>
              <th>CC Origen</th>
              <th>CC Destino</th>
              <th>Clave</th>
              <th>Insumo</th>
              <th>Unidad</th>
              <th>Cant.</th>
              <th>Precio</th>
              <th>Descripción</th>
              <th>Foto</th>
            </tr>
          </thead>
          <tbody id="hp-tbody">
  `;

  rows.forEach((r, idx) => {
    const fechaFmt = r.fecha ? new Date(r.fecha).toLocaleDateString('es-MX', {day:'2-digit', month:'short', year:'numeric'}) : '—';
    const tipoBadge = r.tipo === 'PRS' ? '<span class="badge badge-loan">Préstamo</span>'
                    : r.tipo === 'TOB' ? '<span class="badge badge-obra">Término</span>'
                    : r.tipo === 'GAR' ? '<span class="badge badge-pending">Garantía</span>'
                    : `<span class="badge badge-draft">${r.tipo}</span>`;
    const fotoHtml = r.imagen
      ? `<img src="${r.imagen}" style="height:28px;width:28px;object-fit:cover;border-radius:4px;cursor:pointer;border:1px solid #e2e8f0" onclick="window.open('${r.imagen}')" title="Ver foto">`
      : '<span style="color:#ccc;font-size:11px">—</span>';

    html += `
            <tr class="hp-row" 
                data-search="${(r.clave + ' ' + r.nombre + ' ' + r.comentario).toLowerCase()}">
              <td class="text-sm" style="color:#aaa;font-weight:700">${idx + 1}</td>
              <td class="text-sm" style="white-space:nowrap">${fechaFmt}</td>
              <td><a href="#" class="timeline-folio" onclick="verDetalle('${r.id}'); return false;">${r.folio}</a></td>
              <td>${tipoBadge}</td>
              <td class="text-sm" title="${r.ccOrigenNombre}"><strong>${r.ccOrigen}</strong></td>
              <td class="text-sm" title="${r.ccDestinoNombre}"><strong>${r.ccDestino}</strong></td>
              <td class="text-sm" style="font-weight:700;color:#1e40af">${r.clave}</td>
              <td class="text-sm">${r.nombre}</td>
              <td class="text-sm">${r.unidad}</td>
              <td class="text-sm" style="font-weight:700">${r.cantidad}</td>
              <td class="text-sm">$${parseFloat(r.precio).toFixed(2)}</td>
              <td class="text-sm" style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${r.comentario}">${r.comentario || '—'}</td>
              <td style="text-align:center">${fotoHtml}</td>
            </tr>`;
  });

  html += `
          </tbody>
        </table>
      </div>
    </div>
  `;

  content.innerHTML = html;
}

function filtrarHistorialProceso() {
  const query = (document.getElementById('hp-buscar')?.value || '').toLowerCase().trim();
  const filas = document.querySelectorAll('.hp-row');
  filas.forEach(fila => {
    const data = fila.getAttribute('data-search') || '';
    fila.style.display = (!query || data.includes(query)) ? '' : 'none';
  });
}

function exportarExcel() {
  if (typeof XLSX === 'undefined') {
    alert('Cargando biblioteca de Excel, por favor intenta en un momento...');
    return;
  }
  
  const table = document.getElementById('hp-tabla');
  if (!table) return;
  
  // Clonar tabla para remover columnas interactivas (como fotos/enlaces) antes de exportar
  const clone = table.cloneNode(true);
  
  // Remover la última columna ("Foto") de la cabecera
  const ths = clone.querySelectorAll('thead th');
  if (ths.length > 0) {
    ths[ths.length - 1].remove();
  }
  
  // Remover la última celda de cada fila en el cuerpo de la tabla
  const rows = clone.querySelectorAll('tbody tr');
  rows.forEach(row => {
    const tds = row.querySelectorAll('td');
    if (tds.length > 0) {
      tds[tds.length - 1].remove();
    }
  });

  const wb = XLSX.utils.table_to_book(clone, { sheet: "Inventario CC 999" });
  
  // Guardar y descargar el archivo Excel real (.xlsx)
  XLSX.writeFile(wb, `Inventario_CC999_${new Date().toISOString().slice(0,10)}.xlsx`);
}
