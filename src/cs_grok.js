// cs_grok.js — injected into x.com/i/grok
function hasValidExtensionContext() {
  try {
    return !!(globalThis.chrome && chrome.runtime && chrome.runtime.id);
  } catch {
    return false;
  }
}

function logInvalidContext(stage) {
  console.warn(`[NT] Extension context invalidated on ${location.hostname}${stage ? ` @ ${stage}` : ''}, aborting Grok content script`);
}

if (!hasValidExtensionContext()) {
  logInvalidContext('bootstrap');
} else {

console.log('[NT] Grok content script ready');

function safeSend(msg) {
  try {
    if (!hasValidExtensionContext()) {
      logInvalidContext('safeSend');
      return;
    }
    chrome.runtime.sendMessage(msg).catch(() => {});
  } catch (_) {}
}

safeSend({ type: 'GROK_PAGE_READY' });

let lastUrl = location.href;
const _ntk_obs = new MutationObserver(() => {
  if (!hasValidExtensionContext()) {
    logInvalidContext('mutationObserver');
    _ntk_obs.disconnect();
    return;
  }
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    safeSend({ type: 'GROK_PAGE_READY' });
  }
});
_ntk_obs.observe(document.body, { childList: true, subtree: true });

}
