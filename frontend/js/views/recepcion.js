// =====================================================
// VIEW – Recepción
// =====================================================

function renderRecepcion() {
  const autorizados = filtrarPorEmpresa(S.traspasos.filter(t => t.status === 'autorizado'));

  document.getElementById('content').innerHTML = `
  <div class="alert alert-info" style="margin-bottom:16px">
    <strong>Módulo de Recepción:</strong> Confirme la recepción del material en el centro de costo destino.
  </div>
  <div class="card">
    <div class="card-header"><h3>Traspasos Autorizados – Pendientes de Recepción (${autorizados.length})</h3></div>
    <div class="table-wrap">
      ${autorizados.length === 0
        ? '<div class="empty-state"><p>Sin traspasos por recibir</p><span>No hay material en tránsito actualmente</span></div>'
        : `<table>
            <thead><tr><th>Folio</th><th>Tipo</th><th>Origen</th><th>Destino</th><th>Autorizó</th><th>Fecha Auth.</th><th>Acciones</th></tr></thead>
            <tbody>
              ${autorizados.map(t => `
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
                <td class="text-sm">${t.autorizador || '—'}</td>
                <td class="text-sm">${fmtDate(t.fechaAutorizacion)}</td>
                <td>
                  <div style="display:flex;gap:6px">
                    <button class="btn btn-secondary btn-sm" onclick="verDetalle('${t.id}')">Ver</button>
                    <button class="btn btn-primary btn-sm"   onclick="modalRecibir('${t.id}')">Confirmar Recepción</button>
                  </div>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>`
      }
    </div>
  </div>`;
}

function modalRecibir(id) {
  const t = S.traspasos.find(x => x.id === id);
  const user = getUser();
  const defaultReceptor = user ? (user.nombre || user.username || '') : '';

  openModal(
    `Confirmar Recepción ${t.folio}`,
    `<div style="margin-bottom:16px">
       <strong>Destino:</strong> ${getCC(t.ccDestino).nombre} · ${getDesarrollo(getCC(t.ccDestino).empresaId).nombre}
     </div>
     ${resumenItems(t)}
     <div class="form-group" style="margin-top:16px">
       <label>Nombre del Receptor *</label>
       <input type="text" id="rxr-nombre" value="${defaultReceptor}" placeholder="Nombre de quien recibe">
     </div>
     <div class="form-group" style="margin-top:12px">
       <label>Comentarios (opcional)</label>
       <textarea id="rxr-comment" placeholder="Observaciones de la recepción..."></textarea>
     </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary"   onclick="doRecibir('${id}')">Confirmar Recepción</button>`
  );
}

function doRecibir(id) {
  const nombre = document.getElementById('rxr-nombre').value.trim();
  if (!nombre) return alert('Ingrese el nombre del receptor');

  const t = S.traspasos.find(x => x.id === id);
  t.status        = 'recibido';
  t.receptor      = nombre;
  t.fechaRecepcion= now();
  t.comentarioRec = document.getElementById('rxr-comment').value.trim();
  saveState('traspasos');
  closeModal();

  openModal(
    'Recepción Confirmada',
    `<div style="text-align:center;padding:20px">
       <div style="font-size:18px;font-weight:800;margin-bottom:4px">📦 Material Recibido</div>
       <div style="font-size:22px;font-weight:900;color:var(--blue);margin-bottom:16px">${t.folio}</div>
       <p style="color:#555;font-size:13px">El traspaso ha sido completado exitosamente.</p>
     </div>`,
    `<button class="btn btn-primary"   onclick="closeModal();imprimirTraspaso('${id}', true)">Imprimir Acuse de Recibo</button>
     <button class="btn btn-secondary" onclick="closeModal();renderRecepcion()">Continuar</button>`
  );
  updateBadges();
}
