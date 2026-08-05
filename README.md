# Caras Partner — Lokal Geliştirme

Bu repo statik site + Cloudflare Pages Functions (fonksiyonlar) içerir. Yerelde chat widget'i test etmek için basit bir Node dev sunucusu eklendi.

Özet değişiklikler:
- `server.js` — statik dosyaları sunar ve `/api/chat` isteğini Anthropic API'ye proxy eder.
- `package.json` — `start` script eklendi ve gerekli bağımlılıklar listelendi.
- `.env.example` güncellendi: `ANTHROPIC_API_KEY`, `CLAUDE_MODEL` eklendi.

Gereksinimler
- Node.js (18+ önerilir)

Hızlı başlatma (yerel)
1. Bağımlılıkları yükleyin:

```bash
npm install
```

2. Ortam değişkenlerini ayarlayın — kopyalayın ve doldurun:

```bash
cp .env.example .env
# sonra .env dosyasını düzenleyip ANTHROPIC_API_KEY ve diğer alanları doldurun
```

3. Sunucuyu başlatın:

```bash
npm start
```

4. Tarayıcıda `http://localhost:8090/` açın. Chat widget frontend `/api/chat` yoluna POST gönderdiğinde `server.js` Anthropic'e proxy eder.

Notlar ve öneriler
- Üretimde Cloudflare Pages Functions kullanıyorsanız `functions/api/chat.js` dosyasını deploy edin ve `AN­THROPIC_API_KEY` ile `CLAUDE_MODEL` değişkenlerini Cloudflare ortamına ekleyin.
- `server.js` yalnızca geliştirme/yerel test içindir; üretim için Cloudflare veya benzeri bir platformda fonksiyonları çalıştırın.
- `functions/api/chat.js` içindeki Anthropic çağrıları yanıt formatına göre daha sıkı kontrol ve hata loglaması eklenebilir.

Eğer isterseniz ben bu sunucuyu `nodemon` veya daha gelişmiş dev scriptlerle genişletebilirim ya da `wrangler.toml` ve deploy adımlarını hazırlayabilirim.
 
Cloudflare Pages deploy (şablon)
1. `wrangler.toml` içindeki `account_id` alanını doldurun ve Cloudflare'de Pages projesi oluşturun veya mevcut projeyi kullanın.
2. GitHub Actions workflow örneği eklendi: `.github/workflows/deploy-pages.yml`. Bu workflow `CF_API_TOKEN` adlı bir GitHub secret bekler. Oluşturduktan sonra repo -> Settings -> Secrets > Actions altında `CF_API_TOKEN` ekleyin.
3. Alternatif olarak yerelde `wrangler` ile test etmek isterseniz:

```bash
npm i -g wrangler
# oturum açma / token ayarlama: wrangler login veya CF_API_TOKEN ile
wrangler pages publish . --project-name caras-partner-website
```

Gizli anahtarlar ve ortam değişkenleri
- Cloudflare: `ANTHROPIC_API_KEY` ve diğer değişkenleri Pages dashboard veya `wrangler secret put` ile ekleyin.
- GitHub Actions: `CF_API_TOKEN` secret olarak ekleyin.
