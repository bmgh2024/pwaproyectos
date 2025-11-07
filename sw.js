// Registrar Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('SW registrado:', reg.scope))
      .catch(err => console.warn('SW fallo:', err));
  });
}

// Manejo del "beforeinstallprompt" para mostrar botón de instalar
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('btnInstall');
  if (btn) btn.hidden = false;
});

// Click en el botón para lanzar el prompt
document.addEventListener('click', async (e) => {
  if (e.target && e.target.id === 'btnInstall') {
    if (!deferredPrompt) return;
    e.target.disabled = true;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('Instalación:', outcome);
    deferredPrompt = null;
    e.target.hidden = true;
  }
});

// Evento cuando la app fue instalada
window.addEventListener('appinstalled', () => {
  console.log('PWA instalada');
  const btn = document.getElementById('btnInstall');
  if (btn) btn.hidden = true;
});