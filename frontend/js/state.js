// =====================================================
// STATE – localStorage persistence + helpers
// =====================================================

function loadState() {
  const defaults = {
    empresas:     typeof EMPRESAS_DEFAULT !== 'undefined' ? EMPRESAS_DEFAULT : [{"id": '99', "nombre": 'Almacen', "rfc": ''}],
    centrosCosto: typeof CC_DEFAULT !== 'undefined' ? CC_DEFAULT : [{"id": '999', "empresaId": '99', "nombre": 'Almacen', "direccion": ''}],
    insumos:      typeof INSUMOS_DEFAULT !== 'undefined' ? INSUMOS_DEFAULT : [],
    traspasos:    [],
    folios:       { PRS: 0, TOB: 0, DEV: 0, GAR: 0 },
  };
  try {
    const saved = localStorage.getItem('gurbania_traspasos');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return defaults;
}

let S = loadState();

function fetchState() {
  const token = sessionStorage.getItem('gu_token');
  const headers = { 'Authorization': 'Bearer ' + token };

  return Promise.all([
    fetch(API_BASE + '/api/empresas', { headers }).then(res => { if (!res.ok) throw new Error(); return res.json(); }),
    fetch(API_BASE + '/api/centros_costo', { headers }).then(res => { if (!res.ok) throw new Error(); return res.json(); }),
    fetch(API_BASE + '/api/insumos', { headers }).then(res => { if (!res.ok) throw new Error(); return res.json(); }),
    fetch(API_BASE + '/api/desarrollos', { headers }).then(res => { if (!res.ok) throw new Error(); return res.json(); }),
    fetch(API_BASE + '/api/traspasos', { headers }).then(res => { if (!res.ok) throw new Error(); return res.json(); }),
    fetch(API_BASE + '/api/folios', { headers }).then(res => { if (!res.ok) throw new Error(); return res.json(); })
  ])
  .then(([empData, ccData, insData, devData, trData, folioData]) => {
    S = {
      empresas: empData.empresas || (Array.isArray(empData) ? empData : []),
      centrosCosto: ccData.centrosCosto || (Array.isArray(ccData) ? ccData : []),
      insumos: insData.insumos || (Array.isArray(insData) ? insData : []),
      desarrollos: devData.desarrollos || (Array.isArray(devData) ? devData : []),
      traspasos: trData.traspasos || (Array.isArray(trData) ? trData : []),
      folios: folioData.folios || folioData || { PRS: 0, TOB: 0, DEV: 0, GAR: 0 }
    };
    try {
      localStorage.setItem('gurbania_traspasos', JSON.stringify(S));
    } catch (e) {}
    return S;
  })
  .catch(err => {
    console.error('Error al cargar datos desde endpoints específicos, intentando fallback /api/state...', err);
    return fetch(API_BASE + '/api/state', { headers })
      .then(res => {
        if (!res.ok) throw new Error('Error al conectar con el servidor.');
        return res.json();
      })
      .then(data => {
        S = data;
        try {
          localStorage.setItem('gurbania_traspasos', JSON.stringify(S));
        } catch (e) {}
        return S;
      });
  });
}

function fetchTraspasosPaginated({ page = 1, limit = 25, status = '', tipo = '', empresa = '', cc = '', insumo = '' } = {}) {
  const token = sessionStorage.getItem('gu_token');
  const headers = { 'Authorization': 'Bearer ' + token };
  
  const params = new URLSearchParams({
    page,
    limit,
    status,
    tipo,
    empresa,
    cc,
    insumo
  });
  
  for (const [key, value] of [...params.entries()]) {
    if (!value) params.delete(key);
  }

  return fetch(API_BASE + '/api/traspasos?' + params.toString(), { headers })
    .then(res => {
      if (!res.ok) throw new Error('Error al conectar con el servidor.');
      return res.json();
    });
}

function saveState(resource) {
  try {
    localStorage.setItem('gurbania_traspasos', JSON.stringify(S));
  } catch (e) {}

  const token = sessionStorage.getItem('gu_token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  };

  if (resource === 'empresas') {
    return fetch(API_BASE + '/api/empresas', {
      method: 'POST',
      headers,
      body: JSON.stringify({ empresas: S.empresas })
    }).then(res => {
      if (!res.ok) throw new Error('Error al guardar empresas.');
      return res.json();
    });
  } else if (resource === 'centrosCosto') {
    return fetch(API_BASE + '/api/centros_costo', {
      method: 'POST',
      headers,
      body: JSON.stringify({ centrosCosto: S.centrosCosto })
    }).then(res => {
      if (!res.ok) throw new Error('Error al guardar centros de costo.');
      return res.json();
    });
  } else if (resource === 'insumos') {
    return fetch(API_BASE + '/api/insumos', {
      method: 'POST',
      headers,
      body: JSON.stringify({ insumos: S.insumos })
    }).then(res => {
      if (!res.ok) throw new Error('Error al guardar insumos.');
      return res.json();
    });
  } else if (resource === 'traspasos') {
    return fetch(API_BASE + '/api/traspasos', {
      method: 'POST',
      headers,
      body: JSON.stringify({ traspasos: S.traspasos })
    }).then(res => {
      if (!res.ok) throw new Error('Error al guardar traspasos.');
      return res.json();
    });
  } else {
    return fetch(API_BASE + '/api/state', {
      method: 'POST',
      headers,
      body: JSON.stringify(S)
    })
    .then(res => {
      if (!res.ok) throw new Error('Error al guardar el estado en el servidor.');
      return res.json();
    })
    .catch(err => {
      console.error('Error al guardar el estado en el servidor:', err);
    });
  }
}

// ── Folio generator ──────────────────────────────────
function genFolio(tipo) {
  const key = (tipo === 'PRS' || tipo === 'TOB' || tipo === 'DEV' || tipo === 'GAR') ? tipo : 'PRS';
  S.folios[key] = (S.folios[key] || 0) + 1;
  const year = new Date().getFullYear();
  return `TRP-${key}-${year}-${String(S.folios[key]).padStart(4, '0')}`;
}

// ── Date helpers ─────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

function now() {
  return new Date().toISOString();
}

// ── Lookup helpers ───────────────────────────────────
function getEmpresa(id) {
  return S.empresas.find(e => e.id === id) || { nombre: '—' };
}

function getCC(id) {
  return S.centrosCosto.find(c => c.id === id) || { nombre: '—' };
}

function getInsumo(id) {
  return S.insumos.find(i => i.id === id) || { nombre: '—', unidad: '—', clave: '—' };
}

// Returns the Desarrollo name linked to a CC's empresaId
function getDesarrollo(empresaId) {
  if (S.desarrollos) {
    const dev = S.desarrollos.find(d => d.id === empresaId);
    if (dev) return dev;
  }
  // Fallback to empresa name
  return getEmpresa(empresaId);
}

// ── Filtros por empresa y centro de costo (multi-tenant) ───────────────

/**
 * Filtra una lista de traspasos para que el usuario solo vea
 * los que involucran sus centros de costo asignados.
 * Admins/Residentes (cc_ids === null) ven todo.
 */
function filtrarPorEmpresa(lista) {
  const ccIds = getUserCcIds();
  if (ccIds === null) return lista; // admin/residente: sin filtro
  if (ccIds.length === 0) {
    // Fallback: filtrar por empresa si no tiene cc_ids
    const empId = getUserEmpresaId();
    if (!empId) return lista;
    const userEmps = String(empId).split(',');
    return lista.filter(t => {
      const ccOri = S.centrosCosto.find(c => c.id === t.ccOrigen);
      const ccDes = S.centrosCosto.find(c => c.id === t.ccDestino);
      const oriEmp = ccOri ? ccOri.empresaId : (t.empresaOrigen || null);
      const desEmp = ccDes ? ccDes.empresaId : (t.empresaDestino || null);
      return userEmps.includes(oriEmp) || userEmps.includes(desEmp);
    });
  }
  const user = getUser();
  return lista.filter(t => {
    if (ccIds.includes(t.ccOrigen) || ccIds.includes(t.ccDestino)) return true;
    if (user && t.solicitante === user.nombre) return true;
    return false;
  });
}

/**
 * Devuelve los centros de costo del usuario (los que tiene asignados).
 * Para ORIGEN en nueva solicitud. Admins/Residentes ven todos.
 */
function ccsPorEmpresa() {
  const ccIds = getUserCcIds();
  if (ccIds === null) return S.centrosCosto; // admin/residente: todos
  if (ccIds.length === 0) {
    // Fallback: filtrar por empresa
    const empId = getUserEmpresaId();
    if (!empId) return S.centrosCosto;
    const userEmps = String(empId).split(',');
    return S.centrosCosto.filter(c => userEmps.includes(String(c.empresaId)));
  }
  return S.centrosCosto.filter(c => ccIds.includes(String(c.id)));
}

/**
 * Devuelve TODOS los centros de costo (para DESTINO en nueva solicitud).
 */
function ccsDestinoAll() {
  return S.centrosCosto;
}

// ── Badge helpers (shared across views) ─────────────
function tipoBadge(tipo) {
  if (tipo === 'DEV') return '<span class="badge" style="background:#f9e8e8;color:#c0392b;border:1px solid rgba(192,57,43,.25)">Devolución</span>';
  if (tipo === 'GAR') return '<span class="badge badge-loan" style="background:#e8f4f8;color:#0369a1;border:1px solid rgba(3,105,161,.25)">Garantía</span>';
  return tipo === 'PRS'
    ? '<span class="badge badge-loan">Préstamo</span>'
    : '<span class="badge badge-obra">Término de Obra</span>';
}

function statusBadge(s) {
  const map    = { pendiente:'badge-pending', pre_autorizado:'badge-preauthorized', autorizado:'badge-authorized', recibido:'badge-received', rechazado:'badge-rejected', borrador:'badge-draft', devuelto_parcial:'badge-partial', devuelto_total:'badge-returned' };
  const labels = { pendiente:'Pend. Residente', pre_autorizado:'Pend. Control', autorizado:'Autorizado', recibido:'Recibido', rechazado:'Rechazado', borrador:'Borrador', devuelto_parcial:'Dev. Parcial', devuelto_total:'Dev. Total' };
  return `<span class="badge ${map[s] || ''}">${labels[s] || s}</span>`;
}
