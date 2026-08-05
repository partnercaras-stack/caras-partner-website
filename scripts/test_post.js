const http = require('http');

async function main() {
  const data = JSON.stringify({ messages: [{ role: 'user', content: 'Merhaba' }] });

  const options = {
    hostname: 'localhost',
    port: 8090,
    path: '/api/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log('STATUS', res.statusCode);
      console.log('BODY', body);
    });
  });

  req.on('error', (e) => console.error('REQUEST ERROR', e));
  req.write(data);
  req.end();
}

main();
