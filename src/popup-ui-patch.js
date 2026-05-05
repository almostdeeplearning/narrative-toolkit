// popup-ui-patch.js
// UI glue that must live outside popup.html to satisfy MV3 CSP.

// Stub chrome.* APIs for preview contexts outside the extension runtime.
if (typeof chrome === 'undefined' || !chrome.storage) {
  const noop = () => {};
  const asyncNoop = () => Promise.resolve({});
  window.chrome = window.chrome || {};
  chrome.storage = { local: { get: asyncNoop, set: asyncNoop, remove: asyncNoop } };
  chrome.runtime = { sendMessage: noop, onMessage: { addListener: noop } };
  chrome.tabs = { query: asyncNoop, create: noop };
  chrome.scripting = { executeScript: asyncNoop };
}

// Step state manager (3 steps).
function setStep(n) {
  for (let i = 1; i <= 3; i++) {
    const num = document.getElementById('sn' + i);
    const txt = document.getElementById('st' + i);
    if (!num || !txt) continue;

    if (i < n) {
      num.className = num.classList.contains('cf-card-num') ? 'cf-card-num etl-card-num done' : 'etl-num done';
      txt.className = txt.classList.contains('cf-card-title') ? 'cf-card-title etl-card-title done' : 'etl-label done';
      num.textContent = '✓';
    } else if (i === n) {
      num.className = num.classList.contains('cf-card-num') ? 'cf-card-num etl-card-num active' : 'etl-num active';
      txt.className = txt.classList.contains('cf-card-title') ? 'cf-card-title etl-card-title active' : 'etl-label active';
      num.textContent = String(i).padStart(2, '0');
    } else {
      num.className = num.classList.contains('cf-card-num') ? 'cf-card-num etl-card-num' : 'etl-num';
      txt.className = txt.classList.contains('cf-card-title') ? 'cf-card-title etl-card-title' : 'etl-label';
      num.textContent = String(i).padStart(2, '0');
    }
  }
}

function initStepState() {
  setStep(1);

  const stepObserver = new MutationObserver(() => {
    const result = document.getElementById('extractResultSection');
    const hasResult = result && result.style.display !== 'none';
    if (hasResult) setStep(3);
    else setStep(1);
  });

  const resultEl = document.getElementById('extractResultSection');
  if (resultEl) stepObserver.observe(resultEl, { attributes: true, attributeFilter: ['style'] });
}

const topbarLabels = {
  extract:  '<span>X ETL</span> — 萃取工作流',
  distill:  '<span>DISTILL</span> — 長文整理',
  flow:     '<span>FLOW</span> — 自訂流程',
  prompts:  '<span>PROMPTS</span> — Prompt 管理',
  schema:   '<span>SCHEMA</span> — 格式模板庫',
  settings: '<span>CONFIG</span> — 設定',
};

function setActiveNav(tab) {
  document.querySelectorAll('.nav-item[data-tab]').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });

  const lbl = document.getElementById('topbarTitle');
  if (lbl) lbl.innerHTML = topbarLabels[tab] || '';
}

function initSidebarNavigation() {
  const panelObserver = new MutationObserver(() => {
    const active = document.querySelector('.panel.active');
    if (!active) return;
    setActiveNav(active.id.replace('tab-', ''));
  });

  document.querySelectorAll('.panel').forEach(p =>
    panelObserver.observe(p, { attributes: true, attributeFilter: ['class'] }));

  document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      setActiveNav(tab);

      if (typeof switchTab === 'function') {
        switchTab(tab);
        return;
      }

      document.querySelectorAll('.panel').forEach(p =>
        p.classList.toggle('active', p.id === 'tab-' + tab));
    });
  });
}

function initDistillSelectedPromptArea() {
  const distillArea = document.getElementById('distillSelectedPromptArea');
  const distillText = document.getElementById('distillSelectedPromptText');

  const patchDistillArea = () => {
    if (!distillText || !distillArea) return;
    distillArea.style.display = distillText.hasAttribute('data-empty') ? 'none' : '';
  };

  patchDistillArea();
  setInterval(patchDistillArea, 300);
}

document.addEventListener('DOMContentLoaded', () => {
  initStepState();
  initSidebarNavigation();
  initDistillSelectedPromptArea();
});
