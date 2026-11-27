---
name: NativeScroll
description: Back to native scrolling. Chromium WebUI Material Design 3 architecture.
colors:
  primary: "#1a73e8"
  primary-dark: "#8ab4f8"
  neutral-canvas-light: "#f8f9fa"
  neutral-surface-light: "#ffffff"
  neutral-canvas-dark: "#202124"
  neutral-surface-dark: "#292a2d"
  text-primary-light: "#202124"
  text-secondary-light: "#5f6368"
  text-primary-dark: "#e8eaed"
  text-secondary-dark: "#9aa0a6"
  border-light: "#dadce0"
  border-dark: "#3c4043"
  status-active: "#137333"
  status-warn: "#8f4700"
  status-danger: "#c5221f"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Google Sans Text', sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Google Sans Text', sans-serif"
    fontSize: "13.5px"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "0em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Google Sans Text', sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Google Sans Text', sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0em"
  label:
    fontFamily: "'SF Mono', SFMono-Regular, ui-monospace, Menlo, Consolas, monospace"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.04em"
rounded:
  card: "12px"
  control: "8px"
  item: "10px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "0 16px"
  mode-card:
    backgroundColor: "{colors.neutral-surface-light}"
    textColor: "{colors.text-primary-light}"
    rounded: "{rounded.item}"
    padding: "10px 12px"
---

# Design System: NativeScroll (Google Chrome Native)

## Overview

**Design Philosophy: "Chromium Native WebUI"**

NativeScroll is completely aligned with Google Chrome's native desktop design language (Material Design 3 / Chrome Refresh 2023). It leverages the open-source Chromium WebUI tokens and design patterns from `cr_elements` and `cr_shared_vars`, ensuring that toolbar popups and extension options feel seamless and indistinguishable from Chrome's own internal surfaces (`chrome://settings`, `chrome://extensions`).

The surface mode is **Operate**: high legibility, immediate physical state feedback, authentic Chrome controls, and zero visual friction.

### Key Characteristics:
- **Chromium Design Tokens:** Direct adherence to `--color-sys-primary` (`#1a73e8` light / `#8ab4f8` dark), `--color-sys-surface`, `--color-sys-outline`, and Google color steps (`--google-grey-900`, `--google-blue-600`, etc.).
- **Authentic `<cr-toggle>` Switches:** Material 3 capsule switches with exact pill dimensions (40px x 24px) and smooth hardware-accelerated translations.
- **Card-Based Site Mode Selection:** Clean card containers featuring Google Material Symbol icons, mode status chips, high-contrast titles, and Chrome radio button rings.
- **Chrome Settings Fieldset Organization:** Section cards with inner dividing lines, accessible form controls, and pill action buttons.

## Color Palette

### Primary (Chromium Action Blue)
- **Light (`#1a73e8` / `--google-blue-600`):** Primary action buttons, active toggles, selected card outlines, and focus rings. Hover: `#185abc` (`--google-blue-700`).
- **Dark (`#8ab4f8` / `--google-blue-300`):** Dark mode action blue, active toggles, and highlights. Hover: `#aecbfa`.
- **Primary Container (`#e8f0fe` light / `rgba(138, 180, 248, 0.14)` dark):** Selected mode card surface and interactive badge background.

### Neutrals (Chrome Desktop Surfaces)
- **Page Canvas:** `#f8f9fa` (light, `--google-grey-50`) / `#202124` (dark, `--google-grey-900`).
- **Elevated Card Surface:** `#ffffff` (light) / `#292a2d` (dark).
- **Surface Variant (Subtle Inset):** `#f1f3f4` (light, `--google-grey-100`) / `#303134` (dark).
- **Hairline Border:** `#dadce0` (light, `--google-grey-300`) / `#3c4043` (dark, `--google-grey-800`).
- **Text Primary:** `#202124` (light, `--google-grey-900`) / `#e8eaed` (dark, `--google-grey-200`).
- **Text Secondary:** `#5f6368` (light, `--google-grey-700`) / `#9aa0a6` (dark, `--google-grey-500`).

### Semantic Status
- **Active / Neutralized:** `#137333` text / `#e6f4ea` bg (light); `#81c995` text / `rgba(129, 201, 149, 0.16)` bg (dark).
- **Warning / Strict Alert:** `#8f4700` text / `#fef7e0` bg (light); `#fdd663` text / `rgba(253, 214, 99, 0.16)` bg (dark).
- **Destructive / Danger:** `#c5221f` text / `#fce8e6` bg (light); `#f28b82` text / `rgba(242, 139, 130, 0.16)` bg (dark).

## Typography

**Primary Font Family:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Google Sans Text', Helvetica, Arial, sans-serif`  
**Monospace Font Family:** `'SF Mono', SFMono-Regular, ui-monospace, Menlo, Consolas, monospace`

### Scale
- **Header Large:** 15px, weight 500, line-height 20px, letter-spacing -0.01em.
- **Section / Setting Title:** 13px–13.5px, weight 500, line-height 18px.
- **Body / Description:** 12px–12.5px, weight 400, line-height 18px.
- **Chips & Badges:** 10.5px–11px, weight 500, letter-spacing +0.03em.
- **Monospace Hostnames & Traces:** 11px–12.5px, weight 500.

## Component Specifications

### 1. Card-Based Site Mode Selector
- Grouped inside semantic `<div role="radiogroup" id="site-mode-cards">`.
- Each card `<button class="mode-card" role="radio">` features:
  - 28px circular icon container with Google Material Symbol vector graphic.
  - Body containing Title, Category tag chip, and description.
  - 16px Chrome `<cr-radio-button>` disc indicator with centered 8px inner dot when active.
  - Active state: 1.5px solid border in `--color-sys-primary` with matching container tint.

### 2. Chrome Native Switches (`<cr-toggle>`)
- Pill track: 40px width, 24px height, 2px border.
- Unchecked: Track border in `--google-grey-600` with 12px centered thumb.
- Checked: Track filled with `--color-sys-primary`, thumb expanded to 16px on-primary white translated right by 16px.

### 3. Chrome Outlined Action Buttons (`<cr-button>`)
- Pill shape: 9999px border-radius, 32px height (or 36px for primary form actions).
- Primary button: Solid filled with `--color-sys-primary` and elevation shadow.
- Outlined button: 1px border with hover tint.

### 4. Diagnostics & Expanders
- `<details id="diagnostics-panel">` styled after Chrome settings expander rows with 14px rotating chevron.
- Monospaced diagnostic trace list with clean subtle horizontal dividers.
