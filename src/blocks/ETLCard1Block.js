// ETLCard1Block.js — ETL Card 01: Prompt Selection
// Pure HTML generation; no globals needed.

const ETLCard1Block = {
  render(container) {
    const el = document.createElement('div');
    el.innerHTML = `
      <div class="cf-card etl-card" data-etl-card="prompt">
        <div class="cf-card-head">
          <span class="cf-card-num etl-card-num active" id="sn1">01</span>
          <span class="cf-card-title etl-card-title active" id="st1">選擇分析任務</span>
          <button class="btn btn-ghost btn-xs" data-etl-toggle="prompt">隱藏</button>
        </div>
        <div class="cf-card-body etl-card-body" id="stepSection1">
          <div style="margin-bottom:10px">
            <select id="extractSeriesSel" class="select-compact"></select>
          </div>
          <select id="extractPromptList" class="select-compact extract-prompt-sel"></select>
          <label class="field-label" style="margin-top:12px">分析任務（可手動修改）</label>
          <div class="prompt-stack" id="promptList">
            <div class="prompt-empty">選取上方 Prompt 後，可在這裡直接微調本次送出的內容</div>
          </div>
        </div>
      </div>
    `.trim();
    container.appendChild(el.firstElementChild);
  },
};
