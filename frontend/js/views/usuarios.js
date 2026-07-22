// =====================================================
// VIEW – Gestión de Usuarios (solo Administrador)
// =====================================================

function renderUsuarios() {
  document.getElementById('content').innerHTML = `
  <div class="card">
    <div class="card-header">
      <h3>Gestión de Usuarios</h3>
      <a href="register.html" class="btn btn-primary">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:14px;height:14px">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Nuevo Usuario
      </a>
    </div>
    <div class="card-body">
      <div id="usuarios-loading" style="text-align:center;padding:40px;color:#aaa">
        <div style="border:3px solid #f3f3f3;border-top:3px solid var(--green);border-radius:50%;width:32px;height:32px;animation:spin 1s linear infinite;margin:0 auto 12px"></div>
        Cargando usuarios...
      </div>
      <div id="usuarios-table-wrap" class="table-wrap" style="display:none"></div>
    </div>
  </div>`;

  loadUsuarios();
}

async function loadUsuarios() {
  try {
    const res = await fetch(API_BASE + '/api/users');
    const data = await res.json();

    const wrap = document.getElementById('usuarios-table-wrap');
    const loading = document.getElementById('usuarios-loading');
    loading.style.display = 'none';

    if (!data.users || data.users.length === 0) {
      wrap.innerHTML = '<div class="alert-empty">No hay usuarios registrados.</div>';
      wrap.style.display = 'block';
      return;
    }

    const ROL_LABELS = {
      almacenista: 'Monitor de control',
      control_obra: 'Control de Obra',
      residente: 'Residente',
      administrador: 'Administrador'
    };

    const ROL_COLORS = {
      almacenista: 'badge-draft',
      control_obra: 'badge-authorized',
      residente: 'badge-loan',
      administrador: 'badge-received'
    };

    wrap.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre</th>
            <th>Usuario</th>
            <th>Correo</th>
            <th>Empresa</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Registro</th>
            <th style="width:120px">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${data.users.map((u, i) => `
          <tr id="urow-${u.id}">
            <td style="color:#aaa;font-size:11px">${i + 1}</td>
            <td style="font-weight:600">${u.nombre}</td>
            <td style="font-family:monospace;font-size:12px;color:#555">${u.username}</td>
            <td style="color:#555;font-size:12px">${u.correo}</td>
            <td style="font-size:12px; max-width: 220px;">
              ${u.empresa_id
        ? String(u.empresa_id).split(',').map(eid => {
          let empObj = S && S.empresas ? S.empresas.find(e => String(e.id) === String(eid)) : null;
          if (!empObj && S && S.desarrollos) empObj = S.desarrollos.find(e => String(e.id) === String(eid));
          const name = empObj ? empObj.nombre : eid;
          return `<span style="background:rgba(97,166,14,.12);border:1px solid rgba(97,166,14,.25);border-radius:20px;padding:2px 8px;font-size:10px;color:#61a60e;display:inline-block;margin:2px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.2" title="${name}">${name}</span>`;
        }).join('')
        : '<span style="color:#aaa">Global</span>'}
            </td>
            <td><span class="badge ${ROL_COLORS[u.rol] || 'badge-draft'}">${ROL_LABELS[u.rol] || u.rol}</span></td>
            <td>
              <span class="badge ${u.activo ? 'badge-received' : 'badge-rejected'}">
                ${u.activo ? 'Activo' : 'Inactivo'}
              </span>
            </td>
            <td style="color:#aaa;font-size:11px">${u.creado_en ? new Date(u.creado_en).toLocaleDateString('es-MX') : '—'}</td>
            <td>
              <div style="display:flex;gap:6px">
                <button class="btn btn-sm btn-secondary" onclick="editUsuario(${u.id},'${u.rol}',${u.activo},'${u.empresa_id || ''}', \`${u.nombre.replace(/\\`/g, '')}\`, \`${(u.correo || '').replace(/\\`/g, '')}\`, '${u.cc_ids || ''}' )" title="Editar">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:12px;height:12px">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button class="btn btn-sm ${u.activo ? 'btn-warning' : 'btn-primary'}"
                        onclick="toggleUsuario(${u.id}, ${u.activo})" title="${u.activo ? 'Desactivar' : 'Activar'}">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:12px;height:12px">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="${u.activo
        ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
        : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'}"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>`;
    wrap.style.display = 'block';
  } catch (e) {
    document.getElementById('usuarios-loading').innerHTML =
      '<div class="alert alert-warning">Error al cargar usuarios.</div>';
  }
}

function editUsuario(id, rolActual, activoActual, empresaActual, nombreActual, correoActual, ccActual) {
  const userCcs = (ccActual ? String(ccActual) : '').split(',').filter(Boolean);

  const groups = {};
  if (S && S.centrosCosto) {
    S.centrosCosto.forEach(cc => {
      let empObj = S && S.empresas ? S.empresas.find(e => String(e.id) === String(cc.empresaId)) : null;
      if (!empObj && S && S.desarrollos) empObj = S.desarrollos.find(e => String(e.id) === String(cc.empresaId));
      const empNombre = empObj ? empObj.nombre : cc.empresaId;
      if (!groups[cc.empresaId]) groups[cc.empresaId] = { nombre: empNombre, ccs: [] };
      groups[cc.empresaId].ccs.push(cc);
    });
  }

  let checklistHtml = '';
  for (const empId in groups) {
    const grp = groups[empId];
    checklistHtml += `<div style="font-size:12px;font-weight:700;color:#61a60e;margin-top:8px;margin-bottom:4px;border-bottom:1px solid #ddd;padding-bottom:4px">${grp.nombre}</div>`;
    grp.ccs.forEach(cc => {
      checklistHtml += `
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#333;margin-bottom:4px;cursor:pointer;user-select:none;line-height:1.2;margin-left:10px">
          <input type="checkbox" class="edit-cc-chk" value="${cc.id}" data-empresa="${cc.empresaId}" ${userCcs.includes(cc.id) ? 'checked' : ''} style="cursor:pointer;width:auto;margin:0">
          ${cc.id.substring(0,3)} - ${cc.nombre}
        </label>
      `;
    });
  }
  if (!checklistHtml) checklistHtml = '<div style="color:#888;font-size:12px">No hay centros de costo disponibles</div>';

  const body = `
    <div class="form-group" style="margin-bottom:16px">
      <label style="font-size:11px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px;display:block">Nombre completo *</label>
      <input type="text" id="edit-nombre" value="${nombreActual || ''}" placeholder="Nombre completo" style="width:100%;padding:9px 12px;border:1px solid #ddd;border-radius:6px;font-family:'Montserrat',sans-serif;font-size:13px;box-sizing:border-box">
    </div>
    <div class="form-group" style="margin-bottom:16px">
      <label style="font-size:11px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px;display:block">Nueva contraseña <span style="font-weight:400;color:#aaa">(dejar vacío para no cambiar)</span></label>
      <input type="password" id="edit-password" placeholder="Nueva contraseña (mín. 6 caracteres)" autocomplete="new-password" style="width:100%;padding:9px 12px;border:1px solid #ddd;border-radius:6px;font-family:'Montserrat',sans-serif;font-size:13px;box-sizing:border-box">
    </div>
    <div class="form-group" style="margin-bottom:16px" id="edit-empresa-group">
      <label style="font-size:11px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px;display:block">Centros de Costo a los que pertenece *</label>
      <div style="max-height:150px;overflow-y:auto;border:1px solid #ddd;border-radius:6px;padding:8px 12px;background:#f9f9f9;display:flex;flex-direction:column;gap:4px">
        ${checklistHtml}
      </div>
    </div>
    <div class="form-group" style="margin-bottom:16px">
      <label style="font-size:11px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px;display:block">Nuevo Rol</label>
      <select id="edit-rol" onchange="onEditRolChange()" style="width:100%;padding:9px 12px;border:1px solid #ddd;border-radius:6px;font-family:'Montserrat',sans-serif;font-size:13px">
        <option value="almacenista"   ${rolActual === 'almacenista' ? 'selected' : ''}>&#127959;&#65039; Monitor de control</option>
        <option value="control_obra"  ${rolActual === 'control_obra' ? 'selected' : ''}>&#128203; Control de Obra</option>
        <option value="residente"     ${rolActual === 'residente' ? 'selected' : ''}>&#127968; Residente</option>
        <option value="administrador" ${rolActual === 'administrador' ? 'selected' : ''}>&#128273; Administrador</option>
      </select>
    </div>
    <div class="form-group">
      <label style="font-size:11px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px;display:block">Estado</label>
      <select id="edit-activo" style="width:100%;padding:9px 12px;border:1px solid #ddd;border-radius:6px;font-family:'Montserrat',sans-serif;font-size:13px">
        <option value="true"  ${activoActual ? 'selected' : ''}>&#9989; Activo</option>
        <option value="false" ${!activoActual ? 'selected' : ''}>&#128683; Inactivo</option>
      </select>
    </div>`;

  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="saveUsuario(${id})">Guardar cambios</button>`;

  openModal('Editar usuario', body, footer);

  // Ocultar/mostrar selector de empresas según el rol cargado
  setTimeout(() => {
    onEditRolChange();
  }, 0);
}

function onEditRolChange() {
  const rol = document.getElementById('edit-rol').value;
  const grp = document.getElementById('edit-empresa-group');
  if (grp) {
    grp.style.display = (rol === 'administrador' || rol === 'residente' || rol === 'cordinador') ? 'none' : 'block';
  }
}

async function saveUsuario(id) {
  const nombre = document.getElementById('edit-nombre').value.trim();
  const password = document.getElementById('edit-password').value;
  const rol = document.getElementById('edit-rol').value;
  const activo = document.getElementById('edit-activo').value === 'true';

  if (!nombre) {
    alert('El nombre no puede estar vacío.');
    return;
  }

  let empresa_id = null;
  let cc_ids = null;
  if (rol !== 'administrador' && rol !== 'residente' && rol !== 'cordinador') {
    const checked = document.querySelectorAll('.edit-cc-chk:checked');
    cc_ids = Array.from(checked).map(cb => cb.value).join(',');
    
    const empSet = new Set();
    checked.forEach(cb => empSet.add(cb.getAttribute('data-empresa')));
    empresa_id = Array.from(empSet).join(',');

    if (!cc_ids) {
      alert('Debes seleccionar al menos un centro de costo para roles operativos.');
      return;
    }
  }

  // Construir body: solo incluir password si el admin escribió algo
  const payload = { nombre, rol, activo, empresa_id, cc_ids };
  if (password) payload.password = password;

  try {
    const res = await fetch(API_BASE + `/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || data.error) { alert(data.error || 'Error al guardar.'); return; }
    closeModal();
    loadUsuarios();
  } catch (e) { alert('Error de conexión.'); }
}

async function toggleUsuario(id, activoActual) {
  const newActivo = !activoActual;
  const label = newActivo ? 'activar' : 'desactivar';
  if (!confirm(`¿Seguro que quieres ${label} este usuario?`)) return;

  try {
    const res = await fetch(API_BASE + `/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: newActivo })
    });
    if (!res.ok) { alert('Error al actualizar.'); return; }
    loadUsuarios();
  } catch (e) { alert('Error de conexión.'); }
}
