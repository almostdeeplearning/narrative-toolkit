// ETLStep3Block.js — ETL Tab Step 3: Save Result + Recent Extract Library
// Depends on no globals; pure HTML generation.

const ETLStep3Block = {
  render(container) {
    const el = document.createElement('div');
    el.innerHTML = `
      <div class="etl-step-group">
        <div class="etl-timeline">
          <div class="etl-num" id="sn3">03</div>
        </div>
        <div class="etl-body">
          <div class="etl-label" id="st3">STEP 3 — 儲存結果</div>
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
