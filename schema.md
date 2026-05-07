# Narrative Toolkit Schema

This document summarizes the current data contracts used by the extension. It is intentionally concise and should be updated when storage keys or message types change.

## chrome.storage.local

### Workflow State

| Key | Type | Purpose |
|---|---|---|
| `prompts` | `PromptItem[]` | Active X ETL prompt queue (loaded from a series) |
| `library` | `LibraryDoc[]` | Saved local document index |
| `lastTab` | `string` | Last active Side Panel tab |

### Prompt State

| Key | Type | Purpose |
|---|---|---|
| `promptSeries` | `PromptSeries[]` | Reusable prompt collections |
| `currentSeriesId` | `string \| null` | Last selected series in Prompt Manager |
| `extractSeriesId` | `string \| null` | Selected series in X ETL |
| `distillSeriesId` | `string \| null` | Selected series in Distill |
| `distillPromptIdx` | `number \| null` | Selected prompt index in Distill |

### Schema Templates

| Key | Type | Purpose |
|---|---|---|
| `schemaTemplates` | `SchemaTemplate[]` | Format template library (persisted, user-managed in Schema tab) |
| `extractSchemaId` | `string \| null` | Schema selected in X ETL |
| `distillSchemaId` | `string \| null` | Schema selected in Distill |

### Custom Flow State

| Key | Type | Purpose |
|---|---|---|
| `cfCardVisible` | `{ source, task, format, ai, run: boolean }` | Per-block show/hide state |
| `cfBlockDelays` | `{ source, task, format, ai, run: number }` | Per-block delay in seconds |
| `cfSeriesId` | `string \| null` | Selected prompt series in Custom Flow |
| `cfPromptIdx` | `number \| null` | Selected prompt index in Custom Flow |
| `cfSchemaId` | `string \| null` | Selected schema in Custom Flow |
| `cfAI` | `AiTarget` | Selected target AI in Custom Flow |
| `cfAutoSave` | `boolean` | Whether Custom Flow results auto-save to library and auto-download output |
| `customFlowPresets` | `CustomFlowPreset[]` | Saved Custom Flow presets |
| `cfDefaultPresetId` | `string \| null` | Default preset applied when Custom Flow initializes |

### AI And Automation

| Key | Type | Purpose |
|---|---|---|
| `distillAI` | `AiTarget` | AI target for Distill |
| `extractAI` | `AiTarget` | Selected target AI in X ETL Card 03; currently persisted UI state only |
| `delaySeconds` | `number` | Legacy ETL wait setting retained in storage; current ETL send-only flow no longer uses it for auto-capture |
| `fullAuto` | `boolean` | Whether workflows should auto-continue when possible |
| `cfAutoSave` | `boolean` | Shared autosave flag used by both Distill and Custom Flow when sending `START_DISTILL.autoSave` |

### Output Settings

| Key | Type | Purpose |
|---|---|---|
| `autoDownload` | `boolean` | Download markdown files automatically |
| `extractFolder` | `string` | Downloads subfolder for X ETL output |
| `distillFolder` | `string` | Downloads subfolder for Distill output |
| `draftFolder` | `string` | Legacy fallback folder |

### UI Preferences

| Key | Type | Purpose |
|---|---|---|
| `uiTheme` | `"nt-dark" \| "editorial-light" \| "studio-light"` | Side Panel theme selection |
| `popupFontSize` | `"standard" \| "comfortable" \| "large"` | Font size mode |
| `popupTextContrast` | `"standard" \| "bright" \| "max"` | Text contrast mode |

注意：storage 中的偏好設定以 body class 的形式套疊於基礎 CSS 預設值之上，基礎值本身不進 storage。基礎預設值（2026-05-05 更新）：body 14px、按鈕 12px、label 11px、輸入框 15px；`--bg` `#13110F`、`--text2` `#B8B2A6`、`--text3` `#7A7468`。

### Migration-Only Storage Keys

| Key | Type | Current Use |
|---|---|---|
| `wikiTpl` | `string` | Legacy migration source only. Read by `loadSettings()` only when `schemaTemplates` is empty, to seed the initial `wiki.md` schema template. Not written back and not part of the active storage contract. |
| `noteTpl` | `string` | Legacy migration source only. Read by `loadSettings()` only when `schemaTemplates` is empty, to seed the initial `筆記.md` schema template. Not written back and not part of the active storage contract. |

Notes:

- `wikiTpl` and `noteTpl` remain in code only as a compatibility bridge for older local storage.
- `src/sidepanel.js` `loadSettings()` reads them only when `schemaTemplates` is empty, then seeds the initial templates and persists `schemaTemplates`.
- The `wikiTpl` field used in `START_DISTILL` messages is a runtime message field, not this legacy storage key.

## Data Shapes

```ts
type AiTarget = 'gpt' | 'gemini' | 'claude' | 'grok';

type PromptItem = {
  text: string;
  status?: 'pending' | 'running' | 'done' | 'error';
};

type PromptSeries = {
  id: string;
  name: string;
  prompts: {
    id: string;
    name: string;
    text: string;
  }[];
};

type SchemaTemplate = {
  id: string;
  name: string;   // e.g. "wiki.md", "YAML", "Table"
  text: string;   // prompt text; {{content}} is substituted with source material in Distill
};

type LibraryDoc = {
  name: string;
  fmt: 'note' | 'wiki' | 'draft' | 'extract';
  content: string;
  chars?: number;
  date: string;
};

type CustomFlowPreset = {
  id: string;
  name: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
  config: {
    cardVisible: { source: boolean; task: boolean; format: boolean; ai: boolean; run: boolean };
    seriesId: string | null;
    promptIdx: number | null;
    schemaId: string | null;
    ai: AiTarget;
    autoSave: boolean;
    blockDelays: { source: number; task: number; format: number; ai: number; run: number };
  };
};
```

## Runtime Messages

### Side Panel To Background

| Type | Purpose |
|---|---|
| `START_EXTRACT` | Send combined ETL prompt+schema text to Grok; current ETL path is send-only and remains Grok-only regardless of `extractAI` |
| `START_DISTILL` | Start AI distill flow; sent by both Distill Tab and Custom Flow |
| `START_VERIFY_WIKI` | Start legacy wiki verification flow in `background.js`; not part of the current primary Side Panel product surface |
| `RUN_AI_STRUCTURE` | Start legacy AI post-structuring flow in `background.js`; retained as a runtime handler but not used by the current ETL UI |
| `DOWNLOAD_MD` | Download provided markdown content |
| `DOWNLOAD_TEXT` | Download provided text content with an explicit MIME type |
| `DOWNLOAD_MD_BY_NAME` | Download a document from `library` |
| `STOP` | Stop current workflow |

Notes:

- `START_DISTILL` from Custom Flow always includes `fullAuto: true`.
- `START_DISTILL` now includes `autoSave`, and `background.js` treats that message field as the source of truth for autosave behavior.
- `START_DISTILL.wikiTpl` is the composed prompt/template text sent for the current run. It is a message payload field, not the legacy `chrome.storage.local["wikiTpl"]` key.
- The module-level `activeDistillContext` variable in `src/sidepanel.js` routes `LOG_DISTILL` / `DISTILL_DONE` / `ERROR` responses to the correct handler (`DistillRunBlock` or `CustomFlowController`).
- Legacy `distillAutoSave` has been migrated out of storage. Distill and Custom Flow now both use `cfAutoSave` as the persisted checkbox state.

### Content Script / Background To Side Panel

| Type | Purpose |
|---|---|
| `PROGRESS` | Update extraction progress |
| `LOG_EXTRACT` | Append Extract log line |
| `LOG_DISTILL` | Append Distill log line |
| `EXTRACT_DONE` | Signal that all ETL prompts have been sent; current UI uses it to stop the run state and prompt the user to capture the reply manually |
| `DISTILL_DONE` | Show or record distill result |
| `ERROR` | Display workflow error |

### Content Script To Background

| Type | Purpose |
|---|---|
| `AI_RESPONSE` | Return captured AI response text |

## Extract Flow

The X ETL pipeline no longer routes raw responses through a separate AI structuring step. The current UI is rendered as 5 ETL Cards (`ETLCard1–5Block.js`) and `initETLTab()` must run before `popup-ui-patch.js` expects the ETL DOM IDs to exist.

1. Card 01: User selects a prompt series and prompt from `extractPromptList` (`<select>`); the selected text becomes the single editable task area for the current ETL run.
2. Card 02: User selects an optional schema template.
3. Card 03: User selects a target AI pill; this saves `extractAI`.
4. Card 04: `startExtract()` concatenates `prompt.text + "\n\n" + schema.text` before injecting into Grok; the current ETL path is send-only and no longer auto-polls Grok replies.
5. Card 05: User manually captures the current Grok reply, reviews/edits the text in `extractResultText`, then saves it as a `.md` file.

The schema template system replaces the old post-structuring concept. `grokTpl` / `structureTpl` may still appear in older notes, but they are deprecated docs residue rather than active runtime storage keys or supported runtime contracts. There is no intermediate structured table review stage.

Current limitation: `extractAI` is persisted and reflected in Card 03, but it is not yet wired into `startExtract()`. Actual extraction still opens `x.com/i/grok` and uses Grok injection.

## Compatibility Notes

- HTML extension pages must load scripts externally to satisfy MV3 CSP.
- `wikiTpl` and `noteTpl` are migration-only storage keys. `loadSettings()` reads them only when `schemaTemplates` is empty, seeds the initial schema templates, and then persists `schemaTemplates`.
- `grokTpl` and `structureTpl` are deprecated docs residue only. Current runtime code does not read or write them.
- `START_VERIFY_WIKI`, `RUN_AI_STRUCTURE`, and `DOWNLOAD_TEXT` still exist as runtime message handlers in the current graph, but they are legacy/compatibility-oriented paths rather than the main Side Panel workflow surface.
- Because migration only runs when `schemaTemplates` is empty, a partially populated `schemaTemplates` value may not receive missing default templates automatically.
- If a storage key is renamed, keep legacy fallback behavior until existing user data can be migrated.
- Side Panel migration is complete. Storage contracts are unchanged from the Popup era.
- Grok as a Distill AI target uses `handleDistillGrok()` in `background.js` (direct `executeScript` injection), not the `cs_ai.js` storage-queue approach. This applies to both Distill Tab and Custom Flow.
- `src/blocks/ETLStep1Block.js`, `ETLStep2Block.js`, and `ETLStep3Block.js` are legacy files. They remain on disk but are no longer loaded by `sidepanel.html`.

## Open Questions

- Should the selected ETL prompt index become a persisted storage key, or remain transient UI state?
- Should `extractAI` become an active routing key for `START_EXTRACT`, or remain UI-only until non-Grok extraction flows are defined?
