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
  - CSP-safe UI glue for sidebar navigation, step state, format cards, and distill prompt preview visibility.

## Top-Level Navigation

Sidebar buttons use `data-tab` and map to panel IDs:

| Nav | Button selector | Panel ID | Purpose |
|---|---|---|---|
| Extract | `.nav-item[data-tab="extract"]` | `tab-extract` | X/Grok ETL workflow |
| Distill | `.nav-item[data-tab="distill"]` | `tab-distill` | Long-form text capture and markdown generation |
| Prompts | `.nav-item[data-tab="prompts"]` | `tab-prompts` | Prompt series manager |
| Settings | `.nav-item[data-tab="settings"]` | `tab-settings` | Automation, local storage, layout, and templates |

Navigation is coordinated by:

- `switchTab(name)` in `src/popup.js`
- `initSidebarNavigation()` in `src/popup-ui-patch.js`
- `topbarTitle` is updated by `setActiveNav(tab)` in `src/popup-ui-patch.js`

Storage key:

- `lastTab`

## Extract Tab

Panel: `tab-extract`

### Step Indicator

DOM IDs:

- `etlSteps`
- `sn1`, `st1`: select prompt
- `sn2`, `st2`: run extract
- `sn3`, `st3`: send to AI
- `sn4`, `st4`: review/output

Managed by:

- `setStep(n)` in `src/popup-ui-patch.js`
- Mutation observer watches:
  - `grokResponseSection`
  - `postProcessSection`
  - `reviewSection`

### Step 1: Prompt Selection

DOM IDs:

- `stepSection1`
- `extractSeriesSel`
- `extractPromptList`
- `promptList`

JS bindings:

- `extractSeriesSel change` updates `extractSeriesId`, then `renderExtractPromptList()`
- `extractPromptList click [data-action="addFromLib"]` calls `addFromLib(sid, idx)`
- `promptList click [data-action="delPrompt"]` calls `delPrompt(idx)`
- `promptList focusout [data-action="editPrompt"]` calls `editPrompt(idx, value)`

Render functions:

- `renderPrompts()`
- `renderExtractPromptPicker()`
- `renderExtractPromptList()`

Storage keys:

- `prompts`
- `promptSeries`
- `extractSeriesId`

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

- `startBtn click` calls `startExtract()`
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
- `rawResponses`
- `lastRawMd`
- `lastRawMdName`

### Grok Response Preview

DOM IDs:

- `grokResponseSection`
- `grokResponseList`

Render function:

- `displayGrokResponses(responses)`

Shown after:

- `EXTRACT_DONE`
- loading existing `rawResponses`

### Step 3: AI Structure

DOM IDs:

- `postProcessSection`
- `stepSection3`
- `extractAiSelect`
- `structureTpl`
- `runStructureBtn`
- `stopStructureBtn`

JS bindings:

- AI selector buttons update `extractAI`
- `structureTpl focusout` stores `grokTpl`
- `runStructureBtn click` calls `runStructure()`
- `stopStructureBtn click` sends `STOP`

Messages sent to background:

- `RUN_AI_STRUCTURE`
- `STOP`

Messages received from background:

- `AI_STRUCTURE_DONE`
- `ERROR`

Storage keys:

- `extractAI`
- `grokTpl`
- `fullAuto`
- `rawResponses`
- `pendingStructured`

### Step 4: Review And Export

DOM IDs:

- `reviewSection`
- `stepSection4`
- `viewTextBtn`
- `viewTableBtn`
- `resultTextView`
- `resultText`
- `resultTableView`
- `revHead`
- `revBody`
- `saveMdBtn`
- `rejectBtn`
- `revLog`

JS bindings:

- `viewTextBtn click` switches to raw text view
- `viewTableBtn click` switches to table view
- `revBody focusout [data-action="cellEdit"]` calls `cellEdit(ri, ci, value)`
- `saveMdBtn click` calls `saveStructuredMd()`
- `rejectBtn click` calls `rejectRedo()`

Messages sent to background:

- `DOWNLOAD_MD`

Messages received from background:

- `ERROR`

Storage keys:

- `pendingStructured`
- `library`
- `extractFolder`

### Extract Library

DOM IDs:

- `extractLibToggle`
- `extractLibCount`
- `extractLibChevron`
- `extractLibList`

JS bindings:

- Toggle click opens/closes library list
- Delegated library actions:
  - `copyDocByName`
  - `dlDocByName`
  - `delDocByName`

Render function:

- `renderExtractLibrary()`

Storage key:

- `library`, filtered to `fmt === "structured"`

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

### Draft And Format Selection

DOM IDs:

- `saveDraftBtn`
- `.fmt-card[data-fmt="note"]`
- `.fmt-card[data-fmt="wiki"]`
- hidden `.fmt-btn[data-fmt="note"]`
- hidden `.fmt-btn[data-fmt="wiki"]`

JS bindings:

- `saveDraftBtn click` calls `saveDraft()`
- `.fmt-card click` handled by `initFormatCards()` in `src/popup-ui-patch.js`
- `fmtChange` event clicks matching hidden `.fmt-btn`
- `.fmt-btn click` in `src/popup.js` updates `selectedFmt`

Storage keys:

- `library`
- `distillFolder`

### Distill Prompt Picker

DOM IDs:

- `distillSeriesSel`
- `clearDistillPromptBtn`
- `distillPromptList`
- `distillSelectedPromptArea`
- `distillSelectedPromptText`

JS bindings:

- `distillSeriesSel change` updates `distillSeriesId`, clears `distillPromptIdx`, then renders prompt list
- `clearDistillPromptBtn click` clears selected series/prompt
- `distillPromptList click [data-action="selectDistillPrompt"]` calls `selectDistillPrompt(idx)`
- `initDistillSelectedPromptArea()` in `src/popup-ui-patch.js` shows/hides preview based on `data-empty`

Storage keys:

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
- `wikiTpl`
- `noteTpl`
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

## Prompt Manager Tab

Panel: `tab-prompts`

DOM IDs:

- `seriesList`
- `newSeriesName`
- `addSeriesBtn`
- `seriesPromptsHeader`
- `loadAllSeriesBtn`
- `seriesPromptsList`
- `seriesPromptsAdd`
- `newSeriesPromptName`
- `newSeriesPromptText`
- `addSeriesPromptBtn`

JS bindings:

- `addSeriesBtn click` calls `addSeries()`
- `newSeriesName keydown Enter` calls `addSeries()`
- `seriesList click [data-action="selectSeries"]` calls `selectSeries(sid)`
- `seriesList click [data-action="delSeries"]` calls `delSeries(sid)`
- `loadAllSeriesBtn click` calls `loadAllSeries()`
- `seriesPromptsList click [data-action="loadOnePrompt"]` calls `loadOnePrompt(sid, idx)`
- `seriesPromptsList click [data-action="delSeriesPrompt"]` calls `delSeriesPrompt(sid, idx)`
- `seriesPromptsList focusout [data-action="editSeriesPromptName"]` calls `editSeriesPromptName(sid, idx, value)`
- `seriesPromptsList focusout [data-action="editSeriesPromptText"]` calls `editSeriesPromptText(sid, idx, value)`
- `addSeriesPromptBtn click` calls `addSeriesPrompt()`

Render functions:

- `renderSeries()`
- `renderSeriesPrompts()`

Storage keys:

- `promptSeries`
- `currentSeriesId`
- `prompts`

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
### Prompt Templates

DOM IDs:

- `noteTpl`
- `wikiTpl`
- `structureTpl` lives in Extract Step 3

Storage keys:

- `noteTpl`
- `wikiTpl`
- `grokTpl`

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
- Text contrast uses body classes:
  - `contrast-bright`
  - `contrast-max`
- Font size uses body classes:
  - `font-comfortable`
  - `font-large`

## Background Message Map

Handled by `src/background.js`:

| Message type | Sent from | Purpose | Main response |
|---|---|---|---|
| `START_EXTRACT` | `startExtract()` | Send prompts to Grok and collect responses | `PROGRESS`, `LOG_EXTRACT`, `EXTRACT_DONE` |
| `START_DISTILL` | `startDistill()` | Send raw text to selected AI and save result | `LOG_DISTILL`, `DISTILL_DONE` |
| `START_VERIFY_WIKI` | currently background-supported | Wiki verification workflow | depends on handler |
| `RUN_AI_STRUCTURE` | `runStructure()` | Send Grok responses to AI for structured table | `AI_STRUCTURE_DONE` |
| `DOWNLOAD_MD` | multiple UI actions | Download a named markdown file | none |
| `DOWNLOAD_MD_BY_NAME` | library download action | Download document stored in `library` | none |
| `AI_RESPONSE` | content script | Return AI response text to background | consumed internally |
| `STOP` | stop buttons | Stop current long-running workflow | none |

Received by `src/popup.js` in `listenBg()`:

- `PROGRESS`
- `LOG_EXTRACT`
- `LOG_DISTILL`
- `EXTRACT_DONE`
- `AI_STRUCTURE_DONE`
- `DISTILL_DONE`
- `ERROR`

## Storage Key Index

Workflow:

- `prompts`
- `rawResponses`
- `pendingStructured`
- `library`
- `lastRawMd`
- `lastRawMdName`
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

Templates:

- `grokTpl`
- `wikiTpl`
- `noteTpl`

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
