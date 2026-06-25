// =====================================================
// VIEW – Nueva Devolución (con soporte de devoluciones parciales)
// =====================================================

let devItems = [];
let devOri = null;
let devDes = null;
let devOriginalFolio = '';
let devOriginalId = '';

/**
 * Calcula cuánto queda por devolver de un traspaso original.
 * Descuenta todo lo que ya fue devuelto en DEV previos que NO están rechazados.
 * @param {string} originalId - ID del traspaso original (PRS/GAR)
 * @returns {Array} items con la cantidad pendiente por devolver (cantidad > 0)
 */
function calcularPendientes(originalId) {
  const original = S.traspasos.find(t => t.id === originalId);
  if (!original) return [];

  // Buscar todos los DEV ligados a este folio original (no rechazados)
  const devs = S.traspasos.filter(t =>
    t.tipo === 'DEV' &&
    t.folioOriginalRef === original.folio &&
    t.status !== 'rechazado'
  );

  // Sumar lo ya devuelto por insumo
  const yaDevuelto = {};
  devs.forEach(dev => {
    dev.items.forEach(item => {
      yaDevuelto[item.insumoId] = (yaDevuelto[item.insumoId] || 0) + parseFloat(item.cantidad);
    });
  });

  // Calcular lo que queda pendiente
  return original.items
    .map(item => ({
      ...item,
      cantidadOriginal: parseFloat(item.cantidad),
      cantidadDevuelta: yaDevuelto[item.insumoId] || 0,
      cantidad: parseFloat(item.cantidad) - (yaDevuelto[item.insumoId] || 0)
    }))
    .filter(item => item.cantidad > 0.0001); // Ignorar diferencias de punto flotante
}

/**
 * Verifica si un traspaso todavía tiene insumos pendientes de devolver.
 * Considera DEV en cualquier estado excepto rechazado.
 */
function tienePendientesDevolucion(t) {
  if ((t.tipo !== 'PRS' && t.tipo !== 'GAR') || t.status === 'rechazado') return false;
  // Solo traspasos recibidos o con devolución parcial
  if (t.status !== 'recibido' && t.status !== 'devuelto_parcial') return false;
  // Si es GAR, verificar que al menos un insumo tenga cantidad >= 3
  if (t.tipo === 'GAR' && !t.items.some(i => parseFloat(i.cantidad) >= 3)) return false;
  const pendientes = calcularPendientes(t.id);
  return pendientes.length > 0;
}

function iniciarDevolucion(id) {
  const t = S.traspasos.find(x => x.id === id);
  if (!t || (t.tipo !== 'PRS' && t.tipo !== 'GAR')) return;
  if (t.status !== 'recibido' && t.status !== 'devuelto_parcial') return;

  devOriginalId = t.id;
  devOriginalFolio = t.folio;

  // Invertir origen y destino
  devOri = t.ccDestino;
  devDes = t.ccOrigen;

  // Calcular pendientes (descontando devoluciones previas)
  let pendientes = calcularPendientes(t.id);

  if (t.tipo === 'GAR') {
    pendientes = pendientes.filter(i => i.cantidadOriginal >= 3);
  }

  if (pendientes.length === 0) {
    alert('Este traspaso ya fue devuelto en su totalidad.');
    return;
  }

  devItems = pendientes.map(i => ({ ...i }));
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

  // Calcular resumen de cuánto ya fue devuelto
  const original = S.traspasos.find(t => t.id === devOriginalId);
  const totalInsumos = original ? original.items.length : 0;
  const pendientesCount = devItems.length;
  const yaDevueltoCount = totalInsumos - pendientesCount;

  document.getElementById('content').innerHTML = `
  <div class="card">
    <div class="card-header">
      <h3>Devolución del Préstamo: ${devOriginalFolio}</h3>
    </div>
    <div class="card-body">

      ${yaDevueltoCount > 0 ? `
      <div class="alert alert-warning" style="margin-bottom:16px">
        ⚠️ <strong>Devolución parcial en curso.</strong>
        Ya se han devuelto previamente algunos insumos de este traspaso.
        Solo se muestran los insumos que aún faltan por devolver.
      </div>` : ''}

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
      <div style="font-size:13px;font-weight:700;margin-bottom:12px">
        Insumos Pendientes de Devolver
        <span style="font-size:11px;font-weight:500;color:#888;margin-left:8px">(Puedes devolver cantidades menores a las pendientes para hacer una devolución parcial)</span>
      </div>
      <div class="items-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Insumo</th>
              <th style="width:130px">Cant. Pendiente</th>
              <th style="width:130px">Cant. a Devolver</th>
              <th style="width:80px">Unidad</th>
            </tr>
          </thead>
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
    return '<tr><td colspan="4" class="text-center" style="color:#aaa;padding:20px">No hay insumos pendientes</td></tr>';
  }
  return devItems.map((item, i) => {
    const ins = getInsumo(item.insumoId);
    const pendiente = item.cantidadOriginal - item.cantidadDevuelta;
    return `<tr>
      <td>${ins.clave} · ${ins.nombre}</td>
      <td style="color:#888;font-size:12px;font-weight:700">${pendiente} ${ins.unidad}</td>
      <td>
        <input type="number" id="dev-qty-${i}" min="0.01" max="${pendiente}" step="any" value="${item.cantidad}"
               onchange="devItems[${i}].cantidad=Math.min(parseFloat(this.value)||0, ${pendiente}); if(parseFloat(this.value)>${pendiente}){this.value=${pendiente};devItems[${i}].cantidad=${pendiente};}"
               style="border:1px solid #ddd;border-radius:4px;padding:5px 8px;font-size:12px;width:100%">
      </td>
      <td style="color:#888;font-size:12px">${ins ? ins.unidad : '—'}</td>
    </tr>`;
  }).join('');
}

function guardarDevolucion() {
  const sol = document.getElementById('dev-solicitante').value.trim();
  const obs = document.getElementById('dev-obs').value.trim();

  if (!sol) return alert('Seleccione un solicitante');
  if (devItems.length === 0) return alert('No hay insumos pendientes de devolver');
  if (devItems.some(i => !i.cantidad || i.cantidad <= 0)) return alert('Todas las cantidades deben ser mayores a cero');

  // Validar que no se devuelva más de lo pendiente
  for (let i = 0; i < devItems.length; i++) {
    const item = devItems[i];
    const maxPendiente = item.cantidadOriginal - item.cantidadDevuelta;
    if (parseFloat(item.cantidad) > maxPendiente + 0.0001) {
      const ins = getInsumo(item.insumoId);
      return alert(`No puedes devolver más de ${maxPendiente} unidades de "${ins.nombre}". Solo eso está pendiente.`);
    }
  }

  const ccOriObj = getCC(devOri);
  const ccDesObj = getCC(devDes);
  const empOri = ccOriObj ? ccOriObj.empresaId : '';
  const empDes = ccDesObj ? ccDesObj.empresaId : '';

  const folio = genFolio('DEV');
  const t = {
    id:                'T' + Date.now(),
    folio,
    tipo:              'DEV',
    status:            'pendiente',
    solicitante:       sol,
    empresaOrigen:     empOri,
    ccOrigen:          devOri,
    empresaDestino:    empDes,
    ccDestino:         devDes,
    observaciones:     obs,
    folioOriginalRef:  devOriginalFolio,  // <-- Ligado al folio del PRS/GAR original
    items:             devItems.map(i => ({
      insumoId: i.insumoId,
      cantidad: i.cantidad,
      unidad:   i.unidad || ''
    })),
    fechaSolicitud:    now(),
    autorizador:       null,
    fechaAutorizacion: null,
    comentarioAuth:    null,
    receptor:          null,
    fechaRecepcion:    null,
    comentarioRec:     null,
  };

  S.traspasos.push(t);

  // ── Actualizar estado del traspaso original ─────────────────────────────
  const original = S.traspasos.find(x => x.id === devOriginalId);
  if (original) {
    // Recalcular pendientes INCLUYENDO este nuevo DEV (no rechazado)
    const pendientesRestantes = calcularPendientes(devOriginalId);
    if (pendientesRestantes.length === 0) {
      original.status = 'devuelto_total';
    } else {
      original.status = 'devuelto_parcial';
    }
  }

  saveState();

  document.getElementById('content').innerHTML = `
  <div class="card" style="max-width:600px;margin:40px auto">
    <div class="card-body" style="text-align:center;padding:40px">
      <div style="width:60px;height:60px;background:var(--green-light);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
        <svg fill="none" viewBox="0 0 24 24" stroke="var(--green)" style="width:32px;height:32px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
      </div>
      <div style="font-size:20px;font-weight:800;margin-bottom:8px">¡Devolución Generada!</div>
      <div style="font-size:26px;font-weight:900;color:var(--green);margin-bottom:4px">${folio}</div>
      <div style="color:#888;font-size:13px;margin-bottom:8px">La devolución está pendiente de autorización</div>
      ${original && original.status === 'devuelto_total'
        ? `<div class="alert alert-success" style="margin:12px 0">✅ El préstamo <strong>${devOriginalFolio}</strong> ha sido devuelto en su totalidad.</div>`
        : `<div class="alert alert-warning" style="margin:12px 0">⚠️ El préstamo <strong>${devOriginalFolio}</strong> tiene insumos pendientes de devolución. Podrás continuar devolviendo desde el historial.</div>`
      }
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

  // Limpiar variables para evitar doble envío
  devOriginalId = '';
  devOriginalFolio = '';
}
