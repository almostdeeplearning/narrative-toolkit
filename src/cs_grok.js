// cs_grok.js — injected into x.com/i/grok
console.log('[NT] Grok content script ready');

function safeSend(msg) {
  try {
    if (!chrome.runtime?.id) return;
    chrome.runtime.sendMessage(msg).catch(() => {});
  } catch (_) {}
}

safeSend({ type: 'GROK_PAGE_READY' });

let lastUrl = location.href;
const _ntk_obs = new MutationObserver(() => {
  if (!chrome.runtime?.id) { _ntk_obs.disconnect(); return; }
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    safeSend({ type: 'GROK_PAGE_READY' });
  }
});
_ntk_obs.observe(document.body, { childList: true, subtree: true });
