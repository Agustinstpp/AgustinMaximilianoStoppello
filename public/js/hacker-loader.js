/**
 * Global Hacker Loading HUD & Top Scan Bar for agustinst.code
 * Automatically intercepts all /api/* fetch calls across the entire site & admin panel.
 */
(function (global) {
  const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const ROUTE_LABELS = [
    [/upload-image/, 'UPLOADING // R2 MEDIA'],
    [/create-project|update-project/, 'WRITING // D1 PROJECT'],
    [/delete-project/, 'PURGING // D1 PROJECT'],
    [/toggle-project-visibility/, 'PATCHING // VISIBILITY'],
    [/get-project\b/, 'FETCHING // PROJECT'],
    [/get-projects/, 'SYNCING // D1 PROJECTS'],
    [/create-post|update-post/, 'WRITING // D1 ARTICLE'],
    [/delete-post/, 'PURGING // D1 ARTICLE'],
    [/toggle-post-visibility/, 'PATCHING // VISIBILITY'],
    [/get-posts|get-post\b/, 'SYNCING // D1 BLOG'],
    [/brand-work/, 'SYNCING // BRAND WORKS'],
    [/analytics/, 'QUERYING // D1 METRICS'],
    [/health/, 'PINGING // EDGE D1'],
  ];

  let activeCount = 0;
  let spinIdx = 0;
  let spinTimer = null;
  let hideTimer = null;
  let topbarEl = null;
  let hudEl = null;
  let textEl = null;
  let spinEl = null;
  let hexEl = null;

  function ensureDom() {
    if (topbarEl && hudEl) return;
    if (!document.body) return;

    topbarEl = document.createElement('div');
    topbarEl.className = 'hacker-topbar';
    topbarEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(topbarEl);

    hudEl = document.createElement('div');
    hudEl.className = 'hacker-loader-hud';
    hudEl.setAttribute('role', 'status');
    hudEl.setAttribute('aria-live', 'polite');
    hudEl.innerHTML = `
      <span class="hacker-loader-spin" aria-hidden="true">⠋</span>
      <span class="hacker-loader-text">EXECUTING // EDGE</span>
      <span class="hacker-loader-hex" aria-hidden="true">0x00</span>
    `;
    document.body.appendChild(hudEl);

    spinEl = hudEl.querySelector('.hacker-loader-spin');
    textEl = hudEl.querySelector('.hacker-loader-text');
    hexEl = hudEl.querySelector('.hacker-loader-hex');
  }

  function labelForUrl(url) {
    const str = String(url || '');
    for (const [re, label] of ROUTE_LABELS) {
      if (re.test(str)) return label;
    }
    return 'EXECUTING // EDGE API';
  }

  function randomHex() {
    return '0x' + Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0').toUpperCase();
  }

  function start(label) {
    ensureDom();
    if (!hudEl) return;
    clearTimeout(hideTimer);
    activeCount++;
    hudEl.classList.remove('done', 'err');
    hudEl.classList.add('active');
    topbarEl.classList.add('active');
    textEl.textContent = label || 'EXECUTING // EDGE';

    if (!spinTimer) {
      spinTimer = setInterval(() => {
        spinIdx = (spinIdx + 1) % SPINNER.length;
        if (spinEl) spinEl.textContent = SPINNER[spinIdx];
        if (hexEl) hexEl.textContent = randomHex();
      }, 65);
    }
  }

  function stop(ok = true) {
    activeCount = Math.max(0, activeCount - 1);
    if (activeCount > 0 || !hudEl) return;

    clearInterval(spinTimer);
    spinTimer = null;
    topbarEl.classList.remove('active');

    if (spinEl) spinEl.textContent = ok ? '✓' : '✕';
    if (textEl) textEl.textContent = ok ? 'OK // 200 SYNCED' : 'ERR // REQUEST FAILED';
    if (hexEl) hexEl.textContent = ok ? '0x00C8' : '0x01F4';
    hudEl.classList.add(ok ? 'done' : 'err');

    hideTimer = setTimeout(() => {
      if (activeCount === 0 && hudEl) {
        hudEl.classList.remove('active', 'done', 'err');
      }
    }, ok ? 480 : 1200);
  }

  // Intercept all /api/* fetch calls automatically (skip silent /api/version polls)
  const nativeFetch = global.fetch.bind(global);
  global.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : input && input.url ? input.url : '';
    const isSilent = url.includes('/api/version') || url.includes('/api/track');
    const isApi = !isSilent && (url.includes('/api/') || url.endsWith('/health'));

    if (!isApi) return nativeFetch(input, init);

    start(labelForUrl(url));
    try {
      const response = await nativeFetch(input, init);
      stop(response.ok);
      return response;
    } catch (err) {
      stop(false);
      throw err;
    }
  };

  // ─── Live Version Watcher + Hacker Patch Flicker ──────────────────────────
  const VERSION_KEY = 'agustinst_last_fp';
  const PENDING_KEY = 'agustinst_just_patched';
  let loadedFingerprint = null;
  let updateBannerEl = null;

  function playHackerPatchFlicker(message, onDone) {
    if (!document.body) {
      if (onDone) onDone();
      return;
    }
    const overlay = document.createElement('div');
    overlay.className = 'hacker-patch-overlay';
    overlay.innerHTML = `
      <canvas class="hacker-patch-matrix" aria-hidden="true"></canvas>
      <div class="hacker-patch-slice hacker-patch-slice--1" aria-hidden="true"></div>
      <div class="hacker-patch-slice hacker-patch-slice--2" aria-hidden="true"></div>
      <div class="hacker-patch-slice hacker-patch-slice--3" aria-hidden="true"></div>
      <div class="hacker-patch-flash" aria-hidden="true"></div>
      <div class="hacker-patch-box">
        <div class="hacker-patch-top">
          <span class="hacker-patch-tag">SYS // HOT-PATCH</span>
          <span class="hacker-patch-pct">0%</span>
        </div>
        <div class="hacker-patch-line">&gt; ${message || 'APLICANDO MODIFICACIONES // SYNCING EDGE'}</div>
        <div class="hacker-patch-logs" aria-hidden="true"></div>
        <div class="hacker-patch-bar"><span></span></div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.body.classList.add('hacker-screen-flicker');

    // Full-screen Matrix / hex rain burst
    const canvas = overlay.querySelector('.hacker-patch-matrix');
    let matrixTimer = null;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const w = (canvas.width = window.innerWidth);
      const h = (canvas.height = window.innerHeight);
      const fontSize = 15;
      const cols = Math.ceil(w / fontSize);
      const drops = Array.from({ length: cols }, () => Math.random() * (h / fontSize));
      const glyphs = '01<>/{}[]#$%&*+=-;:ABCDEF0123456789';
      matrixTimer = setInterval(() => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.fillRect(0, 0, w, h);
        ctx.font = `700 ${fontSize}px monospace`;
        for (let i = 0; i < drops.length; i++) {
          const ch = glyphs[Math.floor(Math.random() * glyphs.length)];
          ctx.fillStyle = Math.random() > 0.82 ? '#ffffff' : '#c8f31d';
          ctx.fillText(ch, i * fontSize, drops[i] * fontSize);
          drops[i] += 1.45;
          if (drops[i] * fontSize > h && Math.random() > 0.85) drops[i] = 0;
        }
      }, 36);
    }

    // Rapid terminal log stream + percentage counter
    const logsEl = overlay.querySelector('.hacker-patch-logs');
    const pctEl = overlay.querySelector('.hacker-patch-pct');
    const logSteps = [
      () => `[${randomHex()}] DECRYPTING EDGE BUNDLE...`,
      () => `[${randomHex()}] FLUSHING STALE CACHE // OK`,
      () => `[${randomHex()}] INJECTING NEW MODULES...`,
      () => `[${randomHex()}] VERIFYING CHECKSUM // PASS`,
      () => `[${randomHex()}] HOT-SWAP COMPLETE // 200`,
    ];
    let stepIdx = 0;
    const logTimer = setInterval(() => {
      if (logsEl && stepIdx < logSteps.length) {
        const row = document.createElement('div');
        row.textContent = logSteps[stepIdx]();
        logsEl.appendChild(row);
        if (logsEl.children.length > 3) logsEl.removeChild(logsEl.firstChild);
        stepIdx++;
      }
      if (pctEl) {
        const pct = Math.min(100, Math.round((stepIdx / logSteps.length) * 100));
        pctEl.textContent = pct + '%';
      }
    }, 210);

    setTimeout(() => {
      clearInterval(matrixTimer);
      clearInterval(logTimer);
      if (pctEl) pctEl.textContent = '100%';
      overlay.classList.add('final-flash');
      setTimeout(() => {
        document.body.classList.remove('hacker-screen-flicker');
        overlay.classList.add('fade-out');
        setTimeout(() => {
          overlay.remove();
          if (onDone) onDone();
        }, 220);
      }, 140);
    }, 1150);
  }

  function showUpdateBanner(newFp) {
    if (updateBannerEl || !document.body) return;
    updateBannerEl = document.createElement('div');
    updateBannerEl.className = 'hacker-update-banner';
    updateBannerEl.setAttribute('role', 'status');
    updateBannerEl.innerHTML = `
      <span class="hacker-update-dot" aria-hidden="true"></span>
      <span class="hacker-update-msg">Nueva actualización disponible</span>
      <button type="button" class="hacker-update-btn" id="hacker-apply-update">Actualizar &#8635;</button>
      <button type="button" class="hacker-update-close" aria-label="Cerrar">&times;</button>
    `;
    document.body.appendChild(updateBannerEl);

    requestAnimationFrame(() => updateBannerEl.classList.add('show'));

    updateBannerEl.querySelector('#hacker-apply-update').addEventListener('click', () => {
      try {
        localStorage.setItem(VERSION_KEY, newFp);
        sessionStorage.setItem(PENDING_KEY, '1');
      } catch {}
      playHackerPatchFlicker('PATCHING SYSTEM // ACTUALIZANDO VERSIÓN', () => {
        global.location.reload();
      });
    });

    updateBannerEl.querySelector('.hacker-update-close').addEventListener('click', () => {
      updateBannerEl.classList.remove('show');
      setTimeout(() => {
        if (updateBannerEl) updateBannerEl.remove();
        updateBannerEl = null;
      }, 220);
    });
  }

  async function checkVersion(isInitial) {
    try {
      const res = await nativeFetch('/api/version?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const fp = data && data.fingerprint;
      if (!fp) return;

      if (isInitial) {
        loadedFingerprint = fp;
        let prevFp = null;
        let justPatched = false;
        try {
          prevFp = localStorage.getItem(VERSION_KEY);
          justPatched = sessionStorage.getItem(PENDING_KEY) === '1';
          localStorage.setItem(VERSION_KEY, fp);
          sessionStorage.removeItem(PENDING_KEY);
        } catch {}

        // If user reloaded from an older version (or just clicked Actualizar), play quick hacker patch flicker
        if (justPatched || (prevFp && prevFp !== fp)) {
          playHackerPatchFlicker(`MODIFICACIONES APLICADAS // v${data.appVersion || '2.6'}`);
        }
      } else if (loadedFingerprint && fp !== loadedFingerprint) {
        showUpdateBanner(fp);
      }
    } catch {
      // Ignore offline/network hiccups silently
    }
  }

  function initVersionWatcher() {
    if (global.location.pathname.includes('admin.html')) return;
    checkVersion(true);
    setInterval(() => checkVersion(false), 45000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkVersion(false);
    });
  }

  // ─── Lightweight Privacy-Friendly Analytics Tracker ───────────────────────
  function initAnalyticsTracker() {
    if (global.location.pathname.toLowerCase().includes('admin')) return;
    try {
      if (
        localStorage.getItem('agustinst_is_admin') === '1' ||
        sessionStorage.getItem('admin_authenticated') === '1'
      ) {
        return;
      }
    } catch {}

    const SID_KEY = 'agustinst_sid';
    let sessionId = '';
    try {
      sessionId = sessionStorage.getItem(SID_KEY);
      if (!sessionId) {
        sessionId = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2)).slice(0, 24);
        sessionStorage.setItem(SID_KEY, sessionId);
      }
    } catch {
      sessionId = String(Date.now()) + Math.random().toString(36).slice(2, 10);
    }

    const w = global.innerWidth || 1280;
    const device = w < 720 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';
    let referrer = 'Directo';
    if (document.referrer) {
      try {
        const refHost = new URL(document.referrer).hostname.replace(/^www\./, '');
        if (refHost && refHost !== global.location.hostname.replace(/^www\./, '')) {
          referrer = refHost;
        }
      } catch {}
    }

    function currentPath() {
      const p = global.location.pathname || '/';
      if (p === '/Index.html' || p === '/index.html') return '/';
      return p + (global.location.search || '');
    }

    const queue = [];
    let flushTimer = null;

    function sendPayload(events, useBeacon) {
      if (!events.length) return;
      const body = JSON.stringify({ events });
      if (useBeacon && navigator.sendBeacon) {
        try {
          const blob = new Blob([body], { type: 'application/json' });
          if (navigator.sendBeacon('/api/track', blob)) return;
        } catch {}
      }
      nativeFetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }

    function flush(useBeacon) {
      if (!queue.length) return;
      const batch = queue.splice(0, 20);
      sendPayload(batch, useBeacon);
    }

    function track(eventType, target, category, durationMs) {
      queue.push({
        session_id: sessionId,
        event_type: eventType,
        path: currentPath(),
        target: target || null,
        category: category || null,
        duration_ms: durationMs || 0,
        device,
        referrer,
      });
      if (queue.length >= 6) {
        flush(false);
      } else {
        clearTimeout(flushTimer);
        flushTimer = setTimeout(() => flush(false), 1800);
      }
    }

    // 1. Pageview
    track('pageview', document.title || currentPath(), 'page', 0);

    // 2. Section visibility (IntersectionObserver)
    const SECTION_LABELS = {
      trabajos: 'Trabajos seleccionados',
      'sobre-mi': 'Sobre mí',
      trayectoria: 'Trayectoria',
      eventos: 'Eventos y reconocimientos',
      faq: 'Preguntas Frecuentes',
      contacto: 'Contacto / CTA',
    };
    const seenSections = new Set();

    function observeSections() {
      if (!('IntersectionObserver' in global)) return;
      const targets = Array.from(document.querySelectorAll('section[id], section.hero, section.brands-section'));
      if (!targets.length) return;

      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const el = entry.target;
            const key = el.id || (el.classList.contains('hero') ? 'hero' : el.classList.contains('brands-section') ? 'marcas' : '');
            if (!key || seenSections.has(key)) continue;
            seenSections.add(key);
            const label =
              SECTION_LABELS[key] ||
              (key === 'hero' ? 'Hero / Inicio' : key === 'marcas' ? 'Carrusel de Marcas' : key);
            track('section_view', label, 'section', 0);
            io.unobserve(el);
          }
        },
        { threshold: 0.3 }
      );
      targets.forEach((el) => io.observe(el));
    }
    observeSections();

    // 3. Meaningful click tracking
    document.addEventListener(
      'click',
      (e) => {
        const el = e.target && e.target.closest
          ? e.target.closest('a, button, .project-card, .blog-card, .brand-chip, .faq-item summary')
          : null;
        if (!el) return;
        if (el.closest('.hacker-update-banner')) return;

        let target = '';
        let category = 'other';

        if (el.classList.contains('project-card')) {
          const title = el.querySelector('.project-title')?.textContent?.trim() || el.getAttribute('href') || 'Proyecto';
          target = 'Proyecto: ' + title;
          category = 'project';
        } else if (el.classList.contains('brand-chip')) {
          target = 'Marca: ' + (el.dataset.brand || el.getAttribute('title') || 'Marca');
          category = 'brand';
        } else if (el.classList.contains('blog-card')) {
          const title = el.querySelector('.blog-title')?.textContent?.trim() || 'Artículo';
          target = 'Blog: ' + title;
          category = 'blog';
        } else if (el.closest('.cta-actions') || (el.getAttribute('href') || '').startsWith('mailto:')) {
          target = 'Contacto: ' + (el.getAttribute('aria-label') || el.textContent.trim() || 'Link');
          category = 'contact';
        } else if (el.classList.contains('event-ig-link')) {
          target = 'Instagram Evento';
          category = 'social';
        } else if (el.closest('.faq-item')) {
          target = 'FAQ: ' + (el.querySelector('span')?.textContent?.trim() || el.textContent.trim()).slice(0, 60);
          category = 'faq';
        } else if (el.closest('.detail-actions')) {
          target = 'Proyecto CTA: ' + el.textContent.trim();
          category = 'project';
        } else if (el.closest('.hero-actions')) {
          target = 'Hero CTA: ' + el.textContent.trim();
          category = 'cta';
        } else if (el.classList.contains('nav-link') || el.closest('.site-header')) {
          target = 'Nav: ' + (el.textContent.trim() || el.getAttribute('aria-label') || 'Menú');
          category = 'nav';
        } else if (el.closest('.footer-links')) {
          target = 'Footer: ' + el.textContent.trim();
          category = 'contact';
        } else {
          return;
        }

        track('click', target, category, 0);
      },
      { passive: true }
    );

    // 4. Active duration tracking
    let activeStart = document.visibilityState === 'visible' ? Date.now() : null;
    function reportDuration(useBeacon) {
      if (!activeStart) return;
      const elapsed = Date.now() - activeStart;
      activeStart = document.visibilityState === 'visible' ? Date.now() : null;
      if (elapsed >= 1000) {
        track('duration', currentPath(), 'session', Math.min(elapsed, 1800000));
        flush(useBeacon);
      } else if (useBeacon) {
        flush(true);
      }
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        reportDuration(true);
      } else {
        activeStart = Date.now();
      }
    });
    global.addEventListener('pagehide', () => reportDuration(true));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initVersionWatcher();
      initAnalyticsTracker();
    });
  } else {
    initVersionWatcher();
    initAnalyticsTracker();
  }

  global.HackerLoader = { start, stop, playHackerPatchFlicker };
})(window);
