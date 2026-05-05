// DistillTaskBlock.js — Block 2 of the Distill pipeline
// Depends on globals: $, esc, series, chrome (available at call time from popup.js)

const DistillTaskBlock = {
  isInitialized: false,
  seriesId: null,
  promptIdx: null,

  init(d) {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.seriesId = d.distillSeriesId || null;
    this.promptIdx = d.distillPromptIdx ?? null;

    $('distillSeriesSel').addEventListener('change', () => {
      this.seriesId = $('distillSeriesSel').value || null;
      this.promptIdx = null;
      chrome.storage.local.set({ distillSeriesId: this.seriesId, distillPromptIdx: this.promptIdx });
      this._renderPromptList();
    });
    $('clearDistillPromptBtn').addEventListener('click', () => {
      this.seriesId = null;
      this.promptIdx = null;
      chrome.storage.local.set({ distillSeriesId: null, distillPromptIdx: null });
      this._renderPicker();
    });
    $('distillPromptList').addEventListener('click', e => {
      const btn = e.target.closest('[data-action="selectDistillPrompt"]');
      if (btn) this._selectPrompt(Number(btn.dataset.idx));
    });

    this._renderPicker();
  },

  renderCF(container) {
    const el = document.createElement('div');
    el.innerHTML = `
      <div class="cf-card" data-cf-card="task">
        <div class="cf-card-head">
          <span class="cf-card-num">02</span>
          <span class="cf-card-title">TASK — Prompt 任務</span>
          <select class="cf-delay-sel" data-cf-delay-for="task">
            <option value="0">無延遲</option>
            <option value="2">2s</option>
            <option value="5">5s</option>
            <option value="10">10s</option>
            <option value="20">20s</option>
            <option value="custom">自訂</option>
          </select>
          <input class="cf-delay-custom" type="number" min="0" max="300" data-cf-custom-for="task" style="display:none" placeholder="秒">
          <button class="btn btn-ghost btn-xs" data-cf-toggle="task">隱藏</button>
        </div>
        <div class="cf-card-body">
          <div class="row" style="gap:8px;margin-bottom:8px">
            <select id="cfSeriesSel" class="input" style="flex:1;height:30px;font-size:11px;padding:4px 8px"></select>
            <button class="btn btn-xs" id="cfClearPromptBtn">✕</button>
          </div>
          <select id="cfPromptSel" class="input" style="width:100%;height:30px;font-size:11px;padding:4px 8px;margin-bottom:8px"></select>
          <pre class="selected-prompt-preview" id="cfSelectedPromptText" data-empty="1" style="max-height:80px;overflow:auto"></pre>
        </div>
      </div>
    `.trim();
    container.appendChild(el.firstElementChild);
  },

  getSelectedPrompt() {
    if (!this.seriesId || this.promptIdx === null) return null;
    const s = series.find(x => x.id === this.seriesId);
    const p = s?.prompts[this.promptIdx];
    return p ? { text: p.text, name: p.name } : null;
  },

  _renderPicker() {
    const sel = $('distillSeriesSel');
    sel.innerHTML = '<option value="">— 不使用 Prompt 庫 —</option>' +
      series.map(s => `<option value="${s.id}"${s.id === this.seriesId ? ' selected' : ''}>${esc(s.name)}</option>`).join('');
    this._renderPromptList();
  },

  _renderPromptList() {
    const list = $('distillPromptList');
    if (!this.seriesId) { list.innerHTML = ''; this._updateSelectedArea(); return; }
    const s = series.find(x => x.id === this.seriesId);
    if (!s?.prompts.length) {
      list.innerHTML = '<span style="font-size:10px;color:var(--text3)">此系列無 Prompt</span>';
      this._updateSelectedArea(); return;
    }
    list.innerHTML = s.prompts.map((p, i) => {
      const active = i === this.promptIdx;
      const style = active ? 'border-color:var(--text2);color:var(--text);background:var(--bg3)' : '';
      return `<button class="btn btn-ghost btn-sm" data-action="selectDistillPrompt" data-idx="${i}" style="font-size:10px;${style}">${esc(p.name)}</button>`;
    }).join('');
    this._updateSelectedArea();
  },

  _selectPrompt(idx) {
    this.promptIdx = this.promptIdx === idx ? null : idx;
    chrome.storage.local.set({ distillPromptIdx: this.promptIdx });
    this._renderPromptList();
  },

  _updateSelectedArea() {
    const el = $('distillSelectedPromptText');
    const prompt = this.getSelectedPrompt();
    if (!prompt) { el.textContent = ''; el.setAttribute('data-empty', '1'); }
    else { el.textContent = prompt.text; el.removeAttribute('data-empty'); }
  },
};
