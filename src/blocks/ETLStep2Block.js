// ETLStep2Block.js — ETL Tab Step 2: Run Extract
// Depends on no globals; pure HTML generation.

const ETLStep2Block = {
  render(container) {
    const el = document.createElement('div');
    el.innerHTML = `
      <div class="etl-step-group">
        <div class="etl-timeline">
          <div class="etl-num" id="sn2">02</div>
          <div class="etl-vline"></div>
        </div>
        <div class="etl-body">
          <div class="etl-label" id="st2">STEP 2 — 執行萃取</div>
          <div class="section" id="stepSection2">
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
      </div>
    `.trim();
    container.appendChild(el.firstElementChild);
  },
};
