const fs = require('fs');
(async () => {
  try {
    const env = fs.readFileSync('.env', 'utf8');
    const m = env.match(/^ANTHROPIC_API_KEY=(.*)$/m);
    if (!m) { console.error('NO_KEY_IN_ENV'); process.exit(2); }
    const key = m[1].trim();

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        messages: [{ role: 'user', content: 'Merhaba' }]
      })
    });

    console.log('STATUS', res.status);
    const txt = await res.text();
    console.log(txt);
  } catch (err) {
    console.error('ERROR', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
