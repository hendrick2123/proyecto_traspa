// =====================================================
// VIEW – Dashboard
// =====================================================

function renderDashboard() {
  const traspaFiltrados = filtrarPorEmpresa(S.traspasos || []);
  const total      = traspaFiltrados.length;
  
  const user = getUser();
  let pend = 0;
  if (user) {
    if (user.rol === 'residente') {
      pend = traspaFiltrados.filter(t => t.status === 'pendiente').length;
    } else if (user.rol === 'control_obra') {
      pend = traspaFiltrados.filter(t => t.status === 'pre_autorizado').length;
    } else {
      pend = traspaFiltrados.filter(t => t.status === 'pendiente' || t.status === 'pre_autorizado').length;
    }
  } else {
    pend = traspaFiltrados.filter(t => t.status === 'pendiente' || t.status === 'pre_autorizado').length;
  }

  const auth       = traspaFiltrados.filter(t => t.status === 'autorizado').length;
  const recibidos  = traspaFiltrados.filter(t => t.status === 'recibido').length;
  const rechazados = traspaFiltrados.filter(t => t.status === 'rechazado').length;
  const prestamos  = traspaFiltrados.filter(t => t.tipo === 'PRS').length;
  const obra       = traspaFiltrados.filter(t => t.tipo === 'TOB').length;
  const garantias  = traspaFiltrados.filter(t => t.tipo === 'GAR').length;

  const recent = [...traspaFiltrados]
    .sort((a, b) => b.fechaSolicitud.localeCompare(a.fechaSolicitud))
    .slice(0, 8);

  const analytics = buildAnalytics(traspaFiltrados);

  document.getElementById('content').innerHTML = `
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">Total Traspasos</div>
      <div class="stat-value">${total}</div>
      <div class="stat-sub">Todos los movimientos</div>
    </div>
    <div class="stat-card orange">
      <div class="stat-label">Pendientes Auth.</div>
      <div class="stat-value">${pend}</div>
      <div class="stat-sub">Esperando autorización</div>
    </div>
    <div class="stat-card blue">
      <div class="stat-label">Por Recibir</div>
      <div class="stat-value">${auth}</div>
      <div class="stat-sub">Autorizados en tránsito</div>
    </div>
    <div class="stat-card green">
      <div class="stat-label">Completados</div>
      <div class="stat-value">${recibidos}</div>
      <div class="stat-sub">Recibidos correctamente</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
    <div class="card">
      <div class="card-header"><h3>Por Tipo de Traspaso</h3></div>
      <div class="card-body">
        <div style="display:flex;gap:20px;align-items:center;padding:8px 0">
          <span class="badge badge-loan">Préstamo</span>
          <span style="font-size:24px;font-weight:800">${prestamos}</span>
          <span style="color:#aaa;font-size:12px">movimientos</span>
        </div>
        <div style="display:flex;gap:20px;align-items:center;padding:8px 0">
          <span class="badge badge-obra">Término de Obra</span>
          <span style="font-size:24px;font-weight:800">${obra}</span>
          <span style="color:#aaa;font-size:12px">movimientos</span>
        </div>
        <div style="display:flex;gap:20px;align-items:center;padding:8px 0">
          <span class="badge badge-loan" style="background:#e8f4f8;color:#0369a1;border:1px solid rgba(3,105,161,.25)">Garantía</span>
          <span style="font-size:24px;font-weight:800">${garantias}</span>
          <span style="color:#aaa;font-size:12px">movimientos</span>
        </div>
        ${rechazados > 0 ? `
        <div style="display:flex;gap:20px;align-items:center;padding:8px 0">
          <span class="badge badge-rejected">Rechazados</span>
          <span style="font-size:24px;font-weight:800;color:var(--red)">${rechazados}</span>
        </div>` : ''}
      </div>
    </div>

    <!-- ── ANALYTICS: QUIÉN SACA MÁS MATERIAL ── -->
    <div class="card">
      <div class="card-header" style="border-bottom:2px solid rgba(34,197,94,.2)">
        <h3 style="display:flex;align-items:center;gap:8px">
          <span style="width:28px;height:28px;background:rgba(34,197,94,.12);border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:14px">📤</span>
          Quién Saca Más Material
        </h3>
      </div>
      <div class="card-body" style="padding:12px 16px">
        ${analytics.topSolicitantes.length === 0
          ? '<div style="color:#aaa;text-align:center;padding:16px;font-size:13px">Sin datos suficientes</div>'
          : analytics.topSolicitantes.map((s, i) => `
            <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #f1f5f9">
              <span style="min-width:22px;height:22px;background:${i===0?'#f59e0b':i===1?'#94a3b8':'#cbd5e1'};color:#fff;border-radius:50%;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center">${i+1}</span>
              <span style="flex:1;font-size:12px;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${s.nombre}">${s.nombre}</span>
              <span style="font-size:11px;color:#64748b;min-width:60px;text-align:right">${s.traspasos} traspasos</span>
              <span style="font-size:11px;font-weight:700;color:#16a34a;min-width:70px;text-align:right">${s.unidades} uds</span>
            </div>`).join('')
        }
      </div>
    </div>
  </div>

  <!-- ── ANALYTICS ROW 2 ── -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">

    <!-- TOP 5 INSUMOS -->
    <div class="card">
      <div class="card-header" style="border-bottom:2px solid rgba(59,130,246,.2)">
        <h3 style="display:flex;align-items:center;gap:8px">
          <span style="width:28px;height:28px;background:rgba(59,130,246,.12);border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:14px">📦</span>
          Top 5 Insumos con Mayor Flujo
        </h3>
      </div>
      <div class="card-body" style="padding:10px 16px">
        ${analytics.topInsumos.length === 0
          ? '<div style="color:#aaa;text-align:center;padding:16px;font-size:13px">Sin datos suficientes</div>'
          : `<table style="width:100%;border-collapse:collapse;font-size:11px">
              <thead>
                <tr style="color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.5px">
                  <th style="text-align:left;padding:4px 0;width:24px">#</th>
                  <th style="text-align:left;padding:4px 4px">Insumo</th>
                  <th style="text-align:right;padding:4px 4px">Cant.</th>
                  <th style="text-align:right;padding:4px 0">Desarrollo</th>
                </tr>
              </thead>
              <tbody>
                ${analytics.topInsumos.map((ins, i) => `
                  <tr style="border-bottom:1px solid #f1f5f9">
                    <td style="padding:6px 0"><span style="width:18px;height:18px;background:${i===0?'#f59e0b':i===1?'#94a3b8':i===2?'#b45309':'#e2e8f0'};color:${i<3?'#fff':'#64748b'};border-radius:50%;font-size:9px;font-weight:800;display:inline-flex;align-items:center;justify-content:center">${i+1}</span></td>
                    <td style="padding:6px 4px;font-weight:600;color:#1e293b;max-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${ins.nombre}">${ins.nombre}</td>
                    <td style="padding:6px 4px;text-align:right;font-weight:700;color:#2563eb">${ins.cantidad}</td>
                    <td style="padding:6px 0;text-align:right;color:#64748b;max-width:90px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${ins.desarrollo}">${ins.desarrollo}</td>
                  </tr>`).join('')}
              </tbody>
            </table>`
        }
      </div>
    </div>

    <!-- EMPRESA QUE MÁS RECIBE VS ENVÍA -->
    <div class="card">
      <div class="card-header" style="border-bottom:2px solid rgba(168,85,247,.2)">
        <h3 style="display:flex;align-items:center;gap:8px">
          <span style="width:28px;height:28px;background:rgba(168,85,247,.12);border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:14px">🏢</span>
          Flujo por Empresa
        </h3>
      </div>
      <div class="card-body" style="padding:12px 16px">
        <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Más Solicitudes Recibidas (Empresa Destino)</div>
        ${analytics.topReceptoras.length === 0
          ? '<div style="color:#aaa;font-size:12px;margin-bottom:12px">Sin datos</div>'
          : analytics.topReceptoras.map((e, i) => `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
              <span style="min-width:18px;height:18px;background:rgba(168,85,247,.15);color:#7c3aed;border-radius:50%;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center">${i+1}</span>
              <div style="flex:1">
                <div style="font-size:11px;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${e.nombre}">${e.nombre}</div>
                <div style="height:4px;background:#f1f5f9;border-radius:2px;margin-top:3px">
                  <div style="height:4px;background:linear-gradient(90deg,#a855f7,#7c3aed);border-radius:2px;width:${Math.round(e.count/analytics.topReceptoras[0].count*100)}%"></div>
                </div>
              </div>
              <span style="font-size:11px;font-weight:700;color:#7c3aed;min-width:28px;text-align:right">${e.count}</span>
            </div>`).join('')
        }
        <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin:12px 0 8px">Más Material Enviado (Empresa Origen)</div>
        ${analytics.topEmisoras.length === 0
          ? '<div style="color:#aaa;font-size:12px">Sin datos</div>'
          : analytics.topEmisoras.map((e, i) => `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
              <span style="min-width:18px;height:18px;background:rgba(16,185,129,.12);color:#059669;border-radius:50%;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center">${i+1}</span>
              <div style="flex:1">
                <div style="font-size:11px;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${e.nombre}">${e.nombre}</div>
                <div style="height:4px;background:#f1f5f9;border-radius:2px;margin-top:3px">
                  <div style="height:4px;background:linear-gradient(90deg,#34d399,#059669);border-radius:2px;width:${Math.round(e.count/analytics.topEmisoras[0].count*100)}%"></div>
                </div>
              </div>
              <span style="font-size:11px;font-weight:700;color:#059669;min-width:28px;text-align:right">${e.count}</span>
            </div>`).join('')
        }
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-header"><h3>Movimientos Recientes</h3></div>
    <div class="table-wrap">
      ${recent.length === 0
        ? '<div class="alert-empty">No hay movimientos registrados aún</div>'
        : `<table>
            <thead>
              <tr><th>Folio</th><th>Tipo</th><th>Empresa Origen</th><th>CC Origen</th><th>Empresa Destino</th><th>CC Destino</th><th>Fecha</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              ${recent.map(t => `
              <tr>
                <td><strong>${t.folio}</strong></td>
                <td>${tipoBadge(t.tipo)}</td>
                <td class="text-sm">${getEmpresa(t.empresaOrigen).nombre.split(' ')[0] || '—'}</td>
                <td class="text-sm">${getCC(t.ccOrigen).nombre}</td>
                <td class="text-sm">${getEmpresa(t.empresaDestino).nombre.split(' ')[0] || '—'}</td>
                <td class="text-sm">${getCC(t.ccDestino).nombre}</td>
                <td class="text-sm">${fmtDate(t.fechaSolicitud)}</td>
                <td>${statusBadge(t.status)}</td>
                <td><button class="btn btn-secondary btn-sm" onclick="verDetalle('${t.id}')">Ver</button></td>
              </tr>`).join('')}
            </tbody>
          </table>`
      }
    </div>
  </div>`;
}

// ── Analytics helpers ──────────────────────────────
function buildAnalytics(lista) {
  const solMap   = {};  // solicitante → {traspasos, unidades}
  const insMap   = {};  // insumoId   → {nombre, cantidad, desarrollos{}}
  const recMap   = {};  // empresaDestino → count
  const emiMap   = {};  // empresaOrigen  → count

  lista.forEach(t => {
    // ── Quién saca más (solicitante)
    const sol = t.solicitante || 'Sin nombre';
    if (!solMap[sol]) solMap[sol] = { nombre: sol, traspasos: 0, unidades: 0 };
    solMap[sol].traspasos++;
    (t.items || []).forEach(it => { solMap[sol].unidades += (parseFloat(it.cantidad) || 0); });

    // ── Top insumos
    (t.items || []).forEach(it => {
      const id = it.insumoId || it.nombre || '?';
      const nombre = it.nombre || (getInsumo(id).nombre) || id;
      const cant   = parseFloat(it.cantidad) || 0;
      // Desarrollo asociado al CC destino
      const ccDes = S.centrosCosto ? S.centrosCosto.find(c => c.id === t.ccDestino) : null;
      const devId  = ccDes ? ccDes.empresaId : null;
      const dev    = devId && S.desarrollos ? S.desarrollos.find(d => d.id === devId) : null;
      const devNombre = dev ? dev.nombre : (getEmpresa(t.empresaDestino).nombre || '—');
      if (!insMap[id]) insMap[id] = { nombre, cantidad: 0, desarrollos: {} };
      insMap[id].cantidad += cant;
      if (devNombre) insMap[id].desarrollos[devNombre] = (insMap[id].desarrollos[devNombre] || 0) + cant;
    });

    // ── Empresa que más recibe (destino)
    const empDes = getEmpresa(t.empresaDestino).nombre || t.empresaDestino || '—';
    if (empDes !== '—') { recMap[empDes] = (recMap[empDes] || 0) + 1; }

    // ── Empresa que más envía (origen)
    const empOri = getEmpresa(t.empresaOrigen).nombre || t.empresaOrigen || '—';
    if (empOri !== '—') { emiMap[empOri] = (emiMap[empOri] || 0) + 1; }
  });

  // Top solicitantes ordenados por unidades desc
  const topSolicitantes = Object.values(solMap)
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, 5);

  // Top 5 insumos — desarrollo = el que más aparece
  const topInsumos = Object.values(insMap)
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5)
    .map(ins => {
      const topDev = Object.entries(ins.desarrollos)
        .sort((a, b) => b[1] - a[1])[0];
      return { ...ins, desarrollo: topDev ? topDev[0] : '—', cantidad: Math.round(ins.cantidad) };
    });

  const topReceptoras = Object.entries(recMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([nombre, count]) => ({ nombre, count }));

  const topEmisoras = Object.entries(emiMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([nombre, count]) => ({ nombre, count }));

  return { topSolicitantes, topInsumos, topReceptoras, topEmisoras };
}
