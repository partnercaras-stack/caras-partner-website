(async () => {
  try {
    const res = await fetch('http://localhost:8090/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Merhaba' }] })
    });
    console.log('LOCAL STATUS', res.status);
    const txt = await res.text();
    console.log(txt);
  } catch (err) {
    console.error('ERROR', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
