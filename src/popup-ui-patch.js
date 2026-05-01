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

// Step state manager.
function setStep(n) {
  for (let i = 1; i <= 4; i++) {
    const num = document.getElementById('sn' + i);
    const txt = document.getElementById('st' + i);
    if (!num || !txt) continue;

    if (i < n) {
      num.className = 'step-num done';
      txt.className = 'step-text done';
      num.textContent = '✓';
    } else if (i === n) {
      num.className = 'step-num active';
      txt.className = 'step-text active';
      num.textContent = i;
    } else {
      num.className = 'step-num';
      txt.className = 'step-text';
      num.textContent = i;
    }
  }
}

function initStepState() {
  setStep(1);

  const stepObserver = new MutationObserver(() => {
    const grok = document.getElementById('grokResponseSection');
    const post = document.getElementById('postProcessSection');
    const review = document.getElementById('reviewSection');
    const hasGrok = grok && grok.style.display !== 'none';
    const hasPost = post && post.style.display !== 'none';
    const hasReview = review && review.style.display !== 'none';

    if (hasReview) setStep(4);
    else if (hasPost) setStep(3);
    else if (hasGrok) setStep(2);
    else setStep(1);
  });

  ['grokResponseSection', 'postProcessSection', 'reviewSection'].forEach(id => {
    const el = document.getElementById(id);
    if (el) stepObserver.observe(el, { attributes: true, attributeFilter: ['style'] });
  });
}

const topbarLabels = {
  extract: '<span>X ETL</span> — 萃取工作流',
  distill: '<span>DISTILL</span> — 長文整理',
  prompts: '<span>PROMPTS</span> — Prompt 管理',
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

function initFormatCards() {
  document.querySelectorAll('.fmt-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.fmt-card').forEach(c =>
        c.classList.toggle('active', c === card));
      document.dispatchEvent(new CustomEvent('fmtChange', { detail: card.dataset.fmt }));
    });
  });

  document.addEventListener('fmtChange', e => {
    document.querySelectorAll('.fmt-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.fmt === e.detail);
      if (b.dataset.fmt === e.detail) b.click();
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
  initFormatCards();
  initDistillSelectedPromptArea();
});
