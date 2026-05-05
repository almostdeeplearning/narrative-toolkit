# Navigation Map

This document maps the current Chrome Extension Side Panel UI, DOM IDs, JavaScript bindings, background messages, and storage keys. Use it before changing `sidepanel.html`, `popup.html`, `src/sidepanel.js`, `src/popup-ui-patch.js`, or block files under `src/blocks/`.

## Entry Points

- `manifest.json`
  - `side_panel.default_path`: `sidepanel.html` (primary UI — Chrome Side Panel)
  - `action.default_popup`: removed; clicking the extension icon opens the Side Panel via `setPanelBehavior`
  - `background.service_worker`: `src/background.js`
  - content scripts:
    - `src/cs_grok.js` on `https://x.com/i/grok*`
    - `src/cs_ai.js` on ChatGPT, Gemini, Claude

- `sidepanel.html`
  - Primary UI entry point; based on `popup.html` with fixed dimensions removed.
  - Body fills Side Panel height (`100%`); width is user-controlled by dragging the panel edge.
  - Load order: Distill block files → ETL Card block files → `src/sidepanel.js` → `src/popup-ui-patch.js`.
  - Must not contain inline `<script>...</script>` or inline event handlers.

- `src/blocks/` (plain-script files, loaded before sidepanel.js)
  - Distill blocks:
    - `DistillSourceBlock.js` — source text capture and page grabbing
    - `DistillTaskBlock.js` — prompt series selection and prompt picker
    - `DistillFormatBlock.js` — schema template selection and preview
    - `DistillAIBlock.js` — target AI selection
    - `DistillRunBlock.js` — distill execution, result display, and library rendering
  - ETL blocks:
    - `ETLCard1Block.js` — Prompt card HTML
    - `ETLCard2Block.js` — Schema card HTML
    - `ETLCard3Block.js` — Target AI card HTML
    - `ETLCard4Block.js` — Run extract card HTML
    - `ETLCard5Block.js` — Save result and recent extract library HTML
  - Legacy, not loaded:
    - `ETLStep1Block.js`
    - `ETLStep2Block.js`
    - `ETLStep3Block.js`
  - Each active file defines one global `const ...Block = {...}` object. Methods call globals (`$`, `esc`, `series`, etc.) at runtime after sidepanel.js has loaded.

- `popup.html`
  - Retained as development/preview reference only. Not loaded by the extension.

- `src/sidepanel.js`
  - Main workflow logic, storage, message sending, render functions, and event binding.
  - Distill-related logic remains organized into 5 Block objects: `DistillSourceBlock`, `DistillTaskBlock`, `DistillFormatBlock`, `DistillAIBlock`, `DistillRunBlock`, but the Distill Tab UI is currently down-ranked and not initialized in Phase 1. The shared `renderCF()` / getter parts are still used by Custom Flow.
  - ETL Tab DOM is rendered by `initETLTab()` using `ETLCard1–5Block`; this must run synchronously at the start of DOMContentLoaded before `popup-ui-patch.js` step-state initialization.
  - Height/width UI preference functions removed (`applyPopupHeight` deleted; width init removed).

- `src/popup-ui-patch.js`
  - CSP-safe UI glue for Topnav-compatible navigation, step state, and distill prompt preview visibility.

## Top-Level Navigation

The current UI uses a horizontally scrollable Topnav. The buttons still use `.nav-item[data-tab]` for compatibility and map to panel IDs:

| Nav | Button selector | Panel ID | Purpose |
|---|---|---|---|
| Extract | `.nav-item[data-tab="extract"]` | `tab-extract` | X/Grok ETL workflow |
| Flow | `.nav-item[data-tab="flow"]` | `tab-flow` | Custom Flow — composable 5-block automation pipeline |
| Prompts | `.nav-item[data-tab="prompts"]` | `tab-prompts` | Prompt series manager |
| Schema | `.nav-item[data-tab="schema"]` | `tab-schema` | Format template library |
| Settings | `.nav-item[data-tab="settings"]` | `tab-settings` | Automation, local storage, and layout |

Navigation is coordinated by:

- `switchTab(name)` in `src/sidepanel.js`
- `initSidebarNavigation()` in `src/popup-ui-patch.js`
- `topbarTitle` is updated by `setActiveNav(tab)` in `src/popup-ui-patch.js`

Topbar actions (shown/hidden per tab):

- `topbarPromptsActions` — currently an empty compatibility container; Prompt actions now live inside the Prompts tab content area
- `topbarSchemaActions` — currently an empty compatibility container; Schema actions now live inside the Schema tab content area

Storage key:

- `lastTab`

Phase 1 Distill off-ramp note:

- `tab-distill` still exists in `sidepanel.html` as a dormant DOM shell for now, but there is no topnav entry.
- `switchTab('distill')` is now redirected to `flow`.
- Distill `renderDistill()` / `init()` calls are disabled during `DOMContentLoaded`.

## Extract Tab

Panel: `tab-extract`

### ETL Card Rendering

The tab is rendered dynamically by `initETLTab()` in `src/sidepanel.js`.

Active block files:

- `ETLCard1Block.js` — Card 01 Prompt
- `ETLCard2Block.js` — Card 02 Schema
- `ETLCard3Block.js` — Card 03 Target AI
- `ETLCard4Block.js` — Card 04 Run Extract
- `ETLCard5Block.js` — Card 05 Save Result and recent extract library

Important timing rule:

- `initETLTab()` must be called at the start of DOMContentLoaded, before any `await`, so `popup-ui-patch.js` can find ETL DOM IDs during `initStepState()`.

### Card Indicator

DOM IDs:

- `etlSteps`
- `sn1`, `st1`: visible step indicator in Card 01
- `sn2`, `st2`: hidden compatibility spans
- `sn3`, `st3`: hidden compatibility spans

Managed by:

- `setStep(n)` in `src/popup-ui-patch.js` (loops 1–3)
- Mutation observer watches `extractResultSection` style attribute:
  - visible → step 3
  - hidden → step 1
- Card UI now uses the same `cf-card` / `cf-card-head` / `cf-card-body` shell as Custom Flow, with per-card collapse toggles via `data-etl-toggle`.

### Card 01: Prompt

DOM IDs:

- `stepSection1`
- `extractSeriesSel` — series dropdown
- `extractPromptList` — prompt dropdown (`<select>`)
- `extractPromptPreview` — selected prompt preview area
- `promptList` — legacy active prompt queue container; retained for compatibility with existing render/state code

JS bindings:

- `extractSeriesSel change` updates `extractSeriesId`, then `renderExtractPromptList()`
- `extractPromptList change` updates the selected prompt preview
- `promptList` delegated delete/edit bindings remain for compatibility with existing prompt queue behavior

Render functions:

- `renderPrompts()`
- `renderExtractPromptPicker()`
- `renderExtractPromptList()`

Storage keys:

- `prompts`
- `promptSeries`
- `extractSeriesId`

### Card 02: Schema

DOM IDs:

- `extractSchemaSel` — schema template dropdown (optional)
- `extractSchemaPreview` — preview of selected schema text

JS bindings:

- `extractSchemaSel change` updates `extractSchemaId`, then `updateExtractSchemaPreview()`

Render functions:

- `renderExtractSchemaPicker()`
- `updateExtractSchemaPreview()`

Storage keys:

- `extractSchemaId`
- `schemaTemplates`

### Card 03: Target AI

DOM IDs:

- `extractAiSel` — container for `.ai-pill` buttons

JS bindings:

- `.ai-pill click` updates module-level `extractAI`, toggles active pill state, and saves `extractAI` to `chrome.storage.local`

Storage key:

- `extractAI`

Important current limitation:

- `extractAI` is persisted UI state only. `startExtract()` does not yet use it; extraction still opens `x.com/i/grok` and sends `START_EXTRACT` to the Grok path.

### Card 04: Run Extract

DOM IDs:

- `stepSection2`
- `startBtn`
- `stopBtn`
- `delayInput`
- `prog`
- `progFill`
- `progTxt`
- `extractLog`

JS bindings:

- `startBtn click` calls `startExtract()` — concatenates selected prompt text and selected schema text as `prompt.text + "\n\n" + schema.text`
- `stopBtn click` sends `STOP`

Messages sent to background:

- `START_EXTRACT`
- `STOP`

Messages received from background:

- `PROGRESS`
- `LOG_EXTRACT`
- `EXTRACT_DONE`
- `ERROR`

Storage keys:

- `delaySeconds`

### Card 05: Save Result

DOM IDs:

- `extractResultSection` — hidden until extraction completes; visibility drives step indicator
- `copyExtractBtn`
- `saveExtractBtn`
- `extractResultText`

JS bindings:

- `copyExtractBtn click` copies `lastExtractResult` to clipboard
- `saveExtractBtn click` calls `saveExtractResult()` — downloads `.md`

State variable:

- `lastExtractResult` — in-memory markdown string, not persisted

### Extract Library

DOM IDs:

- `extractLibToggle`
- `extractLibCount`
- `extractLibChevron`
- `extractLibList`

JS bindings:

- Toggle click opens/closes library list
- Delegated library actions: `copyDocByName`, `dlDocByName`, `delDocByName`

Render function:

- `renderExtractLibrary()`

Storage key:

- `library`, filtered to `fmt === "extract"`

## Distill Tab

Panel: `tab-distill`

### Source Text

DOM IDs:

- `charCount`
- `grabPageBtn`
- `rawText`

JS bindings:

- `grabPageBtn click` calls `grabPage()`
- `rawText input` updates `charCount`

Chrome APIs:

- `chrome.tabs.query`
- `chrome.scripting.executeScript`

### Schema And Prompt Selection

DOM IDs:

- `saveDraftBtn` — saves raw text as draft without AI
- `distillSchemaSel` — schema template dropdown
- `clearDistillSchemaBtn` — clears schema selection
- `distillSchemaPreview` — `<pre>` preview of selected schema text
- `distillSeriesSel` — series dropdown for prompt picker
- `clearDistillPromptBtn` — clears series/prompt selection
- `distillPromptList` — chip row of prompts from selected series
- `distillSelectedPromptArea` — shown when a prompt is selected
- `distillSelectedPromptText` — preview of selected prompt text

JS bindings (owned by `DistillSourceBlock`, `DistillTaskBlock`, `DistillFormatBlock`):

- `saveDraftBtn click` → `DistillRunBlock.saveDraft()`
- `distillSchemaSel change` → `DistillFormatBlock` updates internal `schemaId`, calls `_updatePreview()`
- `clearDistillSchemaBtn click` → `DistillFormatBlock` clears `schemaId`
- `distillSeriesSel change` → `DistillTaskBlock` updates internal `seriesId`, clears `promptIdx`, re-renders
- `clearDistillPromptBtn click` → `DistillTaskBlock` clears selection
- `distillPromptList click [data-action="selectDistillPrompt"]` → `DistillTaskBlock._selectPrompt(idx)`
- `initDistillSelectedPromptArea()` in `src/popup-ui-patch.js` shows/hides preview based on `data-empty`

Storage keys:

- `library`
- `distillFolder`
- `schemaTemplates`
- `distillSchemaId`
- `promptSeries`
- `distillSeriesId`
- `distillPromptIdx`

### AI Distill

DOM IDs:

- `distillAiSelect`
- `distillBtn`
- `stopDistillBtn`
- `cfAutoSaveDistill`
- `distillLog`

JS bindings (owned by `DistillAIBlock` and `DistillRunBlock`):

- AI selector buttons (`.ai-pill`) → `DistillAIBlock` updates internal `ai`, saves to storage
- `distillBtn click` → `DistillRunBlock.startDistill()` (reads other blocks via public getters)
- `stopDistillBtn click` sends `STOP`
- `cfAutoSaveDistill change` stores to `cfAutoSave` immediately

Messages sent to background:

- `START_DISTILL`
- `DOWNLOAD_MD`
- `STOP`

Messages received from background:

- `DISTILL_DONE`
- `LOG_DISTILL`
- `ERROR`

Storage keys:

- `distillAI`
- `cfAutoSave`
- `fullAuto`
- `library`
- `distillFolder`

### Distill Result

DOM IDs:

- `distillResponseSection`
- `distillResultName`
- `copyDistillBtn`
- `dlDistillBtn`
- `distillResponseText`

JS bindings:

- `copyDistillBtn click` copies `lastDistillResult.content`
- `dlDistillBtn click` sends `DOWNLOAD_MD`

Shown after:

- `DISTILL_DONE`; result content is populated when the current autosave toggle is enabled

### Distill Library

DOM IDs:

- `distillLibToggle`
- `distillLibCount`
- `distillLibChevron`
- `distillLibList`

Render function:

- `DistillRunBlock.renderLibrary()`

Storage key:

- `library`, filtered to `fmt in ["note", "wiki", "draft"]`

## Prompts Tab

Panel: `tab-prompts` (`panel-fill`, no internal scroll — layout managed by flex children)

### Prompt Actions Bar

DOM IDs:

- `importPromptsBtn` — opens `promptImportInput` for JSON import
- `exportPromptsBtn` — exports `promptSeries` as JSON
- `promptImportInput` — hidden file input for Prompt import

### Series Tab Bar

DOM IDs:

- `seriesTabbar` — rendered by `renderTabbar()`; contains the series dropdown and action buttons
- `seriesSelect` — prompt series dropdown
- `editSeriesBtn` — opens `editSeriesBar`
- `tabAddSeriesBtn` (inside tabbar) — shows `newSeriesBar`

JS bindings:

- `seriesSelect change` updates `currentSeriesId`, closes open add/edit rows, re-renders cards
- `editSeriesBtn click` opens `editSeriesBar` for the current series
- `tabAddSeriesBtn click` shows `newSeriesBar`

### Prompt Cards

DOM IDs:

- `seriesCards` — scroll area; rendered by `renderCards()`

Card pattern:

- Each prompt is a `.pcard` with a `.pcard-head` (click to expand) and `.pcard-body` (hidden unless expanded)
- Header shows a small pencil hint next to the prompt name
- Expanded body contains a `.prompt-name-input`, `.pcard-editor` textarea (auto-grows), char count footer, and copy button; header actions keep delete only
- `expandedCardIdx` (JS state) tracks which card is open; only one at a time

JS bindings (event delegation on `seriesCards`):

- `.pcard-head click` toggles `expandedCardIdx`, re-renders
- `.prompt-name-input input [data-action="renamePrompt"]` auto-saves `series[].prompts[idx].name`, updates the visible card title, and calls `_showSaveToast()`
- `[data-action="copyOneCard"] click` copies the selected prompt text to the clipboard
- `[data-action="delCard"] click` calls `delCard(idx)`
- `.pcard-editor input` auto-saves `series[].prompts[idx].text`, updates char count, auto-grows textarea, calls `_showSaveToast()`

Render functions:

- `renderTabbar()`
- `renderCards()`
- `renderSeries()` — thin wrapper calling `renderTabbar()`
- `renderSeriesPrompts()` — thin wrapper calling `renderCards()`

Helpers:

- `excerpt(text)` — 72-char preview with ellipsis
- `showToast(msg)` — bottom toast, 2.2 s auto-dismiss
- `_showSaveToast()` — debounced wrapper (800 ms) around `showToast`; shows "✓ 已儲存" after the user stops typing; called by Prompt and Schema input handlers after `chrome.storage.local.set`

State variables:

- `expandedCardIdx` — index within current series, or `null`

### Add Prompt Row

DOM IDs:

- `addPromptRow` — visible when a series is selected; hidden otherwise
- `addPromptTrigger` — click to reveal `addPromptForm`
- `addPromptForm` — `.add-form`; open class added on trigger click
- `newSeriesPromptName`
- `newSeriesPromptText`
- `cancelAddPrompt`
- `confirmAddPrompt`

JS bindings:

- `addPromptTrigger click` opens form
- `cancelAddPrompt click` calls `closeAddForm()`
- `confirmAddPrompt click` calls `addSeriesPrompt()`
- `newSeriesPromptText keydown Ctrl/Cmd+Enter` calls `addSeriesPrompt()`
- `newSeriesPromptText keydown Escape` calls `closeAddForm()`

### New Series Bar

DOM IDs:

- `newSeriesBar` — `.new-series-bar`; shown when `tabAddSeriesBtn` is clicked
- `newSeriesName`
- `addSeriesBtn`
- `cancelNewSeries`

JS bindings:

- `addSeriesBtn click` calls `addSeries()`
- `cancelNewSeries click` hides bar
- `newSeriesName keydown Enter` calls `addSeries()`

### Edit Series Bar

DOM IDs:

- `editSeriesBar` — inline rename row shown from `editSeriesBtn`
- `editSeriesName`
- `saveSeriesNameBtn`
- `cancelEditSeries`

JS bindings:

- `saveSeriesNameBtn click` calls `saveCurrentSeriesName()`
- `editSeriesName keydown Enter` calls `saveCurrentSeriesName()`
- `editSeriesName keydown Escape` calls `closeEditSeriesForm()`
- `cancelEditSeries click` calls `closeEditSeriesForm()`

Storage keys:

- `promptSeries`
- `currentSeriesId`
- `prompts`

## Schema Tab

Panel: `tab-schema` (`panel-fill`, same layout as Prompts tab)

### Schema Cards

DOM IDs:

- `schemaCards` — scroll area; rendered by `renderSchemas()`

Card pattern (same `.pcard` classes as Prompts tab):

- Each schema is a `.pcard` with a `.pcard-head` and `.pcard-body`
- Header shows a small pencil hint next to the schema name
- Expanded body contains a `.schema-name-input` (inline name edit), `.pcard-editor` textarea, char count footer, and copy button; header actions keep delete only
- `expandedSchemaIdx` (JS state) tracks which card is open

JS bindings (event delegation on `schemaCards`):

- `.pcard-head click [data-saction="toggleSchema"]` toggles `expandedSchemaIdx`, re-renders
- `[data-saction="copySchema"] click` copies the selected schema text to the clipboard
- `[data-saction="delSchema"] click` calls `delSchema(idx)` with confirm dialog
- `.pcard-editor input [data-saction="editSchema"]` auto-saves `schemaTemplates[idx].text`, updates char count, auto-grows textarea, refreshes pickers, calls `_showSaveToast()`
- `.schema-name-input input [data-saction="renameSchema"]` auto-saves `schemaTemplates[idx].name`, refreshes pickers, calls `_showSaveToast()`

Render function:

- `renderSchemas()` — called by `switchTab('schema')`

State variable:

- `expandedSchemaIdx` — index within `schemaTemplates`, or `null`

### Add Schema Row

DOM IDs:

- `addSchemaRow`
- `addSchemaTrigger` — click to reveal `addSchemaForm`
- `addSchemaForm` — `.add-form`
- `newSchemaName`
- `newSchemaInitText`
- `cancelAddSchema`
- `confirmAddSchema`

JS bindings:

- `addSchemaTrigger click` opens form, hides trigger
- `cancelAddSchema click` calls `closeAddSchemaForm()`
- `confirmAddSchema click` calls `addSchema()`
- `newSchemaName keydown Enter` calls `addSchema()`
- `newSchemaInitText keydown Ctrl/Cmd+Enter` calls `addSchema()`
- `newSchemaName / newSchemaInitText keydown Escape` calls `closeAddSchemaForm()`

Storage keys:

- `schemaTemplates`
- `extractSchemaId` (refreshed after add/delete)
- `distillSchemaId` (refreshed after add/delete)

## Settings Tab

Panel: `tab-settings`

### Automation

DOM IDs:

- `fullAutoToggle`
- `autoDownload`

JS bindings:

- `saveSettingsBtn click` persists current settings

Storage keys:

- `fullAuto`
- `autoDownload`

### File Settings

DOM IDs:

- `extractFolder`
- `distillFolder`

Storage keys:

- `extractFolder`
- `distillFolder`

### Layout And Accessibility

DOM classes:

- `.font-btn[data-font]`
- `.contrast-btn[data-contrast]`

JS helpers:

- `applyPopupFontSize(size)`
- `applyPopupTextContrast(mode)`

Storage keys:

- `popupFontSize`
- `popupTextContrast`

Notes:

- Width and height controls removed (Side Panel width is user-dragged; height fills browser window).
- Text contrast uses body classes: `contrast-bright`, `contrast-max`
- Font size uses body classes: `font-comfortable`, `font-large`

## Custom Flow Tab

Panel: `tab-flow`

### Run-All Bar

DOM IDs:
- `cfRunAllBtn` — executes all visible blocks in order; disabled during execution
- `cfStopAllBtn` — stops current run-all execution
- `cfGlobalStatus` — global run status text
- `cfPresetSel` — preset dropdown
- `cfDeletePresetBtn` — delete selected preset
- `cfSavePresetBtn` — save current Custom Flow configuration as a preset; rendered below the card stack

### Block Cards (common pattern)

Each block uses:
- `[data-cf-card="<name>"]` — the card element; `.cf-collapsed` hides the body; `.cf-active` highlights during run-all
- `[data-cf-toggle="<name>"]` — show/hide toggle button
- `[data-cf-delay-for="<name>"]` — delay `<select>` (options: 0 / 2 / 5 / 10 / 20 / custom)
- `[data-cf-custom-for="<name>"]` — custom delay `<input>`, shown only when "自訂" is selected

### Block 1 — Source

DOM IDs:
- `cfGrabPageBtn`
- `cfRawText`
- `cfCharCount`

JS owner: `CustomFlowController`

### Block 2 — Task

DOM IDs:
- `cfSeriesSel`
- `cfClearPromptBtn`
- `cfPromptList`
- `cfSelectedPromptText` — `<pre>` prompt preview; `data-empty="1"` shows placeholder

JS owner: `CustomFlowController`

### Block 3 — Format

DOM IDs:
- `cfSchemaSel`
- `cfClearSchemaBtn`
- `cfSchemaPreview`

JS owner: `CustomFlowController`

### Block 4 — AI

DOM IDs:
- `cfAiSelect` — container for `.ai-pill` buttons (`gpt` / `gemini` / `claude` / `grok`)

JS owner: `CustomFlowController`

### Block 5 — Run

DOM IDs:
- `cfAutoSave`
- `cfRunBtn`
- `cfStopBtn`
- `cfSaveDraftBtn`
- `cfCopyBtn`
- `cfDlBtn`
- `cfLog`
- `cfResultSection`
- `cfResultName`
- `cfResultText`

JS owner: `CustomFlowController`

### CustomFlowController

Defined in `src/sidepanel.js`. Key methods:

- `init(d)` — binds all events, restores state from storage
- `toggleCard(name)` — show/hide a block; persists to `cfCardVisible`
- `runAll()` — executes visible blocks in order; builds `pipeline` state; applies per-block delay; calls `_runWithPipeline()`
- `_runWithPipeline(pipeline)` — combines content + prompt + schema, sends `START_DISTILL` with `fullAuto: true`
- `startFlow()` — manual run; reads current state; uses `fullAuto` from storage setting
- `getContent()`, `getSelectedPrompt()`, `getSelectedSchema()`, `getAI()` — public getters

Message routing:

- `activeDistillContext` (module-level `let`) is set to `'flow'` before `START_DISTILL` and cleared after `DISTILL_DONE` / `ERROR`.
- `listenBg()` routes `LOG_DISTILL` and `DISTILL_DONE` to `CustomFlowController` when `activeDistillContext === 'flow'`, otherwise to `DistillRunBlock`.

Storage keys (Custom Flow):
- `cfCardVisible` — `{ source, task, format, ai, run }` booleans
- `cfBlockDelays` — `{ source, task, format, ai, run }` delay seconds
- `cfSeriesId`
- `cfPromptIdx`
- `cfSchemaId`
- `cfAI`
- `cfAutoSave` — controls whether Custom Flow writes results to `library` and auto-downloads output
- `customFlowPresets` — saved preset list
- `cfDefaultPresetId` — currently used as the remembered selected preset id; auto-applied on Custom Flow init

Autosave rule:

- Distill and Custom Flow now both persist the same autosave preference in `cfAutoSave`.
- Both workflows include `autoSave` in the `START_DISTILL` payload.
- `background.js` uses the incoming `autoSave` message field as the single source of truth and no longer reads `distillAutoSave`.

Preset UX rule:

- `cfPresetSel` is now select-to-apply; changing the dropdown immediately loads that preset.
- The selected preset id is persisted in `cfDefaultPresetId`, so reopening the Side Panel restores the same preset automatically.
- There is no separate `載入` or `設為預設` button in the current UI.

## Background Message Map

Handled by `src/background.js`:

| Message type | Sent from | Purpose | Main response |
|---|---|---|---|
| `START_EXTRACT` | `startExtract()` | Send combined prompt+schema text to Grok and collect responses | `PROGRESS`, `LOG_EXTRACT`, `EXTRACT_DONE` |
| `START_DISTILL` | `startDistill()` / `_runWithPipeline()` | Send raw text to selected AI and save result | `LOG_DISTILL`, `DISTILL_DONE` |
| `DOWNLOAD_MD` | multiple UI actions | Download a named markdown file | none |
| `DOWNLOAD_MD_BY_NAME` | library download action | Download document stored in `library` | none |
| `AI_RESPONSE` | content script | Return AI response text to background | consumed internally |
| `STOP` | stop buttons | Stop current long-running workflow | none |

Received by `src/sidepanel.js` in `listenBg()`:

- `PROGRESS`
- `LOG_EXTRACT`
- `LOG_DISTILL`
- `EXTRACT_DONE`
- `DISTILL_DONE`
- `ERROR`

## Storage Key Index

Workflow:

- `prompts`
- `library`
- `lastTab`

AI selection:

- `extractAI`
- `distillAI`

Prompt management:

- `promptSeries`
- `currentSeriesId`
- `extractSeriesId`
- `distillSeriesId`
- `distillPromptIdx`

Schema templates:

- `schemaTemplates`
- `extractSchemaId`
- `distillSchemaId`

Automation:

- `delaySeconds`
- `fullAuto`
- `cfAutoSave`

Output:

- `autoDownload`
- `extractFolder`
- `distillFolder`
- `draftFolder` legacy fallback

UI settings:

- `popupFontSize`
- `popupTextContrast`

Custom Flow:

- `cfCardVisible`
- `cfBlockDelays`
- `cfSeriesId`
- `cfPromptIdx`
- `cfSchemaId`
- `cfAI`
- `cfAutoSave`
- `customFlowPresets`
- `cfDefaultPresetId`

## CSP And Event Binding Rules

- Do not add inline `<script>...</script>` to `sidepanel.html`.
- Do not add `onclick`, `onchange`, `oninput`, or other inline event handlers.
- Add UI-only glue to `src/popup-ui-patch.js`.
- Add core workflow behavior to `src/sidepanel.js`.
- Add new Block objects under `src/blocks/` and register the `<script>` tag in `sidepanel.html` before `sidepanel.js`.
- After editing, run:

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

## Side Panel Notes

Migration to Side Panel is complete as of 2026-05-03. The primary UI is `sidepanel.html`; `popup.html` is retained as a development reference only.

- Panel IDs, storage keys, and `.nav-item[data-tab]` navigation selectors are unchanged from the Popup era.
- `src/sidepanel.js` is the main UI script, loaded by both `sidepanel.html` and `popup.html`. Renamed from `src/popup.js` on 2026-05-04 (Decision 37).
- CSP constraints are the same as Popup: all scripts must be external files.
- `panel-fill` panels (`#tab-prompts`, `#tab-schema`) must NOT have `style="margin:-24px"`. That negative margin causes flex height overflow and pushes `add-row` elements off-screen (Decision 38).
