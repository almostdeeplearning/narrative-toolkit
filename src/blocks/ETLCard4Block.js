// ETLCard4Block.js — ETL Card 04: Run Extract
// Pure HTML generation; no globals needed.

const ETLCard4Block = {
  render(container) {
    const el = document.createElement('div');
    el.innerHTML = `
      <div class="cf-card etl-card" data-etl-card="run">
        <div class="cf-card-head">
          <span class="cf-card-num etl-card-num">04</span>
          <span class="cf-card-title etl-card-title" data-i18n="etl_card_run">開始生成</span>
          <button class="btn btn-ghost btn-xs" data-etl-toggle="run" data-i18n="hidden">隱藏</button>
        </div>
        <div class="cf-card-body etl-card-body" id="stepSection2">
          <span id="sn2" style="display:none"></span>
          <span id="st2" style="display:none"></span>
          <input id="delayInput" type="hidden" value="35">
          <div class="run-row">
            <button class="btn btn-primary etl-run-cta" id="startBtn">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M2 1.5l7 3.5-7 3.5V1.5z"/></svg>
              <span data-i18n="start_generation">開始生成</span>
            </button>
            <button class="btn btn-danger" id="stopBtn" style="display:none">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect x="2" y="2" width="6" height="6"/></svg>
              <span data-i18n="stop">停止</span>
            </button>
          </div>
          <div class="progress" id="prog">
            <div class="prog-bar"><div class="prog-fill" id="progFill" style="width:0%"></div></div>
            <div class="prog-label"><span id="progTxt" data-i18n="etl_progress_idle">尚未開始</span></div>
            <div class="prog-subtxt" id="progSubtxt" data-i18n="etl_progress_idle_sub">尚未開始執行</div>
          </div>
          <div class="log-strip" id="extractLog"><span class="ll log-placeholder" data-placeholder="1" data-i18n="etl_log_placeholder">詳細執行記錄會顯示在這裡。</span></div>
        </div>
      </div>
    `.trim();
    container.appendChild(el.firstElementChild);
  },
};
