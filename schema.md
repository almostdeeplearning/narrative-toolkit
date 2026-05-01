# Narrative Toolkit Schema

This document summarizes the current data contracts used by the extension. It is intentionally concise and should be updated when storage keys or message types change.

## chrome.storage.local

### Workflow State

| Key | Type | Purpose |
|---|---|---|
| `prompts` | `PromptItem[]` | Active X ETL prompt queue (loaded from a series) |
| `library` | `LibraryDoc[]` | Saved local document index |
| `lastTab` | `string` | Last active popup tab |

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

### AI And Automation

| Key | Type | Purpose |
|---|---|---|
| `distillAI` | `AiTarget` | AI target for Distill |
| `delaySeconds` | `number` | Grok wait duration |
| `fullAuto` | `boolean` | Whether workflows should auto-continue when possible |
| `distillAutoSave` | `boolean` | Whether Distill results return to popup and save automatically |

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
| `popupWidth` | `number` | Popup width preset |
| `popupHeight` | `number` | Popup height preset, max 600 |
| `popupFontSize` | `"standard" \| "comfortable" \| "large"` | Font size mode |
| `popupTextContrast` | `"standard" \| "bright" \| "max"` | Text contrast mode |

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
```

## Runtime Messages

### Popup To Background

| Type | Purpose |
|---|---|
| `START_EXTRACT` | Start Grok extraction loop (combined prompt+schema text already embedded) |
| `START_DISTILL` | Start AI distill flow |
| `DOWNLOAD_MD` | Download provided markdown content |
| `DOWNLOAD_MD_BY_NAME` | Download a document from `library` |
| `STOP` | Stop current workflow |

### Content Script / Background To Popup

| Type | Purpose |
|---|---|
| `PROGRESS` | Update extraction progress |
| `LOG_EXTRACT` | Append Extract log line |
| `LOG_DISTILL` | Append Distill log line |
| `EXTRACT_DONE` | Show completed Grok responses as markdown result |
| `DISTILL_DONE` | Show or record distill result |
| `ERROR` | Display workflow error |

### Content Script To Background

| Type | Purpose |
|---|---|
| `AI_RESPONSE` | Return captured AI response text |

## Extract Flow

The X ETL pipeline no longer routes raw responses through a separate AI structuring step. The full workflow is:

1. User selects a prompt series and an optional schema template (Step 1).
2. For each prompt, the extension concatenates `prompt.text + "\n\n" + schema.text` before injecting into Grok.
3. Grok responses are collected and displayed as a markdown result (Step 3).
4. User copies or saves the result as a `.md` file.

The schema template replaces the old `grokTpl` / `structureTpl` and the AI post-processing step. There is no intermediate structured table review stage.

## Compatibility Notes

- HTML extension pages must load scripts externally to satisfy MV3 CSP.
- `grokTpl`, `noteTpl`, `wikiTpl` storage keys are legacy. On first load, if `schemaTemplates` is empty, defaults are seeded from these values if present, then `schemaTemplates` is persisted. After migration the legacy keys are ignored.
- If a storage key is renamed, keep legacy fallback behavior until existing user data can be migrated.
- If Side Panel is added, storage contracts should remain the same unless there is a deliberate migration.
