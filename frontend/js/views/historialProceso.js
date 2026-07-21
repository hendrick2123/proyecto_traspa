// =====================================================
// VIEW – Historial de Proceso (Almacén General CC 999)
// =====================================================

let hpPage = 1;
const hpLimit = 25;
let hpTotal = 0;

function renderHistorialProceso() {
  hpPage = 1;
  
  document.getElementById('content').innerHTML = `
    <div style="margin-bottom:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <h2 style="font-size:18px;font-weight:800;color:var(--black);margin-bottom:4px">Almacén General</h2>
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
          <span style="font-size:11px;font-weight:700;color:#888;white-space:nowrap" id="hp-total-count">Cargando...</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="table-wrap" id="hp-table-container">
        <!-- Cargando... -->
      </div>
      <div class="card-footer" id="hp-pagination" style="display:flex;justify-content:space-between;align-items:center;padding:12px 20px;border-top:1px solid #e2e8f0;background:#f8fafc">
      </div>
    </div>
  `;

  cargarHistorialProceso();
}

function cargarHistorialProceso() {
  const container = document.getElementById('hp-table-container');
  if (container) {
    container.innerHTML = `<div style="text-align:center;padding:40px;color:#888;">
      <div style="border:3px solid #f3f3f3;border-top:3px solid var(--green);border-radius:50%;width:30px;height:30px;animation:spin 1s linear infinite;margin:0 auto 10px"></div>
      Cargando almacén...
    </div>`;
  }

  fetchTraspasosPaginated({
    page: hpPage,
    limit: hpLimit,
    cc: '999'
  })
  .then(data => {
    const list = data.traspasos || [];
    hpTotal = data.total || 0;

    let rows = [];
    list.forEach(t => {
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

    rows.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    document.getElementById('hp-total-count').textContent = `${hpTotal} movimientos`;
    
    if (rows.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding:40px 20px">
          <div style="font-size:40px;margin-bottom:12px">📦</div>
          <p>No hay movimientos registrados para el CC 999</p>
        </div>`;
      document.getElementById('hp-pagination').innerHTML = '';
      return;
    }

    container.innerHTML = `
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
          ${rows.map((r, idx) => {
            const indexOnPage = (hpPage - 1) * hpLimit + idx + 1;
            const fechaFmt = r.fecha ? new Date(r.fecha).toLocaleDateString('es-MX', {day:'2-digit', month:'short', year:'numeric'}) : '—';
            const tBadge = r.tipo === 'PRS' ? '<span class="badge badge-loan">Préstamo</span>'
                            : r.tipo === 'TOB' ? '<span class="badge badge-obra">Término</span>'
                            : r.tipo === 'GAR' ? '<span class="badge badge-pending">Garantía</span>'
                            : `<span class="badge badge-draft">${r.tipo}</span>`;
            const fotoHtml = r.imagen
              ? `<img src="${r.imagen}" style="height:28px;width:28px;object-fit:cover;border-radius:4px;cursor:pointer;border:1px solid #e2e8f0" onclick="window.open('${r.imagen}')" title="Ver foto">`
              : '<span style="color:#ccc;font-size:11px">—</span>';

            return `
              <tr class="hp-row" data-search="${(r.clave + ' ' + r.nombre + ' ' + r.comentario).toLowerCase()}">
                <td class="text-sm" style="color:#aaa;font-weight:700">${indexOnPage}</td>
                <td class="text-sm" style="white-space:nowrap">${fechaFmt}</td>
                <td><a href="#" class="timeline-folio" onclick="verDetalle('${r.id}'); return false;">${r.folio}</a></td>
                <td>${tBadge}</td>
                <td class="text-sm" title="${r.ccOrigenNombre}"><strong>${r.ccOrigen}</strong></td>
                <td class="text-sm" title="${r.ccDestinoNombre}"><strong>${r.ccDestino}</strong></td>
                <td class="text-sm" style="font-weight:700;color:#1e40af">${r.clave}</td>
                <td class="text-sm">${r.nombre}</td>
                <td class="text-sm">${r.unidad}</td>
                <td class="text-sm" style="font-weight:700">${r.cantidad}</td>
                <td class="text-sm">$${parseFloat(r.precio).toFixed(2)}</td>
                <td class="text-sm" style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${r.comentario}">${r.comentario || '—'}</td>
                <td style="text-align:center">${fotoHtml}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    renderHpPaginationControls();
  })
  .catch(err => {
    console.error(err);
    container.innerHTML = '<div class="alert alert-danger">Error al cargar datos del almacén.</div>';
  });
}

function cambiarHpPagina(nuevaPagina) {
  const totalPaginas = Math.ceil(hpTotal / hpLimit) || 1;
  if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
  hpPage = nuevaPagina;
  cargarHistorialProceso();
}

function renderHpPaginationControls() {
  const paginationContainer = document.getElementById('hp-pagination');
  if (!paginationContainer) return;

  const totalPaginas = Math.ceil(hpTotal / hpLimit) || 1;
  const rangeInfo = hpTotal > 0
    ? `Mostrando ${(hpPage - 1) * hpLimit + 1} - ${Math.min(hpPage * hpLimit, hpTotal)} de ${hpTotal} traspasos`
    : `Mostrando 0 - 0 de 0`;

  paginationContainer.innerHTML = `
    <span style="font-size:12px;color:#64748b;font-weight:600">${rangeInfo}</span>
    <div style="display:flex;gap:6px;align-items:center">
      <button class="btn btn-secondary btn-sm" onclick="cambiarHpPagina(${hpPage - 1})" ${hpPage === 1 ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>
        Anterior
      </button>
      <span style="font-size:12px;font-weight:700;color:#334155;padding:0 8px">Página ${hpPage} de ${totalPaginas}</span>
      <button class="btn btn-secondary btn-sm" onclick="cambiarHpPagina(${hpPage + 1})" ${hpPage === totalPaginas ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>
        Siguiente
      </button>
    </div>
  `;
}

function filtrarHistorialProceso() {
  const query = (document.getElementById('hp-buscar')?.value || '').toLowerCase().trim();
  const filas = document.querySelectorAll('.hp-row');
  filas.forEach(fila => {
    const data = fila.getAttribute('data-search') || '';
    fila.style.display = (!query || data.includes(query)) ? '' : 'none';
  });
}

async function exportarExcel() {
  if (typeof ExcelJS === 'undefined') {
    alert('Cargando biblioteca de Excel, por favor intenta de nuevo en unos segundos...');
    return;
  }

  const table = document.getElementById('hp-tabla');
  if (!table) return;

  const btn = document.querySelector('button[onclick="exportarExcel()"]');
  const originalBtnHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.innerHTML = '⏳ Generando Excel...';
    btn.disabled = true;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Almacén General CC 999');

    worksheet.views = [{ showGridLines: true }];

    worksheet.mergeCells('A1:M1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Reporte de Almacén General - Centro de Costo 999 (Saldos Iniciales)';
    titleCell.font = { name: 'Montserrat', family: 4, size: 16, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '16A34A' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 40;

    worksheet.addRow([]);
    worksheet.getRow(2).height = 15;

    const headers = [
      '#', 'Fecha', 'Folio', 'Tipo', 'CC Origen', 'CC Destino', 'Clave Insumo', 
      'Descripción Insumo', 'Unidad', 'Cant.', 'Precio Unit.', 'Detalle / Comentario', 'Foto'
    ];
    worksheet.getRow(3).values = headers;
    worksheet.getRow(3).height = 28;
    
    for (let c = 1; c <= headers.length; c++) {
      const cell = worksheet.getCell(3, c);
      cell.font = { name: 'Montserrat', family: 4, size: 10, bold: true, color: { argb: '333333' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
      cell.alignment = { vertical: 'middle', horizontal: c === 1 || c === 2 || c === 4 || c === 9 || c === 13 ? 'center' : 'left' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'CBD5E1' } },
        bottom: { style: 'medium', color: { argb: '94A3B8' } },
        left: { style: 'thin', color: { argb: 'E2E8F0' } },
        right: { style: 'thin', color: { argb: 'E2E8F0' } }
      };
    }

    const rows = table.querySelectorAll('tbody tr');
    let excelRowIndex = 4;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const tds = row.querySelectorAll('td');
      if (tds.length === 0) continue;

      const idxValue = tds[0].textContent.trim();
      const fechaValue = tds[1].textContent.trim();
      const folioValue = tds[2].textContent.trim();
      const tipoValue = tds[3].textContent.trim();
      const ccOriValue = tds[4].textContent.trim();
      const ccDesValue = tds[5].textContent.trim();
      const claveValue = tds[6].textContent.trim();
      const insumoValue = tds[7].textContent.trim();
      const unidadValue = tds[8].textContent.trim();
      const cantValue = parseFloat(tds[9].textContent.trim()) || 0;
      const precioValue = parseFloat(tds[10].textContent.replace(/[$,]/g, '').trim()) || 0;
      const comentarioValue = tds[11].textContent.trim();
      
      const imgEl = tds[12].querySelector('img');
      const imgUrl = imgEl ? imgEl.getAttribute('src') : null;

      const newRow = worksheet.addRow([
        parseInt(idxValue) || idxValue,
        fechaValue,
        folioValue,
        tipoValue,
        ccOriValue,
        ccDesValue,
        claveValue,
        insumoValue,
        unidadValue,
        cantValue,
        precioValue,
        comentarioValue === '—' ? '' : comentarioValue,
        ''
      ]);

      newRow.height = imgUrl ? 65 : 22;

      for (let c = 1; c <= headers.length; c++) {
        const cell = worksheet.getCell(excelRowIndex, c);
        cell.font = { name: 'Montserrat', family: 4, size: 9 };
        cell.alignment = { 
          vertical: 'middle', 
          horizontal: c === 1 || c === 2 || c === 4 || c === 9 || c === 13 ? 'center' : 'left' 
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'F1F5F9' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'F1F5F9' } },
          right: { style: 'thin', color: { argb: 'F1F5F9' } }
        };

        if (c === 11) {
          cell.numFmt = '"$"#,##0.00';
        }
      }

      if (imgUrl) {
        try {
          const response = await fetch(imgUrl);
          if (response.ok) {
            const blob = await response.blob();
            
            const base64Data = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });

            const matches = base64Data.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
            if (matches) {
              const ext = matches[1];
              const rawBase64 = matches[2];
              
              const imageId = workbook.addImage({
                base64: rawBase64,
                extension: ext === 'jpg' ? 'jpeg' : ext
              });

              worksheet.addImage(imageId, {
                tl: { col: 12, row: excelRowIndex - 1 },
                ext: { width: 60, height: 60 },
                editAs: 'oneCell'
              });
            }
          }
        } catch (imgError) {
          console.error("Error cargando imagen para el Excel:", imgUrl, imgError);
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
      const colWidths = [6, 14, 22, 14, 12, 12, 14, 32, 10, 10, 14, 30, 12];
      column.width = Math.max(colWidths[i] || 10, maxLen + 3);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const fileBlob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(fileBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Almacen_General_CC999_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
