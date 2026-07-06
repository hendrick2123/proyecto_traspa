// =====================================================
// VIEW – Inventario (Préstamos y Garantías)
// =====================================================

let invPage = 1;
const invLimit = 25;
let invTotal = 0;

function renderInventario() {
  invPage = 1;
  
  document.getElementById('content').innerHTML = `
    <div style="margin-bottom:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <h2 style="font-size:18px;font-weight:800;color:var(--black);margin-bottom:4px">Inventario de Préstamos</h2>
          <p style="font-size:12px;color:#888">Registro detallado de préstamos y garantías por devolver, excluyendo almacén general (CC 99).</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <input type="text" id="inv-buscar" placeholder="Buscar por clave, nombre o comentario..." 
                 oninput="filtrarInventario()" 
                 style="border:1px solid var(--border);border-radius:6px;padding:7px 12px;font-size:12px;width:280px;font-family:'Montserrat',sans-serif">
          <button onclick="exportarExcelInventario()" class="btn btn-secondary btn-sm" style="display:flex;align-items:center;gap:6px;padding:7px 12px;font-size:12px;font-weight:600">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Exportar a Excel
          </button>
          <span style="font-size:11px;font-weight:700;color:#888;white-space:nowrap" id="inv-total-count">Cargando...</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="table-wrap" id="inv-table-container">
        <!-- Cargando... -->
      </div>
      <div class="card-footer" id="inv-pagination" style="display:flex;justify-content:space-between;align-items:center;padding:12px 20px;border-top:1px solid #e2e8f0;background:#f8fafc">
      </div>
    </div>
  `;

  cargarInventario();
}

function cargarInventario() {
  const container = document.getElementById('inv-table-container');
  if (container) {
    container.innerHTML = `<div style="text-align:center;padding:40px;color:#888;">
      <div style="border:3px solid #f3f3f3;border-top:3px solid var(--green);border-radius:50%;width:30px;height:30px;animation:spin 1s linear infinite;margin:0 auto 10px"></div>
      Cargando inventario...
    </div>`;
  }

  // Solicitamos un lote grande para poder calcular las devoluciones en base a todo
  fetchTraspasosPaginated({
    page: 1,
    limit: 5000 // Traer un lote grande para poder hacer cruces y calcular total de préstamos
  })
  .then(data => {
    // Actualizamos el cache
    if (data.traspasos) {
       S.traspasos = data.traspasos;
    }

    const list = data.traspasos || [];

    // Filtrar: solo PRS o GAR, no rechazado y excluir CC 99
    const prestamos = list.filter(t => 
      (t.tipo === 'PRS' || t.tipo === 'GAR') && 
      t.status !== 'rechazado' &&
      t.ccOrigen !== '99' && t.ccDestino !== '99'
    );

    let rows = [];
    prestamos.forEach(t => {
      const ccOriObj = S.centrosCosto.find(c => c.id === t.ccOrigen);
      const ccDesObj = S.centrosCosto.find(c => c.id === t.ccDestino);
      const ccOriNombre = ccOriObj ? ccOriObj.nombre : t.ccOrigen;
      const ccDesNombre = ccDesObj ? ccDesObj.nombre : t.ccDestino;

      // Calculamos nosotros los DEV
      const devs = list.filter(d =>
        d.tipo === 'DEV' &&
        d.folioOriginalRef === t.folio &&
        d.status !== 'rechazado'
      );
      const yaDevuelto = {};
      devs.forEach(dev => {
        dev.items.forEach(item => {
          yaDevuelto[item.insumoId] = (yaDevuelto[item.insumoId] || 0) + parseFloat(item.cantidad || 0);
        });
      });

      t.items.forEach(item => {
        const ins = getInsumo(item.insumoId);
        const cantOriginal = parseFloat(item.cantidad) || 0;
        const cantDevuelta = yaDevuelto[item.insumoId] || 0;
        const pendiente = cantOriginal - cantDevuelta;

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
          comentario: item.comentario || '',
          prestamoTotal: cantOriginal,
          devuelta: cantDevuelta,
          pendiente: pendiente
        });
      });
    });

    rows.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    // Paginación local
    invTotal = rows.length;
    const startIndex = (invPage - 1) * invLimit;
    const pagedRows = rows.slice(startIndex, startIndex + invLimit);

    document.getElementById('inv-total-count').textContent = `${invTotal} movimientos`;
    
    if (invTotal === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding:40px 20px">
          <div style="font-size:40px;margin-bottom:12px">📦</div>
          <p>No hay préstamos registrados para las empresas/CC filtrados.</p>
        </div>`;
      document.getElementById('inv-pagination').innerHTML = '';
      return;
    }

    container.innerHTML = `
      <table id="inv-tabla">
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
            <th>Cant. Préstamo Total</th>
            <th>Cant. Devuelta</th>
            <th>Pendiente por Devolver</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody id="inv-tbody">
          ${pagedRows.map((r, idx) => {
            const indexOnPage = startIndex + idx + 1;
            const fechaFmt = r.fecha ? new Date(r.fecha).toLocaleDateString('es-MX', {day:'2-digit', month:'short', year:'numeric'}) : '—';
            const tBadge = r.tipo === 'PRS' ? '<span class="badge badge-loan">Préstamo</span>'
                            : r.tipo === 'GAR' ? '<span class="badge badge-pending">Garantía</span>'
                            : `<span class="badge badge-draft">${r.tipo}</span>`;

            // Color del pendiente
            const pendColor = r.pendiente > 0 ? '#c0392b' : (r.pendiente < 0 ? '#d97706' : '#16a34a');
            const pendHtml = `<span style="color:${pendColor};font-weight:700">${r.pendiente.toFixed(2)}</span>`;

            return `
              <tr class="inv-row" data-search="${(r.clave + ' ' + r.nombre + ' ' + r.comentario).toLowerCase()}">
                <td class="text-sm" style="color:#aaa;font-weight:700">${indexOnPage}</td>
                <td class="text-sm" style="white-space:nowrap">${fechaFmt}</td>
                <td><a href="#" class="timeline-folio" onclick="verDetalle('${r.id}'); return false;">${r.folio}</a></td>
                <td>${tBadge}</td>
                <td class="text-sm" title="${r.ccOrigenNombre}"><strong>${r.ccOrigen}</strong></td>
                <td class="text-sm" title="${r.ccDestinoNombre}"><strong>${r.ccDestino}</strong></td>
                <td class="text-sm" style="font-weight:700;color:#1e40af">${r.clave}</td>
                <td class="text-sm">${r.nombre}</td>
                <td class="text-sm">${r.unidad}</td>
                <td class="text-sm" style="font-weight:700">${r.prestamoTotal.toFixed(2)}</td>
                <td class="text-sm" style="font-weight:700;color:#16a34a">${r.devuelta.toFixed(2)}</td>
                <td class="text-sm" style="font-weight:700">${pendHtml}</td>
                <td class="text-sm" style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${r.comentario}">${r.comentario || '—'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    renderInvPaginationControls();
  })
  .catch(err => {
    console.error(err);
    container.innerHTML = '<div class="alert alert-danger">Error al cargar datos del inventario.</div>';
  });
}

function cambiarInvPagina(nuevaPagina) {
  const totalPaginas = Math.ceil(invTotal / invLimit) || 1;
  if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
  invPage = nuevaPagina;
  cargarInventario();
}

function renderInvPaginationControls() {
  const paginationContainer = document.getElementById('inv-pagination');
  if (!paginationContainer) return;

  const totalPaginas = Math.ceil(invTotal / invLimit) || 1;
  const rangeInfo = invTotal > 0
    ? `Mostrando ${(invPage - 1) * invLimit + 1} - ${Math.min(invPage * invLimit, invTotal)} de ${invTotal} registros`
    : `Mostrando 0 - 0 de 0`;

  paginationContainer.innerHTML = `
    <span style="font-size:12px;color:#64748b;font-weight:600">${rangeInfo}</span>
    <div style="display:flex;gap:6px;align-items:center">
      <button class="btn btn-secondary btn-sm" onclick="cambiarInvPagina(${invPage - 1})" ${invPage === 1 ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>
        Anterior
      </button>
      <span style="font-size:12px;font-weight:700;color:#334155;padding:0 8px">Página ${invPage} de ${totalPaginas}</span>
      <button class="btn btn-secondary btn-sm" onclick="cambiarInvPagina(${invPage + 1})" ${invPage === totalPaginas ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>
        Siguiente
      </button>
    </div>
  `;
}

function filtrarInventario() {
  const query = (document.getElementById('inv-buscar')?.value || '').toLowerCase().trim();
  const filas = document.querySelectorAll('.inv-row');
  filas.forEach(fila => {
    const data = fila.getAttribute('data-search') || '';
    fila.style.display = (!query || data.includes(query)) ? '' : 'none';
  });
}

async function exportarExcelInventario() {
  if (typeof ExcelJS === 'undefined') {
    alert('Cargando biblioteca de Excel, por favor intenta de nuevo en unos segundos...');
    return;
  }

  const btn = document.querySelector('button[onclick="exportarExcelInventario()"]');
  const originalBtnHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.innerHTML = '⏳ Generando Excel...';
    btn.disabled = true;
  }

  try {
    const data = await fetchTraspasosPaginated({ page: 1, limit: 5000 });
    const list = data.traspasos || [];
    
    const prestamos = list.filter(t => 
      (t.tipo === 'PRS' || t.tipo === 'GAR') && 
      t.status !== 'rechazado' &&
      t.ccOrigen !== '99' && t.ccDestino !== '99'
    );

    let rows = [];
    prestamos.forEach(t => {
      const ccOriObj = S.centrosCosto.find(c => c.id === t.ccOrigen);
      const ccDesObj = S.centrosCosto.find(c => c.id === t.ccDestino);
      const ccOriNombre = ccOriObj ? ccOriObj.nombre : t.ccOrigen;
      const ccDesNombre = ccDesObj ? ccDesObj.nombre : t.ccDestino;

      const devs = list.filter(d => d.tipo === 'DEV' && d.folioOriginalRef === t.folio && d.status !== 'rechazado');
      const yaDevuelto = {};
      devs.forEach(dev => {
        dev.items.forEach(item => {
          yaDevuelto[item.insumoId] = (yaDevuelto[item.insumoId] || 0) + parseFloat(item.cantidad || 0);
        });
      });

      t.items.forEach(item => {
        const ins = getInsumo(item.insumoId);
        const cantOriginal = parseFloat(item.cantidad) || 0;
        const cantDevuelta = yaDevuelto[item.insumoId] || 0;
        const pendiente = cantOriginal - cantDevuelta;

        rows.push({
          fecha: t.fechaSolicitud ? new Date(t.fechaSolicitud).toLocaleDateString('es-MX', {day:'2-digit', month:'short', year:'numeric'}) : '—',
          folio: t.folio,
          tipo: t.tipo,
          ccOrigen: t.ccOrigen,
          ccDestino: t.ccDestino,
          clave: ins ? ins.clave : item.insumoId,
          nombre: ins ? ins.nombre : (item.nombre || 'Desconocido'),
          unidad: ins ? ins.unidad : (item.unidad || 'Pza'),
          prestamoTotal: cantOriginal,
          devuelta: cantDevuelta,
          pendiente: pendiente,
          comentario: item.comentario || ''
        });
      });
    });

    rows.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventario de Préstamos');

    worksheet.views = [{ showGridLines: true }];

    worksheet.mergeCells('A1:M1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Reporte de Inventario de Préstamos';
    titleCell.font = { name: 'Montserrat', family: 4, size: 16, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '16A34A' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 40;

    worksheet.addRow([]);
    worksheet.getRow(2).height = 15;

    const headers = [
      '#', 'Fecha', 'Folio', 'Tipo', 'CC Origen', 'CC Destino', 'Clave Insumo', 
      'Descripción Insumo', 'Unidad', 'Cant. Préstamo Total', 'Cant. Devuelta', 'Pend. por Devolver', 'Comentario'
    ];
    worksheet.getRow(3).values = headers;
    worksheet.getRow(3).height = 28;
    
    for (let c = 1; c <= headers.length; c++) {
      const cell = worksheet.getCell(3, c);
      cell.font = { name: 'Montserrat', family: 4, size: 10, bold: true, color: { argb: '333333' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
      cell.alignment = { vertical: 'middle', horizontal: c === 1 || c === 2 || c === 4 || c === 9 ? 'center' : 'left' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'CBD5E1' } },
        bottom: { style: 'medium', color: { argb: '94A3B8' } },
        left: { style: 'thin', color: { argb: 'E2E8F0' } },
        right: { style: 'thin', color: { argb: 'E2E8F0' } }
      };
    }

    let excelRowIndex = 4;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];

      const newRow = worksheet.addRow([
        i + 1,
        r.fecha,
        r.folio,
        r.tipo,
        r.ccOrigen,
        r.ccDestino,
        r.clave,
        r.nombre,
        r.unidad,
        r.prestamoTotal,
        r.devuelta,
        r.pendiente,
        r.comentario
      ]);

      newRow.height = 22;

      for (let c = 1; c <= headers.length; c++) {
        const cell = worksheet.getCell(excelRowIndex, c);
        cell.font = { name: 'Montserrat', family: 4, size: 9 };
        cell.alignment = { 
          vertical: 'middle', 
          horizontal: c === 1 || c === 2 || c === 4 || c === 9 ? 'center' : 'left' 
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'F1F5F9' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'F1F5F9' } },
          right: { style: 'thin', color: { argb: 'F1F5F9' } }
        };

        if (c === 10 || c === 11 || c === 12) {
          cell.numFmt = '#,##0.00';
        }
      }
      excelRowIndex++;
    }

    worksheet.columns.forEach((column, i) => {
      let maxLen = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        if (cell.row > 1 && cell.value) {
          maxLen = Math.max(maxLen, cell.value.toString().length);
        }
      });
      const colWidths = [6, 14, 22, 14, 12, 12, 14, 32, 10, 16, 16, 16, 30];
      column.width = Math.max(colWidths[i] || 10, maxLen + 3);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const fileBlob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(fileBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Inventario_Prestamos_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (err) {
    console.error("Error al exportar a Excel:", err);
    alert("Ocurrió un error al generar el archivo Excel.");
  } finally {
    if (btn) {
      btn.innerHTML = originalBtnHtml;
      btn.disabled = false;
    }
  }
}
