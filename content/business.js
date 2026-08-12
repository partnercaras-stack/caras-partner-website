// Single source of truth for Caras Partner's real, verified NAP/brand facts.
// Every value here is copied verbatim from the Organization JSON-LD that has
// been live in index.html since before this file existed — nothing here is
// invented. Schema, footer, and contact mentions across the whole site
// should import from this file instead of re-typing these facts.
module.exports = {
  name: 'Caras Partner',
  legalName: 'Caras Partner',
  url: 'https://caraspartner.com',
  logo: 'https://caraspartner.com/assets/logo-icon.png',
  logoFull: 'https://caraspartner.com/assets/logo-full.png',
  email: 'partner.caras@gmail.com',
  telephone: '+905324556114',
  telephoneDisplay: '+90 532 455 6114',
  whatsapp: 'https://wa.me/905324556114',
  address: {
    streetAddress: 'Tabaklar, İzzet Baysal Cd. Güler2 İş Hanı',
    addressLocality: 'Bolu',
    addressRegion: 'Bolu',
    postalCode: '14100',
    addressCountry: 'TR'
  },
  addressDisplay: 'Tabaklar, İzzet Baysal Cd. Güler2 İş Hanı, 14100 Merkez/Bolu',
  // The real Google Maps listing URL for Caras Partner, provided directly by
  // the client — used verbatim rather than a reconstructed search link so it
  // points at the actual verified Business Profile pin, not just the address text.
  mapsUrl: 'https://www.google.com/maps/dir//Caras+Partner+%7C+Dijital+Reklam+Ajans%C4%B1,+Tabaklar,+%C4%B0zzet+Baysal+Cd.+G%C3%BCler2+%C4%B0%C5%9F+Han%C4%B1,+14100+Bolu+Merkez%2FBolu/data=!4m6!4m5!1m1!4e2!1m2!1m1!1s0x409d3f3187a5bc9f:0xc8f31d5a3ebb548?sa=X&ved=1t:57443&ictx=111',
  sameAs: ['https://www.instagram.com/caraspartner/', 'https://www.facebook.com/caraspartner/'],
  areaServed: 'TR',
  // Real weekly hours, confirmed directly from the client's verified Google
  // Business Profile (screenshot, 2026-08-12) — Monday–Saturday 10:00–18:00,
  // closed Sunday. Used for both the visible contact page and schema.
  openingHours: {
    display: [
      { day: 'Pazartesi', hours: '10:00–18:00' },
      { day: 'Salı', hours: '10:00–18:00' },
      { day: 'Çarşamba', hours: '10:00–18:00' },
      { day: 'Perşembe', hours: '10:00–18:00' },
      { day: 'Cuma', hours: '10:00–18:00' },
      { day: 'Cumartesi', hours: '10:00–18:00' },
      { day: 'Pazar', hours: 'Kapalı' }
    ],
    schema: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '10:00',
        closes: '18:00'
      }
    ]
  },
  // Real client logos already displayed on the homepage marquee — safe to
  // reference by name elsewhere on the site (e.g. sector pages) since they
  // are already public-facing, factual client relationships. No results,
  // figures or testimonials are attached to them anywhere in this project.
  clientNames: [
    "Kadir Yıldırım Men's Grooming",
    'SONAX',
    'Zenetsy VIP Güzellik Salonu',
    'CMR Gayrimenkul',
    'Bolu Elit Pazarlama',
    'Coffee Lab',
    'SSK Art Design',
    'Lego Club'
  ]
};
