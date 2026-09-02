(() => {
  if (location.protocol === 'file:' || location.hostname === 'j0nasm.github.io') return;

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
