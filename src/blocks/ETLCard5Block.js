// ETLCard5Block.js — ETL Card 05: Save Result + Recent Extract Library
// Pure HTML generation; no globals needed.

const ETLCard5Block = {
  render(container) {
    const el = document.createElement('div');
    el.innerHTML = `
      <div class="cf-card etl-card" data-etl-card="save">
        <div class="cf-card-head">
          <span class="cf-card-num etl-card-num">05</span>
          <span class="cf-card-title etl-card-title" data-i18n="etl_card_save">結果確認與儲存</span>
          <button class="btn btn-ghost btn-xs" data-etl-toggle="save" data-i18n="hidden">隱藏</button>
        </div>
        <div class="cf-card-body etl-card-body">
          <span id="sn3" style="display:none"></span>
          <span id="st3" style="display:none"></span>
          <div id="extractResultSection">
            <div class="section">
              <div class="section-head">
                <div class="row" style="gap:4px;margin-left:auto">
                  <button class="btn btn-xs" id="captureCurrentReplyBtn" data-i18n="capture_current_reply">截取當前回覆</button>
                  <button class="btn btn-xs" id="saveExtractBtn" data-i18n="save_md">⬇ 儲存 .md</button>
                </div>
              </div>
              <textarea class="result-pre result-editor" id="extractResultText" rows="10" data-i18n-placeholder="etl_result_placeholder" placeholder="等待 Grok 回覆完成後，按「截取當前回覆」，可在這裡直接微調再儲存。"></textarea>
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
          <span data-i18n="recent_extract">最近萃取</span>
          <span class="lib-count" id="extractLibCount"></span>
          <span class="lib-chevron" id="extractLibChevron">▾</span>
        </div>
        <div id="extractLibList" style="display:none;margin-top:4px"></div>
      </div>
    `.trim();
    container.appendChild(el.firstElementChild);
  },
};
