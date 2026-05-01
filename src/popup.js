// popup.js

let prompts = [];
let extractAI = 'gpt';
let distillAI = 'gpt';
let series = [];
let currentSeriesId = null;
let expandedCardIdx = null;
let extractSeriesId = null;
let distillSeriesId = null;
let distillPromptIdx = null;
let lastDistillResult = null;
let lastExtractResult = null;

// Schema state
let schemaTemplates = [];
let expandedSchemaIdx = null;
let extractSchemaId = null;  // selected in Extract tab picker
let distillSchemaId = null;  // selected in Distill tab picker

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await clearLegacyCloudSettings();
  await loadSettings();
  renderPrompts();
  renderExtractPromptPicker();
  renderDistillPromptPicker();
  renderExtractSchemaPicker();
  renderDistillSchemaPicker();
  bindAll();
  listenBg();
  renderExtractLibrary();
  renderDistillLibrary();
});

// ── Storage ───────────────────────────────────────────────────────────────────
async function clearLegacyCloudSettings() {
  await chrome.storage.local.remove(['autoDrive', 'driveFolderId', 'sheetId', 'sheetTab', 'oauthToken']);
}

async function loadSettings() {
  const d = await chrome.storage.local.get([
    'prompts','extractAI','distillAI','delaySeconds',
    'fullAuto','autoDownload','draftFolder',
    'wikiTpl','noteTpl','distillAutoSave','extractFolder','distillFolder',
    'promptSeries','popupWidth','popupHeight','popupFontSize','popupTextContrast','lastTab',
    'currentSeriesId','extractSeriesId','distillSeriesId','distillPromptIdx',
    'schemaTemplates','extractSchemaId','distillSchemaId'
  ]);
  prompts = d.prompts || [];
  extractAI = d.extractAI || 'gpt';
  distillAI = d.distillAI || 'gpt';
  series = d.promptSeries || [];
  currentSeriesId = d.currentSeriesId || null;
  extractSeriesId = d.extractSeriesId || null;
  distillSeriesId = d.distillSeriesId || null;
  distillPromptIdx = d.distillPromptIdx ?? null;
  extractSchemaId = d.extractSchemaId || null;
  distillSchemaId = d.distillSchemaId || null;

  // Migrate or initialize schema templates
  schemaTemplates = d.schemaTemplates || [];
  if (!schemaTemplates.length) {
    const defaults = [
      { id: crypto.randomUUID(), name: 'wiki.md',
        text: d.wikiTpl || '請將以下原文整理成 Wikipedia 條目風格的 markdown：包含簡介段落、## 背景、## 主要內容（子節）、## 相關概念、## 參考來源。只輸出 markdown。\n\n{{content}}' },
      { id: crypto.randomUUID(), name: 'YAML',
        text: '請將以下內容整理成 YAML 格式，包含關鍵欄位與值。只輸出 YAML。\n\n{{content}}' },
      { id: crypto.randomUUID(), name: 'Table',
        text: '請將以下內容整理成 Markdown 表格，包含適當的欄位標題。只輸出 Markdown 表格。\n\n{{content}}' },
      { id: crypto.randomUUID(), name: 'Markdown',
        text: '請將以下內容整理成結構清晰的 Markdown 文件。只輸出 markdown。\n\n{{content}}' },
    ];
    if (d.noteTpl) {
      defaults.unshift({ id: crypto.randomUUID(), name: '筆記.md', text: d.noteTpl });
    }
    schemaTemplates = defaults;
    await chrome.storage.local.set({ schemaTemplates });
  }

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

  // Sync AI buttons
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

  // Distill AI selector
  $('distillAiSelect').querySelectorAll('.ai-btn').forEach(b =>
    b.addEventListener('click', () => {
      distillAI = b.dataset.ai;
      $('distillAiSelect').querySelectorAll('.ai-btn').forEach(x => x.classList.toggle('active', x.dataset.ai === distillAI));
      chrome.storage.local.set({ distillAI });
    }));

  // Extract
  $('startBtn').addEventListener('click', startExtract);
  $('stopBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'STOP' });
    setRunUI(false); elog('已停止', 'warn');
  });

  // Extract result
  $('copyExtractBtn').addEventListener('click', () => {
    if (!lastExtractResult) return;
    navigator.clipboard.writeText(lastExtractResult);
    elog('已複製', 'success');
  });
  $('saveExtractBtn').addEventListener('click', saveExtractResult);

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

  // Extract schema picker
  $('extractSchemaSel').addEventListener('change', () => {
    extractSchemaId = $('extractSchemaSel').value || null;
    chrome.storage.local.set({ extractSchemaId });
    updateExtractSchemaPreview();
  });

  // Distill schema picker
  $('distillSchemaSel').addEventListener('change', () => {
    distillSchemaId = $('distillSchemaSel').value || null;
    chrome.storage.local.set({ distillSchemaId });
    updateDistillSchemaPreview();
  });
  $('clearDistillSchemaBtn').addEventListener('click', () => {
    distillSchemaId = null;
    chrome.storage.local.set({ distillSchemaId });
    renderDistillSchemaPicker();
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

  // Prompt series — new tab-bar + card pattern
  $('loadAllSeriesBtn').addEventListener('click', loadAllSeries);
  $('addSeriesBtn').addEventListener('click', addSeries);
  $('newSeriesName').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); addSeries(); }
    if (e.key === 'Escape') { $('newSeriesBar').classList.remove('show'); $('newSeriesName').value = ''; }
  });
  $('cancelNewSeries').addEventListener('click', () => {
    $('newSeriesBar').classList.remove('show');
    $('newSeriesName').value = '';
  });
  $('addPromptTrigger').addEventListener('click', () => {
    $('addPromptForm').classList.add('open');
    $('addPromptTrigger').style.display = 'none';
    $('newSeriesPromptName').focus();
  });
  $('cancelAddPrompt').addEventListener('click', closeAddForm);
  $('confirmAddPrompt').addEventListener('click', addSeriesPrompt);
  $('newSeriesPromptName').addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAddForm();
    if (e.key === 'Enter') { e.preventDefault(); $('newSeriesPromptText').focus(); }
  });
  $('newSeriesPromptText').addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addSeriesPrompt();
    if (e.key === 'Escape') closeAddForm();
  });

  // Schema tab — add-row form
  $('addSchemaTrigger').addEventListener('click', () => {
    $('addSchemaForm').classList.add('open');
    $('addSchemaTrigger').style.display = 'none';
    $('newSchemaName')?.focus();
  });
  $('cancelAddSchema').addEventListener('click', closeAddSchemaForm);
  $('confirmAddSchema').addEventListener('click', addSchema);
  $('newSchemaName').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); addSchema(); }
    if (e.key === 'Escape') closeAddSchemaForm();
  });
  $('newSchemaInitText').addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addSchema();
    if (e.key === 'Escape') closeAddSchemaForm();
  });

  // Schema cards — event delegation
  $('schemaCards').addEventListener('click', e => {
    const delBtn = e.target.closest('[data-saction="delSchema"]');
    if (delBtn) { e.stopPropagation(); delSchema(Number(delBtn.dataset.idx)); return; }
    const head = e.target.closest('[data-saction="toggleSchema"]');
    if (head) {
      const idx = Number(head.dataset.idx);
      expandedSchemaIdx = expandedSchemaIdx === idx ? null : idx;
      renderSchemas();
    }
  });
  $('schemaCards').addEventListener('input', e => {
    const ta = e.target.closest('[data-saction="editSchema"]');
    if (ta) {
      const idx = Number(ta.dataset.idx);
      if (schemaTemplates[idx]) {
        schemaTemplates[idx].text = ta.value;
        chrome.storage.local.set({ schemaTemplates });
        renderExtractSchemaPicker();
        renderDistillSchemaPicker();
        const foot = ta.closest('.pcard')?.querySelector('.pcard-chars');
        if (foot) foot.textContent = ta.value.length + ' 字';
        ta.style.height = 'auto';
        ta.style.height = ta.scrollHeight + 'px';
      }
    }
    const nameInput = e.target.closest('[data-saction="renameSchema"]');
    if (nameInput) {
      const idx = Number(nameInput.dataset.idx);
      if (schemaTemplates[idx]) {
        schemaTemplates[idx].name = nameInput.value;
        chrome.storage.local.set({ schemaTemplates });
        renderExtractSchemaPicker();
        renderDistillSchemaPicker();
      }
    }
  });

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

}

function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === `tab-${name}`));
  const actionsEl = $('topbarPromptsActions');
  if (actionsEl) actionsEl.style.display = name === 'prompts' ? '' : 'none';
  if (name === 'prompts') { renderTabbar(); renderCards(); }
  if (name === 'schema')  { renderSchemas(); }
  if (name === 'extract') { renderExtractPromptPicker(); renderExtractSchemaPicker(); renderExtractLibrary(); }
  if (name === 'distill') { renderDistillPromptPicker(); renderDistillSchemaPicker(); renderDistillLibrary(); }
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

  // Combine prompt + schema if schema selected
  const schema = schemaTemplates.find(s => s.id === extractSchemaId);
  const combined = promptTexts.map(pt =>
    schema ? pt + '\n\n' + schema.text : pt
  );

  const delay = parseInt($('delayInput').value) || 35;
  await chrome.storage.local.set({ delaySeconds: delay });
  prompts.forEach(p => p.status = 'pending');
  chrome.storage.local.set({ prompts }); renderPrompts();
  $('extractResultSection').style.display = 'none';
  lastExtractResult = null;
  setRunUI(true);
  chrome.runtime.sendMessage({ type: 'START_EXTRACT', tabId: tabs[0].id, prompts: combined, delaySeconds: delay });
  elog(`開始萃取 ${combined.length} 個 Prompt${schema ? '（含 Schema: ' + schema.name + '）' : ''}…`, 'info');
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
  if (on && typeof setStep === 'function') setStep(2);
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

  const cfg = await chrome.storage.local.get(['fullAuto']);

  // Resolve template: distill prompt > schema > save as draft
  let wikiTpl = null;
  let fmtLabel = 'draft';

  if (distillSeriesId && distillPromptIdx !== null) {
    const s = series.find(x => x.id === distillSeriesId);
    const p = s?.prompts[distillPromptIdx];
    if (p) {
      // If schema also selected, append schema as format hint
      const schema = schemaTemplates.find(x => x.id === distillSchemaId);
      wikiTpl = schema ? p.text + '\n\n' + schema.text : p.text;
      fmtLabel = p.name;
    }
  } else if (distillSchemaId) {
    const schema = schemaTemplates.find(x => x.id === distillSchemaId);
    if (schema) { wikiTpl = schema.text; fmtLabel = schema.name; }
  }

  if (!wikiTpl) {
    // No template: save as draft directly
    const ts = new Date().toISOString().slice(0,16).replace(/[:T]/g, '-');
    const name = `note_${ts}.md`;
    const stored = await chrome.storage.local.get(['library', 'distillFolder']);
    const lib = stored.library || [];
    lib.unshift({ name, fmt: 'note', content, chars: content.length, date: new Date().toLocaleDateString('zh-TW') });
    await chrome.storage.local.set({ library: lib });
    chrome.runtime.sendMessage({ type: 'DOWNLOAD_MD', name, content, folder: stored.distillFolder || '' });
    renderDistillLibrary();
    dlog(`✅ 已存為 ${name}`, 'success');
    return;
  }

  setDistillUI(true);
  dlog(`送出整理（${fmtLabel}，目標：${distillAI}）…`, 'info');
  chrome.runtime.sendMessage({
    type: 'START_DISTILL',
    content,
    fmt: 'wiki',
    targetAI: distillAI,
    wikiTpl,
    fullAuto: cfg.fullAuto !== false
  });
}

function setDistillUI(on) {
  $('distillBtn').disabled = on;
  $('stopDistillBtn').style.display = on ? '' : 'none';
}

// ── Extract result ────────────────────────────────────────────────────────────
function showExtractResult(responses) {
  const text = responses.map((r, i) =>
    `## #${r.index ?? i + 1}\n\n${r.response}`
  ).join('\n\n---\n\n');
  lastExtractResult = text;
  $('extractResultText').textContent = text;
  $('extractResultSection').style.display = '';
}

async function saveExtractResult() {
  if (!lastExtractResult) { elog('尚無結果可儲存', 'error'); return; }
  const ts = new Date().toISOString().slice(0,16).replace(/[:T]/g, '-');
  const name = `extract_${ts}.md`;
  const stored = await chrome.storage.local.get(['library', 'extractFolder']);
  const lib = stored.library || [];
  lib.unshift({ name, fmt: 'extract', content: lastExtractResult, chars: lastExtractResult.length, date: new Date().toLocaleDateString('zh-TW') });
  await chrome.storage.local.set({ library: lib });
  chrome.runtime.sendMessage({ type: 'DOWNLOAD_MD', name, content: lastExtractResult, folder: stored.extractFolder || '' });
  renderExtractLibrary();
  elog(`✅ 已儲存並下載：${name}`, 'success');
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
  const items = (d.library || []).filter(x => x.fmt === 'extract' || x.fmt === 'structured');
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
    fullAuto:      $('fullAutoToggle').checked,
    autoDownload:  $('autoDownload').checked,
    extractFolder: $('extractFolder').value.trim(),
    distillFolder: $('distillFolder').value.trim(),
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
        if (msg.responses?.length) {
          showExtractResult(msg.responses);
          elog('✅ 萃取完成！請在下方儲存結果', 'success');
        } else {
          elog('✅ 萃取完成', 'success');
        }
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

window.copyText = async txt => { await navigator.clipboard.writeText(txt); dlog('已複製', 'success'); };

// ── Logging ───────────────────────────────────────────────────────────────────
function elog(t, l='info') { appendLog('extractLog', t, l); }
function dlog(t, l='info') { appendLog('distillLog', t, l); }
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

// ── Schema Templates ──────────────────────────────────────────────────────────
function renderSchemas() {
  const area = $('schemaCards');
  if (!area) return;
  if (!schemaTemplates.length) {
    area.innerHTML = '<div class="empty-dot">尚無 Schema — 點下方「新增 Schema」建立第一個格式模板</div>';
    return;
  }
  area.innerHTML = schemaTemplates.map((s, i) => {
    const isExp = i === expandedSchemaIdx;
    return `
    <div class="pcard ${isExp ? 'expanded' : ''}" id="scard-${i}">
      <div class="pcard-head" data-saction="toggleSchema" data-idx="${i}">
        <span class="pcard-num">#${i + 1}</span>
        <div class="pcard-info">
          <div class="pcard-name">${esc(s.name)}</div>
          <div class="pcard-preview">${esc(excerpt(s.text))}</div>
        </div>
        <div class="pcard-head-actions">
          <button class="btn btn-danger" data-saction="delSchema" data-idx="${i}">✕</button>
        </div>
        <span class="chevron">▾</span>
      </div>
      <div class="pcard-body">
        <hr class="pcard-divider">
        <input class="schema-name-input" data-saction="renameSchema" data-idx="${i}" value="${esc(s.name)}" placeholder="Schema 名稱">
        <textarea class="pcard-editor" data-saction="editSchema" data-idx="${i}" placeholder="Schema prompt（{{content}} 代入原始文字）">${esc(s.text)}</textarea>
        <div class="pcard-foot">
          <span class="pcard-chars">${s.text.length} 字</span>
          <div class="spacer"></div>
        </div>
      </div>
    </div>`;
  }).join('');

  // auto-grow & live char count for expanded textarea
  if (expandedSchemaIdx !== null) {
    const card = document.getElementById('scard-' + expandedSchemaIdx);
    if (card) {
      const ta = card.querySelector('.pcard-editor');
      if (ta) {
        ta.style.height = 'auto';
        ta.style.height = ta.scrollHeight + 'px';
      }
    }
  }
}

function closeAddSchemaForm() {
  const form = $('addSchemaForm');
  const trigger = $('addSchemaTrigger');
  if (form) form.classList.remove('open');
  if (trigger) trigger.style.display = '';
  if ($('newSchemaName')) $('newSchemaName').value = '';
  if ($('newSchemaInitText')) $('newSchemaInitText').value = '';
}

function addSchema() {
  const name = ($('newSchemaName')?.value || '').trim();
  const text = ($('newSchemaInitText')?.value || '').trim();
  if (!name) { $('newSchemaName')?.focus(); return; }
  const s = { id: crypto.randomUUID(), name, text };
  schemaTemplates.push(s);
  expandedSchemaIdx = schemaTemplates.length - 1;
  chrome.storage.local.set({ schemaTemplates });
  closeAddSchemaForm();
  renderSchemas();
  renderExtractSchemaPicker();
  renderDistillSchemaPicker();
  showToast(`已新增「${name}」`);
}

function delSchema(idx) {
  const s = schemaTemplates[idx];
  if (!s) return;
  if (!confirm(`刪除 Schema「${s.name}」？`)) return;
  const deletedId = s.id;
  schemaTemplates.splice(idx, 1);
  if (expandedSchemaIdx === idx) expandedSchemaIdx = null;
  else if (expandedSchemaIdx !== null && expandedSchemaIdx > idx) expandedSchemaIdx--;
  if (extractSchemaId === deletedId) { extractSchemaId = null; chrome.storage.local.set({ extractSchemaId }); }
  if (distillSchemaId === deletedId) { distillSchemaId = null; chrome.storage.local.set({ distillSchemaId }); }
  chrome.storage.local.set({ schemaTemplates });
  renderSchemas();
  renderExtractSchemaPicker();
  renderDistillSchemaPicker();
}

// ── Extract Schema Picker ─────────────────────────────────────────────────────
function renderExtractSchemaPicker() {
  const sel = $('extractSchemaSel');
  sel.innerHTML = '<option value="">— 選擇 Schema 格式（選填）—</option>' +
    schemaTemplates.map(s =>
      `<option value="${s.id}"${s.id === extractSchemaId ? ' selected' : ''}>${esc(s.name)}</option>`
    ).join('');
  updateExtractSchemaPreview();
}

function updateExtractSchemaPreview() {
  const el = $('extractSchemaPreview');
  const s = schemaTemplates.find(x => x.id === extractSchemaId);
  if (!s) { el.textContent = ''; el.setAttribute('data-empty', '1'); return; }
  el.textContent = s.text;
  el.removeAttribute('data-empty');
}

// ── Distill Schema Picker ─────────────────────────────────────────────────────
function renderDistillSchemaPicker() {
  const sel = $('distillSchemaSel');
  sel.innerHTML = '<option value="">— 不用 Schema，直接存草稿 —</option>' +
    schemaTemplates.map(s =>
      `<option value="${s.id}"${s.id === distillSchemaId ? ' selected' : ''}>${esc(s.name)}</option>`
    ).join('');
  updateDistillSchemaPreview();
}

function updateDistillSchemaPreview() {
  const el = $('distillSchemaPreview');
  const s = schemaTemplates.find(x => x.id === distillSchemaId);
  if (!s) { el.textContent = ''; el.setAttribute('data-empty', '1'); return; }
  el.textContent = s.text;
  el.removeAttribute('data-empty');
}

// ── Prompt Series — tab-bar + card pattern ────────────────────────────────────

function excerpt(text) {
  const t = String(text || '').replace(/\n+/g, ' ').trim();
  return t.length > 72 ? t.slice(0, 72) + '…' : t;
}

let toastTimer;
function showToast(msg) {
  const el = $('toast');
  if (!el) return;
  el.textContent = '✓ ' + msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

function renderTabbar() {
  const bar = $('seriesTabbar');
  if (!bar) return;
  bar.innerHTML = series.map(s => `
    <button class="series-tab ${s.id === currentSeriesId ? 'active' : ''}" data-action="selectSeries" data-sid="${s.id}">
      ${esc(s.name)}<span class="series-tab-count">${s.prompts.length}</span>
    </button>
  `).join('') + `<button class="tab-add-btn" id="tabAddSeriesBtn" title="新增系列">＋</button>`;

  bar.querySelectorAll('.series-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      currentSeriesId = tab.dataset.sid;
      expandedCardIdx = null;
      chrome.storage.local.set({ currentSeriesId });
      closeAddForm();
      renderTabbar();
      renderCards();
    });
  });

  const addBtn = $('tabAddSeriesBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      $('newSeriesBar').classList.add('show');
      $('newSeriesName').focus();
    });
  }
}

function renderCards() {
  const area = $('seriesCards');
  const addRow = $('addPromptRow');
  if (!area || !addRow) return;

  const s = series.find(x => x.id === currentSeriesId);
  if (!s) {
    area.innerHTML = `<div class="empty-state"><div class="empty-dot"></div><div class="empty-state-text">← 選擇或新增系列</div></div>`;
    addRow.style.display = 'none';
    return;
  }

  addRow.style.display = '';

  if (!s.prompts.length) {
    area.innerHTML = `<div class="empty-state"><div class="empty-dot"></div><div class="empty-state-text">尚無 Prompt<br>點下方「新增 Prompt」開始</div></div>`;
    return;
  }

  area.innerHTML = s.prompts.map((p, i) => {
    const isExp = i === expandedCardIdx;
    return `
    <div class="pcard ${isExp ? 'expanded' : ''}" id="pcard-${i}">
      <div class="pcard-head" data-idx="${i}">
        <span class="pcard-num">#${i+1}</span>
        <div class="pcard-info">
          <div class="pcard-name">${esc(p.name)}</div>
          <div class="pcard-preview">${esc(excerpt(p.text))}</div>
        </div>
        <div class="pcard-head-actions">
          <button class="btn btn-primary btn-xs" data-action="loadOneCard" data-idx="${i}">▶</button>
          <button class="btn btn-danger" data-action="delCard" data-idx="${i}">✕</button>
        </div>
        <span class="chevron">▾</span>
      </div>
      ${isExp ? `
      <hr class="pcard-divider">
      <textarea class="pcard-editor" data-idx="${i}">${esc(p.text)}</textarea>
      <div class="pcard-foot">
        <span class="pcard-chars">${p.text.length} 字</span>
        <div class="spacer"></div>
        <button class="btn btn-primary btn-xs" data-action="loadOneCard" data-idx="${i}">▶ 載入到 ETL</button>
      </div>` : ''}
    </div>`;
  }).join('');

  // Toggle expand on header click
  area.querySelectorAll('.pcard-head').forEach(head => {
    head.addEventListener('click', e => {
      if (e.target.closest('[data-action]')) return;
      const idx = Number(head.dataset.idx);
      expandedCardIdx = expandedCardIdx === idx ? null : idx;
      renderCards();
      requestAnimationFrame(() => {
        const card = $(`pcard-${idx}`);
        if (card && expandedCardIdx === idx) {
          card.scrollIntoView({ block: 'nearest' });
          const editor = card.querySelector('.pcard-editor');
          if (editor) {
            editor.style.height = 'auto';
            editor.style.height = Math.min(editor.scrollHeight, 240) + 'px';
            editor.focus();
          }
        }
      });
    });
  });

  // Auto-grow & save textarea
  area.querySelectorAll('.pcard-editor').forEach(ta => {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 240) + 'px';
    ta.addEventListener('input', () => {
      const idx = Number(ta.dataset.idx);
      const cur = series.find(x => x.id === currentSeriesId);
      if (cur?.prompts[idx]) {
        cur.prompts[idx].text = ta.value;
        chrome.storage.local.set({ promptSeries: series });
        const charEl = ta.closest('.pcard').querySelector('.pcard-chars');
        if (charEl) charEl.textContent = ta.value.length + ' 字';
        const prev = ta.closest('.pcard').querySelector('.pcard-preview');
        if (prev) prev.textContent = excerpt(ta.value);
      }
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 240) + 'px';
    });
  });

  // Action buttons
  area.querySelectorAll('[data-action="loadOneCard"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const idx = Number(btn.dataset.idx);
      const cur = series.find(x => x.id === currentSeriesId);
      if (!cur) return;
      const p = cur.prompts[idx];
      prompts.push({ text: p.text, status: 'pending' });
      chrome.storage.local.set({ prompts });
      switchTab('extract');
      renderPrompts();
      elog(`已載入「${p.name}」到萃取清單`, 'success');
      showToast(`已載入「${p.name}」`);
    });
  });

  area.querySelectorAll('[data-action="delCard"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const idx = Number(btn.dataset.idx);
      const cur = series.find(x => x.id === currentSeriesId);
      if (!cur) return;
      cur.prompts.splice(idx, 1);
      if (expandedCardIdx === idx) expandedCardIdx = null;
      else if (expandedCardIdx !== null && expandedCardIdx > idx) expandedCardIdx--;
      chrome.storage.local.set({ promptSeries: series });
      renderCards();
      renderTabbar();
    });
  });
}

function closeAddForm() {
  $('addPromptForm').classList.remove('open');
  $('addPromptTrigger').style.display = '';
  $('newSeriesPromptName').value = '';
  $('newSeriesPromptText').value = '';
}

function renderSeries() { renderTabbar(); }
function renderSeriesPrompts() { renderCards(); }

function addSeries() {
  const name = $('newSeriesName').value.trim();
  if (!name) return;
  const s = { id: crypto.randomUUID(), name, prompts: [] };
  series.push(s);
  $('newSeriesName').value = '';
  $('newSeriesBar').classList.remove('show');
  chrome.storage.local.set({ promptSeries: series, currentSeriesId: s.id });
  currentSeriesId = s.id;
  expandedCardIdx = null;
  renderTabbar();
  renderCards();
}

function loadAllSeries() {
  const s = series.find(x => x.id === currentSeriesId);
  if (!s || !s.prompts.length) return;
  s.prompts.forEach(p => prompts.push({ text: p.text, status: 'pending' }));
  chrome.storage.local.set({ prompts });
  switchTab('extract');
  renderPrompts();
  elog(`已載入系列「${s.name}」共 ${s.prompts.length} 個 Prompt`, 'success');
  showToast(`已載入 ${s.prompts.length} 個 Prompt`);
}

function addSeriesPrompt() {
  const name = $('newSeriesPromptName').value.trim();
  const text = $('newSeriesPromptText').value.trim();
  if (!name || !text) return;
  const s = series.find(x => x.id === currentSeriesId);
  if (!s) return;
  s.prompts.push({ id: crypto.randomUUID(), name, text });
  expandedCardIdx = s.prompts.length - 1;
  chrome.storage.local.set({ promptSeries: series });
  closeAddForm();
  renderCards();
  renderTabbar();
  showToast(`已新增「${name}」`);
}

window.delSeries = async id => {
  if (!confirm('刪除此系列？')) return;
  series = series.filter(s => s.id !== id);
  if (currentSeriesId === id) { currentSeriesId = null; expandedCardIdx = null; }
  await chrome.storage.local.set({ promptSeries: series, currentSeriesId });
  renderTabbar();
  renderCards();
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const ts  = () => new Date().toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
