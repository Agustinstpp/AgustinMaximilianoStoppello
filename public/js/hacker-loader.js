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

  // Intercept all /api/* fetch calls automatically
  const nativeFetch = global.fetch.bind(global);
  global.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : input && input.url ? input.url : '';
    const isApi = url.includes('/api/') || url.endsWith('/health');

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

  global.HackerLoader = { start, stop };
})(window);
