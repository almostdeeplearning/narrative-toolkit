// ETLCard3Block.js — ETL Card 03: Target AI
// Pure HTML generation; no globals needed.

const ETLCard3Block = {
  render(container) {
    const el = document.createElement('div');
    el.innerHTML = `
      <div class="cf-card etl-card" data-etl-card="ai">
        <div class="cf-card-head">
          <span class="cf-card-num etl-card-num">03</span>
          <span class="cf-card-title etl-card-title">AI — 目標 AI</span>
          <button class="btn btn-ghost btn-xs" data-etl-toggle="ai">隱藏</button>
        </div>
        <div class="cf-card-body etl-card-body">
          <div class="ai-pills" id="extractAiSel">
            <button class="ai-pill active" data-ai="gpt">GPT</button>
            <button class="ai-pill" data-ai="gemini">Gemini</button>
            <button class="ai-pill" data-ai="claude">Claude</button>
            <button class="ai-pill" data-ai="grok">Grok</button>
          </div>
        </div>
      </div>
    `.trim();
    container.appendChild(el.firstElementChild);
  },
};
