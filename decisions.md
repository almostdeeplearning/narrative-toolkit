# Decisions

## Decision 1
- **Decision:** Add a dedicated `saveDraft` feature to store captured content as drafts.
- **Date:** 2026-04-05
- **Reason:** Users want to capture multiple X.com posts and save them locally before manually switching to GPT/Grok for verification.
- **Alternatives considered:** Rely only on `chrome.storage.local` without local file downloads; use only the existing library without explicit draft support.
- **Expected impact:** Improves workflow reliability by preserving drafts locally and allows users to manage and reuse captured content across extension sessions.
- **Current status note:** `saveDraft`-related legacy handlers still exist in the current graph, but they are no longer part of the main product surface. The current user-facing flow is centered on Side Panel ETL and Custom Flow.

## Decision 2
- **Decision:** Add a `verifyWiki` workflow button to generate `wiki.md` with a built-in truth-check section.
- **Date:** 2026-04-05
- **Reason:** The user requested a more structured way to validate content and produce wiki-style markdown from captured text.
- **Alternatives considered:** Keep only the original `startDistill` workflow; add a separate manual prompt template instead of a dedicated workflow.
- **Expected impact:** Provides a clearer path for fact-checking and content output, making the extension more useful for research and documentation tasks.
- **Current status note:** `verifyWiki`-related legacy handlers still exist in `background.js`, but they are not part of the current primary Side Panel workflow surface.

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
- **Current status note:** 這個固定寬度按鈕方案已被後續的 Side Panel 方案取代；目前寬度由使用者直接拖曳 Side Panel 邊界調整。

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

## Decision 10
- **Decision:** 將 Extension UI 從 Popup 升級為 Chrome Side Panel，作為唯一 UI。
- **Date:** 2026-04-22
- **Status:** ✅ 已實作（2026-05-03）
- **Reason:** Popup 在頁面導航時（如 x.com 點入單篇 post）會強制關閉；Side Panel 可在導航過程中保持開啟，且位置固定在右側不受影響。
- **Alternatives considered:** 維持 Popup（已做 Tab 記憶作為短期改善）；Content Script 浮動面板（CSS 隔離困難、工作量更大）；Web App（會失去 content script 萃取與 AI Tab 自動化，不適合）。
- **Expected impact:** 解決導航關閉問題、Popup 位置限制問題，使用者可一邊瀏覽 x.com 一邊操作工具。
- **Implementation notes:**
  - manifest.json：加 `sidePanel` 權限，移除 `action.default_popup`，加 `side_panel.default_path: sidepanel.html`
  - 新增 `sidepanel.html`（基於 popup.html，移除固定尺寸，body 改為 100% 填滿 panel）
  - background.js：在 `onInstalled` 中呼叫 `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })`，不使用 `chrome.action.onClicked`
  - popup.js 保持不動，sidepanel.html 暫時仍載入 popup.js（TODO：未來重命名為 sidepanel.js）
  - Settings Tab 移除「介面寬度」與「視窗高度」設定；字體大小與文字對比保留
  - 限制：Side Panel 固定在視窗右側，無法像 Popup 浮動定位；寬度由使用者拖曳決定
- **Current status note:** 以上 implementation notes 反映的是當時遷移階段的狀態。依目前 graph，`sidepanel.html` 實際載入的是 `src/sidepanel.js`，而 `src/popup.js` 已不存在。

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

## Decision 25
- **Decision:** 移除 X ETL 的 AI 後結構化步驟，改以 Prompt+Schema 在注入前合併的方式取代。
- **Date:** 2026-05-01
- **Reason:** 原有流程在 Grok 回應後再送至第二個 AI 做結構化整理，增加了一個不穩定的非同步步驟與額外等待時間；使用者期望的是能預先指定輸出格式，並在一次 Grok 對話中就取得已格式化的結果。
- **Alternatives considered:** 保留後結構化步驟但允許跳過；讓使用者在 Grok 回應後手動貼至另一個 AI 整理；在 background 自動串接兩個 AI 呼叫。
- **Expected impact:** 簡化 X ETL 為三個線性步驟（選擇 → 萃取 → 儲存），去除不必要的 AI 往返，結果更可預期，也降低整體出錯機率。

## Decision 26
- **Decision:** 新增 Schema 為獨立的第五個 Tab，作為格式模板的主要管理介面。
- **Date:** 2026-05-01
- **Reason:** 格式模板在 X ETL 與長文整理兩個工作流中都是共用的核心資源；若放在 Settings 會讓模板管理與系統設定混在一起，也無法提供足夠的編輯空間。
- **Alternatives considered:** 在 Settings Tab 中加入模板編輯區；在每個工作流 Tab 各自維護獨立的格式模板；改為從外部 JSON 匯入模板。
- **Expected impact:** 模板管理有獨立入口，使用者可在不影響工作流 Tab 的情況下新增、修改、刪除格式模板；兩個工作流 Tab 共享同一份模板庫，不需要各自維護。

## Decision 27
- **Decision:** 舊有格式模板 key（grokTpl / noteTpl / wikiTpl）以首次載入遷移方式整合至 schemaTemplates，遷移後舊 key 不再主動讀寫。
- **Date:** 2026-05-01
- **Reason:** 現有使用者的 storage 中可能已有自訂的 grokTpl / wikiTpl / noteTpl；若直接廢棄會導致資料遺失；若同時維護兩套資料結構則會造成長期同步負擔。
- **Alternatives considered:** 永久保留舊 key 並雙向同步；要求使用者手動重新輸入模板；在 Settings 加入一鍵遷移按鈕。
- **Expected impact:** 現有使用者的自訂模板在第一次開啟新版本時自動被納入 Schema 庫，不需要任何手動操作；舊 key 在遷移後自然廢用，不佔用主動讀寫路徑。

## Decision 28
- **Decision:** 以可展開 Card 取代分欄式 List-Detail（左側清單 + 右側編輯區）版面，作為 Prompts 與 Schema 兩個內容管理 Tab 的統一 UI 模式。
- **Date:** 2026-05-01
- **Reason:** 分欄版面在 Popup 固定寬度下兩欄都過窄，左側清單難以顯示完整名稱，右側編輯區也無足夠空間；可展開 Card 讓每筆項目在需要時才佔用完整寬度，平時保持緊湊。
- **Alternatives considered:** 保留分欄但調整比例；點選後以 Modal / 彈出層開啟編輯；改用全頁覆蓋式編輯頁面。
- **Expected impact:** 所有 Prompt 與 Schema 的名稱與預覽在同一捲動區中一目了然，選中項目後可 inline 編輯而不需要切換畫面，也不需要左右分欄各自捲動。

## Decision 29
- **Decision:** Prompt Manager 改用水平 Series Tab Bar 取代原本的左側欄系列清單，使系列切換與 Prompt Card 列表在同一視覺軸線上操作。
- **Date:** 2026-05-01
- **Reason:** 原左側欄系列清單佔用固定水平空間，與右側 Prompt 清單造成雙軸捲動問題；水平 Tab Bar 符合使用者在多個系列之間快速切換的心智模型，且釋放出完整垂直空間給 Prompt Card 列表。
- **Alternatives considered:** 保留左側欄但縮小寬度；以下拉選單取代系列清單；讓系列清單與 Prompt 清單同在一個垂直捲動區。
- **Expected impact:** 系列切換動作從「點選清單項目」改為「點選頂部 Tab」，視覺層次更清晰；Prompt Card 列表取得完整寬度，可展示更多資訊且不需要水平捲動。

## Decision 31
- **Decision:** 將 Distill Tab 的邏輯拆解為 5 個內部 Block 物件（DistillSourceBlock、DistillTaskBlock、DistillFormatBlock、DistillAIBlock、DistillRunBlock），全部保留在 `src/popup.js` 內。
- **Date:** 2026-05-03
- **Status:** ✅ 已實作（2026-05-03）
- **Reason:** Distill Tab 邏輯散落於全域變數、`loadSettings()`、`bindAll()`、`listenBg()` 之間，未來要加入「自訂流程」功能時難以安全插入新狀態；先以 Block 封裝讓各模組的責任邊界明確，再開始擴充功能。
- **Alternatives considered:** 直接在 `bindAll()` 內加入自訂流程邏輯（責任過重，難以維護）；拆至獨立檔案如 `distill-blocks.js`（此次不做，日後清理時再評估）；用 class 語法取代 plain object（過度設計，現有需求不需要繼承）。
- **Expected impact:** 各 Block 透過 `init(storageData)` 獨立初始化、透過 public getter 互通（`getContent()`、`getSelectedPrompt()`、`getSelectedSchema()`、`getAI()`），不再依賴全域 distill 變數；為「自訂流程」功能提供清楚的插入點。
- **Implementation notes:**
  - `loadSettings()` 改為回傳 `d`（整份 storage）；各 Block 的 `init(d)` 自行取所需欄位
  - 每個 Block 有 `isInitialized` guard，防止重複綁定事件
  - `DistillRunBlock.startDistill()` 只透過 public interface 取值，不讀全域變數
  - 全域 distill 狀態變數（`distillAI`、`distillSeriesId` 等）移除，改由各 Block 內部持有
  - Bug 修正：`DistillAIBlock` 原本誤用 `.ai-btn` selector，正確選擇器為 `.ai-pill`
  - `addSchema()` / `delSchema()` / schema cards `input` 事件改呼叫 `DistillFormatBlock._renderPicker()`

## Decision 30
- **Decision:** 整體 UI 改採緊湊型設計語言，以側欄 44px、頂欄 44px、縮小按鈕 padding 為基準，並引入 `btn-ghost` 次要按鈕樣式。
- **Date:** 2026-05-01
- **Reason:** 原有介面在 Popup 有限空間內佔用過多邊距與按鈕高度，導致主要內容的可視區域偏小；工具型介面應優先保留給實際工作內容的空間，而非 chrome（邊框、工具列）本身。
- **Alternatives considered:** 僅縮減特定區域的間距；改為抽屜式側欄以節省空間；將部分操作移至右鍵選單。
- **Expected impact:** 在相同 Popup 尺寸下，主要工作區可視高度增加；主要操作（btn-primary）與次要操作（btn-ghost）在視覺上有清楚的層級區分，減少操作介面的視覺雜訊。

## Decision 32
- **Decision:** 新增「自訂流程」（Custom Flow）Tab，以 5 個可獨立顯示／隱藏的 Block Card（Source、Task、Format、AI、Run）組成使用者可自由組合的自動化管線。
- **Date:** 2026-05-03
- **Reason:** 使用者需要一個比 Distill Tab 更靈活的工作流入口：可選擇性啟用特定步驟、預覽每個步驟的選擇狀態、一鍵依序執行，而不必每次都完整走過 Distill 的固定路徑。
- **Alternatives considered:** 在 Distill Tab 加入「進階模式」開關以暴露更多選項（耦合度高，難以獨立演化）；讓使用者用拖曳排序決定執行順序（此階段不需要，延後評估）。
- **Expected impact:** Distill Tab 維持原有固定流程不變；Custom Flow Tab 提供可組合的替代路徑，兩者共享相同的 Prompt 庫、Schema 庫與 background 訊息通道，不需要重複定義資料或新增 message type。

## Decision 33
- **Decision:** 以模組層級的 `activeDistillContext` 變數作為 background 訊息的路由器，決定 `LOG_DISTILL`、`DISTILL_DONE`、`ERROR` 應派送至 Distill Tab 還是 Custom Flow。
- **Date:** 2026-05-03
- **Reason:** Distill Tab 與 Custom Flow 共用相同的 `START_DISTILL` 訊息與 background 回應訊息；若無路由機制，兩個控制器都會收到對方的訊息或互相干擾。
- **Alternatives considered:** 為 Custom Flow 定義獨立的訊息類型（需修改 background.js，改動範圍擴大）；在每條訊息加入 `source` 欄位讓 background 端決定回傳目標（background 不應持有 UI 路由狀態）；以 Promise 封裝整個 distill 生命週期（需重構 background 訊息模型）。
- **Expected impact:** background.js 不需要任何修改；popup.js 以單一變數追蹤當前活躍的流程，發送前設定、收到 DISTILL_DONE 或 ERROR 後清除，確保兩個 Tab 的流程不會互相污染。

## Decision 34
- **Decision:** 當 Distill 的目標 AI 為 Grok 時，改用 `executeScript` 直接注入（同 ETL 的 `injectToGrok` + `pollGrok` 路徑），而非透過 `cs_ai.js` 的 storage 佇列方式。
- **Date:** 2026-05-03
- **Reason:** `cs_ai.js` 只在 `chatgpt.com`、`gemini.google.com`、`claude.ai` 三個 domain 上執行，不涵蓋 `x.com`；`cs_grok.js` 雖然在 `x.com/i/grok` 上執行，但只負責 ETL 的頁面就緒通知，不處理 Distill 任務。兩者的設計差距導致 Grok 作為 Distill 目標時，storage 中的 prompt 永遠無人取用，注入永遠不會發生。
- **Alternatives considered:** 將 `cs_ai.js` 的 manifest 覆蓋範圍擴大至 `x.com`（可能與 cs_grok.js 產生衝突且難以維護）；讓 cs_grok.js 同時處理 Distill prompt 注入（職責混亂）；只支援 Grok 半自動模式（使用者體驗降級）。
- **Expected impact:** Grok 作為 Distill 與 Custom Flow 的目標 AI 時可完整自動化執行，不需修改 manifest 或任何 content script；Grok 的注入行為與 ETL 一致，由 background.js 直接控制。

## Decision 35
- **Decision:** 在 Custom Flow 的「一鍵跑完全部」功能中，每個 Block 執行完畢後套用該 Block 各自設定的延遲時間，以 `setTimeout` 實作等待，而不移植 ETL 的 `pollGrok` 輪詢邏輯。
- **Date:** 2026-05-03
- **Reason:** Custom Flow 的延遲目的是讓使用者控制步驟之間的節奏（例如等待頁面載入、給 AI 回應時間），不是等待特定 DOM 穩定狀態；`pollGrok` 是針對 Grok 回應穩定性設計的，引入 Custom Flow 會增加不必要的複雜度。
- **Alternatives considered:** 對所有 Block 套用全域統一延遲（無法針對不同步驟調整）；移植 `pollGrok` 輪詢邏輯（過度設計，與現有 ETL 邏輯耦合）；完全不提供延遲（使用者無法控制步驟節奏）。
- **Expected impact:** 使用者可為每個 Block 獨立設定延遲秒數（含自訂輸入），設定值持久儲存；延遲邏輯簡單透明，日後可視需要升級為更精細的等待機制。

## Decision 36
- **Decision:** 將 5 個 Distill Block 物件從 `src/popup.js` 遷移至 `src/blocks/*.js` 獨立檔案，以 plain `<script>` tag 在 popup.js 之前載入，不使用 ES module。
- **Date:** 2026-05-03
- **Reason:** popup.js 因包含 5 個 Block 定義而過於龐大，降低可讀性與未來擴充的安全性；抽檔可讓每個 Block 有明確的單一檔案歸屬，也為 ETL、DST 未來共用這些 Block 做準備。
- **Alternatives considered:** 以 ES module（`type="module"`）+ `import` 語法管理依賴（需要解決跨檔案 mutable state 的共享問題，且需修改 popup-ui-patch.js 的全域存取方式，改動範圍較大）；以構建工具（如 esbuild）打包（增加開發流程依賴，與 Extension 直接載入原始碼的簡易開發模型不符）。
- **Expected impact:** popup.js 行數顯著減少，各 Block 檔案各司其職；Block 方法只在 `DOMContentLoaded` 之後被呼叫，此時 popup.js 已完整執行，`$`、`esc`、`series` 等全域名稱均可用，行為與重構前完全一致；未來若需讓 ETL 或 DST 使用相同 Block，只需在對應 HTML 加入 script tag。

## Decision 37
- **Decision:** 將主 UI 腳本從 `src/popup.js` 重命名為 `src/sidepanel.js`，並同步更新所有參照（`sidepanel.html`、`popup.html`、`NAV_MAP.md`、`status.md`）。
- **Date:** 2026-05-04
- **Reason:** 檔案名稱與其角色不符——自 Side Panel 遷移完成後，主要 UI 入口為 `sidepanel.html`，對應腳本應反映此語意，減少未來開發者的認知負擔。
- **Alternatives considered:** 保留 `popup.js` 名稱不動（會持續造成混淆，尤其是 `popup.html` 現在只是開發參考用）；改用 `main.js` 等通用名稱（語意過於寬泛，無法一眼辨識與 Side Panel 的對應關係）。
- **Expected impact:** 所有腳本參照與文件均指向 `src/sidepanel.js`；`popup.html` 同步更新（雖然不再被 Extension 載入），確保開發參考一致性；行為完全不變。

## Decision 38
- **Decision:** 移除 `sidepanel.html` 中 `#tab-prompts` 與 `#tab-schema` 的 `style="margin:-24px"` 內聯樣式。
- **Date:** 2026-05-04
- **Reason:** 這兩個 `panel-fill` 面板用負 margin 抵消父容器 `panel-scroll` 的 `padding: 24px`，使卡片列表能貼邊顯示。然而在 flex 高度計算下，負 margin 會導致子元素總高度溢出，讓 `cards-scroll`（`flex: 1`）佔用超過視窗高度的空間，將 `add-row`（固定在底部的「＋ 新增」列）完全推出可見範圍外，造成使用者看不到新增按鈕。
- **Alternatives considered:** 改用 `padding: 0` 覆蓋父層 padding（需配合父層 CSS 修改，有連鎖影響）；以絕對定位固定 `add-row` 到底部（會脫離 flex flow，增加維護複雜度）；保留負 margin 並對 `cards-scroll` 加上明確 `max-height` 計算（脆弱，依賴具體像素值）。
- **Expected impact:** `add-row` 恢復正常顯示；Prompts 與 Schema Tab 的「新增 Prompt」與「新增 Schema」按鈕對使用者可見；`panel-fill` 的 flex 高度計算恢復正確，不再溢出視窗。

## Decision 39
- **Decision:** 在 Prompt 與 Schema 編輯器的 `input` 事件後，加入防抖動（debounce, 800 ms）的 `_showSaveToast()` 提示，顯示「✓ 已儲存」。
- **Date:** 2026-05-04
- **Reason:** 自動儲存已實作（每次 `input` 觸發 `chrome.storage.local.set`），但完全沒有視覺反饋，使用者不知道編輯結果是否已儲存，產生操作不確定感。
- **Alternatives considered:** 在每個欄位旁加入靜態「自動儲存」說明文字（佔版面，且無法反映「剛剛存了」的即時感）；移除自動儲存，改用明確的「儲存」按鈕（破壞現有無縫編輯體驗）；顯示帶有時間戳的儲存狀態列（過於複雜，超出目前需求）。
- **Expected impact:** 使用者在編輯 Prompt 文字、Schema 名稱或 Schema 內容後，800 ms 內會在畫面底部看到短暫的「✓ 已儲存」提示，確認儲存已發生；防抖動設計確保連續快速輸入時不會頻繁觸發 toast，僅在停止輸入後顯示一次。

## Decision 40
- **Decision:** 全面放大介面基礎字體：body 14px、按鈕 12px、label / field-label 11px、輸入框 15px。
- **Date:** 2026-05-05
- **Reason:** 原有字體（body 隱含系統預設、按鈕 9px、label 9px、輸入框 13px）在長時間使用時可讀性不足，尤其在高解析度螢幕上容易造成視覺疲勞；工具型介面應以內容可讀性為優先，而非刻意保持緊湊。
- **Alternatives considered:** 僅放大特定元素、保持其他不變（造成字體層次不一致）；以使用者設定取代固定基礎值（增加使用者負擔，且基礎值本身就應該是合理的預設）；維持原有字體大小不變（可讀性問題持續存在）。
- **Expected impact:** 整體介面在正常閱讀距離下更易辨識；按鈕文字與 label 的層次關係維持（12px vs 11px），不因放大而混淆；輸入框文字 15px 減少長文輸入時的辨識負擔；使用者仍可透過 Settings 的字體模式（comfortable / large）進一步調整，兩者疊加而非互相取代。

## Decision 41
- **Decision:** 將介面主色票調整為微暖色調：背景 `--bg` 從純黑 `#0A0A0A` 改為微暖深灰 `#13110F`；次要文字 `--text2` 從 `#888888` 提升至 `#B8B2A6`；靜音文字 `--text3` 從 `#444444` 提升至 `#7A7468`。
- **Date:** 2026-05-05
- **Reason:** 原有 `#0A0A0A` 純黑背景在長時間使用時對眼睛刺激較大；`#444444` 的 `text3` 在深色背景上對比比僅約 2.1:1，低於 WCAG AA 最低門檻（3:1），幾乎不可讀；`#888888` 的 `text2` 雖可讀但缺乏暖度，整體色調過冷。
- **Alternatives considered:** 改為亮色主題（破壞既有的深色工具型產品識別）；只調整 `text3` 而保留純黑背景（治標不治本，整體冷暖不協調）；以 CSS filter 整體暖化（影響範圍難以控制，可能影響功能性顏色如 success / danger）。
- **Expected impact:** 背景微暖化減少長時間使用的光暈感（halo effect）；`text3` 提升至約 4.2:1 的對比比，使 nav item、field-label、step text 等元素符合 WCAG AA 標準；`text2` 與 `text3` 的層次差距維持可辨識（`#B8B2A6` vs `#7A7468`），整體色調統一為暖灰系，與產品定位一致。

## Decision 42
- **Decision:** 建立 `.select-compact` 共用 CSS class，作為所有 `<select>` dropdown 的統一樣式層，套用 `appearance: none` 讓 CSS 完全接管渲染，不依賴 OS 原生 UI。
- **Date:** 2026-05-05
- **Reason:** Chrome 的 `<select>` 元素預設使用 OS 原生 UI 元件渲染，忽略 CSS `font-family` 與 `font-size` 設定，導致各 dropdown 字型與尺寸不一致，無法與介面其他元素對齊。在 Extension 環境中加入 `font-family: inherit` 的 reset 也無法解決此問題，因為根本原因在於渲染路徑而非繼承鏈。
- **Alternatives considered:** 逐一對每個 `<select>` 加入 inline style 覆蓋（難以維護，無法保證一致性）；改用自訂 div + ul 實作 dropdown（工作量大，需處理無障礙與鍵盤操作）；接受原生樣式不做統一（字型不一致問題持續，違背工具型介面的設計標準）。
- **Expected impact:** 所有 dropdown（ETL Prompt 選擇、Custom Flow Preset 選擇、Prompts tab 系列選擇）統一呈現為 `12px` Noto Sans TC、高度 `28px` 的緊湊樣式，與介面其他輸入元件視覺一致；自訂 SVG 箭頭維持視覺提示；新增 `<select>` 時只需套用 `.select-compact` 即可自動符合設計標準，不需逐案處理。

## Decision 43
- **Decision:** 將 X ETL 的結果回收流程改為半手動：Card 04 只送出 Prompt，不再自動等待或抓取 Grok 回覆；Card 05 改由使用者手動截取當前回覆、微調後再儲存。
- **Date:** 2026-05-07
- **created:** 05-07 17
- **Reason:** 自動擷取經常抓到前一輪或其他卡片送出的舊回覆，問題核心不在 timeout 文案，而在「系統猜測目前應該抓哪一則回覆」這件事本身不可靠。
- **Alternatives considered:** 保留自動擷取、只調整 timeout 文案；繼續優化 `pollGrok()` selector 與輪詢時機；完全移除 ETL 的結果處理區、要求使用者自行複製貼上。
- **Expected impact:** ETL 的送出與結果回收責任切分更清楚；使用者可自行決定 Grok 回覆完成後的截取時機，降低抓錯回覆的風險；Card 05 成為結果確認、微調與儲存的明確出口。

## Decision 44
- **Decision:** 在分享版先加入最小 `中文 / English` 切換，僅覆蓋目前可見的 Side Panel UI labels，並將偏好儲存在 `chrome.storage.local.uiLanguage`。
- **Date:** 2026-05-07
- **created:** 05-07 21
- **Reason:** 目前使用者需要對外展示與分享擴充功能，但完整 i18n 系統會擴大改動範圍；以小字典與 Topnav toggle 先覆蓋可見文案，可在不改動 DOM ids、storage keys、prompt/schema/user preset 內容的前提下快速提供英文介面。
- **Alternatives considered:** 直接導入完整 i18n 架構（超出本次釋出需求）；只翻 Topnav 不翻工作流內容（對外展示仍不完整）；改以瀏覽器語系自動切換（不可控，且分享版需要明確可切換入口）。
- **Expected impact:** 分享版可在中文與英文之間快速切換；文件、storage 與內部程式命名不需大規模重構；後續若要正式導入完整 i18n，仍可在現有 key/dictionary 基礎上擴充。

## Decision 45
- **Decision:** 將已下架的 `tab-distill` 舊 UI shell 從 `sidepanel.html` 移除，但保留 `Distill*Block` 檔名與底層 runtime 路徑，暫不進行內部重命名。
- **Date:** 2026-05-07
- **created:** 05-07 21
- **Reason:** 分享版只需要目前可見的 Side Panel surface；保留已下架 Tab 的 DOM 會干擾英文文案校稿與 UI 維護判讀，但立即重命名整批 `Distill*Block` 又會把本次需求擴大成重構任務。
- **Alternatives considered:** 保留 dormant DOM shell（造成文件與實際 UI surface 不一致）；同步將 `Distill*Block`、storage key、message path 全面改名為 Workflow（改動過大，風險高）；重新接回 Distill Tab（不符合目前產品方向）。
- **Expected impact:** 分享版文件與實際 UI surface 對齊；對外不再出現已下架 Distill 面板；內部仍可沿用既有 `START_DISTILL` 與 `Distill*Block` 路徑，降低本次改動風險。

## Decision 46
- **Decision:** 分享版英文模式的可見 UI 不再維持過重的 mono / all-caps 呈現；優先以較短的英文產品文案搭配一般 UI 字體，僅保留必要的結構性 mono 元素。
- **Date:** 2026-05-07
- **created:** 05-07 21
- **Reason:** 最小語言切換雖已可用，但在英文模式下，Workflow card title、Delay label、Topnav label 與小按鈕若持續使用過度壓縮的 mono 與全大寫，會讓分享版看起來更像開發介面而非可對外展示的產品 UI。
- **Alternatives considered:** 維持既有字體策略只改翻譯文字（英文觀感仍生硬）；全面重做整套字體系統（超出這次分享版需求）；只針對單一句子調 wording、不動樣式（無法解決整體觀感問題）。
- **Expected impact:** 英文模式下的 Topnav、Workflow、ETL 關鍵按鈕與 helper copy 更接近產品介面語氣；現有結構與 DOM 不需重組；後續若要擴大英文 surface，可在 `data-lang="en"` 基礎上繼續做更細的樣式分流。

## Decision 47
- **Decision:** 將 ETL Card 03 的 `extractAI` 正式接線為多 AI 送出路由，並在 Grok 目標下新增 `extractGrokMode`，區分完整 Grok 頁面與 x.com 頁內小視窗兩種注入目標。
- **Date:** 2026-05-14
- **Reason:** ETL 的目標 AI 選擇若只停留在 UI/state 層，會造成使用者對功能能力的誤判；同時 Grok 產品面已新增頁內小視窗對話模式，使用者需要在瀏覽 x.com 內容時直接把 ETL Prompt 注入同頁小視窗，而不是強制切去 `x.com/i/grok`。
- **Alternatives considered:** 維持 `extractAI` 為 placeholder（降低誤導風險但無法滿足實際工作流）；只支援完整 Grok 頁面、不支援小視窗（無法對應最新使用情境）；將 ETL 改成沿用 `cs_ai.js` storage 佇列模式（對 send-only ETL 而言過重，且 Grok 不適用）。
- **Expected impact:** ETL 送出會真正依 `extractAI` 切換至 GPT / Gemini / Claude / Grok；Grok 使用者可在完整頁面與頁內小視窗之間選擇；Card 05 的手動截取也改為依當前 ETL 目標 AI 走對應抓取 selector，而不再假設永遠是 Grok。

## Decision 48
- **Decision:** 將 Custom Flow 的 AI Block 與 Grok 路由同步升級為 `Grok Inline / Grok Page`，並讓 `START_DISTILL` 在 Grok 目標下帶上 `grokMode`。
- **Date:** 2026-05-14
- **Reason:** ETL 與 Custom Flow 都是對外可見的主要工作流，若只有 ETL 支援 Grok inline/page 分流，會造成能力不一致與心智模型混亂；使用者也會自然期待 Workflow 的 AI 選擇能與 ETL 保持相同顆粒度。
- **Alternatives considered:** 只更新 ETL，不動 Custom Flow（功能表面不一致）；讓 Custom Flow 保留單一 Grok pill，再額外加 dropdown（交互複雜度較高，且已確認使用者偏好直接用 pills）；將 Grok inline/page 合併成背景自動判斷（隱含行為過多，不利於理解與除錯）。
- **Expected impact:** Custom Flow 的 AI block 直接顯示 `Grok Inline / Grok Page`，使用者可明確指定目標；背景 Grok distill 路徑依 `grokMode` 決定使用 x.com inline 小視窗或 `x.com/i/grok` 完整頁面；未來 ETL 與 Flow 共用同一套 Grok 選擇語意。

## Decision 49
- **Decision:** 將 Custom Flow `Format` block 的空選項語意改為「不套用 Schema」，並在 `Prompt / Schema` 都未選時改為直接把原文送到 AI，而不是自動存草稿。
- **Date:** 2026-05-14
- **Reason:** 原本的預設文案「不用 Schema，直接存草稿」會讓使用者誤以為 `Format` block 本身控制存稿邏輯，並與 Run block 的 autosave 勾選產生語意衝突；實際需求是讓未選模板時也能直接把原文送給 AI 討論，而是否自動存檔只由 Run block 決定。
- **Alternatives considered:** 保留自動存草稿 fallback（容易與 autosave 衝突）；把空狀態視為錯誤並阻止執行（會降低自由討論原文的彈性）；新增額外 toggle 控制「無模板時送 AI / 存草稿」（增加複雜度，不符合低風險修改方向）。
- **Expected impact:** `Format` block 的空選項更貼近真實行為；當使用者未選 Prompt 與 Schema 時，Custom Flow 會以原文直接送到 AI，適合自由討論；草稿下載只在使用者明確按下「存草稿」或開啟 autosave 且回收結果時發生。

## Decision 50
- **Decision:** 將目前的 X / Grok 工作流正式定位為 browser-native 的敘事分析流程：ETL 多 AI 已接線、Grok 支援 `inline / page` 分流、Custom Flow 同步支援 Grok 分流，且 x.com 來源擷取優先保留較廣的 thread / narrative 脈絡，再交由後續 AI 步驟去噪。
- **Date:** 2026-05-15
- **Reason:** 目前已確認的產品方向不是通用聊天包裝器，而是利用 Grok 與 x.com 生態的貼身整合，在原生瀏覽情境中保留即時敘事上下文、回覆互動與觀點演化；在這個前提下，規格層也接受 best-effort browser automation 作為現階段可承受的實作成本。
- **Alternatives considered:** 將產品定義為泛用多 AI launcher（較容易擴張但會稀釋 X 脈絡價值）；在擷取階段就強力裁切來源內容（較省 token，但容易過早丟失 thread / sentiment shift 訊號）；只接受高穩定 API-first 路徑（會避開目前最有區辨性的瀏覽器原生工作流）。
- **Expected impact:** 後續 ETL、Custom Flow、來源擷取與 UI 決策會優先支持貼近 x.com 現場的工作流；同時文件與規格會把 browser-native、自動化 selector 依賴與手動回收路徑視為當前架構的一部分，而非暫時例外。

## Decision 51
- **Decision:** 將 ETL 主表面收斂為 `Grok-first, GPT-fallback`：保留 `Grok Inline`、`Grok Page` 與 `GPT` 作為可見主選項，暫時隱藏 `Gemini` / `Claude` 的 ETL UI 入口，但保留底層路由以降低回退成本。
- **Date:** 2026-05-15
- **Reason:** ETL 的核心價值已明確轉向 Grok + X narrative context，而每新增一個主表面 AI 目標都會帶來額外的 selector 維護與 browser automation 成本；在 Gemini / Claude 不是當前核心工作流的前提下，先縮小可見 surface 是較低風險的產品收斂方式。
- **Alternatives considered:** 維持 ETL 多 AI 全量可見（彈性高但維護面過廣）；直接刪除 Gemini / Claude 底層路由（回退成本高，對未來恢復或進階流程不友善）；只保留 Grok、不保留 GPT fallback（會降低一般性備援能力）。
- **Expected impact:** ETL 的主使用路徑更聚焦於 Grok；維護與測試優先序可集中在 `Grok Inline`、`Grok Page` 與 `GPT`；Gemini / Claude 仍可在未來需要時恢復或轉為進階工作流，而不必立即重建底層注入與截取路徑。

## Decision 52
- **Decision:** 將原本偏收藏語意的 `Prompt Library / Format Library` 正式收斂為 `Prompt Manager / Format Manager`，並把 Prompt / Schema 區塊定位為可直接編修、匯入、匯出、刪除的管理介面。
- **Date:** 2026-05-17
- **created:** 05-17 19
- **Reason:** 目前這兩個區塊的主要價值已不是被動瀏覽，而是持續新增、改名、編輯、刪除、匯入與匯出；若仍維持 Library / 庫 的命名，會弱化可操作性，也提高非技術使用者對 `Schema` 一詞的理解門檻。
- **Alternatives considered:** 保留 `Prompt Library / Schema Library` 命名不動；僅修改中文名稱、不調整英文；把管理功能拆到 Settings 或其他次級入口。
- **Expected impact:** 導覽語意更貼近實際功能；使用者能更快理解這兩個 tab 是主動管理區而不是靜態資料庫；README、Navigation Map 與 UI 文案可維持一致。

## Decision 53
- **Decision:** Prompt 與 Schema 管理區維持自動儲存，但必須補上明確的安全操作與可見回饋，包括 `取代匯入 / 合併匯入`、Markdown 匯出、`刪除系列`、空名稱提示與 `已自動儲存` 提示。
- **Date:** 2026-05-17
- **created:** 05-17 19
- **Reason:** 原本的自動儲存與匯入匯出能力雖然可用，但缺乏足夠的操作語意與可見回饋，容易讓使用者誤判風險；尤其在系列名稱清空、舊資料匯入與外部編輯需求下，UI 若沒有明確提示，會放大不確定感。
- **Alternatives considered:** 改回每張卡片手動按「儲存」；只保留 JSON 匯出，不提供 Markdown；把系列刪除隱含在清空名稱後存檔；維持單一覆蓋式匯入。
- **Expected impact:** Prompt / Schema 管理流程更可預期；使用者可以安全地做合併匯入與外部 Markdown 編輯；自動儲存保留輕量編輯體驗，但不再是不可見的隱性行為。
