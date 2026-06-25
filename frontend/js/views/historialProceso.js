// =====================================================
// VIEW - Historial de Proceso (Timeline)
// =====================================================

function renderHistorialProceso() {
  const content = document.getElementById('content');
  
  // 1. Extraer todos los eventos de todos los traspasos
  let events = [];
  
  S.traspasos.forEach(t => {
    // Resumen de items para mostrar en la descripción
    const itemCount = t.items.length;
    const itemsResumen = t.items.map(i => {
      const ins = getInsumo(i.insumoId);
      return `${i.cantidad} ${ins ? ins.nombre : 'Insumo Desconocido'}`;
    }).join(', ');
    
    // Función auxiliar para agregar evento si la fecha existe
    const addEvent = (dateStr, title, actor, colorClass) => {
      if (!dateStr) return;
      events.push({
        date: new Date(dateStr),
        dateStr: dateStr,
        title: title,
        actor: actor || 'Sistema',
        folio: t.folio,
        id: t.id,
        itemsStr: itemsResumen,
        colorClass: colorClass
      });
    };

    // Agregar los distintos eventos cronológicos del traspaso
    addEvent(t.fechaSolicitud, 'Solicitud Creada', t.solicitante, ''); // Verde por defecto
    addEvent(t.fechaAutorizacion, 'Autorización 1 (Residente)', t.autorizador, 'bg-orange');
    addEvent(t.fechaAutorizacion2, 'Autorización 2 (Control de Obra)', t.autorizador2, 'bg-blue');
    addEvent(t.fechaRecepcion, 'Material Recibido', t.receptor, 'bg-purple');
    
    // (Opcional) Si hubiera eventos de devolución
    // addEvent(t.fechaDevolucion, 'Devolución', t.quienDevolvio, 'bg-red');
  });

  // 2. Ordenar de más reciente a más antiguo
  events.sort((a, b) => b.date - a.date);

  // 3. Renderizar el HTML
  if (events.length === 0) {
    content.innerHTML = `
      <div class="empty-state">
        <div style="font-size:40px;margin-bottom:12px">⏳</div>
        <p>No hay eventos registrados</p>
        <span>Aún no se han creado solicitudes o movimientos de traspasos.</span>
      </div>`;
    return;
  }

  let html = `
    <div style="max-width:800px;margin:0 auto;margin-bottom:20px;">
      <h2 style="font-size:18px;font-weight:800;color:var(--black);margin-bottom:6px">Historial de Proceso</h2>
      <p style="font-size:13px;color:#666">Línea de tiempo con todos los movimientos y autorizaciones registrados paso a paso.</p>
    </div>
    <div class="timeline">
  `;

  events.forEach(ev => {
    // Format date properly
    const d = ev.date;
    const dateFormatted = isNaN(d.getTime()) ? ev.dateStr : d.toLocaleString('es-MX', { 
      day: '2-digit', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });

    html += `
      <div class="timeline-item ${ev.colorClass}">
        <div class="timeline-content shadow-sm">
          <div class="timeline-date">${dateFormatted}</div>
          <div class="timeline-title">
            ${ev.title}
            <a href="#" class="timeline-folio" onclick="verDetalle('${ev.id}'); return false;">${ev.folio}</a>
          </div>
          <div class="timeline-desc">
            <strong>Usuario:</strong> ${ev.actor}<br>
            <strong>Material:</strong> ${ev.itemsStr}
          </div>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  content.innerHTML = html;
}
