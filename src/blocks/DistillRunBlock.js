// DistillRunBlock.js — Block 5 of the Distill pipeline
// Depends on globals: $, ts, dlog, activeDistillContext, libItemHtml,
//                     copyDocByName, dlDocByName, delDocByName, renderExtractLibrary,
//                     DistillSourceBlock, DistillTaskBlock, DistillFormatBlock, DistillAIBlock,
//                     chrome (all available at call time from popup.js / other block files)

const DistillRunBlock = {
  isInitialized: false,
  lastResult: null,

  init(d) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    $('distillAutoSave').checked = d.distillAutoSave !== false;
    $('distillFolder').value = d.distillFolder || d.draftFolder || '';

    $('saveDraftBtn').addEventListener('click', () => this.saveDraft());
    $('distillBtn').addEventListener('click', () => this.startDistill());
    $('stopDistillBtn').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'STOP' });
      this.setUI(false);
      dlog('已停止', 'warn');
    });
    $('distillAutoSave').addEventListener('change', e =>
      chrome.storage.local.set({ distillAutoSave: e.target.checked }));
    $('copyDistillBtn').addEventListener('click', () => {
      if (!this.lastResult) return;
      navigator.clipboard.writeText(this.lastResult.content);
      dlog('已複製', 'success');
    });
    $('dlDistillBtn').addEventListener('click', () => {
      if (!this.lastResult) return;
      chrome.runtime.sendMessage({ type: 'DOWNLOAD_MD', name: this.lastResult.name, content: this.lastResult.content });
    });
    $('distillLibToggle').addEventListener('click', () => {
      const list = $('distillLibList');
      const chevron = $('distillLibChevron');
      const open = list.style.display !== 'none';
      list.style.display = open ? 'none' : '';
      chevron.classList.toggle('open', !open);
    });
    $('distillLibList').addEventListener('click', async e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const name = btn.dataset.name;
      if (btn.dataset.action === 'copyDocByName') await copyDocByName(name);
      if (btn.dataset.action === 'dlDocByName')   dlDocByName(name);
      if (btn.dataset.action === 'delDocByName')  {
        await delDocByName(name);
        renderExtractLibrary();
        this.renderLibrary();
      }
    });

    this.renderLibrary();
  },

  renderCF(container) {
    const el = document.createElement('div');
    el.innerHTML = `
      <div class="cf-card" data-cf-card="run">
        <div class="cf-card-head">
          <span class="cf-card-num">05</span>
          <span class="cf-card-title">RUN — 執行整理</span>
          <select class="cf-delay-sel" data-cf-delay-for="run">
            <option value="0">無延遲</option>
            <option value="2">2s</option>
            <option value="5">5s</option>
            <option value="10">10s</option>
            <option value="20">20s</option>
            <option value="custom">自訂</option>
          </select>
          <input class="cf-delay-custom" type="number" min="0" max="300" data-cf-custom-for="run" style="display:none" placeholder="秒">
          <button class="btn btn-ghost btn-xs" data-cf-toggle="run">隱藏</button>
        </div>
        <div class="cf-card-body">
          <label style="display:flex;align-items:center;gap:8px;font-size:11px;color:var(--text3);cursor:pointer;margin-bottom:12px;user-select:none">
            <input type="checkbox" id="cfAutoSave" checked style="accent-color:var(--text);width:13px;height:13px">
            整理完成後自動存檔並下載
          </label>
          <div class="run-row" style="margin-top:0">
            <button class="btn btn-primary" id="cfRunBtn">✦ 執行整理</button>
            <button class="btn btn-danger" id="cfStopBtn" style="display:none">停止</button>
            <button class="btn" id="cfSaveDraftBtn" style="margin-left:auto">💾 存草稿</button>
          </div>
          <div class="log-strip" id="cfLog" style="margin-top:10px"><span class="ll">就緒</span></div>
          <div id="cfResultSection" style="display:none;margin-top:12px">
            <div class="section-head" style="margin-bottom:8px">
              <div class="section-title" id="cfResultName">整理結果</div>
              <div class="row" style="gap:4px">
                <button class="btn btn-xs" id="cfCopyBtn">複製</button>
                <button class="btn btn-xs" id="cfDlBtn">⬇ 下載</button>
              </div>
            </div>
            <pre class="result-pre" id="cfResultText" style="max-height:200px"></pre>
          </div>
        </div>
      </div>
    `.trim();
    container.appendChild(el.firstElementChild);
  },

  handleLog(text, level) { dlog(text, level); },

  handleDone(msg) {
    this.setUI(false);
    if ($('distillAutoSave').checked && msg.results?.length) {
      const r = msg.results[0];
      this.lastResult = r;
      $('distillResultName').textContent = r.name;
      $('distillResponseText').textContent = r.content;
      $('distillResponseSection').style.display = '';
      dlog('✅ 整理完成並已存檔！', 'success');
      this.renderLibrary();
    } else {
      dlog('✅ 已送出，請至 AI 對話框查看與討論', 'success');
    }
  },

  setUI(on) {
    $('distillBtn').disabled = on;
    $('stopDistillBtn').style.display = on ? '' : 'none';
  },

  async startDistill() {
    const content = DistillSourceBlock.getContent();
    if (!content) { dlog('請先輸入或抓取內容', 'error'); return; }

    const cfg = await chrome.storage.local.get(['fullAuto']);
    let wikiTpl = null;
    let fmtLabel = 'draft';

    const selectedPrompt = DistillTaskBlock.getSelectedPrompt();
    const selectedSchema  = DistillFormatBlock.getSelectedSchema();

    if (selectedPrompt) {
      wikiTpl = selectedSchema
        ? selectedPrompt.text + '\n\n' + selectedSchema.text
        : selectedPrompt.text;
      fmtLabel = selectedPrompt.name;
    } else if (selectedSchema) {
      wikiTpl = selectedSchema.text;
      fmtLabel = selectedSchema.name;
    }

    if (!wikiTpl) {
      const tStr = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
      const name = `note_${tStr}.md`;
      const stored = await chrome.storage.local.get(['library', 'distillFolder']);
      const lib = stored.library || [];
      lib.unshift({ name, fmt: 'note', content, chars: content.length, date: new Date().toLocaleDateString('zh-TW') });
      await chrome.storage.local.set({ library: lib });
      chrome.runtime.sendMessage({ type: 'DOWNLOAD_MD', name, content, folder: stored.distillFolder || '' });
      this.renderLibrary();
      dlog(`✅ 已存為 ${name}`, 'success');
      return;
    }

    activeDistillContext = 'distill';
    this.setUI(true);
    dlog(`送出整理（${fmtLabel}，目標：${DistillAIBlock.getAI()}）…`, 'info');
    chrome.runtime.sendMessage({
      type: 'START_DISTILL',
      content,
      fmt: 'wiki',
      targetAI: DistillAIBlock.getAI(),
      wikiTpl,
      fullAuto: cfg.fullAuto !== false,
    });
  },

  async saveDraft() {
    const content = DistillSourceBlock.getContent();
    if (!content) { dlog('請先輸入或抓取內容', 'error'); return; }
    const tStr = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    const name = `draft_${tStr}.md`;
    const stored = await chrome.storage.local.get(['library', 'distillFolder']);
    const lib = stored.library || [];
    lib.unshift({ name, fmt: 'draft', content, chars: content.length, date: new Date().toLocaleDateString('zh-TW') });
    await chrome.storage.local.set({ library: lib });
    this.renderLibrary();
    chrome.runtime.sendMessage({ type: 'DOWNLOAD_MD', name, content, folder: stored.distillFolder || '' });
    dlog(`已儲存草稿並下載到本地：${name}`, 'success');
  },

  async renderLibrary() {
    const d = await chrome.storage.local.get('library');
    const items = (d.library || []).filter(x => ['note', 'wiki', 'draft'].includes(x.fmt));
    const el = $('distillLibList');
    $('distillLibCount').textContent = items.length || '';
    el.innerHTML = items.length
      ? items.slice(0, 8).map(libItemHtml).join('')
      : '<div style="padding:6px 0;font-size:10px;color:var(--text3)">尚無整理記錄</div>';
  },
};
