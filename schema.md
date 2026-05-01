# Narrative Toolkit Schema

This document summarizes the current data contracts used by the extension. It is intentionally concise and should be updated when storage keys or message types change.

## chrome.storage.local

### Workflow State

| Key | Type | Purpose |
|---|---|---|
| `prompts` | `PromptItem[]` | Active X ETL prompt queue |
| `rawResponses` | `RawResponse[]` | Last Grok extraction result |
| `pendingStructured` | `StructuredResult \| null` | Structured result awaiting review |
| `library` | `LibraryDoc[]` | Saved local document index |
| `lastTab` | `string` | Last active popup tab |

### Prompt State

| Key | Type | Purpose |
|---|---|---|
| `promptSeries` | `PromptSeries[]` | Reusable prompt collections |
| `currentSeriesId` | `string \| null` | Active series in Prompt Manager |
| `extractSeriesId` | `string \| null` | Selected series in X ETL |
| `distillSeriesId` | `string \| null` | Selected series in Distill |
| `distillPromptIdx` | `number \| null` | Selected prompt index in Distill |

### AI And Automation

| Key | Type | Purpose |
|---|---|---|
| `extractAI` | `AiTarget` | AI target for X ETL post-processing |
| `distillAI` | `AiTarget` | AI target for Distill |
| `delaySeconds` | `number` | Grok wait duration |
| `fullAuto` | `boolean` | Whether workflows should auto-continue when possible |
| `distillAutoSave` | `boolean` | Whether Distill results return to popup and save automatically |

### Templates

| Key | Type | Purpose |
|---|---|---|
| `grokTpl` | `string` | X ETL structure template |
| `noteTpl` | `string` | Note output template |
| `wikiTpl` | `string` | Wiki output template |

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
    name: string;
    text: string;
  }[];
};

type RawResponse = {
  index: number;
  prompt: string;
  response: string;
};

type StructuredResult = {
  columns: string[];
  rows: Record<string, unknown>[];
};

type LibraryDoc = {
  name: string;
  fmt: 'structured' | 'note' | 'wiki' | 'draft';
  content: string;
  chars?: number;
  date: string;
};
```

## Runtime Messages

### Popup To Background

| Type | Purpose |
|---|---|
| `START_EXTRACT` | Start Grok extraction loop |
| `START_DISTILL` | Start AI distill flow |
| `RUN_AI_STRUCTURE` | Structure raw Grok responses with AI |
| `DOWNLOAD_MD` | Download provided markdown content |
| `DOWNLOAD_MD_BY_NAME` | Download a document from `library` |
| `STOP` | Stop current workflow |

### Content Script / Background To Popup

| Type | Purpose |
|---|---|
| `PROGRESS` | Update extraction progress |
| `LOG_EXTRACT` | Append Extract log line |
| `LOG_DISTILL` | Append Distill log line |
| `EXTRACT_DONE` | Show completed Grok responses |
| `AI_STRUCTURE_DONE` | Show structured review result |
| `DISTILL_DONE` | Show or record distill result |
| `ERROR` | Display workflow error |

### Content Script To Background

| Type | Purpose |
|---|---|
| `AI_RESPONSE` | Return captured AI response text |

## Compatibility Notes

- HTML extension pages must load scripts externally to satisfy MV3 CSP.
- If a storage key is renamed, keep legacy fallback behavior until existing user data can be migrated.
- If Side Panel is added, storage contracts should remain the same unless there is a deliberate migration.
