# Status Update

## Current Focus
- Side Panel theme system 與工作流文字層級調整已完成（`nt-dark` / `editorial-light` / `studio-light`）。
- ETL 已改為半手動結果回收：Card 04 只送出 Prompt，Card 05 負責手動截取、微調與儲存。
- 下一步：清理舊檔案，或將 ETL Card 03 `extractAI` 接線至 `startExtract()`。

## Progress
- **Side Panel 遷移完成（2026-05-03）**
- **Distill Tab 下架（Phase 1，2026-05-05）：** Topnav 入口已移除；`Distill*Block` 保留供 Custom Flow 共用。
- **Custom Flow Tab 完成並測試通過（2026-05-03）：** 含 Preset 儲存 / 載入 / 預設套用。
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
  - Top navigation 入口改為：`快速生成`、`自訂流程`、`Prompt 庫`、`Schema 庫`。
  - ETL 改為半手動結果流程：Card 04 僅送出 Prompt，不再自動輪詢/回填；Card 05 改為手動截取當前回覆、可編輯預覽與 `.md` 儲存。
  - Custom Flow 的全域執行區移入 Card 05，保留單一 `一鍵跑完全部` 主 CTA。
- **全專案文件更新完成（2026-05-05）：** spec.md、README.md、NAV_MAP.md、schema.md、DESIGN.md、decisions.md。

## Problems
- 若 Grok 頁面 DOM 改版，`injectToGrok` 的輸入框 selector 可能需要更新（ETL 與 Distill 共用此函數）。
- Schema 首次遷移邏輯依賴 `schemaTemplates` 為空才觸發，若 storage 已有部分資料可能不會補入預設模板。
- Custom Flow 「一鍵跑完全部」在未選 Prompt 等情境下，目前無錯誤提示。
- ETL Card 03（目標 AI）的 `#extractAiSel` 尚未接線至 `startExtract()`；實際萃取仍固定使用 Grok。
- ETL 目前改為半手動結果回收；若 Grok 尚未完成生成就按下 Card 05 的「截取當前回覆」，仍可能抓不到內容。
- 舊的 `ETLStep1/2/3Block.js` 仍存在於 `src/blocks/`，已不被載入，待手動刪除。

## Next Steps
- 清理：手動刪除 `src/blocks/ETLStep1/2/3Block.js` 三個舊檔案。
- 選擇性：將 `startExtract()` 接線至 `extractAI`，根據選擇開啟對應 AI 頁籤（讓 ETL 支援多 AI）。
- 選擇性：補強 Custom Flow 一鍵跑完全部的前置檢查（未選 Prompt 時給出提示）。

## Important Notes
- Side Panel 固定在瀏覽器右側，寬度由使用者拖曳決定，高度等於瀏覽器視窗高度。
- 修改程式後必須在 `chrome://extensions/` 重新載入，service worker 才會更新。
- 儲存策略：本機優先，`chrome.storage.local` + 下載 markdown。無雲端同步。
- `popup.html` 保留作為開發參考，不再被 Extension 載入。
- 所有 `<select>` 元素必須使用 `.select-compact`（而非 `.input`），否則 Chrome 會走 OS 原生渲染，導致字型不一致。
- `initETLTab()` 必須在 DOMContentLoaded 最前端（任何 `await` 之前）同步呼叫。
- Custom Flow 的 Run block 強制使用 `fullAuto: true`；`activeDistillContext` 是 `DISTILL_DONE` / `LOG_DISTILL` 的唯一路由開關，送出前必須設定，收到後必須清除。
