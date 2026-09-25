// =====================================================
// VIEW – Nueva Solicitud
// =====================================================

let solicitudItems = [];
let solicitudTipo  = 'PRS';

function renderNuevaSolicitud() {
  solicitudItems = [];
  solicitudTipo  = 'PRS';

  document.getElementById('content').innerHTML = `
  <div class="steps">
    <div class="step"><div class="step-circle active">1</div><div class="step-label active">Datos Generales</div></div>
    <div class="step-line"></div>
    <div class="step"><div class="step-circle">2</div><div class="step-label">Insumos</div></div>
    <div class="step-line"></div>
    <div class="step"><div class="step-circle">3</div><div class="step-label">Confirmación</div></div>
  </div>

  <div class="card">
    <div class="card-header"><h3>Nueva Solicitud de Traspaso</h3></div>
    <div class="card-body">

      <div class="form-grid form-grid-2" style="margin-bottom:20px">
        <div class="form-group">
          <label>Tipo de Traspaso *</label>
          <select id="sol-tipo" onchange="solicitudTipo=this.value">
            <option value="PRS">POR PRÉSTAMO</option>
            <option value="TOB">POR TÉRMINO DE OBRA</option>
            <option value="GAR">POR GARANTÍA</option>
          </select>
        </div>
        <div class="form-group">
          <label>Solicitante *</label>
          <select id="sol-solicitante">
            <option value="">Cargando monitores de control...</option>
          </select>
        </div>
      </div>

      <hr class="divider">

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
        <div>
          <div style="font-size:12px;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px">📤 Origen (Salida)</div>
          <div class="form-grid" style="gap:12px">
            <div class="form-group">
              <label>Centro de Costo Origen *</label>
              <select id="sol-cc-ori" onchange="updateInfoOri()">
                <option value="">-- Seleccionar centro de costo --</option>
                ${buildCCOptions()}
              </select>
              <div id="info-ori" style="margin-top:6px;min-height:22px"></div>
            </div>
          </div>
        </div>
        <div>
          <div style="font-size:12px;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px">📥 Destino (Entrada)</div>
          <div class="form-grid" style="gap:12px">
            <div class="form-group">
              <label>Centro de Costo Destino *</label>
              <select id="sol-cc-des" onchange="updateInfoDes()">
                <option value="">-- Seleccionar centro de costo --</option>
                ${buildCCOptionsAll()}
              </select>
              <div id="info-des" style="margin-top:6px;min-height:22px"></div>
            </div>
          </div>
        </div>
      </div>

      <hr class="divider">
      <div class="form-group" style="margin-bottom:12px">
        <label>Observaciones</label>
        <textarea id="sol-obs" placeholder="Notas o comentarios sobre el traspaso..."></textarea>
      </div>

      <hr class="divider">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
        <div>
          <div style="font-size:14px;font-weight:700;color:#1e293b">Insumos a Traspasar</div>
          <div style="font-size:12px;color:#64748b">Selecciona insumos por nombre/clave o visualmente con fotos y especificaciones de estado</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <button class="btn btn-secondary btn-sm" style="display:inline-flex;align-items:center;gap:6px;background:#f8fafc" onclick="abrirSelectorVisual()">
            <span style="font-size:14px">🖼️</span> Catálogo con Fotos
          </button>
          <button class="btn btn-primary btn-sm" onclick="agregarItem()">+ Agregar Insumo</button>
        </div>
      </div>

      <div class="items-table-wrap" style="overflow:visible">
        <table>
          <thead>
            <tr>
              <th>Insumo</th>
              <th style="width:130px">Cantidad</th>
              <th style="width:90px">Unidad</th>
              <th style="width:80px;text-align:center">Foto</th>
              <th>Comentario / Especificaciones</th>
              <th style="width:40px"></th>
            </tr>
          </thead>
          <tbody id="items-tbody">
            <tr><td colspan="6" class="text-center" style="color:#aaa;padding:20px">No hay insumos. Presione "+ Agregar Insumo" o "🖼️ Catálogo con Fotos"</td></tr>
          </tbody>
        </table>
      </div>

      <hr class="divider">
      <div style="display:flex;justify-content:flex-end;gap:10px">
        <button class="btn btn-secondary" onclick="navigate('dashboard')">Cancelar</button>
        <button class="btn btn-primary" onclick="guardarSolicitud()">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Generar Solicitud
        </button>
      </div>

    </div>
  </div>`;

  // Populate solicitante dropdown with users that have the 'almacenista' or 'postventa' role
  const currentUser = getUser();
  fetch(API_BASE + '/api/users')
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById('sol-solicitante');
      if (!select) return;
      if (data.users) {
        const solicitantes = data.users.filter(u => (u.rol === 'almacenista' || u.rol === 'postventa' || u.rol === 'residente') && u.activo);
        if (solicitantes.length > 0) {
          select.innerHTML = '<option value="">-- Seleccionar solicitante --</option>' + 
            solicitantes.map(u => `<option value="${u.nombre}">${u.nombre}</option>`).join('');
          // Auto-seleccionar al usuario de la sesión actual
          if (currentUser && currentUser.nombre) {
            const match = Array.from(select.options).find(o => o.value === currentUser.nombre);
            if (match) select.value = currentUser.nombre;
          }
        } else {
          select.innerHTML = '<option value="">No hay solicitantes activos</option>';
        }
      }
    })
    .catch(err => {
      const select = document.getElementById('sol-solicitante');
      if (select) select.innerHTML = '<option value="">Error al cargar solicitantes</option>';
    });

  // Para usuarios con rol postventa, auto-seleccionar CC 998 en Origen y Destino
  if (currentUser && currentUser.rol === 'postventa') {
    const oriSel = document.getElementById('sol-cc-ori');
    const desSel = document.getElementById('sol-cc-des');
    if (oriSel) { oriSel.value = '998'; updateInfoOri(); }
    if (desSel) { desSel.value = '998'; updateInfoDes(); }
  }
}

// Builds option list for CC dropdowns grouped by Desarrollo
function buildCCOptions() {
  const lista = ccsPorEmpresa();
  const groups = {};
  lista.forEach(cc => {
    const dev = S.desarrollos ? S.desarrollos.find(d => d.id === cc.empresaId) : null;
    const devNombre = dev ? dev.nombre : cc.empresaId;
    if (!groups[cc.empresaId]) groups[cc.empresaId] = { label: devNombre, items: [] };
    groups[cc.empresaId].items.push(cc);
  });
  return Object.values(groups).map(g =>
    `<optgroup label="${g.label}">${g.items.map(c => {
      const num = String(c.id).substring(0, 3);
      return `<option value="${c.id}">${num} - ${c.nombre}</option>`;
    }).join('')}</optgroup>`
  ).join('');
}

// Builds option list for ALL CCs (used for Destino dropdown)
function buildCCOptionsAll() {
  const lista = ccsDestinoAll();
  const groups = {};
  lista.forEach(cc => {
    const dev = S.desarrollos ? S.desarrollos.find(d => d.id === cc.empresaId) : null;
    const devNombre = dev ? dev.nombre : cc.empresaId;
    if (!groups[cc.empresaId]) groups[cc.empresaId] = { label: devNombre, items: [] };
    groups[cc.empresaId].items.push(cc);
  });
  return Object.values(groups).map(g =>
    `<optgroup label="${g.label}">${g.items.map(c => {
      const num = String(c.id).substring(0, 3);
      return `<option value="${c.id}">${num} - ${c.nombre}</option>`;
    }).join('')}</optgroup>`
  ).join('');
}

function updateInfoOri() {
  const ccId = document.getElementById('sol-cc-ori').value;
  const info = document.getElementById('info-ori');
  if (!ccId) { info.innerHTML = ''; return; }
  const cc  = S.centrosCosto.find(c => c.id === ccId);
  const dev = cc && S.desarrollos ? S.desarrollos.find(d => d.id === cc.empresaId) : null;
  const devNombre = dev ? dev.nombre : (cc ? cc.empresaId : '');
  info.innerHTML = cc
    ? `<span style="display:inline-flex;align-items:center;gap:6px;background:rgba(22,163,74,.12);border:1px solid rgba(22,163,74,.3);border-radius:20px;padding:3px 10px;font-size:11px;font-weight:600;color:#16a34a">
        🏢 ${devNombre}
       </span>`
    : '';
  renderItems();
}

function updateInfoDes() {
  const ccId = document.getElementById('sol-cc-des').value;
  const info = document.getElementById('info-des');
  if (!ccId) { info.innerHTML = ''; return; }
  const cc  = S.centrosCosto.find(c => c.id === ccId);
  const dev = cc && S.desarrollos ? S.desarrollos.find(d => d.id === cc.empresaId) : null;
  const devNombre = dev ? dev.nombre : (cc ? cc.empresaId : '');
  info.innerHTML = cc
    ? `<span style="display:inline-flex;align-items:center;gap:6px;background:rgba(37,99,235,.12);border:1px solid rgba(37,99,235,.3);border-radius:20px;padding:3px 10px;font-size:11px;font-weight:600;color:#2563eb">
        🏢 ${devNombre}
       </span>`
    : '';
  renderItems();
}

function agregarItem() {
  solicitudItems.push({ insumoId: '', cantidad: 1, comentario: '', imagen: '' });
  renderItems();
}

// ── Insumo Search Autocomplete ─────────────────────────────────────────────
let _insSearchActive = null;

function _getInsumosFiltered() {
  const user = getUser();
  if (user && user.rol === 'postventa') {
    return S.insumos_postventa || [];
  }
  return S.insumos || [];
}

function _openInsDropdown(i) {
  document.querySelectorAll('.ins-dropdown').forEach(d => d.style.display = 'none');
  const dd = document.getElementById('ins-dd-' + i);
  if (dd) dd.style.display = 'block';
  _insSearchActive = i;
}

function _closeInsDropdown(i) {
  const dd = document.getElementById('ins-dd-' + i);
  if (dd) dd.style.display = 'none';
  if (_insSearchActive === i) _insSearchActive = null;
}

function _filterInsDropdown(i) {
  const query  = (document.getElementById('ins-search-' + i)?.value || '').toLowerCase();
  const dd     = document.getElementById('ins-dd-' + i);
  if (!dd) return;
  dd.style.display = 'block';
  _insSearchActive = i;
  const todos = _getInsumosFiltered();
  const matches = query
    ? todos.filter(ins =>
        (ins.nombre && ins.nombre.toLowerCase().includes(query)) ||
        (ins.clave && String(ins.clave).toLowerCase().includes(query)) ||
        (ins.especificaciones && ins.especificaciones.toLowerCase().includes(query)))
    : todos;

  dd.innerHTML = matches.length
    ? matches.slice(0, 150).map(ins => {
        const thumb = ins.imagen 
          ? `<img src="${ins.imagen}" style="width:32px;height:32px;object-fit:cover;border-radius:4px;flex-shrink:0" alt="">`
          : `<div style="width:32px;height:32px;background:#f1f5f9;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:14px;color:#94a3b8;flex-shrink:0">📦</div>`;
        
        const stockVal = (ins.cantidad !== undefined && ins.cantidad !== null && ins.cantidad !== '') ? parseFloat(ins.cantidad) : null;
        const stockBadge = stockVal !== null
          ? `<span style="font-size:11px;font-weight:700;padding:2px 6px;border-radius:4px;background:${stockVal > 0 ? '#dcfce7' : '#fee2e2'};color:${stockVal > 0 ? '#166534' : '#991b1b'}">Stock: ${stockVal}</span>`
          : '';

        return `<div class="ins-dd-item" onmousedown="_selectInsumo(${i},'${ins.id || ins.clave}')" style="padding:8px 12px;font-size:13px;display:flex;align-items:center;gap:10px;cursor:pointer;border-bottom:1px solid #f1f5f9">
          ${thumb}
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-weight:700;color:#1e40af;font-size:12px;font-family:monospace">${ins.clave || ins.id}</span>
              <span style="color:#1e293b;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${ins.nombre}</span>
            </div>
            ${ins.especificaciones ? `<div style="font-size:11px;color:#64748b;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">🔍 <em>${ins.especificaciones}</em></div>` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
            ${stockBadge}
            <span style="color:#64748b;font-size:11px;background:#f1f5f9;padding:2px 6px;border-radius:4px;font-weight:600">${ins.unidad || 'Pza'}</span>
          </div>
        </div>`;
      }).join('')
    : '<div style="padding:12px;color:#aaa;font-size:12px;text-align:center">Sin resultados coincidentes</div>';
}

function _selectInsumo(i, insumoId) {
  solicitudItems[i].insumoId = insumoId;
  const ins = getInsumo(insumoId);
  if (ins) {
    // Si el insumo del catálogo tiene foto y la fila no tiene foto personalizada, pre-cargarla
    if (ins.imagen && !solicitudItems[i].imagen) {
      solicitudItems[i].imagen = ins.imagen;
    }
    // Si el insumo del catálogo tiene especificaciones y el comentario está vacío, sugerirlo
    if (ins.especificaciones && !solicitudItems[i].comentario) {
      solicitudItems[i].comentario = ins.especificaciones;
    }
  }
  _closeInsDropdown(i);
  renderItems();
}

// Cierra dropdowns al hacer click fuera
document.addEventListener('click', function(e) {
  if (!e.target.closest('.ins-search-wrap')) {
    document.querySelectorAll('.ins-dropdown').forEach(d => d.style.display = 'none');
    _insSearchActive = null;
  }
});

function onCantidadItemChange(i, val) {
  let num = parseFloat(val) || 0;
  
  const ins = solicitudItems[i].insumoId ? getInsumo(solicitudItems[i].insumoId) : null;
  const warnDiv = document.getElementById(`qty-warn-${i}`);
  const inputEl = document.getElementById(`qty-input-${i}`);
  
  if (ins && ins.cantidad !== undefined && ins.cantidad !== null && ins.cantidad !== '') {
    const maxStock = parseFloat(ins.cantidad);
    if (num > maxStock) {
      // Auto-corregir al tope máximo de stock
      num = maxStock;
      if (inputEl) {
        inputEl.value = maxStock;
        inputEl.style.borderColor = '#f59e0b';
      }
      if (warnDiv) {
        warnDiv.style.display = 'block';
        warnDiv.innerHTML = `⚠️ Tope máximo: ${maxStock} ${ins.unidad || ''}. No se puede exceder el stock disponible.`;
      }
      // Notificar al usuario que se ajustó
      setTimeout(() => {
        if (warnDiv) warnDiv.style.display = 'block';
        if (inputEl) inputEl.style.borderColor = '#ddd';
      }, 2500);
    } else {
      if (warnDiv) warnDiv.style.display = 'none';
      if (inputEl) inputEl.style.borderColor = '#ddd';
    }
  }
  
  solicitudItems[i].cantidad = num;
}

function renderItems() {
  const tbody = document.getElementById('items-tbody');
  if (!tbody) return;

  if (solicitudItems.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="color:#aaa;padding:20px">No hay insumos. Presione "+ Agregar Insumo" o "🖼️ Catálogo con Fotos"</td></tr>';
    return;
  }

  tbody.innerHTML = solicitudItems.map((item, i) => {
    const ins = item.insumoId ? getInsumo(item.insumoId) : null;
    const displayVal = ins ? (ins.clave || ins.id) + ' · ' + ins.nombre : '';
    
    // Foto
    const fotoSrc = item.imagen || (ins ? ins.imagen : '');
    const thumb = fotoSrc 
      ? `<img src="${fotoSrc}" style="width:32px;height:32px;object-fit:cover;border-radius:6px;cursor:pointer;border:1px solid #cbd5e1" onclick="verFotoInsumo('${fotoSrc}', '${(ins ? ins.nombre : 'Foto').replace(/'/g, "\\'")}')" title="Ver foto">` 
      : '';

    // Stock
    const hasStock = ins && ins.cantidad !== undefined && ins.cantidad !== null && ins.cantidad !== '';
    const stockVal = hasStock ? parseFloat(ins.cantidad) : null;
    const isOverStock = hasStock && (parseFloat(item.cantidad) > stockVal);

    return `<tr>
      <td style="vertical-align:top">
        <div class="ins-search-wrap" style="position:relative">
          <div style="display:flex;align-items:center;gap:6px;border:1px solid #ddd;border-radius:6px;padding:6px 10px;background:#fff;cursor:text"
               onclick="document.getElementById('ins-search-${i}').focus();_openInsDropdown(${i})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              id="ins-search-${i}"
              type="text"
              placeholder="Buscar insumo por nombre, clave o estado..."
              value="${displayVal.replace(/"/g, '&quot;')}"
              autocomplete="off"
              style="border:none;outline:none;font-family:Montserrat,sans-serif;font-size:12px;width:100%;background:transparent"
              oninput="_filterInsDropdown(${i})"
              onfocus="_filterInsDropdown(${i})"
            >
            <button type="button" title="Seleccionar con fotos" style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:4px;padding:2px 6px;font-size:12px;cursor:pointer;margin-right:4px" onclick="event.stopPropagation();abrirSelectorVisual(${i})">🖼️</button>
            ${ins ? `<span style="cursor:pointer;color:#ccc;font-size:16px;line-height:1" onmousedown="solicitudItems[${i}].insumoId='';solicitudItems[${i}].imagen='';renderItems()">×</span>` : ''}
          </div>
          <div id="ins-dd-${i}" class="ins-dropdown"
               style="display:none;position:absolute;top:calc(100% + 3px);left:0;width:620px;max-width:92vw;background:#fff;border:1px solid #e2e8f0;border-radius:8px;box-shadow:0 10px 25px rgba(0,0,0,.15);max-height:420px;overflow-y:auto;z-index:9999">
          </div>
        </div>
        ${ins && ins.especificaciones ? `<div style="font-size:11px;color:#475569;margin-top:4px;background:#f8fafc;padding:3px 8px;border-radius:4px;border-left:3px solid #3b82f6">🔍 <strong>Detalles de estado:</strong> ${ins.especificaciones}</div>` : ''}
        ${hasStock ? `<div style="font-size:11px;font-weight:700;margin-top:3px;color:${stockVal > 0 ? '#16a34a' : '#ef4444'}">📦 Stock disponible en almacén: ${stockVal} ${ins.unidad || ''}</div>` : ''}
      </td>
      <td style="vertical-align:top">
        <input type="number" id="qty-input-${i}" min="0.01" ${hasStock ? `max="${stockVal}"` : ''} step="any" value="${hasStock && parseFloat(item.cantidad) > stockVal ? stockVal : item.cantidad}"
               oninput="onCantidadItemChange(${i}, this.value)"
               style="border:1px solid ${isOverStock ? '#ef4444' : '#ddd'};border-radius:4px;padding:6px 8px;font-family:Montserrat,sans-serif;font-size:13px;width:100%;font-weight:600">
        <div id="qty-warn-${i}" style="display:${isOverStock ? 'block' : 'none'};color:#ef4444;font-size:10px;font-weight:700;margin-top:2px">
          ⚠️ Tope máximo: ${stockVal} ${ins ? (ins.unidad || '') : ''}. No se puede exceder el stock disponible.
        </div>
        ${hasStock ? `<div style="font-size:10px;color:#64748b;margin-top:1px">Máx: ${stockVal} ${ins ? (ins.unidad || '') : ''}</div>` : ''}
      </td>
      <td id="ins-unit-${i}" style="color:#64748b;font-size:12px;font-weight:600;vertical-align:middle">${ins ? ins.unidad : '—'}</td>
      <td style="text-align:center;vertical-align:middle">
        <div style="display:flex;align-items:center;justify-content:center;gap:6px">
          <label style="cursor:pointer;display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:6px;color:#475569;font-size:14px" title="Subir / Cambiar Foto">
            📸
            <input type="file" accept="image/jpeg, image/png, image/jpg" style="display:none" onchange="subirFotoItem(${i}, this)">
          </label>
          <div id="thumb-${i}" style="min-width:32px;height:32px;display:flex;align-items:center;justify-content:center">${thumb}</div>
        </div>
      </td>
      <td style="vertical-align:top">
        <input type="text" placeholder="Comentario, observaciones o especificaciones del insumo..." 
               value="${(item.comentario || '').replace(/"/g, '&quot;')}" 
               onchange="solicitudItems[${i}].comentario = this.value"
               style="border:1px solid #ddd;border-radius:4px;padding:6px 8px;font-family:Montserrat,sans-serif;font-size:12px;width:100%">
      </td>
      <td style="text-align:center;vertical-align:middle">
        <button onclick="solicitudItems.splice(${i},1);renderItems()"
                style="background:none;border:none;color:var(--red);cursor:pointer;font-size:20px;font-weight:700" title="Eliminar fila">×</button>
      </td>
    </tr>`;
  }).join('');
}

// ── MODAL: Selector Visual de Insumos con Fotos ─────────────────────────────
let _visualPickerQuery = '';
let _visualPickerCategory = 'TODOS';
let _visualPickerTargetRow = null;

function abrirSelectorVisual(targetRowIndex = null) {
  _visualPickerTargetRow = targetRowIndex;
  _visualPickerQuery = '';
  _visualPickerCategory = 'TODOS';

  const todos = _getInsumosFiltered();
  const categories = ['TODOS', ...Array.from(new Set(todos.map(i => i.categoria || 'Materiales')))];

  openModal(
    'Catálogo Visual · Seleccionar Insumo por Foto y Especificaciones',
    `<div style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <input type="text" id="vp-search-input" placeholder="🔍 Buscar insumo por clave, nombre o especificaciones (ej: espejo, esquina despostillada)..." 
               oninput="_onVisualPickerSearch(this.value)"
               style="flex:1;min-width:260px;padding:8px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px;font-family:'Montserrat',sans-serif">
      </div>
      <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px">
        ${categories.map(cat => `
          <button class="btn btn-sm ${cat === 'TODOS' ? 'btn-primary' : 'btn-secondary'}" 
                  id="vp-cat-${cat.replace(/\s+/g, '')}"
                  onclick="_onVisualPickerCategory('${cat}')"
                  style="padding:4px 10px;font-size:11px;white-space:nowrap">${cat}</button>
        `).join('')}
      </div>
      <div id="vp-grid-container" style="max-height:60vh;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill, minmax(220px, 1fr));gap:12px;padding:4px">
        ${_renderVisualPickerCards(todos)}
      </div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>`
  );
}

function _onVisualPickerSearch(val) {
  _visualPickerQuery = val;
  _updateVisualPickerCards();
}

function _onVisualPickerCategory(cat) {
  _visualPickerCategory = cat;
  document.querySelectorAll('[id^="vp-cat-"]').forEach(b => b.className = 'btn btn-sm btn-secondary');
  const activeBtn = document.getElementById('vp-cat-' + cat.replace(/\s+/g, ''));
  if (activeBtn) activeBtn.className = 'btn btn-sm btn-primary';
  _updateVisualPickerCards();
}

function _updateVisualPickerCards() {
  const todos = _getInsumosFiltered();
  const q = _visualPickerQuery.toLowerCase().trim();
  const filtered = todos.filter(ins => {
    const matchCat = (_visualPickerCategory === 'TODOS') || ((ins.categoria || 'Materiales') === _visualPickerCategory);
    if (!matchCat) return false;
    if (!q) return true;
    return (ins.nombre && ins.nombre.toLowerCase().includes(q)) ||
           (ins.clave && String(ins.clave).toLowerCase().includes(q)) ||
           (ins.especificaciones && ins.especificaciones.toLowerCase().includes(q));
  });

  const container = document.getElementById('vp-grid-container');
  if (container) {
    container.innerHTML = _renderVisualPickerCards(filtered);
  }
}

function _renderVisualPickerCards(items) {
  if (!items || items.length === 0) {
    return `<div style="grid-column:1/-1;text-align:center;padding:40px;color:#888">
      <div style="font-size:36px;margin-bottom:8px">🔍</div>
      <p>No se encontraron insumos que coincidan con la búsqueda.</p>
    </div>`;
  }

  return items.map(ins => {
    const imgHtml = ins.imagen
      ? `<img src="${ins.imagen}" style="width:100%;height:130px;object-fit:cover;border-radius:6px;cursor:pointer" onclick="verFotoInsumo('${ins.imagen}', '${(ins.nombre || '').replace(/'/g, "\\'")}')" title="Clic para ampliar foto">`
      : `<div style="width:100%;height:130px;background:#f8fafc;border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#94a3b8;border:1px dashed #cbd5e1">
          <span style="font-size:32px">📦</span>
          <span style="font-size:11px;margin-top:4px">Sin foto</span>
        </div>`;

    const stockVal = (ins.cantidad !== undefined && ins.cantidad !== null && ins.cantidad !== '') ? parseFloat(ins.cantidad) : null;
    const stockBadge = stockVal !== null
      ? `<span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:12px;background:${stockVal > 0 ? '#dcfce7' : '#fee2e2'};color:${stockVal > 0 ? '#166534' : '#991b1b'}">Stock: ${stockVal} ${ins.unidad || ''}</span>`
      : '';

    return `
      <div class="card" style="margin:0;padding:10px;display:flex;flex-direction:column;border:1px solid #e2e8f0;border-radius:8px;transition:transform .15s, box-shadow .15s;background:#fff" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'" onmouseout="this.style.boxShadow='none'">
        <div style="position:relative;margin-bottom:8px">
          ${imgHtml}
          ${ins.imagen ? `<span style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,0.6);color:#fff;font-size:10px;padding:2px 6px;border-radius:4px">📷 Ver</span>` : ''}
        </div>
        <div style="font-family:monospace;font-size:11px;font-weight:700;color:#1e40af;margin-bottom:2px">${ins.clave || ins.id}</div>
        <div style="font-weight:700;font-size:13px;color:#1e293b;line-height:1.3;margin-bottom:4px;min-height:34px">${ins.nombre}</div>
        
        ${ins.especificaciones ? `
          <div style="font-size:11px;color:#475569;background:#f1f5f9;padding:4px 8px;border-radius:4px;border-left:3px solid #3b82f6;margin-bottom:8px;min-height:28px">
            🔍 <em>${ins.especificaciones}</em>
          </div>
        ` : '<div style="min-height:8px"></div>'}
        
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:6px;border-top:1px solid #f1f5f9">
          <div>${stockBadge}</div>
          <button class="btn btn-primary btn-sm" style="padding:4px 10px;font-size:11px" onclick="_seleccionarInsumoVisual('${ins.id || ins.clave}')">
            ✓ Seleccionar
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function _seleccionarInsumoVisual(insumoId) {
  if (_visualPickerTargetRow !== null && _visualPickerTargetRow < solicitudItems.length) {
    _selectInsumo(_visualPickerTargetRow, insumoId);
  } else {
    // Si la última fila está vacía, úsala, si no, agrega una nueva
    if (solicitudItems.length > 0 && !solicitudItems[solicitudItems.length - 1].insumoId) {
      _selectInsumo(solicitudItems.length - 1, insumoId);
    } else {
      solicitudItems.push({ insumoId, cantidad: 1, comentario: '', imagen: '' });
      const ins = getInsumo(insumoId);
      if (ins) {
        if (ins.imagen) solicitudItems[solicitudItems.length - 1].imagen = ins.imagen;
        if (ins.especificaciones) solicitudItems[solicitudItems.length - 1].comentario = ins.especificaciones;
      }
      renderItems();
    }
  }
  closeModal();
}

async function guardarSolicitud() {
  const tipo   = document.getElementById('sol-tipo').value;
  const sol    = document.getElementById('sol-solicitante').value.trim();
  const ccOri  = document.getElementById('sol-cc-ori').value;
  const ccDes  = document.getElementById('sol-cc-des').value;
  const obs    = document.getElementById('sol-obs').value.trim();

  // Derive empresaId from the selected CC
  const ccOriObj = S.centrosCosto.find(c => c.id === ccOri);
  const ccDesObj = S.centrosCosto.find(c => c.id === ccDes);
  const empOri = ccOriObj ? ccOriObj.empresaId : '';
  const empDes = ccDesObj ? ccDesObj.empresaId : '';

  if (!sol)                                             return alert('Ingrese el nombre del solicitante');
  if (!ccOri)                                           return alert('Seleccione el centro de costo de origen');
  if (!ccDes)                                           return alert('Seleccione el centro de costo de destino');
  if (ccOri === ccDes && ccOri !== '999' && ccOri !== '998') return alert('El origen y destino no pueden ser iguales');

  if (solicitudItems.length === 0)                      return alert('Agregue al menos un insumo');
  if (solicitudItems.some(i => !i.insumoId))            return alert('Seleccione el insumo en todas las filas');
  if (solicitudItems.some(i => !i.cantidad || i.cantidad <= 0)) return alert('Todas las cantidades deben ser mayores a cero');

  // ── VALIDACIÓN CRÍTICA: Comprobar tope de stock disponible en inventario ──
  for (const item of solicitudItems) {
    const ins = getInsumo(item.insumoId);
    if (ins && ins.cantidad !== undefined && ins.cantidad !== null && ins.cantidad !== '') {
      const stockVal = parseFloat(ins.cantidad);
      const reqVal = parseFloat(item.cantidad);
      if (reqVal > stockVal) {
        return alert(`❌ TOPE DE STOCK EXCEDIDO:\n\nEl insumo "${ins.nombre}" (${ins.clave || ins.id}) solo cuenta con un stock disponible de ${stockVal} ${ins.unidad || 'Pieza'} en almacén.\n\nNo se permite realizar un traspaso por ${reqVal} ${ins.unidad || 'Pieza'}.\n\nPor favor ajuste la cantidad para continuar.`);
      }
    }
  }

  const itemsToSave = solicitudItems.map(i => {
    const ins = getInsumo(i.insumoId);
    return {
      insumoId: i.insumoId,
      nombre: ins ? ins.nombre : '',
      unidad: ins ? ins.unidad : 'Pieza',
      cantidad: parseFloat(i.cantidad) || 0,
      precio: 0,
      comentario: (i.comentario || '').trim(),
      imagen: i.imagen || (ins ? ins.imagen || '' : '')
    };
  });

  // Determinar si el usuario es postventa (flujo directo sin autorización)
  const currentUser = getUser();
  const isPostventa = currentUser && currentUser.rol === 'postventa';
  const fechaAhora = now();

  const folio = genFolio(tipo);
  const t = {
    id:               'T' + Date.now(),
    folio,
    tipo,
    status:           isPostventa ? 'recibido' : 'pendiente_cordinador',
    solicitante:      sol,
    empresaOrigen:    empOri,
    ccOrigen:         ccOri,
    empresaDestino:   empDes,
    ccDestino:        ccDes,
    observaciones:    obs,
    items:            itemsToSave,
    fechaSolicitud:   fechaAhora,
    autorizadorCordinador: isPostventa ? 'Auto Post-Venta' : null,
    fechaAutorizacionCordinador: isPostventa ? fechaAhora : null,
    comentarioAuthCordinador: isPostventa ? 'Aprobado automáticamente (Post-Venta)' : null,
    autorizador:      isPostventa ? 'Auto Post-Venta' : null,
    fechaAutorizacion: isPostventa ? fechaAhora : null,
    comentarioAuth:   isPostventa ? 'Aprobado automáticamente (Post-Venta)' : null,
    receptor:         isPostventa ? sol : null,
    fechaRecepcion:   isPostventa ? fechaAhora : null,
    comentarioRec:    isPostventa ? 'Recibido automáticamente (Post-Venta)' : null,
  };

  const btn = document.querySelector('button[onclick="guardarSolicitud()"]');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Guardando...';
  }

  try {
    S.traspasos.push(t);
    await saveState('traspasos', t);
    if (typeof fetchState === 'function') {
      await fetchState();
    }

    const created = S.traspasos.find(x => x.fechaSolicitud === t.fechaSolicitud && x.solicitante === t.solicitante);
    const finalFolio = created ? created.folio : folio;
    const finalId = created ? created.id : t.id;

    document.getElementById('content').innerHTML = `
    <div class="card" style="max-width:600px;margin:40px auto">
      <div class="card-body" style="text-align:center;padding:40px">
        <div style="width:60px;height:60px;background:var(--green-light);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
          <svg fill="none" viewBox="0 0 24 24" stroke="var(--green)" style="width:32px;height:32px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        </div>
        <div style="font-size:20px;font-weight:800;margin-bottom:8px">${isPostventa ? '¡Solicitud Registrada!' : '¡Solicitud Generada!'}</div>
        <div style="font-size:26px;font-weight:900;color:var(--green);margin-bottom:4px">${finalFolio}</div>
        <div style="color:#888;font-size:13px;margin-bottom:24px">${isPostventa ? 'El movimiento ha sido registrado directamente' : 'La solicitud está pendiente de autorización'}</div>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="imprimirTraspaso('${finalId}')">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            Imprimir Solicitud
          </button>
          <button class="btn btn-secondary" onclick="navigate('nueva-solicitud')">Nueva Solicitud</button>
          ${isPostventa ? '<button class="btn btn-secondary" onclick="navigate(\'historial\')">Ir al Historial</button>' : '<button class="btn btn-secondary" onclick="navigate(\'autorizacion\')">Ir a Autorización</button>'}
        </div>
      </div>
    </div>`;

    updateBadges();
  } catch (err) {
    console.error(err);
    alert('Error al guardar la solicitud: ' + (err.message || err));
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Generar Solicitud';
    }
  }
}

async function subirFotoItem(i, input) {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
    alert('Solo se permiten imágenes en formato JPG o PNG');
    input.value = '';
    return;
  }
  const thumbDiv = document.getElementById(`thumb-${i}`);
  if (thumbDiv) thumbDiv.innerHTML = '<span style="font-size:10px">⏳</span>';
  
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
    
    solicitudItems[i].imagen = data.url;
    if (thumbDiv) {
      thumbDiv.innerHTML = `<img src="${data.url}" style="width:32px;height:32px;object-fit:cover;border-radius:6px;cursor:pointer;border:1px solid #cbd5e1" onclick="verFotoInsumo('${data.url}', 'Foto Insumo')" title="Ver foto">`;
    }
  } catch (err) {
    console.error(err);
    alert('Error al subir la imagen');
    if (thumbDiv) thumbDiv.innerHTML = '❌';
  }
}

function resizeAndCompressImage(file, maxWidth) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = err => reject(err);
    };
    reader.onerror = err => reject(err);
  });
}
