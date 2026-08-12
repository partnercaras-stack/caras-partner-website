// The service pillars used to group the /hizmetler hub and the "Hizmetler"
// mega-menu. Consolidated from 8 to 5 groups per client feedback — several
// smaller categories (Sosyal Medya, Dijital PR, Influencer Marketing; and AI
// & Otomasyon into Özel Yazılım & Mobil Uygulama) read as too fragmented as
// standalone top-level groups. Each service in content/services/*.js
// references one of these groups by slug.
module.exports = [
  {
    slug: 'reklam',
    name: 'Dijital Reklamcılık',
    short: 'Meta ve Google\'da ölçülebilir, dönüşüm odaklı reklam yönetimi.'
  },
  {
    slug: 'seo-google',
    name: 'SEO & Google',
    short: 'Organik görünürlük, yerel arama ve Google İşletme Profili.'
  },
  {
    slug: 'web-tasarim',
    name: 'Web Sitesi & Geliştirme',
    short: 'Güven kuran, dönüşüm odaklı, SEO uyumlu web siteleri.'
  },
  {
    slug: 'yazilim',
    name: 'Yazılım & Yapay Zekâ Çözümleri',
    short: 'Mobil uygulama, özel yazılım ve yapay zekâ destekli otomasyon çözümleri.'
  },
  {
    slug: 'sosyal-buyume',
    name: 'Sosyal Medya & Marka İletişimi',
    short: 'Sosyal medya yönetimi, influencer iş birlikleri ve dijital PR.'
  }
];
