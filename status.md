# Status Update

## Current Focus
- UI 架構與視覺設計已完成，目前尚未在 Chrome 中做完整端對端測試。
- 下一個工作重心是載入 Extension 後驗證五個 Tab 的核心流程。

## Progress
- X ETL 流程已精簡為三步驟：Prompt+Schema 合併注入 Grok → 萃取 → 複製/儲存結果，移除舊的 AI 後結構化步驟。
- 新增 Schema Tab（第五個 Tab），以可展開 Card 管理格式模板；預設內建 wiki.md、YAML、Table、Markdown 四組模板。
- Prompts Tab 改為水平 Series Tab Bar + 可展開 Prompt Card，移除左側欄版面。
- Schema Tab 與 Prompts Tab 共用相同的 Card UI 模式與 add-row 表單設計。
- 舊格式模板 key（grokTpl / noteTpl / wikiTpl）在首次載入時自動遷移至 schemaTemplates，之後不再讀寫舊 key。
- 所有文件（spec.md、README.md、NAV_MAP.md、schema.md、decisions.md）已同步更新至今日架構。

## Problems
- Extension 尚未在 Chrome 中完整測試；Prompt+Schema 注入流程、Schema 選取後的預覽、Card 展開/收合行為皆待驗證。
- 若 Grok 頁面 DOM 改版，`cs_grok.js` 的輸入框 selector 可能需要更新。
- Schema 首次遷移邏輯依賴 schemaTemplates 為空才觸發，若 storage 已有部分資料可能不會補入預設模板。
- Chrome action popup 的失焦關閉限制未解決；長時間工作流仍是潛在痛點。

## Next Steps
- 在 `chrome://extensions/` 重新載入 Extension，測試 X ETL 全流程：選系列 → 選 Schema → 開始萃取 → 確認結果顯示 → 儲存 `.md`。
- 測試 Schema Tab：新增模板、展開編輯、rename、刪除，並確認 X ETL 與 Distill 的 schema 選單即時更新。
- 測試 Prompts Tab：切換 series tab、展開 card、inline 編輯、新增 prompt、載入至 X ETL。
- 確認 Schema 首次遷移行為：清空 schemaTemplates 後重新載入，確認四個預設模板正確建立。
- 建立初始 commit 並推上 GitHub。

## Important Notes
- 儲存策略：本機優先，`chrome.storage.local` + 下載 markdown。無雲端同步。
- X ETL 的萃取結果是中間狀態，使用者確認後才輸出；不會自動下載 raw 結果。
- Prompt 庫（promptSeries）是長期資料；X ETL prompt 佇列（prompts）是本次執行工作稿，兩者分開管理。
- `expandedCardIdx`（Prompts）與 `expandedSchemaIdx`（Schema）是純 in-memory 狀態，不持久化。
- 修改程式後必須在 `chrome://extensions/` 重新載入，service worker 與 popup script 才會更新。
