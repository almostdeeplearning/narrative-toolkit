---
name: Editorial Insight
colors:
  surface: '#faf9fb'
  surface-dim: '#dbd9dc'
  surface-bright: '#faf9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f5'
  surface-container: '#efedef'
  surface-container-high: '#e9e8ea'
  surface-container-highest: '#e3e2e4'
  on-surface: '#1b1c1d'
  on-surface-variant: '#43474d'
  inverse-surface: '#303032'
  inverse-on-surface: '#f2f0f2'
  outline: '#74777e'
  outline-variant: '#c4c6ce'
  surface-tint: '#49607b'
  primary: '#00040d'
  on-primary: '#ffffff'
  primary-container: '#041f37'
  on-primary-container: '#7088a4'
  inverse-primary: '#b1c9e8'
  secondary: '#565f6b'
  on-secondary: '#ffffff'
  secondary-container: '#dae3f1'
  on-secondary-container: '#5c6571'
  tertiary: '#0b0300'
  on-tertiary: '#ffffff'
  tertiary-container: '#321700'
  on-tertiary-container: '#a97d59'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d1e4ff'
  primary-fixed-dim: '#b1c9e8'
  on-primary-fixed: '#011d34'
  on-primary-fixed-variant: '#314862'
  secondary-fixed: '#dae3f1'
  secondary-fixed-dim: '#bec7d5'
  on-secondary-fixed: '#131c26'
  on-secondary-fixed-variant: '#3f4852'
  tertiary-fixed: '#ffdcc2'
  tertiary-fixed-dim: '#f0bc94'
  on-tertiary-fixed: '#2e1500'
  on-tertiary-fixed-variant: '#623f20'
  background: '#faf9fb'
  on-background: '#1b1c1d'
  surface-variant: '#e3e2e4'
typography:
  h1:
    fontFamily: Bodoni Moda
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  h2:
    fontFamily: Bodoni Moda
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: 0em
  body-lg:
    fontFamily: Domine
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Domine
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  label-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-padding: 20px
---

## Brand & Style

This design system is built upon the principles of **Editorial Clarity**. The brand personality is one of a "distinguished archivist"—a sophisticated and authoritative presence that organizes information with academic precision. The target audience consists of knowledge workers, researchers, and serious readers who value deep focus and a scholarly atmosphere within their digital workspace.

The aesthetic shifts from modern minimalism to a "Literary & Refined" atmosphere. By pairing classic serif typography with a somber, muted palette, the UI evokes the feeling of a high-end journal or a private library. It is designed to foster a sense of intellectual rigor while remaining easy on the eyes during heavy research sessions.

## Colors

The palette is anchored by a neutral slate-gray background (`#777779`), providing a sophisticated, low-contrast canvas that feels more substantial than pure white. Pure white (`#FFFFFF`) is reserved for high-contrast content cards to ensure text pops.

*   **Primary (Slate Blue):** Used for structural elements, primary actions, and meaningful focus states (`#627995`).
*   **Secondary (Cool Gray):** A muted gray (`#6f7884`) utilized for supporting UI elements and less prominent interactive components.
*   **Tertiary (Deep Umber):** A dark, rich chocolate tone (`#321700`) used for high-contrast accents or specific callouts that require a scholarly emphasis.
*   **Typography:** We avoid pure black to maintain the refined aesthetic; instead, we use the Tertiary Deep Umber for headlines and a deep charcoal for body copy to ensure high legibility with a book-like feel.

## Typography

The typography system uses a sophisticated pairing of serifs and a clean sans-serif. **Bodoni Moda** is used for headlines to provide a classic, high-fashion editorial feel. **Domine** is selected for body text for its exceptional legibility and traditional book-like qualities, which assist with long-form reading.

Line heights are intentionally generous (1.6x for body text) to assist with tracking. Headlines use a heavier weight to provide clear structural hierarchy. All labels and functional metadata should be rendered in **Manrope** (`label-sm`), providing a functional, modern contrast to the more decorative serif fonts.

## Layout & Spacing

The layout follows a **fluid grid** model tailored for the constrained dimensions of a browser extension popup or side panel. A standard 20px gutter (container padding) is maintained to prevent content from feeling "squeezed" against the browser edges.

Spacing follows a strict 4px/8px rhythmic scale. Components should rely on internal padding (`md` or 16px) to maintain an organized and breathable structure. Vertical stack spacing between cards should default to `sm` (8px), while section breaks should use `lg` (24px).

## Elevation & Depth

This design system utilizes **Tonal Layering** and subtle depth to create an organized hierarchy.

*   **Base Layer:** The neutral gray foundation is the lowest point of the UI.
*   **Card Layer:** White surfaces use a very soft, diffused shadow: `0 4px 12px rgba(0, 0, 0, 0.08)`. This creates a gentle lift that distinguishes the content from the gray background.
*   **Interactive Layer:** Hover states use a slightly more pronounced shadow and a subtle color shift to indicate interactivity.
*   **Borders:** Use low-contrast, thin outlines (1px) in the secondary gray to define boundaries without adding visual clutter.

## Shapes

The shape language is consistently **Rounded**. A 0.5rem (8px) corner radius is the default for standard buttons and cards. This radius is large enough to feel contemporary, yet disciplined enough to maintain a professional, academic aesthetic.

Larger components may use the `rounded-lg` (16px) setting to emphasize their role as a container. Small UI elements like checkboxes or tag chips should scale their radius down proportionally but always maintain a hint of softness.

## Components

*   **Cards:** Pure white background, 8px corner radius, and subtle ambient shadows. Use 16px internal padding.
*   **Buttons:**
    *   *Primary:* Solid Slate Blue with white text. No shadow on the button itself; use a slight opacity shift on hover.
    *   *Secondary:* Ghost style with a Slate Blue outline (1px) or a light gray-blue tint background.
*   **Inputs:** Clean fields with a secondary gray border that transforms into a Slate Blue border (2px) on focus. Labels use Manrope for functional clarity.
*   **Chips/Tags:** Used for categorization. These should use the secondary gray at 20% opacity with Slate Blue text for a refined, professional look.
*   **Lists:** Items should be separated by clear whitespace and subtle 1px dividers in the outline-variant color.