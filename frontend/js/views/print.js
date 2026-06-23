// =====================================================
// IMPRESIÓN – abre ventana emergente con documento
// =====================================================

function imprimirTraspaso(id, hideAuthAndObs = false) {
  const t = S.traspasos.find(x => x.id === id);
  if (!t) return;

  // Tenant check
  const empId = getUserEmpresaId();
  if (empId) {
    const ccOri = S.centrosCosto.find(c => c.id === t.ccOrigen);
    const ccDes = S.centrosCosto.find(c => c.id === t.ccDestino);
    const oriEmp = ccOri ? ccOri.empresaId : (t.empresaOrigen || null);
    const desEmp = ccDes ? ccDes.empresaId : (t.empresaDestino || null);
    const userEmps = empId.split(',');
    if (!userEmps.includes(oriEmp) && !userEmps.includes(desEmp)) {
      alert('No tienes permiso para imprimir este traspaso.');
      return;
    }
  }

  const eOri      = getEmpresa(t.empresaOrigen);
  const eDes      = getEmpresa(t.empresaDestino);
  const ccOri     = getCC(t.ccOrigen);
  const ccDes     = getCC(t.ccDestino);
  const tipoLabel = t.tipo === 'PRS' ? 'Por Préstamo' : (t.tipo === 'GAR' ? 'Por Garantía' : 'Por Término de Obra');

  const statusWatermark = (t.status === 'pre_autorizado' || t.status === 'autorizado' || t.status === 'recibido')
    ? `<div class="watermark ${t.status === 'recibido' ? 'recibido' : (t.status === 'pre_autorizado' ? 'pre_autorizado' : 'autorizado')}">${t.status === 'recibido' ? 'RECIBIDO' : (t.status === 'pre_autorizado' ? 'PRE-AUTORIZADO' : 'AUTORIZADO')}</div>`
    : '';

  const hasExtra = t.items.some(i => i.precio > 0 || i.comentario);
  const itemsRows = t.items.map(i => {
    const ins = getInsumo(i.insumoId);
    return `<tr>
      <td>${ins.clave}</td>
      <td>${ins.nombre}</td>
      <td>${ins.categoria || '—'}</td>
      <td style="text-align:center">${i.cantidad}</td>
      <td style="text-align:center">${ins.unidad}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${t.folio}</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Montserrat',sans-serif;color:#111;padding:32px;font-size:13px;background:#fff}
    :root{--green:#61a60e}
    .doc-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:14px;border-bottom:3px solid var(--green)}
    .brand{font-size:18px;font-weight:900;letter-spacing:1px}
    .brand span{color:var(--green)}
    .brand-sub{font-size:9px;font-weight:600;color:#888;letter-spacing:1px;text-transform:uppercase;margin-top:2px}
    .meta-right{text-align:right}
    .folio{font-size:20px;font-weight:900;color:#111}
    .meta-row{font-size:11px;color:#666;margin-top:3px}
    .doc-title{text-align:center;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;margin:16px 0;color:#111;background:#f5f5f5;padding:8px;border-radius:4px}
    .watermark{display:inline-block;padding:4px 14px;border:2px solid;border-radius:4px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px}
    .watermark.autorizado,.watermark.recibido{color:var(--green);border-color:var(--green)}
    .watermark.pre_autorizado{color:#e67e22;border-color:#e67e22}
    .section{margin-bottom:16px}
    .section h4{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--green);margin-bottom:8px;border-bottom:1px solid #eee;padding-bottom:4px}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px}
    .field{display:flex;flex-direction:column;gap:2px;margin-bottom:4px}
    .field .lbl{font-size:9px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px}
    .field .val{font-size:12px;font-weight:500;color:#111}
    table{width:100%;border-collapse:collapse;font-size:12px;margin-top:6px}
    th{background:#f5f5f5;padding:7px 10px;text-align:left;font-weight:700;border:1px solid #ddd;font-size:10px;text-transform:uppercase}
    td{padding:6px 10px;border:1px solid #ddd}
    .signs{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:50px}
    .sign-box{text-align:center}
    .sign-line{border-top:1px solid #111;padding-top:6px;margin-bottom:4px}
    .sign-lbl{font-size:9px;font-weight:700;text-transform:uppercase;color:#666}
    .sign-name{font-size:11px;font-weight:700;color:#111}
    .footer-doc{margin-top:24px;text-align:center;font-size:9px;color:#bbb;border-top:1px solid #eee;padding-top:8px}
    @media print{body{padding:20px}}
  </style>
</head>
<body>
  <div class="doc-header">
    <div>
      <div class="brand">GRUPO <span>URBANIA</span></div>
      <div class="brand-sub">La llave de tu hogar®</div>
    </div>
    <div class="meta-right">
      <div class="folio">${t.folio}</div>
      <div class="meta-row">Fecha: ${fmtDate(t.fechaSolicitud)}</div>
      <div class="meta-row">Tipo: ${tipoLabel}</div>
    </div>
  </div>

  ${statusWatermark ? `<div style="text-align:center;margin-bottom:12px">${statusWatermark}</div>` : ''}

  <div class="doc-title">Solicitud de Traspaso de Almacén – ${tipoLabel}</div>

  <div class="section">
    <h4>Datos Generales</h4>
    <div class="grid2">
      <div class="field"><span class="lbl">Solicitante</span><span class="val">${t.solicitante}</span></div>
      <div class="field"><span class="lbl">Fecha de Solicitud</span><span class="val">${fmtDate(t.fechaSolicitud)}</span></div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
    <div class="section" style="border:1px solid #eee;border-radius:6px;padding:12px">
      <h4 style="color:#333">📤 Origen (Salida)</h4>
      <div class="field"><span class="lbl">Empresa</span><span class="val">${eOri.nombre}</span></div>
      <div class="field"><span class="lbl">Centro de Costo</span><span class="val">${ccOri.nombre}</span></div>
      <div class="field"><span class="lbl">Dirección</span><span class="val">${ccOri.direccion || '—'}</span></div>
    </div>
    <div class="section" style="border:1px solid #eee;border-radius:6px;padding:12px">
      <h4 style="color:#333">📥 Destino (Entrada)</h4>
      <div class="field"><span class="lbl">Empresa</span><span class="val">${eDes.nombre}</span></div>
      <div class="field"><span class="lbl">Centro de Costo</span><span class="val">${ccDes.nombre}</span></div>
      <div class="field"><span class="lbl">Dirección</span><span class="val">${ccDes.direccion || '—'}</span></div>
    </div>
  </div>

  <div class="section">
    <h4>Insumos a Traspasar</h4>
    <table>
      <thead><tr><th>#</th><th>Clave</th><th>Descripción del Insumo</th><th>Categoría</th>${hasExtra ? '<th>Detalle / Comentario</th>' : ''}<th style="text-align:center">Cantidad</th><th style="text-align:center">Unidad</th>${hasExtra ? '<th style="text-align:center">Precio</th>' : ''}</tr></thead>
      <tbody>
        ${t.items.map((i, idx) => {
          const ins = getInsumo(i.insumoId);
          return `<tr><td>${idx + 1}</td><td>${ins.clave}</td><td>${ins.nombre}</td><td>${ins.categoria || '—'}</td>${hasExtra ? `<td>${i.comentario || '—'}</td>` : ''}<td style="text-align:center">${i.cantidad}</td><td style="text-align:center">${ins.unidad}</td>${hasExtra ? `<td style="text-align:center">$${parseFloat(i.precio||0).toFixed(2)}</td>` : ''}</tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>

  ${!hideAuthAndObs && t.observaciones ? `<div class="section"><h4>Observaciones</h4><p style="font-size:12px">${t.observaciones}</p></div>` : ''}

  ${!hideAuthAndObs && t.autorizador ? `
  <div class="section">
    <h4>Información de Autorización (Residente)</h4>
    <div class="grid2">
      <div class="field"><span class="lbl">Autorizador</span><span class="val">${t.autorizador}</span></div>
      <div class="field"><span class="lbl">Fecha de Autorización</span><span class="val">${fmtDate(t.fechaAutorizacion)}</span></div>
      ${t.comentarioAuth ? `<div class="field" style="grid-column:1/-1"><span class="lbl">Comentarios</span><span class="val">${t.comentarioAuth}</span></div>` : ''}
    </div>
  </div>` : ''}

  ${!hideAuthAndObs && t.autorizador2 ? `
  <div class="section">
    <h4>Información de Autorización (Control de Obra)</h4>
    <div class="grid2">
      <div class="field"><span class="lbl">Control de Obra Autorizador</span><span class="val">${t.autorizador2}</span></div>
      <div class="field"><span class="lbl">Fecha de Autorización</span><span class="val">${fmtDate(t.fechaAutorizacion2)}</span></div>
      ${t.comentarioAuth2 ? `<div class="field" style="grid-column:1/-1"><span class="lbl">Comentarios</span><span class="val">${t.comentarioAuth2}</span></div>` : ''}
    </div>
  </div>` : ''}

  ${t.receptor ? `
  <div class="section">
    <h4>Información de Recepción</h4>
    <div class="grid2">
      <div class="field"><span class="lbl">Receptor</span><span class="val">${t.receptor}</span></div>
      <div class="field"><span class="lbl">Fecha de Recepción</span><span class="val">${fmtDate(t.fechaRecepcion)}</span></div>
      ${t.comentarioRec ? `<div class="field" style="grid-column:1/-1"><span class="lbl">Comentarios</span><span class="val">${t.comentarioRec}</span></div>` : ''}
    </div>
  </div>` : ''}

  <div class="signs">
    <div class="sign-box"><div style="height:40px"></div><div class="sign-line"></div><div class="sign-lbl">Solicitante</div><div class="sign-name">${t.solicitante}</div></div>
    <div class="sign-box"><div style="height:40px"></div><div class="sign-line"></div><div class="sign-lbl">Residente</div><div class="sign-name">${t.autorizador || 'Pendiente'}</div></div>
    <div class="sign-box"><div style="height:40px"></div><div class="sign-line"></div><div class="sign-lbl">Control de Obra</div><div class="sign-name">${t.autorizador2 || 'Pendiente'}</div></div>
    <div class="sign-box"><div style="height:40px"></div><div class="sign-line"></div><div class="sign-lbl">Receptor</div><div class="sign-name">${t.receptor || 'Pendiente de Recibir'}</div></div>
  </div>

  <div class="footer-doc">Grupo Urbania · grupourbania.com.mx · La llave de tu hogar® · Folio: ${t.folio} · Generado: ${new Date().toLocaleString('es-MX')}</div>
  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}
