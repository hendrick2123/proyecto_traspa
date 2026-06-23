// =====================================================
// VIEW – Nueva Devolución
// =====================================================

let devItems = [];
let devOri = null;
let devDes = null;
let devOriginalFolio = '';
let devOriginalId = '';

function iniciarDevolucion(id) {
  const t = S.traspasos.find(x => x.id === id);
  if (!t || (t.tipo !== 'PRS' && t.tipo !== 'GAR') || t.status !== 'recibido') return;
  
  devOriginalId = t.id;
  devOriginalFolio = t.folio;
  
  // Invertir origen y destino
  devOri = t.ccDestino;
  devDes = t.ccOrigen;
  
  // Copiar insumos
  if (t.tipo === 'GAR') {
    devItems = t.items.filter(i => parseFloat(i.cantidad) >= 3).map(i => ({ ...i }));
    if (devItems.length === 0) {
      alert("No hay insumos para devolver en este traspaso por garantía (todas las cantidades son menores a 3).");
      return;
    }
  } else {
    devItems = t.items.map(i => ({ ...i }));
  }
  
  navigate('devolucion');
}

function renderDevolucion() {
  if (!devOriginalId) {
    document.getElementById('content').innerHTML = '<div class="alert">No se ha seleccionado un traspaso para devolver.</div>';
    return;
  }

  const ccOriObj = getCC(devOri);
  const ccDesObj = getCC(devDes);
  const devOriName = getDesarrollo(ccOriObj.empresaId).nombre;
  const devDesName = getDesarrollo(ccDesObj.empresaId).nombre;

  document.getElementById('content').innerHTML = `
  <div class="card">
    <div class="card-header">
      <h3>Nueva Devolución (Préstamo: ${devOriginalFolio})</h3>
    </div>
    <div class="card-body">
      <div class="form-grid form-grid-2" style="margin-bottom:20px">
        <div class="form-group">
          <label>Solicitante *</label>
          <select id="dev-solicitante">
            <option value="">Cargando monitores de compras...</option>
          </select>
        </div>
      </div>

      <hr class="divider">

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
        <div>
          <div style="font-size:12px;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px">📤 Origen (Devuelve)</div>
          <div style="padding:12px;border:1px solid #ddd;border-radius:6px;background:#f9f9f9">
            <div style="font-weight:700">${ccOriObj.nombre}</div>
            <div style="font-size:11px;color:#888;margin-top:4px">🏢 ${devOriName}</div>
          </div>
        </div>
        <div>
          <div style="font-size:12px;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px">📥 Destino (Recibe)</div>
          <div style="padding:12px;border:1px solid #ddd;border-radius:6px;background:#f9f9f9">
            <div style="font-weight:700">${ccDesObj.nombre}</div>
            <div style="font-size:11px;color:#888;margin-top:4px">🏢 ${devDesName}</div>
          </div>
        </div>
      </div>

      <hr class="divider">
      <div class="form-group" style="margin-bottom:12px">
        <label>Observaciones</label>
        <textarea id="dev-obs" placeholder="Notas sobre esta devolución...">Devolución del préstamo ${devOriginalFolio}</textarea>
      </div>

      <hr class="divider">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px">Insumos a Devolver</div>
      <div class="items-table-wrap">
        <table>
          <thead><tr><th>Insumo</th><th style="width:120px">Cant. a Devolver</th><th style="width:100px">Unidad</th><th style="width:40px"></th></tr></thead>
          <tbody id="dev-items-tbody">
            ${renderDevItems()}
          </tbody>
        </table>
      </div>

      <hr class="divider">
      <div style="display:flex;justify-content:flex-end;gap:10px">
        <button class="btn btn-secondary" onclick="navigate('historial')">Cancelar</button>
        <button class="btn btn-primary" onclick="guardarDevolucion()">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Generar Devolución
        </button>
      </div>
    </div>
  </div>`;

  // Fetch users for solicitante
  fetch(API_BASE + '/api/users')
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById('dev-solicitante');
      if (!select) return;
      if (data.users) {
        const almacenistas = data.users.filter(u => u.rol === 'almacenista' && u.activo);
        if (almacenistas.length > 0) {
          select.innerHTML = '<option value="">-- Seleccionar solicitante --</option>' + 
            almacenistas.map(u => `<option value="${u.nombre}">${u.nombre}</option>`).join('');
        } else {
          select.innerHTML = '<option value="">No hay monitores de compras activos</option>';
        }
      }
    });
}

function renderDevItems() {
  if (devItems.length === 0) {
    return '<tr><td colspan="4" class="text-center" style="color:#aaa;padding:20px">No hay insumos</td></tr>';
  }
  return devItems.map((item, i) => {
    const ins = getInsumo(item.insumoId);
    return `<tr>
      <td>${ins.clave} · ${ins.nombre}</td>
      <td>
        <input type="number" min="0.01" step="any" value="${item.cantidad}"
               onchange="devItems[${i}].cantidad=parseFloat(this.value)||0">
      </td>
      <td style="color:#888;font-size:12px">${ins ? ins.unidad : '—'}</td>
      <td>
        <button onclick="devItems.splice(${i},1);document.getElementById('dev-items-tbody').innerHTML=renderDevItems()"
                style="background:none;border:none;color:var(--red);cursor:pointer;font-size:16px">×</button>
      </td>
    </tr>`;
  }).join('');
}

function guardarDevolucion() {
  const sol = document.getElementById('dev-solicitante').value.trim();
  const obs = document.getElementById('dev-obs').value.trim();

  if (!sol) return alert('Seleccione un solicitante');
  if (devItems.length === 0) return alert('Debe devolver al menos un insumo');
  if (devItems.some(i => !i.cantidad || i.cantidad <= 0)) return alert('Todas las cantidades deben ser mayores a cero');

  const ccOriObj = getCC(devOri);
  const ccDesObj = getCC(devDes);
  const empOri = ccOriObj ? ccOriObj.empresaId : '';
  const empDes = ccDesObj ? ccDesObj.empresaId : '';

  const folio = genFolio('DEV');
  const t = {
    id:               'T' + Date.now(),
    folio,
    tipo:             'DEV',
    status:           'pendiente',
    solicitante:      sol,
    empresaOrigen:    empOri,
    ccOrigen:         devOri,
    empresaDestino:   empDes,
    ccDestino:        devDes,
    observaciones:    obs,
    items:            devItems.map(i => ({ ...i })),
    fechaSolicitud:   now(),
    autorizador:      null,
    fechaAutorizacion:null,
    comentarioAuth:   null,
    receptor:         null,
    fechaRecepcion:   null,
    comentarioRec:    null,
  };

  S.traspasos.push(t);
  saveState();

  document.getElementById('content').innerHTML = `
  <div class="card" style="max-width:600px;margin:40px auto">
    <div class="card-body" style="text-align:center;padding:40px">
      <div style="width:60px;height:60px;background:var(--green-light);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
        <svg fill="none" viewBox="0 0 24 24" stroke="var(--green)" style="width:32px;height:32px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
      </div>
      <div style="font-size:20px;font-weight:800;margin-bottom:8px">¡Devolución Generada!</div>
      <div style="font-size:26px;font-weight:900;color:var(--green);margin-bottom:4px">${folio}</div>
      <div style="color:#888;font-size:13px;margin-bottom:24px">La devolución está pendiente de autorización</div>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="imprimirTraspaso('${t.id}')">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
          Imprimir Comprobante
        </button>
        <button class="btn btn-secondary" onclick="navigate('historial')">Ir al Historial</button>
      </div>
    </div>
  </div>`;

  updateBadges();
  
  // Limpiar para evitar doble envio
  devOriginalId = '';
}
