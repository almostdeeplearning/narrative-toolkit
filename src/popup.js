// popup.js

let prompts = [];
let pendingStructured = null;
let structuredRawText = null;
let extractAI = 'gpt';
let distillAI = 'gpt';
let selectedFmt = 'note';
let series = [];
let currentSeriesId = null;
let extractSeriesId = null;
let distillSeriesId = null;
let distillPromptIdx = null;
let lastDistillResult = null;

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await clearLegacyCloudSettings();
  await loadSettings();
  renderPrompts();
  renderExtractPromptPicker();
  renderDistillPromptPicker();
  bindAll();
  listenBg();
  renderExtractLibrary();
  renderDistillLibrary();
  const d2 = await chrome.storage.local.get('rawResponses');
  if (d2.rawResponses?.length) displayGrokResponses(d2.rawResponses);
  if (pendingStructured) showReview(pendingStructured, structuredRawText);
});

// ── Storage ───────────────────────────────────────────────────────────────────
async function clearLegacyCloudSettings() {
  await chrome.storage.local.remove(['autoDrive', 'driveFolderId', 'sheetId', 'sheetTab', 'oauthToken']);
}

async function loadSettings() {
  const d = await chrome.storage.local.get([
    'prompts','extractAI','distillAI','delaySeconds',
    'fullAuto','autoDownload','draftFolder',
    'grokTpl','wikiTpl','noteTpl','distillAutoSave','extractFolder','distillFolder',
    'pendingStructured','promptSeries','popupWidth','popupHeight','popupFontSize','popupTextContrast','lastTab',
    'currentSeriesId','extractSeriesId','distillSeriesId','distillPromptIdx'
  ]);
  prompts = d.prompts || [];
  extractAI = d.extractAI || 'gpt';
  distillAI = d.distillAI || 'gpt';
  pendingStructured = d.pendingStructured || null;
  series = d.promptSeries || [];
  currentSeriesId = d.currentSeriesId || null;
  extractSeriesId = d.extractSeriesId || null;
  distillSeriesId = d.distillSeriesId || null;
  distillPromptIdx = d.distillPromptIdx ?? null;

  const w = d.popupWidth || 780;
  document.body.style.width = w + 'px';
  document.querySelectorAll('.width-btn').forEach(b =>
    b.classList.toggle('active', Number(b.dataset.w) === w));

  applyPopupHeight(d.popupHeight || 600);
  applyPopupFontSize(d.popupFontSize || 'standard');
  applyPopupTextContrast(d.popupTextContrast || 'standard');

  $('delayInput').value = d.delaySeconds || 35;
  $('fullAutoToggle').checked = d.fullAuto !== false;
  $('autoDownload').checked = d.autoDownload !== false;
  $('distillAutoSave').checked = d.distillAutoSave !== false;
  $('extractFolder').value = d.extractFolder || d.draftFolder || '';
  $('distillFolder').value = d.distillFolder || d.draftFolder || '';
  if (d.grokTpl) $('structureTpl').value = d.grokTpl;
  if (d.wikiTpl) $('wikiTpl').value = d.wikiTpl;
  if (d.noteTpl) $('noteTpl').value = d.noteTpl;

  // Sync AI buttons
  $('extractAiSelect').querySelectorAll('.ai-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.ai === extractAI));
  $('distillAiSelect').querySelectorAll('.ai-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.ai === distillAI));

  if (d.lastTab) switchTab(d.lastTab);
}

function applyPopupHeight(h) {
  document.documentElement.style.setProperty('--popup-h', h + 'px');
  document.documentElement.style.height = h + 'px';
  document.body.style.height = h + 'px';
  document.body.style.minHeight = h + 'px';
  document.body.style.maxHeight = h + 'px';
  document.querySelectorAll('.height-btn').forEach(b =>
    b.classList.toggle('active', Number(b.dataset.h) === h));
}

function applyPopupFontSize(size) {
  document.body.classList.remove('font-comfortable', 'font-large');
  if (size === 'comfortable') document.body.classList.add('font-comfortable');
  if (size === 'large') document.body.classList.add('font-large');
  document.querySelectorAll('.font-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.font === size));
}

function applyPopupTextContrast(mode) {
  document.body.classList.remove('contrast-bright', 'contrast-max');
  if (mode === 'bright') document.body.classList.add('contrast-bright');
  if (mode === 'max') document.body.classList.add('contrast-max');
  document.querySelectorAll('.contrast-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.contrast === mode));
}

// ── Event binding ─────────────────────────────────────────────────────────────
function bindAll() {
  // Tab nav
  document.querySelectorAll('.tab').forEach(t =>
    t.addEventListener('click', () => switchTab(t.dataset.tab)));

  // Extract AI selector
  $('extractAiSelect').querySelectorAll('.ai-btn').forEach(b =>
    b.addEventListener('click', () => {
      extractAI = b.dataset.ai;
      $('extractAiSelect').querySelectorAll('.ai-btn').forEach(x => x.classList.toggle('active', x.dataset.ai === extractAI));
      chrome.storage.local.set({ extractAI });
    }));

  // Distill AI selector
  $('distillAiSelect').querySelectorAll('.ai-btn').forEach(b =>
    b.addEventListener('click', () => {
      distillAI = b.dataset.ai;
      $('distillAiSelect').querySelectorAll('.ai-btn').forEach(x => x.classList.toggle('active', x.dataset.ai === distillAI));
      chrome.storage.local.set({ distillAI });
    }));

  // Prompts
  // Extract
  $('startBtn').addEventListener('click', startExtract);
  $('stopBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'STOP' });
    setRunUI(false); elog('已停止', 'warn');
  });

  // Review
  $('rejectBtn').addEventListener('click', rejectRedo);
  $('saveMdBtn').addEventListener('click', saveStructuredMd);
  $('runStructureBtn').addEventListener('click', runStructure);
  $('stopStructureBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'STOP' });
    $('runStructureBtn').disabled = false;
    $('stopStructureBtn').style.display = 'none';
    elog('已停止 AI 整理', 'warn');
  });
  $('viewTextBtn').addEventListener('click', () => {
    $('resultTextView').style.display = '';
    $('resultTableView').style.display = 'none';
    $('viewTextBtn').classList.add('active');
    $('viewTableBtn').classList.remove('active');
  });
  $('viewTableBtn').addEventListener('click', () => {
    $('resultTextView').style.display = 'none';
    $('resultTableView').style.display = '';
    $('viewTextBtn').classList.remove('active');
    $('viewTableBtn').classList.add('active');
  });

  // Auto-save structureTpl when user edits it in the X ETL tab
  $('structureTpl').addEventListener('focusout', () =>
    chrome.storage.local.set({ grokTpl: $('structureTpl').value }));

  // Distill response copy / download
  $('copyDistillBtn').addEventListener('click', () => {
    if (!lastDistillResult) return;
    navigator.clipboard.writeText(lastDistillResult.content);
    dlog('已複製', 'success');
  });
  $('dlDistillBtn').addEventListener('click', () => {
    if (!lastDistillResult) return;
    chrome.runtime.sendMessage({ type: 'DOWNLOAD_MD', name: lastDistillResult.name, content: lastDistillResult.content });
  });

  // Extract prompt picker
  $('extractSeriesSel').addEventListener('change', () => {
    extractSeriesId = $('extractSeriesSel').value || null;
    chrome.storage.local.set({ extractSeriesId });
    renderExtractPromptList();
  });

  // Distill
  $('grabPageBtn').addEventListener('click', grabPage);
  $('saveDraftBtn').addEventListener('click', saveDraft);
  $('distillBtn').addEventListener('click', startDistill);
  $('distillSeriesSel').addEventListener('change', () => {
    distillSeriesId = $('distillSeriesSel').value || null;
    distillPromptIdx = null;
    chrome.storage.local.set({ distillSeriesId, distillPromptIdx });
    renderDistillPromptList();
  });
  $('clearDistillPromptBtn').addEventListener('click', () => {
    distillSeriesId = null;
    distillPromptIdx = null;
    chrome.storage.local.set({ distillSeriesId, distillPromptIdx });
    renderDistillPromptPicker();
  });
  $('stopDistillBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'STOP' });
    setDistillUI(false); dlog('已停止', 'warn');
  });
  $('rawText').addEventListener('input', () => {
    $('charCount').textContent = $('rawText').value.length + ' 字';
  });

  // Format selector
  document.querySelectorAll('.fmt-btn').forEach(b =>
    b.addEventListener('click', () => {
      selectedFmt = b.dataset.fmt;
      document.querySelectorAll('.fmt-btn').forEach(x => x.classList.toggle('active', x.dataset.fmt === selectedFmt));
    }));

  // Per-tab library toggles
  ['extract','distill'].forEach(ctx => {
    $(`${ctx}LibToggle`).addEventListener('click', () => {
      const list = $(`${ctx}LibList`);
      const chevron = $(`${ctx}LibChevron`);
      const open = list.style.display !== 'none';
      list.style.display = open ? 'none' : '';
      chevron.classList.toggle('open', !open);
    });
  });

  // Per-tab library actions (event delegation)
  ['extractLibList','distillLibList'].forEach(id => {
    $(id).addEventListener('click', async e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const name = btn.dataset.name;
      if (btn.dataset.action === 'copyDocByName') await copyDocByName(name);
      if (btn.dataset.action === 'dlDocByName')   dlDocByName(name);
      if (btn.dataset.action === 'delDocByName')  { await delDocByName(name); renderExtractLibrary(); renderDistillLibrary(); }
    });
  });

  // Prompt series
  $('addSeriesBtn').addEventListener('click', addSeries);
  $('newSeriesName').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addSeries(); } });
  $('loadAllSeriesBtn').addEventListener('click', loadAllSeries);
  $('addSeriesPromptBtn').addEventListener('click', addSeriesPrompt);

  // Settings
  $('distillAutoSave').addEventListener('change', e =>
    chrome.storage.local.set({ distillAutoSave: e.target.checked }));

  $('saveSettingsBtn').addEventListener('click', saveSettings);

  document.querySelectorAll('.width-btn').forEach(b =>
    b.addEventListener('click', () => {
      const w = Number(b.dataset.w);
      document.body.style.width = w + 'px';
      document.querySelectorAll('.width-btn').forEach(x =>
        x.classList.toggle('active', x === b));
      chrome.storage.local.set({ popupWidth: w });
    }));

  // ── Event delegation (replaces inline handlers) ──────────────────────────────

  document.querySelectorAll('.height-btn').forEach(b =>
    b.addEventListener('click', () => {
      const h = Number(b.dataset.h);
      applyPopupHeight(h);
      chrome.storage.local.set({ popupHeight: h });
    }));

  document.querySelectorAll('.font-btn').forEach(b =>
    b.addEventListener('click', () => {
      const size = b.dataset.font || 'standard';
      applyPopupFontSize(size);
      chrome.storage.local.set({ popupFontSize: size });
    }));

  document.querySelectorAll('.contrast-btn').forEach(b =>
    b.addEventListener('click', () => {
      const mode = b.dataset.contrast || 'standard';
      applyPopupTextContrast(mode);
      chrome.storage.local.set({ popupTextContrast: mode });
    }));

  // promptList
  $('promptList').addEventListener('click', e => {
    const btn = e.target.closest('[data-action="delPrompt"]');
    if (btn) delPrompt(Number(btn.dataset.idx));
  });
  $('promptList').addEventListener('focusout', e => {
    const ta = e.target.closest('[data-action="editPrompt"]');
    if (ta) editPrompt(Number(ta.dataset.idx), ta.value);
  });
  $('promptList').addEventListener('input', e => {
    const ta = e.target.closest('[data-action="editPrompt"]');
    if (ta) editPrompt(Number(ta.dataset.idx), ta.value, false);
  });

  // review table
  $('revBody').addEventListener('focusout', e => {
    const td = e.target.closest('[data-action="cellEdit"]');
    if (td) cellEdit(Number(td.dataset.ri), Number(td.dataset.ci), td.innerText);
  });



  // extract prompt picker
  $('extractPromptList').addEventListener('click', e => {
    const btn = e.target.closest('[data-action="addFromLib"]');
    if (btn) addFromLib(btn.dataset.sid, Number(btn.dataset.idx));
  });

  // distill prompt picker
  $('distillPromptList').addEventListener('click', e => {
    const btn = e.target.closest('[data-action="selectDistillPrompt"]');
    if (btn) selectDistillPrompt(Number(btn.dataset.idx));
  });

  // series list
  $('seriesList').addEventListener('click', e => {
    const del = e.target.closest('[data-action="delSeries"]');
    if (del) { e.stopPropagation(); delSeries(del.dataset.sid); return; }
    const item = e.target.closest('[data-action="selectSeries"]');
    if (item) selectSeries(item.dataset.sid);
  });

  // series prompts list
  $('seriesPromptsList').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, sid, idx } = btn.dataset;
    if (action === 'loadOnePrompt')   loadOnePrompt(sid, Number(idx));
    if (action === 'delSeriesPrompt') delSeriesPrompt(sid, Number(idx));
  });
  $('seriesPromptsList').addEventListener('focusout', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const { action, sid, idx } = el.dataset;
    if (action === 'editSeriesPromptName') editSeriesPromptName(sid, Number(idx), el.value);
    if (action === 'editSeriesPromptText') editSeriesPromptText(sid, Number(idx), el.value);
  });
}

function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === `tab-${name}`));
  if (name === 'prompts') { renderSeries(); renderSeriesPrompts(); }
  if (name === 'extract') { renderExtractPromptPicker(); renderExtractLibrary(); }
  if (name === 'distill') { renderDistillPromptPicker(); renderDistillLibrary(); }
  chrome.storage.local.set({ lastTab: name });
}

// ── Prompts ───────────────────────────────────────────────────────────────────
function addPrompt() {
  const v = $('newPrompt').value.trim();
  if (!v) return;
  prompts.push({ text: v, status: 'pending' });
  $('newPrompt').value = '';
  chrome.storage.local.set({ prompts }); renderPrompts();
}
window.delPrompt = i => { prompts.splice(i, 1); chrome.storage.local.set({ prompts }); renderPrompts(); };
window.editPrompt = (i, v, persist = true) => {
  if (!prompts[i]) return;
  prompts[i].text = v;
  if (persist) chrome.storage.local.set({ prompts });
};

function renderPrompts() {
  const el = $('promptList');
  if (!prompts.length) { el.innerHTML = '<div style="text-align:center;padding:16px;color:var(--muted);font-size:11px">尚無 Prompt</div>'; return; }
  const ic = { pending: '○', running: '⏳', done: '✅', error: '❌' };
  el.innerHTML = prompts.map((p, i) => `
    <div class="pi ${p.status||''}" id="pi${i}">
      <span class="pi-n">#${i+1}</span>
      <textarea class="pi-txt" rows="${promptPreviewRows(p.text)}" data-action="editPrompt" data-idx="${i}">${esc(p.text)}</textarea>
      <span class="pi-ico">${ic[p.status]||'○'}</span>
      <button class="pi-del" data-action="delPrompt" data-idx="${i}">✕</button>
    </div>`).join('');
}

// ── Extract ───────────────────────────────────────────────────────────────────
function promptPreviewRows(text) {
  const value = String(text || '');
  const lineCount = value.split('\n').length;
  const wrapEstimate = Math.ceil(value.length / 72);
  return Math.max(6, Math.min(16, lineCount + wrapEstimate));
}

async function startExtract() {
  await syncPromptEditsFromDom();
  const promptTexts = prompts.map(p => p.text.trim()).filter(Boolean);
  if (!promptTexts.length) { elog('請先選擇 Prompt', 'error'); return; }
  const tabs = await chrome.tabs.query({ url: 'https://x.com/i/grok*' });
  if (!tabs.length) {
    elog('請先開啟 x.com/i/grok', 'warn');
    chrome.tabs.create({ url: 'https://x.com/i/grok' }); return;
  }
  const delay = parseInt($('delayInput').value) || 35;
  await chrome.storage.local.set({ delaySeconds: delay });
  await chrome.storage.local.remove(['rawResponses', 'pendingStructured']);
  pendingStructured = null;
  structuredRawText = null;
  prompts.forEach(p => p.status = 'pending');
  chrome.storage.local.set({ prompts }); renderPrompts();
  $('grokResponseSection').style.display = 'none';
  $('postProcessSection').style.display = 'none';
  $('reviewSection').style.display = 'none';
  $('grokResponseList').innerHTML = '';
  setRunUI(true);
  chrome.runtime.sendMessage({ type: 'START_EXTRACT', tabId: tabs[0].id, prompts: promptTexts, delaySeconds: delay });
  elog(`開始萃取 ${promptTexts.length} 個 Prompt…`, 'info');
}

async function syncPromptEditsFromDom() {
  document.querySelectorAll('#promptList [data-action="editPrompt"]').forEach(ta => {
    const idx = Number(ta.dataset.idx);
    if (prompts[idx]) prompts[idx].text = ta.value;
  });
  await chrome.storage.local.set({ prompts });
}

function setRunUI(on) {
  $('startBtn').disabled = on;
  $('stopBtn').style.display = on ? '' : 'none';
}

// ── Distill ───────────────────────────────────────────────────────────────────
async function grabPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const clean = text => text.replace(/\n{3,}/g, '\n\n').trim();
      const unique = arr => [...new Set(arr.map(s => s.trim()).filter(Boolean))];
      const url = location.href;
      const isX = /(?:x\.com|twitter\.com)/.test(url);
      if (isX) {
        const tweetBlocks = [...document.querySelectorAll('article[role="article"], div[data-testid="tweetText"], div[lang]')]
          .filter(el => el.innerText.trim().length > 20);
        if (tweetBlocks.length) {
          return clean(unique(tweetBlocks.map(el => el.innerText)).join('\n\n'));
        }
      }
      const isThreads = /threads\.(net|com)/.test(url);
      if (isThreads) {
        const posts = [...document.querySelectorAll('article')]
          .filter(el => el.innerText.trim().length > 30)
          .map(el => {
            const clone = el.cloneNode(true);
            clone.querySelectorAll('nav, footer, button, svg, [role="button"]').forEach(e => e.remove());
            return clone.innerText.trim();
          });
        if (posts.length) return clean(unique(posts).join('\n\n'));
      }
      const article = document.querySelector('article, main, [role="main"]');
      const body = article || document.body;
      const clone = body.cloneNode(true);
      clone.querySelectorAll('nav,footer,header,aside,script,style,[class*="ad"],[class*="sidebar"]').forEach(e => e.remove());
      return clean(clone.innerText);
    }
  });
  const text = result?.result || '';
  $('rawText').value = text;
  $('charCount').textContent = text.length + ' 字';
  dlog(`已抓取頁面 ${text.length} 字`, 'success');
}

async function saveDraft() {
  const content = $('rawText').value.trim();
  if (!content) { dlog('請先輸入或抓取內容', 'error'); return; }
  const ts = new Date().toISOString().slice(0,16).replace(/[:T]/g, '-');
  const name = `draft_${ts}.md`;
  const stored = await chrome.storage.local.get(['library', 'distillFolder']);
  const lib = stored.library || [];
  lib.unshift({ name, fmt: 'draft', content, chars: content.length, date: new Date().toLocaleDateString('zh-TW') });
  await chrome.storage.local.set({ library: lib });
  renderDistillLibrary();
  chrome.runtime.sendMessage({ type: 'DOWNLOAD_MD', name, content, folder: stored.distillFolder || '' });
  dlog(`已儲存草稿並下載到本地：${name}`, 'success');
}

async function startDistill() {
  const content = $('rawText').value.trim();
  if (!content) { dlog('請先輸入或抓取內容', 'error'); return; }

  // 若選了 Prompt 庫的 prompt，優先使用並送 AI
  // Prompt 庫有選定 prompt → 優先使用，格式跟隨 selectedFmt
  if (distillSeriesId && distillPromptIdx !== null) {
    const s = series.find(x => x.id === distillSeriesId);
    const customTpl = s?.prompts[distillPromptIdx]?.text || null;
    if (customTpl) {
      const cfg = await chrome.storage.local.get(['fullAuto']);
      setDistillUI(true);
      dlog(`送出整理（${s.prompts[distillPromptIdx].name}，目標：${distillAI}）…`, 'info');
      chrome.runtime.sendMessage({
        type: 'START_DISTILL',
        content,
        fmt: selectedFmt,
        targetAI: distillAI,
        wikiTpl: customTpl,
        fullAuto: cfg.fullAuto !== false
      });
      return;
    }
  }

  // 無 Prompt 庫選擇：依格式決定
  const cfg = await chrome.storage.local.get(['wikiTpl', 'noteTpl', 'fullAuto']);

  if (selectedFmt === 'note') {
    if (cfg.noteTpl) {
      // 筆記.md 有設定模板 → 送 AI 處理
      setDistillUI(true);
      dlog(`送出筆記整理（目標：${distillAI}）…`, 'info');
      chrome.runtime.sendMessage({
        type: 'START_DISTILL',
        content,
        fmt: 'note',
        targetAI: distillAI,
        wikiTpl: cfg.noteTpl,
        fullAuto: cfg.fullAuto !== false
      });
    } else {
      // 無模板 → 直接存原文
      const ts = new Date().toISOString().slice(0,16).replace(/[:T]/g, '-');
      const name = `note_${ts}.md`;
      const stored = await chrome.storage.local.get(['library', 'distillFolder']);
      const lib = stored.library || [];
      lib.unshift({ name, fmt: 'note', content, chars: content.length, date: new Date().toLocaleDateString('zh-TW') });
      await chrome.storage.local.set({ library: lib });
      chrome.runtime.sendMessage({ type: 'DOWNLOAD_MD', name, content, folder: stored.distillFolder || '' });
      renderDistillLibrary();
      dlog(`✅ 已存為 ${name}`, 'success');
    }
    return;
  }

  // wiki.md 格式
  setDistillUI(true);
  dlog(`送出整理（wiki.md，目標：${distillAI}）…`, 'info');
  chrome.runtime.sendMessage({
    type: 'START_DISTILL',
    content,
    fmt: 'wiki',
    targetAI: distillAI,
    wikiTpl: cfg.wikiTpl,
    fullAuto: cfg.fullAuto !== false
  });
}

function setDistillUI(on) {
  $('distillBtn').disabled = on;
  $('stopDistillBtn').style.display = on ? '' : 'none';
}

// ── Review ────────────────────────────────────────────────────────────────────
function showReview(s, rawText) {
  if (!s?.columns?.length) { $('reviewSection').style.display = 'none'; return; }
  $('revHead').innerHTML = s.columns.map(c => `<th>${esc(c)}</th>`).join('');
  $('revBody').innerHTML = s.rows.map((r, ri) =>
    `<tr>${s.columns.map((c, ci) =>
      `<td contenteditable="true" data-action="cellEdit" data-ri="${ri}" data-ci="${ci}">${esc(String(r[c]??''))}</td>`
    ).join('')}</tr>`).join('');
  if (rawText) {
    $('resultText').textContent = rawText;
    structuredRawText = rawText;
  }
  // Default: table view
  $('resultTableView').style.display = '';
  $('resultTextView').style.display = 'none';
  $('viewTableBtn').classList.add('active');
  $('viewTextBtn').classList.remove('active');
  $('reviewSection').style.display = '';
}
window.cellEdit = (ri, ci, v) => {
  if (!pendingStructured) return;
  pendingStructured.rows[ri][pendingStructured.columns[ci]] = v;
  chrome.storage.local.set({ pendingStructured });
};

async function rejectRedo() {
  if (!confirm('清除結果，重新整理？')) return;
  pendingStructured = null;
  structuredRawText = null;
  await chrome.storage.local.remove('pendingStructured');
  $('reviewSection').style.display = 'none';
  $('runStructureBtn').disabled = false;
  $('stopStructureBtn').style.display = 'none';
  elog('已清除結果，可重新按「送 AI 整理」', 'info');
}

// ── Per-tab Library ───────────────────────────────────────────────────────────
function libItemHtml(doc) {
  const icon = doc.fmt === 'wiki' ? '📖' : doc.fmt === 'draft' ? '📝' : doc.fmt === 'structured' ? '🗂' : '📄';
  const safeName = esc(doc.name);
  return `
  <div class="lib-item">
    <span class="lib-item-icon">${icon}</span>
    <span class="lib-item-name" title="${safeName}">${safeName}</span>
    <span class="lib-item-date">${doc.date}</span>
    <div class="lib-item-acts">
      <button class="btn btn-ghost btn-sm" data-action="copyDocByName" data-name="${safeName}">複製</button>
      <button class="btn btn-ghost btn-sm" data-action="dlDocByName"   data-name="${safeName}">⬇</button>
      <button class="pi-del"              data-action="delDocByName"  data-name="${safeName}">✕</button>
    </div>
  </div>`;
}

async function renderExtractLibrary() {
  const d = await chrome.storage.local.get('library');
  const items = (d.library || []).filter(x => x.fmt === 'structured');
  const el = $('extractLibList');
  $('extractLibCount').textContent = items.length || '';
  el.innerHTML = items.length
    ? items.slice(0, 8).map(libItemHtml).join('')
    : '<div style="padding:6px 0;font-size:10px;color:var(--muted)">尚無萃取記錄</div>';
}

async function renderDistillLibrary() {
  const d = await chrome.storage.local.get('library');
  const items = (d.library || []).filter(x => ['note','wiki','draft'].includes(x.fmt));
  const el = $('distillLibList');
  $('distillLibCount').textContent = items.length || '';
  el.innerHTML = items.length
    ? items.slice(0, 8).map(libItemHtml).join('')
    : '<div style="padding:6px 0;font-size:10px;color:var(--muted)">尚無整理記錄</div>';
}

async function copyDocByName(name) {
  const { library } = await chrome.storage.local.get('library');
  const doc = (library || []).find(x => x.name === name);
  if (doc) { await navigator.clipboard.writeText(doc.content); dlog('已複製', 'success'); }
}
function dlDocByName(name) {
  chrome.runtime.sendMessage({ type: 'DOWNLOAD_MD_BY_NAME', name });
}
async function delDocByName(name) {
  const d = await chrome.storage.local.get('library');
  await chrome.storage.local.set({ library: (d.library || []).filter(x => x.name !== name) });
}

// ── Settings ──────────────────────────────────────────────────────────────────
async function saveSettings() {
  await chrome.storage.local.set({
    fullAuto:     $('fullAutoToggle').checked,
    autoDownload: $('autoDownload').checked,
    wikiTpl:        $('wikiTpl').value,
    noteTpl:        $('noteTpl').value,
    extractFolder:  $('extractFolder').value.trim(),
    distillFolder:  $('distillFolder').value.trim(),
  });
  $('saveOk').classList.add('on');
  setTimeout(() => $('saveOk').classList.remove('on'), 2000);
}

// ── Background listener ───────────────────────────────────────────────────────
function listenBg() {
  chrome.runtime.onMessage.addListener(msg => {
    switch (msg.type) {
      case 'PROGRESS':
        if (msg.promptIndex !== undefined) {
          prompts[msg.promptIndex].status = msg.status; renderPrompts();
        }
        $('prog').classList.add('on');
        $('progFill').style.width = (msg.total ? Math.round(msg.current/msg.total*100) : 0) + '%';
        $('progTxt').textContent = `${msg.current} / ${msg.total}`;
        break;

      case 'LOG_EXTRACT': elog(msg.text, msg.level); break;
      case 'LOG_DISTILL': dlog(msg.text, msg.level); break;

      case 'EXTRACT_DONE':
        setRunUI(false);
        elog('✅ 萃取完成！可在下方送 AI 整理', 'success');
        if (msg.responses?.length) displayGrokResponses(msg.responses);
        break;

      case 'AI_STRUCTURE_DONE':
        pendingStructured = msg.structured;
        chrome.storage.local.set({ pendingStructured });
        switchTab('extract');
        showReview(msg.structured, msg.rawText);
        elog('✅ AI 整理完成，請在下方檢視結果', 'success');
        $('runStructureBtn').disabled = false;
        $('stopStructureBtn').style.display = 'none';
        break;

      case 'DISTILL_DONE':
        setDistillUI(false);
        if ($('distillAutoSave').checked && msg.results?.length) {
          const r = msg.results[0];
          lastDistillResult = r;
          $('distillResultName').textContent = r.name;
          $('distillResponseText').textContent = r.content;
          $('distillResponseSection').style.display = '';
          dlog('✅ 整理完成並已存檔！', 'success');
          renderDistillLibrary();
        } else {
          dlog('✅ 已送出，請至 AI 對話框查看與討論', 'success');
        }
        break;

      case 'ERROR':
        elog('❌ ' + msg.text, 'error');
        dlog('❌ ' + msg.text, 'error');
        setRunUI(false); setDistillUI(false);
        break;
    }
  });
}

// ── X ETL: Post-process ───────────────────────────────────────────────────────
async function runStructure() {
  const d = await chrome.storage.local.get(['rawResponses', 'fullAuto']);
  if (!d.rawResponses?.length) { elog('無萃取結果可整理', 'error'); return; }
  const tpl = $('structureTpl').value.trim() || undefined;
  $('runStructureBtn').disabled = true;
  $('stopStructureBtn').style.display = '';
  elog(`送出 AI 整理（${extractAI}）…`, 'info');
  chrome.runtime.sendMessage({
    type: 'RUN_AI_STRUCTURE',
    rawResponses: d.rawResponses,
    template: tpl,
    targetAI: extractAI,
    fullAuto: d.fullAuto !== false
  });
}

function displayGrokResponses(responses) {
  const list = $('grokResponseList');
  list.innerHTML = responses.map(r => `
    <div class="gr-item">
      <div class="gr-q"><span class="gr-n">#${r.index}</span>${esc(r.prompt)}</div>
      <div class="gr-a">${esc(r.response)}</div>
    </div>`).join('');
  $('grokResponseSection').style.display = '';
  $('postProcessSection').style.display = '';
}

async function saveStructuredMd() {
  if (!structuredRawText) { elog('無原文可儲存（尚未收到 AI 回應文字）', 'error'); return; }
  const ts = new Date().toISOString().slice(0,16).replace(/[:T]/g, '-');
  const name = `structured_${ts}.md`;
  const stored = await chrome.storage.local.get(['library', 'extractFolder']);
  const lib = stored.library || [];
  lib.unshift({ name, fmt: 'structured', content: structuredRawText, chars: structuredRawText.length, date: new Date().toLocaleDateString('zh-TW') });
  await chrome.storage.local.set({ library: lib });
  chrome.runtime.sendMessage({ type: 'DOWNLOAD_MD', name, content: structuredRawText, folder: stored.extractFolder || '' });
  renderExtractLibrary();
  elog(`✅ 已儲存並下載：${name}`, 'success');
}

window.copyText = async txt => { await navigator.clipboard.writeText(txt); dlog('已複製', 'success'); };

// ── Logging ───────────────────────────────────────────────────────────────────
function elog(t, l='info') { appendLog('extractLog', t, l); }
function dlog(t, l='info') { appendLog('distillLog', t, l); }
function revlog(t, l='info') {
  const el = $('revLog'); el.style.display='';
  appendLog('revLog', t, l);
}
function appendLog(id, t, l) {
  const el = $(id);
  const d = document.createElement('div');
  d.className = `ll ${l}`;
  d.textContent = `[${ts()}] ${t}`;
  el.appendChild(d); el.scrollTop = el.scrollHeight;
}

// ── Extract Prompt Picker ─────────────────────────────────────────────────────
function renderExtractPromptPicker() {
  const sel = $('extractSeriesSel');
  sel.innerHTML = '<option value="">— 選擇系列 —</option>' +
    series.map(s => `<option value="${s.id}"${s.id === extractSeriesId ? ' selected' : ''}>${esc(s.name)}</option>`).join('');
  renderExtractPromptList();
}

function renderExtractPromptList() {
  const list = $('extractPromptList');
  if (!extractSeriesId) { list.innerHTML = ''; return; }
  const s = series.find(x => x.id === extractSeriesId);
  if (!s?.prompts.length) {
    list.innerHTML = '<span style="font-size:10px;color:var(--muted)">此系列無 Prompt</span>';
    return;
  }
  list.innerHTML = s.prompts.map((p, i) =>
    `<button class="btn btn-ghost btn-sm" data-action="addFromLib" data-sid="${s.id}" data-idx="${i}" style="font-size:10px">${esc(p.name)}</button>`
  ).join('');
}

window.addFromLib = (sid, idx) => {
  const s = series.find(x => x.id === sid);
  if (!s) return;
  const p = s.prompts[idx];
  prompts.push({ text: p.text, status: 'pending' });
  chrome.storage.local.set({ prompts });
  renderPrompts();
  elog(`已載入「${p.name}」`, 'success');
};

// ── Distill Prompt Picker ─────────────────────────────────────────────────────
function renderDistillPromptPicker() {
  const sel = $('distillSeriesSel');
  sel.innerHTML = '<option value="">— 不使用 Prompt 庫 —</option>' +
    series.map(s => `<option value="${s.id}"${s.id === distillSeriesId ? ' selected' : ''}>${esc(s.name)}</option>`).join('');
  renderDistillPromptList();
}

function renderDistillPromptList() {
  const list = $('distillPromptList');
  if (!distillSeriesId) { list.innerHTML = ''; updateDistillSelectedPromptArea(); return; }
  const s = series.find(x => x.id === distillSeriesId);
  if (!s?.prompts.length) {
    list.innerHTML = '<span style="font-size:10px;color:var(--muted)">此系列無 Prompt</span>';
    updateDistillSelectedPromptArea(); return;
  }
  list.innerHTML = s.prompts.map((p, i) => {
    const active = i === distillPromptIdx;
    const style = active ? 'border-color:var(--purple);color:var(--purple-g);background:rgba(124,92,191,.12)' : '';
    return `<button class="btn btn-ghost btn-sm" data-action="selectDistillPrompt" data-idx="${i}" style="font-size:10px;${style}">${esc(p.name)}</button>`;
  }).join('');
  updateDistillSelectedPromptArea();
}

window.selectDistillPrompt = idx => {
  distillPromptIdx = distillPromptIdx === idx ? null : idx;
  chrome.storage.local.set({ distillPromptIdx });
  renderDistillPromptList();
  updateDistillSelectedPromptArea();
};

function updateDistillSelectedPromptArea() {
  const el = $('distillSelectedPromptText');
  if (!distillSeriesId || distillPromptIdx === null) {
    el.textContent = '';
    el.setAttribute('data-empty', '1');
    return;
  }
  const s = series.find(x => x.id === distillSeriesId);
  const p = s?.prompts[distillPromptIdx];
  if (!p) { el.textContent = ''; el.setAttribute('data-empty', '1'); return; }
  el.textContent = p.text;
  el.removeAttribute('data-empty');
}

// ── Prompt Series ─────────────────────────────────────────────────────────────
function renderSeries() {
  const el = $('seriesList');
  if (!series.length) {
    el.innerHTML = '<div style="padding:12px;color:var(--muted);font-size:11px;text-align:center">尚無系列</div>';
    return;
  }
  el.innerHTML = series.map(s => `
    <div class="s-item ${s.id === currentSeriesId ? 'active' : ''}" data-action="selectSeries" data-sid="${s.id}">
      <span class="s-name">${esc(s.name)}</span>
      <span class="s-count">${s.prompts.length}</span>
      <button class="pi-del" data-action="delSeries" data-sid="${s.id}">✕</button>
    </div>`).join('');
}

window.selectSeries = id => {
  currentSeriesId = id;
  chrome.storage.local.set({ currentSeriesId });
  renderSeries();
  renderSeriesPrompts();
};

window.delSeries = async id => {
  if (!confirm('刪除此系列？')) return;
  series = series.filter(s => s.id !== id);
  if (currentSeriesId === id) currentSeriesId = null;
  await chrome.storage.local.set({ promptSeries: series });
  renderSeries();
  renderSeriesPrompts();
};

function addSeries() {
  const name = $('newSeriesName').value.trim();
  if (!name) return;
  const s = { id: crypto.randomUUID(), name, prompts: [] };
  series.push(s);
  $('newSeriesName').value = '';
  chrome.storage.local.set({ promptSeries: series });
  currentSeriesId = s.id;
  renderSeries();
  renderSeriesPrompts();
}

function renderSeriesPrompts() {
  const header = $('seriesPromptsHeader');
  const list   = $('seriesPromptsList');
  const addArea = $('seriesPromptsAdd');
  const loadAllBtn = $('loadAllSeriesBtn');

  if (!currentSeriesId) {
    header.textContent = '← 選擇系列';
    list.innerHTML = '';
    addArea.style.display = 'none';
    loadAllBtn.style.display = 'none';
    return;
  }

  const s = series.find(x => x.id === currentSeriesId);
  if (!s) return;

  header.textContent = s.name;
  addArea.style.display = '';
  loadAllBtn.style.display = '';

  if (!s.prompts.length) {
    list.innerHTML = '<div style="padding:12px;color:var(--muted);font-size:11px;text-align:center">尚無 Prompt，請在下方新增</div>';
    return;
  }

  list.innerHTML = s.prompts.map((p, i) => `
    <div class="sp-item">
      <div class="sp-top">
        <input class="sp-name-input" value="${esc(p.name)}"
          data-action="editSeriesPromptName" data-sid="${s.id}" data-idx="${i}">
        <div class="sp-acts">
          <button class="btn btn-ghost btn-sm" data-action="loadOnePrompt"   data-sid="${s.id}" data-idx="${i}">▶ 載入</button>
          <button class="pi-del"              data-action="delSeriesPrompt"  data-sid="${s.id}" data-idx="${i}">✕</button>
        </div>
      </div>
      <textarea class="ta sp-ta" rows="2"
        data-action="editSeriesPromptText" data-sid="${s.id}" data-idx="${i}">${esc(p.text)}</textarea>
    </div>`).join('');
}

window.editSeriesPromptName = async (sid, idx, val) => {
  const s = series.find(x => x.id === sid);
  if (s) { s.prompts[idx].name = val; await chrome.storage.local.set({ promptSeries: series }); }
};

window.editSeriesPromptText = async (sid, idx, val) => {
  const s = series.find(x => x.id === sid);
  if (s) { s.prompts[idx].text = val; await chrome.storage.local.set({ promptSeries: series }); }
};

window.delSeriesPrompt = async (sid, idx) => {
  const s = series.find(x => x.id === sid);
  if (!s) return;
  s.prompts.splice(idx, 1);
  await chrome.storage.local.set({ promptSeries: series });
  renderSeriesPrompts();
  renderSeries();
};

window.loadOnePrompt = (sid, idx) => {
  const s = series.find(x => x.id === sid);
  if (!s) return;
  const p = s.prompts[idx];
  prompts.push({ text: p.text, status: 'pending' });
  chrome.storage.local.set({ prompts });
  switchTab('extract');
  renderPrompts();
  elog(`已載入「${p.name}」到萃取清單`, 'success');
};

function loadAllSeries() {
  const s = series.find(x => x.id === currentSeriesId);
  if (!s || !s.prompts.length) return;
  s.prompts.forEach(p => prompts.push({ text: p.text, status: 'pending' }));
  chrome.storage.local.set({ prompts });
  switchTab('extract');
  renderPrompts();
  elog(`已載入系列「${s.name}」共 ${s.prompts.length} 個 Prompt`, 'success');
}

function addSeriesPrompt() {
  const name = $('newSeriesPromptName').value.trim();
  const text = $('newSeriesPromptText').value.trim();
  if (!name || !text) return;
  const s = series.find(x => x.id === currentSeriesId);
  if (!s) return;
  s.prompts.push({ id: crypto.randomUUID(), name, text });
  $('newSeriesPromptName').value = '';
  $('newSeriesPromptText').value = '';
  chrome.storage.local.set({ promptSeries: series });
  renderSeriesPrompts();
  renderSeries();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const ts  = () => new Date().toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
