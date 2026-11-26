---
name: NativeScroll
description: Back to native scrolling. Zero-latency kinetic scroll architecture.
colors:
  primary: "#0284c7"
  primary-cyan: "#38bdf8"
  neutral-canvas-dark: "#090d16"
  neutral-surface-dark: "#111726"
  neutral-canvas-light: "#f8fafc"
  neutral-surface-light: "#ffffff"
  text-primary-dark: "#f8fafc"
  text-secondary-dark: "#94a3b8"
  text-primary-light: "#0f172a"
  text-secondary-light: "#475569"
  border-dark: "rgba(255, 255, 255, 0.08)"
  border-light: "rgba(15, 23, 42, 0.08)"
  status-active: "#10b981"
  status-warn: "#f59e0b"
  status-danger: "#ef4444"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 450
    lineHeight: 1.45
    letterSpacing: "0em"
  label:
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace"
    fontSize: "10.5px"
    fontWeight: 650
    lineHeight: 1
    letterSpacing: "0.05em"
rounded:
  card: "12px"
  control: "8px"
  item: "10px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-surface-light}"
    rounded: "{rounded.control}"
    padding: "8px 14px"
  mode-card:
    backgroundColor: "{colors.neutral-surface-dark}"
    textColor: "{colors.text-primary-dark}"
    rounded: "{rounded.item}"
    padding: "10px 12px"
---

# Design System: NativeScroll

## Overview

**Creative North Star: "The Calibrated Instrument"**

NativeScroll is a precision developer and power-user browser extension engineered to neutralize artificial momentum, hijacked wheel events, and bloated JavaScript physics engines (Lenis, GSAP ScrollSmoother, Locomotive Scroll). Its visual surface operates not as a decorative accessory, but as a calibrated flight recorder and control cockpit.

The surface mode is **Operate**: clarity, scanability, immediate physical state comprehension, and zero visual friction. Every control communicates its direct cause and effect. Contrast is uncompromising, boundaries are crisp, and transitions are tactile and instantaneous.

**Key Characteristics:**
- **Zero-Latency Restraint:** No gradients on text, no fake frosted glass, and no decorative animations that delay user intent.
- **Deep Obsidian & Crisp Light Foundations:** First-class adaptive theming tuned to native operating system dark and light modes with WCAG AAA/AA contrast compliance.
- **Calibrated Vector Iconography:** Custom authored SVG icons across toolbar assets and in-app controls representing vertical kinetic native displacement.
- **Card-Based Site Mode Cockpit:** Multi-state mode cards with distinct visual radios, role tags, and purpose-built vector glyphs.

## Colors

The palette is anchored in deep obsidian and slate canvas tones, punctuated by an electric cobalt/cyan primary accent that denotes native velocity and precision engineering.

### Primary
- **Electric Cobalt / Cyan** (`#0284c7` light / `#38bdf8` dark): Used for primary action indicators, active selection borders, and focus rings. Represents kinetic authority and verified operation.

### Neutral
- **Deep Obsidian Canvas** (`#090d16`): The dark page ground. Non-reflective, quiet, and expansive.
- **Elevated Surface Card** (`#111726` dark / `#ffffff` light): Dedicated structural cards and controls.
- **Slate Text Primary** (`#f8fafc` dark / `#0f172a` light): Body and headings at ≥16:1 contrast.
- **Muted Slate Secondary** (`#94a3b8` dark / `#475569` light): Descriptive hints and micro-copy at ≥7:1 contrast.
- **Hairline Border** (`rgba(255, 255, 255, 0.08)` dark / `rgba(15, 23, 42, 0.08)` light): Precision structural dividers.

### Semantic
- **Emerald Active** (`#10b981` / `#34d399`): Positive neutralization confirmation and active extension status.
- **Amber Warning** (`#f59e0b` / `#fbbf24`): Strict mode alerts and exclusion notifications.
- **Rose Danger** (`#ef4444` / `#f87171`): Host deletion and destructive clear actions.

### Named Rules
**The Single-Accent Rule.** Electric cobalt/cyan is reserved exclusively for interactive focus, selection, and active switches. It is never applied as random decorative backgrounds or ornamental text.

**The Tinted Neutral Rule.** Muted text and inactive badges are tinted directly with the surface slate hue, never raw dead gray.

## Typography

**Display & Body Font:** `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, sans-serif`
**Label & Code Font:** `ui-monospace, "SF Mono", Menlo, Consolas, monospace`

**Character:** Balanced, crisp, modern technical sans-serif paired with a high-density tabular monospace font for hostnames, version metrics, and live diagnostic traces.

### Hierarchy
- **Headline** (Semi-bold 650, 16px, line-height 1.25, tracking -0.015em): Extension title and major window headers.
- **Title** (Semi-bold 600, 12.5px–14px, line-height 1.3): Card headings, setting titles, and mode card names.
- **Body** (Regular 450, 12px, line-height 1.45): Descriptive setting text, mode explanations, and documentation.
- **Label / Monospace** (Bold 650, 10.5px–11.5px, uppercase, tracking +0.05em): Status badges, site hostnames, and live diagnostic entries.

### Named Rules
**The Tabular Precision Rule.** All numeric data, versions, and performance indicators use `font-variant-numeric: tabular-nums` to eliminate jitter during dynamic updates.

## Layout

- **Popup Surface:** Fixed 360px viewport width optimized for single-hand scanning in browser toolbars. Vertical stack with 12px rhythm and 14px card padding.
- **Options Surface:** Centered 640px workspace with generous 32px vertical breathing room, structured into logical settings fieldsets.
- **Rhythm:** Spacing follows a 4px modular base scale (`4px`, `8px`, `12px`, `16px`, `24px`). Groups stay tightly coupled; distinct cards maintain generous separation.

## Elevation & Depth

NativeScroll rejects fake drop shadows and fuzzy ambient halos. Depth is articulated through single-layer structural boundaries:
- **Hairline Boundaries:** 1px subtle borders (`var(--border-subtle)`) define card boundaries against the page canvas.
- **Micro Shadow:** `0 1px 2px rgba(0, 0, 0, 0.05)` (light) / `0 1px 3px rgba(0, 0, 0, 0.3)` (dark) anchors cards to the ground.
- **Active State Elevation:** Selected cards apply a 1.5px solid border in primary accent (`#0284c7` / `#38bdf8`) with a matching 12% background tint.

### Named Rules
**The Declare Elevation Once Rule.** Never combine an aggressive border with a wide fuzzy shadow. A card declares elevation through its hairline boundary and ground contrast alone.

## Shapes

- **Containers & Cards:** 12px border radius (`var(--rounded-card)`). Soft, balanced, and ergonomically fitted to modern browser window corners.
- **Interactive Controls & Buttons:** 8px to 10px radius for tactile clickable targets.
- **Pills & Toggles:** 999px fully rounded capsules for status badges, tags, and switch thumbs.

## Components

### Extension Brand Mark & Icons
- Sized at 16x16, 32x32, 48x48, 128x128.
- Motif: Dual opposing vertical kinetic chevrons along a calibrated central rail track.
- Active state: Vibrant sky/cobalt gradient with precision center dot.
- Disabled state: Monochromatic slate squircle with lowered contrast.

### Card-Based Site Mode Selector
- Grouped inside a semantic `role="radiogroup"` (`#site-mode-cards`).
- Three-column layout: Mode icon (22x22 SVG container), content body (title, role badge, description), and visual radio ring.
- Selected state activates primary border, background tint, highlighted icon, and filled radio dot.

### Accessible Custom Switch
- Built around standard `<input type="checkbox" role="switch">`.
- Smooth 140ms ease-out quint sliding thumb with high-contrast active state and full keyboard accessibility.

### Diagnostics Inspector
- `<details id="diagnostics-panel" class="card diag-card">` with custom rotating chevron.
- Terminal-inspired monospace key-value listing with high-legibility status indicators.

### Exclusions Manager
- Form with instant client validation, hostname sanitization, and individual host chips with styled removal buttons.

## Do's and Don'ts

### Do:
- **Do** maintain strict WCAG AAA / AA contrast ratios across all text and background variations.
- **Do** use authored vector SVG icons instead of emojis or unicode glyphs.
- **Do** preserve all semantic HTML attributes (`role="switch"`, `role="radio"`, `aria-checked`, `aria-live`).
- **Do** use exact-host matching when presenting or editing excluded websites.
- **Do** test both light and dark color schemes before shipping.

### Don't:
- **Don't** use gradient text or decorative background blur filters.
- **Don't** use colored left/right borders on cards as accent decorations.
- **Don't** introduce external network calls, fonts, or tracking scripts into extension pages.
- **Don't** alter scroll behavior on browser internal pages (`chrome://`, `about:`, `chrome-extension://`).
