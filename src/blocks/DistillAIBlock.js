// DistillAIBlock.js — Block 4 of the Distill pipeline
// Depends on globals: $, chrome (available at call time from popup.js)

const DistillAIBlock = {
  isInitialized: false,
  ai: 'gpt',

  _distillMarkup() {
    return `
      <div class="ai-pills" id="distillAiSelect">
        <button class="ai-pill active" data-ai="gpt">GPT</button>
        <button class="ai-pill" data-ai="gemini">Gemini</button>
        <button class="ai-pill" data-ai="claude">Claude</button>
        <button class="ai-pill" data-ai="grok">Grok</button>
      </div>
    `.trim();
  },

  init(d) {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.ai = d.distillAI || 'gpt';

    // Buttons use class .ai-pill (previous code incorrectly queried .ai-btn — fixed here)
    $('distillAiSelect').querySelectorAll('.ai-pill').forEach(b =>
      b.addEventListener('click', () => {
        this.ai = b.dataset.ai;
        $('distillAiSelect').querySelectorAll('.ai-pill').forEach(x =>
          x.classList.toggle('active', x.dataset.ai === this.ai));
        chrome.storage.local.set({ distillAI: this.ai });
      }));

    $('distillAiSelect').querySelectorAll('.ai-pill').forEach(b =>
      b.classList.toggle('active', b.dataset.ai === this.ai));
  },

  getAI() { return this.ai; },

  renderDistill(container) {
    if (!container) return;
    container.innerHTML = this._distillMarkup();
  },

  renderCF(container) {
    const el = document.createElement('div');
    el.innerHTML = `
      <div class="cf-card" data-cf-card="ai">
        <div class="cf-card-head">
          <span class="cf-card-num">04</span>
          <span class="cf-card-title" data-i18n="cf_card_ai">選擇 AI</span>
          <div class="cf-delay-meta">
            <span class="cf-delay-label" data-i18n="cf_delay_label">下一步前等</span>
            <select class="cf-delay-sel" data-cf-delay-for="ai">
              <option value="0">0</option>
              <option value="2">2</option>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="custom" data-i18n="cf_custom_delay">自訂</option>
            </select>
            <input class="cf-delay-custom" type="number" min="0" max="300" data-cf-custom-for="ai" style="display:none" data-i18n-placeholder="seconds" placeholder="秒">
            <span class="cf-delay-unit" data-i18n="seconds">秒</span>
          </div>
          <button class="btn btn-ghost btn-xs" data-cf-toggle="ai" data-i18n="hidden">隱藏</button>
        </div>
        <div class="cf-card-body">
          <div class="ai-pills" id="cfAiSelect">
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
