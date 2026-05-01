# Narrative Toolkit

Narrative Toolkit 是一個 Chrome Extension，用來把網頁內容、X/Grok 萃取結果與 AI 整理流程集中在同一個工具介面中。

目前版本以 Popup 為主介面，包含 X ETL、長文整理、Prompt Manager 與設定頁。若未來需要長時間開啟或更大的工作區，下一個候選方向是 Chrome Side Panel。

## 目前狀態

- Popup UI 共五個主要 Tab：X ETL、長文整理、Prompts、Schema、Settings。
- 已修正 MV3 CSP 問題：`popup.html` 不使用 inline script，UI patch 邏輯放在 `src/popup-ui-patch.js`。
- 已新增 UI 可讀性設定：寬度、高度、字體大小、文字對比。
- X ETL 流程已精簡：Prompt + Schema 合併後直接注入 Grok，不再走 AI 後處理步驟。
- Prompts tab 採用水平 series tab bar + 可展開 prompt card 設計。
- Schema tab 採用相同 card 設計，管理可重複使用的格式模板。
- 已新增專案文件：
  - `DESIGN.md`：視覺與元件設計規格。
  - `NAV_MAP.md`：Tab、DOM、事件、message 與 storage 導航地圖。
  - `spec.md`：產品與系統需求。
  - `schema.md`：storage 與 message 資料結構。
  - `decisions.md`：長期決策紀錄。
  - `status.md`：目前狀態與下一步。

## 專案結構

```text
narrative-toolkit/
├── manifest.json
├── popup.html
├── README.md
├── DESIGN.md
├── NAV_MAP.md
├── spec.md
├── schema.md
├── decisions.md
├── status.md
└── src/
    ├── popup.js
    ├── popup-ui-patch.js
    ├── background.js
    ├── cs_grok.js
    └── cs_ai.js
```

## 安裝

1. 開啟 Chrome：`chrome://extensions/`
2. 啟用「開發人員模式」
3. 點「載入未封裝項目」
4. 選取此專案資料夾
5. 每次修改程式後，回到 `chrome://extensions/` 點「重新整理」

## 主要功能

### X ETL

- 從 Prompt 系列選取 Prompt，並可選配 Schema 格式模板。
- Prompt 文字與 Schema 合併後注入 `x.com/i/grok`。
- 依序萃取每個 Prompt，顯示進度與 log。
- 萃取完成後直接顯示 markdown 結果，可一鍵複製或儲存 `.md`。

### 長文整理

- 可貼入長文，或抓取目前頁面文字。
- 可選配 Schema 格式模板決定輸出結構。
- 可選擇 GPT / Gemini / Claude / Grok 作為目標 AI。
- 可選擇是否自動存檔與回寫結果到 Popup。

### Prompts

- 水平 series tab bar 管理多個 Prompt 系列。
- 系列內容以可展開 card 呈現，支援 inline 編輯。
- Prompt 可被 X ETL 或長文整理流程選用。

### Schema

- 管理可重複使用的格式模板（wiki.md、YAML、Table、Markdown 等）。
- 以可展開 card 呈現，支援 inline 編輯名稱與模板文字。
- Schema 可在 X ETL 與長文整理中選用。

### Settings

- 自動化、下載資料夾設定。
- Popup 寬度、高度、字體大小、文字對比設定。

## 重要限制

- Chrome action popup 最大約為 `800x600`，高度無法超過 600px；若需要更大的長時間工作區，應評估 Side Panel。
- `chrome.storage.local` 只在同一 Chrome Profile 內保存，無法跨 Profile 同步。
- Extension 依賴使用者已登入目標 AI 平台。

## 開發規則

- 不要在 `popup.html` 加 inline `<script>`。
- 不要使用 `onclick`、`onchange`、`oninput` 等 inline event handler。
- Popup/Side Panel 頁面只引用外部 JS。
- 主要流程放在 `src/popup.js`。
- UI glue / 相容 patch 放在 `src/popup-ui-patch.js`。
- 改 UI 前先看 `DESIGN.md` 與 `NAV_MAP.md`。

## 驗證

```powershell
node --check src\popup.js
node --check src\popup-ui-patch.js
rg -n --pcre2 "<script(?!\s+src=)|\s(on[a-zA-Z]+)\s*=|javascript:" popup.html
```
