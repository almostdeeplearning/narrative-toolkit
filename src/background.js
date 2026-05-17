// background.js — Narrative Toolkit unified service worker

let stopped = false;

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// On service worker startup, purge any stale ai_prompt_*/ai_state_*/ai_tab_* keys
// so cs_ai.js does not auto-inject leftover jobs from a previous session.
chrome.storage.local.get(null).then(all => {
  const stale = Object.keys(all).filter(k =>
    k.startsWith('ai_prompt_') || k.startsWith('ai_state_') || k.startsWith('ai_tab_')
  );
  if (stale.length) chrome.storage.local.remove(stale);
});

chrome.runtime.onMessage.addListener((msg) => {
  switch (msg.type) {
    case 'START_EXTRACT':       handleExtract(msg); break;
    case 'START_DISTILL':       handleDistill(msg); break;
    case 'START_VERIFY_WIKI':   handleVerifyWiki(msg); break;
    case 'RUN_AI_STRUCTURE':    runAIStructure(msg); break;
    case 'DOWNLOAD_MD':         downloadMd(msg.name, msg.content, msg.folder || ''); break;
    case 'DOWNLOAD_TEXT':       downloadText(msg.name, msg.content, msg.mime || 'text/plain;charset=utf-8', msg.folder || '', !!msg.saveAs); break;
    case 'DOWNLOAD_MD_BY_NAME': downloadMdByName(msg.name); break;
    case 'AI_RESPONSE':         handleAIResponse(msg); break;
    case 'STOP':                stopped = true; break;
  }
});

// ════════════════════════════════════════════════════════════
//  TAB A — GROK EXTRACT
// ════════════════════════════════════════════════════════════
async function handleExtract({ prompts, delaySeconds, targetAI, grokMode }) {
  stopped = false;
  let sentCount = 0;
  const ai = ['gpt', 'gemini', 'claude', 'grok'].includes(targetAI) ? targetAI : 'gpt';
  const mode = grokMode === 'inline' ? 'inline' : 'page';
  const target = await resolveExtractTargetTab(ai, mode);

  if (!target?.tabId) {
    const text = target?.error || (
      ai === 'grok' && mode === 'inline'
        ? '找不到可用的 X 頁面。請先在 x.com 開啟 Grok 小視窗後再執行。'
        : `找不到可用的 ${getAIName(ai)} 頁面。`
    );
    bcast({ type: 'ERROR', text });
    return;
  }
  const tabId = target.tabId;

  // Bring Grok tab to foreground so user can see the interaction,
  // then wait for the tab to finish re-rendering before injecting.
  try { await chrome.tabs.update(tabId, { active: true }); } catch(_) {}
  await sleep(target.justOpened ? 2500 : 700);

  // Remove stale ai_prompt_*/ai_state_*/ai_tab_* keys to prevent cs_ai.js
  // from auto-injecting leftover jobs from a previous session
  const allStorage = await chrome.storage.local.get(null);
  const staleKeys = Object.keys(allStorage).filter(k =>
    k.startsWith('ai_prompt_') || k.startsWith('ai_state_') || k.startsWith('ai_tab_')
  );
  if (staleKeys.length) await chrome.storage.local.remove(staleKeys);

  logE(`共 ${prompts.length} 個 Prompt，準備送出到 ${target.label || getAIName(ai)}`, 'info');

  for (let i = 0; i < prompts.length; i++) {
    if (stopped) { logE('已中止', 'warn'); return; }

    bcast({ type: 'PROGRESS', current: i, total: prompts.length, promptIndex: i, status: 'running' });
    logE(`送出 #${i+1}…`, 'info');

    try {
      await sendExtractPromptToTarget(tabId, prompts[i], ai, mode);
      sentCount++;
      bcast({ type: 'PROGRESS', current: i+1, total: prompts.length, promptIndex: i, status: 'done' });
      logE(`✓ #${i+1} 已送出`, 'success');
    } catch(e) {
      bcast({ type: 'PROGRESS', current: i+1, total: prompts.length, promptIndex: i, status: 'error' });
      logE(`✗ #${i+1}: ${e.message}`, 'error');
    }
    if (i < prompts.length - 1 && !stopped) await sleep(2000);
  }

  if (!sentCount) {
    bcast({ type: 'ERROR', text: '沒有成功送出任何 Prompt。請確認 Grok chat 頁面已載入並可輸入。' });
    return;
  }

  logE('全部 Prompt 已送出，請在回覆完成後手動截取。', 'success');
  bcast({ type: 'EXTRACT_DONE' });
}

function getAIName(ai) {
  switch (ai) {
    case 'gpt': return 'GPT';
    case 'gemini': return 'Gemini';
    case 'claude': return 'Claude';
    case 'grok': return 'Grok';
    default: return ai || 'AI';
  }
}

async function resolveExtractTargetTab(targetAI, grokMode = 'page') {
  if (targetAI === 'grok' && grokMode === 'inline') {
    const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeX = activeTabs.find(tab => /^https:\/\/x\.com\//.test(tab.url || ''));
    if (activeX?.id) return { tabId: activeX.id, label: 'Grok 頁內小視窗', justOpened: false };

    const xTabs = await chrome.tabs.query({ url: 'https://x.com/*' });
    if (xTabs[0]?.id) return { tabId: xTabs[0].id, label: 'Grok 頁內小視窗', justOpened: false };

    await chrome.tabs.create({ url: 'https://x.com/home' });
    return { error: '已開啟 x.com。請先手動展開 Grok 頁內小視窗，再重新執行。' };
  }

  const urls = {
    gpt: 'https://chatgpt.com/',
    gemini: 'https://gemini.google.com/',
    claude: 'https://claude.ai/',
    grok: 'https://x.com/i/grok',
  };
  const patterns = {
    gpt: 'https://chatgpt.com/*',
    gemini: 'https://gemini.google.com/*',
    claude: 'https://claude.ai/*',
    grok: 'https://x.com/i/grok*',
  };
  const currentWindowTabs = await chrome.tabs.query({ currentWindow: true, url: patterns[targetAI] || patterns.gpt });
  const existing = currentWindowTabs.length
    ? currentWindowTabs
    : await chrome.tabs.query({ url: patterns[targetAI] || patterns.gpt });
  if (existing[0]?.id) {
    return {
      tabId: existing[0].id,
      label: targetAI === 'grok' ? 'Grok 完整頁面' : getAIName(targetAI),
      justOpened: false,
    };
  }
  const tab = await chrome.tabs.create({ url: urls[targetAI] || urls.gpt });
  return {
    tabId: tab.id,
    label: targetAI === 'grok' ? 'Grok 完整頁面' : getAIName(targetAI),
    justOpened: true,
  };
}

async function sendExtractPromptToTarget(tabId, prompt, targetAI, grokMode = 'page') {
  if (targetAI === 'grok') {
    return execInTab(tabId, injectToGrok, [prompt, grokMode]);
  }
  return execInTab(tabId, injectToAIChat, [prompt, targetAI]);
}

// ── Grok injection ─────────────────────────────────────────────────────────────
function injectToGrok(text, mode = 'page') {
  return new Promise((resolve, reject) => {
    const isVisible = el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const hasPostComposerMarkers = el => {
      if (!el) return false;
      const marker = el.closest('[data-testid="tweetTextarea_0"], [data-testid="toolBar"], [data-testid="tweetButtonInline"], [data-testid="tweetButton"], [aria-label*="Post" i], [aria-label*="發佈" i], [aria-label*="貼文" i]');
      return !!marker;
    };
    const getInlineSignals = el => {
      const text = `${el.getAttribute?.('aria-label') || ''} ${el.textContent || ''}`.slice(0, 4000);
      const hasAskAnything = /ask anything/i.test(text);
      const hasHelpHeading = /how can i help you today\?/i.test(text);
      const hasCreateImages = /create images/i.test(text);
      const hasLatestNews = /latest news/i.test(text);
      const hasFastMode = /\bfast\b/i.test(text);
      const hasTextbox = !!el.querySelector('div[contenteditable="true"][role="textbox"], div[contenteditable="true"], textarea[placeholder], div[role="textbox"]');
      return { text, hasAskAnything, hasHelpHeading, hasCreateImages, hasLatestNews, hasFastMode, hasTextbox };
    };
    const getInlineGrokRoot = () => {
      const roots = [
        ...document.querySelectorAll('[role="dialog"], [aria-modal="true"], aside, section, div')
      ].filter(el => isVisible(el) && el.getBoundingClientRect().width >= 280 && el.getBoundingClientRect().height >= 220);
      const scored = roots.map(root => {
        const signals = getInlineSignals(root);
        const hasGrokWord = /grok/i.test(signals.text);
        const hasPostMarkers = !!root.querySelector('[data-testid="tweetTextarea_0"], [data-testid="tweetButtonInline"], [data-testid="tweetButton"]');
        let score = 0;
        if (hasGrokWord) score += 10;
        if (signals.hasHelpHeading) score += 16;
        if (signals.hasAskAnything) score += 14;
        if (signals.hasCreateImages) score += 10;
        if (signals.hasLatestNews) score += 8;
        if (signals.hasFastMode) score += 6;
        if (signals.hasTextbox) score += 4;
        if (hasPostMarkers) score -= 12;
        return { root, score };
      }).filter(x => x.score > 0);
      scored.sort((a, b) => b.score - a.score);
      return scored[0]?.root || null;
    };
    const pickBestInput = () => {
      const sels = [
        'div[contenteditable="true"][role="textbox"]',
        'div[contenteditable="true"]',
        'textarea[placeholder]',
        'div[role="textbox"]',
      ];
      const inlineRoot = mode === 'inline' ? getInlineGrokRoot() : null;
      if (mode === 'inline' && !inlineRoot) return null;
      const candidates = [];
      for (const s of sels) {
        const scope = inlineRoot || document;
        for (const c of scope.querySelectorAll(s)) {
          const r = c.getBoundingClientRect();
          if (r.width <= 0 || r.height <= 0) continue;
          if (hasPostComposerMarkers(c)) continue;
          let score = 0;
          if (inlineRoot && inlineRoot.contains(c)) score += 20;
          const ownText = `${c.getAttribute?.('aria-label') || ''} ${c.getAttribute?.('placeholder') || ''} ${c.textContent || ''}`;
          if (/ask anything/i.test(ownText)) score += 18;
          if (c.closest('[role="dialog"], [aria-modal="true"], aside')) score += 8;
          if (c.closest('main')) score += 4;
          if (location.pathname.includes('/i/grok')) score += mode === 'page' ? 4 : 0;
          score += Math.min(r.width / 100, 6);
          if (mode === 'inline' && c.closest('[role="dialog"], [aria-modal="true"], aside')) score += 10;
          if (mode === 'page' && c.closest('main')) score += 6;
          candidates.push({ el: c, score });
        }
      }
      if (!candidates.length) return null;
      candidates.sort((a, b) => b.score - a.score);
      return candidates[0].el;
    };

    // Prefer contenteditable textbox first (Grok uses a rich-text editor)
    const el = pickBestInput();
    if (!el) {
      reject(new Error(mode === 'inline'
        ? '找不到安全的 Grok 小視窗輸入框；已取消注入以避免誤貼到發文區'
        : '找不到 Grok 輸入框'));
      return;
    }

    // Store prompt so getGrokText can exclude it from response detection
    try { sessionStorage.setItem('_ntk_sent', text.slice(0, 300)); } catch(_) {}

    el.focus();
    if (el.tagName === 'TEXTAREA') {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(el, text);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // Use Selection API to explicitly select all content within the element,
      // then insertText — more reliable than execCommand('selectAll') in React editors.
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('insertText', false, text);
      // If execCommand returned false or el is still empty, fall back to innerText.
      if (!el.innerText.trim()) {
        el.innerText = text;
        range.selectNodeContents(el);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }

    setTimeout(() => {
      // 1. Try Enter key (works in some editors)
      ['keydown', 'keypress'].forEach(type =>
        el.dispatchEvent(new KeyboardEvent(type, { key: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }))
      );

      // 2. Try specific send-button selectors (X.com/Grok patterns)
      const sendSels = [
        '[data-testid="dmComposerSendButton"]',
        '[data-testid*="send" i]',
        '[aria-label*="send" i]',
        '[aria-label*="submit" i]',
        'button[type="submit"]',
      ];
      let sent = false;
      const inlineRoot = mode === 'inline' ? getInlineGrokRoot() : null;
      const scopedRoots = [
        inlineRoot,
        el.closest('[role="dialog"], [aria-modal="true"], aside, form, section, main'),
        document,
      ].filter(Boolean);
      for (const root of scopedRoots) {
        for (const sel of sendSels) {
          const btn = root.querySelector(sel);
          if (btn && !btn.disabled && btn.getAttribute('aria-disabled') !== 'true' && btn.getBoundingClientRect().width > 0) {
            if (mode === 'inline' && hasPostComposerMarkers(btn)) continue;
            btn.click(); sent = true; break;
          }
        }
        if (sent) break;
      }

      // 3. Fallback: traverse ancestors looking for an SVG icon button
      if (!sent) {
        let node = el;
        for (let depth = 0; depth < 8 && node; depth++) {
          node = node.parentElement;
          if (!node) break;
          const candidates = [...node.querySelectorAll('button')].filter(b =>
            b !== el && !b.disabled &&
            b.getAttribute('aria-disabled') !== 'true' &&
            b.getBoundingClientRect().width > 0 &&
            !(mode === 'inline' && hasPostComposerMarkers(b))
          );
          if (candidates.length) {
            const svgBtn = candidates.find(b => b.querySelector('svg'));
            (svgBtn || candidates[candidates.length - 1]).click();
            sent = true;
            break;
          }
        }
      }

      if (!sent && mode === 'inline') {
        reject(new Error('找不到 Grok 小視窗送出按鈕；已取消注入以避免誤送'));
        return;
      }

      resolve(true);
    }, 500);
  });
}

function injectToAIChat(text, ai) {
  return new Promise((resolve, reject) => {
    const config = {
      gpt: {
        input: ['#prompt-textarea', 'div[contenteditable="true"][data-id]', 'textarea', 'div[contenteditable="true"]'],
        submit: ['button[data-testid="send-button"]', 'button[aria-label*="Send"]', 'button[type="submit"]'],
      },
      gemini: {
        input: ['div[contenteditable="true"][aria-label]', 'rich-textarea div[contenteditable="true"]', 'div[contenteditable="true"]'],
        submit: ['button[aria-label*="Send"]', 'button[data-mat-icon-name="send"]', 'button[type="submit"]'],
      },
      claude: {
        input: ['div[contenteditable="true"][data-placeholder]', 'div[contenteditable="true"]', 'textarea'],
        submit: ['button[aria-label="Send Message"]', 'button[type="submit"]', 'button[aria-label*="Send"]'],
      },
    }[ai];

    if (!config) {
      reject(new Error(`不支援的 AI: ${ai}`));
      return;
    }

    const pickInput = () => {
      for (const sel of config.input) {
        for (const el of document.querySelectorAll(sel)) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) return el;
        }
      }
      return null;
    };

    const inputEl = pickInput();
    if (!inputEl) {
      reject(new Error(`找不到 ${ai} 輸入框`));
      return;
    }

    inputEl.focus();
    if (inputEl.tagName === 'TEXTAREA') {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(inputEl, text);
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(inputEl);
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('insertText', false, text);
      if (!String(inputEl.innerText || '').trim()) {
        inputEl.textContent = text;
      }
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    }

    setTimeout(() => {
      inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));

      for (const sel of config.submit) {
        const btn = document.querySelector(sel);
        if (btn && !btn.disabled && btn.getAttribute('aria-disabled') !== 'true') {
          btn.click();
          resolve(true);
          return;
        }
      }

      const generic = [...document.querySelectorAll('button')].find(btn => {
        if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') return false;
        const textBits = `${btn.textContent || ''} ${btn.getAttribute('aria-label') || ''}`;
        return /send|submit/i.test(textBits);
      });
      if (generic) {
        generic.click();
        resolve(true);
        return;
      }

      resolve(true);
    }, 500);
  });
}

async function pollGrok(tabId, timeout, sentText, grokMode = 'page') {
  const start = Date.now(); let last = '', stable = 0;
  // Brief initial wait for Grok to start generating
  await sleep(2000);
  while (Date.now() - start < timeout) {
    if (stopped) return null;
    await sleep(1500);
    const [r] = await chrome.scripting.executeScript({
      target: { tabId },
      func: getGrokText,
      args: [sentText || '', grokMode],
    });
    const t = (r?.result || '').trim();
    if (t.length > 10) {
      if (t === last) { stable++; if (stable >= 3) return t; }
      else { stable = 0; last = t; }
    }
  }
  return last || null;
}

function getGrokText(sentText, grokMode = 'page') {
  // sentText is passed directly from pollGrok; sessionStorage is kept as fallback
  const stored = (() => { try { return sessionStorage.getItem('_ntk_sent') || ''; } catch(_) { return ''; } })();
  const sent = sentText || stored;
  const mode = grokMode === 'inline' ? 'inline' : 'page';
  const norm = s => s.replace(/[\s​ ]+/g, ' ').trim();
  const looksLikeSent = t => {
    if (!sent) return false;
    const tN = norm(t), sN = norm(sent);
    return tN.slice(0, 100) === sN.slice(0, 100);
  };
  const isVisible = el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const getInlineGrokRoot = () => {
    const roots = [
      ...document.querySelectorAll('[role="dialog"], [aria-modal="true"], aside, section, div')
    ].filter(el => isVisible(el) && el.getBoundingClientRect().width >= 280 && el.getBoundingClientRect().height >= 220);
    const scored = roots.map(root => {
      const text = `${root.getAttribute('aria-label') || ''} ${root.textContent || ''}`.slice(0, 4000);
      const hasGrokWord = /grok/i.test(text);
      const hasAskAnything = /ask anything/i.test(text);
      const hasHelpHeading = /how can i help you today\?/i.test(text);
      const hasCreateImages = /create images/i.test(text);
      const hasLatestNews = /latest news/i.test(text);
      const hasFastMode = /\bfast\b/i.test(text);
      const hasPostMarkers = !!root.querySelector('[data-testid="tweetTextarea_0"], [data-testid="tweetButtonInline"], [data-testid="tweetButton"]');
      let score = 0;
      if (hasGrokWord) score += 10;
      if (hasHelpHeading) score += 16;
      if (hasAskAnything) score += 14;
      if (hasCreateImages) score += 10;
      if (hasLatestNews) score += 8;
      if (hasFastMode) score += 6;
      if (hasPostMarkers) score -= 12;
      return { root, score };
    }).filter(x => x.score > 0);
    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.root || null;
  };
  const scope = mode === 'inline' ? (getInlineGrokRoot() || document) : document;

  // Priority selectors for Grok/X response containers
  const primarySels = [
    '[data-testid="messageText"]',
    'div[class*="GrokMessage"]',
    '[data-testid="tweetText"]',
  ];
  for (const s of primarySels) {
    const all = [...scope.querySelectorAll(s)].filter(e => {
      const t = (e.innerText || '').trim();
      return t.length > 10 && !looksLikeSent(t);
    });
    if (all.length) return all[all.length - 1].innerText || '';
  }

  // Article-based: last [lang] element inside an article that isn't the user's prompt
  for (const s of ['[role="article"] [lang]', 'article [lang]']) {
    const all = [...scope.querySelectorAll(s)];
    for (let i = all.length - 1; i >= 0; i--) {
      const t = (all[i].innerText || '').trim();
      if (t.length > 10 && !looksLikeSent(t)) return t;
    }
  }

  // Fallback: largest non-interactive text block that isn't the user's own prompt
  const root = mode === 'inline' ? scope : (document.querySelector('main') || document.body);
  const blocks = [...root.querySelectorAll('p, div')].filter(e => {
    if (e.querySelector('input, textarea, button, [role="button"]')) return false;
    const t = (e.innerText || '').trim();
    return t.length > 50 && !looksLikeSent(t);
  });
  return blocks.reduce((best, e) => {
    const t = e.innerText || '';
    return t.length > best.length ? t : best;
  }, '');
}

function getGrokAssistantSnapshot(sentText, grokMode = 'page') {
  const stored = (() => { try { return sessionStorage.getItem('_ntk_sent') || ''; } catch(_) { return ''; } })();
  const sent = sentText || stored;
  const mode = grokMode === 'inline' ? 'inline' : 'page';
  const norm = s => String(s || '').replace(/[\s​ ]+/g, ' ').trim();
  const looksLikeSent = t => {
    if (!sent) return false;
    const tN = norm(t), sN = norm(sent);
    return tN.slice(0, 100) === sN.slice(0, 100);
  };
  const isVisible = el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const getInlineGrokRoot = () => {
    const roots = [
      ...document.querySelectorAll('[role="dialog"], [aria-modal="true"], aside, section, div')
    ].filter(el => isVisible(el) && el.getBoundingClientRect().width >= 280 && el.getBoundingClientRect().height >= 220);
    const scored = roots.map(root => {
      const text = `${root.getAttribute('aria-label') || ''} ${root.textContent || ''}`.slice(0, 4000);
      const hasGrokWord = /grok/i.test(text);
      const hasAskAnything = /ask anything/i.test(text);
      const hasHelpHeading = /how can i help you today\?/i.test(text);
      const hasCreateImages = /create images/i.test(text);
      const hasLatestNews = /latest news/i.test(text);
      const hasFastMode = /\bfast\b/i.test(text);
      const hasPostMarkers = !!root.querySelector('[data-testid="tweetTextarea_0"], [data-testid="tweetButtonInline"], [data-testid="tweetButton"]');
      let score = 0;
      if (hasGrokWord) score += 10;
      if (hasHelpHeading) score += 16;
      if (hasAskAnything) score += 14;
      if (hasCreateImages) score += 10;
      if (hasLatestNews) score += 8;
      if (hasFastMode) score += 6;
      if (hasPostMarkers) score -= 12;
      return { root, score };
    }).filter(x => x.score > 0);
    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.root || null;
  };
  const scope = mode === 'inline' ? (getInlineGrokRoot() || document) : document;

  const selectors = [
    '[data-testid="messageText"]',
    'div[class*="GrokMessage"]',
    '[data-testid="tweetText"]',
    '[role="article"] [lang]',
    'article [lang]',
  ];
  const rows = [];

  for (const selector of selectors) {
    for (const el of scope.querySelectorAll(selector)) {
      if (!isVisible(el)) continue;
      if (el.closest('[role="textbox"], textarea, [contenteditable="true"]')) continue;
      const text = (el.innerText || '').trim();
      if (text.length <= 10 || looksLikeSent(text)) continue;
      rows.push({ selector, text });
    }
  }

  const deduped = [];
  const seen = new Set();
  for (const row of rows) {
    const key = norm(row.text);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }

  const last = deduped[deduped.length - 1] || null;
  return {
    count: deduped.length,
    lastText: last?.text || '',
    lastSelector: last?.selector || '',
  };
}

async function pollGrokForNewAssistantStable(tabId, timeout, baseline, sentText, grokMode = 'page') {
  const start = Date.now();
  const base = baseline || { count: 0, lastText: '' };
  let polls = 0;
  let foundNew = false;
  let stableTicks = 0;
  let lastCandidate = '';

  console.log('[BG] CF Grok conservative poll: baseline count=', base.count, '| baseline chars=', base.lastText?.length ?? 0);

  while (Date.now() - start < timeout) {
    if (stopped) return null;
    await sleep(1000);
    polls++;

    const [snapshotResult] = await chrome.scripting.executeScript({
      target: { tabId },
      func: getGrokAssistantSnapshot,
      args: [sentText || '', grokMode],
    });
    const snap = snapshotResult?.result || { count: 0, lastText: '', lastSelector: '' };
    const chars = snap.lastText?.length ?? 0;
    const hasNewReply = !!snap.lastText && chars > 10 && (snap.count > base.count || snap.lastText !== base.lastText);

    console.log(`[BG] CF Grok poll #${polls}: foundNew=${hasNewReply} count=${snap.count} chars=${chars} selector=${snap.lastSelector || '(none)'}`);

    if (!hasNewReply) continue;
    if (!foundNew) {
      foundNew = true;
      logD('Grok 已出現新回覆，確認內容穩定中…', 'info');
    }

    if (snap.lastText === lastCandidate) stableTicks++;
    else {
      lastCandidate = snap.lastText;
      stableTicks = 0;
    }

    if (stableTicks >= 2) {
      console.log(`[BG] CF Grok poll stable: polls=${polls} chars=${chars} stableTicks=${stableTicks}`);
      logD(`Grok 回覆穩定，準備儲存（${chars} 字）`, 'info');
      return snap.lastText;
    }
  }

  console.warn(`[BG] CF Grok poll timeout after ${polls} polls`);
  logD(`Grok 輪詢逾時（${polls} 次）`, 'error');
  return null;
}

// ════════════════════════════════════════════════════════════
//  AI STRUCTURING (Tab A: Grok → AI Chat)
// ════════════════════════════════════════════════════════════
async function runAIStructure({ rawResponses, template, targetAI, fullAuto }) {
  const defaultTpl = `以下是從 Grok 依序取得的問答，請整理成結構化 JSON 陣列，每個物件 key 用英文，值用繁體中文。只輸出純 JSON，不要任何說明或 markdown。\n\n{{responses}}`;
  const tpl = template || defaultTpl;
  const formatted = rawResponses.map(r => `=== #${r.index} ===\n問：${r.prompt}\n答：${r.response}`).join('\n\n');
  const prompt = tpl.replace('{{responses}}', formatted);

  await sendToAI(prompt, targetAI || 'gpt', fullAuto, 'STRUCTURE');
}

// ════════════════════════════════════════════════════════════
//  TAB B — DISTILL (long-form → skill.md / wiki.md)
// ════════════════════════════════════════════════════════════
async function handleDistill({ content, fmt, targetAI, grokMode, wikiTpl, fullAuto, source, autoSave }) {
  stopped = false;
  console.log('[BG] handleDistill received: targetAI=', targetAI, '| fullAuto=', fullAuto, '| source=', source || 'distill', '| autoSave=', autoSave, '| contentLen=', content?.length, '| hasTpl=', !!wikiTpl);
  const defaultWiki = `請將以下原文整理成 Wikipedia 條目風格的 markdown：包含簡介段落、## 背景、## 主要內容（子節）、## 相關概念、## 參考來源。只輸出 markdown。\n\n{{content}}`;
  const tpl = wikiTpl || defaultWiki;
  // If template has no {{content}} placeholder, append the content after the prompt
  const prompt = tpl.includes('{{content}}')
    ? tpl.replace('{{content}}', content)
    : tpl + '\n\n' + content;
  const tag = `DISTILL_${(fmt || 'wiki').toUpperCase()}`;
  console.log('[BG] handleDistill: tag=', tag, '| finalPromptLen=', prompt.length);
  logD(`整理 ${fmt || 'wiki'}.md…`, 'info');
  if (source === 'flow' && autoSave === false) {
    await handleDistillSendOnly(prompt, targetAI, grokMode);
    return;
  }
  // Grok uses direct executeScript injection (same mechanism as ETL).
  // cs_ai.js is not registered for x.com, so the normal sendToAI storage approach won't work.
  if (targetAI === 'grok') {
    await handleDistillGrok(prompt, tag, fullAuto, {
      grokMode: grokMode === 'inline' ? 'inline' : 'page',
      conservativePolling: source === 'flow',
      autoSaveOverride: typeof autoSave === 'boolean' ? autoSave : undefined,
    });
  } else {
    await sendToAI(prompt, targetAI, fullAuto, tag, {
      autoSaveOverride: typeof autoSave === 'boolean' ? autoSave : undefined,
    });
  }
}

async function handleVerifyWiki({ content, targetAI, wikiTpl, fullAuto }) {
  stopped = false;
  const defaultWiki  = `請將以下原文整理成 Wikipedia 條目風格的 markdown：包含簡介段落、## 背景、## 主要內容（子節）、## 相關概念、## 參考來源，並在最後新增 ## 真實性檢查，指出本文中可能不正確、錯誤或可疑的資訊。只輸出 markdown。\n\n{{content}}`;
  const tpl = wikiTpl || defaultWiki;
  const prompt = tpl.replace('{{content}}', content);

  logD('開始真實性檢查並生成 wiki.md…', 'info');
  await sendToAI(prompt, targetAI, fullAuto, 'VERIFY_WIKI');
}

async function handleDistillSendOnly(prompt, targetAI, grokMode = 'page') {
  const ai = ['gpt', 'gemini', 'claude', 'grok'].includes(targetAI) ? targetAI : 'gpt';
  const mode = grokMode === 'inline' ? 'inline' : 'page';
  console.log('[BG] handleDistillSendOnly', { ai, mode, promptLen: prompt.length });
  const target = await resolveExtractTargetTab(ai, mode);

  if (!target?.tabId) {
    const text = target?.error || (
      ai === 'grok' && mode === 'inline'
        ? '找不到可用的 X 頁面。請先在 x.com 開啟 Grok 小視窗後再執行。'
        : `找不到可用的 ${getAIName(ai)} 頁面。`
    );
    bcast({ type: 'ERROR', text });
    return;
  }

  try {
    await focusTabInWindow({ id: target.tabId, windowId: target.windowId });
  } catch (_) {}
  await sleep(target.justOpened ? 2500 : 700);

  try {
    await sendExtractPromptToTarget(target.tabId, prompt, ai, mode);
  } catch (e) {
    console.error('[BG] handleDistillSendOnly injection failed:', e.message);
    bcast({ type: 'ERROR', text: `${getAIName(ai)} 送出失敗: ${e.message}` });
    return;
  }

  logD(`已送出至 ${target.label || getAIName(ai)}，請等待回覆後手動截取`, 'success');
  bcast({ type: 'DISTILL_DONE', sentOnly: true, targetAI: ai, grokMode: mode, targetTabId: target.tabId, results: [] });
}

// ── Grok Distill: direct injection via executeScript (cs_ai.js is not on x.com) ──
async function handleDistillGrok(prompt, tag, fullAuto, opts = {}) {
  const conservativePolling = opts.conservativePolling === true;
  const grokMode = opts.grokMode === 'inline' ? 'inline' : 'page';
  const autoSaveOverride = opts.autoSaveOverride !== false;
  logD(`Grok Distill：準備開啟並注入（${grokMode}）…`, 'info');
  console.log('[BG] handleDistillGrok: fullAuto=', fullAuto, '| autoSaveOverride=', autoSaveOverride, '| promptLen=', prompt.length, '| conservativePolling=', conservativePolling, '| grokMode=', grokMode);

  if (!fullAuto) {
    chrome.tabs.create({ url: grokMode === 'inline' ? 'https://x.com/home' : 'https://x.com/i/grok' });
    logD(`半自動：已開啟 ${grokMode === 'inline' ? 'X 頁面' : 'Grok'}，請手動貼入並等待回應`, 'warn');
    return;
  }

  let grokTab;
  if (grokMode === 'inline') {
    const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
    grokTab = activeTabs.find(tab => /^https:\/\/x\.com\//.test(tab.url || ''));
    if (!grokTab) {
      const xTabs = await chrome.tabs.query({ url: 'https://x.com/*' });
      grokTab = xTabs[0];
    }
    if (!grokTab) {
      grokTab = await chrome.tabs.create({ url: 'https://x.com/home' });
      logD('已開啟 x.com。請先手動展開 Grok inline 小視窗後再重試。', 'warn');
      return;
    }
    await chrome.tabs.update(grokTab.id, { active: true });
    console.log('[BG] handleDistillGrok: using inline x.com tab', grokTab.id);
  } else {
    const currentWindowTabs = await chrome.tabs.query({ currentWindow: true, url: 'https://x.com/i/grok*' });
    const existing = currentWindowTabs.length
      ? currentWindowTabs
      : await chrome.tabs.query({ url: 'https://x.com/i/grok*' });
    if (existing.length) {
      grokTab = existing[0];
      await focusTabInWindow(grokTab);
      await chrome.tabs.reload(grokTab.id);
      console.log('[BG] handleDistillGrok: reloading existing tab', grokTab.id);
    } else {
      grokTab = await chrome.tabs.create({ url: 'https://x.com/i/grok' });
      console.log('[BG] handleDistillGrok: opened new tab', grokTab.id);
    }
  }

  logD('等待 Grok 頁面載入 (3s)…', 'info');
  await sleep(3000);

  let baseline = null;
  if (conservativePolling) {
    const [snapshotResult] = await chrome.scripting.executeScript({
      target: { tabId: grokTab.id },
      func: getGrokAssistantSnapshot,
      args: ['', grokMode],
    });
    baseline = snapshotResult?.result || { count: 0, lastText: '', lastSelector: '' };
    console.log('[BG] handleDistillGrok: baseline assistant snapshot count =', baseline.count, '| chars =', baseline.lastText?.length ?? 0, '| selector =', baseline.lastSelector || '(none)');
  }

  try {
    console.log('[BG] handleDistillGrok: injecting prompt into tab', grokTab.id);
    await execInTab(grokTab.id, injectToGrok, [prompt, grokMode]);
    logD(`Grok 注入完成，等待回應 (max ${conservativePolling ? '60' : '35'}s)…`, 'info');
    console.log('[BG] handleDistillGrok: injection done, polling…');
  } catch(e) {
    console.error('[BG] handleDistillGrok: injection failed:', e.message);
    bcast({ type: 'ERROR', text: 'Grok 注入失敗: ' + e.message });
    return;
  }

  const response = conservativePolling
    ? await pollGrokForNewAssistantStable(grokTab.id, 60000, baseline, prompt, grokMode)
    : await pollGrok(grokTab.id, 35000, prompt, grokMode);
  console.log('[BG] handleDistillGrok: pollGrok result length =', response?.length ?? 0);

  if (!response) {
    bcast({ type: 'ERROR', text: `Grok Distill 逾時 (${conservativePolling ? '60' : '35'}s)` });
    return;
  }

  logD(`Grok 回應 ${response.length} 字，整理完成`, 'success');

  const fmt  = tag.replace('DISTILL_', '').toLowerCase();
  const ts   = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  const name = `${fmt}_${ts}.md`;
  const d    = await chrome.storage.local.get(['library', 'autoDownload', 'distillFolder', 'draftFolder']);
  const lib  = d.library || [];
  const shouldAutoSave = autoSaveOverride;
  console.log('[BG] handleDistillGrok: finalize', {
    tag,
    fmt,
    name,
    source: 'grok-direct',
    shouldAutoSave,
    autoDownload: d.autoDownload,
    distillFolder: d.distillFolder || '',
    draftFolder: d.draftFolder || '',
    responseLen: response.length,
  });
  if (shouldAutoSave) {
    if (d.autoDownload) {
      console.warn('[BG] auto download trigger', {
        tag,
        name,
        source: 'handleDistillGrok',
        folder: d.distillFolder || d.draftFolder || '',
        shouldAutoSave,
        autoDownload: d.autoDownload,
      });
      logD(`診斷：準備自動下載 ${name}（autoSave=${shouldAutoSave}, autoDownload=${d.autoDownload}）`, 'warn');
      await downloadMd(name, response, d.distillFolder || d.draftFolder || '');
    } else {
      console.log('[BG] autoSave enabled, but autoDownload disabled', { tag, name });
      logD(`診斷：已自動存檔但未下載 ${name}（autoDownload=false）`, 'info');
    }
    lib.unshift({ name, fmt, content: response, chars: response.length, date: new Date().toLocaleDateString('zh-TW') });
    await chrome.storage.local.set({ library: lib });
  } else {
    console.log('[BG] autoSave disabled; skip library save and download', { tag, name, source: 'handleDistillGrok' });
    logD(`診斷：此次未自動存檔 ${name}（autoSave=false）`, 'info');
  }
  bcast({ type: 'DISTILL_DONE', results: [{ name, content: response, fmt }] });
}

// ── Pending distill results storage ──────────────────────────────────────────
const pendingDistill = {};

async function sendToAI(prompt, targetAI, fullAuto, tag, meta = {}) {
  console.log('[BG] sendToAI: tag=', tag, '| ai=', targetAI, '| fullAuto=', fullAuto, '| promptLen=', prompt.length);
  // Store prompt for content script
  await chrome.storage.local.set({ [`ai_prompt_${tag}`]: prompt, [`ai_state_${tag}`]: 'waiting' });

  const urls = {
    gpt:    'https://chatgpt.com/',
    gemini: 'https://gemini.google.com/',
    claude: 'https://claude.ai/',
    grok:   'https://x.com/i/grok',
  };
  const patterns = {
    gpt:    'https://chatgpt.com/*',
    gemini: 'https://gemini.google.com/*',
    claude: 'https://claude.ai/*',
    grok:   'https://x.com/i/grok*',
  };

  const url = urls[targetAI] || urls.gpt;
  const pattern = patterns[targetAI] || patterns.gpt;

  if (!fullAuto) {
    pendingDistill[tag] = { meta };
    // Semi-auto: open tab, user pastes manually; content script listens for response
    chrome.tabs.create({ url });
    logE('半自動：請手動貼入並等待回應', 'warn');
    return null;
  }

  // Full-auto
  const currentWindowTabs = await chrome.tabs.query({ currentWindow: true, url: pattern });
  const existing = currentWindowTabs.length
    ? currentWindowTabs
    : await chrome.tabs.query({ url: pattern });
  let aiTab;
  if (existing.length) {
    aiTab = existing[0];
    await focusTabInWindow(aiTab);
    await chrome.tabs.reload(aiTab.id);
  } else {
    aiTab = await chrome.tabs.create({ url });
  }
  await chrome.storage.local.set({ [`ai_tab_${tag}`]: aiTab.id });

  // Content script will inject and capture; we wait for AI_RESPONSE message
  return new Promise(resolve => {
    pendingDistill[tag] = { resolve, meta };
  });
}

// ── Called by content script (cs_ai.js) when AI responds ─────────────────────
async function handleAIResponse({ tag, text }) {
  logD(`AI 回應已收到（${tag}）`, 'info');

  if (tag === 'STRUCTURE') {
    try {
      const clean = text.replace(/```json\s*/g,'').replace(/```\s*/g,'').trim();
      const parsed = JSON.parse(clean);
      const structured = normalise(parsed);
      bcast({ type: 'AI_STRUCTURE_DONE', structured, rawText: text });
    } catch(e) {
      bcast({ type: 'ERROR', text: 'JSON 解析失敗: ' + e.message });
    }
    return;
  }

  if (tag.startsWith('DISTILL_') || tag === 'VERIFY_WIKI') {
    const fmt = tag === 'VERIFY_WIKI' ? 'wiki' : tag.replace('DISTILL_','').toLowerCase();
    const ts  = new Date().toISOString().slice(0,16).replace(/[:T]/g,'-');
    const name = `${fmt}_${ts}.md`;

    const d = await chrome.storage.local.get(['library','autoDownload','distillFolder','draftFolder']);
    const lib = d.library || [];
    const pending = pendingDistill[tag];
    const shouldAutoSave = pending?.meta?.autoSaveOverride !== false;
    console.log('[BG] handleAIResponse: finalize', {
      tag,
      fmt,
      name,
      source: 'cs_ai',
      shouldAutoSave,
      autoDownload: d.autoDownload,
      distillFolder: d.distillFolder || '',
      draftFolder: d.draftFolder || '',
      textLen: text.length,
    });

    if (shouldAutoSave) {
      if (d.autoDownload) {
        console.warn('[BG] auto download trigger', {
          tag,
          name,
          source: 'handleAIResponse',
          folder: d.distillFolder || d.draftFolder || '',
          shouldAutoSave,
          autoDownload: d.autoDownload,
        });
        logD(`診斷：準備自動下載 ${name}（autoSave=${shouldAutoSave}, autoDownload=${d.autoDownload}）`, 'warn');
        await downloadMd(name, text, d.distillFolder || d.draftFolder || '');
      } else {
        console.log('[BG] autoSave enabled, but autoDownload disabled', { tag, name });
        logD(`診斷：已自動存檔但未下載 ${name}（autoDownload=false）`, 'info');
      }
      lib.unshift({ name, fmt, content: text, chars: text.length, date: new Date().toLocaleDateString('zh-TW') });
      await chrome.storage.local.set({ library: lib });
    } else {
      console.log('[BG] autoSave disabled; skip library save and download', { tag, name, source: 'handleAIResponse' });
      logD(`診斷：此次未自動存檔 ${name}（autoSave=false）`, 'info');
    }

    bcast({ type: 'DISTILL_DONE', results: [{ name, content: text, fmt }] });

    if (pending?.resolve) {
      pending.resolve({ name, content: text });
      delete pendingDistill[tag];
    }
  }
}

// ════════════════════════════════════════════════════════════
//  .md DOWNLOAD
// ════════════════════════════════════════════════════════════
async function downloadMd(name, content, folder = '') {
  return downloadText(name, content, 'text/markdown;charset=utf-8', folder);
}

async function downloadText(name, content, mime = 'text/plain;charset=utf-8', folder = '', saveAs = false) {
  const filename = folder
    ? folder.replace(/\\/g, '/').replace(/\/$/, '') + '/' + name
    : name;
  const url = `data:${mime},${encodeURIComponent(content)}`;
  console.info('[BG] chrome.downloads.download', {
    name,
    filename,
    mime,
    saveAs,
    contentLen: String(content || '').length,
  });
  await chrome.downloads.download({ url, filename, saveAs });
}

async function downloadMdByName(name) {
  const d = await chrome.storage.local.get('library');
  const lib = d.library || [];
  const doc = lib.find(x => x.name === name);
  if (doc) await downloadMd(doc.name, doc.content);
}

// ════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════
function buildRawMd(responses, ts) {
  return [`# Grok 萃取紀錄\n> ${ts}\n`, ...responses.map(r =>
    `## #${r.index}\n${r.response}\n\n---`)].join('\n');
}

function normalise(parsed) {
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  const cols = [...new Set(rows.flatMap(r => Object.keys(r)))];
  return { columns: cols, rows };
}

async function execInTab(tabId, fn, args=[]) {
  return chrome.scripting.executeScript({ target: { tabId }, func: fn, args });
}

async function focusTabInWindow(tab) {
  if (!tab?.id) return;
  if (typeof tab.windowId === 'number') {
    try { await chrome.windows.update(tab.windowId, { focused: true }); } catch (_) {}
  }
  try { await chrome.tabs.update(tab.id, { active: true }); } catch (_) {}
}

function bcast(msg) { chrome.runtime.sendMessage(msg).catch(() => {}); }
function logE(t,l)  { bcast({ type: 'LOG_EXTRACT', text: t, level: l }); }
function logD(t,l)  { bcast({ type: 'LOG_DISTILL', text: t, level: l }); }
function sleep(ms)  { return new Promise(r => setTimeout(r, ms)); }
function enc(s)     { return encodeURIComponent(s); }
