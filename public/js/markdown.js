/**
 * Lightweight, XSS-safe Markdown renderer for agustinst.code
 * Supports: headings (##, ###), bold, italic, inline code, fenced code blocks,
 * blockquotes, unordered/ordered lists, links, images, and paragraphs.
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
    return out;
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
        html.push(`<p>${renderInline(paraBuf.join('<br>'))}</p>`);
        paraBuf = [];
      }
    }

    function flushList() {
      if (listType) {
        html.push(`</${listType}>`);
        listType = null;
      }
    }

    for (const rawLine of lines) {
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

      if (line.startsWith('### ')) {
        flushPara();
        flushList();
        html.push(`<h3>${renderInline(line.slice(4))}</h3>`);
        continue;
      }
      if (line.startsWith('## ')) {
        flushPara();
        flushList();
        html.push(`<h2>${renderInline(line.slice(3))}</h2>`);
        continue;
      }
      if (line.startsWith('# ')) {
        flushPara();
        flushList();
        html.push(`<h2>${renderInline(line.slice(2))}</h2>`);
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

  function readingTime(md) {
    const words = String(md || '').trim().split(/\s+/).filter(Boolean).length;
    const mins = Math.max(1, Math.round(words / 200));
    return { words, mins };
  }

  global.renderMarkdown = renderMarkdown;
  global.readingTime = readingTime;
})(window);
