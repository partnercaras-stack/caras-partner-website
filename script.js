// ===================== ANNOUNCEMENT BAR =====================
(() => {
  const bar = document.getElementById('announceBar');
  const closeBtn = document.getElementById('announceClose');
  if (!bar || !closeBtn) return;
  if (localStorage.getItem('carasAnnounceDismissed')) {
    bar.classList.add('hidden');
    return;
  }
  closeBtn.addEventListener('click', () => {
    bar.classList.add('hidden');
    localStorage.setItem('carasAnnounceDismissed', '1');
  });
})();

// ===================== SCROLL REVEAL =====================
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
revealEls.forEach((el) => revealObserver.observe(el));

// ===================== HEADER SHRINK =====================
const header = document.querySelector('.site-header');
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (y > 40) header.classList.add('is-scrolled');
  else header.classList.remove('is-scrolled');
  lastScroll = y;
}, { passive: true });

// ===================== MOBILE NAV =====================
const burgerBtn = document.getElementById('burgerBtn');
const mainNav = document.getElementById('mainNav');
burgerBtn.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  burgerBtn.classList.toggle('open', isOpen);
  burgerBtn.setAttribute('aria-expanded', String(isOpen));
});
mainNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('open');
    burgerBtn.classList.remove('open');
    burgerBtn.setAttribute('aria-expanded', 'false');
  });
});

// ===================== ANIMATED COUNTERS =====================
const counters = document.querySelectorAll('.stat-num[data-count]');
const formatNumber = (num) => {
  return Number.isInteger(num) ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '');
};
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      el.textContent = formatNumber(current) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    counterObserver.unobserve(el);
  });
}, { threshold: 0.5 });
counters.forEach((el) => counterObserver.observe(el));

// Duration-style counter (e.g. "3s 12d") that counts both parts up together.
const durationEls = document.querySelectorAll('.stat-num[data-hours]');
const durationObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const targetH = parseInt(el.dataset.hours, 10);
    const targetM = parseInt(el.dataset.minutes, 10);
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const h = Math.round(targetH * eased);
      const m = Math.round(targetM * eased);
      el.textContent = h + 's ' + m + 'd';
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    durationObserver.unobserve(el);
  });
}, { threshold: 0.5 });
durationEls.forEach((el) => durationObserver.observe(el));

// ===================== HERO CURSOR GLOW (desktop only) =====================
const heroGlow = document.getElementById('heroGlow');
const heroSection = document.querySelector('.hero');
if (heroGlow && heroSection && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  heroSection.addEventListener('mouseenter', () => heroGlow.classList.add('active'));
  heroSection.addEventListener('mouseleave', () => heroGlow.classList.remove('active'));
  heroSection.addEventListener('mousemove', (e) => {
    const rect = heroSection.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    heroGlow.style.setProperty('--mx', x + '%');
    heroGlow.style.setProperty('--my', y + '%');
  });
}

// ===================== FOOTER YEAR =====================
document.getElementById('year').textContent = new Date().getFullYear();

// ===================== TIMELINE MOTION (Çalışma Sürecimiz) =====================
(() => {
  const items = Array.from(document.querySelectorAll('.timeline-item'));
  if (!items.length) return;

  // Desktop enlarge-on-hover is pure CSS (:hover). This handles tap-to-enlarge
  // on touch devices, since hover doesn't fire reliably there.
  items.forEach((item) => {
    item.addEventListener('click', () => {
      const wasFocused = item.classList.contains('focused');
      items.forEach((el) => el.classList.remove('focused'));
      if (!wasFocused) item.classList.add('focused');
    });
  });

  const timelineObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('active');
    });
  }, { threshold: 0.4 });
  items.forEach((el) => timelineObserver.observe(el));
})();

// ===================== FAQ ACCORDION =====================
document.querySelectorAll('.faq-item').forEach((item) => {
  const btn = item.querySelector('.faq-question');
  btn.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach((openItem) => {
      if (openItem !== item) {
        openItem.classList.remove('open');
        openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      }
    });
    item.classList.toggle('open', !isOpen);
    btn.setAttribute('aria-expanded', String(!isOpen));
  });
});

// ===================== CARAS ASİSTAN =====================
(() => {
  const fab = document.getElementById('assistantFab');
  const panel = document.getElementById('assistantPanel');
  const closeBtn = document.getElementById('assistantClose');
  const messagesEl = document.getElementById('assistantMessages');
  const form = document.getElementById('assistantForm');
  const input = document.getElementById('assistantInput');
  const teaser = document.getElementById('assistantTeaser');
  const teaserClose = document.getElementById('assistantTeaserClose');

  const history = [];
  let hasInteracted = false;

  function openPanel() {
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add('open'));
    fab.setAttribute('aria-expanded', 'true');
    hideTeaser();
    hasInteracted = true;
    sessionStorage.setItem('carasAsistanSeen', '1');
  }

  function closePanel() {
    panel.classList.remove('open');
    fab.setAttribute('aria-expanded', 'false');
    setTimeout(() => { panel.hidden = true; }, 300);
  }

  function showTeaser() {
    if (hasInteracted || sessionStorage.getItem('carasAsistanSeen')) return;
    teaser.classList.add('open');
  }

  function hideTeaser() {
    teaser.classList.remove('open');
  }

  function addMessage(role, text) {
    const el = document.createElement('div');
    el.className = 'assistant-msg ' + (role === 'user' ? 'assistant-msg-user' : 'assistant-msg-bot');
    el.textContent = text;
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return el;
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'assistant-msg assistant-msg-bot assistant-msg-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return el;
  }

  fab.addEventListener('click', () => {
    if (panel.classList.contains('open')) closePanel();
    else openPanel();
  });
  closeBtn.addEventListener('click', closePanel);
  teaser.addEventListener('click', openPanel);
  teaserClose.addEventListener('click', (e) => {
    e.stopPropagation();
    hasInteracted = true;
    sessionStorage.setItem('carasAsistanSeen', '1');
    hideTeaser();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addMessage('user', text);
    history.push({ role: 'user', content: text });
    input.value = '';
    input.disabled = true;

    const typingEl = showTyping();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });
      const data = await res.json();
      typingEl.remove();
      const reply = data.reply || 'Üzgünüm, şu anda yanıt veremiyorum. WhatsApp üzerinden yazabilirsiniz: +90 532 455 6114';
      addMessage('bot', reply);
      history.push({ role: 'assistant', content: reply });
    } catch (err) {
      typingEl.remove();
      addMessage('bot', 'Bağlantı sorunu yaşıyoruz. WhatsApp üzerinden yazabilirsiniz: +90 532 455 6114');
    } finally {
      input.disabled = false;
      input.focus();
    }
  });

  // Proactive popup: show the teaser once per session, a few seconds after load.
  setTimeout(showTeaser, 4500);
})();

// ===================== CONTACT FORM -> WHATSAPP =====================
const contactForm = document.getElementById('contactForm');
contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const brand = document.getElementById('brand').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const message = document.getElementById('message').value.trim();

  let text = `Merhaba, Caras Partner web sitesinden yazıyorum.\n\nAd Soyad: ${name}`;
  if (brand) text += `\nMarka/İşletme: ${brand}`;
  text += `\nTelefon: ${phone}`;
  if (message) text += `\nMesaj: ${message}`;

  const url = `https://wa.me/905324556114?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener');
});
