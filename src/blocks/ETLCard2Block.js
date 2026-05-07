// ETLCard2Block.js — ETL Card 02: Schema Format
// Pure HTML generation; no globals needed.

const ETLCard2Block = {
  render(container) {
    const el = document.createElement('div');
    el.innerHTML = `
      <div class="cf-card etl-card" data-etl-card="schema">
        <div class="cf-card-head">
          <span class="cf-card-num etl-card-num">02</span>
          <span class="cf-card-title etl-card-title">選擇輸出格式</span>
          <button class="btn btn-ghost btn-xs" data-etl-toggle="schema">隱藏</button>
        </div>
        <div class="cf-card-body etl-card-body">
          <select id="extractSchemaSel" class="input" style="width:100%;height:32px;font-size:11px;padding:4px 8px">
            <option value="">-不選擇schema格式-</option>
          </select>
          <pre class="selected-prompt-preview" id="extractSchemaPreview" data-empty="1" style="margin-top:6px;max-height:80px;overflow:auto"></pre>
        </div>
      </div>
    `.trim();
    container.appendChild(el.firstElementChild);
  },
};
