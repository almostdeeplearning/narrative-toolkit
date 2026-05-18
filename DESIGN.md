---
name: Narrative Toolkit
version: 0.1.0
description: A compact Chrome Side Panel interface for browser-native X narrative scanning, AI workflows, prompt management, and markdown-oriented export.
colors:
  bg: "#13110F"
  bg2: "#111111"
  bg3: "#1A1A1A"
  line: "#222222"
  line2: "#2E2E2E"
  text: "#F0F0F0"
  text2: "#B8B2A6"
  text3: "#7A7468"
  accent: "#F0F0F0"
  accentBg: "rgba(240,240,240,0.06)"
  success: "#3ECF8E"
  danger: "#F87171"
  warning: "#F59E0B"
  info: "#60A5FA"
contrastModes:
  standard:
    text2: "#B8B2A6"
    text3: "#7A7468"
  bright:
    text2: "#B8B8B8"
    text3: "#6F6F6F"
  max:
    text2: "#D0D0D0"
    text3: "#969696"
typography:
  fontFamily:
    sans: "'Noto Sans TC', sans-serif"
    mono: "'DM Mono', monospace"
  h1:
    fontFamily: "{typography.fontFamily.mono}"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "2px"
    textTransform: uppercase
  sectionTitle:
    fontFamily: "{typography.fontFamily.mono}"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "1.5px"
    textTransform: uppercase
  label:
    fontFamily: "{typography.fontFamily.mono}"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "1.5px"
    textTransform: uppercase
  body:
    fontFamily: "{typography.fontFamily.sans}"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  bodySmall:
    fontFamily: "{typography.fontFamily.sans}"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.5
  monoSmall:
    fontFamily: "{typography.fontFamily.mono}"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1.7
spacing:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "12px"
  "2xl": "14px"
  "3xl": "16px"
  "4xl": "20px"
  "5xl": "24px"
  "6xl": "28px"
radii:
  sm: "3px"
  md: "6px"
  lg: "10px"
  pill: "99px"
  circle: "50%"
layout:
  sidePanelWidth: "user-dragged"
  sidePanelHeight: "100vh"
  topnavHeight: "44px"
  panelPadding: "24px"
  sectionPadding: "20px"
components:
  button:
    borderRadius: "{radii.md}"
    borderColor: "{colors.line2}"
    background: transparent
    color: "{colors.text2}"
    padding: "5px 10px"
    fontFamily: "{typography.fontFamily.mono}"
    fontSize: "12px"
    fontWeight: 500
    letterSpacing: "0.2px"
  buttonPrimary:
    background: "{colors.text}"
    color: "{colors.bg}"
    borderColor: "{colors.text}"
  input:
    background: "{colors.bg3}"
    borderColor: "{colors.line}"
    borderRadius: "{radii.md}"
    color: "{colors.text}"
    padding: "10px 12px"
    fontSize: "15px"
  selectCompact:
    background: "{colors.bg3}"
    borderColor: "{colors.line}"
    borderRadius: "{radii.md}"
    color: "{colors.text}"
    fontFamily: "{typography.fontFamily.sans}"
    fontSize: "12px"
    height: "28px"
    padding: "0 26px 0 10px"
    appearance: none
    arrowColor: "{colors.text3}"
  section:
    background: "{colors.bg2}"
    borderColor: "{colors.line}"
    borderRadius: "{radii.lg}"
    padding: "{spacing.4xl}"
  pill:
    borderRadius: "{radii.pill}"
    borderColor: "{colors.line2}"
    background: transparent
    color: "{colors.text3}"
    padding: "4px 10px"
  toggle:
    width: "32px"
    height: "18px"
    trackOff: "{colors.line2}"
    trackOn: "{colors.text}"
    knobOff: "{colors.text3}"
    knobOn: "{colors.bg}"
---

# Narrative Toolkit Design System

## Overview

Narrative Toolkit is a dense, work-focused Chrome Side Panel for browser-native X narrative scanning, AI workflow execution, prompt management, review, and export. The design language is monochrome, compact, and terminal-adjacent: a matte black workspace, fine borders, restrained typography, and small status colors used only when state needs to be unmistakable.

This interface should feel like a reliable control surface rather than a marketing product. Favor fast scanning, predictable panel structure, compact controls, and quiet feedback over decorative visuals.

## Source Analysis

The current project does not contain React components or standalone CSS files. The UI is implemented as static extension markup in `sidepanel.html`, with embedded CSS and behavior wired from `src/sidepanel.js`. `popup.html` is retained as a development reference only and is not loaded by the extension.

Primary UI surfaces found in the codebase:

- Horizontally scrollable Topnav for Extract, Custom Flow, Prompts, Schema, and Settings. Distill Tab is deprecated (Phase 1) and no longer accessible from navigation.
- Extract (X ETL) workflow with 5 vertical timeline Card blocks: Prompt selection, Schema selection, Target AI, Run Extract, Save Result.
- Custom Flow workflow with 5 collapsible Block Cards (Source / Task / Format / AI / Run), per-block delay settings, preset save/load, and a run-all control.
- Prompt Manager with a horizontal series tab bar and expandable prompt cards; supports JSON import/export.
- Schema tab with expandable schema cards for format template management; supports JSON import/export.
- First-run starter content is intentionally lightweight:
  - Prompt starter series: `Narrative Scan Starter Pack`, `AI Flow Starter Pack`
  - Starter schemas: `wiki.md`, `table.md`
- Settings sections for automation, download folders, font size, and text contrast.
- CSP-safe UI glue is kept in `src/popup-ui-patch.js` so the extension satisfies MV3 security rules.
- Distill Block logic is split into 5 plain-script files under `src/blocks/`, loaded before `sidepanel.js`. These blocks are partially shared with Custom Flow.

## Visual Direction

Use a precise, dark utility aesthetic:

- Black base surfaces with subtle nested contrast.
- Borders as the primary separator; avoid shadows.
- Small uppercase mono labels for structure.
- English is the default first-run UI language; bilingual product copy should still remain readable and visually balanced.
- Buttons and pills should feel like compact instrument controls.
- Data-heavy areas should prioritize legibility and editing affordance.

Do not introduce marketing-style hero sections, gradient backgrounds, rounded oversized cards, decorative illustrations, or large colorful surfaces.

## Colors

The palette is intentionally narrow. Most UI meaning comes from contrast, border weight, and state colors.

- **Background / App Shell:** `#13110F` is the Side Panel base（微暖深灰，比純黑減少眼睛疲勞）.
- **Secondary Surface:** `#111111` is used for Topnav, sections, and card headers.
- **Raised Input Surface:** `#1A1A1A` is used for inputs, selected nav items, rows, tables, logs, and editable blocks.
- **Border:** `#222222` is the default structural divider.
- **Strong Border:** `#2E2E2E` is used for focus, hover, and active boundaries.
- **Primary Text:** `#F0F0F0` is reserved for active labels, primary actions, and important content.
- **Secondary Text:** `#B8B2A6` is used for readable supporting text（微暖灰調，對比比約 8.7:1）.
- **Muted Text:** `#7A7468` is used for metadata, placeholders, inactive labels, and quiet empty states（對比比約 4.2:1，接近 WCAG AA）.
- **Success:** `#3ECF8E` marks completed work, saved states, and positive log lines.
- **Danger:** `#F87171` marks stop, delete, reject, and error states.
- **Warning:** `#F59E0B` marks waiting, caution, pending badges, and warning logs.
- **Info:** `#60A5FA` marks running progress and AI processing state.

Accessibility note: because the UI is very dark, avoid placing `text3` on `bg` for essential information. Use `text2` or `text` for anything the user must read.

Text contrast may be user-adjusted. Preserve the default restrained theme, but support brighter `text2` and `text3` values for long sessions or low-visibility environments.

## Typography

Use two fonts:

- **Noto Sans TC:** primary interface text, textarea content, form values, Chinese labels, long-form result previews.
- **DM Mono:** navigation labels, section titles, numeric counters, logs, table headers, button labels, AI pills, and metadata.

Typography should stay compact. Do not scale type with viewport width. Keep letter spacing non-negative; the current visual system relies on uppercase mono labels with positive tracking.

Recommended scale:

- Topbar title: `10px`, DM Mono, uppercase, `1.5px` letter spacing.
- Section title: `10px`, DM Mono, uppercase, `1.5px` letter spacing.
- Field label / `.label`: `11px`, DM Mono, uppercase, `1.5–2px` letter spacing.
- Button label: `12px`, DM Mono, medium weight.
- Body base: `14px`, Noto Sans TC, `1.6` line height（設於 `body`，所有元素的繼承基準）.
- Input / textarea: `15px`, Noto Sans TC, `1.6` line height.
- Compact select (`.select-compact`): `12px`, Noto Sans TC.
- Small body: `11px`, Noto Sans TC, `1.5` line height.
- Log/metadata: `9px-10px`, DM Mono.

## Layout

The primary UI is a Chrome Side Panel (`sidepanel.html`), fixed at the right side of the browser. Width is user-controlled by dragging; height fills the browser window.

- Navigation uses a horizontally scrollable Topnav (`44px` height), replacing the old vertical sidebar.
- Main panels scroll vertically inside `.panel-scroll` or `.panel-fill`.
- Content padding is `24px`.
- Prompt Manager and Schema use `.panel-fill` with full-height flex layout.
- Custom Flow uses `.panel-scroll` with a vertically stacked Block Card layout.
- `popup.html` is retained as a development reference only and is not loaded by the extension.

Maintain clear spatial grouping:

- Use sections for workflow steps and configuration groups.
- Use `12px` gaps between stacked sections.
- Use compact `6px-10px` gaps inside controls.
- Use tables and preformatted blocks for reviewable AI output.

## Shapes

The system uses tight radii:

- Standard controls: `6px`.
- Larger sections: `10px`.
- Small destructive icon buttons: `2px-3px`.
- Pills and counters: `99px`.
- Step numbers and toggle knobs: circular.

Avoid soft, plush, or very rounded UI. This product should remain crisp and utilitarian.

## Elevation And Depth

Do not use drop shadows as a default layering device. Depth is created by:

- Surface contrast between `bg`, `bg2`, and `bg3`.
- Thin borders.
- Active borders.
- Minimal glow only for transient running states, such as the blue prompt row animation.

Modal-like layering is not currently part of the interface. If added later, use a dark overlay and a bordered `bg2` dialog with the same radius system.

## Components

### Sidebar

Deprecated. The current product no longer uses the old vertical sidebar navigation. Keep this section only as historical reference when comparing legacy popup-era screenshots or styles. All current navigation guidance should follow the Topbar / Topnav rules below.

### Topbar

The topbar anchors the active workflow:

- Height `44px`.
- Horizontal padding `24px`.
- Bottom border `line`.
- Title uses DM Mono uppercase.
- Optional AI selector appears on the right as pills.
- Language toggle is compact and unobtrusive; first-run default should land in English unless a saved `uiLanguage` exists.

Keep the topbar quiet. It is a locator, not a hero.

### Sections

Sections are the main grouping primitive:

- Background `bg2`.
- Border `line`.
- Radius `10px`.
- Padding `20px`.
- Active section border may use `line2`.

Section headers should align title left and compact controls right. Do not nest section cards inside section cards.

### Buttons

Base buttons:

- Inline-flex with centered content.
- Gap `4px`.
- Border `line2`.
- Text `text2`.
- Background transparent.
- Radius `6px`.
- Padding `5px 10px`.
- DM Mono `12px`, medium weight.
- Hover moves text to `text` and border toward `text3`.

Primary buttons:

- Background `text`.
- Text `bg`.
- Border `text`.
- Hover background `#D0D0D0`.

Danger and success buttons:

- Default transparent with colored border/text.
- Hover fills with semantic color and uses dark text.

Small variants:

- `.btn-sm`: padding `4px 9px`, `9px` font.
- `.btn-xs`: padding `3px 8px`, `8px` font.

Use icons for clear commands when available, but keep icon size around `10px` to match the compact system.

### AI Pills And Chips

AI selectors and prompt chips are pill-shaped controls:

- Radius `99px`.
- Border `line2`.
- Inactive text `text3`.
- Active state uses `text`, `text` border, and `bg3`.
- Hover uses `text` or `text2` and a slightly stronger border.

Do not make pills large or colorful. They should read as compact mode switches.

### Inputs And Textareas

Inputs and textareas:

- Background `bg3`.
- Border `line`.
- Radius `6px`.
- Padding `10px 12px`.
- Text `text`.
- Placeholder `text3`.
- Focus border `line2`.
- Body font `Noto Sans TC`, `15px`, line height `1.6`.

Use DM Mono textareas for prompt templates, logs, code-like values, and generated markdown previews.

### Compact Select (Dropdown)

All `<select>` dropdowns in the extension use `.select-compact` (not `.input`) to ensure consistent cross-platform rendering:

- `appearance: none; -webkit-appearance: none` — removes OS native rendering.
- Background `bg3`, border `line`, radius `6px`.
- Font `Noto Sans TC`, `12px`.
- Height `28px`, padding `0 26px 0 10px`.
- Custom SVG arrow (fill `text3`) positioned `right 9px center`.
- Focus border `line2`.
- Applied to: `extractSeriesSel`, `extractPromptList` (ETL), `cfPresetSel` (Custom Flow), `seriesSelect` (Prompts tab).
- Modifier classes (`.extract-prompt-sel`, `.cf-preset-sel`, `.series-select`) retain only layout-specific overrides such as `min-width`, `max-width`, or `margin`.

### Step Indicator

The Extract workflow uses four compact steps:

- Step number is `24px` circular.
- Default border `line2`, text `text3`.
- Active border/text `text`, background `bg3`.
- Done border/text `success`.
- Connectors are `1px` horizontal `line`.

The stepper should communicate progress without dominating the panel.

### Prompt Rows

Prompt rows are editable, compact work items:

- Background `bg3`.
- Border `line`.
- Radius `6px`.
- Padding `10px 12px`.
- Number column uses DM Mono `9px`, muted.
- Textarea uses Noto Sans TC `12px`, transparent background.

State borders:

- Running: blue border with subtle glow.
- Done: success-tinted border.
- Error: danger-tinted border.

### Logs

Logs use a compact terminal strip:

- Background `bg3`.
- Border `line`.
- Radius `6px`.
- Padding `8px 12px`.
- DM Mono `10px`.
- Max height around `72px`.
- Line height `1.7`.

Use semantic colors only for log level text: info muted, success green, warning amber, error red.

### Tables

Review tables are compact and editable:

- Wrapper border `line`, radius `6px`, horizontal overflow allowed.
- Header background `bg3`, DM Mono `9px`, uppercase-like tracking.
- Body text `text2`.
- Editable cells use `accentBg` on focus and text `text`.
- Keep `max-width` and word breaking to prevent layout blowouts.

### Result Preview

Generated markdown and raw AI output use `.result-pre`:

- Background `bg3`.
- Border `line`.
- Radius `6px`.
- Padding `12px`.
- DM Mono `10px`.
- Text `text2`.
- White-space preserved.
- Vertical scroll for long content.

### Toggle

Toggles are compact:

- Track `32px x 18px`.
- Knob `12px`.
- Off track `line2`, off knob `text3`.
- On track `text`, on knob `bg`.
- Movement distance `14px`.

Use toggles only for persistent binary settings.

### Format Cards

Distill format cards are small selectable cards:

- Two-column grid.
- Background `bg3`.
- Border `line`.
- Radius `6px`.
- Padding `14px 16px`.
- Active border `text2`.
- Name uses DM Mono `11px`.
- Description uses `10px` muted text.

These cards represent output modes, not marketing cards.

### Custom Flow Block Cards

Custom Flow uses a vertical stack of collapsible Block Cards (`.cf-card`):

- Background `bg2`.
- Border `line`.
- Radius `6px`.
- Collapsed state (`.cf-collapsed`): only the card header is visible; body is hidden.
- Active state (`.cf-active`): border brightens to `text2` to indicate the block is currently executing.
- Card header (`.cf-card-head`): contains a numeric badge, title, delay selector, and show/hide toggle button.
- Card body (`.cf-card-body`): full content area; padding `14px`.
- Delay selector (`.cf-delay-sel`): small dropdown for 無延遲 / 2s / 5s / 10s / 20s / 自訂. English label should read `Wait before next step (s)`.
- Custom delay input (`.cf-delay-custom`): appears only when "自訂" is selected.
- Run-all bar (`.cf-run-bar`): sits above Card 1; contains the primary "▶▶ 一鍵跑完全部" button and a hint label.

Follow the same card visual language as the Prompts and Schema tabs. Do not make block cards visually heavier than section cards.

### Prompt Manager

Prompt Manager uses a horizontal series tab bar + vertical card stack:

- Series tab bar (`series-tabbar`): compact `.select-compact` dropdown for series selection; action buttons for add, rename, import, export.
- Card area (`seriesCards`): vertically scrollable list of `.pcard` expandable cards.
- Each `.pcard` header shows prompt name with a pencil hint; expanded body contains a name input, textarea editor, char count, and copy button.
- Only one card expands at a time (`expandedCardIdx`).
- Supports JSON import/export for the full prompt series collection.
- Truncate long names with ellipsis in collapsed card headers.
- First-run starter content should feel like a lightweight demo pack rather than a template dump. Keep starter series few, deletable, and clearly reusable.

### Schema / Format Manager

Schema / Format Manager uses the same expandable card language as Prompt Manager, but starter templates should be even more restrained than prompts.

- Starter schema set should remain minimal and workflow-oriented.
- Current intended first-run starter templates are `wiki.md` and `table.md`.
- Avoid shipping a broad library of format templates by default unless they support a clearly visible primary workflow.

### Library Items

Recent file/library rows:

- Compact horizontal layout.
- Filename truncates with ellipsis.
- Date uses DM Mono `9px`.
- Hover uses `accentBg` and small radius.
- Actions remain small and low emphasis.

## Motion

Motion is minimal:

- Border, color, and background transitions should be `0.15s-0.2s`.
- Progress fill transition may be `0.35s`.
- Running prompt glow may pulse gently at `1.4s`.

Avoid large animated entrances, page transitions, or decorative motion.

## Content

The product copy may be bilingual or Traditional Chinese-first. Because the app is a workflow tool:

- Labels should be short.
- Buttons should use verbs.
- Logs should be timestamped when possible.
- Empty states should explain what is missing in one concise sentence.
- Do not add instructional paragraphs inside the interface unless the workflow is blocked.

Current source files contain mojibake in some comments and text nodes. Future UI copy should be saved as UTF-8 and checked inside Chrome extension context.

## Accessibility

- Keep essential text at `text2` or brighter.
- Ensure primary actions have strong contrast.
- Maintain visible focus via border color changes.
- Preserve keyboard focus for inputs, textareas, buttons, and editable table cells.
- Do not rely only on color for prompt row state; include status text or icons where possible.
- Keep small labels readable by limiting them to metadata and control labels.
- Provide user-selectable font size and text contrast modes without changing the core product style.

## Responsive Behavior

The extension runs exclusively as a Chrome Side Panel. Width is user-dragged; the UI must remain functional across a wide range of panel widths.

- Prefer horizontal scrolling for tables rather than breaking layout.
- Truncate filenames, series names, and prompt previews with ellipsis.
- Keep action buttons compact (`.btn-xs`, `.btn-sm`) so they do not wrap awkwardly.
- Topnav uses horizontal scroll when tabs overflow the panel width.
- Do not use fixed pixel widths for content areas; rely on flex and `min-width: 0` to prevent overflow.

## Do

- Use the existing tokens before inventing new colors.
- Keep UI dense, calm, and operational.
- Use borders and surface contrast for hierarchy.
- Use mono labels for structure and metadata.
- Keep primary actions visually obvious but not oversized.
- Use semantic colors only for state.
- Test popup widths after UI changes.

## Do Not

- Do not add gradients, decorative orbs, hero sections, or marketing imagery.
- Do not introduce large rounded cards or card-within-card layouts.
- Do not use colorful backgrounds as a primary layout language.
- Do not use shadows for routine depth.
- Do not make body copy tiny when it contains user-generated or AI-generated content.
- Do not add a third typeface.
- Do not replace compact workflow controls with spacious landing-page composition.

## Implementation Notes

Current design tokens are defined as CSS custom properties in `sidepanel.html` under `:root`. If the UI is later migrated to React, preserve the same token names and component behaviors:

- `--bg`, `--bg2`, `--bg3`
- `--line`, `--line2`
- `--text`, `--text2`, `--text3`
- `--green`, `--red`, `--amber`, `--blue`
- `--sidebar-w`
- `--popup-h`
- `--r`, `--r2`

Any React migration should model the existing interface as composable primitives: `Topnav`, `Section`, `Button`, `AiPills`, `CompactSelect`, `PromptRow`, `LogStrip`, `ResultPreview`, `Toggle`, `FormatCard`, `LibraryItem`, `PromptCard`, `SchemaCard`, and `CustomFlowCard`.

Extension HTML must remain CSP-safe. Keep scripts external and attach behavior with event listeners rather than inline event attributes.
