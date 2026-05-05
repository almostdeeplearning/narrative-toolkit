// ETLCard1Block.js — ETL Card 01: Prompt Selection
// Pure HTML generation; no globals needed.

const ETLCard1Block = {
  render(container) {
    const el = document.createElement('div');
    el.innerHTML = `
      <div class="cf-card etl-card" data-etl-card="prompt">
        <div class="cf-card-head">
          <span class="cf-card-num etl-card-num active" id="sn1">01</span>
          <span class="cf-card-title etl-card-title active" id="st1">PROMPT — 選擇</span>
          <button class="btn btn-ghost btn-xs" data-etl-toggle="prompt">隱藏</button>
        </div>
        <div class="cf-card-body etl-card-body" id="stepSection1">
          <div style="margin-bottom:10px">
            <select id="extractSeriesSel" class="input" style="width:100%;height:32px;font-size:11px;padding:4px 8px"></select>
          </div>
          <select id="extractPromptList" class="input extract-prompt-sel"></select>
          <div id="extractPromptPreview" class="extract-prompt-preview"></div>
          <div class="prompt-stack" id="promptList">
            <div class="prompt-empty">尚無 Prompt — 從上方選取或直接新增</div>
          </div>
        </div>
      </div>
    `.trim();
    container.appendChild(el.firstElementChild);
  },
};
