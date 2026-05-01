# Navigation Map

This document maps the current Chrome Extension UI, DOM IDs, JavaScript bindings, background messages, and storage keys. Use it before changing `popup.html`, `src/popup.js`, `src/popup-ui-patch.js`, or migrating the popup to Side Panel.

## Entry Points

- `manifest.json`
  - `action.default_popup`: `popup.html`
  - `background.service_worker`: `src/background.js`
  - content scripts:
    - `src/cs_grok.js` on `https://x.com/i/grok*`
    - `src/cs_ai.js` on ChatGPT, Gemini, Claude

- `popup.html`
  - Loads `src/popup.js`
  - Loads `src/popup-ui-patch.js`
  - Must not contain inline `<script>...</script>` or inline event handlers.

- `src/popup.js`
  - Main workflow logic, storage, message sending, render functions, and event binding.

- `src/popup-ui-patch.js`
  - CSP-safe UI glue for sidebar navigation, step state, and distill prompt preview visibility.

## Top-Level Navigation

Sidebar buttons use `data-tab` and map to panel IDs:

| Nav | Button selector | Panel ID | Purpose |
|---|---|---|---|
| Extract | `.nav-item[data-tab="extract"]` | `tab-extract` | X/Grok ETL workflow |
| Distill | `.nav-item[data-tab="distill"]` | `tab-distill` | Long-form text capture and markdown generation |
| Prompts | `.nav-item[data-tab="prompts"]` | `tab-prompts` | Prompt series manager |
| Schema | `.nav-item[data-tab="schema"]` | `tab-schema` | Format template library |
| Settings | `.nav-item[data-tab="settings"]` | `tab-settings` | Automation, local storage, and layout |

Navigation is coordinated by:

- `switchTab(name)` in `src/popup.js`
- `initSidebarNavigation()` in `src/popup-ui-patch.js`
- `topbarTitle` is updated by `setActiveNav(tab)` in `src/popup-ui-patch.js`

Topbar actions (shown/hidden per tab):

- `topbarPromptsActions` — visible on Prompts tab only; contains `loadAllSeriesBtn`

Storage key:

- `lastTab`

## Extract Tab

Panel: `tab-extract`

### Step Indicator

DOM IDs:

- `etlSteps`
- `sn1`, `st1`: select prompt & schema
- `sn2`, `st2`: run extract
- `sn3`, `st3`: save result

Managed by:

- `setStep(n)` in `src/popup-ui-patch.js` (loops 1–3)
- Mutation observer watches `extractResultSection` style attribute:
  - visible → step 3
  - hidden → step 1

### Step 1: Prompt And Schema Selection

DOM IDs:

- `stepSection1`
- `extractSeriesSel` — series dropdown
- `extractPromptList` — list of prompts from selected series; click `[data-action="addFromLib"]` adds to queue
- `promptList` — active prompt queue; delegated delete and edit
- `extractSchemaSel` — schema template dropdown (optional)
- `extractSchemaPreview` — `<pre>` preview of selected schema text

JS bindings:

- `extractSeriesSel change` updates `extractSeriesId`, then `renderExtractPromptList()`
- `extractSchemaSel change` updates `extractSchemaId`, then `updateExtractSchemaPreview()`
- `extractPromptList click [data-action="addFromLib"]` calls `addFromLib(sid, idx)`
- `promptList click [data-action="delPrompt"]` calls `delPrompt(idx)`
- `promptList focusout [data-action="editPrompt"]` calls `editPrompt(idx, value)`

Render functions:

- `renderPrompts()`
- `renderExtractPromptPicker()`
- `renderExtractPromptList()`
- `renderExtractSchemaPicker()`
- `updateExtractSchemaPreview()`

Storage keys:

- `prompts`
- `promptSeries`
- `extractSeriesId`
- `extractSchemaId`
- `schemaTemplates`

### Step 2: Grok Extract

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

- `startBtn click` calls `startExtract()` — concatenates `prompt.text + "\n\n" + schema.text` per prompt
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

### Step 3: Extract Result

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

JS bindings:

- `saveDraftBtn click` calls `saveDraft()`
- `distillSchemaSel change` updates `distillSchemaId`, then `updateDistillSchemaPreview()`
- `clearDistillSchemaBtn click` clears `distillSchemaId`
- `distillSeriesSel change` updates `distillSeriesId`, clears `distillPromptIdx`, renders prompt list
- `clearDistillPromptBtn click` clears selected series/prompt
- `distillPromptList click [data-action="selectDistillPrompt"]` calls `selectDistillPrompt(idx)`
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
- `distillAutoSave`
- `distillLog`

JS bindings:

- AI selector buttons update `distillAI`
- `distillBtn click` calls `startDistill()`
- `stopDistillBtn click` sends `STOP`
- `distillAutoSave change` stores setting immediately

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
- `distillAutoSave`
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

- `DISTILL_DONE`, when `distillAutoSave` is checked

### Distill Library

DOM IDs:

- `distillLibToggle`
- `distillLibCount`
- `distillLibChevron`
- `distillLibList`

Render function:

- `renderDistillLibrary()`

Storage key:

- `library`, filtered to `fmt in ["note", "wiki", "draft"]`

## Prompts Tab

Panel: `tab-prompts` (`panel-fill`, no internal scroll — layout managed by flex children)

### Series Tab Bar

DOM IDs:

- `seriesTabbar` — rendered by `renderTabbar()`; each series becomes a `.series-tab` button
- `tabAddSeriesBtn` (inside tabbar) — shows `newSeriesBar`

JS bindings (event delegation on `seriesTabbar`):

- `.series-tab click [data-action="selectSeries"]` calls `selectSeries(sid)`

### Prompt Cards

DOM IDs:

- `seriesCards` — scroll area; rendered by `renderCards()`

Card pattern:

- Each prompt is a `.pcard` with a `.pcard-head` (click to expand) and `.pcard-body` (hidden unless expanded)
- Expanded body contains a `.pcard-editor` textarea (auto-grows), char count footer, and load button
- `expandedCardIdx` (JS state) tracks which card is open; only one at a time

JS bindings (event delegation on `seriesCards`):

- `.pcard-head click` toggles `expandedCardIdx`, re-renders
- `[data-action="loadOneCard"] click` calls `loadOneCard(sid, idx)` — loads prompt into X ETL queue
- `[data-action="delCard"] click` calls `delCard(idx)`
- `.pcard-editor input` auto-saves `series[].prompts[idx].text`, updates char count, auto-grows textarea

Render functions:

- `renderTabbar()`
- `renderCards()`
- `renderSeries()` — thin wrapper calling `renderTabbar()`
- `renderSeriesPrompts()` — thin wrapper calling `renderCards()`

Helpers:

- `excerpt(text)` — 72-char preview with ellipsis
- `showToast(msg)` — bottom toast, 2.2 s auto-dismiss

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

### Topbar Action

DOM ID:

- `loadAllSeriesBtn` (inside `topbarPromptsActions`) — calls `loadAllSeries()`

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
- Expanded body contains a `.schema-name-input` (inline name edit), `.pcard-editor` textarea, and char count footer
- `expandedSchemaIdx` (JS state) tracks which card is open

JS bindings (event delegation on `schemaCards`):

- `.pcard-head click [data-saction="toggleSchema"]` toggles `expandedSchemaIdx`, re-renders
- `[data-saction="delSchema"] click` calls `delSchema(idx)` with confirm dialog
- `.pcard-editor input [data-saction="editSchema"]` auto-saves `schemaTemplates[idx].text`, updates char count, auto-grows textarea, refreshes pickers
- `.schema-name-input input [data-saction="renameSchema"]` auto-saves `schemaTemplates[idx].name`, refreshes pickers

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

- `.width-btn[data-w]`
- `.height-btn[data-h]`
- `.font-btn[data-font]`
- `.contrast-btn[data-contrast]`

JS helpers:

- `applyPopupHeight(h)`
- `applyPopupFontSize(size)`
- `applyPopupTextContrast(mode)`

Storage keys:

- `popupWidth`
- `popupHeight`
- `popupFontSize`
- `popupTextContrast`

Notes:

- Chrome action popup max size is 800x600 px. Height options should not exceed 600 unless the UI migrates to Side Panel.
- Text contrast uses body classes: `contrast-bright`, `contrast-max`
- Font size uses body classes: `font-comfortable`, `font-large`

## Background Message Map

Handled by `src/background.js`:

| Message type | Sent from | Purpose | Main response |
|---|---|---|---|
| `START_EXTRACT` | `startExtract()` | Send combined prompt+schema text to Grok and collect responses | `PROGRESS`, `LOG_EXTRACT`, `EXTRACT_DONE` |
| `START_DISTILL` | `startDistill()` | Send raw text to selected AI and save result | `LOG_DISTILL`, `DISTILL_DONE` |
| `DOWNLOAD_MD` | multiple UI actions | Download a named markdown file | none |
| `DOWNLOAD_MD_BY_NAME` | library download action | Download document stored in `library` | none |
| `AI_RESPONSE` | content script | Return AI response text to background | consumed internally |
| `STOP` | stop buttons | Stop current long-running workflow | none |

Received by `src/popup.js` in `listenBg()`:

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
- `distillAutoSave`

Output:

- `autoDownload`
- `extractFolder`
- `distillFolder`
- `draftFolder` legacy fallback

UI settings:

- `popupWidth`
- `popupHeight`
- `popupFontSize`
- `popupTextContrast`

## CSP And Event Binding Rules

- Do not add inline `<script>...</script>` to `popup.html`.
- Do not add `onclick`, `onchange`, `oninput`, or other inline event handlers.
- Add UI-only glue to `src/popup-ui-patch.js`.
- Add core workflow behavior to `src/popup.js`.
- After editing, run:

```powershell
node --check src\popup.js
node --check src\popup-ui-patch.js
rg -n --pcre2 "<script(?!\s+src=)|\s(on[a-zA-Z]+)\s*=|javascript:" popup.html
```

## Migration Notes For Side Panel

If migrating to Side Panel:

- Keep the same panel IDs and storage keys where possible.
- Move or reuse `popup.html` as `sidepanel.html`.
- Keep `src/popup-ui-patch.js` external; Side Panel has the same CSP constraints.
- Revisit height controls: Side Panel does not use the same 600 px action popup height limit.
- Sidebar navigation can remain unchanged.
