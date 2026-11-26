# Wheel-Event Latency & Safe Intervention Rules

> **Issue:** #9 — `[Compatibility] Research wheel-event latency and define safe intervention rules`  
> **Scope:** Technical feasibility analysis for NativeScroll's `Native`, `Compatibility`, and `Strict` operating modes.

## 1. Input Latency vs. Aesthetic Animation Duration

NativeScroll explicitly separates two distinct phenomena that users often describe as "sluggish" or "floaty" scrolling:

| Phenomenon | Mechanism | Primary Metric | Safe Default Fix |
|---|---|---|---|
| **Aesthetic smooth animation** | CSS `scroll-behavior: smooth`, explicit `scrollTo({ behavior: 'smooth' })`, or JS lerp/RAF easing loops | **Animation completion time (ms)** | Neutralized safely in **Native** mode (CSS + JS APIs) or **Compatibility** mode (verified library adapters) |
| **Input-to-first-frame latency** | Non-passive (`{ passive: false }`) `wheel` / `mousewheel` listeners forcing Chromium's compositor thread to wait for the main thread before scrolling | **Input-to-first-visible-scroll (ms)** & **wheel-handler main-thread overhead (ms)** | Cannot be universally eliminated without breaking legitimate `preventDefault()` widgets; only bounded, opt-in intervention in **Strict** mode |

## 2. Chromium Wheel Event Routing & Passive Listeners

Per the [WHATWG DOM Living Standard](https://dom.spec.whatwg.org/#observing-event-listeners) and [Chromium Blink/cc compositor scrolling design](https://developer.chrome.com/docs/lighthouse/best-practices/uses-passive-event-listeners):

1. **Compositor fast path:** When a user scrolls a region with **no** non-passive `wheel` / `mousewheel` listeners covering that hit-test region, Chromium's compositor thread (`cc`) scrolls immediately without waiting for JavaScript on the main thread.
2. **Main-thread blocking path:** If a page registers a non-passive `wheel` listener (e.g., `window.addEventListener('wheel', fn, { passive: false })`), Chromium must dispatch the event to the main thread and wait to see whether `event.preventDefault()` is called before committing the native scroll.
3. **Document-level default:** Since Chrome 73, `wheel` and `mousewheel` listeners on `window`, `document`, `document.documentElement`, and `document.body` default to `{ passive: true }` unless the site explicitly passes `{ passive: false }`. Sites that hijack scrolling therefore **explicitly** opt into `{ passive: false }`.

## 3. Why Universal Mouse-Wheel vs. Trackpad Detection Is Unreliable

NativeScroll **does not** promise universal hardware detection between physical mouse wheels and trackpads:

- `WheelEvent.deltaMode` (`DOM_DELTA_PIXEL` vs `DOM_DELTA_LINE`) is browser- and OS-dependent; macOS and Chrome on Windows Precision Touchpads both emit `DOM_DELTA_PIXEL` for many mice and trackpads alike.
- `deltaY` magnitude heuristics (e.g., `Math.abs(deltaY) === 100` or `120`) fail on Logitech/Razer smooth-scroll mouse drivers, macOS mouse acceleration, and fast trackpad flicks.
- Event cadence heuristics introduce buffering latency (defeating the goal of immediate native scrolling) and still misclassify free-spinning mouse wheels.

**Conclusion:** Interventions must be based on **event target, modifier keys, axis, and verified library contracts**—never fragile hardware-guessing heuristics.

## 4. Interactive Widget Risk Matrix

| Scenario | Why Site Calls `preventDefault()` | Risk of Global Passive/Cancel Override | NativeScroll Rule |
|---|---|---|---|
| **Interactive Maps** (Leaflet, Mapbox GL, Google Maps) | Wheel zooms map instead of scrolling page | **High** — breaks map zoom and scrolls page instead | **Never override** (`canvas`, `.leaflet-container`, `.mapboxgl-canvas`, `.gm-style`) |
| **Code & Rich-Text Editors** (Monaco, CodeMirror, `textarea`, `[contenteditable]`) | Custom virtualized viewport scrolling | **High** — breaks editor scrolling or cursor sync | **Never override** |
| **Canvas / WebGL / `[role="application"]`** | 3D camera zoom, CAD pan/zoom | **High** — breaks app controls | **Never override** |
| **Nested Scroll Containers** | Inner `overflow: auto/scroll` panes | **Medium** — must scroll inner pane first | **Preserve**; never intercept wheel targeting nested scrollables |
| **Horizontal Gestures** (`deltaX` dominant / `Shift+wheel`) | Horizontal tracks, timelines, tables | **Medium** — breaks horizontal panning | **Preserve** whenever `Math.abs(deltaX) > Math.abs(deltaY)` or `shiftKey` |
| **Pinch / `Ctrl+wheel` Zoom** | Browser or app zoom (`event.ctrlKey === true`) | **High** — breaks accessibility zoom | **Never override** when `event.ctrlKey` is true |
| **Carousels / Horizontal Galleries** | Intentional wheel-to-slide mapping | **Medium** — Strict mode may bypass wheel-driven slide changes | Preserved in **Native** & **Compatibility**; documented tradeoff in **Strict** |
| **Root Smooth-Scroll Hijackers** (e.g., Lenis, custom lerp on `window`) | Hijacks vertical document wheel to run RAF easing | **Low** when neutralized via verified adapter or bounded Strict guard | Neutralized via verified adapter in **Compatibility**, or opt-in guard in **Strict** |

## 5. Zero-Polling Observable Signals

NativeScroll avoids `setInterval`, continuous `requestAnimationFrame`, and perpetual full-DOM `MutationObserver` scans. Observable signals are strictly event-driven:

1. **Early `addEventListener` registration observation (`document_start` in MAIN world):** O(1) check when a site registers `'wheel'` or `'mousewheel'` with `{ passive: false }` on root targets (`window`, `document`, `documentElement`, `body`).
2. **Lifecycle DOM checks (`DOMContentLoaded` and `load`):** Single-pass inspection of `document.documentElement.classList` and known container selectors (`html.lenis`, `html.has-scroll-smooth`, `window.ScrollSmoother?.get?.()`).
3. **On-demand diagnostics:** Computed only when the user opens the popup or toggles settings.

## 6. Safe Intervention Rules by Operating Mode

- **Native (Default):** CSS `scroll-behavior: auto !important` + explicit JS smooth-scroll API rewriting (`scrollTo`, `scrollBy`, `scrollIntoView`) ONLY. Zero wheel-listener modification.
- **Compatibility:** `Native` + verified library adapters (Issues #11–#14) using documented public APIs or reversible library opt-out attributes.
- **Strict (Opt-in Experimental):** `Compatibility` + bounded root-level non-passive wheel guard (preserving `ctrlKey`, horizontal deltas, nested scrollables, and interactive widgets) + reversible `scroll-snap-type: none !important`. Displays explicit tradeoff warnings and supports immediate disable.
