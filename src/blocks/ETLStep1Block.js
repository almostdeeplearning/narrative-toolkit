// ETLStep1Block.js — ETL Tab Step 1: Prompt & Schema
// Depends on no globals; pure HTML generation.

const ETLStep1Block = {
  render(container) {
    const el = document.createElement('div');
    el.innerHTML = `
      <div class="etl-step-group">
        <div class="etl-timeline">
          <div class="etl-num active" id="sn1">01</div>
          <div class="etl-vline"></div>
        </div>
        <div class="etl-body">
          <div class="etl-label active" id="st1">STEP 1 — PROMPT &amp; SCHEMA</div>
          <div class="section active-section" id="stepSection1">
            <div class="section-head">
              <div class="row" style="gap:6px">
                <select id="extractSeriesSel" class="input" style="width:160px;height:32px;font-size:11px;padding:4px 8px"></select>
              </div>
            </div>
            <select id="extractPromptList" class="input extract-prompt-sel"></select>
            <div id="extractPromptPreview" class="extract-prompt-preview"></div>
            <div class="prompt-stack" id="promptList">
              <div class="prompt-empty">尚無 Prompt — 從上方選取或直接新增</div>
            </div>
            <div style="margin-top:14px;border-top:1px solid var(--line);padding-top:12px">
              <div class="field-label" style="margin-bottom:6px">Schema 格式</div>
              <select id="extractSchemaSel" class="input" style="width:100%;height:32px;font-size:11px;padding:4px 8px">
                <option value="">— 選擇 Schema 格式（選填）—</option>
              </select>
              <pre class="selected-prompt-preview" id="extractSchemaPreview" data-empty="1" style="margin-top:6px;max-height:80px;overflow:auto"></pre>
            </div>
          </div>
        </div>
      </div>
    `.trim();
    container.appendChild(el.firstElementChild);
  },
};
