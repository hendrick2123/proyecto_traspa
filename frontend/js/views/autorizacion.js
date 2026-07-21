// =====================================================
// VIEW – Autorización
// =====================================================

function renderTablaAutorizaciones(pendientes, titulo, esFirmaDos) {
  return `
  <div class="card" style="margin-bottom: 24px">
    <div class="card-header"><h3>${titulo} (${pendientes.length})</h3></div>
    <div class="table-wrap">
      ${pendientes.length === 0
        ? '<div class="empty-state"><p>Sin solicitudes pendientes</p><span>Todas las solicitudes han sido procesadas</span></div>'
        : `<table>
            <thead><tr><th>Folio</th><th>Tipo</th><th>Origen</th><th>Destino</th><th>Insumos</th><th>Solicitante</th><th>Fecha Sol.</th>${esFirmaDos ? '<th style="display:none">VoBo (Residente)</th>' : ''}<th>Acciones</th></tr></thead>
            <tbody>
              ${pendientes.map(t => `
              <tr>
                <td><strong>${t.folio}</strong></td>
                <td>
                   ${tipoBadge(t.tipo)}
                   ${t.folioOriginalRef ? `<div style="font-size:10px;color:#718096;margin-top:4px;font-weight:600">Ref: ${t.folioOriginalRef}</div>` : ''}
                 </td>
                <td class="text-sm">
                  <div style="font-weight:600">${getCC(t.ccOrigen).nombre}</div>
                  <div style="color:#888;font-size:11px">${getDesarrollo(getCC(t.ccOrigen).empresaId).nombre}</div>
                </td>
                <td class="text-sm">
                  <div style="font-weight:600">${getCC(t.ccDestino).nombre}</div>
                  <div style="color:#888;font-size:11px">${getDesarrollo(getCC(t.ccDestino).empresaId).nombre}</div>
                </td>
                <td class="text-sm">${t.items.length} insumo(s)</td>
                <td class="text-sm">${t.solicitante}</td>
                <td class="text-sm">${fmtDate(t.fechaSolicitud)}</td>
                ${esFirmaDos ? `<td style="display:none" class="text-sm"><span style="font-weight:600">${t.autorizador || '—'}</span><div style="color:#888;font-size:10px">${fmtDate(t.fechaAutorizacion)}</div></td>` : ''}
                <td>
                  <div style="display:flex;gap:6px">
                    <button class="btn btn-secondary btn-sm" onclick="verDetalle('${t.id}')">Ver</button>
                    <button class="btn btn-primary btn-sm"   onclick="modalAutorizar('${t.id}')">Autorizar</button>
                    <button class="btn btn-danger btn-sm"    onclick="modalRechazar('${t.id}')">Rechazar</button>
                  </div>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>`
      }
    </div>
  </div>`;
}

function renderAutorizacion() {
  const user = getUser();
  if (!user) return;

  let html = `
  <div class="alert alert-info" style="margin-bottom:16px">
    <strong>Módulo de Autorización:</strong> Revise, autorice o rechace las solicitudes de traspaso pendientes.
  </div>`;

  if (user.rol === 'residente') {
    const pendientes = filtrarPorEmpresa(S.traspasos.filter(t => t.status === 'pendiente'));
    html += renderTablaAutorizaciones(pendientes, 'Solicitudes Pendientes (VoBo - Residente)', false);
  } else if (user.rol === 'control_obra') {
    const pendientes = filtrarPorEmpresa(S.traspasos.filter(t => t.status === 'pre_autorizado'));
    html += renderTablaAutorizaciones(pendientes, 'Solicitudes Pendientes (Autorizo - Control de Obra)', true);
  } else if (user.rol === 'administrador') {
    const pendientesRes = filtrarPorEmpresa(S.traspasos.filter(t => t.status === 'pendiente'));
    const pendientesCO = filtrarPorEmpresa(S.traspasos.filter(t => t.status === 'pre_autorizado'));
    html += renderTablaAutorizaciones(pendientesRes, 'Pendientes de Residente (VoBo)', false);
    html += renderTablaAutorizaciones(pendientesCO, 'Pendientes de Control de Obra (Autorizo)', true);
  } else {
    html += `<div class="card"><div class="card-body text-center">No tienes permisos para autorizar solicitudes.</div></div>`;
  }

  document.getElementById('content').innerHTML = html;
}

function modalAutorizar(id) {
  const t = S.traspasos.find(x => x.id === id);
  if (!t) return;

  const esFirmaDos = t.status === 'pre_autorizado';
  const roleRequired = esFirmaDos ? 'control_obra' : 'residente';
  const roleLabel = esFirmaDos ? 'Control de Obra' : 'Residente';

  openModal(
    `Autorizar Traspaso ${t.folio} (${roleLabel})`,
    `<div style="margin-bottom:16px">${resumenItems(t)}</div>
     <div class="form-group">
       <label>Nombre del Autorizador (${roleLabel}) *</label>
       <select id="auth-nombre"><option value="">Cargando...</option></select>
     </div>
     <div class="form-group" style="margin-top:12px">
       <label>Comentarios (opcional)</label>
       <textarea id="auth-comment" placeholder="Observaciones de la autorización..."></textarea>
     </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary"   onclick="doAutorizar('${id}', ${esFirmaDos})">Confirmar Autorización</button>`
  );

  fetch(API_BASE + '/api/users')
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById('auth-nombre');
      if (!select) return;
      if (data.users) {
        const autores = data.users.filter(u => u.rol === roleRequired && u.activo);
        if (autores.length > 0) {
          select.innerHTML = '<option value="">-- Seleccionar autorizador --</option>' + 
            autores.map(u => `<option value="${u.nombre}">${u.nombre}</option>`).join('');
          
          const currentUser = getUser();
          if (currentUser && currentUser.rol === roleRequired) {
            const matched = autores.find(u => u.nombre === currentUser.nombre);
            if (matched) select.value = matched.nombre;
          }
        } else {
          select.innerHTML = `<option value="">No hay usuarios con rol ${roleLabel}</option>`;
        }
      }
    });
}

function doAutorizar(id, esFirmaDos) {
  const nombre = document.getElementById('auth-nombre').value.trim();
  if (!nombre) return alert('Ingrese el nombre del autorizador');

  const t = S.traspasos.find(x => x.id === id);
  if (!t) return;

  const originalStatus = t.status;
  const originalAuth = t.autorizador;
  const originalFecha = t.fechaAutorizacion;
  const originalComm = t.comentarioAuth;
  const originalAuth2 = t.autorizador2;
  const originalFecha2 = t.fechaAutorizacion2;
  const originalComm2 = t.comentarioAuth2;

  if (esFirmaDos) {
    t.status            = 'autorizado';
    t.autorizador2      = nombre;
    t.fechaAutorizacion2= now();
    t.comentarioAuth2   = document.getElementById('auth-comment').value.trim();
  } else {
    t.status            = 'pre_autorizado';
    t.autorizador       = nombre;
    t.fechaAutorizacion = now();
    t.comentarioAuth    = document.getElementById('auth-comment').value.trim();
  }

  const btnSubmit = document.querySelector('.modal-footer .btn-primary');
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Guardando...';
  }

  saveState('traspasos')
    .then(() => {
      closeModal();
      const successTitle = esFirmaDos ? 'Traspaso Autorizado Completamente' : 'Traspaso Pre-Autorizado';
      const successDesc = esFirmaDos 
        ? 'El traspaso está listo para su recepción en destino.' 
        : 'El traspaso ha sido pre-autorizado. Falta la firma de Control de Obra.';

      openModal(
        successTitle,
        `<div style="text-align:center;padding:20px">
           <div style="font-size:18px;font-weight:800;margin-bottom:4px">✅ ${successTitle}</div>
           <div style="font-size:22px;font-weight:900;color:var(--green);margin-bottom:16px">${t.folio}</div>
           <p style="color:#555;font-size:13px">${successDesc}</p>
         </div>`,
        `${esFirmaDos ? `<button class="btn btn-primary" onclick="closeModal();imprimirTraspaso('${id}')">Imprimir Autorización</button>` : ''}
         <button class="btn btn-secondary" onclick="closeModal();renderAutorizacion()">Continuar</button>`
      );
      updateBadges();
    })
    .catch(err => {
      // Revert state
      t.status = originalStatus;
      t.autorizador = originalAuth;
      t.fechaAutorizacion = originalFecha;
      t.comentarioAuth = originalComm;
      t.autorizador2 = originalAuth2;
      t.fechaAutorizacion2 = originalFecha2;
      t.comentarioAuth2 = originalComm2;

      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Confirmar Autorización';
      }
      alert('Error al guardar en el servidor: ' + err.message);
    });
}

function modalRechazar(id) {
  const t = S.traspasos.find(x => x.id === id);
  if (!t) return;

  const esFirmaDos = t.status === 'pre_autorizado';
  const roleRequired = esFirmaDos ? 'control_obra' : 'residente';
  const roleLabel = esFirmaDos ? 'Control de Obra' : 'Residente';

  openModal(
    `Rechazar Traspaso ${t.folio}`,
    `<div class="alert alert-warning">Esta acción no se puede deshacer. El traspaso quedará marcado como rechazado.</div>
     <div class="form-group">
       <label>Nombre del Autorizador (${roleLabel}) *</label>
       <select id="rec-nombre"><option value="">Cargando...</option></select>
     </div>
     <div class="form-group" style="margin-top:12px">
       <label>Motivo del Rechazo *</label>
       <textarea id="rec-motivo" placeholder="Indique el motivo del rechazo..."></textarea>
     </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-danger"    onclick="doRechazar('${id}')">Confirmar Rechazo</button>`
  );

  fetch(API_BASE + '/api/users')
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById('rec-nombre');
      if (!select) return;
      if (data.users) {
        const autores = data.users.filter(u => u.rol === roleRequired && u.activo);
        if (autores.length > 0) {
          select.innerHTML = '<option value="">-- Seleccionar autorizador --</option>' + 
            autores.map(u => `<option value="${u.nombre}">${u.nombre}</option>`).join('');
          
          const currentUser = getUser();
          if (currentUser && currentUser.rol === roleRequired) {
            const matched = autores.find(u => u.nombre === currentUser.nombre);
            if (matched) select.value = matched.nombre;
          }
        } else {
          select.innerHTML = `<option value="">No hay usuarios con rol ${roleLabel}</option>`;
        }
      }
    });
}

function doRechazar(id) {
  const nombre = document.getElementById('rec-nombre').value.trim();
  const motivo = document.getElementById('rec-motivo').value.trim();
  if (!nombre) return alert('Ingrese el nombre del autorizador');
  if (!motivo) return alert('Ingrese el motivo del rechazo');

  const t = S.traspasos.find(x => x.id === id);
  if (!t) return;

  const originalStatus = t.status;
  const originalAuth = t.autorizador;
  const originalFecha = t.fechaAutorizacion;
  const originalComm = t.comentarioAuth;
  const originalAuth2 = t.autorizador2;
  const originalFecha2 = t.fechaAutorizacion2;
  const originalComm2 = t.comentarioAuth2;

  if (t.status === 'pre_autorizado') {
    t.status            = 'rechazado';
    t.autorizador2      = nombre;
    t.fechaAutorizacion2= now();
    t.comentarioAuth2   = motivo;
  } else {
    t.status            = 'rechazado';
    t.autorizador       = nombre;
    t.fechaAutorizacion = now();
    t.comentarioAuth    = motivo;
  }

  const btnSubmit = document.querySelector('.modal-footer .btn-danger');
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Guardando...';
  }

  saveState('traspasos')
    .then(() => {
      closeModal();
      renderAutorizacion();
      updateBadges();
    })
    .catch(err => {
      // Revert state
      t.status = originalStatus;
      t.autorizador = originalAuth;
      t.fechaAutorizacion = originalFecha;
      t.comentarioAuth = originalComm;
      t.autorizador2 = originalAuth2;
      t.fechaAutorizacion2 = originalFecha2;
      t.comentarioAuth2 = originalComm2;

      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Confirmar Rechazo';
      }
      alert('Error al rechazar: ' + err.message);
    });
}

