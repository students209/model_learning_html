import { qs, qsa, el, fetchJSON, fetchText, filterAndHighlight, installBackButton } from './utils.js';

// Local lightweight Markdown renderer to avoid import mismatch issues
function renderMarkdown(md) {
  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  const lines = md.split(/\r?\n/);
  let html = '';

  // State for code handling
  let inFence = false; // currently parsing within ``` ... ```
  let fenceLang = '';
  let inIndent = false; // currently parsing within indented code block
  let prevBlank = true;

  // State for merging code blocks
  let combinedCodeOpen = false;
  let combinedLang = '';

  // State for lists
  let listStack = []; // stack of 'ul' or 'ol'

  function openCombined(lang) {
    if (!combinedCodeOpen) {
      html += `<pre><code${lang ? ` class=\"language-${lang}\"` : ''}>`;
      combinedCodeOpen = true;
      combinedLang = lang || '';
    }
  }
  function appendCodeLine(text) { html += escapeHtml(text) + '\n'; }
  function closeCombined() {
    if (combinedCodeOpen) {
      html += '</code></pre>';
      combinedCodeOpen = false;
      combinedLang = '';
    }
  }

  function closeAllLists() {
    // Close every open list to avoid headings/paragraphs being nested inside lists
    while (listStack.length > 0) {
      const last = listStack.pop();
      html += last === 'ol' ? '</ol>' : '</ul>';
    }
  }

  function ensureList(type, indentLevel) {
    // Desired depth includes current level container
    const desiredDepth = indentLevel + 1;
    // Close deeper lists
    while (listStack.length > desiredDepth) {
      const last = listStack.pop();
      html += last === 'ol' ? '</ol>' : '</ul>';
    }
    // Open missing lists using current type
    while (listStack.length < desiredDepth) {
      html += type === 'ol' ? '<ol>' : '<ul>';
      listStack.push(type);
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];

    // tolerate up to 3 leading spaces for fenced code markers
    const lineForFence = raw.replace(/^\s{0,3}/, '');

    // 1) fenced code markers
    const fence = lineForFence.match(/^```\s*([A-Za-z0-9_+-]+)?\s*$/);
    if (fence) {
      if (!inFence) {
        // opening fence
        closeAllLists();
        inFence = true;
        fenceLang = fence[1] ? String(fence[1]).toLowerCase() : '';
        // start/continue combined code block
        openCombined(fenceLang || combinedLang);
      } else {
        // closing fence — keep combined block open to allow merging
        inFence = false;
        fenceLang = '';
      }
      prevBlank = false;
      continue;
    }

    if (inFence) { // inside fenced block content
      appendCodeLine(raw);
      prevBlank = false;
      continue;
    }

    // 2) Indented code (4+ spaces or tab) — keep combined block open across segments
    const indentMatch = raw.match(/^(\t|\s{4,})(.*)$/);
    if (inIndent) {
      if (indentMatch) {
        appendCodeLine(indentMatch[2]);
        prevBlank = false;
        continue;
      }
      // leaving indented block — do NOT close combined block; just stop indented mode and reprocess this line
      inIndent = false;
      // no continue here; fall through to normal processing for current line
    }

    // Start new indented block only if previous is blank (Markdown rule)
    if (indentMatch && prevBlank && !inFence) {
      closeAllLists();
      openCombined(combinedLang);
      inIndent = true;
      appendCodeLine(indentMatch[2]);
      prevBlank = false;
      continue;
    }

    // 3) headings
    const hm = raw.match(/^(#{1,6})\s*(.*)$/);
    if (hm) {
      closeCombined();
      closeAllLists();
      const level = hm[1].length;
      const text = hm[2].trim();
      html += `<h${level}>${inline(text)}</h${level}>`;
      prevBlank = false;
      continue;
    }

    // 4) blockquote
    const bq = raw.match(/^>\s+(.*)$/);
    if (bq) {
      closeCombined();
      closeAllLists();
      html += `<blockquote>${inline(bq[1].trim())}</blockquote>`;
      prevBlank = false;
      continue;
    }

    // 5) unordered list items with nesting by 2-space units
    const lm = raw.match(/^(\s*)[-*+]\s+(.+)$/);
    if (lm) {
      closeCombined();
      const indentLevel = Math.floor(lm[1].length / 2); // 2 spaces = 1 nesting level
      ensureList('ul', indentLevel);
      html += `<li>${inline(lm[2].trim())}</li>`;
      prevBlank = false;
      continue;
    }

    // 6) ordered list items
    const om = raw.match(/^(\s*)\d+\.\s+(.+)$/);
    if (om) {
      closeCombined();
      const indentLevel = Math.floor(om[1].length / 2);
      ensureList('ol', indentLevel);
      html += `<li>${inline(om[2].trim())}</li>`;
      prevBlank = false;
      continue;
    }

    // 7) blank line
    if (!raw.trim()) {
      // blank inside combined code should be preserved
      if (combinedCodeOpen) appendCodeLine('');
      prevBlank = true;
      continue;
    }

    // 8) normal paragraph
    closeCombined();
    closeAllLists();
    html += `<p>${inline(raw.trim())}</p>`;
    prevBlank = false;
  }

  // close any remaining structures
  closeCombined();
  closeAllLists();

  const wrapper = document.createElement('div');
  wrapper.className = 'markdown-body';
  wrapper.innerHTML = html;
  return wrapper;

  function inline(text) {
    text = text.replace(/`([^`]+)`/g, (_, g1) => `<code>${escapeHtml(g1)}</code>`);
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return text;
  }
}

function enhanceMarkdown(root) {
  // helper to sanitize fence markers inside code blocks
  function sanitizePre(pre) {
    const code = pre.querySelector('code');
    if (!code) return;
    const original = code.textContent || '';
    // remove any lines that are solely markdown fences like ``` or ```lang
    const cleaned = original.replace(/^\s*```[^\n]*\n?/gm, '').replace(/\n?\s*```\s*$/gm, '');
    if (cleaned !== original) code.textContent = cleaned;
  }

  // Add copy buttons to code blocks (default)
  const blocks = root.querySelectorAll('pre');
  blocks.forEach(pre => {
    sanitizePre(pre);
    if (pre.closest('.code-panel')) return; // will get toolbar instead
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.type = 'button';
    btn.textContent = '复制';
    btn.addEventListener('click', async () => {
      const code = pre.textContent || '';
      try { await navigator.clipboard.writeText(code); btn.textContent = '已复制'; setTimeout(() => (btn.textContent = '复制'), 1200); } catch {}
    });
    pre.appendChild(btn);
  });

  // Heading anchors
  root.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
    const text = (h.textContent || '').trim();
    const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/(^-|-$)/g, '');
    if (!h.id) h.id = id;
    // classify headings
    if (/^模型详情文档$/.test(text)) h.classList.add('md-top');
    if (/^第\s*[一二三四五六七八九十]+\s*步/.test(text)) h.classList.add('md-step');
  });

  // Step-4: wrap code blocks with a toolbar panel matching the reference
  const step4 = Array.from(root.querySelectorAll('h2, h3')).find(h => /^第\s*四\s*步/.test(h.textContent || ''));
  if (step4) {
    let node = step4.nextSibling;
    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE && /H[23]/.test(node.tagName)) break; // stop at next section
      if (node?.nodeType === Node.ELEMENT_NODE && node.tagName === 'PRE') {
        const pre = node;
        sanitizePre(pre);
        const code = pre.querySelector('code');
        const lang = (code?.className || '').match(/language-([a-z0-9_+-]+)/i)?.[1] || 'Code';
        const panel = document.createElement('div');
        panel.className = 'code-panel';
        const header = document.createElement('div');
        header.className = 'code-header';
        const left = document.createElement('div');
        left.className = 'code-lang';
        left.textContent = lang === 'code' ? '代码' : lang;
        const right = document.createElement('div');
        right.className = 'code-actions';
        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'btn-mini';
        copyBtn.textContent = '复制';
        copyBtn.addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(pre.textContent || ''); copyBtn.textContent = '已复制'; setTimeout(() => (copyBtn.textContent = '复制'), 1200); } catch {}
        });
        right.append(copyBtn);
        header.append(left, right);
        pre.replaceWith(panel);
        panel.append(header, pre);
        // remove default copy button if it exists
        panel.querySelectorAll('.copy-btn').forEach(b => b.remove());
      }
      node = node?.nextSibling || null;
    }
  }
}

export function renderHeader(active = '') {
  const header = el('div', { className: 'header' }, [
    el('nav', { className: 'nav' }, [
      link('/index.html', '首页', active === 'home'),
      link('/models/index.html', '模型列表', active === 'models'),
      link('/compare/index.html', '模型对比', active === 'compare'),
      link('/practice/detail.html', '模型实操', active === 'practice'),
      link('/metrics/index.html', '评估指标', active === 'metrics'),
      el('div', { className: 'spacer' }),
      el('div', { className: 'search' }, [
        el('input', { type: 'search', placeholder: '在本页搜索...', id: 'page-search' }),
        el('span', { className: 'hint' }, ['Enter'])
      ])
    ])
  ]);
  document.body.prepend(header);
}

function link(href, text, active) {
  const a = el('a', { href, textContent: text });
  if (active) a.style.color = '#fff';
  return a;
}

export function wirePageSearch(container = document) {
  const input = qs('#page-search');
  if (!input) return;
  const info = el('span', { style: 'margin-left:8px;color:#6b7280;font-size:12px;' });
  input.addEventListener('input', () => {
    const keyword = input.value;
    if (keyword && keyword.trim()) {
      qsa('.collapsible').forEach(n => n.classList.remove('collapsed'));
      qsa('.twisty', container).forEach(n => n.textContent = '▼');
    }
    const { visible, total } = filterAndHighlight(container, keyword);
    info.textContent = keyword ? (total ? `${visible}/${total}` : '') : '';
  });
  input.parentElement?.append(info);
}

function stripMd(text) {
  return (text || '').replace(/^#+\s+/, '')
    .replace(/^\*\*|\*\*$/g, '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .trim();
}

function extractNames(raw) {
  const t = raw.replace(/^模型[^：:]*[：:]/, '').replace(/^模型\/算法[^：:]*[：:]/, '').trim();
  const m = t.match(/^(.*?)\s*\((.*?)\)\s*$/);
  if (m) {
    return { zh: m[1].trim(), en: m[2].trim() };
  }
  return { zh: t.trim(), en: '' };
}

function buildTree(md) {
  const root = [];
  let currentCat = null;
  let lastModel = null;
  for (const line of md.split(/\r?\n/)) {
    if (!line.startsWith('#')) continue;
    const level = line.match(/^(#+)/)?.[1]?.length || 0;
    const title = stripMd(line);
    if (level === 3) {
      currentCat = { type: 'category', title, children: [] };
      root.push(currentCat);
      lastModel = null;
    } else if (level === 4) {
      const node = { type: 'model', title, children: [] };
      (currentCat?.children || root).push(node);
      lastModel = node;
    } else if (level === 5) {
      const node = { type: 'submodel', title };
      if (lastModel) lastModel.children.push(node); else (currentCat?.children || root).push(node);
    }
  }
  return root;
}

function findModelMeta(models, headingTitle) {
  const { zh, en } = extractNames(headingTitle);
  const byZh = models.find(m => (m.name || '').startsWith(zh));
  if (byZh) return byZh;
  if (en) {
    const enKey = en.split(',')[0].trim();
    const byEn = models.find(m => (m.name || '').toLowerCase().includes(enKey.toLowerCase()));
    if (byEn) return byEn;
  }
  return null;
}

function slugify(text) {
  const t = (text || '').toString().trim().toLowerCase();
  return t
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/(^-|-$)/g, '')
    || 'model';
}

// Build summary index from model_detail.md (cached)
let SUMMARY_INDEX_CACHE = null;
async function getSummaryIndex() {
  if (SUMMARY_INDEX_CACHE) return SUMMARY_INDEX_CACHE;
  const md = await fetchText('/docs/model_detail.md');
  const lines = md.split(/\r?\n/);
  const idx = {};
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^#{2,5}\s+/.test(line)) {
      const title = stripMd(line);
      current = extractNames(title).zh;
      continue;
    }
    if (current) {
      // Look for 问题类型定义 bullet as summary
      const m = line.match(/^\s*[-*]\s*\*\*?问题类型定义\*\*?[:：]\s*(.+?)\s*$/);
      if (m) {
        idx[current] = stripInlineMd(m[1]).trim();
        current = null; // summary found; move on
      }
    }
  }
  SUMMARY_INDEX_CACHE = idx;
  return idx;
}

// Helpers for auto-summarization
let DETAIL_MD_TEXT_CACHE = null;
async function getDetailMdText() {
  if (DETAIL_MD_TEXT_CACHE) return DETAIL_MD_TEXT_CACHE;
  DETAIL_MD_TEXT_CACHE = await fetchText('/docs/model_detail.md');
  return DETAIL_MD_TEXT_CACHE;
}

function stripInlineMd(text) {
  return (text || '')
    .replace(/`+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function makeOneLine(text, maxLen = 60) {
  const s = stripInlineMd(text);
  return s.length > maxLen ? s.slice(0, maxLen - 1) + '…' : s;
}

function isLabelOnly(text) {
  const s = stripInlineMd(text).replace(/[\s:：]+$/g, '').trim();
  if (!s) return true;
  // Common label-only phrases to skip
  const labels = ['核心思想', '核心思想与数学原理', '数学原理', '学习方法', '适用', '适用场景', '应用场景', '应用', '用途', '优点', '缺点'];
  return labels.some(l => s === l);
}

function firstMeaningfulFromBlock(blockLines, preferRegex, allowFallback = true) {
  for (const l of blockLines) {
    if (!l.trim()) continue;
    const bullet = l.match(/^\s*[-*]\s+(.+)$/);
    const body = bullet ? bullet[1] : l;
    const cleaned = stripInlineMd(body);
    if (!cleaned) continue;
    if (isLabelOnly(cleaned)) continue;
    if (/^(问题类型定义|优点|缺点|适用|应用场景)[:：]/.test(cleaned)) continue;
    if (preferRegex && !preferRegex.test(cleaned)) continue;
    return cleaned;
  }
  if (allowFallback) {
    // fallback: any non-label line
    for (const l of blockLines) {
      if (!l.trim()) continue;
      const bullet = l.match(/^\s*[-*]\s+(.+)$/);
      const body = bullet ? bullet[1] : l;
      const cleaned = stripInlineMd(body);
      if (!cleaned || isLabelOnly(cleaned)) continue;
      if (/^(问题类型定义|优点|缺点|适用|应用场景)[:：]/.test(cleaned)) continue;
      return cleaned;
    }
  }
  return '';
}

async function getAutoSummaries(names = []) {
  const md = await getDetailMdText();
  const map = {};

  function takeFirstSentence(text) {
    const s = stripInlineMd(text || '');
    const m = s.match(/^(.*?[。；.!?])/);
    return (m ? m[1] : s).trim();
  }

  function collectBlockAfterHeading(allLines, pattern) {
    const idx = allLines.findIndex(l => pattern.test(l));
    if (idx < 0) return [];
    const block = [];
    for (let i = idx + 1; i < allLines.length; i++) {
      const l = allLines[i];
      if (/^#{1,6}\s+/.test(l)) break;
      block.push(l);
    }
    return block;
  }

  for (const name of names) {
    if (!name || map[name]) continue;
    const section = extractMdSectionForModel(md, [name]);
    if (!section) continue;
    const lines = section.split(/\r?\n/);

    let problemType = '';
    let coreIdea = '';
    let scenarios = '';

    // A) 全局扫描“问题类型定义”
    for (const line of lines) {
      const m = line.match(/^\s*[-*]\s*\*\*?问题类型定义\*\*?[:：]\s*(.+)$/);
      if (m) { problemType = takeFirstSentence(m[1]); break; }
    }

    // B) “核心思想/数学原理”段落的首条要点或首句（跳过仅有标签的条目）
    if (!coreIdea) {
      const block = collectBlockAfterHeading(lines, /^#{1,6}\s+.*(核心思想|数学原理)/);
      const picked = firstMeaningfulFromBlock(block);
      if (picked) coreIdea = takeFirstSentence(picked);
    }

    // C) “适用场景/应用场景/应用/用途”（优先包含适用关键词的条目，且跳过“优点/缺点”等标签）
    if (!scenarios) {
      const block = collectBlockAfterHeading(lines, /^#{1,6}\s+.*(适用场景|应用场景|应用|用途)/);
      const prefer = /(适用|用于|常用于|可用于|应用于|适合)/;
      const picked = firstMeaningfulFromBlock(block, prefer, false); // 不匹配则不采用该块
      if (picked) scenarios = takeFirstSentence(picked);
    }
    // D) 若仍无场景，做全局关键词抽取
    if (!scenarios) {
      let cand = lines.find(l => /(适用场景|应用场景|适用|用于|常用于|可用于|应用于|适合)/.test(l) && !/(参数|超参数|alpha|beta|lambda|gamma)/i.test(l) && !/适用[:：]\s*[-*•]/.test(l));
      if (cand) {
        cand = cand.replace(/^\s*[-*]\s+/, '');
        const cleaned = stripInlineMd(cand);
        if (cleaned && !isLabelOnly(cleaned) && !/^(问题类型定义|优点|缺点)[:：]/.test(cleaned)) {
          scenarios = takeFirstSentence(cleaned);
        }
      }
    }

    // E) 若仍无核心思想，尝试“第二步/原理/工作原理”的首段
    if (!coreIdea) {
      const block = collectBlockAfterHeading(lines, /^#{1,6}\s+.*(第二步|原理|工作原理|怎么工作)/);
      const picked = firstMeaningfulFromBlock(block);
      if (picked) coreIdea = takeFirstSentence(picked);
    }

    function ensurePeriod(s) {
      if (!s) return '';
      const t = s.trim();
      return /[。！？!]$/.test(t) ? t : t + '。';
    }
    const parts = [];
    if (problemType) parts.push(ensurePeriod(problemType));
    if (coreIdea) parts.push(ensurePeriod(coreIdea));
    if (scenarios) parts.push(`适用：${ensurePeriod(scenarios)}`);
    let fused = parts.join(' ');
    if (fused) {
      fused = fused
        .replace(/\s+/g, ' ')
        .replace(/。+\s*。+/g, '。')
        .replace(/；+/g, '；')
        .replace(/(：|:)[\s]*(：|:)+/g, '：')
        .replace(/(。)\s*；/g, '$1')
        .replace(/；\s*(。)/g, '$1')
        .replace(/\*\s*/g, '')
        .replace(/[\s；]*$/g, '')
        .trim();
      map[name] = makeOneLine(fused, 150);
    }
  }
  return map;
}

// Summaries from model_summery.md (preferred for model list)
let MODEL_SUMMARY_DOC_CACHE = null;
async function getSummariesFromDoc() {
  if (MODEL_SUMMARY_DOC_CACHE) return MODEL_SUMMARY_DOC_CACHE;
  const md = await fetchText('/docs/model_summery.md');
  const lines = md.split(/\r?\n/);
  const map = {};
  function normalizeTitle(t) {
    let s = t.trim();
    // remove leading numbering like "6." or "8.1." etc
    s = s.replace(/^\s*\d+(?:\.\d+)*\.?\s*/, '');
    return s.trim();
  }
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\*\s+\*\*(.+?)\*\*\s*$/);
    if (!m) continue;
    const rawTitle = normalizeTitle(m[1]);
    // next non-empty line is the summary text
    let j = i + 1;
    while (j < lines.length && !lines[j].trim()) j++;
    if (j >= lines.length) continue;
    let summaryLine = lines[j].trim();
    // remove leading list markers/indent if any
    summaryLine = summaryLine.replace(/^[-*]\s+/, '').trim();
    const { zh, en } = extractNames(rawTitle);
    const text = stripInlineMd(summaryLine);
    if (zh) map[zh] = text;
    if (en) map[en] = text;
  }
  MODEL_SUMMARY_DOC_CACHE = map;
  return map;
}

function makeCollapsible(container, headerEl, bodyEl, opts = {}) {
  const { showCaret = true } = opts;
  container.classList.add('collapsible', 'collapsed');
  let caret = null;
  if (showCaret) {
    caret = el('span', { className: 'twisty', textContent: '▶' });
    headerEl.prepend(caret);
  }
  headerEl.addEventListener('click', () => {
    container.classList.toggle('collapsed');
    if (caret) caret.textContent = container.classList.contains('collapsed') ? '▶' : '▼';
  });
  bodyEl.classList.add('fold');
}

// Component: ModelListItem — encapsulates name + actions + overview as one unit
function createModelListItem({
  categoryTitle,
  name,
  enName = '',
  idGuess,
  summary,
  hasChildren = false,
  showTwisty = false,
  children = [],
  docSummaries = {},
  autoSummaries = {},
  summaryIndex = {}
}) {
  const li = el('li', {
    className: 'list-item' + (showTwisty ? ' collapsible collapsed' : ''),
    'data-filter-item': '1',
    'data-filter-key': `${categoryTitle} ${name} ${summary}`
  });

  // Header row: left(name + optional caret) + right(actions)
  const itemHeader = el('div', { className: 'item-header' });
  const leftSide = el('div', { className: 'item-left' });
  if (showTwisty) {
    leftSide.append(el('span', { className: 'twisty', textContent: '▶' }));
  }
  const qsParams = `id=${encodeURIComponent(idGuess)}&name=${encodeURIComponent(name)}${enName ? `&en=${encodeURIComponent(enName)}` : ''}`;
  const modelLink = el('a', { href: `/models/detail.html?${qsParams}`, textContent: name });
  leftSide.append(modelLink);

  const rightSide = el('div', { className: 'item-right' });
  const practiceLink = el('a', { className: 'link-action', href: `/practice/detail.html?model=${encodeURIComponent(idGuess)}` , textContent: '查看实操' });
  const compareLink = el('a', { className: 'link-action', href: `/compare/index.html?add=${encodeURIComponent(idGuess)}`, textContent: '加入对比' });
  rightSide.append(practiceLink, compareLink);
  itemHeader.append(leftSide, rightSide);

  // Body row: overview text
  const itemBody = el('div', { className: 'item-body' });
  const metaRow = el('div', { className: 'item-meta', textContent: summary });
  itemBody.append(metaRow);

  // Render submodels when present
  if (hasChildren && children && children.length) {
    const subList = el('ul', { className: 'sublist' });
    for (const sm of children) {
      const nm = extractNames(sm.title);
      const smName = nm.zh || stripMd(sm.title);
      const smEn = nm.en || '';
      const smId = slugify(smEn || smName);
      const smSummary = docSummaries[smName] || docSummaries[smEn] || autoSummaries[smName] || summaryIndex[smName] || '（概览信息待补充）';
      const subHeader = el('div', { className: 'sub-item-header' });
      const subLeft = el('div', { className: 'item-left' });
      subLeft.append(el('a', { href: `/models/detail.html?id=${encodeURIComponent(smId)}&name=${encodeURIComponent(smName)}${smEn ? `&en=${encodeURIComponent(smEn)}` : ''}`, textContent: smName }));
      const subRight = el('div', { className: 'item-right' });
      subRight.append(
        el('a', { className: 'link-action', href: `/practice/detail.html?model=${encodeURIComponent(smId)}`, textContent: '查看实操' }),
        el('a', { className: 'link-action', href: `/compare/index.html?add=${encodeURIComponent(smId)}`, textContent: '加入对比' })
      );
      subHeader.append(subLeft, subRight);
      const subMeta = el('div', { className: 'item-meta', textContent: smSummary });
      const subLi = el('li');
      subLi.append(subHeader, subMeta);
      subList.append(subLi);
    }
    itemBody.append(subList);
  }

  if (showTwisty) {
    itemHeader.addEventListener('click', (e) => {
      if (e.target.closest('.item-right')) return;
      li.classList.toggle('collapsed');
      const c = qs('.twisty', leftSide);
      if (c) c.textContent = li.classList.contains('collapsed') ? '▶' : '▼';
    });
  }

  li.append(itemHeader, itemBody);
  return li;
}

export async function renderModelList() {
  const container = qs('#app');
  const [mdList, models, summaryIndex, docSummaries] = await Promise.all([
    fetchText('/docs/model_list.md'),
    fetchJSON('/data/models.json').catch(() => []),
    getSummaryIndex(),
    getSummariesFromDoc()
  ]);
  container.append(el('h1', { textContent: '模型列表' }));
  // Toolbar: back + go to practice + expand/collapse all
  const toolbar = el('div', { className: 'toolbar' }, [
    el('button', { className: 'btn', 'data-back': '1', textContent: '返回上一页' }),
    el('a', { className: 'btn', href: '/practice/detail.html', textContent: '模型实操页' }),
    el('button', { className: 'btn', id: 'toggle-expand-models', textContent: '一键展开' })
  ]);
  container.append(toolbar);

  const tree = buildTree(mdList);
  // Collect names that need auto summary
  const modelNames = [];
  for (const cat of tree) {
    if (cat.type !== 'category') continue;
    for (const node of cat.children) {
      if (node.type !== 'model') continue;
      const name = extractNames(node.title).zh || stripMd(node.title);
      if (!summaryIndex[name]) modelNames.push(name);
      for (const sm of node.children || []) {
        const smName = extractNames(sm.title).zh || stripMd(sm.title);
        if (!summaryIndex[smName]) modelNames.push(smName);
      }
    }
  }
  const autoSummaries = await getAutoSummaries(modelNames);

  for (const cat of tree) {
    if (cat.type !== 'category') continue;
    const section = el('div', { className: 'list-section' });
    const header = el('div', { className: 'section-header' }, [el('h2', { textContent: stripMd(cat.title) })]);
    const fold = el('div');
    const ul = el('ul', { className: 'list' });

    for (const node of cat.children) {
      if (node.type !== 'model') continue;
      const meta = findModelMeta(models, node.title) || {};
      const names = extractNames(node.title);
      const name = names.zh || stripMd(node.title);
      const enName = names.en || '';
      const summary = docSummaries[name] || docSummaries[enName] || autoSummaries[name] || meta.summary || summaryIndex[name] || '（概览信息待补充）';
      const hasChildren = node.children && node.children.length > 0;
      const idGuess = meta.id || slugify(enName || name);
      // Prefer the first practice example link if present
      let practiceUrl = undefined;
      try {
        // practices may not be loaded here; renderers is not async for this block, so rely on known patterns
        // We embed known examples for common models as a fallback
        const fallback = {
          'linear-regression': 'https://scikit-learn.org/stable/auto_examples/linear_model/plot_ols.html',
          'logistic-regression': 'https://scikit-learn.org/stable/auto_examples/linear_model/plot_sparse_logistic_regression_20newsgroups.html',
          'svm': 'https://scikit-learn.org/stable/auto_examples/classification/plot_digits_classification.html'
        };
        practiceUrl = fallback[idGuess];
      } catch {}
      const showTwisty = hasChildren; // allow expanding to view submodels
      const li = createModelListItem({
        categoryTitle: cat.title,
        name,
        enName,
        idGuess,
        summary,
        hasChildren,
        showTwisty,
        children: node.children || [],
        docSummaries,
        autoSummaries,
        summaryIndex,
        practiceUrl
      });
      ul.append(li);
    }

    fold.append(ul);
    section.append(header, fold);
    makeCollapsible(section, header, fold);
    container.append(section);
  }

  // Set up expand/collapse all behavior
  installBackButton();
  const toggleBtn = qs('#toggle-expand-models', container);
  let expandedAll = false;
  toggleBtn?.addEventListener('click', () => {
    expandedAll = !expandedAll;
    toggleBtn.textContent = expandedAll ? '一键合并' : '一键展开';
    qsa('.collapsible', container).forEach(sec => {
      if (expandedAll) sec.classList.remove('collapsed');
      else sec.classList.add('collapsed');
    });
    qsa('.twisty', container).forEach(c => c.textContent = expandedAll ? '▼' : '▶');
  });
}

function extractMdSectionForModel(fullMd, candidates = []) {
  const lines = fullMd.split(/\r?\n/);
  const cands = candidates.filter(Boolean).map(s => s.toLowerCase());
  let startIdx = -1;
  let startLevel = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^(#{2,5})\s+(.*)$/); // ##, ###, ####, or ##### level titles
    if (!m) continue;
    const level = m[1].length;
    const titleText = stripMd(m[2]);
    const { zh, en } = extractNames(titleText);
    const titleKeys = [zh, en].filter(Boolean).map(s => s.toLowerCase());
    if (titleKeys.some(k => cands.includes(k))) {
      startIdx = i; startLevel = level; break;
    }
  }
  if (startIdx < 0) return '';
  let endIdx = lines.length;
  for (let j = startIdx + 1; j < lines.length; j++) {
    const l = lines[j];
    const m = l.match(/^(#{2,5})\s+/);
    if (m && m[1].length <= startLevel) { endIdx = j; break; }
  }
  return lines.slice(startIdx, endIdx).join('\n');
}

export async function renderModelDetail(id) {
  const container = qs('#app');
  const [models, md] = await Promise.all([
    fetchJSON('/data/models.json').catch(() => []),
    fetchText('/docs/model_detail.md')
  ]);
  const params = new URLSearchParams(location.search);
  const idParam = id || params.get('id');
  const meta = models.find(x => x.id === idParam);
  const candidates = [];
  if (meta?.name) {
    const { zh, en } = extractNames(meta.name);
    if (zh) candidates.push(zh);
    if (en) candidates.push(en);
  }
  // fallback: use query params 'name' and 'en'
  const qpName = params.get('name');
  const qpEn = params.get('en');
  if (!candidates.length) {
    if (qpName) candidates.push(qpName);
    if (qpEn) candidates.push(qpEn);
  }
  const section = extractMdSectionForModel(md, candidates);

  container.append(
    el('div', { className: 'toolbar' }, [
      el('button', { className: 'btn', 'data-back': '1', textContent: '返回上一页' }),
      el('a', { className: 'btn', href: '/models/index.html', textContent: '返回模型列表' }),
      el('a', { className: 'btn', href: `/practice/detail.html?model=${encodeURIComponent(idParam || '')}` , textContent: '查看实操' }),
      el('a', { className: 'btn', href: `/compare/index.html?add=${encodeURIComponent(idParam || '')}`, textContent: '加入对比' })
    ])
  );

  if (!section) {
    container.append(el('p', { textContent: '未在 model_detail.md 中找到该模型的详细信息。' }));
    installBackButton();
    return;
  }

  const trimmed = section.split(/\r?\n/).slice(1).join('\n');
  const mdEl = renderMarkdown(trimmed);
  container.append(mdEl);
  enhanceMarkdown(mdEl);
  installBackButton();
}

export async function renderMetricsList() {
  const container = qs('#app');
  container.append(el('h1', { textContent: '评估指标' }));
  const toolbar = el('div', { className: 'toolbar' }, [
    el('button', { className: 'btn', 'data-back': '1', textContent: '返回上一页' }),
    el('a', { className: 'btn', href: '/models/index.html', textContent: '返回模型列表' }),
    el('a', { className: 'btn', href: '/practice/detail.html', textContent: '返回模型实操' }),
    el('button', { className: 'btn', id: 'toggle-expand-metrics', textContent: '一键展开' })
  ]);
  container.append(toolbar);

  // Parse evaluation_index.md into hierarchical sections similar to model list
  const md = await fetchText('/docs/evaluation_index.md');
  const lines = md.split(/\r?\n/);

  function stripMd(text) {
    return (text || '').replace(/^#+\s+/, '').replace(/`/g, '').trim();
  }

  // Clean display title: remove **, and any numbering like "1." (including middle occurrences)
  function cleanDisplayTitle(raw) {
    let t = String(raw || '');
    // remove bold markers
    t = t.replace(/\*\*/g, '');
    // remove occurrences of "<num>." at start or after a space/paren
    t = t.replace(/(^|[\s（(])\d+\.\s*/g, '$1');
    // collapse spaces
    t = t.replace(/\s+/g, ' ').trim();
    return t;
  }

  function baseNameForId(name) {
    const m = String(name || '').match(/^([^（(]+?)([（(].*)?$/);
    return (m ? m[1] : name).trim();
  }

  // Build hierarchy: H1 -> group; H2 -> metric names (per requirement)
  const tree = [];
  let currentPart = null;
  const headingRegex = /^(#{1,2})\s+(.+)$/; // # or ##
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(headingRegex);
    if (!m) continue;
    const level = m[1].length;
    const titleRaw = stripMd(m[2]);
    const title = cleanDisplayTitle(titleRaw);
    if (level === 1) {
      currentPart = { type: 'part', title, items: [] };
      tree.push(currentPart);
    } else if (level === 2 && currentPart) {
      const name = title;
      if (!currentPart.items.some(x => x.name === name)) {
        currentPart.items.push({ name });
      }
    }
  }

  // Render hierarchical list with collapsible sections
  const listContainer = el('div', { className: 'list-section' });
  for (const part of tree) {
    if (part.type !== 'part') continue;
    const partWrap = el('div', { className: 'list-section' });
    const partHeader = el('div', { className: 'section-header' }, [el('h2', { textContent: part.title })]);
    const fold = el('div');
    const ul = el('ul', { className: 'list' });
    for (const item of part.items || []) {
      const display = cleanDisplayTitle(item.name);
      const base = baseNameForId(display);
      const id = base.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/(^-|-$)/g, '') || 'metric';
      const li = el('li', { className: 'list-item', 'data-filter-item': '1', 'data-filter-key': display });
      const header = el('div', { className: 'item-header' });
      const left = el('div', { className: 'item-left' });
       left.append(el('a', { href: `/metrics/detail.html?id=${encodeURIComponent(id)}&name=${encodeURIComponent(base)}`, textContent: display }));
      header.append(left);
      li.append(header);
      ul.append(li);
    }
    fold.append(ul);
    partWrap.append(partHeader, fold);
    // 可折叠，但不显示三角图标
    makeCollapsible(partWrap, partHeader, fold, { showCaret: false });
    container.append(partWrap);
  }
  installBackButton();
  const toggleBtn = qs('#toggle-expand-metrics', container);
  let expanded = false;
  toggleBtn?.addEventListener('click', () => {
    expanded = !expanded;
    toggleBtn.textContent = expanded ? '一键合并' : '一键展开';
    qsa('.collapsible', container).forEach(sec => {
      if (expanded) sec.classList.remove('collapsed');
      else sec.classList.add('collapsed');
    });
    qsa('.twisty', container).forEach(c => c.textContent = expanded ? '▼' : '▶');
  });
}

export async function renderMetricDetail(id) {
  const container = qs('#app');
  const params = new URLSearchParams(location.search);
  const nameParam = params.get('name') || '';
  container.classList.add('metric-detail');
  container.append(el('div', { className: 'toolbar' }, [
    el('button', { className: 'btn', 'data-back': '1', textContent: '返回上一页' })
  ]));
  const md = await fetchText('/docs/evaluation_index.md');
  const lines = md.split(/\r?\n/);
  function strip(text){return (text||'').replace(/^#+\s+/, '').replace(/`/g,'').trim();}
  function cleanTitle(text){
    let t = strip(text).replace(/\*\*/g,'');
    t = t.replace(/(^|[\s（(])\d+\.\s*/g, '$1');
    return t.trim();
  }
  function metricAliasMap() {
    return {
      'r2': ['决定系数', 'r-squared', 'r²', 'r2'],
      'mse': ['均方误差', 'mse'],
      'rmse': ['均方根误差', 'rmse'],
      'mae': ['平均绝对误差', 'mae'],
      'accuracy': ['准确率', 'accuracy'],
      'precision': ['精确率', 'precision'],
      'recall': ['召回率', 'recall'],
      'f1': ['f1 分数', 'f1-score', 'f1'],
      'auc': ['auc', 'roc', 'roc auc'],
      'silhouette': ['轮廓系数', 'silhouette'],
      'ch': ['calinski-harabasz', 'ch 指数', 'ch 指数 (calinski-harabasz)', 'ch'],
      'explained-variance': ['解释方差', '方差解释率', 'explained variance', 'explained-variance', 'variance explained', 'evr']
    };
  }
  const alias = metricAliasMap();
  const key = (nameParam || id || '').toLowerCase();
  const candidates = new Set();
  if (key) {
    candidates.add(key);
    (alias[key] || []).forEach(x => candidates.add(x.toLowerCase()));
  }
  let start=-1, level=0;
  for(let i=0;i<lines.length;i++){
    const m = lines[i].match(/^(#{2,6})\s+(.+)$/);
    if(!m) continue; const t=cleanTitle(m[2]).toLowerCase();
    if(candidates.size>0){
      for (const cand of candidates) { if (t.includes(cand)) { start=i; level=m[1].length; break; } }
      if (start>=0) break;
    }
  }
  if(start<0){ container.append(el('p',{textContent:'未在 evaluation_index.md 中找到该指标的详细信息。'})); installBackButton(); return; }
  let end=lines.length; for(let j=start+1;j<lines.length;j++){ const m=lines[j].match(/^(#{1,6})\s+/); if(m && m[1].length<=level){ end=j; break; }}
  const sec = lines.slice(start,end);
  container.append(el('h1',{textContent: cleanTitle(sec[0])}));
  const layerNames=['层次一','层次二','层次三','层次四','层次五'];
  function extractLayer(n){ const re=new RegExp('^\\*\\s+\\*\\*'+layerNames[n]+'[：:]'); let s=-1,e=sec.length; for(let i=1;i<sec.length;i++){ if(re.test(sec[i])){ s=i; break; }} if(s<0) return ''; for(let j=s+1;j<sec.length;j++){ if(/^\*\s+\*\*层次[一二三四五]/.test(sec[j])){ e=j; break; }} return sec.slice(s,e).join('\n'); }
  for(let i=0;i<5;i++){ const block=extractLayer(i); if(!block) continue; container.append(el('div',{className:'section metric-layer'},[renderMarkdown(block)])); }
  installBackButton();
}

export async function renderPractice(modelId) {
  const container = qs('#app');
  container.append(el('h1', { textContent: '模型实操' }));
  // top toolbar with navigation and toggle
  const toolbar = el('div', { className: 'toolbar' }, [
    el('button', { className: 'btn', 'data-back': '1', textContent: '返回上一页' }),
    el('a', { className: 'btn', href: '/models/index.html', textContent: '返回模型列表' }),
    el('button', { className: 'btn', id: 'toggle-expand', textContent: '一键展开' })
  ]);
  container.append(toolbar);

  // Load model structure and practice examples
  const [mdList, modelsExtra, practices] = await Promise.all([
    fetchText('/docs/model_list.md'),
    fetchJSON('/data/models.json').catch(() => []),
    fetchJSON('/data/practice.json').catch(() => [])
  ]);

  // Group practice items by model id
  const practiceByModel = new Map();
  for (const p of practices) {
    if (!practiceByModel.has(p.model)) practiceByModel.set(p.model, []);
    practiceByModel.get(p.model).push(p);
  }

  function collectExamplesByCandidates(cands = []) {
    const seen = new Set();
    const list = [];
    for (const key of cands.filter(Boolean)) {
      const arr = practiceByModel.get(key) || [];
      for (const it of arr) {
        const k = `${it.title}|${it.link}`;
        if (seen.has(k)) continue;
        seen.add(k);
        list.push(it);
      }
    }
    return list;
  }

  function deriveAliases(zhName, enName = '') {
    const aliases = new Set();
    function add(s) { if (s) aliases.add(slugify(String(s))); }
    add(zhName);
    add(enName);
    const splitted = String(enName)
      .split(/[,/]/) // split by comma or slash
      .map(s => s.trim())
      .filter(Boolean);
    for (const token of splitted) add(token);
    // also split by spaces to capture acronyms like PCA, DQN
    for (const token of String(enName).split(/\s+/)) add(token.trim());
    return Array.from(aliases);
  }

  // Build tree from model_list similar to renderModelList
  const tree = buildTree(mdList);
  const section = el('div', { className: 'list-section' });

  for (const cat of tree) {
    if (cat.type !== 'category') continue;
    const header = el('div', { className: 'section-header' }, [el('h2', { textContent: stripMd(cat.title) })]);
    const fold = el('div');
    const ul = el('ul', { className: 'list' });

    for (const node of cat.children) {
      if (node.type !== 'model') continue;
      const names = extractNames(node.title);
      const name = names.zh || stripMd(node.title);
      const enName = names.en || '';
      const idFromJson = (modelsExtra.find(m => (m.name || '').startsWith(name))?.id) || '';
      const enPrimary = enName.split(',')[0].trim();
      // IMPORTANT: keep idGuess generation consistent with model list links
      // Prefer English name when available so slugs like "random-forests" are used
      const idGuess = idFromJson || slugify(enName || name);
      if (modelId && idGuess !== modelId) continue;

      const li = el('li', { className: 'list-item collapsible collapsed', 'data-filter-item': '1', 'data-filter-key': `${cat.title} ${name}` });
      const itemHeader = el('div', { className: 'item-header' });
      const left = el('div', { className: 'item-left' });
      left.append(el('span', { className: 'twisty', textContent: '▶' }));
      const qsParams = `id=${encodeURIComponent(idGuess)}&name=${encodeURIComponent(name)}${enName ? `&en=${encodeURIComponent(enName)}` : ''}`;
       left.append(el('a', { href: `/models/detail.html?${qsParams}`, textContent: name }));
      const right = el('div', { className: 'item-right' });
      right.append(
        el('a', { className: 'link-action', href: `/compare/index.html?add=${encodeURIComponent(idGuess)}`, textContent: '加入对比' })
      );
      itemHeader.append(left, right);

      const body = el('div', { className: 'item-body' });
      // Collect examples for this model and its常见别名
      const examples = collectExamplesByCandidates([
        idFromJson,
        ...deriveAliases(name, enName)
      ]);
      // 也收集子模型的实操样例
      for (const sm of (node.children || [])) {
        const sn = extractNames(sm.title);
        const smName = sn.zh || stripMd(sm.title);
        const smEn = sn.en || '';
        const smEnPrimary = smEn.split(',')[0].trim();
        const smExamples = collectExamplesByCandidates(deriveAliases(smName, smEn));
        examples.push(...smExamples);
      }
      if (examples.length === 0) {
        body.append(el('div', { className: 'item-meta', textContent: '（暂无实操样例，待补充）' }));
      } else {
        const sub = el('ul', { className: 'sublist' });
        for (const p of examples) {
          const subLi = el('li');
          const h = el('div', { className: 'sub-item-header' });
          const l = el('div', { className: 'item-left' });
          l.append(el('a', { href: p.link, target: '_blank', rel: 'noopener', textContent: p.title }));
          const r = el('div', { className: 'item-right' });
           for (const mi of (p.metrics || [])) {
             r.append(el('a', { className: 'badge', href: `/metrics/detail.html?id=${encodeURIComponent(mi)}&name=${encodeURIComponent(mi)}`, textContent: mi }));
           }
          h.append(l, r);
          subLi.append(h, el('div', { className: 'item-meta', textContent: p.summary || '' }));
          sub.append(subLi);
        }
        body.append(sub);
      }

      li.append(itemHeader, body);
      itemHeader.addEventListener('click', (e) => {
        if (e.target.closest('.item-right')) return;
        li.classList.toggle('collapsed');
        const c = qs('.twisty', left);
        if (c) c.textContent = li.classList.contains('collapsed') ? '▶' : '▼';
      });
      ul.append(li);
    }

    fold.append(ul);
    const sect = el('div', { className: 'list-section' });
    sect.append(header, fold);
    makeCollapsible(sect, header, fold, { showCaret: false });
    section.append(sect);
  }

  container.append(section);

  // install back button behavior
  installBackButton();

  // Expand/Collapse all behavior
  const toggleBtn = qs('#toggle-expand', container);
  let expanded = false;
  toggleBtn?.addEventListener('click', () => {
    expanded = !expanded;
    toggleBtn.textContent = expanded ? '一键合并' : '一键展开';
    qsa('.collapsible', container).forEach(sec => {
      if (expanded) sec.classList.remove('collapsed');
      else sec.classList.add('collapsed');
    });
    qsa('.twisty', container).forEach(c => c.textContent = expanded ? '▼' : '▶');
  });
}

export async function renderCompare(initialIds = []) {
  const container = qs('#app');
  container.append(el('h1', { textContent: '模型对比' }));

  // Top toolbar: back and return to model list
  container.append(
    el('div', { className: 'toolbar' }, [
      el('button', { className: 'btn', 'data-back': '1', textContent: '返回上一页' }),
      el('a', { className: 'btn', href: '/models/index.html', textContent: '返回模型列表' })
    ])
  );

  // Load sources: list for full inventory, json for extra fields, summaries for overview
  const [mdList, extraModels, docSummaries] = await Promise.all([
    fetchText('/docs/model_list.md'),
    fetchJSON('/data/models.json').catch(() => []),
    getSummariesFromDoc()
  ]);

  // Build all models from list tree
  const tree = buildTree(mdList);
  const allModels = [];
  for (const cat of tree) {
    if (cat.type !== 'category') continue;
    const category = stripMd(cat.title);
    for (const node of cat.children) {
      if (node.type !== 'model') continue;
      const nm = extractNames(node.title);
      const name = nm.zh || stripMd(node.title);
      const en = nm.en || '';
      const id = (extraModels.find(m => (m.name || '').startsWith(name))?.id) || slugify(en || name);
      const base = extraModels.find(m => m.id === id) || {};
      allModels.push({
        id,
        name,
        en,
        category,
        summary: docSummaries[name] || docSummaries[en] || base.summary || ''
      });
      for (const sm of node.children || []) {
        const sn = extractNames(sm.title);
        const sname = sn.zh || stripMd(sm.title);
        const sen = sn.en || '';
        const sid = slugify(sen || sname);
        allModels.push({
          id: sid,
          name: `${sname}`,
          en: sen,
          category: `${category} / ${name}`,
          summary: docSummaries[sname] || docSummaries[sen] || ''
        });
      }
    }
  }

  // Selected state
  const selected = new Set((initialIds || []).filter(Boolean));

  // Build selector with categories and filterable checkboxes (compact picker)
  const byCat = new Map();
  for (const m of allModels) {
    if (!byCat.has(m.category)) byCat.set(m.category, []);
    byCat.get(m.category).push(m);
  }
  const filterInput = el('input', { id: 'compare-filter', type: 'search', placeholder: '筛选模型…' });
  const listWrap = el('div', { className: 'compare-picker' });
  const compareList = el('div', { className: 'compare-list' });
  for (const [cat, arr] of byCat.entries()) {
    compareList.append(el('div', { className: 'compare-cat' }, [el('div', { className: 'compare-cat-title', textContent: cat })]));
    for (const m of arr) {
      const row = el('label', { className: 'compare-item', 'data-key': `${cat} ${m.name} ${m.summary}`.toLowerCase() }, [
        el('input', { type: 'checkbox', value: m.id }),
        el('span', { textContent: m.name })
      ]);
      compareList.append(row);
    }
  }
  listWrap.append(filterInput, compareList);

  const selector = el('div', { className: 'toolbar' }, [listWrap]);
  // ensure selector stretches to specific width if space allows
  selector.style.width = '100%';
  listWrap.style.width = '920px';
  listWrap.style.maxWidth = '100%';
  container.append(selector);

  const tableWrap = el('div', { className: 'compare-wrap' });
  container.append(tableWrap);

  // filtering interactions
  filterInput.addEventListener('input', () => {
    const kw = (filterInput.value || '').trim().toLowerCase();
    qsa('.compare-item', compareList).forEach(elm => {
      const hit = !kw || (elm.dataset.key || '').includes(kw);
      elm.style.display = hit ? '' : 'none';
    });
  });

  // auto add on check
  compareList.addEventListener('change', (e) => {
    const target = e.target;
    if (target && target.matches('input[type="checkbox"]')) {
      const id = target.value;
      if (target.checked) {
        if (selected.size >= 3) { alert('最多选择 3 个模型'); target.checked = false; return; }
        selected.add(id);
      } else {
        selected.delete(id);
      }
      drawTable();
    }
  });

  function syncChecks() {
    const set = new Set(selected);
    qsa('input[type="checkbox"]', compareList).forEach(chk => {
      chk.checked = set.has(chk.value);
      chk.disabled = false;
    });
  }

  // Backward-compat no-op to avoid ReferenceError from legacy calls
  function updateSelectedInfo() { /* intentionally empty */ }

  // no top selected info; operate directly in filter list

  // Cache of step summaries by id
  const STEP_CACHE = new Map();

  async function getStepSummariesFor(model) {
    if (STEP_CACHE.has(model.id)) return STEP_CACHE.get(model.id);
    const md = await getDetailMdText();
    const cands = [];
    if (model.name) cands.push(model.name);
    if (model.en) cands.push(model.en);
    const section = extractMdSectionForModel(md, cands);
    const steps = {};
    if (section) {
      const lines = section.split(/\r?\n/);
      let current = '';
      let buf = [];
      function flush() {
        if (!current) return;
        // Preserve markdown with original line breaks for proper rendering
        const text = buf.join('\n').replace(/\s+$/g, '').trim();
        if (text) steps[current] = text;
        current = '';
        buf = [];
      }
      for (const raw of lines) {
        const m = raw.match(/^(#{2,5})\s*(.*第\s*[一二三四五六七]\s*步.*)$/);
        if (m) {
          flush();
          // Normalize to 一..七 index
          const label = m[2].match(/第\s*([一二三四五六七])\s*步/);
          if (label) current = label[1]; else current = '';
          continue;
        }
        if (current) {
          if (/^#{1,6}\s+/.test(raw)) { flush(); continue; }
          buf.push(raw);
        }
      }
      flush();
    }
    STEP_CACHE.set(model.id, steps);
    return steps;
  }

  async function drawTable() {
    tableWrap.innerHTML = '';
    const cols = [...selected].map(id => allModels.find(m => m.id === id)).filter(Boolean);
    if (cols.length === 0) {
      tableWrap.append(el('p', { textContent: '请选择 1-3 个模型进行对比。' }));
    syncChecks();
      return;
    }
    // Fetch step summaries for each selected model
    const stepsList = await Promise.all(cols.map(getStepSummariesFor));
    // remove 第四步；并为每一步命名
    const stepOrder = ['一','二','三','五','六','七'];
    const stepNames = { '一': '问题定义', '二': '核心思想', '三': '数据与前提', '五': '评估指标', '六': '优化与改进', '七': '优缺点与场景' };

    function renderSection(title, getter) {
      const section = el('div', { className: 'compare-section' });
      section.append(el('h3', { textContent: title }));
      const table = el('table', { className: 'table' });
      const thead = el('thead');
      thead.append(el('tr', {}, [el('th', { textContent: '模型' }), el('th', { textContent: '内容' })]));
      table.append(thead);
      const tbody = el('tbody');
      for (let i = 0; i < cols.length; i++) {
        const m = cols[i];
        const tr = el('tr');
        const left = el('td');
        const qp = `id=${encodeURIComponent(m.id)}&name=${encodeURIComponent(m.name || '')}${m.en ? `&en=${encodeURIComponent(m.en)}` : ''}`;
         const link = el('a', { href: `/models/detail.html?${qp}`, textContent: m.name });
        // Make sure navigation always works even if any overlay blocks pointer events
        link.style.position = 'relative';
        link.style.zIndex = '2';
        link.addEventListener('click', (e) => {
          e.stopPropagation();
        });
        left.append(link);
        const right = el('td');
        right.append(renderMarkdown(getter(i) || ''));
        // Add metric badges inferred from content keywords (rudimentary)
        const metrics = ['accuracy','precision','recall','f1','auc','mae','mse','rmse','r2','silhouette','ch','explained-variance'];
        const found = metrics.filter(mi => (getter(i) || '').toLowerCase().includes(mi));
        if (found.length) {
          const badgeRow = el('div', { style: 'margin-top:6px;' });
           for (const mi of found) badgeRow.append(el('a', { className: 'badge', href: `/metrics/detail.html?id=${encodeURIComponent(mi)}&name=${encodeURIComponent(mi)}`, textContent: mi }));
          right.append(badgeRow);
        }
        tr.append(left, right);
        tbody.append(tr);
      }
      table.append(tbody);
      section.append(table);
      return section;
    }

    // 概览
    tableWrap.append(renderSection('模型概览', i => cols[i].summary || ''));
    // 各字段（步骤）
    for (const cn of stepOrder) {
      const label = stepNames[cn] || `第${cn}步`;
      tableWrap.append(renderSection(label, i => (stepsList[i] || {})[cn] || ''));
    }
    syncChecks();
  }

  drawTable();
  installBackButton();
}
