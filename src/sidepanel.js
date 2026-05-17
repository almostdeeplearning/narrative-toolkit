// popup.js
// TODO: 未來可讓 DST、ETL 也共用這些 blocks（目前已拆至 src/blocks/*.js）

// ── Module State (Extract / Schema / Prompts) ─────────────────────────────────
let prompts = [];
let extractAI = 'gpt';
let extractGrokMode = 'page';
let series = [];
let currentSeriesId = null;
let expandedCardIdx = null;
let extractSeriesId = null;
let lastExtractResult = null;
let extractRunState = 'idle';
let extractProgressCurrent = 0;
let extractProgressTotal = 0;

let schemaTemplates = [];
let expandedSchemaIdx = null;
let extractSchemaId = null;

let activeDistillContext = null; // 'distill' | 'flow' | null
let currentLanguage = 'zh';

const I18N = {
  zh: {
    nav_extract: '脈絡<br class="nav-zh-break">掃描',
    nav_flow: 'AI<br class="nav-zh-break">Flows',
    nav_prompts: 'Prompt<br class="nav-zh-break">管理',
    nav_schema: '格式<br class="nav-zh-break">管理',
    nav_settings: 'Settings',
    hidden: '隱藏',
    shown: '顯示',
    expand: '展開',
    collapse: '收合',
    copy: '複製',
    download: '⬇ 下載',
    import_replace: '取代匯入',
    import_merge: '合併匯入',
    export_json: '匯出 JSON',
    export_markdown: '匯出 Markdown',
    save: '儲存',
    cancel: '取消',
    add_action: '新增',
    edit: '編輯',
    delete_series: '刪除系列',
    edit_series: '編輯系列',
    add_series: '新增系列',
    series_name_placeholder: '系列名稱',
    new_series_placeholder: '系列名稱，例：角色訪談',
    autosave_hint: '提示：Prompt 名稱與內容變更會自動儲存',
    autosave_hint_schema: '提示：Schema 名稱與內容變更會自動儲存',
    series_name_empty_hint: '系列名稱不能為空；若要移除此系列，請按「刪除系列」',
    auto_saved: '已自動儲存',
    series_name_updated: '已更新系列名稱',
    delete_series_confirm: '刪除此系列？',
    delete_series_done: '已刪除系列「{name}」',
    editable_name: '名稱可編輯',
    prompt_name_placeholder: 'Prompt 名稱',
    prompt_name_input_placeholder: '名稱，例：深度訪談問題',
    prompt_text_input_placeholder: 'Prompt 內容（{{content}} 代入正文）',
    copy_prompt: '⧉ 複製 Prompt',
    add_prompt: '新增 Prompt',
    schema_name_placeholder: 'Schema 名稱',
    schema_name_input_placeholder: 'Schema 名稱（例：YAML）',
    schema_text_placeholder: 'Schema prompt（{{content}} 代入原始文字）',
    schema_text_input_placeholder: 'Schema prompt 文字（{{content}} 代入原始文字）',
    copy_schema: '⧉ 複製 Schema',
    add_schema: '新增 Schema',
    delete: '刪除',
    stop: '停止',
    save_flow: '儲存為預設流程',
    preset_label: 'Preset：',
    no_preset: '尚無 Preset',
    status_label: '狀態：',
    status_ready: '就緒',
    status_stopped: '已停止',
    status_running: '執行中...',
    status_all_done: '✅ 全部完成',
    status_sent_to_ai: '✅ 已送出，請至 AI Chat 查看',
    status_sent_manual_capture: '已送出至 AI，請等待回覆後手動截取',
    status_trial_running: '試跑中，等待 {ai} 回覆...',
    status_delay_waiting: '{label}，{seconds} 秒延遲等待中...',
    status_send_distill_waiting: '05 - 送出整理，等待 {ai} 回覆中...',
    run_all: '▶▶ Run all',
    start_generation: '開始生成',
    capture_current_reply: '⊕ 截取當前回覆',
    save_md: '⬇ 儲存 .md',
    save_html: '⬇ 儲存 .html',
    recent_extract: '最近萃取',
    etl_card_prompt: '選擇分析任務',
    etl_card_schema: '選擇輸出格式',
    etl_card_ai: '選擇 AI 引擎',
    etl_card_run: '開始生成',
    etl_card_save: '結果確認與儲存',
    etl_grok_mode_label: 'Grok 注入模式',
    etl_grok_mode_page: '完整 Grok 頁面',
    etl_grok_mode_inline: 'X 頁內小視窗',
    etl_prompt_label: '分析任務（可手動修改）',
    etl_prompt_helper: '選取上方 Prompt 後，可在這裡直接微調本次送出的內容',
    etl_schema_none: '-不選擇schema格式-',
    etl_progress_idle: '尚未開始',
    etl_progress_idle_sub: '尚未開始執行',
    etl_log_placeholder: '詳細執行記錄會顯示在這裡。',
    etl_result_placeholder: '等待目標 AI 回覆完成後，按「截取當前回覆」，可在這裡直接微調再儲存。',
    cf_card_source: '擷取內容',
    cf_card_task: '選擇分析',
    cf_card_format: '選擇格式',
    cf_card_ai: '選擇 AI',
    cf_card_run: '送出與回收結果',
    cf_card_execute: '執行送出',
    cf_card_review: '回收與儲存',
    cf_delay_label: '下一步前等',
    cf_custom_delay: '自訂',
    seconds: '秒',
    cf_source_placeholder: '貼入長文，或點「抓取當前頁面」自動填入...',
    grab_current_page: '⊕ 抓取當前頁面',
    save_flow_draft: '存草稿',
    logs: '執行紀錄',
    cf_log_placeholder: '執行紀錄會顯示在這裡。',
    cf_result_placeholder: 'AI 回覆完成後，按「截取當前回覆」，可在這裡微調後再儲存。',
    no_prompt: '尚無 Prompt',
    pick_series: '— 選擇系列 —',
    pick_prompt: '— 選擇 Prompt —',
    no_prompt_in_series: '此系列無 Prompt',
    load_prompt_success: '已載入「{name}」，可直接在下方微調',
    no_schema_empty: '尚無 Schema — 點下方「新增 Schema」建立第一個格式模板',
    pick_schema_optional: '— 選擇 Schema 格式（選填）—',
    no_extract_records: '尚無萃取記錄',
    empty_pick_or_add_series: '尚無 Prompt 系列，請按上方「新增」建立第一個系列',
    empty_add_prompt: '尚無 Prompt<br>點下方「新增 Prompt」開始',
  },
  en: {
    nav_extract: 'Narrative Scan',
    nav_flow: 'AI Flows',
    nav_prompts: 'Prompt Manager',
    nav_schema: 'Format Manager',
    nav_settings: 'Settings',
    hidden: 'Hide',
    shown: 'Show',
    expand: 'Expand',
    collapse: 'Collapse',
    copy: 'Copy',
    download: '⬇ Download',
    import_replace: 'Replace Import',
    import_merge: 'Merge Import',
    export_json: 'Export JSON',
    export_markdown: 'Export Markdown',
    save: 'Save',
    cancel: 'Cancel',
    add_action: 'Add',
    edit: 'Edit',
    delete_series: 'Delete Series',
    edit_series: 'Edit Series',
    add_series: 'Add Series',
    series_name_placeholder: 'Series name',
    new_series_placeholder: 'Series name, e.g. expert interviews',
    autosave_hint: 'Tip: Prompt name and content changes are saved automatically.',
    autosave_hint_schema: 'Tip: Schema name and content changes are saved automatically.',
    series_name_empty_hint: 'Series name cannot be empty. Use "Delete Series" if you want to remove it.',
    auto_saved: 'Auto-saved',
    series_name_updated: 'Series name updated',
    delete_series_confirm: 'Delete this series?',
    delete_series_done: 'Deleted series "{name}"',
    editable_name: 'Name can be edited',
    prompt_name_placeholder: 'Prompt name',
    prompt_name_input_placeholder: 'Name, e.g. deep interview questions',
    prompt_text_input_placeholder: 'Prompt content (uses {{content}} for the source text)',
    copy_prompt: '⧉ Copy Prompt',
    add_prompt: 'Add Prompt',
    schema_name_placeholder: 'Schema name',
    schema_name_input_placeholder: 'Schema name, e.g. YAML',
    schema_text_placeholder: 'Schema prompt (uses {{content}} for the source text)',
    schema_text_input_placeholder: 'Schema prompt text (uses {{content}} for the source text)',
    copy_schema: '⧉ Copy Schema',
    add_schema: 'Add Schema',
    delete: 'Delete',
    stop: 'Stop',
    save_flow: 'Save Workflow',
    preset_label: 'Workflow',
    no_preset: 'No saved workflows',
    status_label: 'Status: ',
    status_ready: 'Ready',
    status_stopped: 'Stopped',
    status_running: 'Running...',
    status_all_done: '✅ Done',
    status_sent_to_ai: '✅ Sent. Check the AI chat.',
    status_sent_manual_capture: 'Sent to AI. Wait for the reply, then capture it manually.',
    status_trial_running: 'Waiting for {ai}...',
    status_delay_waiting: '{label} - waiting {seconds}s...',
    status_send_distill_waiting: 'Waiting for {ai} response...',
    run_all: 'Run Workflow',
    start_generation: 'Execute',
    capture_current_reply: '⊕ Capture Reply',
    save_md: '⬇ Save .md',
    save_html: '⬇ Save .html',
    recent_extract: 'Recent Runs',
    etl_card_prompt: 'Select Task',
    etl_card_schema: 'Output Format',
    etl_card_ai: 'AI Model',
    etl_card_run: 'Execute',
    etl_card_save: 'Review',
    etl_grok_mode_label: 'Grok Target',
    etl_grok_mode_page: 'Full Grok Page',
    etl_grok_mode_inline: 'Inline X Panel',
    etl_prompt_label: 'Task Prompt',
    etl_prompt_helper: 'After you select a prompt above, you can edit it here before running.',
    etl_schema_none: 'No format',
    etl_progress_idle: 'Not started',
    etl_progress_idle_sub: 'Ready to run',
    etl_log_placeholder: 'Execution logs will appear here.',
    etl_result_placeholder: 'After the target AI finishes, click "Grab Reply" to review and save the response here.',
    cf_card_source: 'Source',
    cf_card_task: 'Task',
    cf_card_format: 'Format',
    cf_card_ai: 'Model',
    cf_card_run: 'Send & Capture',
    cf_card_execute: 'Execute',
    cf_card_review: 'Review',
    cf_delay_label: 'Delay',
    cf_custom_delay: 'Custom',
    seconds: 's',
    cf_source_placeholder: 'Paste text here, or click "Capture Page" to fill it automatically.',
    grab_current_page: 'Capture Page',
    save_flow_draft: 'Save Draft',
    logs: 'Logs',
    cf_log_placeholder: 'Execution logs will appear here.',
    cf_result_placeholder: 'After the AI reply finishes, click "Capture Reply" to review, edit, and save it here.',
    no_prompt: 'No prompts yet',
    pick_series: '— Select series —',
    pick_prompt: '— Select prompt —',
    no_prompt_in_series: 'No prompts in this series',
    load_prompt_success: 'Loaded "{name}". You can edit it below.',
    no_schema_empty: 'No formats yet — click "Add Schema" below to create your first format.',
    pick_schema_optional: '— Select format (optional) —',
    no_extract_records: 'No runs yet',
    empty_pick_or_add_series: 'No prompt series yet. Click "Add" above to create your first one.',
    empty_add_prompt: 'No prompts yet<br>Click "Add Prompt" below to get started',
  },
};

function t(key, vars = {}) {
  const dict = I18N[currentLanguage] || I18N.zh;
  const fallback = I18N.zh[key] || key;
  const template = dict[key] || fallback;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`));
}

function getPromptCountLabel(count) {
  return currentLanguage === 'en' ? `${count} chars` : `${count} 字`;
}

function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    el.innerHTML = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder));
  });
}

function setLanguage(lang, { persist = true } = {}) {
  currentLanguage = lang === 'en' ? 'en' : 'zh';
  document.documentElement.setAttribute('lang', currentLanguage === 'en' ? 'en' : 'zh-Hant');
  document.documentElement.setAttribute('data-lang', currentLanguage);
  $('langZhBtn')?.classList.toggle('active', currentLanguage === 'zh');
  $('langEnBtn')?.classList.toggle('active', currentLanguage === 'en');
  if ($('langToggleBtn')) $('langToggleBtn').textContent = currentLanguage === 'en' ? 'EN' : 'ZH';
  $('langToggle')?.classList.remove('open');
  $('langToggleBtn')?.setAttribute('aria-expanded', 'false');
  applyI18n(document);
  refreshI18nUI();
  if (persist) chrome.storage.local.set({ uiLanguage: currentLanguage });
}

function refreshI18nUI() {
  renderExtractPromptPicker();
  renderExtractSchemaPicker();
  renderPrompts();
  renderExtractLibrary();
  renderSchemas();
  renderTabbar();
  renderCards();
  CustomFlowController._renderTaskPicker?.();
  CustomFlowController._renderFormatPicker?.();
  CustomFlowController._applyAllCards?.();
  document.querySelectorAll('[data-etl-toggle]').forEach(btn => {
    const card = document.querySelector(`[data-etl-card="${btn.dataset.etlToggle}"]`);
    btn.textContent = card?.classList.contains('cf-collapsed') ? t('expand') : t('hidden');
  });
  [
    ['cfRawText', 'cfRawTextToggleBtn'],
    ['cfSelectedPromptText', 'cfPromptPreviewToggleBtn'],
    ['cfSchemaPreview', 'cfSchemaPreviewToggleBtn'],
  ].forEach(([contentId, buttonId]) => {
    const area = $(contentId);
    const btn = $(buttonId);
    if (!area || !btn) return;
    btn.textContent = area.classList.contains('is-expanded') ? t('collapse') : t('expand');
  });
  if ($('cfCharCount') && $('cfRawText')) $('cfCharCount').textContent = getPromptCountLabel($('cfRawText').value.length);
  if ($('progTxt')) setExtractRunState(extractRunState, { current: extractProgressCurrent, total: extractProgressTotal });
  updateExtractAIModeUI();
}

window.t = t;

function getExtractAITargetLabel() {
  if (extractAI !== 'grok') return extractAI.toUpperCase();
  return extractGrokMode === 'inline'
    ? (currentLanguage === 'en' ? 'Grok inline panel' : 'Grok 頁內小視窗')
    : 'Grok';
}

function getExtractAIPillKey() {
  if (extractAI !== 'grok') return extractAI;
  return extractGrokMode === 'inline' ? 'grok-inline' : 'grok-page';
}

function normalizeVisibleExtractAI(ai, grokMode) {
  if (ai === 'grok') return { ai: 'grok', grokMode: grokMode === 'inline' ? 'inline' : 'page' };
  if (ai === 'gpt') return { ai: 'gpt', grokMode: 'page' };
  // Keep legacy storage values readable, but fall ETL UI back to a still-visible option.
  return { ai: 'gpt', grokMode: 'page' };
}

function updateExtractAIModeUI() {
  const activeKey = getExtractAIPillKey();
  document.querySelectorAll('#extractAiSel .ai-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.ai === activeKey);
  });
}

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
  grokMode:  'page',
  lastResult: null,
  lastTargetTabId: null,

  _isAutoSaveEnabled() {
    const el = $('cfAutoSave');
    return !!(el && el.checked);
  },
  
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
    this.selectedPresetId = null;
    this.seriesId  = d.cfSeriesId  || null;
    this.promptIdx = d.cfPromptIdx ?? null;
    this.schemaId  = d.cfSchemaId  || null;
    this.ai        = d.cfAI        || 'gpt';
    this.grokMode  = d.cfGrokMode === 'inline' ? 'inline' : 'page';

    // Card toggles
    document.querySelectorAll('[data-cf-toggle]').forEach(btn =>
      btn.addEventListener('click', () => this.toggleCard(btn.dataset.cfToggle)));

    // Source
    $('cfGrabPageBtn').addEventListener('click', () => this._grabPage());
    $('cfRawText').addEventListener('input', () => {
      $('cfCharCount').textContent = getPromptCountLabel($('cfRawText').value.length);
    });
    this._initExpandableArea('cfRawText', 'cfRawTextToggleBtn');
    this._initExpandableArea('cfSelectedPromptText', 'cfPromptPreviewToggleBtn');
    this._initExpandableArea('cfSchemaPreview', 'cfSchemaPreviewToggleBtn');

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
        const key = b.dataset.ai;
        if (key === 'grok-inline') {
          this.ai = 'grok';
          this.grokMode = 'inline';
        } else if (key === 'grok-page') {
          this.ai = 'grok';
          this.grokMode = 'page';
        } else {
          this.ai = key;
        }
        this._syncAIPills();
        chrome.storage.local.set({ cfAI: this.ai, cfGrokMode: this.grokMode });
      });
    });
    this._syncAIPills();

    // Run
    if ($('cfAutoSave')) {
      $('cfAutoSave').checked = d.cfAutoSave !== false;
      $('cfAutoSave').addEventListener('change', e =>
        chrome.storage.local.set({ cfAutoSave: e.target.checked }));
    }
    $('cfSaveDraftBtn').addEventListener('click', () => this._saveDraft());
    if ($('cfCaptureReplyBtn')) {
      $('cfCaptureReplyBtn').addEventListener('click', () => this.captureCurrentReply());
    }
    if ($('cfCopyBtn')) {
      $('cfCopyBtn').addEventListener('click', () => {
        const content = this._getResultContent().trim();
        if (!content) {
          this._log(currentLanguage === 'en' ? 'No result to copy yet.' : '尚無結果可複製', 'warn');
          return;
        }
        navigator.clipboard.writeText(content);
        this._log(currentLanguage === 'en' ? 'Copied' : '已複製', 'success');
      });
    }
    if ($('cfSaveResultBtn')) {
      $('cfSaveResultBtn').addEventListener('click', () => this.saveCapturedResult());
    }
    if ($('cfSaveHtmlBtn')) {
      $('cfSaveHtmlBtn').addEventListener('click', () => this.saveCapturedHtml());
    }
    if ($('cfResultText')) {
      $('cfResultText').addEventListener('input', () => {
        if (!this.lastResult) return;
        this.lastResult.content = $('cfResultText').value;
      });
    }
    if ($('cfResultName')) {
      $('cfResultName').addEventListener('input', () => {
        if (!this.lastResult) return;
        this.lastResult.name = $('cfResultName').value;
      });
    }

    // Run-all
    $('cfRunAllBtn').addEventListener('click', () => this.runAll());
    $('cfStopAllBtn').addEventListener('click', () => this.stopAll());
    $('cfSavePresetBtn').addEventListener('click', () => this.savePreset());
    $('cfPresetSel').addEventListener('change', async () => {
      this.selectedPresetId = $('cfPresetSel').value || null;
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
      if ($('cfAutoSave')) $('cfAutoSave').checked = d.cfAutoSave !== false;
    }
    this._renderPresetControls();
  },

  toggleCard(name) {
    this.cardVisible[name] = !this.cardVisible[name];
    chrome.storage.local.set({ cfCardVisible: this.cardVisible });
    const card = document.querySelector(`[data-cf-card="${name}"]`);
    if (card) card.classList.toggle('cf-collapsed', !this.cardVisible[name]);
    document.querySelectorAll(`[data-cf-linked-card="${name}"]`).forEach(card =>
      card.classList.toggle('cf-collapsed', !this.cardVisible[name]));
    const btn = document.querySelector(`[data-cf-toggle="${name}"]`);
    if (btn) btn.textContent = this.cardVisible[name] ? t('hidden') : t('shown');
  },

  _applyAllCards() {
    Object.entries(this.cardVisible).forEach(([name, visible]) => {
      const card = document.querySelector(`[data-cf-card="${name}"]`);
      if (card) card.classList.toggle('cf-collapsed', !visible);
      document.querySelectorAll(`[data-cf-linked-card="${name}"]`).forEach(card =>
        card.classList.toggle('cf-collapsed', !visible));
      const btn = document.querySelector(`[data-cf-toggle="${name}"]`);
      if (btn) btn.textContent = visible ? t('hidden') : t('shown');
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
  getGrokMode() { return this.grokMode; },

  _getPresetById(id) {
    return id ? this.presets.find(p => p.id === id) || null : null;
  },

  _syncAIPills() {
    const root = $('cfAiSelect');
    if (!root) return;
    const activeKey = this.ai === 'grok'
      ? (this.grokMode === 'inline' ? 'grok-inline' : 'grok-page')
      : this.ai;
    root.querySelectorAll('.ai-pill').forEach(b =>
      b.classList.toggle('active', b.dataset.ai === activeKey));
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
    const grokMode = config?.grokMode === 'inline' ? 'inline' : 'page';
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
      grokMode,
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
      grokMode: this.grokMode,
      autoSave: this._isAutoSaveEnabled(),
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
    this.grokMode = next.grokMode;
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
        cfGrokMode: this.grokMode,
        cfAutoSave: next.autoSave,
        cfBlockDelays: this.blockDelays,
      });
    }
    if (!silent) showToast(currentLanguage === 'en' ? 'Preset loaded' : 'Preset 已載入');
  },

  _renderPresetControls() {
    const sel = $('cfPresetSel');
    if (!sel) return;
    if (!this.presets.length) {
      sel.innerHTML = `<option value="">${t('no_preset')}</option>`;
      sel.disabled = true;
      if ($('cfDeletePresetBtn')) $('cfDeletePresetBtn').disabled = true;
      return;
    }
    if (this.selectedPresetId && !this.presets.some(p => p.id === this.selectedPresetId)) {
      this.selectedPresetId = null;
    }
    sel.disabled = false;
    sel.innerHTML =
      `<option value="">${t('no_preset')}</option>` +
      this.presets.map(p =>
        `<option value="${p.id}"${p.id === this.selectedPresetId ? ' selected' : ''}>${esc(p.name)}</option>`
      ).join('');
    sel.value = this.selectedPresetId || '';
    if ($('cfDeletePresetBtn')) $('cfDeletePresetBtn').disabled = !this.selectedPresetId;
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
    await chrome.storage.local.set({
      customFlowPresets: this.presets,
      cfDefaultPresetId: this.defaultPresetId,
    });
    this._renderPresetControls();
    showToast(currentLanguage === 'en' ? `Preset saved: ${name}` : `已儲存 Preset：${name}`);
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
    this.selectedPresetId = null;
    await chrome.storage.local.set({
      customFlowPresets: this.presets,
      cfDefaultPresetId: this.defaultPresetId,
    });
    this._renderPresetControls();
    showToast(currentLanguage === 'en' ? `Preset deleted: ${preset.name}` : `已刪除 Preset：${preset.name}`);
  },

  _renderTaskPicker() {
    const sel = $('cfSeriesSel');
    if (!sel) return;
      sel.innerHTML = `<option value="">${currentLanguage === 'en' ? '— No prompt library —' : '— 不使用 Prompt 庫 —'}</option>` +
      series.map(s =>
        `<option value="${s.id}"${s.id === this.seriesId ? ' selected' : ''}>${esc(s.name)}</option>`
      ).join('');
    this._renderPromptList();
  },

  _renderPromptList() {
    const sel = $('cfPromptSel');
    if (!sel) return;
    if (!this.seriesId) {
      sel.innerHTML = `<option value="">${currentLanguage === 'en' ? '— Select a prompt series first —' : '— 先選擇 Prompt 系列 —'}</option>`;
      sel.disabled = true;
      this.promptIdx = null;
      this._updateSelectedArea();
      return;
    }
    const s = series.find(x => x.id === this.seriesId);
    if (!s?.prompts.length) {
      sel.innerHTML = `<option value="">${t('no_prompt_in_series')}</option>`;
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
    sel.innerHTML = `<option value="">${currentLanguage === 'en' ? '— No Schema —' : '— 不套用 Schema —'}</option>` +
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

  _showResultEmpty(message = currentLanguage === 'en' ? 'No result yet' : '尚未產生結果') {
    if ($('cfResultName')) $('cfResultName').value = this._makeFlowResultName();
    if ($('cfResultEmpty')) {
      $('cfResultEmpty').textContent = message;
      $('cfResultEmpty').style.display = '';
    }
    if ($('cfResultText')) {
      $('cfResultText').value = '';
      $('cfResultText').style.display = 'none';
    }
  },

  _showResultContent(result) {
    if (!result) return;
    this.lastResult = result;
    if ($('cfResultName')) $('cfResultName').value = result.name;
    if ($('cfResultEmpty')) $('cfResultEmpty').style.display = 'none';
    if ($('cfResultText')) {
      $('cfResultText').value = result.content;
      $('cfResultText').style.display = '';
    }
  },

  _getResultContent() {
    return $('cfResultText')?.value || '';
  },

  _getResultName() {
    return $('cfResultName')?.value?.trim() || this.lastResult?.name || this._makeFlowResultName();
  },

  _makeFlowResultName() {
    const label = sanitizeFilenameSegment(
      this.getSelectedPrompt()?.name
      || this.getSelectedSchema()?.name
      || 'flow',
      'flow'
      );
      return `flow_${label}_${makeShortTimestamp()}.md`;
  },

  _makeFlowHtmlName() {
    return (this.lastResult?.name || this._makeFlowResultName()).replace(/\.md$/i, '.html');
  },

  _wrapFlowResultHtml(title, content) {
    const escapeHtml = s => String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    const safeTitle = escapeHtml(title);
    const safeContent = escapeHtml(content);
    return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle}</title>
  <style>
    :root { color-scheme: light; }
    body {
      margin: 0;
      padding: 32px 20px;
      background: #f7f7f5;
      color: #242321;
      font-family: Georgia, "Times New Roman", serif;
    }
    main {
      width: min(900px, 100%);
      margin: 0 auto;
      padding: 28px;
      border: 1px solid #d7d7d2;
      border-radius: 18px;
      background: #fff;
      box-shadow: 0 14px 40px rgba(40, 37, 31, 0.08);
    }
    h1 {
      margin: 0 0 16px;
      font-size: 28px;
      line-height: 1.15;
    }
    pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      font: 15px/1.72 "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    }
  </style>
</head>
<body>
  <main>
    <h1>${safeTitle}</h1>
    <pre>${safeContent}</pre>
  </main>
</body>
</html>`;
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
    el.innerHTML = `<span class="label">${t('status_label')}</span>${esc(text)}`;
  },

  _log(text, level = 'info') {
    const el = $('cfLog');
    if (!el) return;
    const placeholder = el.querySelector('.log-placeholder');
    if (placeholder) placeholder.remove();
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
      if (msg.sentOnly) {
        this.lastTargetTabId = Number.isInteger(msg.targetTabId) ? msg.targetTabId : null;
        this._showResultEmpty(t('cf_result_placeholder'));
        this._log(t('status_sent_manual_capture'), 'success');
        this._setGlobalStatus(t('status_sent_manual_capture'), 'success');
      } else if (this._isAutoSaveEnabled() && msg.results?.length) {
        this.lastTargetTabId = null;
        const r = msg.results[0];
        this._showResultContent(r);
        this._log(currentLanguage === 'en' ? '✅ Done — saved!' : '✅ 整理完成並已存檔！', 'success');
        this._setGlobalStatus(t('status_all_done'), 'success');
      } else {
      this._showResultEmpty(t('cf_result_placeholder'));
      this._log(t('status_sent_manual_capture'), 'success');
      this._setGlobalStatus(t('status_sent_manual_capture'), 'success');
    }
  },

  async captureCurrentReply() {
    try {
      let tabId = this.lastTargetTabId;
      if (!tabId) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        tabId = tab?.id || null;
      }
      if (!tabId) {
        this._log(currentLanguage === 'en' ? 'No active page to capture from.' : '找不到目前頁面，無法截取回覆', 'error');
        return;
      }
      const [result] = await chrome.scripting.executeScript({
        target: { tabId },
        func: grabCurrentAssistantReply,
        args: [this.getAI(), this.getGrokMode()],
      });
      const text = String(result?.result || '').trim();
      if (!text) {
        this._log(currentLanguage === 'en'
          ? 'No usable reply found yet. Please wait for the AI response to finish.'
          : '目前尚未抓到可用回覆，請確認 AI 對話已完成生成', 'warn');
        return;
      }
        const next = { name: this._getResultName(), content: text, fmt: 'wiki' };
      this._showResultContent(next);
      $('cfResultText')?.focus();
      if ($('cfResultText') && typeof $('cfResultText').setSelectionRange === 'function') {
        const pos = $('cfResultText').value.length;
        $('cfResultText').setSelectionRange(pos, pos);
      }
      this._log(currentLanguage === 'en'
        ? 'Captured the current reply. You can edit and save it below.'
        : '已截取當前回覆，可在下方微調後儲存', 'success');
      this._setGlobalStatus(currentLanguage === 'en'
        ? 'Reply captured. Review and save when ready.'
        : '已截取當前回覆，可微調後儲存', 'success');
    } catch (err) {
      this._log(`${currentLanguage === 'en' ? 'Capture failed' : '截取當前回覆失敗'}：${err?.message || err}`, 'error');
    }
  },

  async saveCapturedResult() {
    const content = this._getResultContent().trim();
    if (!content) {
      this._log(currentLanguage === 'en' ? 'No result to save yet.' : '尚無結果可儲存', 'error');
      return;
    }
    let name = this._getResultName();
    if (!/\.md$/i.test(name)) name = `${name.replace(/\.(html?)$/i, '')}.md`;
    const stored = await chrome.storage.local.get(['library', 'distillFolder', 'draftFolder']);
    const lib = stored.library || [];
    lib.unshift({ name, fmt: 'wiki', content, chars: content.length, date: new Date().toLocaleDateString('zh-TW') });
    await chrome.storage.local.set({ library: lib });
    chrome.runtime.sendMessage({ type: 'DOWNLOAD_MD', name, content, folder: stored.distillFolder || stored.draftFolder || '' });
    this.lastResult = { name, content, fmt: 'wiki' };
    this._showResultContent(this.lastResult);
    this._log(`✅ ${currentLanguage === 'en' ? 'Saved' : '已儲存'}：${name}`, 'success');
    this._setGlobalStatus(currentLanguage === 'en' ? 'Saved .md successfully.' : '已儲存 .md', 'success');
  },

  async saveCapturedHtml() {
    const content = this._getResultContent().trim();
    if (!content) {
      this._log(currentLanguage === 'en' ? 'No result to save yet.' : '尚無結果可儲存', 'error');
      return;
    }
    let name = this._getResultName();
    name = /\.html?$/i.test(name) ? name : `${name.replace(/\.md$/i, '')}.html`;
    const title = name.replace(/\.html$/i, '');
    const html = this._wrapFlowResultHtml(title, content);
    const stored = await chrome.storage.local.get(['distillFolder', 'draftFolder']);
    chrome.runtime.sendMessage({
      type: 'DOWNLOAD_TEXT',
      name,
      content: html,
      mime: 'text/html;charset=utf-8',
      folder: stored.distillFolder || stored.draftFolder || '',
    });
    this._log(`✅ ${currentLanguage === 'en' ? 'Saved' : '已儲存'}：${name}`, 'success');
    this._setGlobalStatus(currentLanguage === 'en' ? 'Saved .html successfully.' : '已儲存 .html', 'success');
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

        const isLikelyUiNoise = text => {
          const t = clean(String(text || ''));
          if (!t) return true;
          if (t.length <= 1) return true;
          if (/^(follow|following|show more|translate post|show original|search|reposted|reply|replies|view post engagements)$/i.test(t)) return true;
          if (/^(追蹤|正在跟隨|顯示更多|翻譯貼文|查看原文|搜尋|轉貼|回覆|查看貼文互動)$/i.test(t)) return true;
          if (/^(relevant people|live on x|what’s happening|what's happening)$/i.test(t)) return true;
          if (/^\d+\s*(repl(?:y|ies)|like|likes|repost|reposts|bookmark|bookmarks|views?)$/i.test(t)) return true;
          if (/^\d+\s*(則回覆|個喜歡|次轉發|次查看|人追蹤)$/i.test(t)) return true;
          return false;
        };

        const collectBlocksFromRoot = (root, selectors, minLen = 20) => {
          if (!root) return [];
          const out = [];
          const seen = new Set();
          for (const selector of selectors) {
            for (const node of root.querySelectorAll(selector)) {
              const verdict = isExcludedNode(node);
              if (verdict.excluded) continue;
              const text = clean(node.innerText || '');
              if (text.length < minLen || isLikelyUiNoise(text)) continue;
              if (seen.has(text)) continue;
              seen.add(text);
              out.push(text);
            }
          }
          return out;
        };

        const extractXPrimaryNarrative = primary => {
          if (!primary) return null;

          const titleBlocks = collectBlocksFromRoot(primary, ['h1', 'h2'], 8);
          const longformBlocks = collectBlocksFromRoot(
            primary,
            [
              '[data-testid="tweetText"]',
              'article[role="article"] [lang]',
              'article[role="article"] p',
              '[data-testid="primaryColumn"] [lang]',
              '[data-testid="primaryColumn"] p',
              '[data-testid="primaryColumn"] div[dir="auto"]',
            ],
            24
          );

          const merged = clean(unique([...titleBlocks, ...longformBlocks]).join('\n\n'));
          dbg(`primary narrative merged length=${merged.length} titleBlocks=${titleBlocks.length} contentBlocks=${longformBlocks.length}`);
          return merged.length > 120 ? merged : null;
        };

        const extractXThread = primary => {
          if (!primary) return null;
          const articles = [...primary.querySelectorAll('article[role="article"]')]
            .filter(article => {
              const verdict = isExcludedNode(article);
              if (verdict.excluded) return false;
              return clean(article.innerText || '').length > 40;
            });
          if (!articles.length) return null;

          const chunks = [];
          const seen = new Set();
          for (const article of articles) {
            const blocks = collectBlocksFromRoot(article, ['[data-testid="tweetText"]', '[lang]', 'p', 'div[dir="auto"]'], 18);
            const merged = clean(unique(blocks).join('\n\n'));
            if (merged.length < 30 || seen.has(merged)) continue;
            seen.add(merged);
            chunks.push(merged);
          }
          const joined = clean(chunks.join('\n\n---\n\n'));
          dbg(`thread extraction articles=${articles.length} chunks=${chunks.length} length=${joined.length}`);
          return joined.length > 120 ? joined : null;
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
          const primaryNarrative = extractXPrimaryNarrative(primary);
          if (primaryNarrative) return primaryNarrative;

          const threadText = extractXThread(primary);
          if (threadText) return threadText;

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
    if ($('cfRawText')) { $('cfRawText').value = text; $('cfCharCount').textContent = getPromptCountLabel(text.length); }
    this._log(currentLanguage === 'en' ? `Page captured (${text.length} chars)` : `已抓取頁面 ${text.length} 字`, 'success');
  },

  async _saveDraft() {
    const content = this.getContent();
    if (!content) { this._log(currentLanguage === 'en' ? 'Enter or capture content first.' : '請先輸入或抓取內容', 'error'); return; }
    const tStr   = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    const name   = `draft_${tStr}.md`;
    const stored = await chrome.storage.local.get(['library', 'distillFolder']);
    const lib    = stored.library || [];
    lib.unshift({ name, fmt: 'draft', content, chars: content.length, date: new Date().toLocaleDateString('zh-TW') });
    await chrome.storage.local.set({ library: lib });
    chrome.runtime.sendMessage({ type: 'DOWNLOAD_MD', name, content, folder: stored.distillFolder || '' });
    this._log(currentLanguage === 'en' ? `Draft saved: ${name}` : `已儲存草稿：${name}`, 'success');
  },

  async startFlow() {
    const content = this.getContent();
    if (!content) { this._log(currentLanguage === 'en' ? 'Enter or capture content first.' : '請先輸入或抓取內容', 'error'); return; }

    const cfg = await chrome.storage.local.get(['fullAuto']);
    const autoSaveChecked = this._isAutoSaveEnabled();
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
      wikiTpl = '{{content}}';
      fmtLabel = currentLanguage === 'en' ? 'raw discussion' : '原文直接討論';
      this._log(currentLanguage === 'en' ? 'No Prompt / Schema selected. Sending raw content to AI…' : '未選 Prompt / Schema，直接送原文到 AI…', 'info');
    }

    activeDistillContext = 'flow';
    this._setRunUI(true);
    this._showResultEmpty(t('cf_result_placeholder'));
    const aiLabel = this.getAI() === 'grok'
      ? (this.getGrokMode() === 'inline' ? 'GROK INLINE' : 'GROK PAGE')
      : this.getAI().toUpperCase();
    this._log(currentLanguage === 'en' ? `Sending to ${aiLabel} (${fmtLabel})…` : `送出整理（${fmtLabel}，${aiLabel}）…`, 'info');
    this._setGlobalStatus(autoSaveChecked ? t('status_trial_running', { ai: aiLabel }) : t('status_sent_manual_capture'));
    console.log('[CF startFlow] sending START_DISTILL', {
      source: 'flow',
      ai: this.getAI(),
      grokMode: this.getGrokMode(),
      autoSave: autoSaveChecked,
      fullAuto: cfg.fullAuto !== false,
      contentLen: content.length,
      hasTemplate: !!wikiTpl,
    });
    chrome.runtime.sendMessage({
      type:     'START_DISTILL',
      source:   'flow',
      content,
      fmt:      'wiki',
      targetAI: this.getAI(),
      grokMode: this.getGrokMode(),
      wikiTpl,
      autoSave: autoSaveChecked,
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

  _initExpandableArea(contentId, buttonId) {
    const area = $(contentId);
    const btn = $(buttonId);
    if (!area || !btn || btn.dataset.expandBound === '1') return;

    const sync = () => {
      const expanded = area.classList.contains('is-expanded');
      btn.textContent = expanded ? t('collapse') : t('expand');
      btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    };

    btn.dataset.expandBound = '1';
    sync();
    btn.addEventListener('click', () => {
      area.classList.toggle('is-expanded');
      sync();
    });
  },

  _getDelay(name) {
    return this.blockDelays[name] ?? 0;
  },

  _highlightCard(name, on) {
    const card = document.querySelector(`[data-cf-card="${name}"]`);
    if (card) card.classList.toggle('cf-active', on);
    document.querySelectorAll(`[data-cf-linked-card="${name}"]`).forEach(card =>
      card.classList.toggle('cf-active', on));
  },

  _statusLabelForCard(name) {
    return ({
      source: currentLanguage === 'en' ? '01 - Capture source' : '01 - 抓取來源內容',
      task: currentLanguage === 'en' ? '02 - Apply prompt' : '02 - 套用 Prompt',
      format: currentLanguage === 'en' ? '03 - Apply format' : '03 - 套用 Schema',
      ai: currentLanguage === 'en' ? '04 - Choose model' : '04 - 設定目標 AI',
      run: currentLanguage === 'en' ? '05 - Run' : '05 - 送出整理',
    })[name] || name;
  },

  async _waitWithStatus(name, delay) {
    for (let remaining = delay; remaining > 0; remaining--) {
      if (this.stopRequested) return false;
      this._setGlobalStatus(t('status_delay_waiting', { label: this._statusLabelForCard(name), seconds: remaining }));
      await new Promise(r => setTimeout(r, 1000));
    }
    return !this.stopRequested;
  },

  stopAll() {
    this.stopRequested = true;
    chrome.runtime.sendMessage({ type: 'STOP' });
    this._setRunUI(false);
    this._setGlobalRunUI(false);
    this._setGlobalStatus(t('status_stopped'), 'warn');
    this._log(t('status_stopped'), 'warn');
  },

  async runAll() {
    if (this.isRunning) return;
    const order = ['source', 'task', 'format', 'ai', 'run'];
    const visible = order.filter(n => this.cardVisible[n] !== false);
    if (!visible.length) return;

    this.stopRequested = false;
    this._setGlobalRunUI(true);
    this._setGlobalStatus(t('status_running'));

    // Build pipeline state as blocks execute
    const pipeline = {
      content: this.getContent(),
      prompt:  this.cardVisible.task !== false ? this.getSelectedPrompt() : null,
      schema:  this.cardVisible.format !== false ? this.getSelectedSchema() : null,
      ai:      this.getAI(),
      grokMode: this.getGrokMode(),
    };

    console.log('[CF runAll] start. visible:', visible.join(' → '));

    for (const name of visible) {
      if (this.stopRequested) break;
      this._highlightCard(name, true);
      this._setGlobalStatus(this._statusLabelForCard(name));
      console.log('[CF runAll] block:', name);

      if (name === 'source') {
        this._log(currentLanguage === 'en' ? '⟳ Capturing source…' : '⟳ 抓取來源內容…', 'info');
        await this._grabPage();
        pipeline.content = this.getContent();
        console.log('[CF runAll] source: content length =', pipeline.content.length);
        this._log(currentLanguage === 'en' ? `✓ Source: ${pipeline.content.length} chars` : `✓ 來源：${pipeline.content.length} 字`, 'success');

      } else if (name === 'task') {
        pipeline.prompt = this.getSelectedPrompt();
        console.log('[CF runAll] task: prompt =', pipeline.prompt?.name ?? '(none)');
        this._log(pipeline.prompt ? `✓ Prompt: ${pipeline.prompt.name}` : (currentLanguage === 'en' ? '— No prompt, skipping' : '— 未選 Prompt，略過'), 'info');

      } else if (name === 'format') {
        pipeline.schema = this.getSelectedSchema();
        console.log('[CF runAll] format: schema =', pipeline.schema?.name ?? '(none)');
        this._log(pipeline.schema ? `✓ Schema: ${pipeline.schema.name}` : (currentLanguage === 'en' ? '— No schema, skipping' : '— 未選 Schema，略過'), 'info');

      } else if (name === 'ai') {
        pipeline.ai = this.getAI();
        pipeline.grokMode = this.getGrokMode();
        console.log('[CF runAll] ai: target =', pipeline.ai);
        this._log(currentLanguage === 'en' ? `✓ AI: ${pipeline.ai}${pipeline.ai === 'grok' ? ` (${pipeline.grokMode})` : ''}` : `✓ 目標 AI：${pipeline.ai}${pipeline.ai === 'grok' ? ` (${pipeline.grokMode})` : ''}`, 'info');

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
        this._log(currentLanguage === 'en' ? `⏱ Waiting ${delay}s…` : `⏱ 等待 ${delay}s…`, 'info');
        console.log('[CF runAll] delay', delay, 's after block:', name);
        const finished = await this._waitWithStatus(name, delay);
        if (!finished) break;
      }

      this._highlightCard(name, false);
    }

    order.forEach(name => this._highlightCard(name, false));
    if (!this.isRunning) {
      this._setGlobalRunUI(false);
      if (!this.stopRequested) this._setGlobalStatus(t('status_ready'));
    }
  },

  async _runWithPipeline(pipeline) {
    const { content, prompt, schema, ai } = pipeline;
    const grokMode = pipeline.grokMode === 'inline' ? 'inline' : 'page';
    const autoSaveChecked = this._isAutoSaveEnabled();

    if (!content) {
      this._log(currentLanguage === 'en' ? '❌ No source content. Run the Source block first.' : '❌ 無來源內容，請先執行 Source block', 'error');
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
      grokMode,
    });
    console.log('[CF runAll] Combined prompt to send:', wikiTpl ? wikiTpl.slice(0, 200) + '…' : null);

    if (!wikiTpl) {
      wikiTpl = '{{content}}';
      fmtLabel = currentLanguage === 'en' ? 'raw discussion' : '原文直接討論';
      this._log(currentLanguage === 'en' ? '⚠️ No Prompt / Schema selected. Sending raw content to AI.' : '⚠️ 未選 Prompt / Schema，直接送原文到 AI。', 'warn');
    }

    activeDistillContext = 'flow';
    this._setRunUI(true);
    this._showResultEmpty(t('cf_result_placeholder'));
    const aiLabel = ai === 'grok' ? (grokMode === 'inline' ? 'GROK INLINE' : 'GROK PAGE') : ai.toUpperCase();
    this._log(`送出（${fmtLabel} → ${aiLabel}）…`, 'info');
    this._setGlobalStatus(autoSaveChecked ? t('status_send_distill_waiting', { ai: aiLabel }) : t('status_sent_manual_capture'));
    console.log('[CF runAll] Sending START_DISTILL with ai:', ai, '| grokMode:', grokMode, '| fullAuto: true | prompt length:', wikiTpl.length);
    console.log('[CF runAll] run card state', {
      source: 'flow',
      mode: 'runAll',
      autoSave: autoSaveChecked,
      contentLen: content.length,
      hasPrompt: !!prompt,
      hasSchema: !!schema,
    });

    chrome.runtime.sendMessage({
      type:     'START_DISTILL',
      source:   'flow',
      content,
      fmt:      'wiki',
      targetAI: ai,
      grokMode,
      wikiTpl,
      autoSave: autoSaveChecked,
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
    btn.textContent = hidden ? t('expand') : t('hidden');
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
  updateExtractAIModeUI();
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

function normalizeLegacyPromptSeries(sourcePrompts) {
  if (!Array.isArray(sourcePrompts)) return [];
  const items = sourcePrompts
    .map((p, idx) => ({
      id: crypto.randomUUID(),
      name: String(p?.name || `Prompt ${idx + 1}`).trim() || `Prompt ${idx + 1}`,
      text: String(p?.text || '').trim(),
    }))
    .filter(p => p.text);

  if (!items.length) return [];
  return [{ id: crypto.randomUUID(), name: 'Migrated Prompts', prompts: items }];
}

async function loadSettings() {
  const d = await chrome.storage.local.get([
    'prompts', 'extractAI', 'extractGrokMode', 'distillAI', 'delaySeconds',
    'fullAuto', 'autoDownload', 'draftFolder',
    'wikiTpl', 'noteTpl', 'extractFolder', 'distillFolder',
    'promptSeries', 'popupFontSize', 'popupTextContrast', 'uiTheme', 'uiLanguage', 'lastTab',
    'currentSeriesId', 'extractSeriesId', 'distillSeriesId', 'distillPromptIdx',
    'schemaTemplates', 'extractSchemaId', 'distillSchemaId',
    'cfCardVisible', 'cfSeriesId', 'cfPromptIdx', 'cfSchemaId', 'cfAI', 'cfGrokMode', 'cfAutoSave', 'cfBlockDelays',
    'customFlowPresets', 'cfDefaultPresetId',
  ]);

  prompts         = d.prompts || [];
  const normalizedExtract = normalizeVisibleExtractAI(d.extractAI || 'gpt', d.extractGrokMode);
  extractAI       = normalizedExtract.ai;
  extractGrokMode = normalizedExtract.grokMode;
  series          = d.promptSeries || [];
  let migratedPromptSeries = false;
  if (!series.length) {
    const migrated = normalizeLegacyPromptSeries(d.prompts || []);
    if (migrated.length) {
      series = migrated;
      migratedPromptSeries = true;
    }
  }
  currentSeriesId = d.currentSeriesId || series[0]?.id || null;
  if (currentSeriesId && !series.some(x => x.id === currentSeriesId)) {
    currentSeriesId = series[0]?.id || null;
  }
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

  if (migratedPromptSeries) {
    await chrome.storage.local.set({ promptSeries: series, currentSeriesId });
  } else if ((d.currentSeriesId || null) !== currentSeriesId) {
    await chrome.storage.local.set({ currentSeriesId });
  }

  applyTheme(d.uiTheme || 'nt-dark');
  applyPopupFontSize(d.popupFontSize || 'standard');
  applyPopupTextContrast(d.popupTextContrast || 'standard');
  setLanguage(d.uiLanguage || 'zh', { persist: false });

  $('delayInput').value        = d.delaySeconds || 35;
  syncExtractDelayControls(d.delaySeconds || 35);
  $('fullAutoToggle').checked  = d.fullAuto !== false;
  $('autoDownload').checked    = d.autoDownload !== false;
  $('extractFolder').value     = d.extractFolder || d.draftFolder || '';
  if ($('themeSel')) $('themeSel').value = d.uiTheme || 'nt-dark';

  if (d.lastTab) switchTab(d.lastTab);

  return d;
}

function applyTheme(theme) {
  const next = ['nt-dark', 'editorial-light', 'studio-light'].includes(theme) ? theme : 'nt-dark';
  document.documentElement.setAttribute('data-theme', next);
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

function syncExtractDelayControls(delayValue) {
  const hidden = $('delayInput');
  const preset = $('delayPresetSel');
  const custom = $('delayCustomInput');
  if (!hidden || !preset || !custom) return;

  const next = Number.isFinite(Number(delayValue)) ? Math.max(0, parseInt(delayValue, 10)) : 35;
  hidden.value = String(next);

  if (['0', '5', '10', '35'].includes(String(next))) {
    preset.value = String(next);
    custom.style.display = 'none';
  } else {
    preset.value = 'custom';
    custom.style.display = '';
    custom.value = String(next);
  }
}

// ── Event binding (non-Distill) ───────────────────────────────────────────────
function bindAll() {
  document.querySelectorAll('.tab').forEach(t =>
    t.addEventListener('click', () => switchTab(t.dataset.tab)));
  document.querySelectorAll('#langToggle [data-lang]').forEach(btn =>
    btn.addEventListener('click', e => {
      e.stopPropagation();
      setLanguage(btn.dataset.lang);
    }));
  $('langToggleBtn')?.addEventListener('click', e => {
    e.stopPropagation();
    const root = $('langToggle');
    const nextOpen = !root?.classList.contains('open');
    root?.classList.toggle('open', nextOpen);
    $('langToggleBtn')?.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
  });
  document.addEventListener('click', e => {
    const root = $('langToggle');
    if (!root || root.contains(e.target)) return;
    root.classList.remove('open');
    $('langToggleBtn')?.setAttribute('aria-expanded', 'false');
  });

  // Extract run
  $('startBtn').addEventListener('click', startExtract);
  $('stopBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'STOP' });
    setExtractRunState('stopped');
    setRunUI(false); elog('已停止', 'warn');
  });

  // Extract result
  $('captureCurrentReplyBtn').addEventListener('click', captureCurrentExtractReply);
  $('saveExtractBtn').addEventListener('click', saveExtractResult);

  // Extract pickers
  $('extractSeriesSel').addEventListener('change', () => {
    extractSeriesId = $('extractSeriesSel').value || null;
    chrome.storage.local.set({ extractSeriesId });
    prompts = [];
    chrome.storage.local.set({ prompts });
    renderPrompts();
    renderExtractPromptList();
  });
  $('extractSchemaSel').addEventListener('change', () => {
    extractSchemaId = $('extractSchemaSel').value || null;
    chrome.storage.local.set({ extractSchemaId });
    updateExtractSchemaPreview();
  });
  if ($('delayPresetSel') && $('delayCustomInput') && $('delayInput')) {
    $('delayPresetSel').addEventListener('change', () => {
      if ($('delayPresetSel').value === 'custom') {
        $('delayCustomInput').style.display = '';
        const next = parseInt($('delayCustomInput').value, 10) || parseInt($('delayInput').value, 10) || 35;
        $('delayInput').value = String(next);
        $('delayCustomInput').value = String(next);
      } else {
        $('delayCustomInput').style.display = 'none';
        $('delayInput').value = $('delayPresetSel').value;
      }
    });
    $('delayCustomInput').addEventListener('input', () => {
      const next = parseInt($('delayCustomInput').value, 10);
      if (Number.isFinite(next)) $('delayInput').value = String(Math.max(0, next));
    });
  }
  if ($('themeSel')) {
    $('themeSel').addEventListener('change', () => {
      applyTheme($('themeSel').value);
    });
  }

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
    if (!val) {
      prompts = [];
      chrome.storage.local.set({ prompts });
      renderPrompts();
      return;
    }
    const [sid, idx] = val.split('|');
    addFromLib(sid, Number(idx));
  });

  // Extract AI picker (Card 03)
  document.querySelectorAll('#extractAiSel .ai-pill').forEach(b =>
    b.addEventListener('click', () => {
      const key = b.dataset.ai;
      if (key === 'grok-inline') {
        extractAI = 'grok';
        extractGrokMode = 'inline';
      } else if (key === 'grok-page') {
        extractAI = 'grok';
        extractGrokMode = 'page';
      } else {
        extractAI = key;
      }
      chrome.storage.local.set({ extractAI, extractGrokMode });
      updateExtractAIModeUI();
    }));

  // Prompt series
  $('exportPromptsBtn').addEventListener('click', exportPromptSeries);
  $('exportPromptsMdBtn').addEventListener('click', exportPromptSeriesMarkdown);
  $('mergePromptsBtn').addEventListener('click', () => {
    $('promptImportInput').dataset.importMode = 'merge';
    $('promptImportInput').click();
  });
  $('importPromptsBtn').addEventListener('click', () => {
    $('promptImportInput').dataset.importMode = 'replace';
    $('promptImportInput').click();
  });
  $('promptImportInput').addEventListener('change', async e => {
    const input = e.target;
    const mode = input.dataset.importMode === 'merge' ? 'merge' : 'replace';
    try {
      await importPromptSeries(input.files?.[0], mode);
    } catch (err) {
      alert(`Prompt 匯入失敗：${err.message}`);
    } finally {
      delete input.dataset.importMode;
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
  $('deleteSeriesBtn').addEventListener('click', () => {
    if (!currentSeriesId) return;
    window.delSeries(currentSeriesId);
  });
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
  $('exportSchemasMdBtn').addEventListener('click', exportSchemaTemplatesMarkdown);
  $('mergeSchemasBtn').addEventListener('click', () => {
    $('schemaImportInput').dataset.importMode = 'merge';
    $('schemaImportInput').click();
  });
  $('importSchemasBtn').addEventListener('click', () => {
    $('schemaImportInput').dataset.importMode = 'replace';
    $('schemaImportInput').click();
  });
  $('schemaImportInput').addEventListener('change', async e => {
    const input = e.target;
    const mode = input.dataset.importMode === 'merge' ? 'merge' : 'replace';
    try {
      await importSchemaTemplates(input.files?.[0], mode);
    } catch (err) {
      alert(`Schema 匯入失敗：${err.message}`);
    } finally {
      delete input.dataset.importMode;
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
        if (foot) foot.textContent = getPromptCountLabel(ta.value.length);
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
  if (!prompts.length) {
    el.innerHTML = `<div style="text-align:center;padding:16px;color:var(--text3);font-size:11px">${t('no_prompt')}</div>`;
    if (extractRunState === 'idle') setExtractRunState('idle', { current: 0, total: 0 });
    return;
  }
  const ic = { pending: '○', running: '⏳', done: '✅', error: '❌' };
  el.innerHTML = prompts.map((p, i) => `
    <div class="pi ${p.status || ''}" id="pi${i}">
      <span class="pi-n">#${i + 1}</span>
      <textarea class="pi-txt" rows="${promptPreviewRows(p.text)}" data-action="editPrompt" data-idx="${i}">${esc(p.text)}</textarea>
      <span class="pi-ico">${ic[p.status] || '○'}</span>
      <button class="pi-del" data-action="delPrompt" data-idx="${i}">✕</button>
    </div>`).join('');
  if (extractRunState === 'idle') setExtractRunState('idle', { current: 0, total: getExtractPromptTotal() });
}

// ── Extract ───────────────────────────────────────────────────────────────────
function promptPreviewRows(text) {
  const value = String(text || '');
  const lineCount = value.split('\n').length;
  const wrapEstimate = Math.ceil(value.length / 72);
  return Math.max(6, Math.min(16, lineCount + wrapEstimate));
}

function getExtractPromptTotal() {
  return prompts.map(p => String(p?.text || '').trim()).filter(Boolean).length;
}

function setExtractRunState(state, opts = {}) {
  extractRunState = state;
  if (typeof opts.current === 'number') extractProgressCurrent = opts.current;
  if (typeof opts.total === 'number') extractProgressTotal = opts.total;

  const total = extractProgressTotal;
  const current = extractProgressCurrent;
  const fillPct = total > 0 ? Math.max(0, Math.min(100, Math.round((current / total) * 100))) : 0;
  const prog = $('prog');
  const progFill = $('progFill');
  const progTxt = $('progTxt');
  const progSubtxt = $('progSubtxt');
  if (!prog || !progFill || !progTxt || !progSubtxt) return;

  prog.classList.add('on');

  switch (state) {
    case 'idle':
      progFill.style.width = '0%';
      progTxt.textContent = total > 0 ? `0 / ${total}` : t('etl_progress_idle');
      progSubtxt.textContent = currentLanguage === 'en' ? 'No prompts sent yet' : '尚未送出 Prompt';
      break;
    case 'waiting':
      progFill.style.width = `${fillPct}%`;
      progTxt.textContent = total > 0 ? `${current} / ${total}` : t('etl_progress_idle');
      progSubtxt.textContent = current > 0
        ? (currentLanguage === 'en' ? `${current} prompt(s) sent` : `已送出 ${current} 個 Prompt`)
        : (currentLanguage === 'en' ? 'Sending prompts...' : '正在送出 Prompt');
      break;
    case 'prompt_done':
      progFill.style.width = `${fillPct}%`;
      progTxt.textContent = total > 0 ? `${current} / ${total}` : t('etl_progress_idle');
      progSubtxt.textContent = currentLanguage === 'en' ? `Prompt ${current} sent` : `已送出第 ${current} 個 Prompt`;
      break;
    case 'all_done':
      progFill.style.width = '100%';
      progTxt.textContent = total > 0 ? `${total} / ${total}` : (currentLanguage === 'en' ? 'Done' : '完成');
      progSubtxt.textContent = currentLanguage === 'en' ? 'All prompts sent' : '全部 Prompt 已送出';
      break;
    case 'error':
      progFill.style.width = `${fillPct}%`;
      progTxt.textContent = total > 0 ? `${current} / ${total}` : t('etl_progress_idle');
      progSubtxt.textContent = currentLanguage === 'en' ? 'This run failed' : '本輪執行失敗';
      break;
    case 'stopped':
      progFill.style.width = `${fillPct}%`;
      progTxt.textContent = total > 0 ? `${current} / ${total}` : t('etl_progress_idle');
      progSubtxt.textContent = currentLanguage === 'en' ? 'Stopped manually' : '已手動停止';
      break;
  }
}

async function startExtract() {
  await syncPromptEditsFromDom();
  const promptTexts = prompts.map(p => p.text.trim()).filter(Boolean);
  if (!promptTexts.length) { elog('請先選擇 Prompt', 'error'); return; }

  const schema = schemaTemplates.find(s => s.id === extractSchemaId);
  const combined = promptTexts.map(pt => schema ? pt + '\n\n' + schema.text : pt);

  prompts.forEach(p => p.status = 'pending');
  chrome.storage.local.set({ prompts }); renderPrompts();
  if ($('extractResultSection')) $('extractResultSection').style.display = '';
  if ($('extractResultText')) $('extractResultText').value = '';
  lastExtractResult = null;
  setExtractRunState('waiting', { current: 0, total: combined.length });
  setRunUI(true);
  chrome.runtime.sendMessage({
    type: 'START_EXTRACT',
    prompts: combined,
    targetAI: extractAI,
    grokMode: extractGrokMode,
  });
  elog(
    `開始送出 ${combined.length} 個 Prompt 到 ${getExtractAITargetLabel()}${schema ? '（含 Schema: ' + schema.name + '）' : ''}…`,
    'info'
  );
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

function makeShortTimestamp(date = new Date()) {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yy}-${mm}-${dd}_${hh}-${min}`;
}

function sanitizeFilenameSegment(value, fallback = 'untitled') {
  const cleaned = String(value || '')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/g, '')
    .slice(0, 48);
  return cleaned || fallback;
}

// ── Extract result ────────────────────────────────────────────────────────────
function getExtractResultContent() {
  return $('extractResultText')?.value || '';
}

function setExtractResultContent(text) {
  const next = String(text || '');
  lastExtractResult = next;
  if ($('extractResultText')) $('extractResultText').value = next;
  if ($('extractResultSection')) $('extractResultSection').style.display = '';
}

function focusExtractResultEditor(placeCaretAtEnd = false) {
  const el = $('extractResultText');
  if (!el) return;
  el.focus();
  if (!placeCaretAtEnd || typeof el.setSelectionRange !== 'function') return;
  const pos = el.value.length;
  el.setSelectionRange(pos, pos);
}

function showExtractResult(responses) {
  const text = responses.map((r, i) =>
    `## #${r.index ?? i + 1}\n\n${r.response}`
  ).join('\n\n---\n\n');
  setExtractResultContent(text);
}

function grabCurrentAssistantReply(targetAI, grokMode) {
  const ai = targetAI || 'gpt';
  const mode = grokMode === 'inline' ? 'inline' : 'page';
  const stored = (() => { try { return sessionStorage.getItem('_ntk_sent') || ''; } catch(_) { return ''; } })();
  const sent = stored;
  const norm = s => String(s || '').replace(/[\s​ ]+/g, ' ').trim();
  const looksLikeSent = t => {
    if (!sent) return false;
    const tN = norm(t), sN = norm(sent);
    return tN.slice(0, 100) === sN.slice(0, 100);
  };

  const isVisible = el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const getInlineGrokRoot = () => {
    const roots = [
      ...document.querySelectorAll('[role="dialog"], [aria-modal="true"], aside, section, div')
    ].filter(el => isVisible(el) && el.getBoundingClientRect().width >= 280 && el.getBoundingClientRect().height >= 220);
    const scored = roots.map(root => {
      const text = `${root.getAttribute('aria-label') || ''} ${root.textContent || ''}`.slice(0, 4000);
      const hasGrokWord = /grok/i.test(text);
      const hasAskAnything = /ask anything/i.test(text);
      const hasHelpHeading = /how can i help you today\?/i.test(text);
      const hasCreateImages = /create images/i.test(text);
      const hasLatestNews = /latest news/i.test(text);
      const hasFastMode = /\bfast\b/i.test(text);
      const hasPostMarkers = !!root.querySelector('[data-testid="tweetTextarea_0"], [data-testid="tweetButtonInline"], [data-testid="tweetButton"]');
      let score = 0;
      if (hasGrokWord) score += 10;
      if (hasHelpHeading) score += 16;
      if (hasAskAnything) score += 14;
      if (hasCreateImages) score += 10;
      if (hasLatestNews) score += 8;
      if (hasFastMode) score += 6;
      if (hasPostMarkers) score -= 12;
      return { root, score };
    }).filter(x => x.score > 0);
    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.root || null;
  };
  const collectTexts = selectors => {
    for (const s of selectors) {
      const all = [...document.querySelectorAll(s)].filter(e => {
        const t = (e.innerText || '').trim();
        return isVisible(e) && t.length > 10 && !looksLikeSent(t);
      });
      if (all.length) return all[all.length - 1].innerText || '';
    }
    return '';
  };

  if (ai === 'gpt') {
    return collectTexts([
      'div[data-message-author-role="assistant"] .markdown',
      'div[data-message-author-role="assistant"]',
      '[class*="agent-turn"]',
    ]);
  }

  if (ai === 'gemini') {
    return collectTexts([
      'model-response .response-content',
      'model-response',
      '.model-response-text',
    ]);
  }

  if (ai === 'claude') {
    return collectTexts([
      '.font-claude-message',
      '[data-is-streaming="false"]',
      '.prose',
    ]);
  }

  const primarySels = [
    '[data-testid="messageText"]',
    'div[class*="GrokMessage"]',
    '[data-testid="tweetText"]',
  ];
  const inlineRoot = mode === 'inline' ? getInlineGrokRoot() : null;
  if (mode === 'inline' && !inlineRoot) return '';
  const grokCandidates = [];
  for (const s of primarySels) {
    const scope = inlineRoot || document;
    for (const e of scope.querySelectorAll(s)) {
      const t = (e.innerText || '').trim();
      if (!isVisible(e) || t.length <= 10 || looksLikeSent(t)) continue;
      const inDialog = !!e.closest('[role="dialog"], [aria-modal="true"], aside');
      grokCandidates.push({ text: t, inlineScore: (inlineRoot && inlineRoot.contains(e) ? 10 : 0) + (inDialog ? 2 : 0), el: e });
    }
  }
  if (grokCandidates.length) {
    if (mode === 'inline') {
      grokCandidates.sort((a, b) => b.inlineScore - a.inlineScore);
      return grokCandidates[0]?.text || '';
    }
    return grokCandidates[grokCandidates.length - 1]?.text || '';
  }

  for (const s of ['[role="article"] [lang]', 'article [lang]']) {
    const scope = inlineRoot || document;
    const all = [...scope.querySelectorAll(s)];
    for (let i = all.length - 1; i >= 0; i--) {
      const t = (all[i].innerText || '').trim();
      if (t.length > 10 && !looksLikeSent(t)) return t;
    }
  }

  const root = inlineRoot || document.querySelector('main') || document.body;
  const blocks = [...root.querySelectorAll('p, div')].filter(e => {
    if (e.querySelector('input, textarea, button, [role="button"]')) return false;
    const t = (e.innerText || '').trim();
    return t.length > 50 && !looksLikeSent(t);
  });
  return blocks.reduce((best, e) => {
    const t = e.innerText || '';
    return t.length > best.length ? t : best;
  }, '');
}

async function captureCurrentExtractReply() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabId = tabs[0]?.id;
    if (!tabId) {
      elog('找不到目前頁面，無法截取回覆', 'error');
      return;
    }
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: grabCurrentAssistantReply,
      args: [extractAI, extractGrokMode],
    });
    const text = String(result?.result || '').trim();
    if (!text) {
      elog('目前頁面尚未抓到可用回覆，請確認 Grok 對話已完成生成', 'warn');
      return;
    }
    setExtractResultContent(text);
    focusExtractResultEditor(true);
    elog('已截取當前回覆，可在下方直接微調後儲存', 'success');
  } catch (err) {
    elog(`截取當前回覆失敗：${err?.message || err}`, 'error');
  }
}

async function saveExtractResult() {
  const content = getExtractResultContent().trim();
  if (!content) { elog('尚無結果可儲存', 'error'); return; }
  lastExtractResult = content;
  const promptName = sanitizeFilenameSegment(prompts[0]?.name || 'prompt');
  const tStr = makeShortTimestamp();
  const name = `extract_${promptName}_${tStr}.md`;
  const stored = await chrome.storage.local.get(['library', 'extractFolder']);
  const lib = stored.library || [];
  lib.unshift({ name, fmt: 'extract', content, chars: content.length, date: new Date().toLocaleDateString('zh-TW') });
  await chrome.storage.local.set({ library: lib });
  chrome.runtime.sendMessage({ type: 'DOWNLOAD_MD', name, content, folder: stored.extractFolder || '' });
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
      <button class="lib-act-btn" title="複製" aria-label="複製" data-action="copyDocByName" data-name="${safeName}">⧉</button>
      <button class="lib-act-btn lib-act-del" title="刪除" aria-label="刪除" data-action="delDocByName" data-name="${safeName}">✕</button>
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
    : `<div style="padding:6px 0;font-size:10px;color:var(--text3)">${t('no_extract_records')}</div>`;
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
    uiTheme:       $('themeSel')?.value || 'nt-dark',
    uiLanguage:    currentLanguage,
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
        if (msg.status === 'done') setExtractRunState('prompt_done', { current: msg.current || 0, total: msg.total || 0 });
        else if (msg.status === 'error') setExtractRunState('error', { current: msg.current || 0, total: msg.total || 0 });
        else setExtractRunState('waiting', { current: msg.current || 0, total: msg.total || 0 });
        break;

      case 'LOG_EXTRACT': elog(msg.text, msg.level); break;
      case 'LOG_DISTILL':
        if (activeDistillContext === 'flow') CustomFlowController.handleLog(msg.text, msg.level);
        else if (DistillRunBlock.isInitialized) DistillRunBlock.handleLog(msg.text, msg.level);
        break;

      case 'EXTRACT_DONE':
        setRunUI(false);
        setExtractRunState('all_done', { current: msg.responses?.length || extractProgressTotal, total: msg.responses?.length || extractProgressTotal });
        elog('✅ 全部 Prompt 已送出，請等待 Grok 回覆完成後，到下方手動截取', 'success');
        break;

      case 'DISTILL_DONE':
        if (activeDistillContext === 'flow') CustomFlowController.handleDone(msg);
        else if (DistillRunBlock.isInitialized) DistillRunBlock.handleDone(msg);
        activeDistillContext = null;
        break;

      case 'ERROR':
        setExtractRunState('error');
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
  if (!el) return;
  el.querySelectorAll('[data-placeholder="1"]').forEach(node => node.remove());
  const d = document.createElement('div');
  d.className = `ll ${l}`;
  d.textContent = `[${ts()}] ${t}`;
  el.appendChild(d); el.scrollTop = el.scrollHeight;
}

// ── Extract Prompt Picker ─────────────────────────────────────────────────────
function renderExtractPromptPicker() {
  const sel = $('extractSeriesSel');
  sel.innerHTML = `<option value="">${t('pick_series')}</option>` +
    series.map(s => `<option value="${s.id}"${s.id === extractSeriesId ? ' selected' : ''}>${esc(s.name)}</option>`).join('');
  renderExtractPromptList();
}

function renderExtractPromptList() {
  const list = $('extractPromptList');
  if (!extractSeriesId) {
    list.innerHTML = `<option value="">${t('pick_prompt')}</option>`;
    return;
  }
  const s = series.find(x => x.id === extractSeriesId);
  if (!s?.prompts.length) {
    list.innerHTML = `<option value="">${t('no_prompt_in_series')}</option>`;
    return;
  }
  list.innerHTML = `<option value="">${t('pick_prompt')}</option>` +
    s.prompts.map((p, i) =>
      `<option value="${s.id}|${i}">${esc(p.name)}</option>`
    ).join('');
}

window.addFromLib = (sid, idx) => {
  const s = series.find(x => x.id === sid);
  if (!s) return;
  const p = s.prompts[idx];
  prompts = [{ name: p.name, text: p.text, status: 'pending' }];
  chrome.storage.local.set({ prompts });
  renderPrompts();
  elog(t('load_prompt_success', { name: p.name }), 'success');
};

// ── Schema Templates ──────────────────────────────────────────────────────────
function renderSchemas() {
  const area = $('schemaCards');
  if (!area) return;
  if (!schemaTemplates.length) {
    area.innerHTML = `<div class="empty-dot"></div><div style="text-align:center;color:var(--text3);font-size:12px">${t('no_schema_empty')}</div>`;
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
            <span class="pcard-edit-badge" title="${esc(t('editable_name'))}">✎</span>
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
        <input class="schema-name-input" data-saction="renameSchema" data-idx="${i}" value="${esc(s.name)}" placeholder="${esc(t('schema_name_placeholder'))}">
        <textarea class="pcard-editor" data-saction="editSchema" data-idx="${i}" placeholder="${esc(t('schema_text_placeholder'))}">${esc(s.text)}</textarea>
        <div class="pcard-foot">
          <span class="pcard-chars">${getPromptCountLabel(s.text.length)}</span>
          <div class="spacer"></div>
          <button class="btn btn-primary btn-xs" data-saction="copySchema" data-idx="${i}">${esc(t('copy_schema'))}</button>
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
  sel.innerHTML = `<option value="">${t('pick_schema_optional')}</option>` +
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

function queueDownloadText(name, content, mime = 'text/plain;charset=utf-8', opts = {}) {
  chrome.runtime.sendMessage({
    type: 'DOWNLOAD_TEXT',
    name,
    content,
    mime,
    folder: opts.folder || '',
    saveAs: !!opts.saveAs,
  });
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

function normalizeSeriesNameKey(name) {
  return String(name || '').trim().toLocaleLowerCase();
}

function normalizePromptNameKey(name) {
  return String(name || '').trim().toLocaleLowerCase();
}

function makePromptIdentityKey(prompt) {
  return `${normalizePromptNameKey(prompt?.name)}\u0000${String(prompt?.text || '').trim()}`;
}

function makeUniquePromptName(baseName, existingNameKeys) {
  const rawBase = String(baseName || 'Prompt').trim() || 'Prompt';
  let nextName = rawBase;
  let index = 2;
  while (existingNameKeys.has(normalizePromptNameKey(nextName))) {
    nextName = `${rawBase} (${index})`;
    index++;
  }
  return nextName;
}

function mergePromptSeries(existingSeries, importedSeries) {
  const usedSeriesIds = new Set();
  const merged = existingSeries.map(item => {
    const seriesId = ensureUniqueId(item?.id, usedSeriesIds);
    const usedPromptIds = new Set();
    return {
      id: seriesId,
      name: String(item?.name || '').trim() || '未命名系列',
      prompts: (Array.isArray(item?.prompts) ? item.prompts : []).map((prompt, idx) => ({
        id: ensureUniqueId(prompt?.id, usedPromptIds),
        name: String(prompt?.name || `Prompt ${idx + 1}`).trim() || `Prompt ${idx + 1}`,
        text: String(prompt?.text || ''),
      })),
    };
  });

  let addedSeriesCount = 0;
  let addedPromptCount = 0;
  let skippedPromptCount = 0;
  let renamedPromptCount = 0;

  for (const imported of importedSeries) {
    const target = merged.find(item => normalizeSeriesNameKey(item.name) === normalizeSeriesNameKey(imported.name));
    if (!target) {
      const usedPromptIds = new Set();
      const promptsToAdd = imported.prompts.map((prompt, idx) => ({
        id: ensureUniqueId(prompt?.id, usedPromptIds),
        name: String(prompt?.name || `Prompt ${idx + 1}`).trim() || `Prompt ${idx + 1}`,
        text: String(prompt?.text || ''),
      }));
      merged.push({
        id: ensureUniqueId(imported?.id, usedSeriesIds),
        name: String(imported?.name || '').trim() || `未命名系列 ${merged.length + 1}`,
        prompts: promptsToAdd,
      });
      addedSeriesCount++;
      addedPromptCount += promptsToAdd.length;
      continue;
    }

    const usedPromptIds = new Set(target.prompts.map(prompt => prompt.id));
    const existingPromptKeys = new Set(target.prompts.map(makePromptIdentityKey));
    const existingNameKeys = new Set(target.prompts.map(prompt => normalizePromptNameKey(prompt.name)));

    for (const importedPrompt of imported.prompts) {
      const importedKey = makePromptIdentityKey(importedPrompt);
      if (existingPromptKeys.has(importedKey)) {
        skippedPromptCount++;
        continue;
      }

      let nextName = String(importedPrompt?.name || 'Prompt').trim() || 'Prompt';
      if (existingNameKeys.has(normalizePromptNameKey(nextName))) {
        nextName = makeUniquePromptName(nextName, existingNameKeys);
        renamedPromptCount++;
      }

      const nextPrompt = {
        id: ensureUniqueId(importedPrompt?.id, usedPromptIds),
        name: nextName,
        text: String(importedPrompt?.text || ''),
      };
      target.prompts.push(nextPrompt);
      existingPromptKeys.add(makePromptIdentityKey(nextPrompt));
      existingNameKeys.add(normalizePromptNameKey(nextPrompt.name));
      addedPromptCount++;
    }
  }

  return {
    series: merged,
    stats: {
      addedSeriesCount,
      addedPromptCount,
      skippedPromptCount,
      renamedPromptCount,
    },
  };
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

function makeSchemaIdentityKey(schema) {
  return `${normalizePromptNameKey(schema?.name)}\u0000${String(schema?.text || '').trim()}`;
}

function mergeSchemaTemplates(existingSchemas, importedSchemas) {
  const usedSchemaIds = new Set();
  const merged = existingSchemas.map((item, idx) => ({
    id: ensureUniqueId(item?.id, usedSchemaIds),
    name: String(item?.name || `Schema ${idx + 1}`).trim() || `Schema ${idx + 1}`,
    text: String(item?.text || ''),
  }));

  let addedSchemaCount = 0;
  let skippedSchemaCount = 0;
  let renamedSchemaCount = 0;

  const existingSchemaKeys = new Set(merged.map(makeSchemaIdentityKey));
  const existingNameKeys = new Set(merged.map(item => normalizePromptNameKey(item.name)));

  for (const imported of importedSchemas) {
    const importedKey = makeSchemaIdentityKey(imported);
    if (existingSchemaKeys.has(importedKey)) {
      skippedSchemaCount++;
      continue;
    }

    let nextName = String(imported?.name || 'Schema').trim() || 'Schema';
    if (existingNameKeys.has(normalizePromptNameKey(nextName))) {
      nextName = makeUniquePromptName(nextName, existingNameKeys);
      renamedSchemaCount++;
    }

    const nextSchema = {
      id: ensureUniqueId(imported?.id, usedSchemaIds),
      name: nextName,
      text: String(imported?.text || ''),
    };
    merged.push(nextSchema);
    existingSchemaKeys.add(makeSchemaIdentityKey(nextSchema));
    existingNameKeys.add(normalizePromptNameKey(nextSchema.name));
    addedSchemaCount++;
  }

  return {
    schemaTemplates: merged,
    stats: {
      addedSchemaCount,
      skippedSchemaCount,
      renamedSchemaCount,
    },
  };
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

function escapeMarkdownCodeFence(text) {
  return String(text || '').replace(/```/g, '``\\`');
}

function formatPromptSeriesMarkdown(sourceSeries) {
  const lines = [
    '# Prompt Manager Export',
    '',
    `Exported at: ${new Date().toISOString()}`,
    '',
  ];

  if (!sourceSeries.length) {
    lines.push('_No prompt series found._');
    lines.push('');
    return lines.join('\n');
  }

  sourceSeries.forEach((item, seriesIdx) => {
    lines.push(`## ${seriesIdx + 1}. ${item.name}`);
    lines.push('');

    if (!item.prompts.length) {
      lines.push('_No prompts in this series._');
      lines.push('');
      return;
    }

    item.prompts.forEach((prompt, promptIdx) => {
      lines.push(`### ${seriesIdx + 1}.${promptIdx + 1} ${prompt.name}`);
      lines.push('');
      lines.push('```text');
      lines.push(escapeMarkdownCodeFence(prompt.text));
      lines.push('```');
      lines.push('');
    });
  });

  return lines.join('\n');
}

function formatSchemaTemplatesMarkdown(sourceSchemas) {
  const lines = [
    '# Format Manager Export',
    '',
    `Exported at: ${new Date().toISOString()}`,
    '',
  ];

  if (!sourceSchemas.length) {
    lines.push('_No schema templates found._');
    lines.push('');
    return lines.join('\n');
  }

  sourceSchemas.forEach((item, idx) => {
    lines.push(`## ${idx + 1}. ${item.name}`);
    lines.push('');
    lines.push('```text');
    lines.push(escapeMarkdownCodeFence(item.text));
    lines.push('```');
    lines.push('');
  });

  return lines.join('\n');
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

function exportPromptSeriesMarkdown() {
  queueDownloadText(
    `narrative-toolkit-prompts-${makeExportStamp()}.md`,
    formatPromptSeriesMarkdown(series),
    'text/markdown;charset=utf-8',
    { saveAs: true }
  );
  showToast(`準備匯出 Markdown：${series.length} 個系列`);
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

function exportSchemaTemplatesMarkdown() {
  queueDownloadText(
    `narrative-toolkit-schemas-${makeExportStamp()}.md`,
    formatSchemaTemplatesMarkdown(schemaTemplates),
    'text/markdown;charset=utf-8',
    { saveAs: true }
  );
  showToast(`準備匯出 Markdown：${schemaTemplates.length} 個 Schema`);
}

async function importPromptSeries(file, mode = 'replace') {
  if (!file) return;
  if (mode === 'merge') {
    if (!confirm('合併匯入會把新 Prompt 併入目前 Prompt 庫，是否繼續？')) return;
  } else if (!confirm('取代匯入會覆蓋目前 Prompt 庫，是否繼續？')) return;

  const text = await file.text();
  const parsed = JSON.parse(text);
  const importedSeries = normalizePromptImport(parsed);
  let mergeStats = null;
  if (mode === 'merge') {
    const merged = mergePromptSeries(series, importedSeries);
    series = merged.series;
    mergeStats = merged.stats;
  } else {
    series = importedSeries;
  }
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
  if (mode === 'merge' && mergeStats) {
    const renamePart = mergeStats.renamedPromptCount ? `，改名保留 ${mergeStats.renamedPromptCount} 個` : '';
    const skipPart = mergeStats.skippedPromptCount ? `，略過重複 ${mergeStats.skippedPromptCount} 個` : '';
    showToast(`合併匯入完成：新增 ${mergeStats.addedSeriesCount} 個系列、${mergeStats.addedPromptCount} 個 Prompt${renamePart}${skipPart}`);
  } else {
    showToast(`已匯入 ${series.length} 個系列`);
  }
}

async function importSchemaTemplates(file, mode = 'replace') {
  if (!file) return;
  if (mode === 'merge') {
    if (!confirm('合併匯入會把新 Schema 併入目前 Schema 庫，是否繼續？')) return;
  } else if (!confirm('取代匯入會覆蓋目前 Schema 庫，是否繼續？')) return;

  const text = await file.text();
  const parsed = JSON.parse(text);
  const importedSchemas = normalizeSchemaImport(parsed);
  let mergeStats = null;
  if (mode === 'merge') {
    const merged = mergeSchemaTemplates(schemaTemplates, importedSchemas);
    schemaTemplates = merged.schemaTemplates;
    mergeStats = merged.stats;
  } else {
    schemaTemplates = importedSchemas;
  }

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
  if (mode === 'merge' && mergeStats) {
    const renamePart = mergeStats.renamedSchemaCount ? `，改名保留 ${mergeStats.renamedSchemaCount} 個` : '';
    const skipPart = mergeStats.skippedSchemaCount ? `，略過重複 ${mergeStats.skippedSchemaCount} 個` : '';
    showToast(`合併匯入完成：新增 ${mergeStats.addedSchemaCount} 個 Schema${renamePart}${skipPart}`);
  } else {
    showToast(`已匯入 ${schemaTemplates.length} 個 Schema`);
  }
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
  _saveToastTimer = setTimeout(() => showToast(t('auto_saved')), 800);
}

function renderTabbar() {
  const bar = $('seriesTabbar');
  if (!bar) return;
  const hasSeries = series.length > 0;
  bar.innerHTML = `
    <div class="series-select-wrap">
      <select class="select-compact series-select" id="seriesSelect"${hasSeries ? '' : ' disabled'}>
        <option value="">${hasSeries
          ? (currentLanguage === 'en' ? '— Select Prompt Series —' : '— 選擇 Prompt 系列 —')
          : (currentLanguage === 'en' ? 'No prompt series yet' : '尚無 Prompt 系列')}</option>
        ${series.map(s => `
          <option value="${s.id}"${s.id === currentSeriesId ? ' selected' : ''}>
            ${esc(s.name)} (${s.prompts.length})
          </option>
        `).join('')}
      </select>
    </div>
    <div class="series-actions">
      <button class="series-tool-btn${hasSeries && currentSeriesId ? ' is-ready' : ''}" id="editSeriesBtn" title="${esc(t('edit_series'))}"${hasSeries && currentSeriesId ? '' : ' disabled'}>${esc(t('edit'))}</button>
      <button class="series-tool-btn" id="tabAddSeriesBtn" title="${esc(t('add_series'))}">${esc(t('add_action'))}</button>
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
    if (series.length) {
      currentSeriesId = series[0].id;
      chrome.storage.local.set({ currentSeriesId });
      renderTabbar();
      renderCards();
      return;
    }
    closeEditSeriesForm();
    area.innerHTML = `<div class="empty-state"><div class="empty-dot"></div><div class="empty-state-text">${t('empty_pick_or_add_series')}</div></div>`;
    addRow.style.display = 'none';
    return;
  }

  addRow.style.display = '';

  if (!s.prompts.length) {
    area.innerHTML = `<div class="empty-state"><div class="empty-dot"></div><div class="empty-state-text">${t('empty_add_prompt')}</div></div>`;
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
            <span class="pcard-edit-badge" title="${esc(t('editable_name'))}">✎</span>
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
      <input class="prompt-name-input" data-action="renamePrompt" data-idx="${i}" value="${esc(p.name)}" placeholder="${esc(t('prompt_name_placeholder'))}">
      <textarea class="pcard-editor" data-idx="${i}">${esc(p.text)}</textarea>
      <div class="pcard-foot">
        <span class="pcard-chars">${getPromptCountLabel(p.text.length)}</span>
        <div class="spacer"></div>
        <button class="btn btn-primary btn-xs" data-action="copyOneCard" data-idx="${i}">${esc(t('copy_prompt'))}</button>
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
        if (charEl) charEl.textContent = getPromptCountLabel(ta.value.length);
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
  if (!currentSeriesId) return;
  if (!nextName) {
    showToast(t('series_name_empty_hint'));
    $('editSeriesName')?.focus();
    return;
  }
  const s = series.find(x => x.id === currentSeriesId);
  if (!s) return;
  s.name = nextName;
  chrome.storage.local.set({ promptSeries: series });
  closeEditSeriesForm();
  renderTabbar();
  renderCards();
  renderExtractPromptPicker();
  CustomFlowController._renderTaskPicker();
  showToast(t('series_name_updated'));
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
  const target = series.find(s => s.id === id);
  if (!target) return;
  if (!confirm(t('delete_series_confirm'))) return;
  series = series.filter(s => s.id !== id);
  if (currentSeriesId === id) {
    currentSeriesId = series[0]?.id || null;
    expandedCardIdx = null;
  }
  await chrome.storage.local.set({ promptSeries: series, currentSeriesId });
  closeEditSeriesForm();
  renderTabbar();
  renderCards();
  renderExtractPromptPicker();
  CustomFlowController._renderTaskPicker();
  showToast(t('delete_series_done', { name: target.name }));
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ts  = () => new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
