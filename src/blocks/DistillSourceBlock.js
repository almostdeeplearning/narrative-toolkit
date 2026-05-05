// DistillSourceBlock.js — Block 1 of the Distill pipeline
// Depends on globals: $, chrome (available at call time from popup.js)

const DistillSourceBlock = {
  isInitialized: false,

  _distillMarkup() {
    return `
      <div class="section">
        <div class="section-head">
          <div class="section-title">來源內容</div>
          <div class="row" style="gap:8px">
            <span class="char-count" id="charCount">0 字</span>
            <button class="btn btn-sm" id="grabPageBtn">⊕ 抓取當前頁面</button>
          </div>
        </div>
        <textarea class="ta" id="rawText" rows="6" placeholder="貼入長文，或點「抓取當前頁面」自動填入..."></textarea>
      </div>
    `.trim();
  },

  init(_d) {
    if (this.isInitialized) return;
    this.isInitialized = true;
    $('grabPageBtn').addEventListener('click', () => this.grabPage());
    $('rawText').addEventListener('input', () => {
      $('charCount').textContent = $('rawText').value.length + ' 字';
    });
  },

  getContent() { return $('rawText').value.trim(); },

  renderDistill(container) {
    if (!container) return;
    container.innerHTML = this._distillMarkup();
  },

  renderCF(container) {
    const el = document.createElement('div');
    el.innerHTML = `
      <div class="cf-card" data-cf-card="source">
        <div class="cf-card-head">
          <span class="cf-card-num">01</span>
          <span class="cf-card-title">SOURCE — 來源內容</span>
          <select class="cf-delay-sel" data-cf-delay-for="source">
            <option value="0">無延遲</option>
            <option value="2">2s</option>
            <option value="5">5s</option>
            <option value="10">10s</option>
            <option value="20">20s</option>
            <option value="custom">自訂</option>
          </select>
          <input class="cf-delay-custom" type="number" min="0" max="300" data-cf-custom-for="source" style="display:none" placeholder="秒">
          <button class="btn btn-ghost btn-xs" data-cf-toggle="source">隱藏</button>
        </div>
        <div class="cf-card-body">
          <div class="row row-between" style="margin-bottom:8px">
            <span class="char-count" id="cfCharCount">0 字</span>
            <button class="btn btn-sm" id="cfGrabPageBtn">⊕ 抓取當前頁面</button>
          </div>
          <textarea class="ta" id="cfRawText" rows="6" placeholder="貼入長文，或點「抓取當前頁面」自動填入..."></textarea>
          <div class="row" style="justify-content:flex-end;margin-top:10px">
            <button class="btn" id="cfSaveDraftBtn">存草稿</button>
          </div>
        </div>
      </div>
    `.trim();
    container.appendChild(el.firstElementChild);
  },

  async grabPage() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const clean = text => text.replace(/\n{3,}/g, '\n\n').trim();
        const unique = arr => [...new Set(arr.map(s => s.trim()).filter(Boolean))];
        const dbg = msg => console.log(`[NTK distill grabPage] ${msg}`);
        const url = location.href;
        const isX = /(?:x\.com|twitter\.com)/.test(url);

        const isExcludedNode = el => {
          if (!el) return { excluded: true, reason: 'null-node' };
          if (el.closest('[role="dialog"]')) return { excluded: true, reason: 'inside-dialog' };
          if (el.closest('[aria-label*="Grok"]')) return { excluded: true, reason: 'inside-grok-panel' };
          if (el.closest('[data-testid*="sheet"]')) return { excluded: true, reason: 'inside-sheet' };
          const rect = el.getBoundingClientRect();
          if (rect.left > window.innerWidth * 0.55) return { excluded: true, reason: `right-panel left=${Math.round(rect.left)}` };
          return { excluded: false, reason: '' };
        };

        const collectTextFromNodes = (nodes, selectorPath, fallback) => {
          const accepted = [];
          for (const node of nodes) {
            const text = node.innerText.trim();
            if (!text) continue;
            const verdict = isExcludedNode(node);
            if (verdict.excluded) {
              dbg(`exclude node selector=${selectorPath} reason=${verdict.reason}`);
              continue;
            }
            accepted.push(text);
          }
          if (!accepted.length) {
            dbg(`selector miss path=${selectorPath} fallback=${fallback}`);
            return null;
          }
          const merged = clean(unique(accepted).join('\n\n'));
          dbg(`selector hit path=${selectorPath} fallback=${fallback} textLength=${merged.length}`);
          return merged;
        };

        if (isX) {
          const primary = document.querySelector('main [data-testid="primaryColumn"]')
            || document.querySelector('[data-testid="primaryColumn"]')
            || document.querySelector('main');
          dbg(`x.com detected primaryColumn=${!!primary}`);

          const pickBestArticle = articles => {
            const candidates = articles
              .map(article => {
                const verdict = isExcludedNode(article);
                if (verdict.excluded) {
                  dbg(`exclude article reason=${verdict.reason}`);
                  return null;
                }
                const text = article.innerText.trim();
                if (text.length <= 20) return null;
                const rect = article.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const score = Math.abs(centerX - window.innerWidth * 0.33) + Math.abs(rect.top);
                return { article, score, rect };
              })
              .filter(Boolean)
              .sort((a, b) => a.score - b.score);
            dbg(`filtered article candidates=${candidates.length}`);
            return candidates[0]?.article || null;
          };

          const mainTweet = pickBestArticle(
            primary ? [...primary.querySelectorAll('article[role="article"]')] : []
          ) || pickBestArticle([...document.querySelectorAll('article[role="article"]')]);

          dbg(`selected main article=${!!mainTweet}`);
          if (mainTweet) {
            const primarySelector = '[data-testid="tweetText"]';
            const primaryText = collectTextFromNodes(
              [...mainTweet.querySelectorAll('[data-testid="tweetText"]')],
              primarySelector,
              false
            );
            if (primaryText) return primaryText;

            const fallbackSelector1 = '[lang]';
            const fallbackText1 = collectTextFromNodes(
              [...mainTweet.querySelectorAll('[lang]')],
              fallbackSelector1,
              true
            );
            if (fallbackText1) return fallbackText1;

            const articleText = clean(mainTweet.innerText);
            dbg(`article innerText fallback length=${articleText.length}`);
            if (articleText.length > 20) return articleText;
          }

          dbg('x.com fallback exhausted, continuing to generic extraction');
        }
        const isThreads = /threads\.(net|com)/.test(url);
        if (isThreads) {
          const posts = [...document.querySelectorAll('article')]
            .filter(el => el.innerText.trim().length > 30)
            .map(el => {
              const clone = el.cloneNode(true);
              clone.querySelectorAll('nav, footer, button, svg, [role="button"]').forEach(e => e.remove());
              return clone.innerText.trim();
            });
          if (posts.length) return clean(unique(posts).join('\n\n'));
        }
        const article = document.querySelector('article, main, [role="main"]');
        const body = article || document.body;
        const clone = body.cloneNode(true);
        clone.querySelectorAll('nav,footer,header,aside,script,style,[class*="ad"],[class*="sidebar"]').forEach(e => e.remove());
        const text = clean(clone.innerText);
        dbg(`generic extraction length=${text.length}`);
        return text;
      }
    });
    const text = result?.result || '';
    $('rawText').value = text;
    $('charCount').textContent = text.length + ' 字';
    dlog(`已抓取頁面 ${text.length} 字`, 'success');
  },
};
