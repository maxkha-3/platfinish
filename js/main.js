(() => {
  const snap = document.getElementById('snap');
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Mobile menu
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');

  function closeMenu() {
    if (!burger || !mobileMenu) return;
    burger.setAttribute('aria-expanded', 'false');
    mobileMenu.hidden = true;
    document.body.style.overflow = '';
  }

  function openMenu() {
    if (!burger || !mobileMenu) return;
    burger.setAttribute('aria-expanded', 'true');
    mobileMenu.hidden = false;
  }

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const expanded = burger.getAttribute('aria-expanded') === 'true';
      expanded ? closeMenu() : openMenu();
    });

    mobileMenu.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (a) closeMenu();
    });
  }

  // Reveal animations
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    });
  }, { threshold: 0.14 });

  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // Dots navigation
  const dots = document.querySelector('.dots');
  const sections = Array.from(document.querySelectorAll('main > section.panel'));
  const dotButtons = [];

  if (dots && sections.length) {
    sections.forEach((sec, idx) => {
      const b = document.createElement('button');
      b.className = 'dotBtn';
      b.type = 'button';
      b.title = sec.dataset.title || `Sektion ${idx+1}`;
      b.setAttribute('aria-label', b.title);
      b.addEventListener('click', () => {
        sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      dots.appendChild(b);
      dotButtons.push(b);
    });

    const sectionIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        dotButtons.forEach((b, i) => {
          const current = sections[i].id === id;
          b.setAttribute('aria-current', current ? 'true' : 'false');
        });
      });
    }, { threshold: 0.6 });

    sections.forEach((s) => sectionIO.observe(s));
    // set first active
    if (dotButtons[0]) dotButtons[0].setAttribute('aria-current', 'true');
  }


  // Counters (animate 0 -> target when visible)
  const counterEls = Array.from(document.querySelectorAll('[data-count]'));
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.getAttribute('data-count') || '0');
      const suffix = el.getAttribute('data-suffix') || '';
      if (el.__counted) return;
      el.__counted = true;

      const duration = 900; // ms
      const start = performance.now();

      function tick(now) {
        const t = Math.min(1, (now - start) / duration);
        const val = Math.round(target * t);
        el.textContent = `${val}${suffix}`;
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });

  counterEls.forEach((el) => counterIO.observe(el));

  // Improve anchor scrolling within snap container
  function handleAnchorClick(e) {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (!id || id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  document.addEventListener('click', handleAnchorClick);

  // Tjänster tiles: make "hover to reveal" also work on click/tap (mobile)
  const serviceTiles = Array.from(document.querySelectorAll('.tile--bg'));
  if (serviceTiles.length) {
    // Robust background URL resolution (works even if site is hosted in a subfolder)
    serviceTiles.forEach((tile) => {
      const bg = tile.getAttribute('data-bg');
      if (!bg) return;
      try {
        const abs = new URL(bg, document.baseURI).href;
        tile.style.setProperty('--tile-bg', `url("${abs}")`);
      } catch (_) {
        // Fallback: use raw path
        tile.style.setProperty('--tile-bg', `url("${bg}")`);
      }
    });

    function deactivateAll(except = null) {
      serviceTiles.forEach((t) => {
        if (except && t === except) return;
        t.classList.remove('is-active');
        t.setAttribute('aria-pressed', 'false');
      });
    }

    serviceTiles.forEach((tile) => {
      tile.setAttribute('aria-pressed', 'false');
      tile.addEventListener('click', (e) => {
        // Ignore clicks on actual links inside tiles (future-proof)
        if (e.target && e.target.closest('a')) return;
        const active = tile.classList.contains('is-active');
        deactivateAll(tile);
        tile.classList.toggle('is-active', !active);
        tile.setAttribute('aria-pressed', (!active).toString());
      });

      tile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          tile.click();
        }
        if (e.key === 'Escape') {
          deactivateAll();
          tile.blur();
        }
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target || !e.target.closest('.tile--bg')) deactivateAll();
    });
  }

  // Optional: keyboard shortcuts within snap container
  document.addEventListener('keydown', (e) => {
    if (!snap) return;
    if (['ArrowDown','PageDown',' '].includes(e.key)) {
      const next = getAdjacentSection(1);
      if (next) { e.preventDefault(); next.scrollIntoView({ behavior:'smooth', block:'start' }); }
    }
    if (['ArrowUp','PageUp'].includes(e.key)) {
      const prev = getAdjacentSection(-1);
      if (prev) { e.preventDefault(); prev.scrollIntoView({ behavior:'smooth', block:'start' }); }
    }
  });

  function getAdjacentSection(dir) {
    const current = sections.find((s) => isMostlyVisible(s));
    const idx = Math.max(0, sections.indexOf(current));
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= sections.length) return null;
    return sections[nextIdx];
  }

  function isMostlyVisible(el) {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
    return visible / vh > 0.6;
  }
})();
