// =====================================================
// CATÁLOGO – Centros de Costo
// =====================================================

function renderCentrosCosto() {
  document.getElementById('content').innerHTML = `
  <div class="card">
    <div class="card-header">
      <h3>Centros de Costo (${S.centrosCosto.length})</h3>
      <div style="display:flex;gap:8px">
        <select id="fil-cc-emp" class="btn btn-secondary" style="height:32px" onchange="filtrarCC()">
          <option value="">Todas las empresas</option>
          ${S.empresas.map(e => `<option value="${e.id}">${e.id} – ${e.nombre.split(' SA')[0]}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="table-wrap" id="cc-table">
      ${renderCCTable(S.centrosCosto)}
    </div>
  </div>`;
}

function filtrarCC() {
  const empId = document.getElementById('fil-cc-emp').value;
  const list  = empId ? S.centrosCosto.filter(c => c.empresaId === empId) : S.centrosCosto;
  document.getElementById('cc-table').innerHTML = renderCCTable(list);
}

function renderCCTable(list) {
  return `<table>
    <thead><tr><th>ID</th><th>Nombre del Proyecto</th><th>Empresa</th><th>Dirección</th><th></th></tr></thead>
    <tbody>
      ${list.map(c => `
      <tr>
        <td class="text-sm" style="font-family:monospace">${c.id}</td>
        <td><strong>${c.nombre}</strong></td>
        <td class="text-sm">${getEmpresa(c.empresaId).id || c.empresaId || '—'}</td>
        <td class="text-sm">${c.direccion || '—'}</td>
        <td><button class="btn btn-secondary btn-sm" onclick="modalEditCC('${c.id}')">Editar</button></td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}

function modalNuevoCC() {
  openModal(
    'Nuevo Centro de Costo',
    `<div class="form-grid" style="gap:12px">
       <div class="form-group"><label>Empresa *</label>
         <select id="nc-emp">
           <option value="">-- Seleccionar --</option>
           ${S.empresas.map(e => `<option value="${e.id}">${e.id} – ${e.nombre.split(' SA')[0]}</option>`).join('')}
         </select>
       </div>
       <div class="form-group"><label>Nombre del Proyecto *</label><input type="text" id="nc-nombre" placeholder="Ej: Alameda Park 3"></div>
       <div class="form-group"><label>Dirección</label><input type="text" id="nc-dir" placeholder="Calle y número"></div>
     </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary"   onclick="doNuevoCC()">Guardar</button>`
  );
}

function doNuevoCC() {
  const empId  = document.getElementById('nc-emp').value;
  const nombre = document.getElementById('nc-nombre').value.trim();
  const dir    = document.getElementById('nc-dir').value.trim();
  if (!empId || !nombre) return alert('Complete los campos obligatorios');
  const id = 'CC' + String(S.centrosCosto.length + 1).padStart(3, '0');
  S.centrosCosto.push({ id, empresaId: empId, nombre, direccion: dir });
  saveState();
  closeModal();
  renderCentrosCosto();
}

function modalEditCC(id) {
  const c = S.centrosCosto.find(x => x.id === id);
  openModal(
    `Editar CC: ${c.nombre}`,
    `<div class="form-grid" style="gap:12px">
       <div class="form-group"><label>Empresa *</label>
         <select id="ec-emp">
           ${S.empresas.map(e => `<option value="${e.id}" ${e.id === c.empresaId ? 'selected' : ''}>${e.id} – ${e.nombre.split(' SA')[0]}</option>`).join('')}
         </select>
       </div>
       <div class="form-group"><label>Nombre *</label><input type="text" id="ec-nombre" value="${c.nombre}"></div>
       <div class="form-group"><label>Dirección</label><input type="text" id="ec-dir" value="${c.direccion || ''}"></div>
     </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary"   onclick="doEditCC('${id}')">Guardar</button>`
  );
}

function doEditCC(id) {
  const c    = S.centrosCosto.find(x => x.id === id);
  c.empresaId= document.getElementById('ec-emp').value;
  c.nombre   = document.getElementById('ec-nombre').value.trim();
  c.direccion= document.getElementById('ec-dir').value.trim();
  saveState();
  closeModal();
  renderCentrosCosto();
}
