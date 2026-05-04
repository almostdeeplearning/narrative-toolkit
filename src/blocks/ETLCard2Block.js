// ETLCard2Block.js — ETL Card 02: Schema Format
// Pure HTML generation; no globals needed.

const ETLCard2Block = {
  render(container) {
    const el = document.createElement('div');
    el.innerHTML = `
      <div class="etl-step-group" data-etl-card="schema">
        <div class="etl-timeline">
          <div class="etl-num">02</div>
          <div class="etl-vline"></div>
        </div>
        <div class="etl-body">
          <div class="etl-card-head">
            <span class="etl-label">SCHEMA — 格式</span>
            <button class="btn btn-ghost btn-xs" data-etl-toggle="schema">隱藏</button>
          </div>
          <div class="etl-card-body section">
            <select id="extractSchemaSel" class="input" style="width:100%;height:32px;font-size:11px;padding:4px 8px">
              <option value="">— 選擇 Schema 格式（選填）—</option>
            </select>
            <pre class="selected-prompt-preview" id="extractSchemaPreview" data-empty="1" style="margin-top:6px;max-height:80px;overflow:auto"></pre>
          </div>
        </div>
      </div>
    `.trim();
    container.appendChild(el.firstElementChild);
  },
};
