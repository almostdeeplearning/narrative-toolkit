# Status Update

## Current Focus
- ETL Tab 已完成 UI 重設計與模組化：5 張獨立 Card（Card 01–05），風格對齊 Custom Flow。
- 下一步：視覺確認、功能測試，或進一步強化（如 Card 03 AI 選擇接線至 startExtract）。

## Progress
- **Side Panel 遷移完成（2026-05-03）**
- **Distill Tab 5-Block 重構完成（2026-05-03）**
- **Custom Flow Tab 完成並測試通過（2026-05-03）**
- **Grok Distill 注入修正（2026-05-03）**
- **Distill Block 抽檔完成（2026-05-03）**
- **`popup.js` → `sidepanel.js` 重命名完成（2026-05-04）**
- **Prompts / Schema Tab 佈局修正 + 自動儲存提示（2026-05-04）**
- **ETL Tab 全面重設計（2026-05-04）：**
  - 頂部 Topnav（水平可滾動，5 個 Tab）取代原有側邊欄。
  - ETL Tab 改為垂直時間軸佈局（3 Step → 5 Card），字體、hover、下拉選單全面優化。
  - `#extractPromptList` 改為 `<select>` 下拉選單 + 選後預覽區（`#extractPromptPreview`）。
  - ETL Tab 模組化拆分：`ETLCard1–5Block.js`，各自負責一張卡片的 HTML 渲染；`initETLTab()` 在 DOMContentLoaded 最前端同步呼叫，確保 `popup-ui-patch.js` 能找到所有 DOM ID。
  - 5 張卡片：Card 01 PROMPT、Card 02 SCHEMA、Card 03 目標 AI（新增 `#extractAiSel`）、Card 04 執行萃取、Card 05 儲存結果。
  - 每張卡片有獨立 `etl-card-head`（標題 + 隱藏 toggle），Card 01–04 有漸變垂直連接線。
  - `sn2`/`st2`/`sn3`/`st3` 保留為隱藏 span，`popup-ui-patch.js` 零改動。
  - `extractAI` 狀態與 Card 03 pill 綁定，讀取 / 儲存至 `chrome.storage.local`。

## Problems
- 若 Grok 頁面 DOM 改版，`injectToGrok` 的輸入框 selector 可能需要更新（ETL 與 Distill 共用此函數）。
- Schema 首次遷移邏輯依賴 schemaTemplates 為空才觸發，若 storage 已有部分資料可能不會補入預設模板。
- Custom Flow 的 Task / Format / AI Block 在「一鍵跑完全部」時僅讀取目前已選狀態，不提供錯誤提示（例如未選 Prompt 時）。
- ETL Card 03（目標 AI）的 `#extractAiSel` 尚未接線至 `startExtract()`；`extractAI` 狀態已儲存，但實際萃取仍固定開啟 x.com/i/grok（Grok）。
- 舊的 `ETLStep1/2/3Block.js` 仍存在於 `src/blocks/`，已不被載入，可手動刪除。

## Next Steps
- 瀏覽器中載入 extension 確認 ETL Tab 5 張卡片視覺與功能正常（toggle 收合、Prompt 下拉、AI pill 選擇）。
- 選擇性：將 `startExtract()` 接線至 `extractAI`，根據選擇開啟對應 AI 頁籤。
- 清理：手動刪除 `src/blocks/ETLStep1/2/3Block.js` 三個舊檔案。
- 視需求繼續：Custom Flow 進一步擴充、DST 共用 Block、或新功能。

## Important Notes
- Side Panel 固定在瀏覽器右側，寬度由使用者拖曳決定，高度等於瀏覽器視窗高度。
- 修改程式後必須在 `chrome://extensions/` 重新載入，service worker 才會更新。
- 儲存策略：本機優先，`chrome.storage.local` + 下載 markdown。無雲端同步。
- `popup.html` 保留作為開發參考，不再被 Extension 載入。
- Custom Flow 的 Run block 強制使用 `fullAuto: true`；Distill Tab 的 Run block 沿用 `fullAuto` storage 設定。
- ETL Block 架構：`initETLTab()` 必須在 DOMContentLoaded 最前端（任何 `await` 之前）呼叫，確保 DOM 在 `popup-ui-patch.js` 的 `initStepState()` 執行前已建立完成。
- ETL Card 01 的 `sn1`/`st1` 為可見 step 指示器；`sn2`/`st2`/`sn3`/`st3` 為隱藏 span，僅保留 DOM ID 相容性，`popup-ui-patch.js` 零改動。
