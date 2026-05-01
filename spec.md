# Narrative Toolkit Spec

## Purpose

Narrative Toolkit helps the user capture, extract, organize, and export web-based narrative material through AI-assisted workflows inside a Chrome Extension.

The product should remain a compact, work-focused tool rather than a landing page or general web app.

## Current Surface

- Primary UI: Chrome action popup.
- Future candidate: Chrome Side Panel when persistent workspace size becomes more important than popup simplicity.
- Core UI tabs:
  - X ETL
  - Distill
  - Prompt Manager
  - Settings

## User Goals

- Capture useful text from X, Threads, or the current page.
- Run repeatable Prompt workflows against Grok or other AI tools.
- Convert raw material into markdown notes or wiki-style documents.
- Review structured output before saving as local markdown.
- Keep reusable Prompt collections available across sessions.
- Adjust interface readability without changing the whole product style.

## Functional Requirements

### X ETL

- Allow the user to select prompts from a reusable prompt series.
- Run selected prompts against an open Grok tab.
- Show extraction progress and logs.
- Store raw Grok responses locally.
- Send extracted responses to a selected AI for structured post-processing.
- Allow review in text or table view.
- Allow saving structured output as markdown.

### Distill

- Accept manually pasted text.
- Allow grabbing text from the active page.
- Support note and wiki output modes.
- Allow selecting a prompt from Prompt Manager.
- Allow selecting target AI per workflow.
- Allow the user to decide whether AI results should be auto-saved and returned to the popup.
- Keep recent distill outputs accessible from the Distill tab.

### Prompt Manager

- Allow creating prompt series.
- Allow adding, editing, deleting, and loading prompts from a series.
- Store prompt series locally.
- Make prompt series available to X ETL and Distill flows.

### Settings

- Store automation settings.
- Store output folder settings for extract and distill workflows.
- Store prompt templates.
- Store popup UI preferences:
  - width
  - height up to Chrome popup limit
  - font size
  - text contrast

## Non-Functional Requirements

- Must comply with Chrome Extension MV3 CSP.
- Must not use inline scripts or inline event handlers in extension HTML.
- Must preserve user settings in `chrome.storage.local`.
- Must keep UI responsive within Chrome action popup limits.
- Must keep workflows usable even when content scripts or AI selectors need future updates.
- Must keep documentation current enough for future sessions to resume safely.

## Constraints

- Chrome action popup max size is approximately `800x600`.
- Popup closes when focus leaves the popup; this is a platform behavior.
- Chrome cannot download directly to arbitrary system paths, only permitted download locations.
- AI automation relies on current DOM selectors and authenticated browser sessions.

## Documentation Responsibilities

- `README.md`: current project overview and usage.
- `DESIGN.md`: visual and component design system.
- `NAV_MAP.md`: UI navigation, DOM, event, message, and storage map.
- `schema.md`: storage and message contracts.
- `decisions.md`: long-term design decisions.
- `status.md`: short current-state handoff.
