// ETLCard3Block.js — ETL Card 03: Target AI
// Pure HTML generation; no globals needed.

const ETLCard3Block = {
  render(container) {
    const el = document.createElement('div');
    el.innerHTML = `
      <div class="etl-step-group" data-etl-card="ai">
        <div class="etl-timeline">
          <div class="etl-num">03</div>
          <div class="etl-vline"></div>
        </div>
        <div class="etl-body">
          <div class="etl-card-head">
            <span class="etl-label">目標 AI</span>
            <button class="btn btn-ghost btn-xs" data-etl-toggle="ai">隱藏</button>
          </div>
          <div class="etl-card-body section">
            <div class="ai-pills" id="extractAiSel">
              <button class="ai-pill active" data-ai="gpt">GPT</button>
              <button class="ai-pill" data-ai="gemini">Gemini</button>
              <button class="ai-pill" data-ai="claude">Claude</button>
              <button class="ai-pill" data-ai="grok">Grok</button>
            </div>
          </div>
        </div>
      </div>
    `.trim();
    container.appendChild(el.firstElementChild);
  },
};
