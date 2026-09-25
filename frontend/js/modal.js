// =====================================================
// MODAL
// =====================================================

function openModal(title, body, footer = '') {
  document.getElementById('modal-title').textContent  = title;
  document.getElementById('modal-body').innerHTML     = body;
  document.getElementById('modal-footer').innerHTML   = footer;
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

// Close on backdrop click
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

function verFotoInsumo(url, titulo) {
  if (!url) return;
  openModal(
    titulo || 'Fotografía del Insumo',
    `<div style="text-align:center;padding:10px">
       <img src="${url}" style="max-width:100%;max-height:70vh;object-fit:contain;border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,0.15)">
     </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>
     <button class="btn btn-primary" onclick="window.open('${url}', '_blank')">Abrir en pestaña nueva</button>`
  );
}
