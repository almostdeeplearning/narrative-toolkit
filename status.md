# Status Update

## Current Focus
- 讓 Narrative Toolkit 穩定走 local-first 工作流，優先修順 X ETL 的 prompt 編輯、Grok 擷取、結果檢視與後續 markdown 輸出。
- 準備將專案推上 GitHub，維持 repository 乾淨且不包含本機輸出或憑證。

## Progress
- 已移除 Google Sheets / Google Drive 儲存設計，工具不再需要 OAuth Token 或 Sheet ID。
- 已新增 `.gitignore`，排除本機輸出、打包產物、依賴與環境檔。
- X ETL prompt 預覽區已改為可讀、可編輯的本次工作稿。
- X ETL 開始前會同步畫面上的 prompt 編輯內容，避免送出 prompt 庫舊版本。
- X ETL raw Grok 擷取結果已改為先顯示在工具內，不再完成後直接自動下載。
- `decisions.md` 已追加今天的 local-first、X ETL 流程與 GitHub 準備決策。

## Problems
- 仍需實際重新載入 Chrome Extension 後驗證 X ETL 是否能穩定把 prompt 注入 Grok chat。
- 若 Grok 頁面 DOM 改版，`injectToGrok()` 的輸入框偵測可能仍會失敗。
- `popup.html` 與部分舊文件仍有歷史亂碼，會影響維護與檢查。
- Chrome action popup 仍受尺寸與失焦關閉限制；長期大量操作可能仍需評估 Side Panel。

## Next Steps
- 在 `chrome://extensions/` 重新載入 extension，完整測試 X ETL：選 prompt、編輯、注入 Grok、擷取、顯示結果、Step 3 整理、手動存 `.md`。
- 若 Grok 注入仍失敗，集中檢查並更新 Grok chat 輸入框 selector。
- 檢查 Git 狀態後建立初始 commit，接著連接 GitHub remote 並 push。
- 逐步清理文件亂碼，優先處理會影響操作理解的 `README.md`、`NAV_MAP.md`、`status.md`。

## Important Notes
- 現在的儲存策略是本機優先：主要依賴 `chrome.storage.local` 與下載到本機的 markdown。
- X ETL raw 擷取結果是中間狀態，最終 markdown 應由使用者確認後再輸出。
- Prompt Manager 中的 prompt 是長期庫；X ETL 預覽區中的修改是本次執行工作稿。
- 修改 extension 程式後，必須在 Chrome Extensions 頁面重新載入，否則可能仍執行舊版 service worker 或 popup script。
- 不要把 `Downloads` 裡的輸出檔、`.env`、打包檔或私有資料提交到 GitHub。
