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
    case 'DOWNLOAD_TEXT':       downloadText(msg.name, msg.content, msg.mime || 'text/plain;charset=utf-8', msg.folder || ''); break;
    case 'DOWNLOAD_MD_BY_NAME': downloadMdByName(msg.name); break;
    case 'AI_RESPONSE':         handleAIResponse(msg); break;
    case 'STOP':                stopped = true; break;
  }
});

// ════════════════════════════════════════════════════════════
//  TAB A — GROK EXTRACT
// ════════════════════════════════════════════════════════════
async function handleExtract({ tabId, prompts, delaySeconds, targetAI }) {
  stopped = false;
  const responses = [];

  // Bring Grok tab to foreground so user can see the interaction,
  // then wait for the tab to finish re-rendering before injecting.
  try { await chrome.tabs.update(tabId, { active: true }); } catch(_) {}
  await sleep(700);

  // Remove stale ai_prompt_*/ai_state_*/ai_tab_* keys to prevent cs_ai.js
  // from auto-injecting leftover jobs from a previous session
  const allStorage = await chrome.storage.local.get(null);
  const staleKeys = Object.keys(allStorage).filter(k =>
    k.startsWith('ai_prompt_') || k.startsWith('ai_state_') || k.startsWith('ai_tab_')
  );
  if (staleKeys.length) await chrome.storage.local.remove(staleKeys);

  logE(`共 ${prompts.length} 個 Prompt，等待 ${delaySeconds}s/輪`, 'info');

  for (let i = 0; i < prompts.length; i++) {
    if (stopped) { logE('已中止', 'warn'); return; }

    bcast({ type: 'PROGRESS', current: i, total: prompts.length, promptIndex: i, status: 'running' });
    logE(`送出 #${i+1}…`, 'info');

    try {
      await execInTab(tabId, injectToGrok, [prompts[i]]);
      logE(`等待 Grok 回應…`, 'info');
      const resp = await pollGrok(tabId, delaySeconds * 1000, prompts[i]);
      if (!resp) throw new Error('逾時');
      responses.push({ index: i+1, prompt: prompts[i], response: resp });
      bcast({ type: 'PROGRESS', current: i+1, total: prompts.length, promptIndex: i, status: 'done' });
      logE(`✓ #${i+1} 完成`, 'success');
    } catch(e) {
      bcast({ type: 'PROGRESS', current: i+1, total: prompts.length, promptIndex: i, status: 'error' });
      logE(`✗ #${i+1}: ${e.message}`, 'error');
      responses.push({ index: i+1, prompt: prompts[i], response: '[ERROR] ' + e.message });
    }
    if (i < prompts.length - 1 && !stopped) await sleep(2000);
  }

  const successfulResponses = responses.filter(r => !String(r.response || '').startsWith('[ERROR]'));
  if (!successfulResponses.length) {
    bcast({ type: 'ERROR', text: 'Grok 擷取沒有成功回傳內容，已略過自動存檔。請確認 Grok chat 頁面已載入並可輸入。' });
    return;
  }

  await chrome.storage.local.set({ rawResponses: responses });

  const ts   = new Date().toISOString().slice(0,16).replace(/[:T]/g,'-');
  const name = `grok_raw_${ts}.md`;
  const md   = buildRawMd(responses, ts);
  await chrome.storage.local.set({ lastRawMd: md, lastRawMdName: name });

  bcast({ type: 'EXTRACT_DONE', responses });
}

// ── Grok injection ─────────────────────────────────────────────────────────────
function injectToGrok(text) {
  return new Promise((resolve, reject) => {
    // Prefer contenteditable textbox first (Grok uses a rich-text editor)
    const sels = [
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]',
      'textarea[placeholder]',
      'div[role="textbox"]',
    ];
    let el = null;
    for (const s of sels) {
      for (const c of document.querySelectorAll(s)) {
        const r = c.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) { el = c; break; }
      }
      if (el) break;
    }
    if (!el) { reject(new Error('找不到 Grok 輸入框')); return; }

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
      for (const sel of sendSels) {
        const btn = document.querySelector(sel);
        if (btn && !btn.disabled && btn.getAttribute('aria-disabled') !== 'true' && btn.getBoundingClientRect().width > 0) {
          btn.click(); sent = true; break;
        }
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
            b.getBoundingClientRect().width > 0
          );
          if (candidates.length) {
            const svgBtn = candidates.find(b => b.querySelector('svg'));
            (svgBtn || candidates[candidates.length - 1]).click();
            break;
          }
        }
      }

      resolve(true);
    }, 500);
  });
}

async function pollGrok(tabId, timeout, sentText) {
  const start = Date.now(); let last = '', stable = 0;
  // Brief initial wait for Grok to start generating
  await sleep(2000);
  while (Date.now() - start < timeout) {
    if (stopped) return null;
    await sleep(1500);
    const [r] = await chrome.scripting.executeScript({
      target: { tabId },
      func: getGrokText,
      args: [sentText || ''],
    });
    const t = (r?.result || '').trim();
    if (t.length > 10) {
      if (t === last) { stable++; if (stable >= 3) return t; }
      else { stable = 0; last = t; }
    }
  }
  return last || null;
}

function getGrokText(sentText) {
  // sentText is passed directly from pollGrok; sessionStorage is kept as fallback
  const stored = (() => { try { return sessionStorage.getItem('_ntk_sent') || ''; } catch(_) { return ''; } })();
  const sent = sentText || stored;
  const norm = s => s.replace(/[\s​ ]+/g, ' ').trim();
  const looksLikeSent = t => {
    if (!sent) return false;
    const tN = norm(t), sN = norm(sent);
    return tN.slice(0, 100) === sN.slice(0, 100);
  };

  // Priority selectors for Grok/X response containers
  const primarySels = [
    '[data-testid="messageText"]',
    'div[class*="GrokMessage"]',
    '[data-testid="tweetText"]',
  ];
  for (const s of primarySels) {
    const all = [...document.querySelectorAll(s)].filter(e => {
      const t = (e.innerText || '').trim();
      return t.length > 10 && !looksLikeSent(t);
    });
    if (all.length) return all[all.length - 1].innerText || '';
  }

  // Article-based: last [lang] element inside an article that isn't the user's prompt
  for (const s of ['[role="article"] [lang]', 'article [lang]']) {
    const all = [...document.querySelectorAll(s)];
    for (let i = all.length - 1; i >= 0; i--) {
      const t = (all[i].innerText || '').trim();
      if (t.length > 10 && !looksLikeSent(t)) return t;
    }
  }

  // Fallback: largest non-interactive text block that isn't the user's own prompt
  const root = document.querySelector('main') || document.body;
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

function getGrokAssistantSnapshot(sentText) {
  const stored = (() => { try { return sessionStorage.getItem('_ntk_sent') || ''; } catch(_) { return ''; } })();
  const sent = sentText || stored;
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

  const selectors = [
    '[data-testid="messageText"]',
    'div[class*="GrokMessage"]',
    '[data-testid="tweetText"]',
    '[role="article"] [lang]',
    'article [lang]',
  ];
  const rows = [];

  for (const selector of selectors) {
    for (const el of document.querySelectorAll(selector)) {
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

async function pollGrokForNewAssistantStable(tabId, timeout, baseline, sentText) {
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
      args: [sentText || ''],
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
async function handleDistill({ content, fmt, targetAI, wikiTpl, fullAuto, source, autoSave }) {
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
  // Grok uses direct executeScript injection (same mechanism as ETL).
  // cs_ai.js is not registered for x.com, so the normal sendToAI storage approach won't work.
  if (targetAI === 'grok') {
    await handleDistillGrok(prompt, tag, fullAuto, {
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

// ── Grok Distill: direct injection via executeScript (cs_ai.js is not on x.com) ──
async function handleDistillGrok(prompt, tag, fullAuto, opts = {}) {
  const conservativePolling = opts.conservativePolling === true;
  const autoSaveOverride = opts.autoSaveOverride !== false;
  logD('Grok Distill：準備開啟並注入…', 'info');
  console.log('[BG] handleDistillGrok: fullAuto=', fullAuto, '| autoSaveOverride=', autoSaveOverride, '| promptLen=', prompt.length, '| conservativePolling=', conservativePolling);

  if (!fullAuto) {
    chrome.tabs.create({ url: 'https://x.com/i/grok' });
    logD('半自動：已開啟 Grok，請手動貼入並等待回應', 'warn');
    return;
  }

  const existing = await chrome.tabs.query({ url: 'https://x.com/i/grok*' });
  let grokTab;
  if (existing.length) {
    grokTab = existing[0];
    await chrome.tabs.update(grokTab.id, { active: true });
    await chrome.tabs.reload(grokTab.id);
    console.log('[BG] handleDistillGrok: reloading existing tab', grokTab.id);
  } else {
    grokTab = await chrome.tabs.create({ url: 'https://x.com/i/grok' });
    console.log('[BG] handleDistillGrok: opened new tab', grokTab.id);
  }

  logD('等待 Grok 頁面載入 (3s)…', 'info');
  await sleep(3000);

  let baseline = null;
  if (conservativePolling) {
    const [snapshotResult] = await chrome.scripting.executeScript({
      target: { tabId: grokTab.id },
      func: getGrokAssistantSnapshot,
      args: [''],
    });
    baseline = snapshotResult?.result || { count: 0, lastText: '', lastSelector: '' };
    console.log('[BG] handleDistillGrok: baseline assistant snapshot count =', baseline.count, '| chars =', baseline.lastText?.length ?? 0, '| selector =', baseline.lastSelector || '(none)');
  }

  try {
    console.log('[BG] handleDistillGrok: injecting prompt into tab', grokTab.id);
    await execInTab(grokTab.id, injectToGrok, [prompt]);
    logD(`Grok 注入完成，等待回應 (max ${conservativePolling ? '60' : '35'}s)…`, 'info');
    console.log('[BG] handleDistillGrok: injection done, polling…');
  } catch(e) {
    console.error('[BG] handleDistillGrok: injection failed:', e.message);
    bcast({ type: 'ERROR', text: 'Grok 注入失敗: ' + e.message });
    return;
  }

  const response = conservativePolling
    ? await pollGrokForNewAssistantStable(grokTab.id, 60000, baseline, prompt)
    : await pollGrok(grokTab.id, 35000, prompt);
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
  if (shouldAutoSave) {
    if (d.autoDownload) await downloadMd(name, response, d.distillFolder || d.draftFolder || '');
    lib.unshift({ name, fmt, content: response, chars: response.length, date: new Date().toLocaleDateString('zh-TW') });
    await chrome.storage.local.set({ library: lib });
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
  const existing = await chrome.tabs.query({ url: pattern });
  let aiTab;
  if (existing.length) {
    aiTab = existing[0];
    await chrome.tabs.update(aiTab.id, { active: true });
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

    if (shouldAutoSave) {
      if (d.autoDownload) await downloadMd(name, text, d.distillFolder || d.draftFolder || '');
      lib.unshift({ name, fmt, content: text, chars: text.length, date: new Date().toLocaleDateString('zh-TW') });
      await chrome.storage.local.set({ library: lib });
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

async function downloadText(name, content, mime = 'text/plain;charset=utf-8', folder = '') {
  const filename = folder
    ? folder.replace(/\\/g, '/').replace(/\/$/, '') + '/' + name
    : name;
  const url = `data:${mime},${encodeURIComponent(content)}`;
  await chrome.downloads.download({ url, filename, saveAs: false });
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

function bcast(msg) { chrome.runtime.sendMessage(msg).catch(() => {}); }
function logE(t,l)  { bcast({ type: 'LOG_EXTRACT', text: t, level: l }); }
function logD(t,l)  { bcast({ type: 'LOG_DISTILL', text: t, level: l }); }
function sleep(ms)  { return new Promise(r => setTimeout(r, ms)); }
function enc(s)     { return encodeURIComponent(s); }
