// popup.js
// TODO: 未來可讓 DST、ETL 也共用這些 blocks（目前已拆至 src/blocks/*.js）

// ── Module State (Extract / Schema / Prompts) ─────────────────────────────────
let prompts = [];
let extractAI = 'gpt';
let series = [];
let currentSeriesId = null;
let expandedCardIdx = null;
let extractSeriesId = null;
let lastExtractResult = null;

let schemaTemplates = [];
let expandedSchemaIdx = null;
let extractSchemaId = null;

let activeDistillContext = null; // 'distill' | 'flow' | null

// ════════════════════════════════════════════════════════════════════════════
//  Distill Blocks loaded via <script> tags in sidepanel.html (src/blocks/*.js)
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
//  CUSTOM FLOW CONTROLLER
// ════════════════════════════════════════════════════════════════════════════

const CustomFlowController = {
  isInitialized: false,
  isRunning: false,
  stopRequested: false,
  presets: [],
  selectedPresetId: null,
  defaultPresetId: null,
  cardVisible:  { source: true, task: true, format: true, ai: true, run: true },
  blockDelays:  { source: 0, task: 0, format: 0, ai: 0, run: 0 },
  seriesId:  null,
  promptIdx: null,
  schemaId:  null,
  ai:        'gpt',
  lastResult: null,

  init(d) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    const cardsEl = $('cfCards');
    DistillSourceBlock.renderCF(cardsEl);
    DistillTaskBlock.renderCF(cardsEl);
    DistillFormatBlock.renderCF(cardsEl);
    DistillAIBlock.renderCF(cardsEl);
    DistillRunBlock.renderCF(cardsEl);

    this.cardVisible = Object.assign(
      { source: true, task: true, format: true, ai: true, run: true },
      d.cfCardVisible || {}
    );
    this.presets = Array.isArray(d.customFlowPresets) ? d.customFlowPresets : [];
    this.defaultPresetId = d.cfDefaultPresetId || null;
    this.selectedPresetId = this.defaultPresetId && this.presets.some(p => p.id === this.defaultPresetId)
      ? this.defaultPresetId
      : (this.presets[0]?.id || null);
    this.seriesId  = d.cfSeriesId  || null;
    this.promptIdx = d.cfPromptIdx ?? null;
    this.schemaId  = d.cfSchemaId  || null;
    this.ai        = d.cfAI        || 'gpt';

    // Card toggles
    document.querySelectorAll('[data-cf-toggle]').forEach(btn =>
      btn.addEventListener('click', () => this.toggleCard(btn.dataset.cfToggle)));

    // Source
    $('cfGrabPageBtn').addEventListener('click', () => this._grabPage());
    $('cfRawText').addEventListener('input', () => {
      $('cfCharCount').textContent = $('cfRawText').value.length + ' 字';
    });

    // Task
    $('cfSeriesSel').addEventListener('change', () => {
      this.seriesId  = $('cfSeriesSel').value || null;
      const s = series.find(x => x.id === this.seriesId);
      this.promptIdx = s?.prompts.length ? 0 : null;
      chrome.storage.local.set({ cfSeriesId: this.seriesId, cfPromptIdx: this.promptIdx });
      this._renderPromptList();
    });
    $('cfClearPromptBtn').addEventListener('click', () => {
      this.seriesId  = null;
      this.promptIdx = null;
      chrome.storage.local.set({ cfSeriesId: null, cfPromptIdx: null });
      this._renderTaskPicker();
    });
    $('cfPromptSel').addEventListener('change', () => {
      const value = $('cfPromptSel').value;
      this.promptIdx = value === '' ? null : Number(value);
      chrome.storage.local.set({ cfPromptIdx: this.promptIdx });
      this._renderPromptList();
    });

    // Format
    $('cfSchemaSel').addEventListener('change', () => {
      this.schemaId = $('cfSchemaSel').value || null;
      chrome.storage.local.set({ cfSchemaId: this.schemaId });
      this._updateSchemaPreview();
    });
    $('cfClearSchemaBtn').addEventListener('click', () => {
      this.schemaId = null;
      chrome.storage.local.set({ cfSchemaId: null });
      this._renderFormatPicker();
    });

    // AI
    $('cfAiSelect').querySelectorAll('.ai-pill').forEach(b => {
      b.addEventListener('click', () => {
        this.ai = b.dataset.ai;
        $('cfAiSelect').querySelectorAll('.ai-pill').forEach(x =>
          x.classList.toggle('active', x.dataset.ai === this.ai));
        chrome.storage.local.set({ cfAI: this.ai });
      });
    });
    $('cfAiSelect').querySelectorAll('.ai-pill').forEach(b =>
      b.classList.toggle('active', b.dataset.ai === this.ai));

    // Run
    $('cfAutoSave').checked = d.cfAutoSave !== false;
    $('cfAutoSave').addEventListener('change', e =>
      chrome.storage.local.set({ cfAutoSave: e.target.checked }));
    $('cfRunBtn').addEventListener('click', () => this.startFlow());
    $('cfStopBtn').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'STOP' });
      this._setRunUI(false);
      this._log('已停止', 'warn');
    });
    $('cfSaveDraftBtn').addEventListener('click', () => this._saveDraft());
    if ($('cfCopyBtn')) {
      $('cfCopyBtn').addEventListener('click', () => {
        if (!this.lastResult) return;
        navigator.clipboard.writeText(this.lastResult.content);
        this._log('已複製', 'success');
      });
    }
    if ($('cfDlBtn')) {
      $('cfDlBtn').addEventListener('click', () => {
        if (!this.lastResult) return;
        chrome.runtime.sendMessage({ type: 'DOWNLOAD_MD', name: this.lastResult.name, content: this.lastResult.content });
      });
    }

    // Run-all
    $('cfRunAllBtn').addEventListener('click', () => this.runAll());
    $('cfStopAllBtn').addEventListener('click', () => this.stopAll());
    $('cfSavePresetBtn').addEventListener('click', () => this.savePreset());
    $('cfPresetSel').addEventListener('change', async () => {
      this.selectedPresetId = $('cfPresetSel').value || null;
      await chrome.storage.local.set({ cfDefaultPresetId: this.selectedPresetId });
      if (this.selectedPresetId) await this.loadSelectedPreset();
      else this._renderPresetControls();
    });
    $('cfDeletePresetBtn').addEventListener('click', () => this.deleteSelectedPreset());

    // Delay selectors
    ['source', 'task', 'format', 'ai', 'run'].forEach(name =>
      this._initDelayForCard(name, d));

    const defaultPreset = this._getPresetById(this.defaultPresetId);
    if (defaultPreset) this._applyPresetConfig(defaultPreset.config, { persist: false, silent: true });
    else {
      this._renderTaskPicker();
      this._renderFormatPicker();
      this._syncAIPills();
      this._applyDelayControls();
      this._applyAllCards();
      $('cfAutoSave').checked = d.cfAutoSave !== false;
    }
    this._renderPresetControls();
  },

  toggleCard(name) {
    this.cardVisible[name] = !this.cardVisible[name];
    chrome.storage.local.set({ cfCardVisible: this.cardVisible });
    const card = document.querySelector(`[data-cf-card="${name}"]`);
    if (card) card.classList.toggle('cf-collapsed', !this.cardVisible[name]);
    const btn = document.querySelector(`[data-cf-toggle="${name}"]`);
    if (btn) btn.textContent = this.cardVisible[name] ? '隱藏' : '顯示';
  },

  _applyAllCards() {
    Object.entries(this.cardVisible).forEach(([name, visible]) => {
      const card = document.querySelector(`[data-cf-card="${name}"]`);
      if (card) card.classList.toggle('cf-collapsed', !visible);
      const btn = document.querySelector(`[data-cf-toggle="${name}"]`);
      if (btn) btn.textContent = visible ? '隱藏' : '顯示';
    });
  },

  getContent()       { return $('cfRawText')?.value.trim() || ''; },

  getSelectedPrompt() {
    if (!this.seriesId || this.promptIdx === null) return null;
    const s = series.find(x => x.id === this.seriesId);
    const p = s?.prompts[this.promptIdx];
    return p ? { text: p.text, name: p.name } : null;
  },

  getSelectedSchema() {
    if (!this.schemaId) return null;
    const s = schemaTemplates.find(x => x.id === this.schemaId);
    return s ? { text: s.text, name: s.name } : null;
  },

  getAI() { return this.ai; },

  _getPresetById(id) {
    return id ? this.presets.find(p => p.id === id) || null : null;
  },

  _syncAIPills() {
    const root = $('cfAiSelect');
    if (!root) return;
    root.querySelectorAll('.ai-pill').forEach(b =>
      b.classList.toggle('active', b.dataset.ai === this.ai));
  },

  _applyDelayControls() {
    const knownValues = ['0', '2', '5', '10', '20'];
    ['source', 'task', 'format', 'ai', 'run'].forEach(name => {
      const sel = document.querySelector(`[data-cf-delay-for="${name}"]`);
      const custom = document.querySelector(`[data-cf-custom-for="${name}"]`);
      if (!sel) return;
      const value = this.blockDelays[name] ?? 0;
      if (value > 0 && !knownValues.includes(String(value))) {
        sel.value = 'custom';
        if (custom) {
          custom.style.display = '';
          custom.value = value;
        }
      } else {
        sel.value = String(value);
        if (custom) custom.style.display = 'none';
      }
    });
  },

  _normalizePresetConfig(config) {
    const visible = Object.assign(
      { source: true, task: true, format: true, ai: true, run: true },
      config?.cardVisible || {}
    );
    const blockDelays = Object.assign(
      { source: 0, task: 0, format: 0, ai: 0, run: 0 },
      config?.blockDelays || {}
    );
    const ai = ['gpt', 'gemini', 'claude', 'grok'].includes(config?.ai) ? config.ai : 'gpt';
    const seriesId = typeof config?.seriesId === 'string' && series.some(x => x.id === config.seriesId)
      ? config.seriesId
      : null;
    const schemaId = typeof config?.schemaId === 'string' && schemaTemplates.some(x => x.id === config.schemaId)
      ? config.schemaId
      : null;
    let promptIdx = Number.isInteger(config?.promptIdx) ? config.promptIdx : null;
    if (seriesId) {
      const s = series.find(x => x.id === seriesId);
      if (!s?.prompts.length) promptIdx = null;
      else if (promptIdx === null || promptIdx < 0 || promptIdx >= s.prompts.length) promptIdx = 0;
    } else {
      promptIdx = null;
    }
    return {
      cardVisible: visible,
      seriesId,
      promptIdx,
      schemaId,
      ai,
      autoSave: config?.autoSave !== false,
      blockDelays: Object.fromEntries(
        Object.entries(blockDelays).map(([k, v]) => [k, Math.max(0, Math.min(300, Number(v) || 0))])
      ),
    };
  },

  _collectPresetConfig() {
    return {
      cardVisible: { ...this.cardVisible },
      seriesId: this.seriesId,
      promptIdx: this.promptIdx,
      schemaId: this.schemaId,
      ai: this.ai,
      autoSave: $('cfAutoSave')?.checked !== false,
      blockDelays: { ...this.blockDelays },
    };
  },

  async _applyPresetConfig(config, { persist = true, silent = false } = {}) {
    const next = this._normalizePresetConfig(config);
    this.cardVisible = next.cardVisible;
    this.seriesId = next.seriesId;
    this.promptIdx = next.promptIdx;
    this.schemaId = next.schemaId;
    this.ai = next.ai;
    this.blockDelays = next.blockDelays;
    if ($('cfAutoSave')) $('cfAutoSave').checked = next.autoSave;
    this._renderTaskPicker();
    this._renderFormatPicker();
    this._syncAIPills();
    this._applyDelayControls();
    this._applyAllCards();
    if (persist) {
      await chrome.storage.local.set({
        cfCardVisible: this.cardVisible,
        cfSeriesId: this.seriesId,
        cfPromptIdx: this.promptIdx,
        cfSchemaId: this.schemaId,
        cfAI: this.ai,
        cfAutoSave: next.autoSave,
        cfBlockDelays: this.blockDelays,
      });
    }
    if (!silent) showToast('Preset 已載入');
  },

  _renderPresetControls() {
    const sel = $('cfPresetSel');
    if (!sel) return;
    if (!this.presets.length) {
      sel.innerHTML = '<option value="">尚無 Preset</option>';
      sel.disabled = true;
      if ($('cfDeletePresetBtn')) $('cfDeletePresetBtn').disabled = true;
      return;
    }
    if (!this.selectedPresetId || !this.presets.some(p => p.id === this.selectedPresetId)) {
      this.selectedPresetId = this.defaultPresetId && this.presets.some(p => p.id === this.defaultPresetId)
        ? this.defaultPresetId
        : this.presets[0].id;
    }
    sel.disabled = false;
    sel.innerHTML = this.presets.map(p => {
      return `<option value="${p.id}"${p.id === this.selectedPresetId ? ' selected' : ''}>${esc(p.name)}</option>`;
    }).join('');
    if ($('cfDeletePresetBtn')) $('cfDeletePresetBtn').disabled = false;
  },

  async savePreset() {
    const raw = window.prompt('Preset 名稱', '');
    const name = raw?.trim();
    if (!name) return;
    const now = new Date().toISOString();
    const preset = {
      id: crypto.randomUUID(),
      name,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
      config: this._collectPresetConfig(),
    };
    this.presets.unshift(preset);
    this.selectedPresetId = preset.id;
    this.defaultPresetId = preset.id;
    await chrome.storage.local.set({
      customFlowPresets: this.presets,
      cfDefaultPresetId: this.defaultPresetId,
    });
    this._renderPresetControls();
    showToast(`已儲存 Preset：${name}`);
  },

  async loadSelectedPreset() {
    const preset = this._getPresetById(this.selectedPresetId);
    if (!preset) return;
    await this._applyPresetConfig(preset.config);
  },

  async deleteSelectedPreset() {
    const preset = this._getPresetById(this.selectedPresetId);
    if (!preset) return;
    if (!window.confirm(`刪除 Preset「${preset.name}」？`)) return;
    this.presets = this.presets.filter(p => p.id !== preset.id);
    if (this.defaultPresetId === preset.id) this.defaultPresetId = null;
    this.selectedPresetId = this.presets[0]?.id || null;
    if (!this.defaultPresetId && this.selectedPresetId) this.defaultPresetId = this.selectedPresetId;
    await chrome.storage.local.set({
      customFlowPresets: this.presets,
      cfDefaultPresetId: this.defaultPresetId,
    });
    this._renderPresetControls();
    showToast(`已刪除 Preset：${preset.name}`);
  },

  _renderTaskPicker() {
    const sel = $('cfSeriesSel');
    if (!sel) return;
    sel.innerHTML = '<option value="">— 不使用 Prompt 庫 —</option>' +
      series.map(s =>
        `<option value="${s.id}"${s.id === this.seriesId ? ' selected' : ''}>${esc(s.name)}</option>`
      ).join('');
    this._renderPromptList();
  },

  _renderPromptList() {
    const sel = $('cfPromptSel');
    if (!sel) return;
    if (!this.seriesId) {
      sel.innerHTML = '<option value="">— 先選擇 Prompt 系列 —</option>';
      sel.disabled = true;
      this.promptIdx = null;
      this._updateSelectedArea();
      return;
    }
    const s = series.find(x => x.id === this.seriesId);
    if (!s?.prompts.length) {
      sel.innerHTML = '<option value="">此系列無 Prompt</option>';
      sel.disabled = true;
      this.promptIdx = null;
      this._updateSelectedArea();
      return;
    }
    if (this.promptIdx === null || this.promptIdx < 0 || this.promptIdx >= s.prompts.length) {
      this.promptIdx = 0;
      chrome.storage.local.set({ cfPromptIdx: this.promptIdx });
    }
    sel.disabled = false;
    sel.innerHTML = s.prompts.map((p, i) =>
      `<option value="${i}"${i === this.promptIdx ? ' selected' : ''}>${esc(p.name)}</option>`
    ).join('');
    this._updateSelectedArea();
  },

  _updateSelectedArea() {
    const el = $('cfSelectedPromptText');
    if (!el) return;
    const prompt = this.getSelectedPrompt();
    if (!prompt) { el.textContent = ''; el.setAttribute('data-empty', '1'); }
    else { el.textContent = prompt.text; el.removeAttribute('data-empty'); }
  },

  _renderFormatPicker() {
    const sel = $('cfSchemaSel');
    if (!sel) return;
    sel.innerHTML = '<option value="">— 不用 Schema，直接存草稿 —</option>' +
      schemaTemplates.map(s =>
        `<option value="${s.id}"${s.id === this.schemaId ? ' selected' : ''}>${esc(s.name)}</option>`
      ).join('');
    this._updateSchemaPreview();
  },

  _updateSchemaPreview() {
    const el = $('cfSchemaPreview');
    if (!el) return;
    const schema = this.getSelectedSchema();
    if (!schema) { el.textContent = ''; el.setAttribute('data-empty', '1'); return; }
    el.textContent = schema.text;
    el.removeAttribute('data-empty');
  },

  _showResultEmpty(message = '尚未產生結果') {
    if ($('cfResultName')) $('cfResultName').textContent = '結果';
    if ($('cfResultEmpty')) {
      $('cfResultEmpty').textContent = message;
      $('cfResultEmpty').style.display = '';
    }
    if ($('cfResultText')) {
      $('cfResultText').textContent = '';
      $('cfResultText').style.display = 'none';
    }
    if ($('cfCopyBtn')) $('cfCopyBtn').disabled = true;
    if ($('cfDlBtn')) $('cfDlBtn').disabled = true;
  },

  _showResultContent(result) {
    if (!result) return;
    this.lastResult = result;
    if ($('cfResultName')) $('cfResultName').textContent = result.name;
    if ($('cfResultEmpty')) $('cfResultEmpty').style.display = 'none';
    if ($('cfResultText')) {
      $('cfResultText').textContent = result.content;
      $('cfResultText').style.display = '';
    }
    if ($('cfCopyBtn')) $('cfCopyBtn').disabled = false;
    if ($('cfDlBtn')) $('cfDlBtn').disabled = false;
  },

  _setRunUI(on) {
    if ($('cfRunBtn'))  $('cfRunBtn').disabled = on;
    if ($('cfStopBtn')) $('cfStopBtn').style.display = on ? '' : 'none';
    this.isRunning = on;
  },

  _setGlobalRunUI(on) {
    if ($('cfRunAllBtn')) $('cfRunAllBtn').disabled = on;
    if ($('cfStopAllBtn')) $('cfStopAllBtn').style.display = on ? '' : 'none';
  },

  _setGlobalStatus(text, level = 'info') {
    const el = $('cfGlobalStatus');
    if (!el) return;
    el.classList.remove('success', 'error', 'warn');
    if (level === 'success' || level === 'error' || level === 'warn') el.classList.add(level);
    el.innerHTML = `<span class="label">狀態：</span>${esc(text)}`;
  },

  _log(text, level = 'info') {
    const el = $('cfLog');
    if (!el) return;
    const d = document.createElement('div');
    d.className = `ll ${level}`;
    d.textContent = `[${ts()}] ${text}`;
    el.appendChild(d);
    el.scrollTop = el.scrollHeight;
  },

  handleLog(text, level) { this._log(text, level); },

  handleDone(msg) {
    this._setRunUI(false);
    this._setGlobalRunUI(false);
    this.stopRequested = false;
    if ($('cfAutoSave')?.checked && msg.results?.length) {
      const r = msg.results[0];
      this._showResultContent(r);
      this._log('✅ 整理完成並已存檔！', 'success');
      this._setGlobalStatus('✅ 全部完成', 'success');
    } else {
      this._showResultEmpty('此次未自動回收結果。請至 AI 對話框查看。');
      this._log('✅ 已送出，請至 AI 對話框查看', 'success');
      this._setGlobalStatus('✅ 已送出，請至 AI Chat 查看', 'success');
    }
  },

  async _grabPage() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const clean = text => text.replace(/\n{3,}/g, '\n\n').trim();
        const unique = arr => [...new Set(arr.map(s => s.trim()).filter(Boolean))];
        const debug = [];
        const dbg = msg => {
          debug.push(msg);
          console.log(`[NTK grabPage] ${msg}`);
        };
        const url = location.href;
        const isX = /(?:x\.com|twitter\.com)/.test(url);

        const isExcludedNode = el => {
          if (!el) return { excluded: true, reason: 'null-node' };
          if (el.closest('[role="dialog"]')) return { excluded: true, reason: 'inside-dialog' };
          if (el.closest('[aria-label*="Grok"]')) return { excluded: true, reason: 'inside-grok-panel' };
          if (el.closest('[data-testid*="sheet"]')) return { excluded: true, reason: 'inside-sheet' };
          const rect = el.getBoundingClientRect();
          if (rect.left > window.innerWidth * 0.55) return { excluded: true, reason: `right-panel left=${Math.round(rect.left)}` };
          return { excluded: false, reason: '' };
        };

        const collectTextFromNodes = (nodes, selectorPath, fallback) => {
          const accepted = [];
          for (const node of nodes) {
            const text = node.innerText.trim();
            if (!text) continue;
            const verdict = isExcludedNode(node);
            if (verdict.excluded) {
              dbg(`exclude node selector=${selectorPath} reason=${verdict.reason}`);
              continue;
            }
            accepted.push(text);
          }
          if (!accepted.length) {
            dbg(`selector miss path=${selectorPath} fallback=${fallback}`);
            return null;
          }
          const merged = clean(unique(accepted).join('\n\n'));
          dbg(`selector hit path=${selectorPath} fallback=${fallback} textLength=${merged.length}`);
          return merged;
        };

        if (isX) {
          const primary = document.querySelector('main [data-testid="primaryColumn"]')
            || document.querySelector('[data-testid="primaryColumn"]')
            || document.querySelector('main');
          dbg(`x.com detected primaryColumn=${!!primary}`);

          const pickBestArticle = articles => {
            const candidates = articles
              .map(article => {
                const verdict = isExcludedNode(article);
                if (verdict.excluded) {
                  dbg(`exclude article reason=${verdict.reason}`);
                  return null;
                }
                const text = article.innerText.trim();
                if (text.length <= 20) return null;
                const rect = article.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const score = Math.abs(centerX - window.innerWidth * 0.33) + Math.abs(rect.top);
                return { article, score, rect };
              })
              .filter(Boolean)
              .sort((a, b) => a.score - b.score);
            dbg(`filtered article candidates=${candidates.length}`);
            return candidates[0]?.article || null;
          };

          const mainTweet = pickBestArticle(
            primary ? [...primary.querySelectorAll('article[role="article"]')] : []
          ) || pickBestArticle([...document.querySelectorAll('article[role="article"]')]);

          dbg(`selected main article=${!!mainTweet}`);
          if (mainTweet) {
            const primarySelector = '[data-testid="tweetText"]';
            const primaryText = collectTextFromNodes(
              [...mainTweet.querySelectorAll('[data-testid="tweetText"]')],
              primarySelector,
              false
            );
            if (primaryText) return primaryText;

            const fallbackSelector1 = '[lang]';
            const fallbackText1 = collectTextFromNodes(
              [...mainTweet.querySelectorAll('[lang]')],
              fallbackSelector1,
              true
            );
            if (fallbackText1) return fallbackText1;

            const articleText = clean(mainTweet.innerText);
            dbg(`article innerText fallback length=${articleText.length}`);
            if (articleText.length > 20) return articleText;
          }

          dbg('x.com fallback exhausted, continuing to generic extraction');
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
        const text = clean(clone.innerText);
        dbg(`generic extraction length=${text.length}`);
        return text;
      }
    });
    const text = result?.result || '';
    if ($('cfRawText')) { $('cfRawText').value = text; $('cfCharCount').textContent = text.length + ' 字'; }
    this._log(`已抓取頁面 ${text.length} 字`, 'success');
  },

  async _saveDraft() {
    const content = this.getContent();
    if (!content) { this._log('請先輸入或抓取內容', 'error'); return; }
    const tStr   = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    const name   = `draft_${tStr}.md`;
    const stored = await chrome.storage.local.get(['library', 'distillFolder']);
    const lib    = stored.library || [];
    lib.unshift({ name, fmt: 'draft', content, chars: content.length, date: new Date().toLocaleDateString('zh-TW') });
    await chrome.storage.local.set({ library: lib });
    chrome.runtime.sendMessage({ type: 'DOWNLOAD_MD', name, content, folder: stored.distillFolder || '' });
    this._log(`已儲存草稿：${name}`, 'success');
  },

  async startFlow() {
    const content = this.getContent();
    if (!content) { this._log('請先輸入或抓取內容', 'error'); return; }

    const cfg = await chrome.storage.local.get(['fullAuto']);
    let wikiTpl  = null;
    let fmtLabel = 'draft';

    const selectedPrompt = this.getSelectedPrompt();
    const selectedSchema = this.getSelectedSchema();

    if (selectedPrompt) {
      wikiTpl  = selectedSchema
        ? selectedPrompt.text + '\n\n' + selectedSchema.text
        : selectedPrompt.text;
      fmtLabel = selectedPrompt.name;
    } else if (selectedSchema) {
      wikiTpl  = selectedSchema.text;
      fmtLabel = selectedSchema.name;
    }

    if (!wikiTpl) {
      await this._saveDraft();
      return;
    }

    activeDistillContext = 'flow';
    this._setRunUI(true);
    this._showResultEmpty('執行中，等待結果…');
    this._log(`送出整理（${fmtLabel}，${this.getAI()}）…`, 'info');
    this._setGlobalStatus(`試跑中，等待 ${this.getAI().toUpperCase()} 回覆...`);
    chrome.runtime.sendMessage({
      type:     'START_DISTILL',
      source:   'flow',
      content,
      fmt:      'wiki',
      targetAI: this.getAI(),
      wikiTpl,
      autoSave: $('cfAutoSave')?.checked !== false,
      fullAuto: cfg.fullAuto !== false,
    });
  },

  _initDelayForCard(name, d) {
    const sel    = document.querySelector(`[data-cf-delay-for="${name}"]`);
    const custom = document.querySelector(`[data-cf-custom-for="${name}"]`);
    if (!sel) return;

    const saved = (d.cfBlockDelays || {})[name] ?? 0;
    this.blockDelays[name] = saved;

    const knownValues = ['0', '2', '5', '10', '20'];
    if (saved > 0 && !knownValues.includes(String(saved))) {
      sel.value = 'custom';
      if (custom) { custom.style.display = ''; custom.value = saved; }
    } else {
      sel.value = String(saved);
      if (custom) custom.style.display = 'none';
    }

    sel.addEventListener('change', () => {
      if (sel.value === 'custom') {
        if (custom) { custom.style.display = ''; custom.focus(); }
      } else {
        if (custom) custom.style.display = 'none';
        this.blockDelays[name] = Number(sel.value);
        this._saveDelays();
      }
    });

    if (custom) {
      custom.addEventListener('change', () => {
        const v = Math.max(0, Math.min(300, Number(custom.value) || 0));
        custom.value = v;
        this.blockDelays[name] = v;
        this._saveDelays();
      });
    }
  },

  _saveDelays() {
    chrome.storage.local.set({ cfBlockDelays: this.blockDelays });
  },

  _getDelay(name) {
    return this.blockDelays[name] ?? 0;
  },

  _highlightCard(name, on) {
    const card = document.querySelector(`[data-cf-card="${name}"]`);
    if (card) card.classList.toggle('cf-active', on);
  },

  _statusLabelForCard(name) {
    return ({
      source: '01 - 抓取來源內容',
      task: '02 - 套用 Prompt',
      format: '03 - 套用 Schema',
      ai: '04 - 設定目標 AI',
      run: '05 - 送出整理',
    })[name] || name;
  },

  async _waitWithStatus(name, delay) {
    for (let remaining = delay; remaining > 0; remaining--) {
      if (this.stopRequested) return false;
      this._setGlobalStatus(`${this._statusLabelForCard(name)}，${remaining} 秒延遲等待中...`);
      await new Promise(r => setTimeout(r, 1000));
    }
    return !this.stopRequested;
  },

  stopAll() {
    this.stopRequested = true;
    chrome.runtime.sendMessage({ type: 'STOP' });
    this._setRunUI(false);
    this._setGlobalRunUI(false);
    this._setGlobalStatus('已停止', 'warn');
    this._log('已停止', 'warn');
  },

  async runAll() {
    if (this.isRunning) return;
    const order = ['source', 'task', 'format', 'ai', 'run'];
    const visible = order.filter(n => this.cardVisible[n] !== false);
    if (!visible.length) return;

    this.stopRequested = false;
    this._setGlobalRunUI(true);
    this._setGlobalStatus('執行中...');

    // Build pipeline state as blocks execute
    const pipeline = {
      content: this.getContent(),
      prompt:  this.cardVisible.task !== false ? this.getSelectedPrompt() : null,
      schema:  this.cardVisible.format !== false ? this.getSelectedSchema() : null,
      ai:      this.getAI(),
    };

    console.log('[CF runAll] start. visible:', visible.join(' → '));

    for (const name of visible) {
      if (this.stopRequested) break;
      this._highlightCard(name, true);
      this._setGlobalStatus(this._statusLabelForCard(name));
      console.log('[CF runAll] block:', name);

      if (name === 'source') {
        this._log('⟳ 抓取來源內容…', 'info');
        await this._grabPage();
        pipeline.content = this.getContent();
        console.log('[CF runAll] source: content length =', pipeline.content.length);
        this._log(`✓ 來源：${pipeline.content.length} 字`, 'success');

      } else if (name === 'task') {
        pipeline.prompt = this.getSelectedPrompt();
        console.log('[CF runAll] task: prompt =', pipeline.prompt?.name ?? '(none)');
        this._log(pipeline.prompt ? `✓ Prompt：${pipeline.prompt.name}` : '— 未選 Prompt，略過', 'info');

      } else if (name === 'format') {
        pipeline.schema = this.getSelectedSchema();
        console.log('[CF runAll] format: schema =', pipeline.schema?.name ?? '(none)');
        this._log(pipeline.schema ? `✓ Schema：${pipeline.schema.name}` : '— 未選 Schema，略過', 'info');

      } else if (name === 'ai') {
        pipeline.ai = this.getAI();
        console.log('[CF runAll] ai: target =', pipeline.ai);
        this._log(`✓ 目標 AI：${pipeline.ai}`, 'info');

      } else if (name === 'run') {
        console.log('[CF runAll] run: pipeline =', {
          contentLen: pipeline.content.length,
          prompt: pipeline.prompt?.name ?? null,
          schema: pipeline.schema?.name ?? null,
          ai: pipeline.ai,
        });
        await this._runWithPipeline(pipeline);
      }

      const delay = this._getDelay(name);
      if (delay > 0 && name !== 'run') {
        this._log(`⏱ 等待 ${delay}s…`, 'info');
        console.log('[CF runAll] delay', delay, 's after block:', name);
        const finished = await this._waitWithStatus(name, delay);
        if (!finished) break;
      }

      this._highlightCard(name, false);
    }

    order.forEach(name => this._highlightCard(name, false));
    if (!this.isRunning) {
      this._setGlobalRunUI(false);
      if (!this.stopRequested) this._setGlobalStatus('就緒');
    }
  },

  async _runWithPipeline(pipeline) {
    const { content, prompt, schema, ai } = pipeline;

    if (!content) {
      this._log('❌ 無來源內容，請先執行 Source block', 'error');
      console.warn('[CF runAll] _runWithPipeline: no content, aborting');
      return;
    }

    let wikiTpl  = null;
    let fmtLabel = 'draft';

    if (prompt) {
      wikiTpl  = schema
        ? prompt.text + '\n\n' + schema.text
        : prompt.text;
      fmtLabel = prompt.name;
    } else if (schema) {
      wikiTpl  = schema.text;
      fmtLabel = schema.name;
    }

    console.log('[CF runAll] Final pipeline:', {
      contentLen: content.length,
      contentPreview: content.slice(0, 80) + '…',
      prompt: prompt?.name ?? null,
      schema: schema?.name ?? null,
      ai,
    });
    console.log('[CF runAll] Combined prompt to send:', wikiTpl ? wikiTpl.slice(0, 200) + '…' : null);

    if (!wikiTpl) {
      this._log('⚠️ 無 Prompt / Schema，改存草稿', 'warn');
      await this._saveDraft();
      return;
    }

    activeDistillContext = 'flow';
    this._setRunUI(true);
    this._showResultEmpty('執行中，等待結果…');
    this._log(`送出（${fmtLabel} → ${ai}）…`, 'info');
    this._setGlobalStatus(`05 - 送出整理，等待 ${ai.toUpperCase()} 回覆中...`);
    console.log('[CF runAll] Sending START_DISTILL with ai:', ai, '| fullAuto: true | prompt length:', wikiTpl.length);

    chrome.runtime.sendMessage({
      type:     'START_DISTILL',
      source:   'flow',
      content,
      fmt:      'wiki',
      targetAI: ai,
      wikiTpl,
      autoSave: $('cfAutoSave')?.checked !== false,
      fullAuto: true,  // Custom Flow always runs in full-auto mode
    });
  },
};

// ════════════════════════════════════════════════════════════════════════════
//  END CUSTOM FLOW CONTROLLER
// ════════════════════════════════════════════════════════════════════════════

// ── ETL Tab DOM builder ───────────────────────────────────────────────────────
function initETLTab() {
  const etlContainer = $('etlContainer');
  const etlSteps = document.createElement('div');
  etlSteps.className = 'etl-flow';
  etlSteps.id = 'etlSteps';
  ETLCard1Block.render(etlSteps);
  ETLCard2Block.render(etlSteps);
  ETLCard3Block.render(etlSteps);
  ETLCard4Block.render(etlSteps);
  ETLCard5Block.render(etlSteps);
  etlContainer.appendChild(etlSteps);
  ETLCard5Block.renderLib(etlContainer);

  // Card toggle (collapse/expand)
  etlSteps.addEventListener('click', e => {
    const btn = e.target.closest('[data-etl-toggle]');
    if (!btn) return;
    const card = etlSteps.querySelector(`[data-etl-card="${btn.dataset.etlToggle}"]`);
    if (!card) return;
    const hidden = card.classList.toggle('cf-collapsed');
    btn.textContent = hidden ? '展開' : '隱藏';
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initETLTab();                       // synchronous DOM build — must run before any await
  await clearLegacyCloudSettings();
  await migrateLegacyDistillAutoSave();
  const d = await loadSettings();

  CustomFlowController.init(d);

  renderPrompts();
  renderExtractPromptPicker();
  renderExtractSchemaPicker();
  bindAll();
  // Apply stored extractAI to Card 03 pill buttons
  document.querySelectorAll('#extractAiSel .ai-pill').forEach(b =>
    b.classList.toggle('active', b.dataset.ai === extractAI));
  listenBg();
  renderExtractLibrary();
});

// ── Storage ───────────────────────────────────────────────────────────────────
async function clearLegacyCloudSettings() {
  await chrome.storage.local.remove(['autoDrive', 'driveFolderId', 'sheetId', 'sheetTab', 'oauthToken']);
}

async function migrateLegacyDistillAutoSave() {
  const legacy = await chrome.storage.local.get(['cfAutoSave', 'distillAutoSave']);
  if (typeof legacy.cfAutoSave !== 'boolean' && typeof legacy.distillAutoSave === 'boolean') {
    await chrome.storage.local.set({ cfAutoSave: legacy.distillAutoSave });
  }
  if (Object.prototype.hasOwnProperty.call(legacy, 'distillAutoSave')) {
    await chrome.storage.local.remove(['distillAutoSave']);
  }
}

async function loadSettings() {
  const d = await chrome.storage.local.get([
    'prompts', 'extractAI', 'distillAI', 'delaySeconds',
    'fullAuto', 'autoDownload', 'draftFolder',
    'wikiTpl', 'noteTpl', 'extractFolder', 'distillFolder',
    'promptSeries', 'popupFontSize', 'popupTextContrast', 'lastTab',
    'currentSeriesId', 'extractSeriesId', 'distillSeriesId', 'distillPromptIdx',
    'schemaTemplates', 'extractSchemaId', 'distillSchemaId',
    'cfCardVisible', 'cfSeriesId', 'cfPromptIdx', 'cfSchemaId', 'cfAI', 'cfAutoSave', 'cfBlockDelays',
    'customFlowPresets', 'cfDefaultPresetId',
  ]);

  prompts         = d.prompts || [];
  extractAI       = d.extractAI || 'gpt';
  series          = d.promptSeries || [];
  currentSeriesId = d.currentSeriesId || null;
  extractSeriesId = d.extractSeriesId || null;
  extractSchemaId = d.extractSchemaId || null;

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
    if (d.noteTpl) defaults.unshift({ id: crypto.randomUUID(), name: '筆記.md', text: d.noteTpl });
    schemaTemplates = defaults;
    await chrome.storage.local.set({ schemaTemplates });
  }

  applyPopupFontSize(d.popupFontSize || 'standard');
  applyPopupTextContrast(d.popupTextContrast || 'standard');

  $('delayInput').value        = d.delaySeconds || 35;
  $('fullAutoToggle').checked  = d.fullAuto !== false;
  $('autoDownload').checked    = d.autoDownload !== false;
  $('extractFolder').value     = d.extractFolder || d.draftFolder || '';

  if (d.lastTab) switchTab(d.lastTab);

  return d;
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

// ── Event binding (non-Distill) ───────────────────────────────────────────────
function bindAll() {
  document.querySelectorAll('.tab').forEach(t =>
    t.addEventListener('click', () => switchTab(t.dataset.tab)));

  // Extract run
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

  // Extract pickers
  $('extractSeriesSel').addEventListener('change', () => {
    extractSeriesId = $('extractSeriesSel').value || null;
    chrome.storage.local.set({ extractSeriesId });
    renderExtractPromptList();
  });
  $('extractSchemaSel').addEventListener('change', () => {
    extractSchemaId = $('extractSchemaSel').value || null;
    chrome.storage.local.set({ extractSchemaId });
    updateExtractSchemaPreview();
  });

  // Extract library
  $('extractLibToggle').addEventListener('click', () => {
    const list    = $('extractLibList');
    const chevron = $('extractLibChevron');
    const open    = list.style.display !== 'none';
    list.style.display = open ? 'none' : '';
    chevron.classList.toggle('open', !open);
  });
  $('extractLibList').addEventListener('click', async e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const name = btn.dataset.name;
    if (btn.dataset.action === 'copyDocByName') await copyDocByName(name);
    if (btn.dataset.action === 'dlDocByName')   dlDocByName(name);
    if (btn.dataset.action === 'delDocByName')  {
      await delDocByName(name);
      renderExtractLibrary();
      if (DistillRunBlock.isInitialized) DistillRunBlock.renderLibrary();
    }
  });

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

  // Extract prompt dropdown picker
  $('extractPromptList').addEventListener('change', e => {
    const val = e.target.value;
    const preview = $('extractPromptPreview');
    if (!val) {
      if (preview) { preview.textContent = ''; preview.classList.remove('visible'); }
      return;
    }
    const [sid, idx] = val.split('|');
    const s = series.find(x => x.id === sid);
    const p = s?.prompts[Number(idx)];
    if (p && preview) {
      preview.textContent = p.text;
      preview.classList.add('visible');
    }
    addFromLib(sid, Number(idx));
  });

  // Extract AI picker (Card 03)
  document.querySelectorAll('#extractAiSel .ai-pill').forEach(b =>
    b.addEventListener('click', () => {
      extractAI = b.dataset.ai;
      document.querySelectorAll('#extractAiSel .ai-pill').forEach(x =>
        x.classList.toggle('active', x.dataset.ai === extractAI));
      chrome.storage.local.set({ extractAI });
    }));

  // Prompt series
  $('exportPromptsBtn').addEventListener('click', exportPromptSeries);
  $('importPromptsBtn').addEventListener('click', () => $('promptImportInput').click());
  $('promptImportInput').addEventListener('change', async e => {
    const input = e.target;
    try {
      await importPromptSeries(input.files?.[0]);
    } catch (err) {
      alert(`Prompt 匯入失敗：${err.message}`);
    } finally {
      input.value = '';
    }
  });
  $('addSeriesBtn').addEventListener('click', addSeries);
  $('newSeriesName').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); addSeries(); }
    if (e.key === 'Escape') { $('newSeriesBar').classList.remove('show'); $('newSeriesName').value = ''; }
  });
  $('cancelNewSeries').addEventListener('click', () => {
    $('newSeriesBar').classList.remove('show');
    $('newSeriesName').value = '';
  });
  $('saveSeriesNameBtn').addEventListener('click', saveCurrentSeriesName);
  $('editSeriesName').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); saveCurrentSeriesName(); }
    if (e.key === 'Escape') closeEditSeriesForm();
  });
  $('cancelEditSeries').addEventListener('click', closeEditSeriesForm);
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

  // Schema tab
  $('exportSchemasBtn').addEventListener('click', exportSchemaTemplates);
  $('importSchemasBtn').addEventListener('click', () => $('schemaImportInput').click());
  $('schemaImportInput').addEventListener('change', async e => {
    const input = e.target;
    try {
      await importSchemaTemplates(input.files?.[0]);
    } catch (err) {
      alert(`Schema 匯入失敗：${err.message}`);
    } finally {
      input.value = '';
    }
  });
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
        _showSaveToast();
        renderExtractSchemaPicker();
        DistillFormatBlock._renderPicker();
        CustomFlowController._renderFormatPicker();
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
        _showSaveToast();
        renderExtractSchemaPicker();
        DistillFormatBlock._renderPicker();
        CustomFlowController._renderFormatPicker();
      }
    }
  });

  // Settings
  $('saveSettingsBtn').addEventListener('click', saveSettings);
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
}

function switchTab(name) {
  if (name === 'distill') name = 'flow';
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === `tab-${name}`));
  const promptActionsEl = $('topbarPromptsActions');
  const schemaActionsEl = $('topbarSchemaActions');
  if (promptActionsEl) promptActionsEl.style.display = name === 'prompts' ? '' : 'none';
  if (schemaActionsEl) schemaActionsEl.style.display = name === 'schema' ? '' : 'none';
  if (name === 'prompts') { renderTabbar(); renderCards(); }
  if (name === 'schema')  { renderSchemas(); }
  if (name === 'extract') { renderExtractPromptPicker(); renderExtractSchemaPicker(); renderExtractLibrary(); }
  if (name === 'flow')    { CustomFlowController._renderTaskPicker(); CustomFlowController._renderFormatPicker(); }
  chrome.storage.local.set({ lastTab: name });
}

// ── Prompts ───────────────────────────────────────────────────────────────────
window.delPrompt = i => { prompts.splice(i, 1); chrome.storage.local.set({ prompts }); renderPrompts(); };
window.editPrompt = (i, v, persist = true) => {
  if (!prompts[i]) return;
  prompts[i].text = v;
  if (persist) chrome.storage.local.set({ prompts });
};

function renderPrompts() {
  const el = $('promptList');
  if (!prompts.length) { el.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text3);font-size:11px">尚無 Prompt</div>'; return; }
  const ic = { pending: '○', running: '⏳', done: '✅', error: '❌' };
  el.innerHTML = prompts.map((p, i) => `
    <div class="pi ${p.status || ''}" id="pi${i}">
      <span class="pi-n">#${i + 1}</span>
      <textarea class="pi-txt" rows="${promptPreviewRows(p.text)}" data-action="editPrompt" data-idx="${i}">${esc(p.text)}</textarea>
      <span class="pi-ico">${ic[p.status] || '○'}</span>
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

  const schema = schemaTemplates.find(s => s.id === extractSchemaId);
  const combined = promptTexts.map(pt => schema ? pt + '\n\n' + schema.text : pt);

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
  const tStr = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  const name = `extract_${tStr}.md`;
  const stored = await chrome.storage.local.get(['library', 'extractFolder']);
  const lib = stored.library || [];
  lib.unshift({ name, fmt: 'extract', content: lastExtractResult, chars: lastExtractResult.length, date: new Date().toLocaleDateString('zh-TW') });
  await chrome.storage.local.set({ library: lib });
  chrome.runtime.sendMessage({ type: 'DOWNLOAD_MD', name, content: lastExtractResult, folder: stored.extractFolder || '' });
  renderExtractLibrary();
  elog(`✅ 已儲存並下載：${name}`, 'success');
}

// ── Shared Library helpers ────────────────────────────────────────────────────
function libItemHtml(doc) {
  const icon = doc.fmt === 'wiki' ? '📖' : doc.fmt === 'draft' ? '📝' : doc.fmt === 'structured' ? '🗂' : '📄';
  const safeName = esc(doc.name);
  return `
  <div class="lib-item">
    <span class="lib-icon">${icon}</span>
    <span class="lib-name" title="${safeName}">${safeName}</span>
    <span class="lib-date">${doc.date}</span>
    <div class="lib-acts">
      <button class="btn btn-ghost btn-xs" data-action="copyDocByName" data-name="${safeName}">複製</button>
      <button class="btn btn-ghost btn-xs" data-action="dlDocByName"   data-name="${safeName}">⬇</button>
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
    : '<div style="padding:6px 0;font-size:10px;color:var(--text3)">尚無萃取記錄</div>';
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
        $('progFill').style.width = (msg.total ? Math.round(msg.current / msg.total * 100) : 0) + '%';
        $('progTxt').textContent = `${msg.current} / ${msg.total}`;
        break;

      case 'LOG_EXTRACT': elog(msg.text, msg.level); break;
      case 'LOG_DISTILL':
        if (activeDistillContext === 'flow') CustomFlowController.handleLog(msg.text, msg.level);
        else if (DistillRunBlock.isInitialized) DistillRunBlock.handleLog(msg.text, msg.level);
        break;

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
        if (activeDistillContext === 'flow') CustomFlowController.handleDone(msg);
        else if (DistillRunBlock.isInitialized) DistillRunBlock.handleDone(msg);
        activeDistillContext = null;
        break;

      case 'ERROR':
        elog('❌ ' + msg.text, 'error');
        if (activeDistillContext === 'flow') {
          CustomFlowController.handleLog('❌ ' + msg.text, 'error');
          CustomFlowController._setRunUI(false);
          CustomFlowController._setGlobalRunUI(false);
          CustomFlowController._setGlobalStatus('❌ ' + msg.text, 'error');
        } else if (DistillRunBlock.isInitialized) {
          DistillRunBlock.handleLog('❌ ' + msg.text, 'error');
          DistillRunBlock.setUI(false);
        }
        setRunUI(false);
        activeDistillContext = null;
        break;
    }
  });
}

window.copyText = async txt => { await navigator.clipboard.writeText(txt); dlog('已複製', 'success'); };

// ── Logging ───────────────────────────────────────────────────────────────────
function elog(t, l = 'info') { appendLog('extractLog', t, l); }
function dlog(t, l = 'info') { appendLog('distillLog', t, l); }
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
  const preview = $('extractPromptPreview');
  if (preview) { preview.textContent = ''; preview.classList.remove('visible'); }
  if (!extractSeriesId) {
    list.innerHTML = '<option value="">— 選擇 Prompt —</option>';
    return;
  }
  const s = series.find(x => x.id === extractSeriesId);
  if (!s?.prompts.length) {
    list.innerHTML = '<option value="">此系列無 Prompt</option>';
    return;
  }
  list.innerHTML = '<option value="">— 選擇 Prompt —</option>' +
    s.prompts.map((p, i) =>
      `<option value="${s.id}|${i}">${esc(p.name)}</option>`
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

// ── Schema Templates ──────────────────────────────────────────────────────────
function renderSchemas() {
  const area = $('schemaCards');
  if (!area) return;
  if (!schemaTemplates.length) {
    area.innerHTML = '<div class="empty-dot"></div><div style="text-align:center;color:var(--text3);font-size:12px">尚無 Schema — 點下方「新增 Schema」建立第一個格式模板</div>';
    return;
  }
  area.innerHTML = schemaTemplates.map((s, i) => {
    const isExp = i === expandedSchemaIdx;
    return `
    <div class="pcard ${isExp ? 'expanded' : ''}" id="scard-${i}">
      <div class="pcard-head" data-saction="toggleSchema" data-idx="${i}">
        <span class="pcard-num">#${i + 1}</span>
        <div class="pcard-info">
          <div class="pcard-name-row">
            <div class="pcard-name">${esc(s.name)}</div>
            <span class="pcard-edit-badge" title="名稱可編輯">✎</span>
          </div>
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
          <button class="btn btn-primary btn-xs" data-saction="copySchema" data-idx="${i}">⧉ 複製 Schema</button>
        </div>
      </div>
    </div>`;
  }).join('');

  if (expandedSchemaIdx !== null) {
    const card = document.getElementById('scard-' + expandedSchemaIdx);
    if (card) {
      const ta = card.querySelector('.pcard-editor');
      if (ta) { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }
    }
  }

  area.querySelectorAll('[data-saction="copySchema"]').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const idx = Number(btn.dataset.idx);
      const schema = schemaTemplates[idx];
      if (!schema) return;
      try {
        await navigator.clipboard.writeText(schema.text);
        showToast(`已複製「${schema.name}」`);
      } catch (_) {
        alert('複製失敗，請確認瀏覽器權限。');
      }
    });
  });
}

function closeAddSchemaForm() {
  const form    = $('addSchemaForm');
  const trigger = $('addSchemaTrigger');
  if (form) form.classList.remove('open');
  if (trigger) trigger.style.display = '';
  if ($('newSchemaName'))    $('newSchemaName').value = '';
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
  DistillFormatBlock._renderPicker();
  CustomFlowController._renderFormatPicker();
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
  if (DistillFormatBlock.schemaId === deletedId) {
    DistillFormatBlock.schemaId = null;
    chrome.storage.local.set({ distillSchemaId: null });
  }
  if (CustomFlowController.schemaId === deletedId) {
    CustomFlowController.schemaId = null;
    chrome.storage.local.set({ cfSchemaId: null });
  }
  chrome.storage.local.set({ schemaTemplates });
  renderSchemas();
  renderExtractSchemaPicker();
  DistillFormatBlock._renderPicker();
  CustomFlowController._renderFormatPicker();
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

function makeExportStamp() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/[:T]/g, '-');
}

function queueDownloadText(name, content, mime = 'text/plain;charset=utf-8') {
  chrome.runtime.sendMessage({ type: 'DOWNLOAD_TEXT', name, content, mime });
}

function ensureUniqueId(rawId, seen) {
  const base = typeof rawId === 'string' && rawId.trim() ? rawId.trim() : crypto.randomUUID();
  let id = base;
  while (seen.has(id)) id = crypto.randomUUID();
  seen.add(id);
  return id;
}

function normalizePromptImport(parsed) {
  const rawSeries = Array.isArray(parsed) ? parsed : parsed?.promptSeries;
  if (!Array.isArray(rawSeries)) throw new Error('Prompt 匯入檔格式不正確');

  const seriesIds = new Set();
  return rawSeries.map((item, sIdx) => {
    const promptIds = new Set();
    const promptsRaw = Array.isArray(item?.prompts) ? item.prompts : [];
    const name = String(item?.name || `未命名系列 ${sIdx + 1}`).trim() || `未命名系列 ${sIdx + 1}`;
    return {
      id: ensureUniqueId(item?.id, seriesIds),
      name,
      prompts: promptsRaw.map((p, pIdx) => ({
        id: ensureUniqueId(p?.id, promptIds),
        name: String(p?.name || `Prompt ${pIdx + 1}`).trim() || `Prompt ${pIdx + 1}`,
        text: String(p?.text || ''),
      })),
    };
  });
}

function normalizeSchemaImport(parsed) {
  const rawSchemas = Array.isArray(parsed) ? parsed : parsed?.schemaTemplates;
  if (!Array.isArray(rawSchemas)) throw new Error('Schema 匯入檔格式不正確');

  const schemaIds = new Set();
  return rawSchemas.map((item, idx) => ({
    id: ensureUniqueId(item?.id, schemaIds),
    name: String(item?.name || `Schema ${idx + 1}`).trim() || `Schema ${idx + 1}`,
    text: String(item?.text || ''),
  }));
}

function reconcilePromptSelection(seriesId, promptIdx, sourceSeries) {
  if (!seriesId) return { seriesId: null, promptIdx: null };
  const s = sourceSeries.find(x => x.id === seriesId);
  if (!s) return { seriesId: null, promptIdx: null };
  if (promptIdx === null || promptIdx === undefined) return { seriesId, promptIdx: null };
  return (promptIdx >= 0 && promptIdx < s.prompts.length)
    ? { seriesId, promptIdx }
    : { seriesId, promptIdx: null };
}

function reconcileSchemaSelection(schemaId, sourceSchemas) {
  return schemaId && sourceSchemas.some(x => x.id === schemaId) ? schemaId : null;
}

function refreshPromptConsumers() {
  renderTabbar();
  renderCards();
  renderExtractPromptPicker();
  DistillTaskBlock._renderPicker();
  CustomFlowController._renderTaskPicker();
}

function refreshSchemaConsumers() {
  renderSchemas();
  renderExtractSchemaPicker();
  DistillFormatBlock._renderPicker();
  CustomFlowController._renderFormatPicker();
}

function exportPromptSeries() {
  const payload = {
    type: 'narrative-toolkit.prompts',
    version: 1,
    exportedAt: new Date().toISOString(),
    promptSeries: series,
  };
  queueDownloadText(
    `narrative-toolkit-prompts-${makeExportStamp()}.json`,
    JSON.stringify(payload, null, 2),
    'application/json;charset=utf-8'
  );
  showToast(`已匯出 ${series.length} 個系列`);
}

function exportSchemaTemplates() {
  const payload = {
    type: 'narrative-toolkit.schemas',
    version: 1,
    exportedAt: new Date().toISOString(),
    schemaTemplates,
  };
  queueDownloadText(
    `narrative-toolkit-schemas-${makeExportStamp()}.json`,
    JSON.stringify(payload, null, 2),
    'application/json;charset=utf-8'
  );
  showToast(`已匯出 ${schemaTemplates.length} 個 Schema`);
}

async function importPromptSeries(file) {
  if (!file) return;
  if (!confirm('匯入 Prompts 會覆蓋目前 Prompt 庫，是否繼續？')) return;

  const text = await file.text();
  const parsed = JSON.parse(text);
  const importedSeries = normalizePromptImport(parsed);

  series = importedSeries;
  currentSeriesId = series.some(x => x.id === currentSeriesId) ? currentSeriesId : (series[0]?.id || null);
  extractSeriesId = series.some(x => x.id === extractSeriesId) ? extractSeriesId : null;

  const distillState = reconcilePromptSelection(DistillTaskBlock.seriesId, DistillTaskBlock.promptIdx, series);
  DistillTaskBlock.seriesId = distillState.seriesId;
  DistillTaskBlock.promptIdx = distillState.promptIdx;

  const flowState = reconcilePromptSelection(CustomFlowController.seriesId, CustomFlowController.promptIdx, series);
  CustomFlowController.seriesId = flowState.seriesId;
  CustomFlowController.promptIdx = flowState.promptIdx;

  expandedCardIdx = null;
  await chrome.storage.local.set({
    promptSeries: series,
    currentSeriesId,
    extractSeriesId,
    distillSeriesId: DistillTaskBlock.seriesId,
    distillPromptIdx: DistillTaskBlock.promptIdx,
    cfSeriesId: CustomFlowController.seriesId,
    cfPromptIdx: CustomFlowController.promptIdx,
  });
  refreshPromptConsumers();
  showToast(`已匯入 ${series.length} 個系列`);
}

async function importSchemaTemplates(file) {
  if (!file) return;
  if (!confirm('匯入 Schema 會覆蓋目前 Schema 庫，是否繼續？')) return;

  const text = await file.text();
  const parsed = JSON.parse(text);
  schemaTemplates = normalizeSchemaImport(parsed);

  extractSchemaId = reconcileSchemaSelection(extractSchemaId, schemaTemplates);
  DistillFormatBlock.schemaId = reconcileSchemaSelection(DistillFormatBlock.schemaId, schemaTemplates);
  CustomFlowController.schemaId = reconcileSchemaSelection(CustomFlowController.schemaId, schemaTemplates);
  expandedSchemaIdx = null;

  await chrome.storage.local.set({
    schemaTemplates,
    extractSchemaId,
    distillSchemaId: DistillFormatBlock.schemaId,
    cfSchemaId: CustomFlowController.schemaId,
  });
  refreshSchemaConsumers();
  showToast(`已匯入 ${schemaTemplates.length} 個 Schema`);
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

let _saveToastTimer = null;
function _showSaveToast() {
  clearTimeout(_saveToastTimer);
  _saveToastTimer = setTimeout(() => showToast('已儲存'), 800);
}

function renderTabbar() {
  const bar = $('seriesTabbar');
  if (!bar) return;
  const hasSeries = series.length > 0;
  bar.innerHTML = `
    <div class="series-select-wrap">
      <select class="input series-select" id="seriesSelect"${hasSeries ? '' : ' disabled'}>
        <option value="">${hasSeries ? '— 選擇 Prompt 系列 —' : '尚無 Prompt 系列'}</option>
        ${series.map(s => `
          <option value="${s.id}"${s.id === currentSeriesId ? ' selected' : ''}>
            ${esc(s.name)} (${s.prompts.length})
          </option>
        `).join('')}
      </select>
    </div>
    <div class="series-actions">
      <button class="series-tool-btn${hasSeries && currentSeriesId ? ' is-ready' : ''}" id="editSeriesBtn" title="編輯系列"${hasSeries && currentSeriesId ? '' : ' disabled'}>編輯</button>
      <button class="series-tool-btn" id="tabAddSeriesBtn" title="新增系列">新增</button>
    </div>
  `;

  const sel = $('seriesSelect');
  if (sel) {
    sel.addEventListener('change', () => {
      currentSeriesId = sel.value || null;
      expandedCardIdx = null;
      chrome.storage.local.set({ currentSeriesId });
      closeAddForm();
      closeEditSeriesForm();
      renderTabbar();
      renderCards();
    });
  }

  const editBtn = $('editSeriesBtn');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      const cur = series.find(x => x.id === currentSeriesId);
      if (!cur) return;
      closeAddForm();
      $('editSeriesName').value = cur.name;
      $('editSeriesBar').classList.add('show');
      $('editSeriesName').focus();
      $('editSeriesName').select();
    });
  }

  const addBtn = $('tabAddSeriesBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      closeEditSeriesForm();
      $('newSeriesBar').classList.add('show');
      $('newSeriesName').focus();
    });
  }
}

function renderCards() {
  const area   = $('seriesCards');
  const addRow = $('addPromptRow');
  if (!area || !addRow) return;

  const s = series.find(x => x.id === currentSeriesId);
  if (!s) {
    closeEditSeriesForm();
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
        <span class="pcard-num">#${i + 1}</span>
        <div class="pcard-info">
          <div class="pcard-name-row">
            <div class="pcard-name">${esc(p.name)}</div>
            <span class="pcard-edit-badge" title="名稱可編輯">✎</span>
          </div>
          <div class="pcard-preview">${esc(excerpt(p.text))}</div>
        </div>
        <div class="pcard-head-actions">
          <button class="btn btn-danger" data-action="delCard" data-idx="${i}">✕</button>
        </div>
        <span class="chevron">▾</span>
      </div>
      ${isExp ? `
      <hr class="pcard-divider">
      <input class="prompt-name-input" data-action="renamePrompt" data-idx="${i}" value="${esc(p.name)}" placeholder="Prompt 名稱">
      <textarea class="pcard-editor" data-idx="${i}">${esc(p.text)}</textarea>
      <div class="pcard-foot">
        <span class="pcard-chars">${p.text.length} 字</span>
        <div class="spacer"></div>
        <button class="btn btn-primary btn-xs" data-action="copyOneCard" data-idx="${i}">⧉ 複製 Prompt</button>
      </div>` : ''}
    </div>`;
  }).join('');

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

  area.querySelectorAll('.pcard-editor').forEach(ta => {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 240) + 'px';
    ta.addEventListener('input', () => {
      const idx = Number(ta.dataset.idx);
      const cur = series.find(x => x.id === currentSeriesId);
      if (cur?.prompts[idx]) {
        cur.prompts[idx].text = ta.value;
        chrome.storage.local.set({ promptSeries: series });
        _showSaveToast();
        const charEl = ta.closest('.pcard').querySelector('.pcard-chars');
        if (charEl) charEl.textContent = ta.value.length + ' 字';
        const prev = ta.closest('.pcard').querySelector('.pcard-preview');
        if (prev) prev.textContent = excerpt(ta.value);
      }
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 240) + 'px';
    });
  });

  area.querySelectorAll('.prompt-name-input').forEach(input => {
    input.addEventListener('input', () => {
      const idx = Number(input.dataset.idx);
      const cur = series.find(x => x.id === currentSeriesId);
      if (cur?.prompts[idx]) {
        cur.prompts[idx].name = input.value;
        chrome.storage.local.set({ promptSeries: series });
        _showSaveToast();
        const nameEl = input.closest('.pcard').querySelector('.pcard-name');
        if (nameEl) nameEl.textContent = input.value;
      }
    });
  });

  area.querySelectorAll('[data-action="copyOneCard"]').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const idx = Number(btn.dataset.idx);
      const cur = series.find(x => x.id === currentSeriesId);
      if (!cur) return;
      const p = cur.prompts[idx];
      try {
        await navigator.clipboard.writeText(p.text);
        showToast(`已複製「${p.name}」`);
      } catch (_) {
        alert('複製失敗，請確認瀏覽器權限。');
      }
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

function closeEditSeriesForm() {
  const bar = $('editSeriesBar');
  const input = $('editSeriesName');
  if (bar) bar.classList.remove('show');
  if (input) input.value = '';
}

function renderSeries()        { renderTabbar(); }
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
  CustomFlowController._renderTaskPicker();
}

function saveCurrentSeriesName() {
  const nextName = $('editSeriesName').value.trim();
  if (!nextName || !currentSeriesId) return;
  const s = series.find(x => x.id === currentSeriesId);
  if (!s) return;
  s.name = nextName;
  chrome.storage.local.set({ promptSeries: series });
  closeEditSeriesForm();
  renderTabbar();
  renderCards();
  renderExtractPromptPicker();
  CustomFlowController._renderTaskPicker();
  showToast(`已更新系列名稱`);
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
  CustomFlowController._renderTaskPicker();
  showToast(`已新增「${name}」`);
}

window.delSeries = async id => {
  if (!confirm('刪除此系列？')) return;
  series = series.filter(s => s.id !== id);
  if (currentSeriesId === id) { currentSeriesId = null; expandedCardIdx = null; }
  await chrome.storage.local.set({ promptSeries: series, currentSeriesId });
  renderTabbar();
  renderCards();
  CustomFlowController._renderTaskPicker();
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ts  = () => new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
