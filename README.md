# Narrative Toolkit

Narrative Toolkit 是一個 Chrome Extension，用來把網頁內容、X/Grok 萃取結果與 AI 整理流程集中在同一個工具介面中。

目前版本以 Chrome Side Panel 為主介面，固定在瀏覽器右側，頁面導航時保持開啟；目前主要可見入口為快速生成、自訂流程、Prompt 庫、Schema 庫與設定，並提供最小 `中文 / English` 切換。Distill Tab 已下架，相關共用 block 暫時保留於程式中。

Implementation note:

- Current product surface focuses on the Side Panel, Custom Flow, and the ETL pipeline.
- Some legacy background handlers remain in the repository for compatibility or cleanup tracking, but they are not part of the main user-facing workflow surface.

## 目前狀態

- **Side Panel 遷移完成（2026-05-03）**：主介面改為 `sidepanel.html`；`popup.html` 保留作為開發參考。
- **主 UI 腳本重命名完成（2026-05-04）**：主要工作流邏輯已從 `src/popup.js` 改為 `src/sidepanel.js`。
- **Distill Tab 已下架（2026-05-05）**：Topnav 入口已移除；目前 `sidepanel.html` 也不再保留 `tab-distill` 舊 UI shell；相關 `Distill*Block` 仍保留，供 Custom Flow 共用。
- **分享版最小雙語切換完成（2026-05-07, created: 05-07 21）**：Topnav 新增 `中文 / English` 切換，僅覆蓋目前可見 UI labels，偏好儲存於 `uiLanguage`。
- **UI 可讀性全面調整（2026-05-05）**：基礎字體放大（body 14px、按鈕 12px、label 11px、輸入框 15px）；顏色對比提升（`--text2` → `#B8B2A6`、`--text3` → `#7A7468`）；背景改為微暖深灰（`--bg` → `#13110F`）；新增 `.select-compact` 共用 class，以 `appearance: none` 繞過 Chrome OS native `<select>` 渲染，統一所有 dropdown 字型。
- **Custom Flow Tab 完成並測試通過（2026-05-03）**：5 個可組合的 Block Card，支援延遲設定與一鍵跑完全部。
- **Theme system + ETL / Custom Flow 工作流收斂（2026-05-07, created: 05-07 17）**：新增 `nt-dark` / `editorial-light` / `studio-light`；ETL 改為半手動結果回收；Custom Flow 的全域執行區移入 Card 05。
- **Grok Distill 注入修正（2026-05-03）**：Grok 作為 Distill 目標時改用 `executeScript` 直接注入，與 ETL 機制一致。
- **ETL Tab 全面重設計（2026-05-04）**：改為 5 張垂直時間軸 Card，並拆成 `ETLCard1–5Block.js`。
- MV3 CSP 合規：所有頁面不使用 inline script，UI patch 邏輯放在 `src/popup-ui-patch.js`。
- X ETL 流程精簡：Prompt + Schema 合併後直接注入 Grok，不再走 AI 後處理步驟。
- 專案文件：
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
├── sidepanel.html       ← 主介面（Side Panel）
├── popup.html           ← 開發參考，不被 Extension 載入
├── README.md
├── DESIGN.md
├── NAV_MAP.md
├── spec.md
├── schema.md
├── decisions.md
├── status.md
└── src/
    ├── sidepanel.js         ← 主要工作流邏輯
    ├── popup-ui-patch.js
    ├── background.js
    ├── cs_grok.js
    ├── cs_ai.js
    └── blocks/              ← Distill 與 ETL Block（plain script，sidepanel.js 之前載入）
        ├── DistillSourceBlock.js
        ├── DistillTaskBlock.js
        ├── DistillFormatBlock.js
        ├── DistillAIBlock.js
        ├── DistillRunBlock.js
        ├── ETLCard1Block.js
        ├── ETLCard2Block.js
        ├── ETLCard3Block.js
        ├── ETLCard4Block.js
        ├── ETLCard5Block.js
        ├── ETLStep1Block.js   ← 舊檔案，已不被載入，可清理
        ├── ETLStep2Block.js   ← 舊檔案，已不被載入，可清理
        └── ETLStep3Block.js   ← 舊檔案，已不被載入，可清理
```

## 安裝

1. 開啟 Chrome：`chrome://extensions/`
2. 啟用「開發人員模式」
3. 點「載入未封裝項目」
4. 選取此專案資料夾
5. 每次修改程式後，回到 `chrome://extensions/` 點「重新整理」

## 主要功能

### X ETL

- 以 5 張垂直時間軸 Card 組成：Prompt、Schema、目標 AI、執行萃取、儲存結果。
- 從 Prompt 系列選取單一 Prompt；選取後會直接進入可手動修改的分析任務區。
- 可選配 Schema 格式模板。
- Card 03 可選擇目標 AI 並保存 `extractAI` 狀態，但目前 `startExtract()` 尚未接線到此設定，實際萃取仍固定使用 Grok。
- Prompt 文字與 Schema 合併後注入 `x.com/i/grok`。
- Card 04 目前只負責送出 Prompt 與顯示送出進度 / log，不再自動輪詢或自動回填結果。
- Card 05 由使用者在 Grok 回覆完成後手動截取當前回覆，於可編輯 textarea 中微調，再儲存 `.md`。

### 自訂流程（Custom Flow）

- 5 個可獨立顯示／隱藏的 Block Card：Source（來源內容）、Task（Prompt 任務）、Format（輸出格式）、AI（目標 AI）、Run（執行整理）。
- 每個 Block 可設定執行後的延遲時間（無延遲 / 2s / 5s / 10s / 20s / 自訂秒數）。
- 「一鍵跑完全部」按序執行已顯示的 Block，每步執行後依延遲設定等待再繼續；全域執行控制目前集中於 Card 05。
- 支援 Preset：可儲存、載入、刪除目前 Custom Flow 設定，並可指定預設 Preset。
- 目前作為主要整理入口，承接原本 Distill 的整理工作流。
- 目標 AI 支援 GPT / Gemini / Claude / Grok；Grok 使用與 X ETL 相同的直接注入機制。
- 與原 Distill block 共用部分底層邏輯，並共用 Prompt 庫與 Schema 庫。
- Distill 與 Custom Flow 現在共用 `cfAutoSave`；兩者送出 `START_DISTILL` 時都會附帶 `autoSave`，背景端以 message 參數為唯一準則，不再讀取 `distillAutoSave`。

### Prompts

- 水平 series tab bar 管理多個 Prompt 系列。
- 系列內容以可展開 card 呈現，支援 inline 編輯。
- Prompt 可被 X ETL、長文整理或自訂流程選用。
- 支援 Prompt 系列 JSON 匯入 / 匯出，方便備份與跨裝置轉移。

### Schema

- 管理可重複使用的格式模板（wiki.md、YAML、Table、Markdown 等）。
- 以可展開 card 呈現，支援 inline 編輯名稱與模板文字。
- Schema 可在 X ETL、長文整理與自訂流程中選用。
- 支援 Schema JSON 匯入 / 匯出，方便備份與跨裝置轉移。

### Settings

- 自動化、下載資料夾設定。
- Topnav 最小語言切換：`中文` / `English`。
- Theme selector：`nt-dark` / `editorial-light` / `studio-light`。
- 字體大小（standard / comfortable / large）、文字對比（standard / bright / max）設定。
- 以上偏好設定套疊於基礎 CSS 預設值之上（body 14px、按鈕 12px、label 11px、輸入框 15px；背景 `#13110F`）。

## 重要限制

- Side Panel 固定在瀏覽器右側；寬度由使用者拖曳決定，高度等於視窗高度。
- `chrome.storage.local` 只在同一 Chrome Profile 內保存，無法跨 Profile 同步。
- Chrome 只允許下載至 Downloads 目錄或其子目錄，無法寫入任意系統路徑。
- Extension 依賴使用者已登入目標 AI 平台。
- X ETL 的 Card 03 目標 AI 選擇目前只保存 UI 狀態，尚未控制實際萃取目標；萃取仍固定開啟 `x.com/i/grok`。
- Grok 頁面 DOM 改版時，ETL 與 Distill 共用的 `injectToGrok` selector 可能需要更新。
- Schema 首次遷移只在 `schemaTemplates` 為空時觸發；若 storage 已有部分資料，可能不會自動補入預設模板。
- Custom Flow 的一鍵跑完全部目前只讀取已選狀態，未選 Prompt 等情境沒有完整錯誤提示。
- 修改程式後必須在 `chrome://extensions/` 重新載入，service worker 才會更新。

## 開發規則

- 不要在 `popup.html` 加 inline `<script>`。
- 不要使用 `onclick`、`onchange`、`oninput` 等 inline event handler。
- Popup/Side Panel 頁面只引用外部 JS。
- 主要流程放在 `src/sidepanel.js`。
- Distill 與 ETL Block 物件放在 `src/blocks/*.js`，以 plain `<script>` 在 `src/sidepanel.js` 之前載入。
- `initETLTab()` 必須在 DOMContentLoaded 最前端、任何 `await` 之前同步呼叫，確保 ETL Card DOM 先建立。
- 所有 `<select>` 元素必須使用 `.select-compact` class（而非 `.input`）；Chrome 對 `<select>` 預設走 OS native rendering，CSS `font-family` 完全無效，`appearance: none` 是唯一解法。
- Distill Tab 已下架；目前不要重新接回 `renderDistill()` / `init()` 路徑，除非是明確的重啟任務。
- UI glue / 相容 patch 放在 `src/popup-ui-patch.js`。
- 改 UI 前先看 `DESIGN.md` 與 `NAV_MAP.md`。

## 驗證

```powershell
node --check src\sidepanel.js
node --check src\popup-ui-patch.js
node --check src\blocks\DistillSourceBlock.js
node --check src\blocks\DistillTaskBlock.js
node --check src\blocks\DistillFormatBlock.js
node --check src\blocks\DistillAIBlock.js
node --check src\blocks\DistillRunBlock.js
node --check src\blocks\ETLCard1Block.js
node --check src\blocks\ETLCard2Block.js
node --check src\blocks\ETLCard3Block.js
node --check src\blocks\ETLCard4Block.js
node --check src\blocks\ETLCard5Block.js
rg -n --pcre2 "<script(?!\s+src=)|\s(on[a-zA-Z]+)\s*=|javascript:" sidepanel.html
```

## Open Questions

- X ETL Card 03 的目標 AI 是否要正式接線到 `startExtract()`，讓 ETL 可依 `extractAI` 開啟 GPT / Gemini / Claude / Grok？
- `src/blocks/ETLStep1Block.js`、`ETLStep2Block.js`、`ETLStep3Block.js` 是否可在下一次清理任務中刪除？
