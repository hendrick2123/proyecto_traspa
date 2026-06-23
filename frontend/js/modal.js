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
