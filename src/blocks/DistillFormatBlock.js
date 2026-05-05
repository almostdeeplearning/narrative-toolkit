// DistillFormatBlock.js — Block 3 of the Distill pipeline
// Depends on globals: $, esc, schemaTemplates, chrome (available at call time from popup.js)

const DistillFormatBlock = {
  isInitialized: false,
  schemaId: null,

  _distillMarkup() {
    return `
      <div class="row" style="gap:8px;align-items:center;margin-bottom:6px">
        <select id="distillSchemaSel" class="input" style="flex:1;height:32px;font-size:11px;padding:4px 8px">
          <option value="">— 不用 Schema，直接存草稿 —</option>
        </select>
        <button class="btn btn-xs" id="clearDistillSchemaBtn">✕</button>
      </div>
      <pre class="selected-prompt-preview" id="distillSchemaPreview" data-empty="1" style="max-height:80px;overflow:auto;margin-bottom:8px"></pre>
    `.trim();
  },

  init(d) {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.schemaId = d.distillSchemaId || null;

    $('distillSchemaSel').addEventListener('change', () => {
      this.schemaId = $('distillSchemaSel').value || null;
      chrome.storage.local.set({ distillSchemaId: this.schemaId });
      this._updatePreview();
    });
    $('clearDistillSchemaBtn').addEventListener('click', () => {
      this.schemaId = null;
      chrome.storage.local.set({ distillSchemaId: null });
      this._renderPicker();
    });

    this._renderPicker();
  },

  renderDistill(container) {
    if (!container) return;
    container.innerHTML = this._distillMarkup();
  },

  renderCF(container) {
    const el = document.createElement('div');
    el.innerHTML = `
      <div class="cf-card" data-cf-card="format">
        <div class="cf-card-head">
          <span class="cf-card-num">03</span>
          <span class="cf-card-title">FORMAT — 輸出格式</span>
          <select class="cf-delay-sel" data-cf-delay-for="format">
            <option value="0">無延遲</option>
            <option value="2">2s</option>
            <option value="5">5s</option>
            <option value="10">10s</option>
            <option value="20">20s</option>
            <option value="custom">自訂</option>
          </select>
          <input class="cf-delay-custom" type="number" min="0" max="300" data-cf-custom-for="format" style="display:none" placeholder="秒">
          <button class="btn btn-ghost btn-xs" data-cf-toggle="format">隱藏</button>
        </div>
        <div class="cf-card-body">
          <div class="row" style="gap:8px;margin-bottom:6px">
            <select id="cfSchemaSel" class="input" style="flex:1;height:30px;font-size:11px;padding:4px 8px">
              <option value="">— 不用 Schema，直接存草稿 —</option>
            </select>
            <button class="btn btn-xs" id="cfClearSchemaBtn">✕</button>
          </div>
          <pre class="selected-prompt-preview" id="cfSchemaPreview" data-empty="1" style="max-height:80px;overflow:auto"></pre>
        </div>
      </div>
    `.trim();
    container.appendChild(el.firstElementChild);
  },

  getSelectedSchema() {
    if (!this.schemaId) return null;
    const s = schemaTemplates.find(x => x.id === this.schemaId);
    return s ? { text: s.text, name: s.name } : null;
  },

  _renderPicker() {
    const sel = $('distillSchemaSel');
    sel.innerHTML = '<option value="">— 不用 Schema，直接存草稿 —</option>' +
      schemaTemplates.map(s =>
        `<option value="${s.id}"${s.id === this.schemaId ? ' selected' : ''}>${esc(s.name)}</option>`
      ).join('');
    this._updatePreview();
  },

  _updatePreview() {
    const el = $('distillSchemaPreview');
    const schema = this.getSelectedSchema();
    if (!schema) { el.textContent = ''; el.setAttribute('data-empty', '1'); return; }
    el.textContent = schema.text;
    el.removeAttribute('data-empty');
  },
};
