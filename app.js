/* ── Sticky nav ── */
const nav = document.getElementById('mainNav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

/* ── Burger menu ── */
const burger = document.getElementById('navBurger');
const mobNav = document.getElementById('mobNav');
let _scrollY = 0;

function lockBody() {
  _scrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = '-' + _scrollY + 'px';
  document.body.style.width = '100%';
  document.body.style.overflow = 'hidden';
}
function unlockBody() {
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  document.body.style.overflow = '';
  window.scrollTo(0, _scrollY);
}

burger.addEventListener('click', () => {
  const open = burger.classList.toggle('open');
  mobNav.classList.toggle('open', open);
  nav.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', open);
  open ? lockBody() : unlockBody();
});
document.querySelectorAll('.mob-nav a, .mob-nav-link').forEach(link => {
  link.addEventListener('click', () => {
    burger.classList.remove('open');
    mobNav.classList.remove('open');
    nav.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    unlockBody();
  });
});

/* ── Scroll reveal ── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ── Hero image fallback ── */
const heroImg = document.querySelector('.browser-screen img');
if (heroImg) {
  heroImg.addEventListener('error', () => {
    heroImg.style.display = 'none';
    const fb = document.getElementById('heroScreenFallback');
    if (fb) fb.style.display = 'flex';
  });
}

/* ── Lightbox Escape ── */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    ['heroLightbox','uniLightbox'].forEach(id => {
      const lb = document.getElementById(id);
      if (lb) lb.style.display = 'none';
    });
  }
});


/* ── Calculator (enhanced with animations) ── */
(function() {
  const fields = [
    { id: 'rMonths',  valId: 'valMonths',  fmt: v => v },
    { id: 'rSalary',  valId: 'valSalary',  fmt: v => (+v).toLocaleString('ru') + ' ₽' },
    { id: 'rMinutes', valId: 'valMinutes', fmt: v => v + ' ч' },
  ];

  // Animated number counter
  function animateCounter(el, fromVal, toVal, duration) {
    if (!el) return;
    const startTime = performance.now();
    const range = toVal - fromVal;
    if (range === 0) return;
    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(fromVal + range * eased);
      el.setAttribute('data-raw', current);
      if (el.id === 'resSavedMoney') {
        el.textContent = current.toLocaleString('ru') + ' ₽';
      } else {
        el.textContent = current.toLocaleString('ru');
      }
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // Flash card on update
  function flashCard(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('updating');
    void el.offsetWidth; // force reflow
    el.classList.add('updating');
    setTimeout(() => el.classList.remove('updating'), 450);
  }

  // Update progress bar
  function setBar(id, pct) {
    const el = document.getElementById(id);
    if (el) el.style.width = Math.max(0, Math.min(100, pct)) + '%';
  }

  // Track previous values for counter animation
  let prevHours = 0, prevMoney = 0;

  function calc() {
    const months      = +document.getElementById('rMonths').value;
    const hourlyRate  = +document.getElementById('rSalary').value;
    const manualHours = +document.getElementById('rMinutes').value;

    const sessionsPerYear = months * 12;
    const hoursNow   = manualHours * sessionsPerYear;
    const hoursNew   = (5 / 60) * sessionsPerYear;
    const savedHours = Math.max(0, hoursNow - hoursNew);
    const savedMoney = savedHours * hourlyRate;

    const PROGRAM_COST = 14990;
    const savedPerMonth = savedMoney / 12;
    const roiMonths = savedPerMonth > 0 ? PROGRAM_COST / savedPerMonth : 999;
    const roiText = roiMonths < 1 ? '< 1' : roiMonths > 120 ? '> 120' : Math.round(roiMonths).toLocaleString('ru');

    // Hidden compat fields
    document.getElementById('resHoursNow').textContent = Math.round(hoursNow).toLocaleString('ru');
    document.getElementById('resHoursNew').textContent = Math.round(hoursNew).toLocaleString('ru');

    // Flash cards
    flashCard('cardSavedHours');
    flashCard('cardSavedMoney');
    flashCard('cardROI');

    // Animate counters
    const targetHours = Math.round(savedHours);
    const targetMoney = Math.round(savedMoney);
    animateCounter(document.getElementById('resSavedHours'), prevHours, targetHours, 420);
    animateCounter(document.getElementById('resSavedMoney'), prevMoney, targetMoney, 420);
    prevHours = targetHours;
    prevMoney = targetMoney;

    // ROI — direct update (special formatting)
    const roiEl = document.getElementById('resROI');
    if (roiEl) roiEl.textContent = roiText;

    // Progress bars
    // Hours: 0–500 range feels representative
    setBar('barSavedHours', savedHours / 480 * 100);
    // Money: 0–1 000 000
    setBar('barSavedMoney', savedMoney / 960000 * 100);
    // ROI bar: full = fast payback (< 1 month), empty = slow (> 24 months)
    const roiBarPct = roiMonths >= 999 ? 2 : Math.max(2, (1 - (Math.min(roiMonths, 24) / 24)) * 100);
    setBar('barROI', roiBarPct);
  }

  fields.forEach(({ id, valId, fmt }) => {
    const range = document.getElementById(id);
    const val   = document.getElementById(valId);
    if (!range || !val) return;

    range.addEventListener('input', () => {
      val.textContent = fmt(range.value);
      // Pop badge
      val.classList.remove('pop');
      void val.offsetWidth;
      val.classList.add('pop');
      setTimeout(() => val.classList.remove('pop'), 220);

      calc();

      const pct = (range.value - range.min) / (range.max - range.min) * 100;
      range.style.background = `linear-gradient(90deg, rgba(255,255,255,.9) ${pct}%, rgba(255,255,255,.2) ${pct}%)`;
    });

    // Initial track fill
    const pct = (range.value - range.min) / (range.max - range.min) * 100;
    range.style.background = `linear-gradient(90deg, rgba(255,255,255,.9) ${pct}%, rgba(255,255,255,.2) ${pct}%)`;
  });

  calc();
})();

/* ── FAQ accordion ── */
document.querySelectorAll('.faq-q').forEach(q => {
  q.addEventListener('click', () => {
    const item = q.parentElement;
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

/* ── Contact form → Google Apps Script → Telegram ── */
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwx02B-sEgTdtsyPZHoZUnhs0T162vB2dBLks05grDyph3CMJdA-OHAK2x-9o4aT5Sv/exec';

document.getElementById('fBtn').addEventListener('click', async function() {
  const btn      = this;
  const phone    = document.getElementById('fPhone').value.trim();
  const errBox   = document.getElementById('fErr');

  if (!phone) {
    errBox.textContent = 'Пожалуйста, введите телефон.';
    errBox.style.display = 'block';
    return;
  }
  errBox.style.display = 'none';

  const origHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:spin .8s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Отправка…';

  const NL   = '\n';
  const text = '🔔 Новая заявка — Прайс-менеджер' + NL + NL +
    '📞 Телефон: ' + phone + NL +
    '⏰ ' + new Date().toLocaleString('ru-RU');

  try {
    /* Content-Type: text/plain — единственный вариант, работающий
       в режиме no-cors без preflight. GAS читает через e.postData.contents */
    await fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ phone, text })
    });
    /* no-cors всегда возвращает opaque-ответ, исключение = сеть упала */
    document.getElementById('cForm').style.display = 'none';
    document.getElementById('formOk').style.display = 'block';
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = origHTML;
    errBox.textContent = 'Ошибка отправки. Напишите напрямую в Telegram.';
    errBox.style.display = 'block';
  }
});
