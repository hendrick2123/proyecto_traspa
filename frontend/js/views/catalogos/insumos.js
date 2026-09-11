// =====================================================
// CATÁLOGO – Insumos (General + Post-Venta)
// =====================================================

let _insumosActiveTab = 'general'; // 'general' | 'postventa'

function renderInsumos() {
  const user = getUser();
  const isAdmin = user && user.rol === 'administrador';
  const isPostventa = user && user.rol === 'postventa';

  // Postventa solo ve su tabla
  if (isPostventa) {
    _insumosActiveTab = 'postventa';
    _renderInsumosPostventa();
    return;
  }

  // Admin ve tabs
  if (isAdmin) {
    document.getElementById('content').innerHTML = `
    <div style="margin-bottom:16px;display:flex;gap:8px">
      <button class="btn ${_insumosActiveTab === 'general' ? 'btn-primary' : 'btn-secondary'} btn-sm"
              id="tab-ins-general" onclick="_switchInsumosTab('general')">
        📦 Insumos Generales
      </button>
      <button class="btn ${_insumosActiveTab === 'postventa' ? 'btn-primary' : 'btn-secondary'} btn-sm"
              id="tab-ins-pv" onclick="_switchInsumosTab('postventa')">
        🔧 Insumos Post-Venta
      </button>
    </div>
    <div id="insumos-tab-content"></div>`;

    if (_insumosActiveTab === 'general') {
      _renderInsumosGeneralInto('insumos-tab-content');
    } else {
      _renderInsumosPostventaInto('insumos-tab-content');
    }
    return;
  }

  // Otros roles: solo general (sin botón agregar)
  _renderInsumosGeneralInto('content');
}

function _switchInsumosTab(tab) {
  _insumosActiveTab = tab;
  renderInsumos();
}

// ── GENERAL ────────────────────────────────────────────
function _renderInsumosGeneralInto(containerId) {
  const filteredInsumos = S.insumos.filter(i => {
    const first = String(i.id).charAt(0);
    return first === '1' || first === '3';
  });

  document.getElementById(containerId).innerHTML = `
  <div class="card">
    <div class="card-header">
      <h3>Insumos Generales (${filteredInsumos.length})</h3>
    </div>
    <div class="table-wrap" id="ins-table">
      ${_renderInsumosGeneralTable(filteredInsumos)}
    </div>
  </div>`;
}

function _renderInsumosGeneralTable(filteredInsumos) {
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

// ── POST-VENTA ─────────────────────────────────────────
function _renderInsumosPostventa() {
  document.getElementById('content').innerHTML = `
  <div class="card">
    <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
      <h3>Insumos Post-Venta (${(S.insumos_postventa || []).length})</h3>
      <button class="btn btn-primary btn-sm" onclick="modalNuevoInsumoPostventa()">+ Agregar Insumo</button>
    </div>
    <div class="table-wrap" id="ins-pv-table">
      ${_renderInsumosPostventaTable()}
    </div>
  </div>`;
}

function _renderInsumosPostventaInto(containerId) {
  const user = getUser();
  const isAdmin = user && user.rol === 'administrador';
  document.getElementById(containerId).innerHTML = `
  <div class="card">
    <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
      <h3>Insumos Post-Venta (${(S.insumos_postventa || []).length})</h3>
      ${isAdmin || (user && user.rol === 'postventa') ? `<button class="btn btn-primary btn-sm" onclick="modalNuevoInsumoPostventa()">+ Agregar Insumo</button>` : ''}
    </div>
    <div class="table-wrap" id="ins-pv-table">
      ${_renderInsumosPostventaTable()}
    </div>
  </div>`;
}

function _renderInsumosPostventaTable() {
  const items = S.insumos_postventa || [];
  const user = typeof getUser === 'function' ? getUser() : null;
  const canEdit = user && (user.rol === 'administrador' || user.rol === 'postventa');
  
  if (items.length === 0) {
    return `<div class="empty-state" style="padding:40px 20px;text-align:center">
      <div style="font-size:40px;margin-bottom:12px">📭</div>
      <p style="color:#888">No hay insumos de post-venta registrados aún.</p>
    </div>`;
  }
  return `<table>
    <thead><tr><th>ID</th><th>Descripción</th><th>Tipo</th><th>Unidad</th><th>Cantidad</th><th>Especialidad</th><th>Creado por</th>${canEdit ? '<th>Acciones</th>' : ''}</tr></thead>
    <tbody>
      ${items.map(i => `
      <tr>
        <td class="text-sm" style="font-family:monospace;font-weight:700;color:#1e40af">${i.clave || i.id}</td>
        <td>${i.nombre}</td>
        <td class="text-sm">${i.categoria || '—'}</td>
        <td class="text-sm">${i.unidad || '—'}</td>
        <td class="text-sm" style="font-weight:700;color:var(--green)">${i.cantidad !== undefined ? i.cantidad : 0}</td>
        <td class="text-sm">${i.especialidad || '—'}</td>
        <td class="text-sm">${i.creado_por || '—'}</td>
        ${canEdit ? `<td>
          <div style="display:flex;gap:6px;align-items:center">
            <button class="btn btn-secondary btn-sm" onclick="modalAddStockPostventa('${i.id}')">➕ Agregar Stock</button>
            <button class="btn btn-secondary btn-sm" style="color:var(--red,#e74c3c);border-color:#fca5a5" onclick="modalRemoveStockPostventa('${i.id}')">➖ Registrar Salida</button>
          </div>
        </td>` : ''}
      </tr>`).join('')}
    </tbody>
  </table>`;
}

// ── MODAL: Nuevo Insumo Post-Venta ─────────────────────
const CATEGORIAS_INSUMO = ['Materiales', 'Equipo', 'Herramienta', 'Consumibles', 'Otro'];

function modalNuevoInsumoPostventa() {
  openModal(
    'Nuevo Insumo Post-Venta',
    `<div class="form-grid form-grid-2" style="gap:12px">
       <div class="form-group" style="grid-column:1/-1">
         <label>Descripción *</label>
         <input type="text" id="ni-pv-nombre" placeholder="Nombre completo del insumo">
       </div>
       <div class="form-group">
         <label>Tipo de Material</label>
         <select id="ni-pv-cat" onchange="_onTipoChange()">
           ${CATEGORIAS_INSUMO.map(c => `<option>${c}</option>`).join('')}
         </select>
       </div>
       <div class="form-group" id="ni-pv-otro-wrap" style="display:none">
         <label>Especifique el tipo *</label>
         <input type="text" id="ni-pv-otro" placeholder="Escriba el tipo de material">
       </div>
       <div class="form-group">
         <label>Unidad de Medida *</label>
         <input type="text" id="ni-pv-unidad" placeholder="Ej: kg, m², Pieza">
       </div>
       <div class="form-group">
         <label>Cantidad (Piezas) *</label>
         <input type="number" id="ni-pv-cantidad" value="0" min="0" step="any" placeholder="0">
       </div>
       <div class="form-group">
         <label>Especialidad</label>
         <input type="text" id="ni-pv-especialidad" placeholder="Ej: Plomería, Eléctrica">
       </div>
     </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="doNuevoInsumoPostventa()">Guardar</button>`
  );
}

function _onTipoChange() {
  const sel = document.getElementById('ni-pv-cat');
  const otroWrap = document.getElementById('ni-pv-otro-wrap');
  if (sel && otroWrap) {
    otroWrap.style.display = sel.value === 'Otro' ? '' : 'none';
  }
}

async function doNuevoInsumoPostventa() {
  const nombre = document.getElementById('ni-pv-nombre').value.trim();
  const unidad = document.getElementById('ni-pv-unidad').value.trim();
  const cantidad = parseFloat(document.getElementById('ni-pv-cantidad').value) || 0;
  let categoria = document.getElementById('ni-pv-cat').value;
  const especialidad = document.getElementById('ni-pv-especialidad').value.trim();

  if (categoria === 'Otro') {
    const otro = document.getElementById('ni-pv-otro').value.trim();
    if (!otro) return alert('Especifique el tipo de material');
    categoria = otro;
  }

  if (!nombre || !unidad) return alert('Complete los campos obligatorios (Descripción y Unidad)');

  const token = sessionStorage.getItem('gu_token');
  try {
    const res = await fetch(API_BASE + '/api/insumos_postventa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ nombre, unidad, categoria, especialidad, cantidad })
    });
    const data = await res.json();
    if (data.status === 'success') {
      // Agregar al estado local
      S.insumos_postventa = S.insumos_postventa || [];
      const user = getUser();
      S.insumos_postventa.push({
        id: data.id,
        clave: data.clave,
        nombre, unidad, categoria, especialidad, cantidad,
        creado_por: user ? user.username : ''
      });
      closeModal();
      renderInsumos();
    } else {
      alert('Error al guardar: ' + (data.message || 'Intente nuevamente'));
    }
  } catch (err) {
    console.error(err);
    alert('Error de conexión al guardar el insumo');
  }
}

// ── EDIT (General – legacy) ─────────────────────────────
function modalEditInsumo(id) {
  const i = S.insumos.find(x => x.id === id);
  if (!i) return;
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

// ── ADD STOCK (Post-Venta) ──────────────────────────────
function modalAddStockPostventa(id) {
  const i = S.insumos_postventa.find(x => x.id === id);
  if (!i) return;
  openModal(
    `Agregar Stock: ${i.nombre}`,
    `<div class="form-group" style="margin-bottom:15px">
       <p style="font-size: 14px; color: #555;">Cantidad actual: <strong>${i.cantidad !== undefined ? i.cantidad : 0}</strong></p>
     </div>
     <div class="form-group" style="margin-bottom:12px">
       <label>Número de Orden de Compra *</label>
       <input type="text" id="as-pv-orden-compra" placeholder="Ej: OC-2026-001">
     </div>
     <div class="form-group">
       <label>Cantidad a agregar *</label>
       <input type="number" id="as-pv-cantidad" value="0" min="0" step="any" placeholder="Ej: 10">
     </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="doAddStockPostventa('${id}')">Agregar Stock</button>`
  );
}

async function doAddStockPostventa(id) {
  const orden_compra = document.getElementById('as-pv-orden-compra').value.trim();
  const add_val = parseFloat(document.getElementById('as-pv-cantidad').value);

  if (!orden_compra) {
    return alert('Por favor ingrese el número de Orden de Compra.');
  }

  if (isNaN(add_val) || add_val <= 0) {
    return alert('Ingrese una cantidad válida mayor a 0');
  }

  const token = sessionStorage.getItem('gu_token');
  try {
    const res = await fetch(API_BASE + '/api/insumos_postventa/' + id + '/add_stock', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ cantidad: add_val, orden_compra: orden_compra })
    });
    const data = await res.json();
    if (data.status === 'success') {
      const i = S.insumos_postventa.find(x => x.id === id);
      if (i) {
        i.cantidad = data.new_cantidad;
      }
      closeModal();
      renderInsumos();
    } else {
      alert('Error al actualizar: ' + (data.message || 'Intente nuevamente'));
    }
  } catch (err) {
    console.error(err);
    alert('Error de conexión al agregar stock');
  }
}

// ── REGISTRAR SALIDA (Post-Venta) ──────────────────────
function modalRemoveStockPostventa(id) {
  const i = S.insumos_postventa.find(x => x.id === id);
  if (!i) return;
  const cantActual = i.cantidad !== undefined ? parseFloat(i.cantidad) : 0;
  openModal(
    `Registrar Salida: ${i.nombre}`,
    `<div class="form-group" style="margin-bottom:15px">
       <p style="font-size: 14px; color: #555;">Stock disponible: <strong>${cantActual}</strong> ${i.unidad || ''}</p>
     </div>
     <div class="form-group" style="margin-bottom:12px">
       <label>Referencia / Folio / Motivo de Salida *</label>
       <input type="text" id="rs-pv-motivo" placeholder="Ej: Salida a obra, Folio #1234, etc.">
     </div>
     <div class="form-group">
       <label>Cantidad a retirar (Salida) *</label>
       <input type="number" id="rs-pv-cantidad" value="0" min="0.01" max="${cantActual}" step="any" placeholder="Ej: 5">
     </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-danger" style="background:#e74c3c;border-color:#c0392b;color:#fff;font-weight:700" onclick="doRemoveStockPostventa('${id}')">Registrar Salida</button>`
  );
}

async function doRemoveStockPostventa(id) {
  const motivo = document.getElementById('rs-pv-motivo').value.trim();
  const remove_val = parseFloat(document.getElementById('rs-pv-cantidad').value);

  if (!motivo) {
    return alert('Por favor ingrese la referencia o motivo de la salida.');
  }

  if (isNaN(remove_val) || remove_val <= 0) {
    return alert('Ingrese una cantidad válida mayor a 0');
  }

  const i = S.insumos_postventa.find(x => x.id === id);
  const cantActual = i && i.cantidad !== undefined ? parseFloat(i.cantidad) : 0;
  if (remove_val > cantActual) {
    return alert(`La cantidad a retirar (${remove_val}) supera el stock disponible (${cantActual}).`);
  }

  const token = sessionStorage.getItem('gu_token');
  try {
    const res = await fetch(API_BASE + '/api/insumos_postventa/' + id + '/remove_stock', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ cantidad: remove_val, orden_compra: motivo })
    });
    const data = await res.json();
    if (data.status === 'success') {
      if (i) {
        i.cantidad = data.new_cantidad;
      }
      closeModal();
      renderInsumos();
    } else {
      alert('Error al registrar salida: ' + (data.message || 'Intente nuevamente'));
    }
  } catch (err) {
    console.error(err);
    alert('Error de conexión al registrar la salida');
  }
}

