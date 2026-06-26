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
    const worksheet = workbook.addWorksheet('Inventario CC 999');

    // Activar líneas de cuadrícula
    worksheet.views = [{ showGridLines: true }];

    // 1. Título del Reporte
    worksheet.mergeCells('A1:M1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Reporte de Inventario - Centro de Costo 999 (Saldos Iniciales)';
    titleCell.font = { name: 'Montserrat', family: 4, size: 16, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '16A34A' } }; // Verde Grupo Urbania
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 40;

    // Fila vacía de separación
    worksheet.addRow([]);
    worksheet.getRow(2).height = 15;

    // 2. Definir Columnas y Encabezados
    const headers = [
      '#', 'Fecha', 'Folio', 'Tipo', 'CC Origen', 'CC Destino', 'Clave Insumo', 
      'Descripción Insumo', 'Unidad', 'Cant.', 'Precio Unit.', 'Detalle / Comentario', 'Foto'
    ];
    worksheet.getRow(3).values = headers;
    worksheet.getRow(3).height = 28;
    
    // Formato de cabecera
    for (let c = 1; c <= headers.length; c++) {
      const cell = worksheet.getCell(3, c);
      cell.font = { name: 'Montserrat', family: 4, size: 10, bold: true, color: { argb: '333333' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } }; // Gris claro
      cell.alignment = { vertical: 'middle', horizontal: c === 1 || c === 2 || c === 4 || c === 9 || c === 13 ? 'center' : 'left' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'CBD5E1' } },
        bottom: { style: 'medium', color: { argb: '94A3B8' } },
        left: { style: 'thin', color: { argb: 'E2E8F0' } },
        right: { style: 'thin', color: { argb: 'E2E8F0' } }
      };
    }

    // 3. Procesar Filas de Datos
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
      
      // Obtener imagen
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
        '' // Celda vacía para colocar la imagen encima
      ]);

      // Altura de fila: si hay imagen, la hacemos más alta (ej. 65), si no, normal (22)
      newRow.height = imgUrl ? 65 : 22;

      // Estilo de celdas
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

        // Formato para columna de precio
        if (c === 11) {
          cell.numFmt = '"$"#,##0.00';
        }
      }

      // 4. Descargar e incrustar la imagen si existe
      if (imgUrl) {
        try {
          // Descargar imagen
          const response = await fetch(imgUrl);
          if (response.ok) {
            const blob = await response.blob();
            
            // Convertir blob a base64
            const base64Data = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });

            // Extraer tipo de imagen
            const matches = base64Data.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
            if (matches) {
              const ext = matches[1];
              const rawBase64 = matches[2];
              
              const imageId = workbook.addImage({
                base64: rawBase64,
                extension: ext === 'jpg' ? 'jpeg' : ext
              });

              // Agregar imagen a la hoja de cálculo centrándola en la celda
              worksheet.addImage(imageId, {
                tl: { col: 12, row: excelRowIndex - 1 }, // 0-indexed en ExcelJS
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

    // 5. Configurar anchos de columna automáticamente
    worksheet.columns.forEach((column, i) => {
      let maxLen = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        if (cell.row > 1 && cell.value) {
          maxLen = Math.max(maxLen, cell.value.toString().length);
        }
      });
      // Dar un margen extra a los anchos
      const colWidths = [6, 14, 22, 14, 12, 12, 14, 32, 10, 10, 14, 30, 12];
      column.width = Math.max(colWidths[i] || 10, maxLen + 3);
    });

    // 6. Generar el buffer del archivo y disparar descarga
    const buffer = await workbook.xlsx.writeBuffer();
    const fileBlob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(fileBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Inventario_CC999_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
