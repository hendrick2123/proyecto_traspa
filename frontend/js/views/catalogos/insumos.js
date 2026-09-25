// =====================================================
// CATÁLOGO – Insumos (General + Post-Venta)
// =====================================================

let _insumosActiveTab = 'general'; // 'general' | 'postventa'
let _insGeneralSearchQuery = '';
let _insPvSearchQuery = '';

const CATEGORIAS_INSUMO = ['Materiales', 'Equipo', 'Herramienta', 'Consumibles', 'Acabados', 'Otro'];

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

  // Admin y roles con acceso a ambos ven tabs
  if (isAdmin) {
    document.getElementById('content').innerHTML = `
    <div style="margin-bottom:16px;display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap">
      <div style="display:flex;gap:8px">
        <button class="btn ${_insumosActiveTab === 'general' ? 'btn-primary' : 'btn-secondary'} btn-sm"
                id="tab-ins-general" onclick="_switchInsumosTab('general')">
          📦 Almacén General
        </button>
        <button class="btn ${_insumosActiveTab === 'postventa' ? 'btn-primary' : 'btn-secondary'} btn-sm"
                id="tab-ins-pv" onclick="_switchInsumosTab('postventa')">
          🔧 Insumos Post-Venta
        </button>
      </div>
    </div>
    <div id="insumos-tab-content"></div>`;

    if (_insumosActiveTab === 'general') {
      _renderInsumosGeneralInto('insumos-tab-content');
    } else {
      _renderInsumosPostventaInto('insumos-tab-content');
    }
    return;
  }

  // Otros roles (almacenista, residente, etc.): general
  _renderInsumosGeneralInto('content');
}

function _switchInsumosTab(tab) {
  _insumosActiveTab = tab;
  renderInsumos();
}

// ── GENERAL ────────────────────────────────────────────
function _renderInsumosGeneralInto(containerId) {
  const user = getUser();
  const canAdd = user && (user.rol === 'administrador' || user.rol === 'almacenista' || user.rol === 'residente' || user.rol === 'control_obra');

  const todos = S.insumos || [];
  const q = _insGeneralSearchQuery.toLowerCase().trim();
  const filtered = q
    ? todos.filter(i =>
        (i.nombre && i.nombre.toLowerCase().includes(q)) ||
        (i.clave && String(i.clave).toLowerCase().includes(q)) ||
        (i.especificaciones && i.especificaciones.toLowerCase().includes(q)) ||
        (i.categoria && i.categoria.toLowerCase().includes(q)))
    : todos;

  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
  <div class="card">
    <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
      <div>
        <h3 style="margin:0">📦 Inventario Almacén General (${filtered.length} de ${todos.length})</h3>
        <p style="margin:2px 0 0 0;font-size:12px;color:#64748b">Control de stock, especificaciones y fotografías de insumos</p>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <input type="text" id="ins-gen-search-input" placeholder="🔍 Buscar por clave, nombre o estado..." 
               value="${_insGeneralSearchQuery.replace(/"/g, '&quot;')}"
               oninput="_onInsumosGeneralSearch(this.value)"
               style="padding:6px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;width:260px;font-family:'Montserrat',sans-serif">
        ${canAdd ? `<button class="btn btn-primary btn-sm" onclick="modalNuevoInsumoGeneral()">+ Agregar Insumo</button>` : ''}
      </div>
    </div>
    <div class="table-wrap" id="ins-gen-table-wrap">
      ${_renderInsumosGeneralTable(filtered, canAdd)}
    </div>
  </div>`;
}

function _onInsumosGeneralSearch(val) {
  _insGeneralSearchQuery = val;
  const user = getUser();
  const canAdd = user && (user.rol === 'administrador' || user.rol === 'almacenista' || user.rol === 'residente' || user.rol === 'control_obra');
  const todos = S.insumos || [];
  const q = val.toLowerCase().trim();
  const filtered = q
    ? todos.filter(i =>
        (i.nombre && i.nombre.toLowerCase().includes(q)) ||
        (i.clave && String(i.clave).toLowerCase().includes(q)) ||
        (i.especificaciones && i.especificaciones.toLowerCase().includes(q)) ||
        (i.categoria && i.categoria.toLowerCase().includes(q)))
    : todos;
  const wrap = document.getElementById('ins-gen-table-wrap');
  if (wrap) {
    wrap.innerHTML = _renderInsumosGeneralTable(filtered, canAdd);
  }
}

function _renderInsumosGeneralTable(items, canEdit) {
  if (items.length === 0) {
    return `<div class="empty-state" style="padding:40px 20px;text-align:center">
      <div style="font-size:40px;margin-bottom:12px">📭</div>
      <p style="color:#888">No se encontraron insumos generales.</p>
    </div>`;
  }

  // Renderizar hasta 200 items para fluidez
  const list = items.slice(0, 200);

  return `<table>
    <thead>
      <tr>
        <th style="width:50px;text-align:center">Foto</th>
        <th style="width:110px">Clave</th>
        <th>Descripción / Nombre</th>
        <th>Especificaciones / Estado</th>
        <th style="width:100px">Tipo</th>
        <th style="width:80px">Unidad</th>
        <th style="width:120px;text-align:center">Stock Total</th>
        ${canEdit ? '<th style="width:90px;text-align:center">Acciones</th>' : ''}
      </tr>
    </thead>
    <tbody>
      ${list.map(i => {
        const thumb = i.imagen 
          ? `<img src="${i.imagen}" style="width:36px;height:36px;object-fit:cover;border-radius:6px;cursor:pointer;border:1px solid #cbd5e1" onclick="verFotoInsumo('${i.imagen}', '${(i.nombre || '').replace(/'/g, "\\'")}')" title="Ver foto en grande">` 
          : `<div style="width:36px;height:36px;background:#f1f5f9;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:16px" title="Sin foto">📦</div>`;
        
        const stockVal = (i.cantidad !== undefined && i.cantidad !== null && i.cantidad !== '') ? parseFloat(i.cantidad) : '—';
        const stockBadge = stockVal !== '—'
          ? `<span style="display:inline-block;padding:3px 8px;border-radius:12px;font-size:12px;font-weight:700;background:${stockVal > 0 ? 'rgba(22,163,74,.12)' : 'rgba(239,68,68,.12)'};color:${stockVal > 0 ? '#16a34a' : '#dc2626'}">${stockVal} ${i.unidad || ''}</span>`
          : `<span style="color:#94a3b8;font-size:12px">—</span>`;

        return `<tr>
          <td style="text-align:center;padding:6px 8px">${thumb}</td>
          <td class="text-sm" style="font-family:monospace;font-weight:700;color:#1e40af">${i.clave || i.id}</td>
          <td>
            <div style="font-weight:600;color:#1e293b">${i.nombre}</div>
          </td>
          <td>
            ${i.especificaciones ? `<div style="font-size:12px;color:#475569;background:#f8fafc;padding:3px 8px;border-radius:4px;border-left:3px solid #3b82f6">${i.especificaciones}</div>` : '<span style="color:#cbd5e1;font-size:11px">Sin detalles</span>'}
          </td>
          <td class="text-sm">${i.categoria || 'Materiales'}</td>
          <td class="text-sm">${i.unidad || 'Pieza'}</td>
          <td style="text-align:center">${stockBadge}</td>
          ${canEdit ? `<td style="text-align:center">
            <button class="btn btn-secondary btn-sm" style="padding:4px 8px;font-size:11px" onclick="modalEditInsumo('${i.id}')">✏️ Editar</button>
          </td>` : ''}
        </tr>`;
      }).join('')}
    </tbody>
  </table>
  ${items.length > 200 ? `<div style="padding:10px 16px;text-align:center;font-size:12px;color:#888;background:#f8fafc;border-top:1px solid #e2e8f0">Mostrando los primeros 200 de ${items.length} insumos. Usa el buscador para filtrar.</div>` : ''}`;
}

// ── MODAL: Nuevo Insumo General ─────────────────────────────
let _tempFotoInsumo = '';

function modalNuevoInsumoGeneral() {
  _tempFotoInsumo = '';
  openModal(
    'Nuevo Insumo General en Inventario',
    `<div class="form-grid form-grid-2" style="gap:12px">
       <div class="form-group">
         <label>Clave / Código *</label>
         <input type="text" id="ni-gen-clave" placeholder="Ej: MAT-101 o CLV-001">
       </div>
       <div class="form-group">
         <label>Tipo / Categoría</label>
         <select id="ni-gen-cat" onchange="_onGenTipoChange()">
           ${CATEGORIAS_INSUMO.map(c => `<option>${c}</option>`).join('')}
         </select>
       </div>
       <div class="form-group" id="ni-gen-otro-wrap" style="display:none;grid-column:1/-1">
         <label>Especifique el tipo *</label>
         <input type="text" id="ni-gen-otro" placeholder="Escriba el tipo de material">
       </div>
       <div class="form-group" style="grid-column:1/-1">
         <label>Descripción / Nombre del Insumo *</label>
         <input type="text" id="ni-gen-nombre" placeholder="Ej: Cemento Portland 50kg, Espejo 60x80cm, etc.">
       </div>
       <div class="form-group">
         <label>Unidad de Medida *</label>
         <input type="text" id="ni-gen-unidad" placeholder="Ej: Bulto, Pieza, m², Tramo, kg">
       </div>
       <div class="form-group">
         <label>Cantidad / Stock Total en Almacén *</label>
         <input type="number" id="ni-gen-cantidad" value="0" min="0" step="any" placeholder="Ej: 20">
       </div>
       <div class="form-group" style="grid-column:1/-1">
         <label>Especificaciones / Estado Físico del Insumo</label>
         <textarea id="ni-gen-especificaciones" rows="2" placeholder="Ej: Espejo con esquina despostillada, Varilla grado 42, Nuevo en caja, etc."></textarea>
       </div>
       <div class="form-group" style="grid-column:1/-1">
         <label>Fotografía del Insumo (Opcional)</label>
         <div style="display:flex;align-items:center;gap:12px;margin-top:6px">
           <label class="btn btn-secondary btn-sm" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px">
             📷 Subir Foto
             <input type="file" accept="image/jpeg, image/png, image/jpg" style="display:none" onchange="_subirFotoInsumoModal(this, 'ni-gen-foto-preview')">
           </label>
           <div id="ni-gen-foto-preview" style="min-width:50px;height:50px;display:flex;align-items:center;justify-content:center;border:1px dashed #cbd5e1;border-radius:6px;padding:2px;background:#f8fafc">
             <span style="font-size:11px;color:#94a3b8">Sin foto</span>
           </div>
         </div>
       </div>
     </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="doNuevoInsumoGeneral()">Guardar Insumo</button>`
  );
}

function _onGenTipoChange() {
  const sel = document.getElementById('ni-gen-cat');
  const otroWrap = document.getElementById('ni-gen-otro-wrap');
  if (sel && otroWrap) {
    otroWrap.style.display = sel.value === 'Otro' ? '' : 'none';
  }
}

async function doNuevoInsumoGeneral() {
  const clave = (document.getElementById('ni-gen-clave')?.value || '').trim().toUpperCase();
  const nombre = (document.getElementById('ni-gen-nombre')?.value || '').trim();
  const unidad = (document.getElementById('ni-gen-unidad')?.value || '').trim();
  const cantidad = parseFloat(document.getElementById('ni-gen-cantidad')?.value) || 0;
  const especificaciones = (document.getElementById('ni-gen-especificaciones')?.value || '').trim();
  let categoria = document.getElementById('ni-gen-cat')?.value || 'Materiales';

  if (categoria === 'Otro') {
    const otro = (document.getElementById('ni-gen-otro')?.value || '').trim();
    if (!otro) return alert('Especifique el tipo de material');
    categoria = otro;
  }

  if (!clave || !nombre || !unidad) {
    return alert('Complete los campos obligatorios (Clave, Nombre y Unidad)');
  }

  const id = 'INS_' + Date.now();
  const nuevoItem = {
    id,
    clave,
    nombre,
    unidad,
    categoria,
    cantidad,
    especificaciones,
    imagen: _tempFotoInsumo || ''
  };

  S.insumos = S.insumos || [];
  S.insumos.unshift(nuevoItem);

  try {
    await saveState('insumos');
    closeModal();
    renderInsumos();
  } catch (err) {
    console.error(err);
    alert('Error al guardar el insumo: ' + err.message);
  }
}

// ── MODAL: Editar Insumo General ─────────────────────────────
function modalEditInsumo(id) {
  const i = S.insumos.find(x => String(x.id).trim() === String(id).trim() || String(x.clave).trim() === String(id).trim());
  if (!i) return;

  _tempFotoInsumo = i.imagen || '';

  openModal(
    `Editar Insumo: ${i.clave || i.id}`,
    `<div class="form-grid form-grid-2" style="gap:12px">
       <div class="form-group">
         <label>Clave / Código</label>
         <input type="text" id="ei-clave" value="${(i.clave || i.id || '').replace(/"/g, '&quot;')}">
       </div>
       <div class="form-group">
         <label>Tipo / Categoría</label>
         <select id="ei-cat">
           ${CATEGORIAS_INSUMO.map(c => `<option ${c === i.categoria ? 'selected' : ''}>${c}</option>`).join('')}
         </select>
       </div>
       <div class="form-group" style="grid-column:1/-1">
         <label>Descripción / Nombre *</label>
         <input type="text" id="ei-nombre" value="${(i.nombre || '').replace(/"/g, '&quot;')}">
       </div>
       <div class="form-group">
         <label>Unidad de Medida *</label>
         <input type="text" id="ei-unidad" value="${(i.unidad || '').replace(/"/g, '&quot;')}">
       </div>
       <div class="form-group">
         <label>Cantidad / Stock Total en Almacén</label>
         <input type="number" id="ei-cantidad" value="${i.cantidad !== undefined && i.cantidad !== null ? i.cantidad : 0}" min="0" step="any">
       </div>
       <div class="form-group" style="grid-column:1/-1">
         <label>Especificaciones / Estado Físico del Insumo</label>
         <textarea id="ei-especificaciones" rows="2" placeholder="Ej: Espejo con esquina despostillada, nuevo en caja...">${i.especificaciones || ''}</textarea>
       </div>
       <div class="form-group" style="grid-column:1/-1">
         <label>Fotografía del Insumo</label>
         <div style="display:flex;align-items:center;gap:12px;margin-top:6px">
           <label class="btn btn-secondary btn-sm" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px">
             📷 Cambiar Foto
             <input type="file" accept="image/jpeg, image/png, image/jpg" style="display:none" onchange="_subirFotoInsumoModal(this, 'ei-foto-preview')">
           </label>
           ${_tempFotoInsumo ? `<button class="btn btn-secondary btn-sm" style="color:#ef4444" onclick="_tempFotoInsumo='';document.getElementById('ei-foto-preview').innerHTML='<span style=\\'font-size:11px;color:#94a3b8\\'>Sin foto</span>'">Quitar Foto</button>` : ''}
           <div id="ei-foto-preview" style="min-width:50px;height:50px;display:flex;align-items:center;justify-content:center;border:1px dashed #cbd5e1;border-radius:6px;padding:2px;background:#f8fafc">
             ${_tempFotoInsumo ? `<img src="${_tempFotoInsumo}" style="height:46px;width:46px;object-fit:cover;border-radius:4px">` : '<span style="font-size:11px;color:#94a3b8">Sin foto</span>'}
           </div>
         </div>
       </div>
     </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="doEditInsumo('${id}')">Guardar Cambios</button>`
  );
}

async function doEditInsumo(id) {
  const i = S.insumos.find(x => String(x.id).trim() === String(id).trim() || String(x.clave).trim() === String(id).trim());
  if (!i) return;

  i.clave = document.getElementById('ei-clave').value.trim().toUpperCase();
  i.nombre = document.getElementById('ei-nombre').value.trim();
  i.unidad = document.getElementById('ei-unidad').value.trim();
  i.categoria = document.getElementById('ei-cat').value;
  i.cantidad = parseFloat(document.getElementById('ei-cantidad').value) || 0;
  i.especificaciones = (document.getElementById('ei-especificaciones').value || '').trim();
  i.imagen = _tempFotoInsumo || '';

  try {
    await saveState('insumos');
    closeModal();
    renderInsumos();
  } catch (err) {
    console.error(err);
    alert('Error al actualizar insumo: ' + err.message);
  }
}

// ── POST-VENTA ─────────────────────────────────────────
function _renderInsumosPostventa() {
  const container = document.getElementById('content');
  if (container) {
    _renderInsumosPostventaInto('content');
  }
}

function _renderInsumosPostventaInto(containerId) {
  const user = getUser();
  const canEdit = user && (user.rol === 'administrador' || user.rol === 'postventa');
  const items = S.insumos_postventa || [];
  const q = _insPvSearchQuery.toLowerCase().trim();
  const filtered = q
    ? items.filter(i =>
        (i.nombre && i.nombre.toLowerCase().includes(q)) ||
        (i.clave && String(i.clave).toLowerCase().includes(q)) ||
        (i.especificaciones && i.especificaciones.toLowerCase().includes(q)) ||
        (i.especialidad && i.especialidad.toLowerCase().includes(q)))
    : items;

  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
  <div class="card">
    <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
      <div>
        <h3 style="margin:0">🔧 Insumos Post-Venta (${filtered.length} de ${items.length})</h3>
        <p style="margin:2px 0 0 0;font-size:12px;color:#64748b">Inventario especializado para garantías y post-venta</p>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <input type="text" id="ins-pv-search-input" placeholder="🔍 Buscar por clave, nombre o estado..." 
               value="${_insPvSearchQuery.replace(/"/g, '&quot;')}"
               oninput="_onInsumosPostventaSearch(this.value)"
               style="padding:6px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;width:260px;font-family:'Montserrat',sans-serif">
        ${canEdit ? `<button class="btn btn-primary btn-sm" onclick="modalNuevoInsumoPostventa()">+ Agregar Insumo</button>` : ''}
      </div>
    </div>
    <div class="table-wrap" id="ins-pv-table-wrap">
      ${_renderInsumosPostventaTable(filtered, canEdit)}
    </div>
  </div>`;
}

function _onInsumosPostventaSearch(val) {
  _insPvSearchQuery = val;
  const user = getUser();
  const canEdit = user && (user.rol === 'administrador' || user.rol === 'postventa');
  const items = S.insumos_postventa || [];
  const q = val.toLowerCase().trim();
  const filtered = q
    ? items.filter(i =>
        (i.nombre && i.nombre.toLowerCase().includes(q)) ||
        (i.clave && String(i.clave).toLowerCase().includes(q)) ||
        (i.especificaciones && i.especificaciones.toLowerCase().includes(q)) ||
        (i.especialidad && i.especialidad.toLowerCase().includes(q)))
    : items;
  const wrap = document.getElementById('ins-pv-table-wrap');
  if (wrap) {
    wrap.innerHTML = _renderInsumosPostventaTable(filtered, canEdit);
  }
}

function _renderInsumosPostventaTable(items, canEdit) {
  if (!items || items.length === 0) {
    return `<div class="empty-state" style="padding:40px 20px;text-align:center">
      <div style="font-size:40px;margin-bottom:12px">📭</div>
      <p style="color:#888">No hay insumos de post-venta registrados aún.</p>
    </div>`;
  }
  return `<table>
    <thead>
      <tr>
        <th style="width:50px;text-align:center">Foto</th>
        <th style="width:90px">ID</th>
        <th>Descripción</th>
        <th>Especificaciones / Estado</th>
        <th style="width:90px">Tipo</th>
        <th style="width:70px">Unidad</th>
        <th style="width:100px;text-align:center">Cantidad</th>
        <th>Especialidad</th>
        ${canEdit ? '<th style="text-align:center;width:240px">Acciones</th>' : ''}
      </tr>
    </thead>
    <tbody>
      ${items.map(i => {
        const thumb = i.imagen 
          ? `<img src="${i.imagen}" style="width:36px;height:36px;object-fit:cover;border-radius:6px;cursor:pointer;border:1px solid #cbd5e1" onclick="verFotoInsumo('${i.imagen}', '${(i.nombre || '').replace(/'/g, "\\'")}')" title="Ver foto en grande">` 
          : `<div style="width:36px;height:36px;background:#f1f5f9;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:16px" title="Sin foto">🔧</div>`;

        return `<tr>
          <td style="text-align:center;padding:6px 8px">${thumb}</td>
          <td class="text-sm" style="font-family:monospace;font-weight:700;color:#1e40af">${i.clave || i.id}</td>
          <td><div style="font-weight:600">${i.nombre}</div></td>
          <td>${i.especificaciones ? `<div style="font-size:12px;color:#475569;background:#f8fafc;padding:3px 8px;border-radius:4px;border-left:3px solid #3b82f6">${i.especificaciones}</div>` : '<span style="color:#cbd5e1;font-size:11px">Sin detalles</span>'}</td>
          <td class="text-sm">${i.categoria || '—'}</td>
          <td class="text-sm">${i.unidad || '—'}</td>
          <td class="text-sm" style="font-weight:700;color:var(--green);text-align:center">${i.cantidad !== undefined ? i.cantidad : 0}</td>
          <td class="text-sm">${i.especialidad || '—'}</td>
          ${canEdit ? `<td style="text-align:center">
            <div style="display:flex;gap:4px;align-items:center;justify-content:center;flex-wrap:wrap">
              <button class="btn btn-secondary btn-sm" style="padding:3px 7px;font-size:11px" onclick="modalEditInsumoPostventa('${i.id}')">✏️</button>
              <button class="btn btn-secondary btn-sm" style="padding:3px 7px;font-size:11px" onclick="modalAddStockPostventa('${i.id}')">➕ Stock</button>
              <button class="btn btn-secondary btn-sm" style="padding:3px 7px;font-size:11px;color:var(--red,#e74c3c);border-color:#fca5a5" onclick="modalRemoveStockPostventa('${i.id}')">➖ Salida</button>
            </div>
          </td>` : ''}
        </tr>`;
      }).join('')}
    </tbody>
  </table>`;
}

// ── MODAL: Nuevo Insumo Post-Venta ─────────────────────
function modalNuevoInsumoPostventa() {
  _tempFotoInsumo = '';
  openModal(
    'Nuevo Insumo Post-Venta',
    `<div class="form-grid form-grid-2" style="gap:12px">
       <div class="form-group" style="grid-column:1/-1">
         <label>Descripción *</label>
         <input type="text" id="ni-pv-nombre" placeholder="Nombre completo del insumo">
       </div>
       <div class="form-group">
         <label>Tipo de Material</label>
         <select id="ni-pv-cat" onchange="_onPvTipoChange()">
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
         <input type="text" id="ni-pv-especialidad" placeholder="Ej: Plomería, Eléctrica, Carpintería">
       </div>
       <div class="form-group" style="grid-column:1/-1">
         <label>Especificaciones / Estado Físico del Insumo</label>
         <textarea id="ni-pv-especificaciones" rows="2" placeholder="Ej: Espejo con esquina despostillada, tono específico de loseta..."></textarea>
       </div>
       <div class="form-group" style="grid-column:1/-1">
         <label>Fotografía del Insumo (Opcional)</label>
         <div style="display:flex;align-items:center;gap:12px;margin-top:6px">
           <label class="btn btn-secondary btn-sm" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px">
             📷 Subir Foto
             <input type="file" accept="image/jpeg, image/png, image/jpg" style="display:none" onchange="_subirFotoInsumoModal(this, 'ni-pv-foto-preview')">
           </label>
           <div id="ni-pv-foto-preview" style="min-width:50px;height:50px;display:flex;align-items:center;justify-content:center;border:1px dashed #cbd5e1;border-radius:6px;padding:2px;background:#f8fafc">
             <span style="font-size:11px;color:#94a3b8">Sin foto</span>
           </div>
         </div>
       </div>
     </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="doNuevoInsumoPostventa()">Guardar</button>`
  );
}

function _onPvTipoChange() {
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
  const especialidad = document.getElementById('ni-pv-especialidad').value.trim();
  const especificaciones = (document.getElementById('ni-pv-especificaciones').value || '').trim();
  let categoria = document.getElementById('ni-pv-cat').value;

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
      body: JSON.stringify({ nombre, unidad, categoria, especialidad, cantidad, especificaciones, imagen: _tempFotoInsumo || '' })
    });
    const data = await res.json();
    if (data.status === 'success') {
      S.insumos_postventa = S.insumos_postventa || [];
      const user = getUser();
      S.insumos_postventa.push({
        id: data.id,
        clave: data.clave,
        nombre, unidad, categoria, especialidad, cantidad, especificaciones,
        imagen: _tempFotoInsumo || '',
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

// ── MODAL: Editar Insumo Post-Venta ─────────────────────
function modalEditInsumoPostventa(id) {
  const i = (S.insumos_postventa || []).find(x => x.id === id || x.clave === id);
  if (!i) return;

  _tempFotoInsumo = i.imagen || '';

  openModal(
    `Editar Insumo Post-Venta: ${i.clave || i.id}`,
    `<div class="form-grid form-grid-2" style="gap:12px">
       <div class="form-group" style="grid-column:1/-1">
         <label>Descripción *</label>
         <input type="text" id="ei-pv-nombre" value="${(i.nombre || '').replace(/"/g, '&quot;')}">
       </div>
       <div class="form-group">
         <label>Tipo de Material</label>
         <select id="ei-pv-cat">
           ${CATEGORIAS_INSUMO.map(c => `<option ${c === i.categoria ? 'selected' : ''}>${c}</option>`).join('')}
         </select>
       </div>
       <div class="form-group">
         <label>Unidad de Medida *</label>
         <input type="text" id="ei-pv-unidad" value="${(i.unidad || '').replace(/"/g, '&quot;')}">
       </div>
       <div class="form-group" style="grid-column:1/-1">
         <label>Especialidad</label>
         <input type="text" id="ei-pv-especialidad" value="${(i.especialidad || '').replace(/"/g, '&quot;')}">
       </div>
       <div class="form-group" style="grid-column:1/-1">
         <label>Especificaciones / Estado Físico</label>
         <textarea id="ei-pv-especificaciones" rows="2">${i.especificaciones || ''}</textarea>
       </div>
       <div class="form-group" style="grid-column:1/-1">
         <label>Fotografía del Insumo</label>
         <div style="display:flex;align-items:center;gap:12px;margin-top:6px">
           <label class="btn btn-secondary btn-sm" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px">
             📷 Cambiar Foto
             <input type="file" accept="image/jpeg, image/png, image/jpg" style="display:none" onchange="_subirFotoInsumoModal(this, 'ei-pv-foto-preview')">
           </label>
           ${_tempFotoInsumo ? `<button class="btn btn-secondary btn-sm" style="color:#ef4444" onclick="_tempFotoInsumo='';document.getElementById('ei-pv-foto-preview').innerHTML='<span style=\\'font-size:11px;color:#94a3b8\\'>Sin foto</span>'">Quitar Foto</button>` : ''}
           <div id="ei-pv-foto-preview" style="min-width:50px;height:50px;display:flex;align-items:center;justify-content:center;border:1px dashed #cbd5e1;border-radius:6px;padding:2px;background:#f8fafc">
             ${_tempFotoInsumo ? `<img src="${_tempFotoInsumo}" style="height:46px;width:46px;object-fit:cover;border-radius:4px">` : '<span style="font-size:11px;color:#94a3b8">Sin foto</span>'}
           </div>
         </div>
       </div>
     </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="doEditInsumoPostventa('${id}')">Guardar Cambios</button>`
  );
}

async function doEditInsumoPostventa(id) {
  const i = (S.insumos_postventa || []).find(x => x.id === id || x.clave === id);
  if (!i) return;

  const nombre = document.getElementById('ei-pv-nombre').value.trim();
  const unidad = document.getElementById('ei-pv-unidad').value.trim();
  const categoria = document.getElementById('ei-pv-cat').value;
  const especialidad = document.getElementById('ei-pv-especialidad').value.trim();
  const especificaciones = (document.getElementById('ei-pv-especificaciones').value || '').trim();

  if (!nombre || !unidad) return alert('Complete los campos obligatorios');

  const token = sessionStorage.getItem('gu_token');
  try {
    const res = await fetch(API_BASE + '/api/insumos_postventa/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ nombre, unidad, categoria, especialidad, especificaciones, imagen: _tempFotoInsumo || '' })
    });
    const data = await res.json();
    if (data.status === 'success') {
      i.nombre = nombre;
      i.unidad = unidad;
      i.categoria = categoria;
      i.especialidad = especialidad;
      i.especificaciones = especificaciones;
      i.imagen = _tempFotoInsumo || '';
      closeModal();
      renderInsumos();
    } else {
      alert('Error al actualizar: ' + (data.message || 'Intente nuevamente'));
    }
  } catch (err) {
    console.error(err);
    alert('Error de conexión al actualizar insumo post-venta');
  }
}

// ── ADD STOCK (Post-Venta) ──────────────────────────────
function modalAddStockPostventa(id) {
  const i = S.insumos_postventa.find(x => x.id === id);
  if (!i) return;
  openModal(
    `Agregar Stock: ${i.nombre}`,
    `<div class="form-group" style="margin-bottom:15px">
       <p style="font-size: 14px; color: #555;">Cantidad actual: <strong>${i.cantidad !== undefined ? i.cantidad : 0}</strong> ${i.unidad || ''}</p>
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

// ── PHOTO UPLOAD HELPER ─────────────────────────────────
async function _subirFotoInsumoModal(input, previewId) {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
    alert('Solo se permiten imágenes en formato JPG o PNG');
    input.value = '';
    return;
  }
  const previewDiv = document.getElementById(previewId);
  if (previewDiv) previewDiv.innerHTML = '<span style="font-size:11px">⏳ Subiendo...</span>';

  try {
    const b64 = await resizeAndCompressImage(file, 800);
    const token = sessionStorage.getItem('gu_token') || '';

    const res = await fetch(API_BASE + '/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ image: b64 })
    });

    if (!res.ok) throw new Error('Error al subir');
    const data = await res.json();

    _tempFotoInsumo = data.url;
    if (previewDiv) {
      previewDiv.innerHTML = `<img src="${data.url}" style="height:46px;width:46px;object-fit:cover;border-radius:4px;border:1px solid #3b82f6">`;
    }
  } catch (err) {
    console.error(err);
    alert('Error al subir la imagen del insumo');
    if (previewDiv) previewDiv.innerHTML = '<span style="font-size:11px;color:red">❌ Error</span>';
  }
}

function verFotoInsumo(url, titulo) {
  openModal(
    titulo || 'Foto del Insumo',
    `<div style="text-align:center;padding:10px">
       <img src="${url}" style="max-width:100%;max-height:70vh;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15)">
     </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>
     <button class="btn btn-primary" onclick="window.open('${url}', '_blank')">Abrir en pestaña nueva</button>`
  );
}
