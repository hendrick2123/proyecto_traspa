// =====================================================
// CATÁLOGO – Insumos
// =====================================================

function renderInsumos() {
  const filteredInsumos = S.insumos.filter(i => {
    const first = String(i.id).charAt(0);
    return first === '1' || first === '3';
  });

  document.getElementById('content').innerHTML = `
  <div class="card">
    <div class="card-header">
      <h3>Insumos (${filteredInsumos.length})</h3>
    </div>
    <div class="table-wrap" id="ins-table">
      ${renderInsumosTable(filteredInsumos)}
    </div>
  </div>`;
}

function renderInsumosTable(filteredInsumos) {
  return `<table>
    <thead><tr><th>INSUMO</th><th>Descripción</th><th>TIPO</th><th>Unidad</th><th></th></tr></thead>
    <tbody>
      ${filteredInsumos.map(i => `
      <tr>
        <td class="text-sm" style="font-family:monospace;font-weight:600">${i.clave}</td>
        <td>${i.nombre}</td>
        <td class="text-sm">${i.categoria || '—'}</td>
        <td class="text-sm">${i.unidad}</td>
        <td><button class="btn btn-secondary btn-sm" onclick="modalEditInsumo('${i.id}')">Editar</button></td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}

const CATEGORIAS_INSUMO = ['Materiales', 'Equipo', 'Herramienta', 'Consumibles', 'Otro'];

function modalNuevoInsumo() {
  openModal(
    'Nuevo Insumo',
    `<div class="form-grid form-grid-2" style="gap:12px">
       <div class="form-group"><label>Insumo *</label><input type="text" id="ni-clave" placeholder="Ej: MAT-010"></div>
       <div class="form-group"><label>Tipo</label>
         <select id="ni-cat">
           ${CATEGORIAS_INSUMO.map(c => `<option>${c}</option>`).join('')}
         </select>
       </div>
       <div class="form-group" style="grid-column:1/-1"><label>Descripción *</label><input type="text" id="ni-nombre" placeholder="Nombre completo del insumo"></div>
       <div class="form-group"><label>Unidad de Medida *</label><input type="text" id="ni-unidad" placeholder="Ej: kg, m², Pieza"></div>
     </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary"   onclick="doNuevoInsumo()">Guardar</button>`
  );
}

function doNuevoInsumo() {
  const clave    = document.getElementById('ni-clave').value.trim().toUpperCase();
  const nombre   = document.getElementById('ni-nombre').value.trim();
  const unidad   = document.getElementById('ni-unidad').value.trim();
  const categoria= document.getElementById('ni-cat').value;
  if (!clave || !nombre || !unidad)           return alert('Complete los campos obligatorios');
  if (S.insumos.find(i => i.clave === clave)) return alert('Ya existe un insumo con esa clave');
  const id = 'INS' + String(S.insumos.length + 1).padStart(3, '0');
  S.insumos.push({ id, clave, nombre, unidad, categoria });
  saveState('insumos');
  closeModal();
  renderInsumos();
}

function modalEditInsumo(id) {
  const i = S.insumos.find(x => x.id === id);
  openModal(
    `Editar Insumo: ${i.clave}`,
    `<div class="form-grid form-grid-2" style="gap:12px">
       <div class="form-group"><label>Insumo</label><input type="text" id="ei-clave" value="${i.clave}"></div>
       <div class="form-group"><label>Tipo</label>
         <select id="ei-cat">
           ${CATEGORIAS_INSUMO.map(c => `<option ${c === i.categoria ? 'selected' : ''}>${c}</option>`).join('')}
         </select>
       </div>
       <div class="form-group" style="grid-column:1/-1"><label>Descripción *</label><input type="text" id="ei-nombre" value="${i.nombre}"></div>
       <div class="form-group"><label>Unidad *</label><input type="text" id="ei-unidad" value="${i.unidad}"></div>
     </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary"   onclick="doEditInsumo('${id}')">Guardar</button>`
  );
}

function doEditInsumo(id) {
  const i    = S.insumos.find(x => x.id === id);
  i.clave    = document.getElementById('ei-clave').value.trim().toUpperCase();
  i.nombre   = document.getElementById('ei-nombre').value.trim();
  i.unidad   = document.getElementById('ei-unidad').value.trim();
  i.categoria= document.getElementById('ei-cat').value;
  saveState('insumos');
  closeModal();
  renderInsumos();
}
