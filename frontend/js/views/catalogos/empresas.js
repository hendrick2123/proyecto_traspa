// =====================================================
// CATÁLOGO – Empresas
// =====================================================

function renderEmpresas() {
  document.getElementById('content').innerHTML = `
  <div class="card">
    <div class="card-header">
      <h3>Empresas (${S.empresas.length})</h3>
    </div>
    <div class="table-wrap" id="emp-table">
      ${renderEmpresasTable()}
    </div>
  </div>`;
}

function renderEmpresasTable() {
  const sorted = [...S.empresas].sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));
  return `<table>
    <thead><tr><th>Clave</th><th>Razón Social</th><th>Centros de Costo</th><th></th></tr></thead>
    <tbody>
      ${sorted.map(e => `
      <tr>
        <td><strong>${e.id}</strong></td>
        <td>${e.nombre}</td>
        <td class="text-sm">${S.centrosCosto.filter(c => c.empresaId === e.id).length}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="modalEditEmpresa('${e.id}')">Editar</button>
        </td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}

function modalNuevaEmpresa() {
  openModal(
    'Nueva Empresa',
    `<div class="form-grid" style="gap:12px">
       <div class="form-group"><label>Clave / ID *</label><input type="text" id="ne-id" placeholder="Ej: TOKIO"></div>
       <div class="form-group"><label>Razón Social *</label><input type="text" id="ne-nombre" placeholder="Nombre completo de la empresa"></div>
     </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary"   onclick="doNuevaEmpresa()">Guardar</button>`
  );
}

function doNuevaEmpresa() {
  const id     = document.getElementById('ne-id').value.trim().toUpperCase();
  const nombre = document.getElementById('ne-nombre').value.trim();
  if (!id || !nombre) return alert('Complete los campos obligatorios');
  if (S.empresas.find(e => e.id === id)) return alert('Ya existe una empresa con esa clave');
  S.empresas.push({ id, nombre });
  saveState();
  closeModal();
  renderEmpresas();
}

function modalEditEmpresa(id) {
  const e = S.empresas.find(x => x.id === id);
  openModal(
    `Editar Empresa: ${id}`,
    `<div class="form-grid" style="gap:12px">
       <div class="form-group"><label>Razón Social *</label><input type="text" id="ee-nombre" value="${e.nombre}"></div>
     </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary"   onclick="doEditEmpresa('${id}')">Guardar</button>`
  );
}

function doEditEmpresa(id) {
  const e  = S.empresas.find(x => x.id === id);
  e.nombre = document.getElementById('ee-nombre').value.trim();
  saveState();
  closeModal();
  renderEmpresas();
}
