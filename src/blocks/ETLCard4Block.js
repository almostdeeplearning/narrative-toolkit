// ETLCard4Block.js — ETL Card 04: Run Extract
// Pure HTML generation; no globals needed.

const ETLCard4Block = {
  render(container) {
    const el = document.createElement('div');
    el.innerHTML = `
      <div class="cf-card etl-card" data-etl-card="run">
        <div class="cf-card-head">
          <span class="cf-card-num etl-card-num">04</span>
          <span class="cf-card-title etl-card-title">RUN — 執行萃取</span>
          <button class="btn btn-ghost btn-xs" data-etl-toggle="run">隱藏</button>
        </div>
        <div class="cf-card-body etl-card-body" id="stepSection2">
          <span id="sn2" style="display:none"></span>
          <span id="st2" style="display:none"></span>
          <div class="run-row">
            <button class="btn btn-primary" id="startBtn">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M2 1.5l7 3.5-7 3.5V1.5z"/></svg>
              開始萃取
            </button>
            <button class="btn btn-danger" id="stopBtn" style="display:none">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect x="2" y="2" width="6" height="6"/></svg>
              停止
            </button>
            <div class="delay-group">
              <span class="delay-label">等待</span>
              <input class="delay-input" id="delayInput" type="number" value="35" min="10" max="120">
              <span class="delay-label">秒</span>
            </div>
          </div>
          <div class="progress" id="prog">
            <div class="prog-bar"><div class="prog-fill" id="progFill" style="width:0%"></div></div>
            <div class="prog-label"><span id="progTxt">0 / 0</span></div>
          </div>
          <div class="log-strip" id="extractLog"><span class="ll">就緒</span></div>
        </div>
      </div>
    `.trim();
    container.appendChild(el.firstElementChild);
  },
};
