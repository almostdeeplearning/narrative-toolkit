// ETLCard5Block.js — ETL Card 05: Save Result + Recent Extract Library
// Pure HTML generation; no globals needed.

const ETLCard5Block = {
  render(container) {
    const el = document.createElement('div');
    el.innerHTML = `
      <div class="cf-card etl-card" data-etl-card="save">
        <div class="cf-card-head">
          <span class="cf-card-num etl-card-num">05</span>
          <span class="cf-card-title etl-card-title">SAVE — 儲存結果</span>
          <button class="btn btn-ghost btn-xs" data-etl-toggle="save">隱藏</button>
        </div>
        <div class="cf-card-body etl-card-body">
          <span id="sn3" style="display:none"></span>
          <span id="st3" style="display:none"></span>
          <div id="extractResultSection" style="display:none">
            <div class="section">
              <div class="section-head">
                <div class="row" style="gap:4px;margin-left:auto">
                  <button class="btn btn-xs" id="copyExtractBtn">複製</button>
                  <button class="btn btn-xs" id="saveExtractBtn">⬇ 儲存 .md</button>
                </div>
              </div>
              <pre class="result-pre" id="extractResultText" style="max-height:280px"></pre>
            </div>
          </div>
        </div>
      </div>
    `.trim();
    container.appendChild(el.firstElementChild);
  },

  renderLib(container) {
    const el = document.createElement('div');
    el.innerHTML = `
      <div class="lib-section">
        <div class="lib-toggle" id="extractLibToggle">
          <span>最近萃取</span>
          <span class="lib-count" id="extractLibCount"></span>
          <span class="lib-chevron" id="extractLibChevron">▾</span>
        </div>
        <div id="extractLibList" style="display:none;margin-top:4px"></div>
      </div>
    `.trim();
    container.appendChild(el.firstElementChild);
  },
};
