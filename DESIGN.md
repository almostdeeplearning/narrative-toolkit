---
name: Narrative Toolkit
version: 0.1.0
description: A compact Chrome extension interface for AI-assisted extraction, distillation, prompt management, and document export workflows.
colors:
  bg: "#0A0A0A"
  bg2: "#111111"
  bg3: "#1A1A1A"
  line: "#222222"
  line2: "#2E2E2E"
  text: "#F0F0F0"
  text2: "#888888"
  text3: "#444444"
  accent: "#F0F0F0"
  accentBg: "rgba(240,240,240,0.06)"
  success: "#3ECF8E"
  danger: "#F87171"
  warning: "#F59E0B"
  info: "#60A5FA"
contrastModes:
  standard:
    text2: "#888888"
    text3: "#444444"
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
    fontSize: "9px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "1.5px"
    textTransform: uppercase
  body:
    fontFamily: "{typography.fontFamily.sans}"
    fontSize: "13px"
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
  popupWidthDefault: "780px"
  popupWidthCompact: "500px"
  popupWidthMedium: "640px"
  popupHeightDefault: "600px"
  popupHeightMax: "600px"
  sidebarWidth: "72px"
  topbarHeight: "52px"
  panelPadding: "24px"
  sectionPadding: "20px"
components:
  button:
    borderRadius: "{radii.md}"
    borderColor: "{colors.line2}"
    background: transparent
    color: "{colors.text2}"
    padding: "9px 16px"
    fontFamily: "{typography.fontFamily.mono}"
    fontSize: "10px"
    fontWeight: 500
    letterSpacing: "0.5px"
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
    fontSize: "13px"
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

Narrative Toolkit is a dense, work-focused Chrome extension for moving content through AI extraction, distillation, prompt management, review, and export. The design language is monochrome, compact, and terminal-adjacent: a matte black workspace, fine borders, restrained typography, and small status colors used only when state needs to be unmistakable.

This interface should feel like a reliable control surface rather than a marketing product. Favor fast scanning, predictable panel structure, compact controls, and quiet feedback over decorative visuals.

## Source Analysis

The current project does not contain React components or standalone CSS files. The UI is implemented as static extension markup in `popup.html`, with embedded CSS and behavior wired from `src/popup.js`.

Primary UI surfaces found in the codebase:

- Sidebar navigation for Extract, Distill, Prompts, and Config.
- Topbar with current workflow title and optional AI target selector.
- Extract workflow with step indicators, prompt selection, run controls, logs, Grok response previews, AI structure controls, and review table.
- Distill workflow with source text capture, markdown format cards, prompt picker, AI selector, logs, and generated result preview.
- Prompt Manager with a two-pane series-and-prompts layout.
- Settings sections for automation, download folders, prompt templates, popup size, font size, and text contrast.
- CSP-safe UI glue is kept in an external script so the extension can satisfy MV3 security rules.

## Visual Direction

Use a precise, dark utility aesthetic:

- Black base surfaces with subtle nested contrast.
- Borders as the primary separator; avoid shadows.
- Small uppercase mono labels for structure.
- Chinese/Taiwanese product copy in sans-serif for readability.
- Buttons and pills should feel like compact instrument controls.
- Data-heavy areas should prioritize legibility and editing affordance.

Do not introduce marketing-style hero sections, gradient backgrounds, rounded oversized cards, decorative illustrations, or large colorful surfaces.

## Colors

The palette is intentionally narrow. Most UI meaning comes from contrast, border weight, and state colors.

- **Background / App Shell:** `#0A0A0A` is the outer popup base.
- **Secondary Surface:** `#111111` is used for sidebar, sections, and panels.
- **Raised Input Surface:** `#1A1A1A` is used for inputs, selected nav items, rows, tables, logs, and editable blocks.
- **Border:** `#222222` is the default structural divider.
- **Strong Border:** `#2E2E2E` is used for focus, hover, and active boundaries.
- **Primary Text:** `#F0F0F0` is reserved for active labels, primary actions, and important content.
- **Secondary Text:** `#888888` is used for readable supporting text.
- **Muted Text:** `#444444` is used for metadata, placeholders, inactive labels, and quiet empty states.
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

- Topbar title: `11px`, DM Mono, uppercase, `2px` letter spacing.
- Section title: `10px`, DM Mono, uppercase, `1.5px` letter spacing.
- Field label: `9px`, DM Mono, uppercase, `1.5px` letter spacing.
- Body/input: `13px`, Noto Sans TC, `1.6` line height.
- Small body: `11px`, Noto Sans TC, `1.5` line height.
- Log/metadata: `9px-10px`, DM Mono.

## Layout

The popup is a fixed-height, split-shell application:

- Body width defaults to `780px`; supported widths are `500px`, `640px`, and `780px`.
- Body height defaults to `600px`; Chrome action popup height should not exceed `600px`.
- The left sidebar is fixed at `72px`.
- The topbar is fixed at `52px`.
- Main panels scroll vertically inside `.panel-scroll`.
- Content padding is `24px`.
- Section padding is `20px`.
- Prompt Manager intentionally breaks out to a full-height two-pane layout with `margin: -24px`.

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

The sidebar is a narrow command rail with a small geometric brand mark, vertical navigation items, and a bottom config item.

Navigation items:

- Full width inside `6px` horizontal sidebar padding.
- `7px` vertical padding.
- Mono code-like abbreviation above a tiny uppercase label.
- Inactive color: `text3`.
- Hover: `accentBg` background and `text2`.
- Active: `bg3` background, `text`, and a `2px` left active indicator.

### Topbar

The topbar anchors the active workflow:

- Height `52px`.
- Horizontal padding `24px`.
- Bottom border `line`.
- Title uses DM Mono uppercase.
- Optional AI selector appears on the right as pills.

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
- Gap `6px`.
- Border `line2`.
- Text `text2`.
- Background transparent.
- Radius `6px`.
- DM Mono `10px`, medium weight.
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

- `.btn-sm`: `6px 11px`, `9px`.
- `.btn-xs`: `4px 8px`, `9px`.

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
- Body font `Noto Sans TC`, `13px`, line height `1.6`.

Use DM Mono textareas for prompt templates, logs, code-like values, and generated markdown previews.

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

### Prompt Manager

Prompt Manager is a dense two-pane editor:

- Left pane width `200px`.
- Border-right `line`.
- Left pane padding `20px 16px`.
- Right pane padding `20px`.
- Series items use `9px 10px`, radius `6px`, hover `bg3`, active border `line2`.
- Prompt editor items use `bg3`, border `line`, radius `6px`, padding `12px`.

The two-pane layout should stay functional at the supported popup widths. Truncate long names with ellipsis.

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

The extension supports fixed popup widths rather than full responsive breakpoints:

- `500px`: compact mode; preserve sidebar and reduce horizontal content expectations.
- `640px`: medium mode for routine workflows.
- `780px`: default full mode for tables, prompt management, and review.
- Height presets must stay within Chrome action popup limits. Use Side Panel for taller persistent workspaces.

At narrower widths:

- Prefer horizontal scrolling for tables.
- Preserve control alignment.
- Truncate filenames and series names.
- Keep action buttons from wrapping awkwardly by using compact variants.

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

Current design tokens are defined as CSS custom properties in `popup.html` under `:root`. If the UI is later migrated to React, preserve the same token names and component behaviors:

- `--bg`, `--bg2`, `--bg3`
- `--line`, `--line2`
- `--text`, `--text2`, `--text3`
- `--green`, `--red`, `--amber`, `--blue`
- `--sidebar-w`
- `--popup-h`
- `--r`, `--r2`

Any React migration should model the existing interface as composable primitives: `Sidebar`, `Topbar`, `Section`, `Button`, `AiPills`, `PromptRow`, `LogStrip`, `ResultPreview`, `Toggle`, `FormatCard`, `LibraryItem`, and `PromptManagerPane`.

Extension HTML must remain CSP-safe. Keep scripts external and attach behavior with event listeners rather than inline event attributes.
