/**
 * Lightweight, XSS-safe Markdown renderer for agustinst.code
 * Supports: GFM tables (with alignment), headings (##, ###), bold, italic,
 * inline code, fenced code blocks, blockquotes, ul/ol lists, hr, links, images, paragraphs.
 */
(function (global) {
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function safeUrl(url) {
    const trimmed = String(url || '').trim();
    if (/^(https?:\/\/|\/|mailto:)/i.test(trimmed)) return trimmed;
    return '#';
  }

  function renderInline(text) {
    let out = escapeHtml(text);
    // Inline code
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Images ![alt](url)
    out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
      return `<img src="${safeUrl(url)}" alt="${alt}" loading="lazy">`;
    });
    // Links [label](url)
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
      const href = safeUrl(url);
      const ext = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${href}"${ext}>${label}</a>`;
    });
    // Bold & Italic
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // Allow explicit <br> tags (common inside Markdown tables and prose)
    out = out.replace(/&lt;br\s*\/?&gt;/gi, '<br>');
    return out;
  }

  function splitTableRow(line) {
    let trimmed = line.trim();
    if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
    if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
    return trimmed.split('|').map((cell) => cell.trim());
  }

  function isTableSeparator(line) {
    if (!line || !line.includes('|') && !/^\s*:?-{3,}:?\s*$/.test(line)) return false;
    const cells = splitTableRow(line);
    if (cells.length === 0) return false;
    return cells.every((c) => /^:?-{3,}:?$/.test(c));
  }

  function parseAlignments(sepLine) {
    return splitTableRow(sepLine).map((c) => {
      if (c.startsWith(':') && c.endsWith(':')) return 'center';
      if (c.endsWith(':')) return 'right';
      return 'left';
    });
  }

  function slugifyHeading(text) {
    return (
      'sec-' +
      String(text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'sec-item'
    );
  }

  function renderMarkdown(md) {
    if (!md || !String(md).trim()) return '';

    const lines = String(md).replace(/\r\n/g, '\n').split('\n');
    const html = [];
    let inCode = false;
    let codeBuf = [];
    let listType = null;
    let paraBuf = [];

    function flushPara() {
      if (paraBuf.length) {
        html.push(`<p>${paraBuf.map(renderInline).join('<br>')}</p>`);
        paraBuf = [];
      }
    }

    function flushList() {
      if (listType) {
        html.push(`</${listType}>`);
        listType = null;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];

      if (rawLine.trim().startsWith('```')) {
        flushPara();
        flushList();
        if (!inCode) {
          inCode = true;
          codeBuf = [];
        } else {
          html.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
          inCode = false;
          codeBuf = [];
        }
        continue;
      }

      if (inCode) {
        codeBuf.push(rawLine);
        continue;
      }

      const line = rawLine.trim();
      if (!line) {
        flushPara();
        flushList();
        continue;
      }

      // GFM Table: current line has pipes AND next line is a valid separator row
      if (line.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
        flushPara();
        flushList();

        const headers = splitTableRow(line);
        const aligns = parseAlignments(lines[i + 1]);
        i += 2;

        const bodyRows = [];
        while (i < lines.length && lines[i].trim() && lines[i].includes('|')) {
          bodyRows.push(splitTableRow(lines[i]));
          i++;
        }
        i--; // compensate for loop increment

        const thead = headers
          .map((h, idx) => `<th style="text-align:${aligns[idx] || 'left'}">${renderInline(h)}</th>`)
          .join('');

        const tbody = bodyRows
          .map((row) => {
            const cells = headers
              .map((_, idx) => `<td style="text-align:${aligns[idx] || 'left'}">${renderInline(row[idx] || '')}</td>`)
              .join('');
            return `<tr>${cells}</tr>`;
          })
          .join('');

        html.push(
          `<div class="prose-table-wrap"><table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table></div>`
        );
        continue;
      }

      if (/^[-*_]{3,}$/.test(line)) {
        flushPara();
        flushList();
        html.push('<hr>');
        continue;
      }

      // Standalone image line -> render as clean <figure> with optional caption
      const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imgMatch) {
        flushPara();
        flushList();
        const alt = escapeHtml(imgMatch[1]);
        const src = safeUrl(imgMatch[2]);
        const caption = alt ? `<figcaption>${alt}</figcaption>` : '';
        html.push(`<figure class="prose-figure"><img src="${src}" alt="${alt}" loading="lazy">${caption}</figure>`);
        continue;
      }

      if (line.startsWith('### ')) {
        flushPara();
        flushList();
        html.push(`<h3>${renderInline(line.slice(4))}</h3>`);
        continue;
      }
      if (line.startsWith('## ')) {
        flushPara();
        flushList();
        const headingText = line.slice(3);
        const slug = slugifyHeading(headingText);
        html.push(`<h2 id="${slug}">${renderInline(headingText)}</h2>`);
        continue;
      }
      if (line.startsWith('# ')) {
        flushPara();
        flushList();
        const headingText = line.slice(2);
        const slug = slugifyHeading(headingText);
        html.push(`<h2 id="${slug}">${renderInline(headingText)}</h2>`);
        continue;
      }
      if (line.startsWith('> ')) {
        flushPara();
        flushList();
        html.push(`<blockquote>${renderInline(line.slice(2))}</blockquote>`);
        continue;
      }
      if (/^[-*]\s+/.test(line)) {
        flushPara();
        if (listType !== 'ul') {
          flushList();
          html.push('<ul>');
          listType = 'ul';
        }
        html.push(`<li>${renderInline(line.replace(/^[-*]\s+/, ''))}</li>`);
        continue;
      }
      if (/^\d+\.\s+/.test(line)) {
        flushPara();
        if (listType !== 'ol') {
          flushList();
          html.push('<ol>');
          listType = 'ol';
        }
        html.push(`<li>${renderInline(line.replace(/^\d+\.\s+/, ''))}</li>`);
        continue;
      }

      flushList();
      paraBuf.push(line);
    }

    flushPara();
    flushList();
    if (inCode && codeBuf.length) {
      html.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
    }

    return html.join('\n');
  }

  function renderToc(md) {
    if (!md) return '';
    const lines = String(md).replace(/\r\n/g, '\n').split('\n');
    let inCode = false;
    const headings = [];

    for (const raw of lines) {
      const line = raw.trim();
      if (line.startsWith('```')) {
        inCode = !inCode;
        continue;
      }
      if (inCode) continue;
      if (line.startsWith('## ')) {
        const text = line.slice(3).trim();
        if (text) headings.push({ text, id: slugifyHeading(text) });
      } else if (line.startsWith('# ')) {
        const text = line.slice(2).trim();
        if (text) headings.push({ text, id: slugifyHeading(text) });
      }
    }

    if (headings.length < 2) return '';

    const items = headings
      .map(
        (h, idx) =>
          `<a class="prose-toc-link" href="#${h.id}"><span>0${idx + 1}</span>${escapeHtml(h.text)}</a>`
      )
      .join('');

    return `
      <nav class="prose-toc" aria-label="Contenido">
        <span class="prose-toc-title">EN ESTE CONTENIDO</span>
        <div class="prose-toc-links">${items}</div>
      </nav>`;
  }

  function readingTime(md) {
    const words = String(md || '').trim().split(/\s+/).filter(Boolean).length;
    const mins = Math.max(1, Math.round(words / 200));
    return { words, mins };
  }

  function initTocScrollSpy(tocRoot, contentRoot, scrollContainer) {
    if (!tocRoot || !contentRoot) return function () {};
    const links = Array.from(tocRoot.querySelectorAll('.prose-toc-link'));
    if (!links.length) return function () {};

    const items = links
      .map((link) => {
        const id = (link.getAttribute('href') || '').replace(/^#/, '');
        const heading = id ? contentRoot.querySelector('#' + CSS.escape(id)) : null;
        return heading ? { id, link, heading } : null;
      })
      .filter(Boolean);

    if (!items.length) return function () {};

    const isWindow = !scrollContainer || scrollContainer === window;
    const target = isWindow ? window : scrollContainer;
    const offset = isWindow ? 140 : 96;

    function setActive(activeId) {
      for (const item of items) {
        const active = item.id === activeId;
        item.link.classList.toggle('is-active', active);
        if (active) {
          item.link.setAttribute('aria-current', 'true');
        } else {
          item.link.removeAttribute('aria-current');
        }
      }
    }

    function update() {
      const containerTop = isWindow ? 0 : scrollContainer.getBoundingClientRect().top;
      let activeId = items[0].id;

      // If scrolled near the bottom, highlight the last section
      const nearBottom = isWindow
        ? window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 24
        : scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 24;

      if (nearBottom) {
        activeId = items[items.length - 1].id;
      } else {
        for (const item of items) {
          const relTop = item.heading.getBoundingClientRect().top - containerTop;
          if (relTop <= offset) {
            activeId = item.id;
          } else {
            break;
          }
        }
      }
      setActive(activeId);
    }

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        update();
      });
    }

    function onClick(e) {
      const link = e.target.closest('.prose-toc-link');
      if (!link) return;
      const id = (link.getAttribute('href') || '').replace(/^#/, '');
      const match = items.find((it) => it.id === id);
      if (!match) return;
      e.preventDefault();
      if (isWindow) {
        const y = match.heading.getBoundingClientRect().top + window.scrollY - 96;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      } else {
        const containerTop = scrollContainer.getBoundingClientRect().top;
        const delta = match.heading.getBoundingClientRect().top - containerTop;
        scrollContainer.scrollTo({
          top: Math.max(0, scrollContainer.scrollTop + delta - 28),
          behavior: 'smooth',
        });
      }
      setActive(id);
    }

    target.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    tocRoot.addEventListener('click', onClick);
    update();

    return function cleanup() {
      target.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      tocRoot.removeEventListener('click', onClick);
    };
  }

  global.renderMarkdown = renderMarkdown;
  global.renderToc = renderToc;
  global.readingTime = readingTime;
  global.initTocScrollSpy = initTocScrollSpy;
})(window);
