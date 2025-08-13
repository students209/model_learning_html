// Fetch helpers
export async function fetchJSON(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

export async function fetchText(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.text();
}

// DOM helpers
export function qs(sel, root = document) { return root.querySelector(sel); }
export function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  const entries = Object.entries(props || {});
  // set attributes for data-*; set properties for others
  for (const [k, v] of entries) {
    if (k.startsWith('data-')) {
      node.setAttribute(k, String(v));
    } else {
      node[k] = v;
    }
  }
  for (const child of children) node.append(child);
  return node;
}

// Simple in-page filter/highlight
export function filterAndHighlight(container, keyword) {
  const text = keyword.trim().toLowerCase();
  const items = qsa('[data-filter-item]', container);
  if (!text) {
    items.forEach(n => { n.classList.remove('hidden'); clearHighlights(n); });
    return { visible: items.length, total: items.length };
  }
  let visible = 0;
  items.forEach(n => {
    const hay = (n.getAttribute('data-filter-key') || n.textContent || '').toLowerCase();
    const matched = hay.includes(text);
    n.classList.toggle('hidden', !matched);
    clearHighlights(n);
    if (matched) { visible++; highlightText(n, keyword); }
  });
  return { visible, total: items.length };
}

export function highlightText(node, keyword) {
  if (!keyword) return;
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
  const parts = [];
  while (walker.nextNode()) parts.push(walker.currentNode);
  for (const textNode of parts) {
    const val = textNode.nodeValue;
    if (!val) continue;
    const idx = val.toLowerCase().indexOf(keyword.toLowerCase());
    if (idx >= 0) {
      const before = val.slice(0, idx);
      const match = val.slice(idx, idx + keyword.length);
      const after = val.slice(idx + keyword.length);
      const span = document.createElement('span');
      span.append(before, Object.assign(document.createElement('mark'), { className: 'highlight', textContent: match }), after);
      textNode.replaceWith(span);
    }
  }
}

export function clearHighlights(node) {
  qsa('mark.highlight', node).forEach(m => m.replaceWith(m.textContent || ''));
}

// Simple back button
export function installBackButton() {
  const backBtn = qs('[data-back]');
  if (backBtn) backBtn.addEventListener('click', () => history.back());
}

// Lightweight Markdown to HTML (headings, lists, code blocks, bold, italic, inline code, paragraphs)
export function renderMarkdown(md) {
  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  const lines = md.split(/\r?\n/);
  let html = '';
  let inCode = false;
  let listMode = false;

  function closeList() {
    if (listMode) { html += '</ul>'; listMode = false; }
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    // code fence
    if (/^```/.test(raw)) {
      if (!inCode) { closeList(); html += '<pre><code>'; inCode = true; }
      else { html += '</code></pre>'; inCode = false; }
      continue;
    }
    if (inCode) { html += escapeHtml(raw) + '\n'; continue; }

    // heading
    const hm = raw.match(/^(#{1,6})\s*(.*)$/);
    if (hm) {
      closeList();
      const level = hm[1].length;
      const text = hm[2].trim();
      html += `<h${level}>${inline(text)}</h${level}>`;
      continue;
    }

    // list item
    const lm = raw.match(/^\s*[-*+]\s+(.+)$/);
    if (lm) {
      if (!listMode) { html += '<ul>'; listMode = true; }
      html += `<li>${inline(lm[1].trim())}</li>`;
      continue;
    }

    // empty line
    if (!raw.trim()) { closeList(); html += ''; continue; }

    // paragraph
    closeList();
    html += `<p>${inline(raw.trim())}</p>`;
  }
  closeList();

  const wrapper = document.createElement('div');
  wrapper.className = 'markdown-body';
  wrapper.innerHTML = html;
  return wrapper;

  function inline(text) {
    // inline code
    text = text.replace(/`([^`]+)`/g, (_, g1) => `<code>${escapeHtml(g1)}</code>`);
    // bold
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // italic
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return text;
  }
}

// Live reload for local docs: poll Last-Modified/ETag (fallback to content hash)
export function installLiveReload(urls = [], options = {}) {
  const intervalMs = Number(options.interval || 3000);
  const onChange = typeof options.onChange === 'function' ? options.onChange : () => location.reload();
  const list = Array.from(new Set((urls || []).filter(Boolean)));
  if (!list.length) return () => {};

  let timer = 0;
  const signatures = new Map();

  async function headSignature(url) {
    try {
      const res = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
      if (!res.ok) throw new Error('HEAD not ok');
      const etag = res.headers.get('etag') || '';
      const lm = res.headers.get('last-modified') || '';
      const len = res.headers.get('content-length') || '';
      const sig = [etag, lm, len].filter(Boolean).join('|');
      if (sig) return sig;
    } catch {}
    // Fallback: GET and build a light signature
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('GET not ok');
      const text = await res.text();
      // Prefer crypto hash when available
      if (globalThis.crypto?.subtle) {
        const data = new TextEncoder().encode(text);
        const buf = await crypto.subtle.digest('SHA-1', data);
        const b = Array.from(new Uint8Array(buf)).map(x => x.toString(16).padStart(2, '0')).join('');
        return `sha1:${b}`;
      }
      return `len:${text.length}|head:${text.slice(0, 64)}`;
    } catch {
      return '';
    }
  }

  async function tick() {
    try {
      for (const url of list) {
        const sig = await headSignature(url);
        if (!sig) continue;
        const prev = signatures.get(url);
        if (prev && prev !== sig) {
          clearInterval(timer);
          onChange();
          return;
        }
        signatures.set(url, sig);
      }
    } catch {}
  }

  // Prime once, then start interval
  tick();
  timer = setInterval(tick, intervalMs);
  return () => clearInterval(timer);
}
