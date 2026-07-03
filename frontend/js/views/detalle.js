// =====================================================
// VIEW – Detalle del traspaso (modal)
// =====================================================

/** Renders a compact items table inside the detail modal */
function resumenItems(t) {
  const hasExtra = t.items.some(i => i.precio > 0 || i.comentario);
  const hasImg = t.items.some(i => i.imagen);
  return `<div class="items-table-wrap">
    <table>
      <thead><tr><th>Clave</th><th>Insumo</th>${hasExtra ? '<th>Descripción</th>' : ''}<th>Cantidad</th><th>Unidad</th>${hasExtra ? '<th>Precio Unit.</th>' : ''}${hasImg ? '<th>Foto</th>' : ''}</tr></thead>
      <tbody>
        ${t.items.map(i => {
          const ins = getInsumo(i.insumoId);
          return `<tr>
            <td class="text-sm">${ins.clave}</td>
            <td class="text-sm">${ins.nombre}</td>
            ${hasExtra ? `<td class="text-sm">${i.comentario || '—'}</td>` : ''}
            <td class="text-sm">${i.cantidad}</td>
            <td class="text-sm">${ins.unidad}</td>
            ${hasExtra ? `<td class="text-sm">$${parseFloat(i.precio||0).toFixed(2)}</td>` : ''}
            ${hasImg ? `<td class="text-sm">${i.imagen ? `<img src="${i.imagen}" style="height:32px;border-radius:4px;cursor:pointer" onclick="window.open('${i.imagen}')" title="Ver foto">` : '—'}</td>` : ''}
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>`;
}

function verDetalle(id) {
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
      alert('No tienes permiso para ver este traspaso.');
      return;
    }
  }

  openModal(
    `Detalle · ${t.folio}`,
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
       <div class="form-group"><label>Folio</label><div style="font-size:16px;font-weight:800;color:var(--green)">${t.folio}</div></div>
       <div class="form-group"><label>Estado</label><div>${statusBadge(t.status)}</div></div>
       <div class="form-group"><label>Tipo</label><div>${tipoBadge(t.tipo)}</div></div>
       <div class="form-group"><label>Solicitante</label><div>${t.solicitante}</div></div>
       <div class="form-group"><label>Empresa Origen</label><div>${getEmpresa(t.empresaOrigen).nombre}</div></div>
       <div class="form-group"><label>CC Origen</label><div>${getCC(t.ccOrigen).nombre}</div></div>
       <div class="form-group"><label>Empresa Destino</label><div>${getEmpresa(t.empresaDestino).nombre}</div></div>
       <div class="form-group"><label>CC Destino</label><div>${getCC(t.ccDestino).nombre}</div></div>
       <div class="form-group"><label>Fecha Solicitud</label><div>${fmtDate(t.fechaSolicitud)}</div></div>
       ${t.autorizador ? `
       <div class="form-group"><label>Autorizador 1 (Residente)</label><div>${t.autorizador}</div></div>
       <div class="form-group"><label>Fecha Auth. 1</label><div>${fmtDate(t.fechaAutorizacion)}</div></div>` : ''}
       ${t.autorizador2 ? `
       <div class="form-group"><label>Autorizador 2 (Control de Obra)</label><div>${t.autorizador2}</div></div>
       <div class="form-group"><label>Fecha Auth. 2</label><div>${fmtDate(t.fechaAutorizacion2)}</div></div>` : ''}
       ${t.receptor ? `
       <div class="form-group"><label>Receptor</label><div>${t.receptor}</div></div>
       <div class="form-group"><label>Fecha Recepción</label><div>${fmtDate(t.fechaRecepcion)}</div></div>` : ''}
     </div>
     ${t.observaciones ? `
     <div style="margin-bottom:12px">
       <label style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Observaciones</label>
       <div style="margin-top:4px;font-size:13px">${t.observaciones}</div>
     </div>` : ''}
     ${t.comentarioAuth ? `
     <div style="margin-bottom:12px">
       <label style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Comentario Auth. 1 (Residente)</label>
       <div style="margin-top:4px;font-size:13px">${t.comentarioAuth}</div>
     </div>` : ''}
     ${t.comentarioAuth2 ? `
     <div style="margin-bottom:12px">
       <label style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Comentario Auth. 2 (Control de Obra)</label>
       <div style="margin-top:4px;font-size:13px">${t.comentarioAuth2}</div>
     </div>` : ''}
     <div style="margin-bottom:4px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Insumos</div>
     ${resumenItems(t)}`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>
     ${(function() {
       if ((t.tipo === 'PRS' || (t.tipo === 'GAR' && t.items.some(i => parseFloat(i.cantidad) >= 3))) && (t.status === 'recibido' || t.status === 'devuelto_parcial')) {
         if (typeof tieneDevolucionEnProceso === 'function' && tieneDevolucionEnProceso(t)) {
           const info = typeof getDevolucionEnProcesoInfo === 'function' ? getDevolucionEnProcesoInfo(t) : null;
           const label = info ? info.itemsEnProceso + ' de ' + info.totalItems + ' insumos' : '';
           return '<button class="btn btn-primary" style="background:#94a3b8;border-color:#94a3b8;cursor:not-allowed;opacity:0.7" disabled title="Devolución en proceso">⏳ En proceso (' + label + ')</button>';
         }
         if (typeof tienePendientesDevolucion === 'function' && tienePendientesDevolucion(t)) {
           return '<button class="btn btn-primary" style="background:var(--blue);border-color:var(--blue)" onclick="closeModal();iniciarDevolucion(\'' + t.id + '\')">↩ Devolver</button>';
         }
       }
       return '';
     })()}
     <button class="btn btn-primary"   onclick="closeModal();imprimirTraspaso('${id}')">🖨 Imprimir</button>`
  );
}
