// =====================================================
// VIEW – Recepción
// =====================================================

function renderRecepcion() {
  const autorizados = filtrarPorEmpresa(S.traspasos.filter(t => t.status === 'autorizado'));
  const user = getUser();
  const showRevert = user && ['residente', 'control_obra', 'administrador'].includes(user.rol);

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
                    ${showRevert ? `<button class="btn btn-danger btn-sm" onclick="confirmarRevertir('${t.id}')" title="Revertir autorizaciones y regresar a pendiente">Revertir</button>` : ''}
                  </div>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>`
      }
    </div>
  </div>`;
}

function confirmarRevertir(id) {
  const t = S.traspasos.find(x => x.id === id);
  if (!t) return;

  openModal(
    `Revertir Autorización ${t.folio}`,
    `<div class="alert alert-warning" style="margin-bottom:16px">
       <strong>¿Está seguro de que desea revertir las autorizaciones de este traspaso?</strong>
       <br><br>Esto restablecerá el estado a <strong>Pendiente de Autorización</strong> y eliminará las firmas actuales, permitiendo modificar el vale.
     </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-danger"    onclick="doRevertir('${id}')">Confirmar Reversión</button>`
  );
}

function doRevertir(id) {
  const t = S.traspasos.find(x => x.id === id);
  if (!t) return;

  const originalStatus = t.status;
  const originalAuth = t.autorizador;
  const originalFecha = t.fechaAutorizacion;
  const originalComm = t.comentarioAuth;
  const originalAuth2 = t.autorizador2;
  const originalFecha2 = t.fechaAutorizacion2;
  const originalComm2 = t.comentarioAuth2;

  // Reset all authorization fields to roll back to pending
  t.status = 'pendiente';
  t.autorizador = null;
  t.fechaAutorizacion = null;
  t.comentarioAuth = null;
  t.autorizador2 = null;
  t.fechaAutorizacion2 = null;
  t.comentarioAuth2 = null;

  const btnSubmit = document.querySelector('.modal-overlay .btn-danger');
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Guardando...';
  }

  saveState('traspasos')
    .then(() => {
      closeModal();
      renderRecepcion();
      updateBadges();
    })
    .catch(err => {
      // Revert state back on error
      t.status = originalStatus;
      t.autorizador = originalAuth;
      t.fechaAutorizacion = originalFecha;
      t.comentarioAuth = originalComm;
      t.autorizador2 = originalAuth2;
      t.fechaAutorizacion2 = originalFecha2;
      t.comentarioAuth2 = originalComm2;

      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Confirmar Reversión';
      }
      alert('Error al guardar en el servidor: ' + err.message);
    });
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
