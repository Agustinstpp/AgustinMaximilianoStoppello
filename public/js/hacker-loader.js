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
    const isSilent = url.includes('/api/version');
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
      <div class="hacker-patch-box">
        <div class="hacker-patch-line">&gt; ${message || 'APLICANDO MODIFICACIONES // SYNCING EDGE'}</div>
        <div class="hacker-patch-bar"><span></span></div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.body.classList.add('hacker-screen-flicker');

    setTimeout(() => {
      document.body.classList.remove('hacker-screen-flicker');
      overlay.classList.add('fade-out');
      setTimeout(() => {
        overlay.remove();
        if (onDone) onDone();
      }, 220);
    }, 620);
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVersionWatcher);
  } else {
    initVersionWatcher();
  }

  global.HackerLoader = { start, stop, playHackerPatchFlicker };
})(window);
