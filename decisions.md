# Decisions

## Decision 1
- **Decision:** Add a dedicated `saveDraft` feature to store captured content as drafts.
- **Date:** 2026-04-05
- **Reason:** Users want to capture multiple X.com posts and save them locally before manually switching to GPT/Grok for verification.
- **Alternatives considered:** Rely only on `chrome.storage.local` without local file downloads; use only the existing library without explicit draft support.
- **Expected impact:** Improves workflow reliability by preserving drafts locally and allows users to manage and reuse captured content across extension sessions.

## Decision 2
- **Decision:** Add a `verifyWiki` workflow button to generate `wiki.md` with a built-in truth-check section.
- **Date:** 2026-04-05
- **Reason:** The user requested a more structured way to validate content and produce wiki-style markdown from captured text.
- **Alternatives considered:** Keep only the original `startDistill` workflow; add a separate manual prompt template instead of a dedicated workflow.
- **Expected impact:** Provides a clearer path for fact-checking and content output, making the extension more useful for research and documentation tasks.

## Decision 3
- **Decision:** Increase the popup UI size and enlarge controls for better usability.
- **Date:** 2026-04-05
- **Reason:** The extension UI was too compact and could be hard to use for longer text and workflow actions.
- **Alternatives considered:** Keep the existing compact layout; create a separate full-page UI instead of enlarging the popup.
- **Expected impact:** Enhances user comfort and reduces friction during interaction, especially when working with long-form content and multiple buttons.

## Decision 4
- **Decision:** Improve X.com content extraction to better handle thread and tweet-style pages.
- **Date:** 2026-04-05
- **Reason:** Standard page extraction was not reliable for X.com posts and threads.
- **Alternatives considered:** Leave extraction as a generic Readability-style method; require the user to manually copy content instead.
- **Expected impact:** Increases accuracy when capturing X.com content and reduces manual cleanup effort.

## Decision 5
- **Decision:** Keep draft metadata in `chrome.storage.local` while also downloading markdown to the local downloads folder.
- **Date:** 2026-04-05
- **Reason:** The user wanted both local extension draft access and a filesystem backup available in another Chrome window.
- **Alternatives considered:** Store drafts only in `chrome.storage.local`; rely only on downloaded markdown backups.
- **Expected impact:** Provides dual persistence: extension-based access for same-profile windows and local file access for easier offline review and backup.

## Decision 6
- **Decision:** 新增「📚 Prompt 庫」Tab，以系列為單位組織和管理可重複使用的 Prompt。
- **Date:** 2026-04-21
- **Reason:** 使用者需要跨 Session 重複使用 Prompt，並依用途分類（如 ai-note-generation 底下有 knowledge note 產生、casual chain 產生等），現有的萃取清單每次重新整理後不保留。
- **Alternatives considered:** 在萃取 Tab 內直接加入收藏功能；使用平鋪清單加標籤取代系列概念。
- **Expected impact:** 減少重複輸入 Prompt 的時間，支援不同工作情境快速切換，並可整個系列批次載入萃取清單。

## Decision 7
- **Decision:** 草稿下載路徑改為可由使用者指定相對子目錄，而非固定寫入 Downloads 根目錄。
- **Date:** 2026-04-21
- **Reason:** 使用者希望不同類型的輸出能分資料夾存放，便於管理本機檔案。
- **Alternatives considered:** 開啟系統檔案選擇器讓使用者選任意路徑（Chrome 安全限制不允許）；全部只放在 `chrome.storage.local`。
- **Expected impact:** 在 Chrome 允許的範圍內（Downloads 子目錄）提供資料夾組織能力，降低手動整理下載檔案的負擔。

## Decision 8
- **Decision:** 以三個預設寬度按鈕（窄 500 / 中 600 / 寬 700）取代滑竿或可拖拉調整大小的方案。
- **Date:** 2026-04-21
- **Reason:** 使用者反映預設 700px 太寬，在瀏覽 x.com 時視覺上不舒適；預設按鈕比滑竿操作更快，比 Side Panel 改造工作量小。
- **Alternatives considered:** Range slider 連續調整；Chrome Side Panel API（僅支援右側、需重構）；Content Script 浮動面板（工作量大、CSS 隔離困難）。
- **Expected impact:** 使用者可依螢幕空間與習慣快速切換介面寬度，設定即時套用並持久記憶，無需重新整理 Extension。

## Decision 9
- **Decision:** 將「長文整理」的 `skill.md` 格式改為 `筆記.md`（直接存原文），並移除「兩者都要」選項。
- **Date:** 2026-04-21
- **Reason:** skill.md 需要 AI 將原文重新整理成教學格式，但使用者認為知識技能不太可能透過這種方式直接取得；實際需求是把閱讀到的文章原文存成 .md，之後再拿去與 AI 討論以加深理解。
- **Alternatives considered:** 保留 skill.md 但調整 Prompt 模板；改為讓使用者自訂任意格式模板。
- **Expected impact:** 簡化長文整理流程，筆記.md 不送 AI 直接存檔，減少不必要的 AI 呼叫；使用者可累積原文 .md 檔案後批次與 AI 討論。

## Decision 11
- **Decision:** 將文件庫從獨立 Tab 拆解，移至各功能 Tab 底部，依輸出類型分類顯示。
- **Date:** 2026-04-22
- **Reason:** 使用者操作文件庫的主要動機是查看/管理當前 Tab 的輸出結果；獨立 Tab 造成不必要的上下文切換，且難以區分萃取類與整理類檔案。
- **Alternatives considered:** 保留獨立文件庫 Tab 但加入篩選器；在每個 Tab 加入快捷按鈕跳至文件庫。
- **Expected impact:** 減少使用者在 Tab 之間切換的次數，各 Tab 底部文件庫僅顯示相關格式檔案，視覺脈絡更清晰。

## Decision 12
- **Decision:** 將原「Prompt 庫」Tab 升級為「📋 Prompt Manager」，定位為系列 Prompt 批次派送工具。
- **Date:** 2026-04-22
- **Reason:** 使用者確認 Scenario B（對同一來源文字依序套用系列 Prompt）是明確需求；三個 Tab 剛好對應三種使用情境（X 萃取 / 長文整理 / 系列 Prompt 批次）。
- **Alternatives considered:** 在長文整理 Tab 內加入「批次模式」切換；保留 Prompt 庫 Tab 原有管理功能、不增加批次派送。
- **Expected impact:** 提供完整的系列 Prompt 工作流程，使用者可對單一來源文字依序執行多個 Prompt 並各自存檔，適合知識萃取、多角度分析等場景。

## Decision 13
- **Decision:** 將下載資料夾設定拆分為 extractFolder（X ETL）與 distillFolder（長文整理）兩個獨立欄位。
- **Date:** 2026-04-22
- **Reason:** 兩種輸出類型（Grok 萃取結果 vs. AI 整理筆記）在語意與管理上截然不同，共用一個路徑會造成混淆；使用者明確表達希望分資料夾存放。
- **Alternatives considered:** 保留單一 draftFolder、讓使用者手動分類；加入輸出類型前綴（如 extract_ / distill_）以區分同一資料夾中的檔案。
- **Expected impact:** 使用者可為不同輸出類型設定各自的存放路徑，提升本機檔案組織的靈活性。

## Decision 14
- **Decision:** 新增 distillAutoSave 勾選框，允許使用者選擇不儲存 AI 整理結果、也不回寫至 Popup。
- **Date:** 2026-04-22
- **Reason:** 使用者有時只想在 AI 對話視窗中直接討論，不需要存檔也不需要把結果帶回 Popup；強制回寫反而干擾工作流程。
- **Alternatives considered:** 固定自動存檔、無法跳過；加入「預覽後決定是否存檔」的二步驟確認流程。
- **Expected impact:** 使用者可根據當次目的靈活選擇：勾選時走完整存檔流程，不勾選時直接在 AI 視窗討論，Popup 保持不變。

## Decision 10（待評估）
- **Decision:** 將 Extension UI 從 Popup 升級為 Chrome Side Panel。
- **Date:** 2026-04-22
- **Status:** 🟡 已評估，尚未實作，日後視需求決定。
- **Reason:** Popup 在頁面導航時（如 x.com 點入單篇 post）會強制關閉；Side Panel 可在導航過程中保持開啟，且位置固定在右側不受影響。
- **Alternatives considered:** 維持 Popup（已做 Tab 記憶作為短期改善）；Content Script 浮動面板（CSS 隔離困難、工作量更大）；Web App（會失去 content script 萃取與 AI Tab 自動化，不適合）。
- **Expected impact:** 解決導航關閉問題、Popup 位置限制問題，使用者可一邊瀏覽 x.com 一邊操作工具。
- **Implementation notes:**
  - manifest.json：加 `sidePanel` 權限，移除 `action.default_popup`，加 `side_panel.default_path`
  - 新增 `side_panel.html`（複製自 popup.html）
  - background.js：監聽 `chrome.action.onClicked` → 呼叫 `chrome.sidePanel.open()`
  - popup.js 幾乎不用改，改名為 `side_panel.js`
  - 估計工作量：3–5 小時
  - 限制：Side Panel 固定在視窗右側，無法像 Popup 浮動定位

## Decision 15
- **Decision:** Chrome Extension 頁面禁止使用 inline JavaScript；所有 `<script>...</script>` 與 inline event handler 都必須搬到外部 JS 檔案。
- **Date:** 2026-05-01
- **Reason:** Manifest V3 預設 CSP 只允許 `script-src 'self'`，inline script 會觸發 `Executing inline script violates Content Security Policy directive 'script-src self'`。為了維持安全模型，不修改 manifest CSP，也不加入 `unsafe-inline`。
- **Alternatives considered:** 修改 manifest CSP 加 `unsafe-inline`（不安全且不符合 MV3 最佳實務）；將邏輯塞回 `popup.js`（會讓主要業務邏輯和 UI 相容 patch 混在一起）。
- **Expected impact:** 避免 CSP 錯誤，讓 extension popup/side panel 頁面能穩定載入，同時維持 Chrome Extension 的安全要求。
- **Implementation notes:**
  - `popup.html` 只保留外部 script 引用，例如 `src/popup.js` 與 `src/popup-ui-patch.js`。
  - `src/popup.js` 負責主要工作流與資料操作。
  - `src/popup-ui-patch.js` 負責 UI glue / 相容層，例如 sidebar navigation、step state、format card click、distill selected prompt area 顯示邏輯，以及非 extension preview context 的 `chrome.*` stub。
  - 不在 HTML 寫 `onclick`、`onchange`、`oninput` 等 inline event handler；全部使用 `addEventListener` 或事件委派。
  - 新增或修改 popup/side panel HTML 時，完成後需掃描 `<script>` 與 `on...=`，並用 `node --check` 檢查相關 JS 檔案。

## Decision 16
- **Decision:** 將設計規格獨立記錄為專案級設計文件，作為未來 UI 調整的共同依據。
- **Date:** 2026-05-01
- **Reason:** Popup UI 已累積多個工作流與設定項，若缺少明確設計規格，後續調整容易破壞既有的深色工具型介面一致性。
- **Alternatives considered:** 只依照現有 CSS 修改；把設計規則寫在 README；每次改 UI 時重新判斷設計方向。
- **Expected impact:** 降低 UI 調整成本，讓未來修改能維持一致的色彩、字體、間距、元件狀態與整體產品感。

## Decision 17
- **Decision:** 將 UI 導航、DOM 節點、事件綁定與資料流獨立記錄為導航地圖。
- **Date:** 2026-05-01
- **Reason:** Popup 已有多個 Tab、跨檔案事件綁定與 background message flow，缺少導航地圖會讓後續改版或搬遷到 Side Panel 時容易漏改或破壞流程。
- **Alternatives considered:** 只依賴程式碼搜尋；把導航說明混入 README；等重構時再整理。
- **Expected impact:** 提升未來維護與重構的安全性，讓開發者能快速理解每個 Tab 的責任、互動入口與狀態來源。

## Decision 18
- **Decision:** Popup 的高度調整以 Chrome action popup 限制為上限，超出需求時改評估 Side Panel，而不是嘗試繞過 popup 尺寸限制。
- **Date:** 2026-05-01
- **Reason:** Chrome action popup 有最大尺寸限制，單純增加 CSS 高度不會讓外框無限制變高，只會導致內部捲動或被瀏覽器裁切。
- **Alternatives considered:** 保留超過限制的高度選項；用 CSS 強制放大 popup；改用獨立網頁或 content script 浮動面板。
- **Expected impact:** 避免誤導性的 UI 設定，讓使用者清楚知道 Popup 的邊界，並在需要長時間大工作區時轉向更合適的 Side Panel。

## Decision 19
- **Decision:** 將可讀性改善作為使用者設定提供，而不是直接永久改變整體視覺風格。
- **Date:** 2026-05-01
- **Reason:** 目前深色低對比風格符合產品方向，但部分標題與次要文字對某些使用情境過暗；使用者需要可調整的可讀性，而不是單一固定外觀。
- **Alternatives considered:** 直接提高所有文字顏色；只放大字體；改成亮色主題。
- **Expected impact:** 保留原有視覺識別，同時讓使用者可依環境與視力需求調整文字大小與對比，提升長時間使用舒適度。

## Decision 20
- **Decision:** 將 Narrative Toolkit 的雲端儲存能力移除，產品定位改為本機優先的 Chrome Extension 工作流。
- **Date:** 2026-05-01
- **Reason:** 使用者主要透過本機檔案與 Claude skill 管理輸出，不需要 Google OAuth、Google Sheet ID 或 Google Drive/Sheets 作為核心儲存層。
- **Alternatives considered:** 保留 Google Sheets/Drive 作為選用同步功能；只隱藏 Google 設定但保留背景能力；維持雲端與本機雙軌儲存。
- **Expected impact:** 降低設定成本與憑證風險，使工具更符合個人 local-first 寫作與整理流程。

## Decision 21
- **Decision:** 將 X ETL 的原始 Grok 擷取結果視為中間狀態，先顯示在工具內，再由後續整理步驟決定是否輸出成 markdown。
- **Date:** 2026-05-01
- **Reason:** 使用者期待 X ETL 先完成 prompt 注入、Grok 回答擷取與結果檢視，再進入 Step 3 選擇整理方式，而不是在原始擷取完成時立即寫出檔案。
- **Alternatives considered:** 擷取完成後自動下載 raw markdown；同時顯示結果並自動下載；讓自動下載設定同時控制 raw 擷取與 distill 輸出。
- **Expected impact:** 讓 X ETL 流程更可預期，避免產生未審閱或非最終格式的檔案，並把輸出決策延後到使用者確認結果之後。

## Decision 22
- **Decision:** X ETL 的 prompt 預覽區應作為本次執行的可編輯工作稿，而不只是 prompt 庫內容的唯讀呈現。
- **Date:** 2026-05-01
- **Reason:** 使用者會在匯入既有 prompt 後針對本次任務微調內容，並期待按下開始擷取時送出的就是畫面上修改後的版本。
- **Alternatives considered:** 要求使用者回到 Prompt Manager 修改原始 prompt；將預覽區改為唯讀；在執行前彈出確認視窗要求另存 prompt。
- **Expected impact:** 支援臨場調整 prompt 的自然工作流，同時避免本次執行與畫面內容不一致造成信任落差。

## Decision 23
- **Decision:** X ETL 在沒有成功取得 Grok 回答時，不應產生或下載輸出檔。
- **Date:** 2026-05-01
- **Reason:** 失敗狀態下產生檔案會讓使用者誤以為流程成功，也可能把錯誤訊息當作有效擷取結果保存。
- **Alternatives considered:** 仍然保存包含錯誤訊息的 raw markdown；只在檔名標記 error；把失敗結果放入一般 library。
- **Expected impact:** 減少無效檔案與誤判，讓使用者能明確知道應該先修正 Grok 頁面或注入流程，再重新擷取。

## Decision 24
- **Decision:** 在將專案推送到 GitHub 前，建立明確的忽略規則，將本機輸出、打包產物、依賴與憑證排除在版本控制之外。
- **Date:** 2026-05-01
- **Reason:** 專案包含 Chrome Extension 原始碼，也會產生本機 markdown 輸出與可能的打包檔；這些內容不應與可維護的產品原始碼混在一起提交。
- **Alternatives considered:** 不建立忽略規則直接提交全部內容；只依靠手動 `git add` 控制；在之後發現污染再清理 repository。
- **Expected impact:** 降低意外提交私人資料或產物的風險，讓 GitHub repository 更乾淨，也更適合作為後續協作與備份基礎。
