// Registra la ruta fallida en el panel privado. Solo lo carga el 404.html que
// sirve server.js: scripts/build-static.mjs quita este script de la versión
// estática, donde /api/log-404 no existe.
(() => {
  if (location.protocol === 'file:') return;

  const payload = {
    route: `${location.pathname}${location.search}${location.hash}`,
    referrer: document.referrer || '',
    language: navigator.language || '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    screen: `${screen.width}x${screen.height}`
  };

  fetch('/api/log-404', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'same-origin',
    keepalive: true
  }).catch(() => {});
})();
