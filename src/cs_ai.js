// cs_ai.js — injected into chatgpt.com, gemini.google.com, claude.ai
// Detects which AI we're on, injects pending prompt, captures response, sends back

function hasValidExtensionContext() {
  try {
    return !!(globalThis.chrome && chrome.runtime && chrome.runtime.id);
  } catch {
    return false;
  }
}

function logInvalidContext(stage) {
  console.warn(`[NT] Extension context invalidated on ${location.hostname}${stage ? ` @ ${stage}` : ''}, aborting content script`);
}

if (!hasValidExtensionContext()) {
  logInvalidContext('bootstrap');
} else {

const HOST = location.hostname;
const AI   = HOST.includes('chatgpt') ? 'gpt'
           : HOST.includes('gemini')  ? 'gemini'
           : HOST.includes('claude')  ? 'claude'
           : 'unknown';

console.log(`[NT] AI content script ready on ${AI}`);

// Selectors per AI
const SELECTORS = {
  gpt: {
    input:    ['#prompt-textarea', 'div[contenteditable="true"][data-id]', 'textarea'],
    submit:   ['button[data-testid="send-button"]', 'button[aria-label*="Send"]'],
    response: ['div[data-message-author-role="assistant"] .markdown', 'div[data-message-author-role="assistant"] p', '[class*="agent-turn"] p'],
    loading:  ['button[aria-label="Stop generating"]', '.result-streaming'],
  },
  gemini: {
    input:    ['div[contenteditable="true"][aria-label]', 'rich-textarea div[contenteditable="true"]', 'div[contenteditable="true"]'],
    submit:   ['button[aria-label*="Send"]', 'button[data-mat-icon-name="send"]'],
    response: ['model-response .response-content', 'model-response p', '.model-response-text'],
    loading:  ['[aria-label*="Stop"]', '.loading-indicator'],
  },
  claude: {
    input:    ['div[contenteditable="true"][data-placeholder]', 'div[contenteditable="true"]', 'textarea'],
    submit:   ['button[aria-label="Send Message"]', 'button[type="submit"]'],
    response: ['.font-claude-message p', '[data-is-streaming="false"] p', '.prose p'],
    loading:  ['[data-is-streaming="true"]', 'button[aria-label="Stop"]'],
  },
};

const sel = SELECTORS[AI] || SELECTORS.gpt;

let injected = false;
let currentTag = null;

async function safeStorageGet(keys, stage) {
  if (!hasValidExtensionContext()) {
    logInvalidContext(stage || 'storage.get');
    return null;
  }
  try {
    return await chrome.storage.local.get(keys);
  } catch (err) {
    if (/Extension context invalidated/i.test(String(err?.message || err))) {
      logInvalidContext(stage || 'storage.get');
      return null;
    }
    throw err;
  }
}

async function safeStorageSet(payload, stage) {
  if (!hasValidExtensionContext()) {
    logInvalidContext(stage || 'storage.set');
    return false;
  }
  try {
    await chrome.storage.local.set(payload);
    return true;
  } catch (err) {
    if (/Extension context invalidated/i.test(String(err?.message || err))) {
      logInvalidContext(stage || 'storage.set');
      return false;
    }
    throw err;
  }
}

function safeSendMessage(message, stage) {
  if (!hasValidExtensionContext()) {
    logInvalidContext(stage || 'sendMessage');
    return false;
  }
  try {
    chrome.runtime.sendMessage(message);
    return true;
  } catch (err) {
    if (/Extension context invalidated/i.test(String(err?.message || err))) {
      logInvalidContext(stage || 'sendMessage');
      return false;
    }
    throw err;
  }
}

async function tryInject() {
  if (injected) return;
  if (!hasValidExtensionContext()) {
    logInvalidContext('tryInject:start');
    return;
  }

  // Find any pending prompt for this AI
  const allKeys = await safeStorageGet(null, 'tryInject:getAll');
  if (!allKeys) return;
  let tag = null, prompt = null;

  for (const [k, v] of Object.entries(allKeys)) {
    if (k.startsWith('ai_prompt_') && allKeys[`ai_state_${k.slice(10)}`] === 'waiting') {
      tag = k.slice(10);
      prompt = v;
      break;
    }
  }
  if (!tag || !prompt) return;

  injected = true;
  currentTag = tag;
  if (!await safeStorageSet({ [`ai_state_${tag}`]: 'injecting' }, 'tryInject:setInjecting')) {
    injected = false;
    currentTag = null;
    return;
  }

  console.log(`[NT] Injecting tag=${tag} on ${AI}`);

  const inputEl = await waitForEl(sel.input, 15000);
  if (!inputEl) {
    safeSendMessage({ type: 'ERROR', text: `找不到 ${AI} 輸入框` }, 'tryInject:noInput');
    injected = false; return;
  }

  // Inject text
  inputEl.focus();
  await sleep(200);
  document.execCommand('selectAll', false, null);
  document.execCommand('insertText', false, prompt);

  if (!inputEl.textContent.trim() && inputEl.tagName !== 'TEXTAREA') {
    inputEl.textContent = prompt;
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
  }
  if (inputEl.tagName === 'TEXTAREA') {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(inputEl, prompt);
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
  }

  await sleep(400);
  await trySubmit(inputEl);

  console.log(`[NT] Submitted, waiting for ${AI} response…`);
  safeSendMessage({ type: 'LOG_DISTILL', text: `${AI} 接收中，等待回應…`, level: 'info' }, 'tryInject:submitted');

  const response = await waitForResponse(90000);
  if (!response) {
    safeSendMessage({ type: 'ERROR', text: `${AI} 回應逾時` }, 'tryInject:timeout');
    return;
  }

  console.log(`[NT] Response captured, length=${response.length}`);
  if (!safeSendMessage({ type: 'AI_RESPONSE', tag, text: response }, 'tryInject:response')) return;
  await safeStorageSet({ [`ai_state_${tag}`]: 'done', [`ai_prompt_${tag}`]: null }, 'tryInject:setDone');
}

async function trySubmit(inputEl) {
  // Enter key
  inputEl.dispatchEvent(new KeyboardEvent('keydown', { key:'Enter', keyCode:13, bubbles:true, cancelable:true }));
  await sleep(100);
  // Submit buttons
  for (const s of sel.submit) {
    const btn = document.querySelector(s);
    if (btn && !btn.disabled) { btn.click(); return; }
  }
  // Generic send button
  const btns = [...document.querySelectorAll('button')];
  const send = btns.find(b => /send|submit/i.test(b.textContent + b.getAttribute('aria-label')));
  if (send) send.click();
}

async function waitForResponse(timeout) {
  // Wait for loading to start first
  await sleep(1500);
  const start = Date.now(); let last = '', stable = 0;

  while (Date.now() - start < timeout) {
    await sleep(1800);

    // Check if still loading
    const loading = sel.loading.some(s => document.querySelector(s));

    const text = getResponseText();
    if (text.length > 30) {
      if (text === last && !loading) {
        stable++;
        if (stable >= 3) return text;
      } else { stable = 0; last = text; }
    }
  }
  return last || null;
}

function getResponseText() {
  for (const s of sel.response) {
    const els = [...document.querySelectorAll(s)];
    if (els.length) return els.map(e => e.innerText||'').filter(t => t.length > 5).join('\n').trim();
  }
  return '';
}

async function waitForEl(selectors, timeout) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    for (const s of selectors) {
      for (const el of document.querySelectorAll(s)) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) return el;
      }
    }
    await sleep(500);
  }
  return null;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Entry ─────────────────────────────────────────────────────────────────────
setTimeout(() => {
  if (!hasValidExtensionContext()) {
    logInvalidContext('entryTimeout');
    return;
  }
  tryInject();
}, 2500);

// SPA navigation re-trigger
let lastUrl = location.href;
new MutationObserver(() => {
  if (!hasValidExtensionContext()) {
    logInvalidContext('mutationObserver');
    return;
  }
  if (location.href !== lastUrl) {
    lastUrl = location.href; injected = false;
    setTimeout(tryInject, 2500);
  }
}).observe(document.body, { childList: true, subtree: true });

}
