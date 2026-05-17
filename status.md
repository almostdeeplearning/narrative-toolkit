# Status Update

## Current Focus
- 分享版最小雙語切換已完成：Topnav 加入 `中文 / English`，偏好儲存於 `uiLanguage`。
- Side Panel 舊 Distill UI shell 已移除；目前只保留 `AI Flows`、`Narrative Scan`、`Prompt Manager`、`Format Manager` 與 `Settings`。
- ETL 主工作流已收斂為 `GPT + Grok` 可見選項；Grok `page / inline` 仍是一級入口，Gemini / Claude 先退到隱藏實作層以降低維護成本。

## Progress
- **Side Panel 遷移完成（2026-05-03）**
- **Distill Tab 下架（Phase 1，2026-05-05）：** Topnav 入口已移除；`Distill*Block` 保留供 Custom Flow 共用。
- **Custom Flow Tab 完成並測試通過（2026-05-03）：** 含 Preset 儲存 / 載入 / 刪除。
- **ETL Tab 全面重設計（2026-05-04）：** 5 張垂直 Card，`ETLCard1–5Block.js` 模組化，`initETLTab()` 同步呼叫。
- **Grok Distill 注入修正（2026-05-03）**
- **Distill Block 抽檔完成（2026-05-03）**
- **`popup.js` → `sidepanel.js` 重命名完成（2026-05-04）**
- **Prompts / Schema Tab 佈局修正 + 自動儲存提示（2026-05-04）**
- **Prompt / Schema JSON 匯入匯出完成（2026-05-05）**
- **UI 可讀性全面調整完成（2026-05-05）：**
  - 字體放大：body 14px、按鈕 12px、label 11px、輸入框 15px。
  - 顏色對比提升：`--bg` → `#13110F`、`--text2` → `#B8B2A6`、`--text3` → `#7A7468`。
  - 新增 `.select-compact` 共用 class：`appearance: none` + 自訂 SVG 箭頭，統一所有 `<select>` 渲染。
  - 套用範圍：`extractSeriesSel`、`extractPromptList`（ETL）、`cfPresetSel`（Custom Flow）、`seriesSelect`（Prompts tab）。
- **Theme system MVP + ETL / Custom Flow 工作流收斂完成（2026-05-07, created: 05-07 17）：**
  - 新增 `uiTheme` 與 3 個 theme：`nt-dark`、`editorial-light`、`studio-light`。
  - Top navigation 入口改為：`脈絡掃描`、`AI Flows`、`Prompt 管理`、`格式管理`。
  - ETL 改為半手動結果流程：Card 04 僅送出 Prompt，不再自動輪詢/回填；Card 05 改為手動截取當前回覆、可編輯預覽與 `.md` 儲存。
  - Custom Flow 的全域執行區移入 Card 05，保留單一 `一鍵跑完全部` 主 CTA。
- **分享版英文切換 + Distill 舊 DOM 清理完成（2026-05-07, created: 05-07 21）：**
  - Topnav 新增最小 `中文 / English` 切換，僅翻譯可見 UI labels，偏好存於 `chrome.storage.local.uiLanguage`。
  - 舊 `tab-distill` 已自 `sidepanel.html` 移除；`Distill*Block` 檔名與底層流程暫時保留，供 Custom Flow 共用。
  - 分享版英文文案已收斂為目前可見入口：`Narrative Scan`、`AI Flows`、`Prompt Manager`、`Format Manager`。
- **分享版英文文案 + 英文模式排版微調完成（2026-05-07, created: 05-07 21）：**
  - Workflow 與 ETL 的英文字樣改為較短的產品文案，例如 `Delay`、`Capture Page`、`Run Workflow`、`Capture Reply`。
  - 英文模式下最顯眼的分享面元素不再強依賴 mono / all-caps 呈現；Topnav label、Workflow card title 與主要按鈕改回較自然的 UI 字體節奏。
  - `data-lang` 目前會同步標記在 `<html>`，保留後續只針對英文模式微調字距與字重的空間。
- **ETL 多 AI 接線開始落地（2026-05-14）：**
  - `startExtract()` 依 `extractAI` 實際切換至 GPT / Gemini / Claude / Grok。
  - Grok 額外新增 `extractGrokMode`：可選 `page`（`x.com/i/grok`）或 `inline`（x.com 頁內小視窗）。
  - Card 05 的手動截取不再只針對 Grok；會依目前 ETL 目標 AI 使用對應的回覆抓取 selector。
- **ETL 主 UI 範圍收斂（2026-05-15）：**
  - ETL Card 03 主畫面目前只顯示 `GPT`、`Grok Inline`、`Grok Page`。
  - Gemini / Claude 的底層路由、selector 與手動截取程式碼暫時保留，但先不作為主工作流入口。
  - 若既有 storage 中保存的是 `extractAI = gemini / claude`，ETL UI 載入時會回退顯示為 `GPT`，不變更 storage schema。
- **Custom Flow Grok 模式接線完成（2026-05-14）：**
  - AI block 改為 `GPT / Gemini / Claude / Grok Inline / Grok Page` pills。
  - `START_DISTILL` 會帶上 `grokMode`，讓 Grok 在 Custom Flow 下也可走 `inline / page` 兩條路徑。
- **Custom Flow 05 卡改為手動回收主路徑（2026-05-15）：**
  - Card 05 新增 `截取當前回覆`、結果 textarea、`複製`、`儲存 .md`，改為與 ETL 類似的手動回收節奏。
  - `runAll()` 在 `cfAutoSave` 關閉時只負責送出 prompt，狀態改為 `已送出至 AI，請等待回覆後手動截取`。
  - `cfAutoSave` 與背景端自動回收 / 下載邏輯暫時保留，但降級為選用 / 實驗性路徑。
- **Workflow Review UI 收尾完成（2026-05-15, created: 05-15 21）：**
  - Workflow 視覺上拆成 `05 Execute` 與 `06 Review`；前者只負責送出、status、logs，後者專注在 `截取當前回覆`、編修、`複製`、`儲存 .md`、`儲存 .html`。
  - `Preset` 改為不再於進入 Custom Flow 時自動套用第一個已存流程；若使用者未主動選擇，預設停在空白狀態。
  - `Review` 卡的結果名稱改為可直接編輯，手動儲存時會沿用目前名稱。
- **X 敘事擷取策略補強（2026-05-14）：**
  - Custom Flow Source block 對 x.com 內容新增較寬的 primary narrative / thread 擷取與 UI noise 過濾。
  - 目前方向偏向先保留較完整脈絡，再在後續 AI 整理步驟中去噪，而非一開始就過度裁切。
- **全專案文件更新完成（2026-05-05）：** spec.md、README.md、NAV_MAP.md、schema.md、DESIGN.md、decisions.md。
- **Prompt / Schema 管理 UX 與 i18n 收尾完成（2026-05-17, created: 05-17 19）：**
  - `Prompt 庫 / Schema 庫` 對外命名更新為 `Prompt 管理 / 格式管理`，英文同步為 `Prompt Manager / Format Manager`。
  - Prompt 與 Schema 皆補齊 `取代匯入 / 合併匯入 / 匯出 JSON / 匯出 Markdown`；Markdown 匯出改為可跳出另存位置視窗。
  - Prompt 系列補上 `刪除系列`、空名稱提示與 autosave 可見回饋；Prompt / Schema 卡片編輯區的英文按鈕、placeholder、字數與提示文案已補齊。

## Problems
- 若 Grok 頁面 DOM 改版，`injectToGrok` 的輸入框 selector 可能需要更新（ETL 與 Distill 共用此函數）。
- Schema 首次遷移邏輯依賴 `schemaTemplates` 為空才觸發，若 storage 已有部分資料可能不會補入預設模板。
- Custom Flow 「一鍵跑完全部」在未選 Prompt 等情境下，目前無錯誤提示。
- ETL 目前改為半手動結果回收；若目標 AI 尚未完成生成就按下 Card 05 的「截取當前回覆」，仍可能抓不到內容。
- Card 05 目前是對「目前 active tab」做手動截取；若使用者送出後切到別頁再截取，可能抓錯頁面。
- Grok `inline` 模式依賴 x.com 當前頁面真的已展開小視窗；若 X 再次改版，可能需要補更精準的 dialog / composer selector。
- Custom Flow 的 Grok `inline` 同樣依賴 x.com 當前頁面已展開小視窗；若小視窗 UI 再改版，ETL 與 Flow 兩邊都可能需要同步調整 selector。
- Custom Flow 的 `Format` 預設空選項現在只代表「不套用 Schema」；若 `Prompt / Schema` 都未選，流程會直接把原文送到 AI，而不是自動存草稿。
- Custom Flow 05 卡目前同樣是對「目前 active tab」做手動截取；若使用者送出後切到別頁再截取，可能抓錯頁面。
- `cfAutoSave` 雖然仍保留，但 Grok inline 的自動回收目前不適合作為主要成功路徑；建議以手動截取為主。
- `customFlowPresets` 目前仍保留 `cfDefaultPresetId` 與既有資料欄位，但 UI 不再於進入 Workflow 時自動套用該 preset；若未來要清理此語意，應另立 schema / decision 任務。
- 舊的 `ETLStep1/2/3Block.js` 仍存在於 `src/blocks/`，已不被載入，待手動刪除。
- `Distill*Block` 命名仍為歷史名稱；雖然對外 UI 已不再顯示 Distill，但內部模組與部分 runtime 路徑尚未重命名。
- 中英混合介面的字體策略仍是局部調整；若後續擴大英文 surface，可能需要更系統化地區分 mono、UI font 與 editorial font 的使用邊界。
- Prompt / Schema 的 Markdown 目前僅支援匯出，不支援直接從 Markdown 回匯。

## Next Steps
- 清理：手動刪除 `src/blocks/ETLStep1/2/3Block.js` 三個舊檔案。
- 驗證：逐一測 GPT / Gemini / Claude / Grok page / Grok inline 的注入與 Card 05 手動截取 selector。
- 驗證：逐一測 Workflow `06 Review` 在 `GPT / Grok page / Grok inline` 下的 `截取當前回覆`、`儲存 .md`、`儲存 .html`。
- 選擇性：補強 Custom Flow 一鍵跑完全部的前置檢查（未選 Prompt 時給出提示）。
- 選擇性：若分享版文案定稿，再決定是否將 `Distill*Block` 重新命名為更中性的 `Workflow*Block`。
- 選擇性：若英文分享版仍覺得視覺不順，可只在 `data-lang="en"` 下再微調 topnav / Workflow 的字級、字重與間距。
- 選擇性：若外部以 VS Code 維護 Prompt / Schema 成為常態，可再評估補上 Markdown 匯入。

## Important Notes
- Side Panel 固定在瀏覽器右側，寬度由使用者拖曳決定，高度等於瀏覽器視窗高度。
- 修改程式後必須在 `chrome://extensions/` 重新載入，service worker 才會更新。
- 儲存策略：本機優先，`chrome.storage.local` + 下載 markdown。無雲端同步。
- `popup.html` 保留作為開發參考，不再被 Extension 載入。
- 所有 `<select>` 元素必須使用 `.select-compact`（而非 `.input`），否則 Chrome 會走 OS 原生渲染，導致字型不一致。
- `initETLTab()` 必須在 DOMContentLoaded 最前端（任何 `await` 之前）同步呼叫。
- Custom Flow 的 Run block 強制使用 `fullAuto: true`；`activeDistillContext` 是 `DISTILL_DONE` / `LOG_DISTILL` 的唯一路由開關，送出前必須設定，收到後必須清除。
