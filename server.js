const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 8090;
const FREE_MODE = process.env.FREE_MODE === 'true';
const DEFAULT_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5';

app.use(express.json({ limit: '256kb' }));

// Serve static files from project root
app.use(express.static(path.join(__dirname)));

function jsonResponse(res, body, status = 200) {
  res.status(status).json(body);
}

function findFirstString(obj) {
  if (typeof obj === 'string') return obj;
  if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      const found = findFirstString(v);
      if (found) return found;
    }
  }
  return null;
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function getFreeFallbackReply(messages) {
  const last = messages && messages.length ? messages[messages.length - 1] : null;
  const text = (last && last.content ? String(last.content) : '').trim().toLowerCase();

  if (!text) {
    return 'Merhaba! Caras Partner olarak Meta reklam kampanyalarında destek sağlıyoruz. Daha detaylı bilgi için WhatsApp +90 532 455 6114 üzerinden bize yazabilirsiniz.';
  }

  if (includesAny(text, ['merhaba', 'selam', 'iyi günler', 'nasılsın', 'selamlar'])) {
    return 'Merhaba! Caras Partner olarak Meta reklam kampanyalarınızda destek sağlıyoruz. Daha detaylı bilgi için WhatsApp +90 532 455 6114 üzerinden yazabilirsiniz.';
  }

  if (includesAny(text, ['fiyat', 'ücret', 'paket', 'maliyet', 'bedel', 'tutar'])) {
    return 'Caras Partner fiyatları KDV hariç olarak ilerliyor: Aylık paket 15.000₺/ay, 3 Aylık paket 13.500₺/ay, Kurumsal paketler ise özel fiyatlandırmayla sunuluyor. Reklam bütçesi ayrı ödenir. Daha detaylı bilgi için WhatsApp +90 532 455 6114 üzerinden yazabilirsiniz.';
  }

  if (includesAny(text, ['hizmet', 'ne yapıyorsunuz', 'nasıl çalışıyorsunuz', 'neler yapıyorsunuz', 'ne sunuyorsunuz'])) {
    return 'Caras Partner; Meta ve Google reklamları, SEO, web sitesi/yazılım ve sosyal medya yönetimi olmak üzere dijital pazarlamanın tüm alanlarında hizmet verir. Daha fazla bilgi için WhatsApp +90 532 455 6114 üzerinden bize yazabilirsiniz.';
  }

  if (includesAny(text, ['instagram', 'facebook', 'meta', 'reklam', 'ads', 'hedef kitle', 'kitle', 'dönüşüm'])) {
    return 'Meta reklamlarında doğru hedef kitle ve yaratıcı materyal önemlidir. Caras Partner olarak reklam kurulum, optimizasyon ve raporlama yapıyoruz. Daha detaylı destek için WhatsApp +90 532 455 6114 üzerinden yazabilirsiniz.';
  }

  if (includesAny(text, ['whatsapp', 'zoom', 'görüşme', 'toplantı', 'randevu'])) {
    return 'Ücretsiz Zoom görüşmesi ve WhatsApp desteği için +90 532 455 6114 üzerinden bize ulaşabilirsiniz.';
  }

  if (includesAny(text, ['başlangıç', 'nasıl', 'ne yapmalıyım', 'ne önerirsiniz', 'yönlendirme'])) {
    return 'Meta reklamlarına başlamak için hedef kitlenizi ve bütçenizi netleştirmek önemlidir. Caras Partner olarak bu süreci yönetiyoruz; lütfen WhatsApp +90 532 455 6114 üzerinden bize yazın.';
  }

  return 'Bu soruya site içeriği üzerinden net yanıt veremiyorum. Lütfen WhatsApp +90 532 455 6114 üzerinden ekibimizle iletişime geçin.';
}

function maskKey(k) {
  if (!k) return '<not set>';
  if (k.length <= 8) return k.replace(/./g, '*');
  return k.slice(0,4) + '...' + k.slice(-4) + ` (len=${k.length})`;
}

app.options('/api/chat', (req, res) => {
  res.set({ 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
  res.sendStatus(204);
});

app.post('/api/chat', async (req, res) => {
  const payload = req.body;
  if (!payload || !Array.isArray(payload.messages) || payload.messages.length === 0) {
    return jsonResponse(res, { error: 'messages array is required' }, 400);
  }
  if (payload.messages.length > 20) {
    return jsonResponse(res, { error: 'Too many messages' }, 400);
  }
  for (const m of payload.messages) {
    if (!m || typeof m.content !== 'string' || m.content.length === 0 || m.content.length > 4000) {
      return jsonResponse(res, { error: 'Invalid message' }, 400);
    }
  }

  const API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!API_KEY || FREE_MODE) {
    if (FREE_MODE) {
      console.log('FREE_MODE aktif, yerel asistan kullanılıyor.');
    } else {
      console.log('Anthropic API anahtarı yok, yerel asistan kullanılıyor.');
    }
    const fallback = getFreeFallbackReply(payload.messages);
    return jsonResponse(res, {
      reply: fallback,
      fallback: true,
      mode: 'free'
    }, 200);
  }

  console.log('Request /api/chat — Anthropic key:', maskKey(API_KEY), ' model:', DEFAULT_MODEL);

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        max_tokens: 400,
        messages: payload.messages
      })
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('Anthropic error', resp.status, text);
      const fallback = getFreeFallbackReply(payload.messages);
      return jsonResponse(res, {
        reply: fallback,
        fallback: true,
        reason: resp.status === 401 ? 'invalid_api_key' : resp.status === 400 ? 'low_balance_or_bad_request' : 'anthropic_error',
        details: text
      }, 200);
    }

    const data = await resp.json();
    if (data.error) {
      console.error('Anthropic returned error payload:', data);
      const fallback = getFreeFallbackReply(payload.messages);
      return jsonResponse(res, {
        reply: fallback,
        fallback: true,
        reason: 'anthropic_error_payload',
        details: data.error
      }, 200);
    }

    const reply = findFirstString(data) || 'Üzgünüm, şu anda yanıt veremiyorum.';
    return jsonResponse(res, { reply, raw: data });
  } catch (err) {
    console.error('Proxy error', err);
    return jsonResponse(res, { error: 'Sunucu hatası', details: err.message || String(err) }, 500);
  }
});

const server = app.listen(PORT, () => {
  console.log(`Dev server running at http://localhost:${PORT}/`);
  console.log('Loaded ANTHROPIC_API_KEY (masked):', maskKey(process.env.ANTHROPIC_API_KEY));
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Kapatılan başka bir sunucu olabilir veya farklı bir port kullanın.`);
    process.exit(1);
  }
  throw err;
});
