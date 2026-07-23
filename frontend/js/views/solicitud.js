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
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-size:13px;font-weight:700">Insumos a Traspasar</div>
        <button class="btn btn-secondary btn-sm" onclick="agregarItem()">+ Agregar Insumo</button>
      </div>
      <div class="items-table-wrap" style="overflow:visible">
        <table>
          <thead><tr><th>Insumo</th><th style="width:120px">Cantidad</th><th style="width:100px">Unidad</th><th style="width:40px"></th></tr></thead>
          <tbody id="items-tbody">
            <tr><td colspan="4" class="text-center" style="color:#aaa;padding:20px">No hay insumos. Presione "+ Agregar Insumo"</td></tr>
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

  // Populate solicitante dropdown with users that have the 'almacenista' role
  const currentUser = getUser();
  fetch(API_BASE + '/api/users')
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById('sol-solicitante');
      if (!select) return;
      if (data.users) {
        const almacenistas = data.users.filter(u => u.rol === 'almacenista' && u.activo);
        if (almacenistas.length > 0) {
          select.innerHTML = '<option value="">-- Seleccionar solicitante --</option>' + 
            almacenistas.map(u => `<option value="${u.nombre}">${u.nombre}</option>`).join('');
          // Auto-seleccionar al usuario de la sesión actual
          if (currentUser && currentUser.nombre) {
            const match = Array.from(select.options).find(o => o.value === currentUser.nombre);
            if (match) select.value = currentUser.nombre;
          }
        } else {
          select.innerHTML = '<option value="">No hay monitores de control activos</option>';
        }
      }
    })
    .catch(err => {
      const select = document.getElementById('sol-solicitante');
      if (select) select.innerHTML = '<option value="">Error al cargar solicitantes</option>';
    });
}

// Builds option list for CC dropdowns grouped by Desarrollo
function buildCCOptions() {
  // Group centros de costo by desarrolloId (empresaId) - filtered by user's company
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

// Shows a badge below the Origen CC select with the related Desarrollo
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
  // Re-render items in case CC Origen changed
  renderItems();
}

// Shows a badge below the Destino CC select with the related Desarrollo
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
  // Re-render items in case CC Destino changed to or from 999
  renderItems();
}

function agregarItem() {
  solicitudItems.push({ insumoId: '', cantidad: 1, detalles: [{precio: 0, comentario: '', imagen: ''}] });
  renderItems();
}

// ── Insumo Search Autocomplete ─────────────────────────────────────────────
let _insSearchActive = null; // índice del dropdown abierto

function _getInsumosFiltered() {
  // Retornamos todos los insumos sin restringir por el primer dígito
  return S.insumos;
}

function _openInsDropdown(i) {
  // Cierra cualquier otro abierto
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
        ins.nombre.toLowerCase().includes(query) ||
        String(ins.clave).toLowerCase().includes(query))
    : todos;
  dd.innerHTML = matches.length
    ? matches.slice(0, 150).map(ins =>
        `<div class="ins-dd-item" onmousedown="_selectInsumo(${i},'${ins.id}')" style="padding:10px 14px;font-size:13px">
          <span style="font-weight:700;color:#1e40af;font-size:12px;min-width:90px;display:inline-block">${ins.clave}</span>
          <span style="color:#222;font-weight:500">${ins.nombre}</span>
          <span style="color:#666;font-size:11px;margin-left:auto;background:#f1f5f9;padding:2px 8px;border-radius:4px;font-weight:600">${ins.unidad || 'Pza'}</span>
        </div>`).join('')
    : '<div style="padding:10px 12px;color:#aaa;font-size:12px">Sin resultados</div>';
}

function _selectInsumo(i, insumoId) {
  const oldInsumoId = solicitudItems[i].insumoId;
  const oldIns = oldInsumoId ? getInsumo(oldInsumoId) : null;
  const oldNombre = oldIns ? oldIns.nombre : '';

  solicitudItems[i].insumoId = insumoId;
  const ins = getInsumo(insumoId);
  const input = document.getElementById('ins-search-' + i);
  if (input && ins) input.value = ins.clave + ' · ' + ins.nombre;
  _closeInsDropdown(i);
  // Actualizar celda de unidad
  const unidadCell = document.getElementById('ins-unit-' + i);
  if (unidadCell) unidadCell.textContent = ins ? ins.unidad : '—';

  // Si es un traspaso de 999 a 999, inicializar/actualizar comentarios vacíos o con el nombre del insumo anterior
  const ccOri = document.getElementById('sol-cc-ori')?.value;
  const ccDes = document.getElementById('sol-cc-des')?.value;
  if (ccOri === '999' && ccDes === '999' && ins) {
    if (solicitudItems[i].detalles) {
      solicitudItems[i].detalles.forEach(d => {
        if (!d.comentario || !d.comentario.trim() || d.comentario === oldNombre) {
          d.comentario = ins.nombre;
        }
      });
    }
  }
  renderItems();
}

// Cierra dropdowns al hacer click fuera
document.addEventListener('click', function(e) {
  if (!e.target.closest('.ins-search-wrap')) {
    document.querySelectorAll('.ins-dropdown').forEach(d => d.style.display = 'none');
    _insSearchActive = null;
  }
});

function renderItems() {
  const tbody = document.getElementById('items-tbody');
  if (!tbody) return;

  if (solicitudItems.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center" style="color:#aaa;padding:20px">No hay insumos. Presione "+ Agregar Insumo"</td></tr>';
    return;
  }

  const isSaldos = document.getElementById('sol-cc-des')?.value === '999';

  tbody.innerHTML = solicitudItems.map((item, i) => {
    const ins = item.insumoId ? getInsumo(item.insumoId) : null;
    const displayVal = ins ? ins.clave + ' · ' + ins.nombre : '';
    
    // Sincronizar detalles con la cantidad si es saldos
    if (isSaldos && item.cantidad > 0) {
      if (!item.detalles) item.detalles = [];
      const cant = Math.floor(item.cantidad);
      const ccOri = document.getElementById('sol-cc-ori')?.value;
      const ccDes = document.getElementById('sol-cc-des')?.value;
      
      const insName = ins ? ins.nombre : '';
      const defaultComentario = (ccOri === '999' && ccDes === '999') ? insName : '';

      // Si es un traspaso del 999 al 999, pre-rellenar con el nombre del insumo los comentarios vacíos
      if (ccOri === '999' && ccDes === '999') {
        item.detalles.forEach(d => {
          if (!d.comentario || !d.comentario.trim()) {
            d.comentario = insName;
          }
        });
      }

      while(item.detalles.length < cant) item.detalles.push({precio: 0, comentario: defaultComentario, imagen: ''});
      while(item.detalles.length > cant) item.detalles.pop();
    }

    let html = `<tr>
      <td>
        <div class="ins-search-wrap" style="position:relative">
          <div style="display:flex;align-items:center;gap:6px;border:1px solid #ddd;border-radius:6px;padding:5px 10px;background:#fff;cursor:text"
               onclick="document.getElementById('ins-search-${i}').focus();_openInsDropdown(${i})">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              id="ins-search-${i}"
              type="text"
              placeholder="Buscar insumo por nombre o clave..."
              value="${displayVal.replace(/"/g, '&quot;')}"
              autocomplete="off"
              style="border:none;outline:none;font-family:Montserrat,sans-serif;font-size:12px;width:100%;background:transparent"
              oninput="_filterInsDropdown(${i})"
              onfocus="_filterInsDropdown(${i})"
            >
            ${ins ? `<span style="cursor:pointer;color:#ccc;font-size:15px;line-height:1" onmousedown="solicitudItems[${i}].insumoId='';document.getElementById('ins-search-${i}').value='';document.getElementById('ins-unit-${i}').textContent='—';_filterInsDropdown(${i})">×</span>` : ''}
          </div>
          <div id="ins-dd-${i}" class="ins-dropdown"
               style="display:none;position:absolute;top:calc(100% + 3px);left:0;width:600px;max-width:90vw;background:#fff;border:1px solid #e2e8f0;border-radius:8px;box-shadow:0 10px 25px rgba(0,0,0,.15);max-height:420px;overflow-y:auto;z-index:9999">
          </div>
        </div>
      </td>
      <td>
        <input type="number" min="1" step="${isSaldos ? '1' : 'any'}" value="${item.cantidad}"
               onchange="solicitudItems[${i}].cantidad=parseFloat(this.value)||0;renderItems()"
               style="border:1px solid #ddd;border-radius:4px;padding:5px 8px;font-family:Montserrat,sans-serif;font-size:12px;width:100%">
      </td>
      <td id="ins-unit-${i}" style="color:#888;font-size:12px">${ins ? ins.unidad : '—'}</td>
      <td>
        <button onclick="solicitudItems.splice(${i},1);renderItems()"
                style="background:none;border:none;color:var(--red);cursor:pointer;font-size:16px">×</button>
      </td>
    </tr>`;

    if (isSaldos && item.cantidad > 0) {
      html += `<tr><td colspan="4" style="padding:0"><div style="background:#f8fafc;padding:10px 20px;border-bottom:1px solid #eee">`;
      for(let d=0; d<Math.floor(item.cantidad); d++) {
         const thumb = item.detalles[d].imagen ? `<img src="${item.detalles[d].imagen}" style="width:24px;height:24px;object-fit:cover;border-radius:4px;cursor:pointer" onclick="window.open('${item.detalles[d].imagen}')">` : '';
         html += `<div style="display:flex;gap:10px;margin-bottom:6px;align-items:center">
             <span style="font-size:11px;font-weight:700;color:#666;width:20px">#${d+1}</span>
             <label style="cursor:pointer;display:flex;align-items:center;justify-content:center;width:28px;height:28px;background:#e2e8f0;border-radius:4px;color:#64748b" title="Subir Foto">
               📸
               <input type="file" accept="image/jpeg, image/png, image/jpg" style="display:none" onchange="subirFotoSaldos(${i}, ${d}, this)">
             </label>
             <div id="thumb-${i}-${d}" style="width:24px;height:24px;display:flex;align-items:center;justify-content:center">${thumb}</div>
             <input type="text" placeholder="Descripción obligatoria del artículo..." value="${(item.detalles[d].comentario || '').replace(/"/g, '&quot;')}" 
                    onchange="solicitudItems[${i}].detalles[${d}].comentario = this.value"
                    style="flex:1;border:1px solid #ccc;padding:4px 8px;font-size:11px;border-radius:4px">
             <input type="number" placeholder="Precio" value="${item.detalles[d].precio || 0}"
                    onchange="solicitudItems[${i}].detalles[${d}].precio = parseFloat(this.value)||0"
                    style="width:90px;border:1px solid #ccc;padding:4px 8px;font-size:11px;border-radius:4px">
         </div>`;
      }
      html += `</div></td></tr>`;
    }
    return html;
  }).join('');

  // Inyectar estilos del dropdown si no existen
  if (!document.getElementById('ins-dd-styles')) {
    const style = document.createElement('style');
    style.id = 'ins-dd-styles';
    style.textContent = `
      .ins-dd-item {
        padding: 8px 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        border-bottom: 1px solid #f1f5f9;
        transition: background .12s;
      }
      .ins-dd-item:last-child { border-bottom: none; }
      .ins-dd-item:hover { background: #eff6ff; }
      .ins-dropdown::-webkit-scrollbar { width: 5px; }
      .ins-dropdown::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    `;
    document.head.appendChild(style);
  }
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
  if (ccOri === ccDes && ccOri !== '999')                return alert('El origen y destino no pueden ser iguales');

  if (solicitudItems.length === 0)                      return alert('Agregue al menos un insumo');
  if (solicitudItems.some(i => !i.insumoId))            return alert('Seleccione el insumo en todas las filas');
  if (solicitudItems.some(i => !i.cantidad || i.cantidad <= 0)) return alert('Todas las cantidades deben ser mayores a cero');

  const isSaldos = ccDes === '999';
  const isSalidaSaldos = ccOri === '999';

  if (isSaldos) {
    if (solicitudItems.some(i => i.detalles && i.detalles.some(d => !(d.comentario||'').trim()))) {
      return alert('Debe proporcionar una descripción para CADA unidad de los insumos (Saldos Iniciales).');
    }
  }

  let itemsToSave = [];
  if (isSaldos) {
    solicitudItems.forEach(item => {
       if (item.detalles && item.detalles.length > 0) {
         const ins = getInsumo(item.insumoId);
         item.detalles.forEach(det => {
            itemsToSave.push({
               insumoId: item.insumoId,
               nombre: ins ? ins.nombre : '',
               unidad: ins ? ins.unidad : 'Pieza',
               cantidad: 1,
               precio: det.precio || 0,
               comentario: det.comentario || '',
               imagen: det.imagen || ''
            });
         });
       }
    });
  } else if (isSalidaSaldos) {
    itemsToSave = solicitudItems.map(i => {
      const ins = getInsumo(i.insumoId);
      return {
        ...i,
        nombre: ins ? ins.nombre : '',
        unidad: ins ? ins.unidad : 'Pieza',
        precio: 0,
        comentario: ''
      };
    });
  } else {
    itemsToSave = solicitudItems.map(i => {
      const ins = getInsumo(i.insumoId);
      return {
        ...i,
        nombre: ins ? ins.nombre : '',
        unidad: ins ? ins.unidad : 'Pieza'
      };
    });
  }

  const folio = genFolio(tipo);
  const t = {
    id:               'T' + Date.now(),
    folio,
    tipo,
    status:           'pendiente_cordinador',
    solicitante:      sol,
    empresaOrigen:    empOri,
    ccOrigen:         ccOri,
    empresaDestino:   empDes,
    ccDestino:        ccDes,
    observaciones:    obs,
    items:            itemsToSave,
    fechaSolicitud:   now(),
    autorizadorCordinador: null,
    fechaAutorizacionCordinador: null,
    comentarioAuthCordinador: null,
    autorizador:      null,
    fechaAutorizacion:null,
    comentarioAuth:   null,
    receptor:         null,
    fechaRecepcion:   null,
    comentarioRec:    null,
  };

  const btn = document.querySelector('button[onclick="guardarSolicitud()"]');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Guardando...';
  }

  try {
    S.traspasos.push(t);
    await saveState('traspasos');
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
        <div style="font-size:20px;font-weight:800;margin-bottom:8px">¡Solicitud Generada!</div>
        <div style="font-size:26px;font-weight:900;color:var(--green);margin-bottom:4px">${finalFolio}</div>
        <div style="color:#888;font-size:13px;margin-bottom:24px">La solicitud está pendiente de autorización</div>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="imprimirTraspaso('${finalId}')">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            Imprimir Solicitud
          </button>
          <button class="btn btn-secondary" onclick="navigate('nueva-solicitud')">Nueva Solicitud</button>
          <button class="btn btn-secondary" onclick="navigate('autorizacion')">Ir a Autorización</button>
        </div>
      </div>
    </div>`;

    updateBadges();
  } catch (err) {
    console.error(err);
    alert('Error al guardar la solicitud: ' + (err.message || err));
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Guardar Solicitud';
    }
  }
}

async function subirFotoSaldos(i, d, input) {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
    alert('Solo se permiten imágenes en formato JPG o PNG');
    input.value = '';
    return;
  }
  const thumbDiv = document.getElementById(`thumb-${i}-${d}`);
  thumbDiv.innerHTML = '<span style="font-size:10px">⏳</span>';
  
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
    
    solicitudItems[i].detalles[d].imagen = data.url;
    thumbDiv.innerHTML = `<img src="${data.url}" style="width:24px;height:24px;object-fit:cover;border-radius:4px;cursor:pointer" onclick="window.open('${data.url}')">`;
  } catch (err) {
    console.error(err);
    alert('Error al subir la imagen');
    thumbDiv.innerHTML = '❌';
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
