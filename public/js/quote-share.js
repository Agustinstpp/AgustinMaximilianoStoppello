/**
 * Spotify-style Quote Card Sharer for agustinst.code
 * Lets readers highlight any phrase inside .prose (blogs & projects)
 * and share/download a branded PNG card with theme, title, cover, and agustinst.code branding.
 */
(function (global) {
  const THEMES = [
    {
      id: 'lime',
      name: 'Cyber Lima',
      outerBg: '#9dc212',
      cardBg: '#c8f31d',
      text: '#0a0a0a',
      muted: 'rgba(10, 10, 10, 0.68)',
      brand: '#0a0a0a',
      accent: '#0a0a0a',
      swatch: '#c8f31d',
    },
    {
      id: 'noir',
      name: 'Cyber Noir',
      outerBg: '#060606',
      cardBg: '#141414',
      text: '#ffffff',
      muted: 'rgba(255, 255, 255, 0.64)',
      brand: '#ffffff',
      accent: '#c8f31d',
      swatch: '#181818',
    },
    {
      id: 'teal',
      name: 'Esmeralda',
      outerBg: '#4f7d76',
      cardBg: '#62938b',
      text: '#102421',
      muted: 'rgba(16, 36, 33, 0.72)',
      brand: '#102421',
      accent: '#102421',
      swatch: '#62938b',
    },
    {
      id: 'paper',
      name: 'Editorial',
      outerBg: '#d8d8d4',
      cardBg: '#f5f5f2',
      text: '#0d0d0d',
      muted: 'rgba(13, 13, 13, 0.6)',
      brand: '#0d0d0d',
      accent: '#0d0d0d',
      swatch: '#f5f5f2',
    },
  ];

  let pillEl = null;
  let modalEl = null;
  let canvasEl = null;
  let currentTheme = THEMES[0];
  let currentFormat = 'square'; // 'square' (1080x1080) | 'story' (1080x1920)
  let currentQuote = '';
  let currentMeta = null;
  let activeGetMeta = null;
  let activeContainer = null;
  let listenersBound = false;

  function loadImg(src) {
    return new Promise((resolve) => {
      if (!src) return resolve(null);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function wrapLines(ctx, text, maxWidth) {
    const words = String(text || '').trim().split(/\s+/);
    const lines = [];
    let current = '';
    for (const word of words) {
      const test = current ? current + ' ' + word : word;
      if (ctx.measureText(test).width <= maxWidth) {
        current = test;
      } else {
        if (current) lines.push(current);
        // Handle ultra-long single words gracefully
        if (ctx.measureText(word).width > maxWidth) {
          let chunk = '';
          for (const ch of word) {
            if (ctx.measureText(chunk + ch).width > maxWidth) {
              lines.push(chunk);
              chunk = ch;
            } else {
              chunk += ch;
            }
          }
          current = chunk;
        } else {
          current = word;
        }
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  async function renderCardCanvas() {
    if (!canvasEl || !currentMeta) return;
    const isStory = currentFormat === 'story';
    const W = 1080;
    const H = isStory ? 1920 : 1080;
    canvasEl.width = W;
    canvasEl.height = H;

    const ctx = canvasEl.getContext('2d');
    const theme = currentTheme;

    // 1. Outer background
    ctx.fillStyle = theme.outerBg;
    ctx.fillRect(0, 0, W, H);

    // Subtle radial glow on noir theme
    if (theme.id === 'noir') {
      const grad = ctx.createRadialGradient(W * 0.5, H * 0.35, 80, W * 0.5, H * 0.5, W * 0.75);
      grad.addColorStop(0, 'rgba(200, 243, 29, 0.14)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // 2. Measure quote to dynamically size the inner Spotify-style card
    const cardMarginX = 96;
    const cardW = W - cardMarginX * 2;
    const padX = 72;
    const padTop = 68;
    const padBottom = 64;
    const innerW = cardW - padX * 2;

    const quoteLen = currentQuote.length;
    let fontSize = 56;
    if (quoteLen > 240) fontSize = 38;
    else if (quoteLen > 170) fontSize = 44;
    else if (quoteLen > 110) fontSize = 49;
    const lineHeight = Math.round(fontSize * 1.24);

    ctx.font = `800 ${fontSize}px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    const quoteLines = wrapLines(ctx, currentQuote, innerW).slice(0, isStory ? 14 : 9);

    const headerH = 112;
    const gapHeaderToQuote = 58;
    const quoteBlockH = quoteLines.length * lineHeight;
    const gapQuoteToFooter = 68;
    const footerH = 56;
    const minCardH = isStory ? 760 : 620;
    const maxCardH = isStory ? 1440 : 880;
    const cardH = Math.max(
      minCardH,
      Math.min(maxCardH, padTop + headerH + gapHeaderToQuote + quoteBlockH + gapQuoteToFooter + footerH + padBottom)
    );
    const cardX = cardMarginX;
    const cardY = Math.round((H - cardH) / 2);

    // 3. Draw inner card with soft elevation
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.24)';
    ctx.shadowBlur = 48;
    ctx.shadowOffsetY = 20;
    roundRect(ctx, cardX, cardY, cardW, cardH, 44);
    ctx.fillStyle = theme.cardBg;
    ctx.fill();
    ctx.restore();

    if (theme.id === 'noir') {
      roundRect(ctx, cardX, cardY, cardW, cardH, 44);
      ctx.strokeStyle = 'rgba(200, 243, 29, 0.35)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // 4. Card Header: Cover thumb + Title + Theme/Author
    const thumbSize = 96;
    const thumbX = cardX + padX;
    const thumbY = cardY + padTop;

    const coverImg = (await loadImg(currentMeta.coverUrl)) || (await loadImg('/imag/IMG_0259.PNG'));
    ctx.save();
    roundRect(ctx, thumbX, thumbY, thumbSize, thumbSize, 16);
    ctx.clip();
    if (coverImg) {
      const ratio = Math.max(thumbSize / coverImg.width, thumbSize / coverImg.height);
      const dw = coverImg.width * ratio;
      const dh = coverImg.height * ratio;
      ctx.drawImage(coverImg, thumbX + (thumbSize - dw) / 2, thumbY + (thumbSize - dh) / 2, dw, dh);
    } else {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(thumbX, thumbY, thumbSize, thumbSize);
      ctx.fillStyle = '#c8f31d';
      ctx.font = '800 42px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('A.', thumbX + thumbSize / 2, thumbY + thumbSize / 2);
    }
    ctx.restore();

    const metaX = thumbX + thumbSize + 28;
    const metaMaxW = cardX + cardW - padX - metaX;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = theme.text;
    ctx.font = '800 32px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const titleLines = wrapLines(ctx, (currentMeta.title || 'agustinst.code').toUpperCase(), metaMaxW).slice(0, 2);
    titleLines.forEach((line, idx) => {
      ctx.fillText(line, metaX, thumbY + 8 + idx * 38);
    });

    ctx.fillStyle = theme.muted;
    ctx.font = '500 26px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const subY = thumbY + 14 + titleLines.length * 38;
    const subText = wrapLines(ctx, currentMeta.subtitle || 'Agustín Stoppello', metaMaxW)[0] || '';
    ctx.fillText(subText, metaX, subY);

    // 5. Quote body (centered vertically in available middle space)
    const contentTop = thumbY + headerH + 30;
    const footerY = cardY + cardH - padBottom - footerH;
    const availH = footerY - contentTop;
    const startQuoteY = contentTop + Math.max(12, Math.round((availH - quoteBlockH) / 2));

    ctx.fillStyle = theme.text;
    ctx.font = `800 ${fontSize}px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textBaseline = 'top';
    quoteLines.forEach((line, idx) => {
      ctx.fillText(line, cardX + padX, startQuoteY + idx * lineHeight);
    });

    // 6. Card Footer: Brand mark + agustinst.code + page path
    const brandY = footerY + Math.round(footerH / 2);
    const dotR = 12;
    ctx.beginPath();
    ctx.arc(cardX + padX + dotR, brandY, dotR, 0, Math.PI * 2);
    ctx.fillStyle = theme.accent;
    ctx.fill();

    ctx.fillStyle = theme.brand;
    ctx.font = '800 30px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('agustinst.code', cardX + padX + dotR * 2 + 16, brandY);

    const routeBadge = currentMeta.type === 'project' ? '/proyectos' : '/blog';
    ctx.fillStyle = theme.muted;
    ctx.font = '600 24px "JetBrains Mono", Consolas, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(routeBadge, cardX + cardW - padX, brandY);
  }

  function ensureUI() {
    if (!pillEl) {
      pillEl = document.createElement('button');
      pillEl.type = 'button';
      pillEl.className = 'quote-share-pill';
      pillEl.id = 'quote-share-pill';
      pillEl.innerHTML = '<span aria-hidden="true">&#10022;</span> Compartir frase';
      pillEl.addEventListener('mousedown', (e) => e.preventDefault());
      pillEl.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (currentQuote) openQuoteModal(currentQuote);
      });
      document.body.appendChild(pillEl);
    }

    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.className = 'quote-modal-backdrop';
      modalEl.id = 'quote-share-modal';
      modalEl.innerHTML = `
        <div class="quote-modal" role="dialog" aria-modal="true" aria-label="Compartir frase">
          <div class="quote-modal-head">
            <div>
              <span class="quote-modal-eyebrow">TARJETA COMPARTIBLE</span>
              <h3>Compartir frase</h3>
            </div>
            <button type="button" class="brand-works-close" id="quote-modal-close" aria-label="Cerrar">&times;</button>
          </div>
          <div class="quote-preview-stage">
            <canvas id="quote-share-canvas"></canvas>
          </div>
          <div class="quote-controls-row">
            <div class="quote-swatches" id="quote-swatches" aria-label="Color de tarjeta"></div>
            <div class="quote-format-toggle" role="group" aria-label="Formato">
              <button type="button" class="quote-fmt-btn active" data-fmt="square">Post 1:1</button>
              <button type="button" class="quote-fmt-btn" data-fmt="story">Story 9:16</button>
            </div>
          </div>
          <div class="quote-modal-actions">
            <button type="button" class="btn btn-accent btn-sm" id="quote-btn-share">Compartir imagen</button>
            <button type="button" class="btn btn-ghost btn-sm" id="quote-btn-download">Descargar PNG</button>
            <button type="button" class="btn btn-ghost btn-sm" id="quote-btn-copy">Copiar cita + link</button>
          </div>
        </div>
      `;
      document.body.appendChild(modalEl);

      canvasEl = modalEl.querySelector('#quote-share-canvas');

      // Render theme swatches
      const swatchesEl = modalEl.querySelector('#quote-swatches');
      THEMES.forEach((t, idx) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'quote-swatch' + (idx === 0 ? ' active' : '');
        b.style.backgroundColor = t.swatch;
        b.title = t.name;
        b.setAttribute('aria-label', t.name);
        b.addEventListener('click', () => {
          currentTheme = t;
          swatchesEl.querySelectorAll('.quote-swatch').forEach((s) => s.classList.toggle('active', s === b));
          renderCardCanvas();
        });
        swatchesEl.appendChild(b);
      });

      // Format buttons
      modalEl.querySelectorAll('.quote-fmt-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          currentFormat = btn.dataset.fmt;
          modalEl.querySelectorAll('.quote-fmt-btn').forEach((b) => b.classList.toggle('active', b === btn));
          renderCardCanvas();
        });
      });

      modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) closeQuoteModal();
      });
      modalEl.querySelector('#quote-modal-close').addEventListener('click', closeQuoteModal);

      modalEl.querySelector('#quote-btn-download').addEventListener('click', downloadPng);
      modalEl.querySelector('#quote-btn-share').addEventListener('click', sharePng);
      modalEl.querySelector('#quote-btn-copy').addEventListener('click', copyQuoteAndLink);

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalEl.classList.contains('open')) closeQuoteModal();
      });
    }
  }

  function buildDeepLink() {
    const base = (currentMeta && currentMeta.url) || global.location.href;
    const cleanBase = base.split('#')[0];
    const snippet = encodeURIComponent(currentQuote.slice(0, 120));
    return `${cleanBase}#:~:text=${snippet}`;
  }

  function canvasToBlob() {
    return new Promise((resolve) => canvasEl.toBlob((blob) => resolve(blob), 'image/png'));
  }

  async function downloadPng() {
    const blob = await canvasToBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug = String((currentMeta && currentMeta.title) || 'frase')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
    a.href = url;
    a.download = `agustinst-${slug || 'cita'}-${currentFormat}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function sharePng() {
    const btn = modalEl.querySelector('#quote-btn-share');
    const blob = await canvasToBlob();
    if (!blob) return;

    const file = new File([blob], 'agustinst-cita.png', { type: 'image/png' });
    const shareText = `“${currentQuote}” — ${currentMeta.title} · agustinst.code`;
    const shareUrl = buildDeepLink();

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: currentMeta.title || 'agustinst.code',
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }

    // Fallback on desktop: download PNG + copy link
    await downloadPng();
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = '✓ PNG descargado';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    }
  }

  async function copyQuoteAndLink() {
    const btn = modalEl.querySelector('#quote-btn-copy');
    const text = `“${currentQuote}”\n— ${currentMeta.title} (agustinst.code)\n${buildDeepLink()}`;
    try {
      await navigator.clipboard.writeText(text);
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = '✓ Copiado';
        setTimeout(() => { btn.textContent = orig; }, 2000);
      }
    } catch {}
  }

  function openQuoteModal(quote) {
    ensureUI();
    currentQuote = quote;
    currentMeta = activeGetMeta ? activeGetMeta() : { title: document.title, subtitle: 'agustinst.code', url: global.location.href };
    hidePill();
    modalEl.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderCardCanvas();
  }

  function closeQuoteModal() {
    if (!modalEl) return;
    modalEl.classList.remove('open');
    document.body.style.overflow = '';
  }

  function hidePill() {
    if (pillEl) pillEl.classList.remove('show');
  }

  function checkSelection() {
    if (!activeContainer || !pillEl) return;
    const sel = global.getSelection ? global.getSelection() : null;
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      hidePill();
      return;
    }

    const range = sel.getRangeAt(0);
    if (!activeContainer.contains(range.commonAncestorContainer)) {
      hidePill();
      return;
    }

    const text = sel.toString().replace(/\s+/g, ' ').trim();
    if (text.length < 8 || text.length > 360) {
      hidePill();
      return;
    }

    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      hidePill();
      return;
    }

    currentQuote = text;
    const pillW = 166;
    const left = Math.max(12, Math.min(global.innerWidth - pillW - 12, rect.left + rect.width / 2 - pillW / 2));
    const preferTop = rect.top > 72;
    const top = preferTop ? rect.top - 48 : rect.bottom + 12;

    pillEl.style.left = `${Math.round(left)}px`;
    pillEl.style.top = `${Math.round(Math.max(12, Math.min(global.innerHeight - 52, top)))}px`;
    pillEl.classList.add('show');
  }

  function initQuoteShare({ container, getMeta }) {
    ensureUI();
    activeContainer = container;
    activeGetMeta = getMeta;

    if (!listenersBound) {
      listenersBound = true;
      let selTimer = null;
      const scheduleCheck = () => {
        clearTimeout(selTimer);
        selTimer = setTimeout(checkSelection, 90);
      };
      document.addEventListener('mouseup', scheduleCheck);
      document.addEventListener('touchend', scheduleCheck, { passive: true });
      document.addEventListener('selectionchange', scheduleCheck);
      global.addEventListener('scroll', hidePill, { passive: true });
    }
  }

  global.initQuoteShare = initQuoteShare;
})(window);
